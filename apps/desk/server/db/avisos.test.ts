import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearAviso, listarAvisos, marcarLeidos, marcarEnviados, destinatariosDeArea, destinatariosDeCargo } from './avisos'
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

  // `enviado_at` es lo que convierte esta tabla en la cola que su propio comentario dice que es: lo
  // que sigue en NULL es lo que no salió, y mañana es la lista de reintento.
  it('marca los avisos como enviados sin tocar los demás', async () => {
    const a = await crearAviso(db, { userId: 'u-1', ticketId: 't1', texto: 'A' })
    const b = await crearAviso(db, { userId: 'u-1', ticketId: 't1', texto: 'B' })

    await marcarEnviados(db, [a])

    const enviados = await db.query('SELECT id FROM avisos WHERE enviado_at IS NOT NULL')
    expect((enviados.rows as Array<{ id: string }>).map((r) => r.id)).toEqual([a])
    const pendientes = await db.query('SELECT id FROM avisos WHERE enviado_at IS NULL')
    expect((pendientes.rows as Array<{ id: string }>).map((r) => r.id)).toEqual([b])
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

/**
 * alarmas-horas-habiles (F1B-08, lote 2) · RQ-AV-15: a quién va la alarma de SLA vencido.
 *
 * Exactamente los usuarios ACTIVOS cuyo `users.cargo` es el cargo de la alarma, comparado sin
 * mayúsculas ni espacios en los extremos: el campo es texto libre (se escribe para firmar la remisión,
 * `auth/routes.ts:67-68`). A diferencia de `destinatariosDeArea`, los administradores NO entran de
 * oficio. Si no hay nadie, `[]`: el respaldo al área lo decide el servicio (S-4), no esta consulta.
 */
describe('destinatariosDeCargo', () => {
  const alta = (email: string, cargo: string | null, extra: { isAdmin?: boolean } = {}) =>
    createUser(db, { email, name: email, passwordHash: 'x', cargo, ...extra })

  it('devuelve sólo los activos con ese cargo, sin mayúsculas ni espacios de más', async () => {
    const a = await alta('a@x.co', 'Coordinador Comercial')
    const b = await alta('b@x.co', '  coordinador COMERCIAL ')
    const inactivo = await alta('c@x.co', 'Coordinador Comercial')
    await updateUser(db, inactivo.id, { active: false })
    await alta('d@x.co', 'Director Técnico')
    await alta('admin@x.co', null, { isAdmin: true })
    const ids = (await destinatariosDeCargo(db, 'Coordinador Comercial')).map((u) => u.id).sort()
    expect(ids).toEqual([a.id, b.id].sort())
  })

  it('un cargo que nadie tiene devuelve una lista vacía, sin administradores de oficio', async () => {
    await alta('admin@x.co', null, { isAdmin: true })
    await alta('e@x.co', 'Coord. Comercial')
    expect(await destinatariosDeCargo(db, 'Coordinador Comercial')).toEqual([])
  })

  it('devuelve id, correo y nombre, lo mismo que destinatariosDeArea', async () => {
    const a = await alta('f@x.co', 'Coordinador Comercial')
    expect(await destinatariosDeCargo(db, 'Coordinador Comercial')).toEqual([{ id: a.id, email: 'f@x.co', name: 'f@x.co' }])
  })
})
