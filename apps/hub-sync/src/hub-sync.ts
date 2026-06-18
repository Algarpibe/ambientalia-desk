import 'dotenv/config'
import { loadConfig } from '@ambientalia/zoho-sync/config'
import { createTokenManager } from '@ambientalia/zoho-sync/tokenManager'
import { createZohoClient } from '@ambientalia/zoho-sync/zohoClient'
import { createPool, createPoolFromUrl } from '@ambientalia/zoho-sync/db/pool'
import { createSync } from '@ambientalia/zoho-sync/sync'
import { deriveSalesRecords } from '@ambientalia/zoho-sync/booksHub/salesRecords'
import { scheduleDailyAt } from '@ambientalia/zoho-sync/booksHub/schedule'
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

  if (config.deriveSalesRecords && config.salesTrackerDatabaseUrl) {
    const stPool = createPoolFromUrl(config.salesTrackerDatabaseUrl)
    const runDerivation = async () => {
      const client = await stPool.connect()
      try {
        const { rows } = await deriveSalesRecords({ hub: pool, salesTracker: client })
        console.log(`sales_records derivado: ${rows} filas`)
      } finally { client.release() }
    }
    await runDerivation().catch((e) => console.error('Derivación inicial sales_records falló:', e))
    scheduleDailyAt(config.salesRecordsHour, runDerivation)
    console.log(`Derivación sales_records habilitada (diaria ${config.salesRecordsHour}:00)`)
  } else {
    console.log('Derivación sales_records deshabilitada (falta SALES_TRACKER_DATABASE_URL o DERIVE_SALES_RECORDS=false)')
  }
}

main().catch((e) => { console.error('Fallo al arrancar zoho-hub-sync:', e); process.exit(1) })
