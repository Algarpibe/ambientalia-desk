import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import { loadConfig } from '@ambientalia/zoho-sync/config'
import { createTokenManager } from '@ambientalia/zoho-sync/tokenManager'
import { createZohoClient } from '@ambientalia/zoho-sync/zohoClient'
import { createPool } from '@ambientalia/zoho-sync/db/pool'
import { migrate, reorgToDesk, reseedTicketNumber } from '@ambientalia/zoho-sync/db/migrate'
import { createSync } from '@ambientalia/zoho-sync/sync'
import { createApp } from './app'
import { logger } from './util/logger'
import { countTickets } from '@ambientalia/zoho-sync/db/repo'
import { countUsers, createUser, getUserByEmail } from './auth/users'
import { hashPassword } from './auth/passwords'
import { readFileSync } from 'node:fs'
import { seedEquipos } from './db/seedEquipos'
import { countEquipos } from './db/equipos'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
const sync = createSync({ zohoFetch, db: pool, config })

async function main() {
  if (config.dbSchema === 'desk') await reorgToDesk(pool)
  await migrate(pool)
  // Best-effort: no debe tumbar el arranque (p.ej. si aún existe el esquema viejo antes de recrear).
  try { await reseedTicketNumber(pool) } catch (err) { logger.error({ err }, 'reseed inicial omitido') }

  try {
    if ((await countEquipos(pool)) === 0) {
      const csv = readFileSync(new URL('./db/equipos.seed.csv', import.meta.url), 'utf8')
      const n = await seedEquipos(pool, csv)
      logger.info(`Equipos: semilla cargada (${n})`)
    } else {
      logger.info('Equipos: ya hay datos, no se siembra')
    }
  } catch (err) { logger.error({ err }, 'Seed de equipos falló') }

  // Bootstrap: si no hay usuarios y hay credenciales en env, crea el admin inicial.
  if (config.adminEmail && config.adminPassword && (await countUsers(pool)) === 0) {
    if (config.adminPassword.length < 8) {
      logger.error('ADMIN_PASSWORD debe tener al menos 8 caracteres; no se sembró el admin inicial.')
    } else if (!(await getUserByEmail(pool, config.adminEmail))) {
      await createUser(pool, {
        email: config.adminEmail, name: 'Administrador',
        passwordHash: await hashPassword(config.adminPassword), isAdmin: true,
      })
      logger.info(`Admin inicial creado: ${config.adminEmail}`)
    }
  }

  const app = createApp({ db: pool, zohoFetch, sync, config })

  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(process.cwd(), 'dist')
    app.use(express.static(dist))
    app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  app.listen(config.port, () => {
    logger.info(`API en http://localhost:${config.port} (writes=${config.enableWrites})`)
  })

  countTickets(pool)
    .then(async (n) => {
      if (n === 0) {
        logger.info('DB vacía: iniciando backfill de tickets…')
        const total = await sync.backfillTickets()
        logger.info(`Backfill completado: ${total} tickets`)
        await reseedTicketNumber(pool)
      }
    })
    .catch((err) => logger.error({ err }, 'Backfill falló'))

  if (config.syncActivities) {
    sync.syncActivities()
      .then((n) => logger.info(`Actividades: sync inicial (${n})`))
      .catch((err) => logger.error({ err }, 'Sync actividades falló'))
  }

  if (config.syncContacts) {
    sync.syncContacts()
      .then((n) => logger.info(`Contactos: sync inicial (${n})`))
      .catch((err) => logger.error({ err }, 'Sync contactos falló'))
  }

  let syncing = false
  setInterval(() => {
    if (syncing) return // evita solapar sincronizaciones si una tarda más que el intervalo
    syncing = true
    let p: Promise<unknown> = sync.syncRecent()
    if (config.syncActivities) p = p.then(() => sync.syncActivities())
    if (config.syncContacts) p = p.then(() => sync.syncContacts())
    p.catch((err) => logger.error({ err }, 'Sync incremental falló'))
      .finally(() => { syncing = false })
  }, config.syncIntervalMs)
}

main().catch((err) => {
  logger.error({ err }, 'Fallo al arrancar el servidor')
  process.exit(1)
})
