import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { canExecuteTransition } from '@ambientalia/shared'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { crearSubida } from '../util/subida'
import { agregarCertificado, borrarCertificado, contenidoCertificado, listarCertificados, ticketExiste, ultimaLiberacion } from '../db/certificadosFabrica'

/** Todo PDF empieza por esta firma: el tipo que declara el navegador no se toma como prueba. */
const FIRMA_PDF = '%PDF-'

/**
 * PDF OPCIONAL del certificado de fábrica de la liberación (F1A-03, RQ-EN-11). No condiciona la liberación ni exime del
 * número: el servidor decide la liberación con o sin PDF (`ticketService.ts`). Es la ÚNICA subida que ata un fichero a una
 * fila de `liberacion`, por eso tiene tabla y ruta propias y no reutiliza `resolution_attachments`.
 *
 * Escalera de la subida: A 404 ticket < A 400 falta el archivo < B 403 fuera de Servicio Técnico < B 409 sin liberación
 * registrada < C 415 tipo. Se sirve SÓLO como descarga (sin visor en la app), con el tipo fijo y `nosniff`.
 */
export function registerCertificadoFabricaRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps
  const ruta = '/api/tickets/:id/certificado-fabrica'
  const upload = crearSubida()

  // Explícito aunque `tickets.ts` ya cubra el prefijo: la seguridad de esta ruta no debe depender del orden de registro.
  app.use(ruta, requireAuth(db))

  app.post(ruta, upload.single('file'), asyncHandler(async (req, res) => {
    const ticketId = String(req.params.id)
    if (!(await ticketExiste(db, ticketId))) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    const f = req.file
    if (!f) { res.status(400).json({ error: 'Falta el archivo' }); return }
    if (!canExecuteTransition(req.user!.areas, req.user!.isAdmin, 'Servicio Técnico')) {
      res.status(403).json({ error: 'Sólo Servicio Técnico adjunta el certificado de fábrica' }); return
    }
    const transicionId = await ultimaLiberacion(db, ticketId)
    if (transicionId === null) { res.status(409).json({ error: 'El ticket no tiene una liberación registrada: el PDF se adjunta después de liberar' }); return }
    if (f.mimetype !== 'application/pdf' || f.buffer.subarray(0, FIRMA_PDF.length).toString('latin1') !== FIRMA_PDF) {
      res.status(415).json({ error: 'El certificado debe ser un PDF' }); return
    }
    const meta = await agregarCertificado(db, { ticketId, transicionId, filename: f.originalname, contentB64: f.buffer.toString('base64'), size: f.size, by: req.user?.name ?? null })
    res.status(201).json(meta)
  }))

  app.get(ruta, asyncHandler(async (req, res) => {
    res.json(await listarCertificados(db, String(req.params.id)))
  }))

  app.get(`${ruta}/:pdfId`, asyncHandler(async (req, res) => {
    const b64 = await contenidoCertificado(db, String(req.params.id), String(req.params.pdfId))
    if (b64 === null) { res.status(404).json({ error: 'No encontrado' }); return }
    res.set('Content-Type', 'application/pdf')
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('Content-Disposition', 'attachment; filename="certificado-fabrica.pdf"')
    res.send(Buffer.from(b64, 'base64'))
  }))

  app.delete(`${ruta}/:pdfId`, requireSuperAdmin, asyncHandler(async (req, res) => {
    await borrarCertificado(db, String(req.params.id), String(req.params.pdfId)); res.status(204).end()
  }))
}
