import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Queryable } from '../db/migrate'

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema-books.sql')

/** Crea el esquema books.* (idempotente). Solo lo invoca el worker hub-sync, nunca Desk. */
export async function migrateBooks(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
  for (const stmt of statements) {
    try { await db.query(stmt) }
    catch (e) { console.error('migrateBooks: sentencia omitida:', stmt.slice(0, 60), '→', String(e)) }
  }
}
