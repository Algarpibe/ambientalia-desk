import express, { type Express, type Request, type Response } from 'express'
import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import type { Sync } from './sync'
import { normalizeTicket, normalizeTicketDetail, normalizeConversation } from './normalize'
import { getActiveTicketsRaw, getTicketRaw, getConversationsRaw } from './db/repo'

interface Deps {
  db: Queryable
  zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>
  sync: Sync
  config: AppConfig
}

export function createApp({ db, zohoFetch, sync, config }: Deps): Express {
  const app = express()
  app.use(express.json())

  const guardWrites = (_req: Request, res: Response, next: () => void) => {
    if (!config.enableWrites) {
      res.status(403).json({ error: 'Escrituras deshabilitadas (ENABLE_WRITES=false)' })
      return
    }
    next()
  }

  app.get('/api/tickets', async (_req, res) => {
    try {
      const raws = await getActiveTicketsRaw(db)
      res.json(raws.map((r) => normalizeTicket(r)))
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const id = String(req.params.id)
      // Siempre trae el DETALLE fresco de Zoho (incluye customFields, contacto y empresa)
      // y lo guarda en la BD. Si Zoho falla, caemos a lo que haya en la BD.
      try {
        await sync.syncTicket(id)
      } catch (e) {
        console.error(`syncTicket(${id}) falló, sirvo desde BD:`, e)
      }
      const raw = await getTicketRaw(db, id)
      if (!raw) return res.status(404).json({ error: 'Ticket no encontrado' })
      res.json(normalizeTicketDetail(raw))
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

  app.get('/api/tickets/:id/conversations', async (req, res) => {
    try {
      let raws = await getConversationsRaw(db, req.params.id)
      if (raws.length === 0) {
        await sync.syncConversations(req.params.id)
        raws = await getConversationsRaw(db, req.params.id)
      }
      res.json(raws.map((r) => normalizeConversation(r)))
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

  // Proxy autenticado para descargar adjuntos de Zoho (el href real requiere OAuth + orgId).
  app.get('/api/attachment', async (req, res) => {
    const path = String(req.query.path ?? '')
    // Solo rutas de adjuntos de tickets (evita SSRF a rutas arbitrarias de la API).
    if (!/^\/tickets\/\d+\/(comments|threads)\/\d+\/attachments\/\d+\/content$/.test(path)) {
      res.status(400).json({ error: 'Ruta de adjunto inválida' })
      return
    }
    try {
      const zres = await zohoFetch(path)
      if (!zres.ok) {
        res.status(zres.status).json({ error: await zres.text() })
        return
      }
      const ct = zres.headers.get('content-type')
      if (ct) res.setHeader('Content-Type', ct)
      const cd = zres.headers.get('content-disposition')
      if (cd) res.setHeader('Content-Disposition', cd)
      res.send(Buffer.from(await zres.arrayBuffer()))
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  app.patch('/api/tickets/:id/status', guardWrites, async (req, res) => {
    try {
      const id = String(req.params.id)
      const zres = await zohoFetch(`/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: req.body.status }),
      })
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      await sync.syncTicket(id)
      const raw = await getTicketRaw(db, id)
      res.json(raw ? normalizeTicket(raw) : {})
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  app.post('/api/tickets/:id/reply', guardWrites, async (req, res) => {
    try {
      const id = String(req.params.id)
      // Direcciones de remitente válidas del departamento (Zoho: GET /mailReplyAddress).
      const addrRes = await zohoFetch(`/mailReplyAddress?departmentId=${config.departmentId}&isActive=true`)
      const addrText = await addrRes.text()
      const addrBody = addrText ? JSON.parse(addrText) : { data: [] }
      const fromEmailAddress = addrBody.data?.[0]?.email ?? addrBody.data?.[0]?.value
      const zres = await zohoFetch(`/tickets/${id}/sendReply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL', contentType: 'plainText',
          content: req.body.content, fromEmailAddress, to: req.body.to,
        }),
      })
      if (!zres.ok) return res.status(zres.status).json({ error: await zres.text() })
      await sync.syncConversations(id)
      res.json({ ok: true })
    } catch (err) {
      res.status(502).json({ error: String(err) })
    }
  })

  return app
}
