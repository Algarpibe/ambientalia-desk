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
import { countUsers, createUser, getUserByEmail } from './auth/users'
import { hashPassword } from './auth/passwords'
import { createBooksClient } from './books/booksClient'
import { createBooksSync } from './books/sync'
import { maxLastModified } from './books/repo'
import { readFileSync } from 'node:fs'
import { seedEquipos } from './db/seedEquipos'
import { countEquipos } from './db/equipos'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
const sync = createSync({ zohoFetch, db: pool, config })

async function main() {
  await migrate(pool)
  // Best-effort: no debe tumbar el arranque (p.ej. si aún existe el esquema viejo antes de recrear).
  try { await reseedTicketNumber(pool) } catch (e) { console.error('reseed inicial omitido:', e) }

  try {
    if ((await countEquipos(pool)) === 0) {
      const csv = readFileSync(new URL('./db/equipos.seed.csv', import.meta.url), 'utf8')
      const n = await seedEquipos(pool, csv)
      console.log(`Equipos: semilla cargada (${n})`)
    } else {
      console.log('Equipos: ya hay datos, no se siembra')
    }
  } catch (e) { console.error('Seed de equipos falló:', e) }

  // Bootstrap: si no hay usuarios y hay credenciales en env, crea el admin inicial.
  if (config.adminEmail && config.adminPassword && (await countUsers(pool)) === 0) {
    if (config.adminPassword.length < 8) {
      console.error('ADMIN_PASSWORD debe tener al menos 8 caracteres; no se sembró el admin inicial.')
    } else if (!(await getUserByEmail(pool, config.adminEmail))) {
      await createUser(pool, {
        email: config.adminEmail, name: 'Administrador',
        passwordHash: await hashPassword(config.adminPassword), isAdmin: true,
      })
      console.log(`Admin inicial creado: ${config.adminEmail}`)
    }
  }

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

  sync.syncActivities()
    .then((n) => console.log(`Actividades: sync inicial (${n})`))
    .catch((e) => console.error('Sync actividades falló:', e))

  sync.syncContacts()
    .then((n) => console.log(`Contactos: sync inicial (${n})`))
    .catch((e) => console.error('Sync contactos falló:', e))

  let syncing = false
  setInterval(() => {
    if (syncing) return // evita solapar sincronizaciones si una tarda más que el intervalo
    syncing = true
    sync
      .syncRecent()
      .then(() => sync.syncActivities())
      .then(() => sync.syncContacts())
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, config.syncIntervalMs)

  if (config.booksRefreshToken && config.booksOrgId) {
    const { booksFetch } = createBooksClient({ config })
    const booksSync = createBooksSync({ booksFetch, db: pool, config })
    maxLastModified(pool, 'clients')
      .then(async (wm) => {
        if (!wm) {
          console.log('Books vacío: backfill de clientes y órdenes de venta…')
          const c = await booksSync.backfillClients()
          const s = await booksSync.backfillSalesOrders()
          console.log(`Books backfill: ${c} clientes, ${s} órdenes de venta`)
        }
      })
      .catch((e) => console.error('Books backfill falló:', e))
    setInterval(() => {
      booksSync.syncRecent().catch((e) => console.error('Books syncRecent falló:', e))
    }, config.syncIntervalMs)
    console.log('Sync Zoho Books habilitado')
  } else {
    console.log('Sync Zoho Books deshabilitado (faltan ZOHO_BOOKS_REFRESH_TOKEN / ZOHO_BOOKS_ORG_ID)')
  }
}

main().catch((e) => {
  console.error('Fallo al arrancar el servidor:', e)
  process.exit(1)
})
