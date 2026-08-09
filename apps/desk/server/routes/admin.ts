import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import type { createMeasurer } from '../measure'
import type { createDetailBackfiller } from '../backfill'
import { backfillSerialFromSubject } from '../backfillSerial'
import { enlazarTicketsConEquipos } from '../backfillEquipoId'
import { reconciliarClientesDeEquipos } from '../backfillClientId'
import { seedChecklist } from '../db/remisionChecklist'
import { CHECKLIST_SEED } from '../db/remisionChecklistSeed'
import { sembrarCatalogo } from '../db/catalogoSeed'
import { importarRemisionesHistoricas } from '../db/remisionesHistoricas'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { logger } from '../util/logger'

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(2)} ${units[i]}`
}

export function registerAdminRoutes(
  app: Express,
  deps: {
    db: Queryable
    sync: Sync
    measurer: ReturnType<typeof createMeasurer>
    detailBackfiller: ReturnType<typeof createDetailBackfiller>
  },
): void {
  const { db, sync, measurer, detailBackfiller } = deps

  // Mide cantidad/tamaño total de adjuntos (sin descargarlos). Solo superadmin (sesión).
  // Llamar repetidamente para ver el progreso; ?restart=1 reinicia la medición.
  app.get('/api/admin/measure-attachments', requireAuth(db), requireSuperAdmin, (req, res) => {
    if (req.query.restart === '1' || (!measurer.state().running && !measurer.state().done)) {
      measurer.start()
    }
    const s = measurer.state()
    res.json({ ...s, totalHuman: humanBytes(s.totalBytes) })
  })

  // Pre-puebla detalle (customFields) + conversaciones de TODOS los tickets en la BD.
  // Token-protegido, segundo plano, throttled. ?restart=1 reinicia.
  app.get('/api/admin/backfill-details', requireAuth(db), requireSuperAdmin, (req, res) => {
    if (req.query.restart === '1' || (!detailBackfiller.state().running && !detailBackfiller.state().done)) {
      detailBackfiller.start()
    }
    res.json(detailBackfiller.state())
  })

  // Backfill puntual: rellena serial/código de servicio (columnas vacías) extrayéndolos del asunto.
  // Solo tickets NO gestionados por la app; idempotente. SOLO super administrador.
  app.post('/api/admin/backfill-serial', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
      res.json(await backfillSerialFromSubject(db))
  }))

  // Segundo paso del par: convierte el `serial` que dejó el backfill anterior en el enlace real al
  // equipo. Sin él, la pestaña HOJA DE VIDA del ticket no se pinta — exige `equipo_id`, y el serial
  // suelto no le basta. SOLO super administrador; idempotente y no destructivo.
  app.post('/api/admin/backfill-equipo-id', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    const r = await enlazarTicketsConEquipos(db)
    // Los tres que NO se enlazaron van en el log con su motivo: son la diferencia entre "no había
    // nada que hacer" y "no se pudo", que es justo lo que hay que saber para decidir si insistir.
    logger.info(
      `Enlace ticket→equipo: ${r.enlazados} enlazados, ${r.ambiguos} con serial duplicado en el inventario, ` +
      `${r.sinEquipo} sin equipo con ese serial, ${r.sinSerial} sin serial`,
    )
    res.json(r)
  }))

  // Cierra el otro hueco que dejó la carga inicial de equipos: el cliente entró como texto libre y
  // `client_id` quedó NULL. `?dryRun=true` calcula el resumen sin escribir, para revisar las cifras
  // antes de tocar ~352 filas de producción. Idempotente y no destructivo.
  app.post('/api/admin/backfill-client-id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const dryRun = req.query.dryRun === 'true'
    const r = await reconciliarClientesDeEquipos(db, { dryRun })
    // Los pendientes van al log además de a la respuesta: son la lista de trabajo manual que queda, y
    // quien dispara esto desde una consola no siempre conserva el cuerpo de la respuesta.
    logger.info(
      `Reconciliación cliente→client_id${dryRun ? ' (dry-run)' : ''}: ${r.enlazados} enlazados, ` +
      `${r.ambiguos} ambiguos, ${r.sinCliente} sin cliente en Books, ${r.sinNombre} sin nombre`,
    )
    for (const p of r.pendientes) logger.info(`  pendiente ${p.serial} (${p.motivo}): "${p.clienteNombre}"`)
    res.json(r)
  }))

  // Siembra el catálogo inicial del checklist de remisiones. SOLO super administrador.
  // Se dispara a mano UNA vez: a partir de ahí manda la tabla y nada la reescribe al arrancar (a
  // diferencia de la vieja semilla CSV de equipos, que revertía las ediciones en cada despliegue).
  // Es idempotente y no destructiva: re-ejecutarla solo añade lo que falte.
  app.post('/api/admin/seed-remision-checklist', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    const r = await seedChecklist(db, CHECKLIST_SEED)
    logger.info(`Checklist de remisiones sembrado: ${r.insertados} nuevos, ${r.existentes} ya existían`)
    res.json(r)
  }))

  // Puebla el catálogo maestro de equipos desde el inventario que ya existe. SOLO super administrador.
  // Hay que dispararla A MANO una vez tras desplegar: hasta que corre, el catálogo está vacío y no se
  // puede dar de alta ningún equipo, porque el modelo pasó a ser obligatorio.
  // No vive en `migrate()` a propósito — `migrate()` es tolerante por sentencia y se salta en silencio
  // la que falle, así que un backfill escondido ahí podría no correr nunca sin que nadie se entere.
  app.post('/api/admin/seed-catalogo', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    const r = await sembrarCatalogo(db)
    // Los cuatro primeros son deltas de esta ejecución; `modelosPorRevisar` es el total pendiente,
    // que es el número por el que preguntará quien acabe de sembrar.
    logger.info(
      `Catálogo sembrado: ${r.marcasCreadas} marcas, ${r.tiposCreados} tipos, ${r.modelosCreados} modelos, ` +
      `${r.equiposEnlazados} equipos enlazados, ${r.conflictosNuevos} conflictos nuevos, ${r.modelosPorRevisar} por revisar en total`,
    )
    res.json(r)
  }))

  // Paso 1 de la migración del histórico de remisiones (hoja de Google → Postgres). SOLO super
  // administrador. `?dryRun=true` calcula el resumen sin escribir, para revisar las cifras antes de
  // tocar producción: no se sabe de antemano cuántos tickets de Zoho que menciona la hoja siguen en
  // la base. Es idempotente (ver importarRemisionesHistoricas): se puede disparar más de una vez.
  app.post('/api/admin/import-remisiones-historicas', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const dryRun = req.query.dryRun === 'true'
    const r = await importarRemisionesHistoricas(db, { dryRun })
    logger.info(`Import remisiones históricas${dryRun ? ' (dry-run)' : ''}: ${r.insertadas} nuevas, ${r.yaExistian} ya existían, ${r.ticketNoEncontrado} sin ticket encontrado`)
    res.json(r)
  }))

  // Backfill de tickets archivados en segundo plano (fire-and-forget). SOLO super administrador.
  app.post('/api/admin/backfill-archived', requireAuth(db), requireSuperAdmin, (_req, res) => {
    sync.backfillArchivedTickets()
      .then((n) => logger.info(`Backfill archivados: ${n} tickets`))
      .catch((err) => logger.error({ err }, 'Backfill archivados falló'))
    res.json({ started: true })
  })
}
