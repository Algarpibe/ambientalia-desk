import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('backfillArchivedTickets', () => {
  it('pagina /tickets/archivedTickets y persiste', async () => {
    const t = { id: 'arch1', ticketNumber: '264', subject: 'Viejo', status: 'Finalizado', statusType: 'Closed', customFields: {} }
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [t] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    const n = await sync.backfillArchivedTickets()
    expect(n).toBe(1)
    expect((await db.query("SELECT count(*)::int AS c FROM tickets WHERE id='arch1'")).rows[0].c).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/archivedTickets')
  })
})
