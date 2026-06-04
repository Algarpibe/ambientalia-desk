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
  // Tolerante por sentencia: el esquema es idempotente (CREATE IF NOT EXISTS). Si una sentencia
  // falla (p.ej. un índice sobre una columna que aún no existe en un esquema viejo, antes del
  // recreate one-time), se loguea y se continúa en vez de tumbar el arranque.
  for (const stmt of statements) {
    try {
      await db.query(stmt)
    } catch (e) {
      console.error('migrate: sentencia omitida:', stmt.slice(0, 60), '→', String(e))
    }
  }
}

/** Re-siembra la secuencia de numeración al máximo `number` existente. */
export async function reseedTicketNumber(db: Queryable): Promise<void> {
  await db.query("SELECT setval('ticket_number_seq', (SELECT COALESCE(MAX(number),0) FROM tickets))")
}
