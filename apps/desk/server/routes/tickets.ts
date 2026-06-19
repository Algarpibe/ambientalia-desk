import type { Express, Request, Response } from 'express'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import multer from 'multer'
import { getActiveTickets, getAllTickets, getClosedTickets, countClosedTickets, getTicketWithRefs, getConversations, setTicketRead } from '@ambientalia/zoho-sync/db/repo'
import { rowToTicket, rowToTicketDetail, rowToMessage } from '@ambientalia/zoho-sync/db/mappers'
import { getTicketHistory } from '@ambientalia/zoho-sync/db/history'
import { getActivities } from '@ambientalia/zoho-sync/db/activities'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { createManagedTicket, executeTransition } from '../services/ticketService'
import { getResolution, saveResolution, addResolutionAttachment, getResolutionAttachmentContent, deleteResolutionAttachment, deleteResolution } from '../db/resolutions'

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])

export function registerTicketRoutes(
  app: Express,
  deps: { db: Queryable; sync: Sync; zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>; config: AppConfig },
): void {
  const { db, sync, zohoFetch, config } = deps

  const guardWrites = (_req: Request, res: Response, next: () => void) => {
    if (!config.enableWrites) {
      res.status(403).json({ error: 'Escrituras deshabilitadas (ENABLE_WRITES=false)' })
      return
    }
    next()
  }

  app.use('/api/tickets', requireAuth(db)) // login obligatorio para tickets/transiciones/reply

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

  app.get('/api/tickets/:id/resolution', asyncHandler(async (req, res) => {
    res.json(await getResolution(db, String(req.params.id)))
  }))
  app.put('/api/tickets/:id/resolution', asyncHandler(async (req, res) => {
    const html = typeof req.body?.html === 'string' ? req.body.html : ''
    await saveResolution(db, String(req.params.id), html, req.user?.name ?? null)
    res.json({ ok: true })
  }))
  app.post('/api/tickets/:id/resolution/attachments', upload.single('file'), asyncHandler(async (req, res) => {
    const f = req.file
    if (!f) { res.status(400).json({ error: 'Falta el archivo' }); return }
    if (!ALLOWED_IMAGE_TYPES.has(f.mimetype)) { res.status(415).json({ error: 'Tipo de imagen no permitido' }); return }
    const meta = await addResolutionAttachment(db, { ticketId: String(req.params.id), filename: f.originalname, contentType: f.mimetype, contentB64: f.buffer.toString('base64'), size: f.size, by: req.user?.name ?? null })
    res.status(201).json(meta)
  }))
  app.get('/api/tickets/:id/resolution/attachments/:attId', asyncHandler(async (req, res) => {
    const c = await getResolutionAttachmentContent(db, String(req.params.id), String(req.params.attId))
    if (!c) { res.status(404).json({ error: 'No encontrado' }); return }
    res.set('Content-Type', c.contentType)
    res.set('X-Content-Type-Options', 'nosniff')
    res.send(Buffer.from(c.contentB64, 'base64'))
  }))
  app.delete('/api/tickets/:id/resolution/attachments/:attId', requireSuperAdmin, asyncHandler(async (req, res) => {
    await deleteResolutionAttachment(db, String(req.params.id), String(req.params.attId)); res.status(204).end()
  }))
  app.delete('/api/tickets/:id/resolution', requireSuperAdmin, asyncHandler(async (req, res) => {
    await deleteResolution(db, String(req.params.id)); res.status(204).end()
  }))

  app.get('/api/tickets', asyncHandler(async (req, res) => {
    if (req.query.scope === 'closed') {
      const pageSize = 50
      const page = Math.max(1, Number(req.query.page) || 1)
      const items = await getClosedTickets(db, req.user!.id, pageSize, (page - 1) * pageSize)
      const total = await countClosedTickets(db)
      res.json({ items: items.map(({ row, refs }) => rowToTicket(row, refs)), total, page, pageSize })
      return
    }
    // scope=all (compat, sin uso en el front) o default (active)
    const list = req.query.scope === 'all' ? await getAllTickets(db, req.user!.id) : await getActiveTickets(db, req.user!.id)
    res.json(list.map(({ row, refs }) => rowToTicket(row, refs)))
  }))

  app.post('/api/tickets/:id/read', asyncHandler(async (req, res) => {
    await setTicketRead(db, req.user!.id, String(req.params.id), !!req.body?.read)
    res.json({ ok: true })
  }))

  // Crea un ticket gestionado por la app en "OV asignada" (Subsistema C). Pivota opcionalmente en una OV de Books.
  app.post('/api/tickets', asyncHandler(async (req, res) => {
    res.status(201).json(await createManagedTicket(db, req.body, req.user?.name ?? 'App'))
  }))

  app.get('/api/tickets/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    let found = await getTicketWithRefs(db, id)
    if (!found) { // primera vez sin datos locales → poblar (lazy)
      try { await sync.syncTicket(id) } catch (e) { console.error(`syncTicket(${id}) falló:`, e) }
      found = await getTicketWithRefs(db, id)
      if (!found) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    } else {
      void sync.syncTicket(id).catch((e) => console.error(`syncTicket bg(${id}) falló:`, e)) // refresco en background
    }
    res.json(rowToTicketDetail(found.row, found.refs))
  }))

  app.get('/api/tickets/:id/conversations', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    let convs = await getConversations(db, id)
    if (convs.length === 0) { await sync.syncConversations(id); convs = await getConversations(db, id) }
    else { void sync.syncConversations(id).catch((e) => console.error(`syncConversations bg(${id}) falló:`, e)) }
    res.json(convs.map(({ row, attachments }) => rowToMessage(row, attachments)))
  }))

  app.get('/api/tickets/:id/history', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    let hist = await getTicketHistory(db, id)
    if (hist.length === 0) {
      try { await sync.syncTicketHistory(id) } catch (e) { console.error(`syncTicketHistory(${id}) falló:`, e) }
      hist = await getTicketHistory(db, id)
    } else {
      void sync.syncTicketHistory(id).catch((e) => console.error(`syncTicketHistory bg(${id}) falló:`, e))
    }
    res.json(hist)
  }))

  app.get('/api/tickets/:id/activities', asyncHandler(async (req, res) => {
    res.json(await getActivities(db, String(req.params.id)))
  }))

  // Ejecuta una transición del Blueprint escribiendo en Postgres (Subsistema B).
  app.post('/api/tickets/:id/transition', asyncHandler(async (req, res) => {
    res.json(await executeTransition(db, String(req.params.id), req.body, req.user!))
  }))

  app.post('/api/tickets/:id/reply', guardWrites, asyncHandler(async (req, res) => {
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
      if (!zres.ok) { res.status(zres.status).json({ error: await zres.text() }); return }
      await sync.syncConversations(id)
      res.json({ ok: true })
  }))
}
