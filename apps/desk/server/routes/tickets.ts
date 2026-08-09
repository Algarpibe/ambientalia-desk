import type { Express, Request, Response } from 'express'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import { getActiveTickets, getAllTickets, getClosedTickets, countClosedTickets, getTicketWithRefs, setTicketRead, previewTicketNumber } from '@ambientalia/zoho-sync/db/repo'
import { rowToTicket, rowToTicketDetail } from '@ambientalia/zoho-sync/db/mappers'
import { getHistorialTicket } from '../db/historial'
import { getConversacionTicket } from '../db/conversacion'
import { getActivities } from '@ambientalia/zoho-sync/db/activities'
import { requireAuth, requireAdmin as requireSuperAdmin, requireArea } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { crearSubida } from '../util/subida'
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

  // Previsión del número del próximo ticket, para mostrarlo en el formulario de creación.
  // DEBE registrarse antes que `GET /api/tickets/:id`, que si no capturaría "next-number".
  app.get('/api/tickets/next-number', asyncHandler(async (_req, res) => {
    res.json({ number: await previewTicketNumber(db) })
  }))

  const upload = crearSubida()

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

  // Crea un ticket gestionado por la app en "Ticket creado" (Subsistema C). Pivota opcionalmente en una OV de Books.
  app.post('/api/tickets', asyncHandler(async (req, res) => {
    res.status(201).json(await createManagedTicket(db, req.body, req.user?.name ?? 'App'))
  }))

  app.get('/api/tickets/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    let found = await getTicketWithRefs(db, id)
    if (!found) { // primera vez sin datos locales → poblar (lazy)
      try { await sync.syncTicket(id) } catch (err) { req.log.warn({ err, ticketId: id }, 'syncTicket (lazy) falló') }
      found = await getTicketWithRefs(db, id)
      if (!found) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    } else {
      void sync.syncTicket(id).catch((err) => req.log.warn({ err, ticketId: id }, 'syncTicket bg falló')) // refresco en background
    }
    res.json(rowToTicketDetail(found.row, found.refs))
  }))

  app.get('/api/tickets/:id/conversations', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const primero = await getConversacionTicket(db, id)
    // Antes se decidía el sync perezoso con `convs.length === 0`, y un ticket NACIDO en la app nunca
    // tiene conversaciones de Zoho: la condición se cumplía SIEMPRE y la ruta esperaba a una llamada a
    // Zoho en cada apertura, por un ticket que Zoho ni siquiera conoce. El compositor lo distingue por
    // el prefijo del id, igual que ya hace la ruta de historia.
    if (primero.sincronizarConZoho === 'ahora') {
      // El `await` va dentro de un `try` —antes no lo estaba— para que un Zoho caído degrade a servir
      // lo que haya en local en vez de tumbar la petición con un 500.
      try { await sync.syncConversations(id) } catch (err) { req.log.warn({ err, ticketId: id }, 'syncConversations (lazy) falló') }
      res.json((await getConversacionTicket(db, id)).mensajes)
      return
    }
    if (primero.sincronizarConZoho === 'en-segundo-plano') {
      void sync.syncConversations(id).catch((err) => req.log.warn({ err, ticketId: id }, 'syncConversations bg falló'))
    }
    res.json(primero.mensajes)
  }))

  app.get('/api/tickets/:id/history', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const primero = await getHistorialTicket(db, id)
    // Un ticket NACIDO en la app no existe en Zoho: preguntarle por su historia sería un 404 en cada
    // apertura. Ojo con el matiz, que ya se coló una vez: "nacido en la app" no es lo mismo que
    // "gestionado por la app" —un ticket de Zoho movido aquí queda `managed_by_app=true` y sigue
    // teniendo historia en Zoho que refrescar—; el compositor lo distingue por el id.
    // Antes bastaba con mirar si la historia venía vacía, pero con la unión eso ya no distingue nada
    // —siempre trae al menos la transición de creación—.
    if (primero.sincronizarConZoho === 'ahora') {
      try { await sync.syncTicketHistory(id) } catch (err) { req.log.warn({ err, ticketId: id }, 'syncTicketHistory (lazy) falló') }
      res.json((await getHistorialTicket(db, id)).eventos)
      return
    }
    if (primero.sincronizarConZoho === 'en-segundo-plano') {
      void sync.syncTicketHistory(id).catch((err) => req.log.warn({ err, ticketId: id }, 'syncTicketHistory bg falló'))
    }
    res.json(primero.eventos)
  }))

  app.get('/api/tickets/:id/activities', asyncHandler(async (req, res) => {
    res.json(await getActivities(db, String(req.params.id)))
  }))

  // Ejecuta una transición del Blueprint escribiendo en Postgres (Subsistema B).
  app.post('/api/tickets/:id/transition', asyncHandler(async (req, res) => {
    res.json(await executeTransition(db, String(req.params.id), req.body, req.user!))
  }))

  app.post('/api/tickets/:id/reply', guardWrites, requireArea, asyncHandler(async (req, res) => {
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
      // A partir de aquí el correo YA SALIÓ, así que nada puede devolver un error: un 500 hacía que
      // el usuario leyera "falló" sobre algo que sí se envió, y el reintento natural mandaba un
      // segundo correo al cliente. El refresco es una comodidad —el hilo se recompone al abrir el
      // ticket— y degrada a un aviso en el log, como ya hacía la ruta de historia.
      try {
        await sync.syncConversations(id)
      } catch (err) {
        req.log.warn({ err, ticketId: id }, 'syncConversations tras el reply falló (el correo sí salió)')
      }
      res.json({ ok: true })
  }))
}
