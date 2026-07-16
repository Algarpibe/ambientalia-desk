import 'dotenv/config'
import { loadConfig } from '@ambientalia/zoho-sync/config'
import { createPool } from '@ambientalia/zoho-sync/db/pool'
import { createBooksClient } from '@ambientalia/zoho-sync/books/booksClient'
import { createBooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'

/**
 * Backfill de una sola vez de TODOS los artículos, con su detalle (incluye
 * custom_fields → cf_centro_de_costos).
 *
 * Por qué hace falta: el arranque normal (hubBootstrap) solo backfillea si la tabla
 * de artículos está vacía, y el sync incremental solo re-baja los artículos
 * modificados. Tras el fix de persistItem (que pasa a leer el detalle), los ~1000
 * artículos que YA estaban en el hub no traen su centro de costos hasta que se los
 * re-baja una vez. Eso hace este script.
 *
 * Uso (en la consola del contenedor hub-sync, que ya tiene HUB_DB_URL y las
 * credenciales de Books en su entorno):
 *
 *     npm run backfill:items
 *
 * Es idempotente (upsert): si algún artículo fallara, se puede volver a correr.
 * booksFetch reintenta ante 429, así que el rate-limit de Zoho no debería hacer
 * perder artículos.
 */
async function main() {
  const config = loadConfig()
  if (!config.booksRefreshToken || !config.booksOrgId) {
    throw new Error('Faltan credenciales de Books (BOOKS_REFRESH_TOKEN / BOOKS_ORG_ID)')
  }
  const pool = createPool(config)
  const { booksFetch } = createBooksClient({ config })
  const sync = createBooksHubSync({ booksFetch, db: pool, config })

  console.log('Backfill de artículos (con custom_fields) — inicio')
  const t0 = Date.now()
  const n = await sync.backfillItems()
  console.log(`Backfill de artículos completado: ${n} artículos en ${Math.round((Date.now() - t0) / 1000)}s`)
  await pool.end()
}

main().catch((e) => {
  console.error('Backfill de artículos falló:', e)
  process.exit(1)
})
