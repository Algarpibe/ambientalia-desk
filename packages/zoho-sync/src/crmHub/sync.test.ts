import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { createCrmSync } from './sync'
import type { AppConfig } from '../config'

const config = {} as AppConfig
const page = (data: unknown[], more = false, token: string | null = null) =>
  new Response(JSON.stringify({ data, info: { more_records: more, next_page_token: token } }), { status: 200 })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateCrm(db) })

describe('crm sync', () => {
  it('backfill paginando por next_page_token persiste todos', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (!path.startsWith('/Deals')) return Promise.resolve(page([])) // otros módulos vacíos
      if (path.includes('page_token=t2')) return Promise.resolve(page([{ id: 'd2', Deal_Name: 'B', Modified_Time: '2026-06-02T00:00:00Z' }], false))
      return Promise.resolve(page([{ id: 'd1', Deal_Name: 'A', Modified_Time: '2026-06-01T00:00:00Z' }], true, 't2'))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    await sync.backfillAll()
    expect((await db.query('SELECT count(*)::int n FROM crm.deals')).rows[0].n).toBe(2)
  })

  it('un módulo que falla no aborta los demás (resiliencia)', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Deals')) return Promise.resolve(new Response('boom', { status: 500 }))
      if (path.startsWith('/Leads')) return Promise.resolve(page([{ id: 'l1', Full_Name: 'X', Modified_Time: '2026-06-01T00:00:00Z' }], false))
      return Promise.resolve(page([]))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    await expect(sync.syncRecent()).resolves.toBeDefined()
    expect((await db.query('SELECT count(*)::int n FROM crm.leads')).rows[0].n).toBe(1)
  })

  it('incremental solo trae lo más nuevo que la marca de agua', async () => {
    await db.query("INSERT INTO crm.deals (id, modified_time) VALUES ('old','2024-01-01T00:00:00Z')")
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Deals')) return Promise.resolve(page([
        { id: 'new', Deal_Name: 'N', Modified_Time: '2024-06-01T00:00:00Z' },
        { id: 'old', Deal_Name: 'O', Modified_Time: '2024-01-01T00:00:00Z' },
      ], false))
      return Promise.resolve(page([]))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    const r = await sync.syncRecent()
    expect(r.deals).toBe(1)
    expect((await db.query("SELECT 1 FROM crm.deals WHERE id='new'")).rows.length).toBe(1)
  })
})
