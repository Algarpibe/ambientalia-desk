import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

const config = { departmentId: 'D1' } as AppConfig

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

let numero = 0
/** Un ticket de Zoho con su `modified_time` y, si se da, la marca de la última historia traída. */
const ticket = (id: string, modificado: string | null, sincronizado: string | null = null) =>
  db.query(
    'INSERT INTO tickets (id, number, subject, status, modified_time, history_synced_at) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, ++numero, 'A', 'Finalizado', modificado ? new Date(modificado) : null, sincronizado ? new Date(sincronizado) : null],
  )

const marca = async (id: string): Promise<Date | null> =>
  (await db.query('SELECT history_synced_at FROM tickets WHERE id = $1', [id])).rows[0].history_synced_at

describe('esquema · history_synced_at', () => {
  it('tickets tiene la columna y nace nula', async () => {
    await ticket('900', '2026-01-01T10:00:00Z')
    expect(await marca('900')).toBeNull()
  })

  /**
   * `history_synced_at` no está en `TICKET_COLS`, así que el sync de tickets no la toca. Si la
   * pisara, cada `syncRecent` devolvería a la cola los tickets que acaba de actualizar.
   */
  it('el sync de un ticket desde Zoho no borra la marca', async () => {
    await ticket('100', '2026-01-04T16:00:00Z', '2026-01-04T16:00:00Z')
    const zohoFetch = vi.fn().mockImplementation(async (url: string) =>
      url.startsWith('/tickets/100?')
        ? new Response(JSON.stringify({ id: '100', ticketNumber: '1', subject: 'A', status: 'Finalizado', modifiedTime: '2026-01-04T16:00:00Z' }), { status: 200 })
        : new Response('{}', { status: 404 }))
    const sync = createSync({ zohoFetch, db, config })

    await sync.syncTicket('100')

    expect((await marca('100'))?.toISOString()).toBe('2026-01-04T16:00:00.000Z')
  })
})
