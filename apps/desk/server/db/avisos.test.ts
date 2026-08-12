import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearAviso, listarAvisos, marcarLeidos } from './avisos'

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
