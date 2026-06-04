import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import { loadConfig } from './config'
import { createTokenManager } from './tokenManager'
import { createZohoClient } from './zohoClient'
import { createPool } from './db/pool'
import { migrate, reseedTicketNumber } from './db/migrate'
import { createSync } from './sync'
import { createApp } from './app'
import { countTickets } from './db/repo'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
const sync = createSync({ zohoFetch, db: pool, config })

async function main() {
  await migrate(pool)
  await reseedTicketNumber(pool)

  const app = createApp({ db: pool, zohoFetch, sync, config })

  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(process.cwd(), 'dist')
    app.use(express.static(dist))
    app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  app.listen(config.port, () => {
    console.log(`API en http://localhost:${config.port} (writes=${config.enableWrites})`)
  })

  countTickets(pool)
    .then(async (n) => {
      if (n === 0) {
        console.log('DB vacía: iniciando backfill de tickets…')
        const total = await sync.backfillTickets()
        console.log(`Backfill completado: ${total} tickets`)
        await reseedTicketNumber(pool)
      }
    })
    .catch((e) => console.error('Backfill falló:', e))

  let syncing = false
  setInterval(() => {
    if (syncing) return // evita solapar sincronizaciones si una tarda más que el intervalo
    syncing = true
    sync
      .syncRecent()
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, config.syncIntervalMs)
}

main().catch((e) => {
  console.error('Fallo al arrancar el servidor:', e)
  process.exit(1)
})
