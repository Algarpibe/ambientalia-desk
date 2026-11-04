import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'; import { buscarCopia, servirCopia, registrarCaida } from '../adjuntos/servir'

export function registerAttachmentRoutes(
  app: Express,
  deps: { db: Queryable; zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>; dir: string | null },
): void {
  const { db, zohoFetch, dir } = deps

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
    if (copia.tipo === 'local') { await servirCopia(res, copia); return }
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
