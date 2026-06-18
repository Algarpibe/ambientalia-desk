import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Queryable } from '../db/migrate'

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema-crm.sql')

/** Crea el esquema crm.* (idempotente). Solo lo invoca el worker hub-sync. */
export async function migrateCrm(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    try { await db.query(stmt) }
    catch (e) { console.error('migrateCrm: sentencia omitida:', stmt.slice(0, 60), '→', String(e)) }
  }
}
