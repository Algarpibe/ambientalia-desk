import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { upsertRow, maxModifiedTime } from './repo'
import { byTable } from './modules'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateCrm(db) })

describe('crm repo', () => {
  it('upsertRow inserta y luego actualiza (no duplica) por id', async () => {
    const m = byTable('deals')
    await upsertRow(db, 'deals', m.toRow({ id: 'd1', Deal_Name: 'A', Stage: 'Open', Modified_Time: '2026-06-01T00:00:00Z' }))
    await upsertRow(db, 'deals', m.toRow({ id: 'd1', Deal_Name: 'A', Stage: 'Won', Modified_Time: '2026-06-02T00:00:00Z' }))
    const r = await db.query("SELECT stage FROM crm.deals WHERE id='d1'")
    expect(r.rows.length).toBe(1); expect(r.rows[0].stage).toBe('Won')
  })
  it('maxModifiedTime devuelve la marca de agua', async () => {
    const m = byTable('leads')
    await upsertRow(db, 'leads', m.toRow({ id: 'a', Modified_Time: '2026-01-01T00:00:00Z' }))
    await upsertRow(db, 'leads', m.toRow({ id: 'b', Modified_Time: '2026-03-01T00:00:00Z' }))
    expect(new Date((await maxModifiedTime(db, 'leads'))!).getTime()).toBe(new Date('2026-03-01T00:00:00Z').getTime())
  })
})
