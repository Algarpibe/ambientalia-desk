import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/** Algo con `query` (pg Pool/Client o adaptador pg-mem). */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

/** Aplica el esquema (idempotente). */
export async function migrate(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  await db.query(sql)
}
