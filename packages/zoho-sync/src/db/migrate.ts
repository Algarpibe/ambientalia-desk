import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

/**
 * Sentencias del esquema, en orden. Divide por `;` para compatibilidad con pg-mem.
 *
 * Expuesta para poder ejercitar UNA sentencia en un test sin reaplicar el fichero entero: `migrate`
 * es tolerante por sentencia, así que un backfill que dejara de ser válido se saltaría con un
 * `console.error` y nadie se enteraría; y volver a llamar a `migrate` no sirve de comprobación
 * porque pg-mem no soporta re-crear una tabla que ya existe, ni con `IF NOT EXISTS`.
 */
export function schemaStatements(): string[] {
  return readFileSync(schemaPath, 'utf8').split(';').map((s) => s.trim()).filter(Boolean)
}

/** Aplica el esquema (idempotente). */
export async function migrate(db: Queryable): Promise<void> {
  const statements = schemaStatements()
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

/**
 * Base del espacio de numeración de tickets creados por la app, separado del de Zoho (bug #954:
 * compartir espacio hacía que Zoho alcanzara la numeración de la app y chocara con UNIQUE(number)).
 * Zoho va por ~#1.000, así que quedan ~9.000 tickets de margen antes de que vuelvan a tocarse.
 */
export const APP_TICKET_NUMBER_BASE = 10_000

/** Re-siembra la secuencia de la app: solo mira tickets de la app, con piso en la base (nunca arrastra a Zoho). */
export async function reseedTicketNumber(db: Queryable): Promise<void> {
  const r = await db.query('SELECT COALESCE(MAX(number),0) AS m FROM tickets WHERE managed_by_app = true')
  const next = Math.max(Number(r.rows[0].m), APP_TICKET_NUMBER_BASE - 1) // setval = "último usado"; siguiente nextval = +1
  await db.query(`SELECT setval('ticket_number_seq', $1)`, [next])
}

/**
 * TODA tabla de `schema.sql` está en UNA de estas tres listas, y el guardián de `migrate.test.ts` lo
 * comprueba en esa dirección: una tabla nueva rompe el test hasta que alguien la clasifique. Al
 * revés —«las declaradas existen»— sería trivialmente verde y no cazaría nada, que es justo lo que
 * faltó cuando `catalogo_articulos` aterrizó en el esquema equivocado por un `CREATE` sin calificar.
 *
 * Lo que separa las tres es DÓNDE aterriza cada tabla, y no es cosmético: en producción la app
 * conecta con `search_path=desk,public`, así que un `CREATE` sin calificar cae en `desk`.
 */

/** Tablas del dominio Zoho Desk que se mueven a desk.* (Fase 1). App-native y Books-lite NO se mueven. */
export const DESK_TABLES = ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments',
  'ticket_transitions', 'ticket_history', 'activities', 'equipos']

/**
 * Tablas propias de la app y del catálogo: se quedan en `public` y por eso van CALIFICADAS en el
 * esquema. No son de Zoho Desk, así que `reorgToDesk` no las toca.
 */
export const PUBLIC_TABLES = ['ticket_reads', 'users', 'sessions', 'roles', 'avisos',
  'resolution_attachments', 'remision_checklist', 'remisiones', 'remision_fotos',
  'catalogo_tipos', 'catalogo_marcas', 'catalogo_modelos', 'catalogo_documentos',
  'catalogo_articulos', 'catalogo_modelo_categorias', 'catalogo_articulos_ocultos', 'calendario_cierres', 'equipos_cambios']

/**
 * Tablas del esquema `books`: llegan REPLICADAS desde el hub y nadie en `apps/desk` las escribe. Van
 * aparte de `PUBLIC_TABLES` porque no están en `public`, y meterlas ahí sería escribir en el
 * guardián la misma clase de error de esquema que el guardián existe para cazar.
 */
export const BOOKS_TABLES = ['contacts', 'sales_orders', 'items']

/**
 * Blindaje de intención, hallazgo de la revisión adversaria de F1B-01 (P3): `contacts` es el ÚNICO
 * nombre pelado que existe en más de una lista de arriba (`DESK_TABLES` y `BOOKS_TABLES`), así que una
 * `ALTER TABLE contacts` sin calificar escrita para Books resuelve HOY, por `search_path`, contra
 * `desk.contacts` — y ningún guardián estático puede leer la intención de sus columnas.
 *
 * No hay bug vivo (`pool.ts:5` nunca mete `books` en el `search_path`, así que esa `ALTER` no puede
 * aterrizar de verdad en `books.contacts`); esto impide que una `ALTER TABLE contacts` NUEVA entre sin
 * que nadie decida a qué esquema pertenece.
 */
export function nombresAmbiguos(): string[] {
  const conteo = new Map<string, number>()
  for (const t of [...DESK_TABLES, ...BOOKS_TABLES]) conteo.set(t, (conteo.get(t) ?? 0) + 1)
  return [...conteo.entries()].filter(([, n]) => n > 1).map(([t]) => t)
}

/**
 * Las `ALTER TABLE` SIN calificar cuyo nombre pelado es ambiguo (hoy sólo `contacts`), normalizadas
 * (recortadas). Puro y sin llamador en tiempo de ejecución: sólo lo usan sus propias pruebas.
 */
export function altersAmbiguas(statements: string[]): string[] {
  const ambiguos = new Set(nombresAmbiguos())
  const resultado: string[] = []
  for (const stmt of statements) {
    const sql = stmt.replace(/^(?:\s*--[^\n]*\n)+/, '').trim()
    const m = /^ALTER TABLE(?:\s+IF EXISTS)?\s+(?:([a-z_][a-z0-9_]*)\.)?([a-z_][a-z0-9_]*)/i.exec(sql)
    if (m && !m[1] && ambiguos.has(m[2])) resultado.push(sql)
  }
  return resultado
}

/** Sentencias del reorg public→desk (puras, para test). El ALTER SET SCHEMA mueve datos+índices+secuencias propias. */
export function reorgToDeskStatements(): string[] {
  return [
    'CREATE SCHEMA IF NOT EXISTS desk',
    ...DESK_TABLES.map((t) => `ALTER TABLE IF EXISTS public.${t} SET SCHEMA desk`),
    'ALTER SEQUENCE IF EXISTS public.ticket_number_seq SET SCHEMA desk',
  ]
}

/**
 * Mueve las tablas Zoho Desk de public→desk (idempotente, tolerante por sentencia). PROD-ONLY: se llama solo cuando
 * config.dbSchema==='desk'. pg-mem no soporta SET SCHEMA, por eso nunca se invoca en tests.
 */
export async function reorgToDesk(db: Queryable): Promise<void> {
  for (const stmt of reorgToDeskStatements()) {
    try { await db.query(stmt) }
    catch (e) { console.error('reorgToDesk: sentencia omitida:', stmt.slice(0, 50), '→', String(e)) }
  }
}
