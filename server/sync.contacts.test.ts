import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('syncContacts', () => {
  it('pagina y hace upsert de los contactos de Zoho', async () => {
    const c = { id: 'c1', firstName: 'Ana', lastName: 'P', email: 'a@b.co', modifiedTime: '2026-05-02T00:00:00Z' }
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [c] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    const n = await sync.syncContacts()
    expect(n).toBe(1)
    expect((await db.query("SELECT count(*)::int AS c FROM contacts WHERE id='c1'")).rows[0].c).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/contacts')
  })
})
