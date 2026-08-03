import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import type { createMeasurer } from '../measure'
import type { createDetailBackfiller } from '../backfill'
import { backfillSerialFromSubject } from '../backfillSerial'
import { seedChecklist } from '../db/remisionChecklist'
import { CHECKLIST_SEED } from '../db/remisionChecklistSeed'
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

  // Siembra el catálogo inicial del checklist de remisiones. SOLO super administrador.
  // Se dispara a mano UNA vez: a partir de ahí manda la tabla y nada la reescribe al arrancar (a
  // diferencia de la vieja semilla CSV de equipos, que revertía las ediciones en cada despliegue).
  // Es idempotente y no destructiva: re-ejecutarla solo añade lo que falte.
  app.post('/api/admin/seed-remision-checklist', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    const r = await seedChecklist(db, CHECKLIST_SEED)
    logger.info(`Checklist de remisiones sembrado: ${r.insertados} nuevos, ${r.existentes} ya existían`)
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
