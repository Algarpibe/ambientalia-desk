import type { Express } from 'express'
import multer from 'multer'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { RemisionNueva } from '@ambientalia/shared'
import { perfilChecklist } from '@ambientalia/shared'
import { getTicketWithRefs } from '@ambientalia/zoho-sync/db/repo'
import { getEquipoFull } from '../db/equipos'
import { getChecklist, hayChecklist } from '../db/remisionChecklist'
import { createRemision, getRemision, listRemisionesByTicket, addFoto, listFotos, getFotoContent } from '../db/remisiones'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

// Mismo criterio que los adjuntos de resolución: solo imágenes, y SVG fuera (permite script embebido).
const TIPOS_FOTO = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * Rutas de remisiones. Van bajo `/api/remisiones` y no bajo `/api/tickets/:id/…` a propósito: el
 * callback que n8n usará para avisar del resultado NO puede autenticarse con la cookie de sesión,
 * así que este grupo necesita su propio criterio de acceso por ruta.
 */
export function registerRemisionRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  /**
   * Datos con los que abrir el formulario de remisión de entrada ya prellenado.
   *
   * Todo se resuelve en el servidor a partir del ticket: el navegador solo manda el id. Los datos del
   * equipo salen de `equipos` (la fuente de verdad) y no de las columnas del ticket, que son una copia
   * tomada al crearlo; si el equipo se corrigió después, manda el registro del equipo. Cuando el ticket
   * no tiene `equipo_id` —los históricos de Zoho— se cae a esas columnas para no dejar la remisión sin datos.
   */
  app.get('/api/remisiones/nueva', requireAuth(db), asyncHandler(async (req, res) => {
    const ticketId = String(req.query.ticketId ?? '')
    if (!ticketId) { res.status(400).json({ error: 'Falta ticketId' }); return }
    const found = await getTicketWithRefs(db, ticketId)
    if (!found) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    const { row, refs } = found

    const eq = row.equipo_id ? await getEquipoFull(db, row.equipo_id) : null
    const equipo = {
      id: eq?.id ?? row.equipo_id ?? null,
      serial: eq?.serial ?? row.serial ?? null,
      marca: eq?.marca ?? row.marca ?? null,
      modelo: eq?.modelo ?? row.modelo ?? null,
      tipo: eq?.tipo ?? row.equipo ?? null,
    }
    const perfil = perfilChecklist(equipo.marca, equipo.modelo)
    const payload: RemisionNueva = {
      ticketId: row.id,
      ticketNumber: String(row.number),
      cliente: refs.accountName ?? null,
      equipo,
      tipoServicio: row.tipo_servicio ?? null,
      perfil,
      incluye: await getChecklist(db, perfil),
      catalogoCargado: await hayChecklist(db),
    }
    res.json(payload)
  }))

  /** Remisiones ya registradas de un ticket, con sus fotos. Alimenta el panel del detalle. */
  app.get('/api/remisiones', requireAuth(db), asyncHandler(async (req, res) => {
    const ticketId = String(req.query.ticketId ?? '')
    if (!ticketId) { res.status(400).json({ error: 'Falta ticketId' }); return }
    const items = await listRemisionesByTicket(db, ticketId)
    res.json(await Promise.all(items.map(async (r) => ({ ...r, fotos: await listFotos(db, r.id) }))))
  }))

  /**
   * Registra la remisión. Queda en `pendiente`: el disparo al flujo de n8n llega después, y el
   * resultado lo escribirá el callback. Las fotos se suben aparte, contra la remisión ya creada.
   */
  app.post('/api/remisiones', requireAuth(db), asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    const ticketId = b.ticketId ? String(b.ticketId) : ''
    if (!ticketId) { res.status(422).json({ error: 'Falta el ticket' }); return }
    const found = await getTicketWithRefs(db, ticketId)
    if (!found) { res.status(422).json({ error: 'Ticket no encontrado' }); return }
    const fecha = b.fecha ? String(b.fecha).slice(0, 10) : ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { res.status(422).json({ error: 'Fecha inválida' }); return }

    // El equipo y el perfil se recalculan aquí, no se aceptan del navegador: son los que deciden
    // qué checklist aplica, y confiar en el cliente permitiría remisionar con la lista equivocada.
    const eq = found.row.equipo_id ? await getEquipoFull(db, found.row.equipo_id) : null
    const marca = eq?.marca ?? found.row.marca ?? null
    const modelo = eq?.modelo ?? found.row.modelo ?? null
    const perfil = perfilChecklist(marca, modelo)

    // Solo se aceptan ítems que estén de verdad en el checklist del perfil.
    const validos = new Set(await getChecklist(db, perfil))
    const pedidos = Array.isArray(b.incluye) ? b.incluye.map(String) : []
    const desconocidos = pedidos.filter((i) => !validos.has(i))
    if (desconocidos.length) { res.status(422).json({ error: `Ítems fuera del checklist: ${desconocidos.join(', ')}` }); return }

    const id = await createRemision(db, {
      ticketId, fecha, tipoServicio: found.row.tipo_servicio ?? null, perfil,
      equipoId: eq?.id ?? found.row.equipo_id ?? null, serial: eq?.serial ?? found.row.serial ?? null,
      incluye: pedidos, observaciones: b.observaciones ? String(b.observaciones) : null,
      creadoPor: req.user?.name ?? null,
    })
    res.status(201).json(await getRemision(db, id))
  }))

  app.post('/api/remisiones/:id/fotos', requireAuth(db), upload.single('file'), asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    if (!(await getRemision(db, id))) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    const f = req.file
    if (!f) { res.status(400).json({ error: 'Falta el archivo' }); return }
    if (!TIPOS_FOTO.has(f.mimetype)) { res.status(415).json({ error: 'Tipo de imagen no permitido' }); return }
    res.status(201).json(await addFoto(db, {
      remisionId: id, filename: f.originalname, contentType: f.mimetype,
      contentB64: f.buffer.toString('base64'), size: f.size,
    }))
  }))

  app.get('/api/remisiones/:id/fotos/:fotoId', requireAuth(db), asyncHandler(async (req, res) => {
    const c = await getFotoContent(db, String(req.params.id), String(req.params.fotoId))
    if (!c) { res.status(404).json({ error: 'No encontrada' }); return }
    res.set('Content-Type', c.contentType)
    res.set('X-Content-Type-Options', 'nosniff')
    res.send(Buffer.from(c.contentB64, 'base64'))
  }))
}
