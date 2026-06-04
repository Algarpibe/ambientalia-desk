import express, { type Express, type Request, type Response } from 'express'
import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import type { Sync } from './sync'
import { getActiveTickets, getTicketWithRefs, getConversations, applyTransition } from './db/repo'
import { rowToTicket, rowToTicketDetail, rowToMessage } from './db/mappers'
import { createMeasurer } from './measure'
import { createDetailBackfiller } from './backfill'
import { migrate, reseedTicketNumber } from './db/migrate'
import { transitionById } from '../shared/transitions'
import { buildTransitionPlan } from './transitionExec'
import { TRANSITION_ACTOR } from './transitionActor'
import cookieParser from 'cookie-parser'
import { registerAuthRoutes } from './auth/routes'

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
  app.use(express.json())
  app.use(cookieParser())
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

  app.get('/api/tickets', async (_req, res) => {
    try {
      const list = await getActiveTickets(db)
      res.json(list.map(({ row, refs }) => rowToTicket(row, refs)))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })

  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const id = String(req.params.id)
      try { await sync.syncTicket(id) } catch (e) { console.error(`syncTicket(${id}) falló:`, e) }
      const found = await getTicketWithRefs(db, id)
      if (!found) return res.status(404).json({ error: 'Ticket no encontrado' })
      res.json(rowToTicketDetail(found.row, found.refs))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })

  app.get('/api/tickets/:id/conversations', async (req, res) => {
    try {
      const id = String(req.params.id)
      let convs = await getConversations(db, id)
      if (convs.length === 0) { await sync.syncConversations(id); convs = await getConversations(db, id) }
      res.json(convs.map(({ row, attachments }) => rowToMessage(row, attachments)))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })

  // MIGRACIÓN one-time (Subsistema A): elimina el esquema viejo, crea el híbrido y re-puebla.
  // DESTRUCTIVO. Protegido por ADMIN_TOKEN + confirm=yes. Seguro mientras no haya tickets
  // gestionados por la app (managed_by_app); tras el Subsistema B NO usar (perdería cambios locales).
  app.get('/api/admin/recreate-schema', async (req, res) => {
    if (!requireAdmin(req, res)) return
    if (req.query.confirm !== 'yes') {
      res.status(400).json({ error: 'Falta confirm=yes (operación destructiva)' })
      return
    }
    try {
      await db.query('DROP TABLE IF EXISTS tickets, conversations, attachments, accounts, contacts, agents, ticket_transitions CASCADE')
      await db.query('DROP SEQUENCE IF EXISTS ticket_number_seq')
      await migrate(db)
      await reseedTicketNumber(db)
      res.json({ status: 'esquema recreado; backfill iniciado en segundo plano' })
      sync.backfillTickets()
        .then(async (n) => { console.log(`Recreate backfill: ${n} tickets`); await reseedTicketNumber(db) })
        .catch((e) => console.error('Recreate backfill falló:', e))
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })

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

  // Ejecuta una transición del Blueprint escribiendo en Postgres (Subsistema B).
  app.post('/api/tickets/:id/transition', async (req, res) => {
    try {
      const id = String(req.params.id)
      const t = transitionById(String(req.body.transitionId))
      if (!t) { res.status(400).json({ error: 'Transición desconocida' }); return }
      const current = await getTicketWithRefs(db, id)
      if (!current) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
      if (!t.from.includes(current.row.status)) {
        res.status(409).json({ error: `La transición "${t.name}" no aplica desde el estado "${current.row.status}"` })
        return
      }
      const values = (req.body.values ?? {}) as Record<string, unknown>
      const plan = buildTransitionPlan(t, values)
      if (plan.errors.length) { res.status(422).json({ errors: plan.errors }); return }
      await applyTransition(db, id, current.row.status, { id: t.id, name: t.name, area: t.area }, plan, TRANSITION_ACTOR, values)
      const updated = await getTicketWithRefs(db, id)
      res.json(updated ? rowToTicketDetail(updated.row, updated.refs) : {})
    } catch (err) {
      res.status(500).json({ error: String(err) })
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
