import type { Express, Request, Response } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'; import { buscarCopia, servirCopia, registrarCaida } from '../adjuntos/servir'; import { responderModoSinZoho, MENSAJE_ADJUNTO_SIN_COPIA, type ModoSinZoho } from './modoSinZohoDesk'; import { logger } from '../util/logger'; import type { Copia } from '../adjuntos/servir'

export function registerAttachmentRoutes(
  app: Express,
  deps: { db: Queryable; zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>; dir: string | null; modo: ModoSinZoho },
): void {
  const { db, zohoFetch, dir, modo } = deps

  // Proxy autenticado para descargar adjuntos de Zoho (el href real requiere OAuth + orgId).
  // Requiere sesión: son documentos de clientes (facturas, fotos, etc.).
  app.get('/api/attachment', requireAuth(db), asyncHandler(async (req, res) => {
    const path = String(req.query.path ?? '')
    // Solo rutas de adjuntos de tickets (evita SSRF a rutas arbitrarias de la API).
    if (!/^\/tickets\/\d+\/(comments|threads)\/\d+\/attachments\/\d+\/content$/.test(path)) {
      res.status(400).json({ error: 'Ruta de adjunto inválida' })
      return
    }
    const copia = await buscarCopia(db, dir, path)
    if (copia.tipo === 'local') { await servirCopia(res, copia); return }; if (modo.activo) { adjuntoSinCopiaEnModo(req, res, copia, modo); return }
    let zres: globalThis.Response
    try { zres = await zohoFetch(path) } catch (e) { registrarCaida(copia, 'sin respuesta'); throw e }
    registrarCaida(copia, zres.status)
    if (!zres.ok) {
      res.status(zres.status).json({ error: await zres.text() })
      return
    }
    const ct = zres.headers.get('content-type')
    if (ct) res.setHeader('Content-Type', ct)
    const cd = zres.headers.get('content-disposition')
    if (cd) res.setHeader('Content-Disposition', cd)
    res.send(Buffer.from(await zres.arrayBuffer()))
  }))
}

/** Modo sin Zoho Desk (RQ-ZS-44.5, S-l): sin copia local no se llama a Zoho; una línea de log con el motivo, sin nombre ni ruta, y el 503. */
function adjuntoSinCopiaEnModo(req: Request, res: Response, copia: Extract<Copia, { tipo: 'zoho' }>, modo: ModoSinZoho): void {
  logger.warn({ adjunto: copia.adjunto, ticket: copia.ticket, motivo: copia.motivo }, 'Adjunto sin copia local en modo sin Zoho Desk: no se pide a Zoho')
  responderModoSinZoho(req, res, modo, MENSAJE_ADJUNTO_SIN_COPIA)
}
