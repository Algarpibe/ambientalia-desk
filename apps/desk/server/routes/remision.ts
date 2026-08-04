import type { Express } from 'express'
import multer from 'multer'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { RemisionNueva } from '@ambientalia/shared'
import { perfilChecklist } from '@ambientalia/shared'
import { getTicketWithRefs } from '@ambientalia/zoho-sync/db/repo'
import { getEquipoFull } from '../db/equipos'
import { getChecklist, hayChecklist } from '../db/remisionChecklist'
import { createRemision, getRemision, listRemisionesByTicket, addFoto, listFotos, getFotoContent, setResultadoRemision, reclamarEnvio, liberarEnvio, listFotosConContenido } from '../db/remisiones'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { buildRemisionPayload, dispararRemision } from '../remisionWebhook'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
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
export function registerRemisionRoutes(app: Express, deps: { db: Queryable; config: AppConfig }): void {
  const { db, config } = deps

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
   * Una remisión con sus fotos. La sondea el formulario mientras espera el desenlace de n8n, que
   * llega por el callback y puede tardar decenas de segundos.
   *
   * Va DESPUÉS de `/api/remisiones/nueva`: registrada antes, `:id` se tragaría esa ruta.
   */
  app.get('/api/remisiones/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const r = await getRemision(db, String(req.params.id))
    if (!r) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    res.json({ ...r, fotos: await listFotos(db, r.id) })
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
    // NO se dispara el flujo aquí: las fotos se suben después, contra la remisión ya creada, así
    // que en este punto todavía no existen y el documento saldría sin ellas. El envío es un paso
    // explícito (`/enviar`) que el formulario invoca cuando ya ha subido todo.
    res.status(201).json(await getRemision(db, id))
  }))

  /**
   * Envía la remisión al flujo de n8n. Paso separado de la creación porque las fotos se suben
   * después: dispararlo al crear mandaba el documento sin registro fotográfico.
   *
   * No espera al trabajo — n8n responde 202 en cuanto valida — y si el disparo falla la remisión
   * sigue guardada en `pendiente`, así que se puede reintentar sin rehacer el formulario.
   */
  app.post('/api/remisiones/:id/enviar', requireAuth(db), asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const rem = await getRemision(db, id)
    if (!rem) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    // Reenviar una remisión ya cerrada generaría un segundo documento y una segunda carpeta en Drive
    // para el mismo equipo. Solo se reenvía lo que no llegó a buen puerto.
    if (rem.estado === 'ok' || rem.estado === 'ok_con_avisos') {
      res.status(409).json({ error: 'Esta remisión ya se envió' }); return
    }
    // Reclamación atómica: cubre el reintento tras perder cobertura justo después de un disparo que
    // sí salió bien, y el doble clic o las dos pestañas. Leer el estado y decidir no es suficiente,
    // porque dos peticiones simultáneas pasarían las dos esa comprobación.
    if (!(await reclamarEnvio(db, id))) {
      res.status(409).json({ error: 'Esta remisión se envió hace un momento; espera a que termine.' }); return
    }
    // Solo las remisiones creadas desde la app llegan aquí en estado enviable: las históricas sin
    // ticket ya entraron como 'ok' y nunca pasan por /enviar, pero el tipo ahora admite NULL.
    if (!rem.ticketId) { res.status(422).json({ error: 'Remisión sin ticket asociado' }); return }
    const found = await getTicketWithRefs(db, rem.ticketId)
    if (!found) { res.status(422).json({ error: 'Ticket no encontrado' }); return }

    const eq = rem.equipoId ? await getEquipoFull(db, rem.equipoId) : null
    const cliente = found.row.client_id ? await getClient(db, found.row.client_id) : null
    const payload = buildRemisionPayload({
      remision: rem, ticketNumero: String(found.row.number), cliente, equipo: eq,
      usuario: { name: req.user!.name, email: req.user!.email, cargo: req.user!.cargo ?? null },
      fotos: await listFotosConContenido(db, id),
    })
    const r = await dispararRemision(config, payload)
    if (!r.disparado) {
      // Sin soltar la reclamación, un webhook mal configurado obligaría a esperar toda la ventana de
      // reenvío (`VENTANA_REENVIO_SEGUNDOS`, ver db/remisiones.ts) para poder reintentar, aunque el
      // disparo ni siquiera llegó a salir.
      await liberarEnvio(db, id)
      req.log?.warn(`Remisión ${id} no disparada: ${r.motivo}`)
      res.status(502).json({ error: 'No se pudo enviar a n8n', detalle: r.motivo }); return
    }
    res.json({ enviado: true })
  }))

  /**
   * Callback de n8n con el desenlace. NO usa la cookie de sesión —n8n no la tiene— sino un secreto
   * compartido en cabecera. Sin `REMISION_CALLBACK_TOKEN` configurado la ruta responde 503 en vez de
   * quedar abierta: una remisión que nadie puede cerrar es mejor que un endpoint sin autenticar.
   */
  app.post('/api/remisiones/:id/callback', asyncHandler(async (req, res) => {
    if (!config.remisionCallbackToken) { res.status(503).json({ error: 'Callback no configurado' }); return }
    if (req.get('X-Remision-Callback') !== config.remisionCallbackToken) { res.status(401).json({ error: 'No autorizado' }); return }
    const id = String(req.params.id)
    if (!(await getRemision(db, id))) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    const b = (req.body ?? {}) as { estado?: string; resultado?: unknown }
    const estado = b.estado === 'ok' || b.estado === 'ok_con_avisos' || b.estado === 'error' ? b.estado : null
    if (!estado) { res.status(422).json({ error: 'Estado inválido' }); return }
    await setResultadoRemision(db, id, estado, b.resultado ?? null)
    res.json({ ok: true })
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
