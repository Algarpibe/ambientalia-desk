import type { Queryable } from '../db/migrate'
import { byTable } from './modules'

/** Upsert genérico en crm.<table> desde un row {col: valor}. `table` se valida contra MODULES (no es input de usuario). */
export async function upsertRow(db: Queryable, table: string, row: Record<string, unknown>): Promise<void> {
  byTable(table) // valida el nombre de tabla (lanza si desconocido)
  const cols = Object.keys(row)
  const placeholders = cols.map((_, i) => `$${i + 1}`)
  const updates = cols.filter((c) => c !== 'id').map((c) => `${c}=EXCLUDED.${c}`)
  const sql = `INSERT INTO crm.${table} (${cols.join(',')},synced_at) VALUES (${placeholders.join(',')},now())
     ON CONFLICT (id) DO UPDATE SET ${updates.join(',')},synced_at=now()`
  await db.query(sql, cols.map((c) => row[c]))
}

export async function maxModifiedTime(db: Queryable, table: string): Promise<string | null> {
  byTable(table)
  const r = await db.query(`SELECT MAX(modified_time) AS m FROM crm.${table}`)
  return r.rows[0]?.m ?? null
}

/** Reemplaza TODAS las líneas de un quote (DELETE por quote_id + insert de cada fila). Cada `row` = {col: valor}. */
export async function replaceQuoteLines(db: Queryable, quoteId: string, rows: Record<string, unknown>[]): Promise<void> {
  await db.query('DELETE FROM crm.quote_line_items WHERE quote_id=$1', [quoteId])
  for (const row of rows) {
    const cols = Object.keys(row)
    const placeholders = cols.map((_, i) => `$${i + 1}`)
    await db.query(
      `INSERT INTO crm.quote_line_items (${cols.join(',')},synced_at) VALUES (${placeholders.join(',')},now())`,
      cols.map((c) => row[c]),
    )
  }
}
