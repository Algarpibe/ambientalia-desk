import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import { getActiveTickets, getAllTickets, getTicketWithRefs, getConversations, applyTransition, createTicket, setTicketRead } from '@ambientalia/zoho-sync/db/repo'
import { rowToTicket, rowToTicketDetail, rowToMessage } from '@ambientalia/zoho-sync/db/mappers'
import { createMeasurer } from './measure'
import { createDetailBackfiller } from './backfill'
import { transitionById } from '@ambientalia/shared'
import { canExecuteTransition } from '@ambientalia/shared'
import { buildTransitionPlan } from './transitionExec'
import { TRANSITION_ACTOR } from './transitionActor'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { registerAuthRoutes } from './auth/routes'
import { requireAuth, requireAdmin as requireSuperAdmin } from './auth/middleware'
import { searchClients, searchSalesOrders, getClient, getSalesOrder } from '@ambientalia/zoho-sync/books/repo'
import { getContacts, getAccounts, getContactDetail, getAccountDetail } from './db/directory'
import { searchEquipos, getEquipo, createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull, deleteEquipo, getEquipoHistorial } from './db/equipos'
import { buildSubject, buildCodigoServicio, PREFIJOS } from '@ambientalia/shared'
import { getAnalisisRows, rangeToFromTo } from './analisis'
import { computeAnalisis } from '@ambientalia/shared'
import { backfillSerialFromSubject } from './backfillSerial'
import { getActivities, getAllActivities } from '@ambientalia/zoho-sync/db/activities'
import multer from 'multer'
import { getResolution, saveResolution, addResolutionAttachment, getResolutionAttachmentContent, deleteResolutionAttachment, deleteResolution } from './db/resolutions'
import { getTicketHistory } from '@ambientalia/zoho-sync/db/history'

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(2)} ${units[i]}`
}

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { fn(req, res, next).catch(next) }

interface Deps {
  db: Queryable
  zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>
  sync: Sync
  config: AppConfig
}

export function createApp({ db, zohoFetch, sync, config }: Deps): Express {
  const app = express()
  app.set('trust proxy', 1) // detrás del proxy de EasyPanel → IP real para el rate-limit
  app.use(helmet({ contentSecurityPolicy: false })) // CSP afinada = deuda (no romper el SPA)
  app.use(express.json())
  app.use(cookieParser())
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
    skipSuccessfulRequests: true, message: { error: 'Demasiados intentos, intenta más tarde' },
  })
  app.use('/api/auth/login', loginLimiter)
  app.use('/api/auth/change-password', loginLimiter)
  registerAuthRoutes(app, db)

  const measurer = createMeasurer({ zohoFetch, config })
  const detailBackfiller = createDetailBackfiller({ zohoFetch, sync, config })

  const requireAdmin = (req: Request, res: Response): boolean => {
    if (!config.adminToken || req.query.token !== config.adminToken) {
      res.status(403).json({ error: 'No autorizado' })
      return false
    }
    return true
  }

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
  app.delete('/api/tickets/:id/resolution/attachments/:attId', asyncHandler(async (req, res) => {
    await deleteResolutionAttachment(db, String(req.params.id), String(req.params.attId)); res.status(204).end()
  }))
  app.delete('/api/tickets/:id/resolution', asyncHandler(async (req, res) => {
    await deleteResolution(db, String(req.params.id)); res.status(204).end()
  }))

  app.get('/api/tickets', asyncHandler(async (req, res) => {
    const list = req.query.scope === 'all' ? await getAllTickets(db, req.user!.id) : await getActiveTickets(db, req.user!.id)
    res.json(list.map(({ row, refs }) => rowToTicket(row, refs)))
  }))

  app.post('/api/tickets/:id/read', asyncHandler(async (req, res) => {
    await setTicketRead(db, req.user!.id, String(req.params.id), !!req.body?.read)
    res.json({ ok: true })
  }))

  // Crea un ticket gestionado por la app en "OV asignada" (Subsistema C). Pivota opcionalmente en una OV de Books.
  app.post('/api/tickets', asyncHandler(async (req, res) => {
      const b = (req.body ?? {}) as Record<string, unknown>
      const equipoId = b.equipoId ? String(b.equipoId) : ''
      if (!equipoId) { res.status(422).json({ error: 'Falta el equipo' }); return }
      const equipo = await getEquipo(db, equipoId)
      if (!equipo) { res.status(422).json({ error: 'Equipo no registrado' }); return }

      let clientId: string | null = b.clientId ? String(b.clientId) : null
      let ordenVenta: string | null = b.ordenVenta ? String(b.ordenVenta) : null
      let salesorderId: string | null = null
      if (b.salesOrderId) {
        const ov = await getSalesOrder(db, String(b.salesOrderId))
        if (!ov) { res.status(422).json({ error: 'Orden de venta no encontrada' }); return }
        salesorderId = ov.id
        clientId = clientId ?? ov.clientId ?? null
        ordenVenta = ordenVenta ?? ov.number ?? null
      }
      const tipoServicio = b.tipoServicio ? String(b.tipoServicio) : ''
      const clasificaciones = b.clasificaciones ? String(b.clasificaciones) : ''
      const prefijo = b.prefijo ? String(b.prefijo) : ''
      const missing: string[] = []
      if (!clientId) missing.push('cliente')
      if (!tipoServicio) missing.push('tipo de servicio')
      if (!clasificaciones) missing.push('clasificaciones')
      if (!prefijo || !(PREFIJOS as readonly string[]).includes(prefijo)) missing.push('prefijo')
      if (missing.length) { res.status(422).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}` }); return }
      const cliente = await getClient(db, clientId!)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const codigoServicio = b.codigoServicio ? String(b.codigoServicio) : buildCodigoServicio({ prefijo, serie: equipo.serial, modelo: equipo.modelo ?? '', fecha: new Date() })
      const subject = b.subject ? String(b.subject) : buildSubject({ cliente: cliente.name, tipoEquipo: equipo.tipo ?? '', codigo: codigoServicio })
      const id = await createTicket(db, {
        subject, codigoServicio, classification: clasificaciones, tipoServicio, equipo: equipo.tipo ?? null,
        marca: equipo.marca ?? null, modelo: equipo.modelo ?? null, serial: equipo.serial,
        ordenVenta, priority: b.prioridad ? String(b.prioridad) : null,
        clientId: clientId!, salesorderId, equipoId: equipo.id, actor: req.user?.name ?? 'App',
      })
      const created = await getTicketWithRefs(db, id)
      res.status(201).json(created ? rowToTicketDetail(created.row, created.refs) : {})
  }))

  app.get('/api/tickets/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    try { await sync.syncTicket(id) } catch (e) { console.error(`syncTicket(${id}) falló:`, e) }
    const found = await getTicketWithRefs(db, id)
    if (!found) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    res.json(rowToTicketDetail(found.row, found.refs))
  }))

  app.get('/api/tickets/:id/conversations', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    let convs = await getConversations(db, id)
    if (convs.length === 0) { await sync.syncConversations(id); convs = await getConversations(db, id) }
    res.json(convs.map(({ row, attachments }) => rowToMessage(row, attachments)))
  }))

  app.get('/api/tickets/:id/history', asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    try { await sync.syncTicketHistory(id) } catch (e) { console.error(`syncTicketHistory(${id}) falló:`, e) }
    res.json(await getTicketHistory(db, id))
  }))

  app.get('/api/tickets/:id/activities', asyncHandler(async (req, res) => {
    res.json(await getActivities(db, String(req.params.id)))
  }))

  // Mide cantidad/tamaño total de adjuntos (sin descargarlos). Protegido por ADMIN_TOKEN.
  // Llamar repetidamente para ver el progreso; ?restart=1 reinicia la medición.
  app.get('/api/admin/measure-attachments', (req, res) => {
    if (!requireAdmin(req, res)) return
    if (req.query.restart === '1' || (!measurer.state().running && !measurer.state().done)) {
      measurer.start()
    }
    const s = measurer.state()
    res.json({ ...s, totalHuman: humanBytes(s.totalBytes) })
  })

  // Pre-puebla detalle (customFields) + conversaciones de TODOS los tickets en la BD.
  // Token-protegido, segundo plano, throttled. ?restart=1 reinicia.
  app.get('/api/admin/backfill-details', (req, res) => {
    if (!requireAdmin(req, res)) return
    if (req.query.restart === '1' || (!detailBackfiller.state().running && !detailBackfiller.state().done)) {
      detailBackfiller.start()
    }
    res.json(detailBackfiller.state())
  })

  // Búsqueda de clientes/órdenes de venta (Books) para los selectores de creación de tickets.
  // Requieren sesión: son datos de negocio. Cada uno con su propio requireAuth (no van bajo /api/tickets).
  app.get('/api/clients', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await searchClients(db, String(req.query.search ?? '')))
  }))

  app.get('/api/sales-orders', requireAuth(db), asyncHandler(async (req, res) => {
    const clientId = req.query.clientId ? String(req.query.clientId) : undefined
    res.json(await searchSalesOrders(db, String(req.query.search ?? ''), clientId))
  }))

  app.get('/api/activities', requireAuth(db), asyncHandler(async (req, res) => {
    const filter = String(req.query.filter ?? 'todas')
    const search = String(req.query.search ?? '')
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 300))
    res.json(await getAllActivities(db, { filter, search, limit }))
  }))

  app.get('/api/contacts', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await getContacts(db))
  }))
  app.get('/api/accounts', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await getAccounts(db))
  }))
  app.get('/api/contacts/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const d = await getContactDetail(db, String(req.params.id)); if (!d) { res.status(404).json({ error: 'No encontrado' }); return } res.json(d)
  }))
  app.get('/api/accounts/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const d = await getAccountDetail(db, String(req.params.id)); if (!d) { res.status(404).json({ error: 'No encontrado' }); return } res.json(d)
  }))

  app.get('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await searchEquipos(db, String(req.query.search ?? '')))
  }))

  app.get('/api/equipos/manage', requireAuth(db), asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const items = await listEquiposManage(db, String(req.query.search ?? ''), 50, (page - 1) * 50)
    res.json({ items, page })
  }))

  app.get('/api/equipos/facets', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await equipoFacets(db))
  }))

  app.get('/api/equipos/:id/historial', requireAuth(db), asyncHandler(async (req, res) => {
    const h = await getEquipoHistorial(db, String(req.params.id))
    if (!h) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
    res.json(h)
  }))

  app.post('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
      const b = (req.body ?? {}) as Record<string, unknown>
      const serial = b.serial ? String(b.serial).trim() : ''
      const clientId = b.clientId ? String(b.clientId) : ''
      if (!serial) { res.status(422).json({ error: 'El número de serie es obligatorio' }); return }
      if (!clientId) { res.status(422).json({ error: 'El cliente es obligatorio' }); return }
      const cliente = await getClient(db, clientId)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const id = await createEquipo(db, {
        serial, marca: b.marca ? String(b.marca) : null, modelo: b.modelo ? String(b.modelo) : null,
        tipo: b.tipo ? String(b.tipo) : null, clienteNombre: cliente.name, clientId,
      })
      res.status(201).json(await getEquipoFull(db, id))
  }))

  app.patch('/api/equipos/:id', requireAuth(db), asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      const b = (req.body ?? {}) as Record<string, unknown>
      const patch: Record<string, unknown> = {}
      if (b.serial !== undefined) patch.serial = String(b.serial).trim()
      if (b.marca !== undefined) patch.marca = b.marca ? String(b.marca) : null
      if (b.modelo !== undefined) patch.modelo = b.modelo ? String(b.modelo) : null
      if (b.tipo !== undefined) patch.tipo = b.tipo ? String(b.tipo) : null
      if (b.clientId !== undefined && b.clientId) {
        const cliente = await getClient(db, String(b.clientId))
        if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
        patch.clientId = String(b.clientId); patch.clienteNombre = cliente.name
      }
      if (Object.keys(patch).length) await updateEquipo(db, id, patch)
      if (b.active !== undefined) await setEquipoActive(db, id, Boolean(b.active))
      res.json(await getEquipoFull(db, id))
  }))

  // Borrado físico de un equipo: SOLO super administrador.
  app.delete('/api/equipos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      await deleteEquipo(db, id)
      res.json({ ok: true })
  }))

  app.get('/api/analisis', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
      const { from, to } = rangeToFromTo(String(req.query.range ?? 'todo'), new Date())
      const rows = await getAnalisisRows(db)
      res.json(computeAnalisis(rows, from, to))
  }))

  // Backfill puntual: rellena serial/código de servicio (columnas vacías) extrayéndolos del asunto.
  // Solo tickets NO gestionados por la app; idempotente. SOLO super administrador.
  app.post('/api/admin/backfill-serial', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
      res.json(await backfillSerialFromSubject(db))
  }))

  // Backfill de tickets archivados en segundo plano (fire-and-forget). SOLO super administrador.
  app.post('/api/admin/backfill-archived', requireAuth(db), requireSuperAdmin, (_req, res) => {
    sync.backfillArchivedTickets()
      .then((n) => console.log(`Backfill archivados: ${n} tickets`))
      .catch((e) => console.error('Backfill archivados falló:', e))
    res.json({ started: true })
  })

  // Proxy autenticado para descargar adjuntos de Zoho (el href real requiere OAuth + orgId).
  // Requiere sesión: son documentos de clientes (facturas, fotos, etc.).
  app.get('/api/attachment', requireAuth(db), asyncHandler(async (req, res) => {
    const path = String(req.query.path ?? '')
    // Solo rutas de adjuntos de tickets (evita SSRF a rutas arbitrarias de la API).
    if (!/^\/tickets\/\d+\/(comments|threads)\/\d+\/attachments\/\d+\/content$/.test(path)) {
      res.status(400).json({ error: 'Ruta de adjunto inválida' })
      return
    }
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
  }))

  // Ejecuta una transición del Blueprint escribiendo en Postgres (Subsistema B).
  app.post('/api/tickets/:id/transition', asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      const t = transitionById(String(req.body.transitionId))
      if (!t) { res.status(400).json({ error: 'Transición desconocida' }); return }
      const current = await getTicketWithRefs(db, id)
      if (!current) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
      if (!t.from.includes(current.row.status)) {
        res.status(409).json({ error: `La transición "${t.name}" no aplica desde el estado "${current.row.status}"` })
        return
      }
      if (!canExecuteTransition(req.user!.areas, req.user!.isAdmin, t.area)) {
        res.status(403).json({ error: `Tu rol no tiene permiso para esta transición (área: ${t.area})` })
        return
      }
      const values = (req.body.values ?? {}) as Record<string, unknown>
      const plan = buildTransitionPlan(t, values)
      if (plan.errors.length) { res.status(422).json({ errors: plan.errors }); return }
      const actor = req.user?.name ?? TRANSITION_ACTOR
      await applyTransition(db, id, current.row.status, { id: t.id, name: t.name, area: t.area }, plan, actor, values)
      const updated = await getTicketWithRefs(db, id)
      res.json(updated ? rowToTicketDetail(updated.row, updated.refs) : {})
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

  // Manejador central de errores: registra el error real pero NO lo filtra al cliente.
  // (Express identifica los error-handlers por su aridad de 4 args; `_next` debe existir.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error no manejado:', err)
    if (res.headersSent) return
    res.status(500).json({ error: 'Error interno' })
  })

  return app
}
