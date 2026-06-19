import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import { createMeasurer } from './measure'
import { createDetailBackfiller } from './backfill'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { registerAuthRoutes } from './auth/routes'
import { registerTicketRoutes } from './routes/tickets'
import { requireAuth, requireAdmin as requireSuperAdmin } from './auth/middleware'
import { searchClients, searchSalesOrders, getClient } from '@ambientalia/zoho-sync/books/repo'
import { getContacts, getAccounts, getContactDetail, getAccountDetail } from './db/directory'
import { searchEquipos, createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull, deleteEquipo, getEquipoHistorial } from './db/equipos'
import { getAnalisisRows, rangeToFromTo } from './analisis'
import { computeAnalisis } from '@ambientalia/shared'
import { backfillSerialFromSubject } from './backfillSerial'
import { getAllActivities } from '@ambientalia/zoho-sync/db/activities'
import { asyncHandler } from './util/asyncHandler'
import { HttpError } from './util/httpError'

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(2)} ${units[i]}`
}

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

  registerTicketRoutes(app, { db, sync, zohoFetch, config })

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

  // Manejador central de errores: registra el error real pero NO lo filtra al cliente.
  // (Express identifica los error-handlers por su aridad de 4 args; `_next` debe existir.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) { res.status(err.status).json(err.body); return }
    console.error('Error no manejado:', err)
    if (res.headersSent) return
    res.status(500).json({ error: 'Error interno' })
  })

  return app
}
