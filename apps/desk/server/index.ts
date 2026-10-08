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
import { avisarDiscrepanciaOV } from './services/avisoDiscrepanciaOV'; import { pasadaRitmoContratos } from './services/avisoRitmoContrato'; import { pasadaAlarmas } from './services/alarmasSla'; import { scheduleDailyAt } from '@ambientalia/zoho-sync/booksHub/schedule'; import { cargarConfigRespaldo } from './respaldo/config'; import { crearRespaldador } from './respaldo/respaldo'; import { dependenciasReales } from './respaldo/dependencias'; import { cargarConfigDrive, tocaHoy } from './respaldo/configDrive'; import { crearCopiadorDrive, dependenciasRealesDrive } from './respaldo/copiaDrive'; import { pasadaReclamaciones } from './services/avisoReclamacionProveedor'; import { pasadaProvisionalesEnBooks } from './services/avisoProvisionalEnBooks'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
// parche-iv11-orden-venta (D5, RQ-AV-13): sólo este proceso cablea el aviso de discrepancia de orden
// de venta; el worker `apps/hub-sync` no lo pasa y por tanto nunca lo crea.
const sync = createSync({ zohoFetch, db: pool, config, alDiscrepanciaOV: (d) => avisarDiscrepanciaOV(pool, d) })

async function main() {
  if (config.dbSchema === 'desk') await reorgToDesk(pool)
  await migrate(pool)
  // Best-effort: no debe tumbar el arranque (p.ej. si aún existe el esquema viejo antes de recrear).
  try { await reseedTicketNumber(pool) } catch (err) { logger.error({ err }, 'reseed inicial omitido') }

  // `desk.equipos` es la ÚNICA fuente de equipos: se gestiona desde la página Equipos y nada la
  // repuebla al arrancar. La siembra por CSV se retiró a propósito — con la tabla ya cargada era
  // código muerto, y ante una pérdida de datos habría repoblado 352 equipos obsoletos (sin los
  // creados en la app ni sus client_id), aparentando normalidad y tapando el incidente.

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

  const app = createApp({ db: pool, zohoFetch, sync, config, respaldador })

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
    let p: Promise<unknown> = pasadaAlarmas(pool, config).then(() => pasadaReclamaciones(pool)).then(() => pasadaProvisionalesEnBooks(pool)).then(() => pasadaRitmoContratos(pool).then(() => sync.syncRecent()))
    if (config.syncActivities) p = p.then(() => sync.syncActivities())
    if (config.syncContacts) p = p.then(() => sync.syncContacts())
    p.catch((err) => logger.error({ err }, 'Sync incremental falló'))
      .finally(() => { syncing = false })
  }, config.syncIntervalMs)

  // F1F-02 (RQ-ZS-20): la copia nocturna. Sólo se programa con el interruptor encendido; encenderlo pide reiniciar la App.
  if (configRespaldo.habilitado) {
    scheduleDailyAt(configRespaldo.hora, async () => { logger.info({ r: await respaldador.lanzar('nocturna') }, 'Respaldo nocturno terminado') })
    logger.info(`Respaldo nocturno programado (diario ${configRespaldo.hora}:00, hora del contenedor)`)
  }
}

// F1F-02 (RQ-ZS-20): un solo respaldador por proceso, para que la ruta y la copia nocturna compartan la guarda de «en curso».
const configRespaldo = cargarConfigRespaldo()
const respaldador = crearRespaldador(configRespaldo, dependenciasReales(configRespaldo, config))

main().catch((err) => {
  logger.error({ err }, 'Fallo al arrancar el servidor')
  process.exit(1)
})

// F1F-02 (RQ-ZS-21): la copia semanal de la carpeta de Drive. Nace cerrada (RESPALDO_DRIVE_HABILITADO); apagada no programa nada y encenderla pide reiniciar la App.
const configDrive = cargarConfigDrive()
if (configDrive.habilitado) {
  const equiposConDrive = async () => (await pool.query<{ drive_url: string }>('SELECT drive_url FROM desk.equipos WHERE drive_url IS NOT NULL')).rows.map((r) => r.drive_url)
  const copiadorDrive = crearCopiadorDrive(configDrive, configRespaldo, dependenciasRealesDrive(configDrive, configRespaldo, config, equiposConDrive))
  scheduleDailyAt(configDrive.hora, async () => { if (tocaHoy(configDrive.dia, new Date())) logger.info({ r: await copiadorDrive.lanzar() }, 'Copia semanal de Drive terminada') })
  logger.info(`Copia semanal de Drive programada (día ${configDrive.dia}, ${configDrive.hora}:00, hora del contenedor)`)
}
