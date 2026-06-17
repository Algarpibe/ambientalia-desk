import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('syncTicketHistory', () => {
  it('pagina y hace upsert del historial de Zoho', async () => {
    const ev = { eventName: 'CommentAdded', eventTime: '2026-06-04T10:00:00Z', actor: { name: 'Ana', type: 'Agent' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] }
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [ev] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    await sync.syncTicketHistory('t1')
    const n = (await db.query("SELECT count(*)::int AS c FROM ticket_history WHERE ticket_id='t1'")).rows[0]
    expect(n.c).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/t1/History')
  })
})
