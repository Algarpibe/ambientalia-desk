import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate } from './migrate'

describe('migrate', () => {
  it('crea las tablas tickets y conversations', async () => {
    const db = newDb()
    const pg = db.adapters.createPg()
    const pool = new pg.Pool()
    await migrate(pool)
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
    )
    const names = res.rows.map((r: { table_name: string }) => r.table_name)
    expect(names).toContain('tickets')
    expect(names).toContain('conversations')
  })
})
