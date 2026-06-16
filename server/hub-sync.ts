import 'dotenv/config'
import { loadConfig } from './config'
import { createTokenManager } from './tokenManager'
import { createZohoClient } from './zohoClient'
import { createPool } from './db/pool'
import { createSync } from './sync'
import { createBooksClient } from './books/booksClient'
import { createBooksSync, type BooksSync } from './books/sync'
import { hubBootstrap, scheduleHubSync } from './hubSync'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
const sync = createSync({ zohoFetch, db: pool, config })

let booksSync: BooksSync | null = null
if (config.booksRefreshToken && config.booksOrgId) {
  const { booksFetch } = createBooksClient({ config })
  booksSync = createBooksSync({ booksFetch, db: pool, config })
  console.log('Sync Zoho Books habilitado (hub)')
} else {
  console.log('Sync Zoho Books deshabilitado (hub): faltan ZOHO_BOOKS_REFRESH_TOKEN / ZOHO_BOOKS_ORG_ID')
}

async function main() {
  await hubBootstrap({ db: pool, sync, booksSync })
  scheduleHubSync({ sync, booksSync, intervalMs: config.syncIntervalMs })
  console.log(`zoho-hub-sync en marcha (intervalo ${config.syncIntervalMs} ms)`)
}

main().catch((e) => { console.error('Fallo al arrancar zoho-hub-sync:', e); process.exit(1) })
