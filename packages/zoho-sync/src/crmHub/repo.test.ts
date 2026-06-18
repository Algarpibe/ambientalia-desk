import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { upsertRow, maxModifiedTime, replaceQuoteLines } from './repo'
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

describe('crm repo - quote lines', () => {
  it('replaceQuoteLines borra previas y deja solo las nuevas', async () => {
    await replaceQuoteLines(db, 'q1', [
      { id: 'l1', quote_id: 'q1', product_name: 'A', quantity: 2, net_total: 20, raw: '{}' },
      { id: 'l2', quote_id: 'q1', product_name: 'B', quantity: 1, net_total: 10, raw: '{}' },
    ])
    await replaceQuoteLines(db, 'q1', [{ id: 'l3', quote_id: 'q1', product_name: 'C', quantity: 1, net_total: 5, raw: '{}' }])
    const r = await db.query("SELECT id FROM crm.quote_line_items WHERE quote_id='q1' ORDER BY id")
    expect(r.rows.map((x: any) => x.id)).toEqual(['l3'])
  })
})
