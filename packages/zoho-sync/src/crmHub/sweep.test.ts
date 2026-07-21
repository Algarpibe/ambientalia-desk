import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { createCrmSync } from './sync'
import type { AppConfig } from '../config'

const config = {} as AppConfig
const guard = { maxRows: 200, maxPct: 0.9 }
const emptyPage = new Response(JSON.stringify({ data: [], info: { more_records: false } }), { status: 200 })

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await migrateCrm(db)
  // Réplica con A, B, C (C ya no existe en Zoho).
  for (const id of ['A', 'B', 'C']) await db.query('INSERT INTO crm.deals (id) VALUES ($1)', [id])
})

describe('crm sweep', () => {
  it('borra el huérfano confirmado ausente (204); deja los vivos', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Deals/C')) return Promise.resolve(new Response(null, { status: 204 })) // verify: ausente (undici exige body null en 204)
      if (path.startsWith('/Deals')) return Promise.resolve(new Response(JSON.stringify({ data: [{ id: 'A' }, { id: 'B' }], info: { more_records: false } }), { status: 200 })) // list: C ausente
      return Promise.resolve(emptyPage)
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    const reports = await sync.sweep({ dryRun: false, guard })
    const deals = reports.find((r) => r.table === 'crm.deals')!
    expect(deals).toMatchObject({ live: 2, replica: 3, orphans: 1, confirmed: 1, liveGaps: 0, deleted: 1, dryRun: false })
    expect((await db.query('SELECT id FROM crm.deals ORDER BY 1')).rows.map((r: any) => r.id)).toEqual(['A', 'B'])
  })

  it('candidato que la re-verificación dice VIVO (200 con data) → NO se borra (liveGaps)', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Deals/C')) return Promise.resolve(new Response(JSON.stringify({ data: [{ id: 'C' }] }), { status: 200 })) // verify: sigue vivo
      if (path.startsWith('/Deals')) return Promise.resolve(new Response(JSON.stringify({ data: [{ id: 'A' }, { id: 'B' }], info: { more_records: false } }), { status: 200 }))
      return Promise.resolve(emptyPage)
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    const reports = await sync.sweep({ dryRun: false, guard })
    const deals = reports.find((r) => r.table === 'crm.deals')!
    expect(deals).toMatchObject({ orphans: 1, confirmed: 0, liveGaps: 1, deleted: 0 })
    expect((await db.query('SELECT count(*)::int AS c FROM crm.deals')).rows[0].c).toBe(3) // C sigue ahí
  })

  it('una página del list que falla → entidad abortada (skipped), no borra', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Deals')) return Promise.resolve(new Response('boom', { status: 500 })) // list falla
      return Promise.resolve(emptyPage)
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    const reports = await sync.sweep({ dryRun: false, guard })
    const deals = reports.find((r) => r.table === 'crm.deals')!
    expect(deals.skipped).toBeTruthy()
    expect(deals.deleted).toBe(0)
    expect((await db.query('SELECT count(*)::int AS c FROM crm.deals')).rows[0].c).toBe(3)
  })
})
