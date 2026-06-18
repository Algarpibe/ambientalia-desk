import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'

async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg(); const db = new pg.Pool(); await migrate(db); await migrateCrm(db); return db
}

describe('migrateCrm', () => {
  it('crea las 8 tablas del esquema crm', async () => {
    const db = await freshDb()
    for (const t of ['leads', 'deals', 'tasks', 'events', 'calls', 'products', 'quotes', 'campaigns']) {
      expect((await db.query(`SELECT count(*)::int AS n FROM crm.${t}`)).rows[0].n).toBe(0)
    }
  })
})
