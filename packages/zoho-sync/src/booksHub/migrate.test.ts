import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateBooks } from './migrate'

async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg()
  const db = new pg.Pool()
  await migrate(db)
  await migrateBooks(db)
  return db
}

describe('migrateBooks', () => {
  it('crea las 6 tablas del esquema books', async () => {
    const db = await freshDb()
    // pg-mem no expone information_schema.tables con table_schema fiable para esquemas
    // no-public, pero sí resuelve las tablas calificadas books.*; consultarlas directamente
    // prueba que existen dentro del esquema books (fallaría si no estuvieran ahí).
    for (const t of ['contacts', 'items', 'sales_orders', 'salesorder_line_items', 'invoices', 'invoice_line_items']) {
      const r = await db.query(`SELECT count(*) AS n FROM books.${t}`)
      expect(Number(r.rows[0].n)).toBe(0)
    }
  })
})
