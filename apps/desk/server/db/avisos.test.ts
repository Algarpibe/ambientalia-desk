import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearAviso, listarAvisos, marcarLeidos, destinatariosDeArea } from './avisos'
import { createRole, updateRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser, updateUser } from '../auth/users'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('avisos', () => {
  it('un aviso solo lo ve su destinatario', async () => {
    await crearAviso(db, { userId: 'u-1', ticketId: 't1', texto: 'Para uno' })
    await crearAviso(db, { userId: 'u-2', ticketId: 't1', texto: 'Para dos' })

    expect((await listarAvisos(db, 'u-1')).map((a) => a.texto)).toEqual(['Para uno'])
    expect((await listarAvisos(db, 'u-2')).map((a) => a.texto)).toEqual(['Para dos'])
  })

  // Los no leídos primero: la campana existe para lo que falta por mirar, no para el archivo.
  it('ordena los no leídos delante de los leídos', async () => {
    const viejo = await crearAviso(db, { userId: 'u-1', ticketId: 't1', texto: 'Ya visto' })
    await crearAviso(db, { userId: 'u-1', ticketId: 't2', texto: 'Nuevo' })
    await marcarLeidos(db, 'u-1', [viejo])

    expect((await listarAvisos(db, 'u-1')).map((a) => a.texto)).toEqual(['Nuevo', 'Ya visto'])
  })

  it('cuenta los no leídos, que es lo que enseña la campana', async () => {
    const a = await crearAviso(db, { userId: 'u-1', ticketId: 't1', texto: 'Uno' })
    await crearAviso(db, { userId: 'u-1', ticketId: 't2', texto: 'Dos' })
    expect((await listarAvisos(db, 'u-1')).filter((x) => !x.leido).length).toBe(2)

    await marcarLeidos(db, 'u-1', [a])
    expect((await listarAvisos(db, 'u-1')).filter((x) => !x.leido).length).toBe(1)
  })

  /**
   * Marcar por id sin comprobar el dueño dejaría que cualquiera con sesión vaciara la campana de
   * otro mandando ids a mano. El id va acompañado SIEMPRE del usuario.
   */
  it('no se pueden marcar como leídos los avisos de otra persona', async () => {
    const ajeno = await crearAviso(db, { userId: 'u-2', ticketId: 't1', texto: 'De otro' })

    await marcarLeidos(db, 'u-1', [ajeno])

    expect((await listarAvisos(db, 'u-2'))[0].leido).toBe(false)
  })
})

describe('destinatariosDeArea', () => {
  // El coordinador del área y TODOS los administradores activos, sin repetir a nadie y sin el actor.
  it('devuelve el rol receptor del área más los administradores activos', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const otro = await createRole(db, { name: 'Asistente Comercial', areas: ['Comercial'] })

    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    await createUser(db, { email: 'beto@x.co', name: 'Beto', passwordHash: 'h', roleId: otro.id })
    const admin = await createUser(db, { email: 'admin@x.co', name: 'Admin', passwordHash: 'h', isAdmin: true })

    const ids = (await destinatariosDeArea(db, 'Comercial', '')).map((d) => d.id).sort()
    expect(ids).toEqual([admin.id, ana.id].sort())
  })

  it('no incluye al actor, aunque le tocara por rol', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    expect(await destinatariosDeArea(db, 'Comercial', ana.id)).toEqual([])
  })

  it('ignora a los inactivos y a los de un rol desactivado', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    await updateUser(db, ana.id, { active: false })
    expect(await destinatariosDeArea(db, 'Comercial', '')).toEqual([])

    await updateUser(db, ana.id, { active: true })
    await updateRole(db, coord.id, { active: false })
    expect(await destinatariosDeArea(db, 'Comercial', '')).toEqual([])
  })

  // El rol receptor de OTRA área no recibe los avisos de esta.
  it('no avisa al receptor de un área distinta', async () => {
    const tec = await createRole(db, { name: 'Coordinador Técnico', areas: ['Servicio Técnico'] })
    await actualizarRecibeAvisos(db, tec.id, true)
    await createUser(db, { email: 'tec@x.co', name: 'Tec', passwordHash: 'h', roleId: tec.id })
    expect(await destinatariosDeArea(db, 'Comercial', '')).toEqual([])
  })
})
