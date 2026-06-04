import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

/** Aplica el esquema (idempotente). Divide por `;` para compatibilidad con pg-mem. */
export async function migrate(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
  for (const stmt of statements) await db.query(stmt)
}

/** Re-siembra la secuencia de numeración al máximo `number` existente. */
export async function reseedTicketNumber(db: Queryable): Promise<void> {
  await db.query("SELECT setval('ticket_number_seq', (SELECT COALESCE(MAX(number),0) FROM tickets))")
}
