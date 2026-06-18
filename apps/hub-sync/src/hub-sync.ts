import 'dotenv/config'
import { loadConfig } from '@ambientalia/zoho-sync/config'
import { createTokenManager } from '@ambientalia/zoho-sync/tokenManager'
import { createZohoClient } from '@ambientalia/zoho-sync/zohoClient'
import { createPool } from '@ambientalia/zoho-sync/db/pool'
import { createSync } from '@ambientalia/zoho-sync/sync'
import { createBooksClient } from '@ambientalia/zoho-sync/books/booksClient'
import { createBooksSync, type BooksSync } from '@ambientalia/zoho-sync/books/sync'
import { createBooksHubSync, type BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'
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

let booksHubSync: BooksHubSync | null = null
if (config.booksRefreshToken && config.booksOrgId && config.syncBooksRich) {
  const { booksFetch } = createBooksClient({ config })
  booksHubSync = createBooksHubSync({ booksFetch, db: pool, config })
  console.log('Sync Books rico (books.*) habilitado')
}

async function main() {
  await hubBootstrap({ db: pool, sync, booksSync, booksHubSync })
  scheduleHubSync({ sync, booksSync, booksHubSync, intervalMs: config.syncIntervalMs })
  console.log(`zoho-hub-sync en marcha (intervalo ${config.syncIntervalMs} ms)`)
}

main().catch((e) => { console.error('Fallo al arrancar zoho-hub-sync:', e); process.exit(1) })
