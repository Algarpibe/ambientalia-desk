import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

function task(id: string, ticketId: string, modifiedTime: string) {
  return { id, ticketId, subject: `T-${id}`, status: 'In Progress', statusType: 'Open', priority: 'High', dueDate: '2026-03-24T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', modifiedTime, assignee: { firstName: 'Ana', lastName: 'P' } }
}

describe('syncActivities', () => {
  it('pagina, hace upsert y devuelve el total', async () => {
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [task('1', 't1', '2026-05-02T00:00:00Z'), task('2', 't1', '2026-05-01T00:00:00Z')] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    const n = await sync.syncActivities()
    expect(n).toBe(2)
    const rows = (await db.query("SELECT id, ticket_id, owner_name FROM activities ORDER BY id")).rows
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ id: '1', ticket_id: 't1', owner_name: 'Ana P' })
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tasks?')
  })
})
