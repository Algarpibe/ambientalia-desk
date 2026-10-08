import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { getActiveTickets } from '../db/ticketsConCliente'
import { puedeFijarPrioridadTop5, puedeAjustarPrioridadTicket, prioridadClienteDelCuerpo, ajusteDelCuerpo, prioridadTop5, esDeMisTickets } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'; import { leerBusqueda, busquedaDe } from '../util/busquedaTickets'
import { filaPrioridadCliente, listarTop5, fijarYPropagarPrioridadCliente, ticketParaAjuste, ajustesDelTicket, ajustarPrioridad } from '../db/prioridadCliente'
import { colaDelTaller } from '../db/colaTaller'; import { listaRemisionCreada } from '../db/listaRemisionCreada'

/**
 * API de la prioridad del cliente y el Top 5 (prioridad-top5-cliente, F1B-07; `tickets-core` RQ-TC-27).
 *
 * LECTURAS (lista Top 5, prioridad de un cliente): cualquier usuario con sesión; leer no decide nada.
 *
 * ESCRITURA, escalera de F1B-10: A el cliente no existe (`404`) < B sin permiso (`403`) < C contenido (`422`).
 * El permiso es `puedeFijarPrioridadTop5` de `shared` y se CONSUME (regla invariable 13): aquí no se reescribe.
 * El botón del cliente es comodidad; la imposición es esta.
 */
export function registerPrioridadRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.get('/api/top5', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await listarTop5(db))
  }))

  app.get('/api/clients/:id/prioridad', requireAuth(db), asyncHandler(async (req, res) => {
    const clientId = String(req.params.id)
    // A · existencia
    if (!(await getClient(db, clientId))) { res.status(404).json({ error: 'Cliente no encontrado' }); return }
    res.json((await filaPrioridadCliente(db, clientId)) ?? { clientId, top5: false, prioridad: null, actualizadoPor: null, actualizadoAt: null })
  }))

  app.put('/api/clients/:id/prioridad', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const clientId = String(req.params.id)
    // A · existencia
    if (!(await getClient(db, clientId))) { res.status(404).json({ error: 'Cliente no encontrado' }); return }
    // B · permiso
    if (!puedeFijarPrioridadTop5(user)) { res.status(403).json({ error: 'Fijar la prioridad de un cliente requiere el área Comercial y el cargo Director Comercial' }); return }
    // C · contenido
    const cuerpo = prioridadClienteDelCuerpo(req.body)
    if (!cuerpo.ok) { res.status(422).json({ error: cuerpo.errors[0], errors: cuerpo.errors }); return }
    res.json(await fijarYPropagarPrioridadCliente(db, { clientId, top5: cuerpo.top5, prioridad: cuerpo.prioridad, por: user.name }))
  }))

  // AJUSTE POR TICKET (RQ-TC-29). Escalera: A el ticket no existe (404) < B sin permiso (403, `puedeAjustarPrioridadTicket`) < C contenido
  // (422, todos los errores en `errors[]`). Ya no hay `409` de «no es Top 5» ni de «sin cliente»: un ticket se ajusta en cualquier cliente o sin
  // él (prioridad-tres-niveles, S-H).
  const resumenDelTicket = async (t: { id: string; clientId: string | null; prioridad: string | null }) => {
    const fila = t.clientId ? await filaPrioridadCliente(db, t.clientId) : null
    return { ticketId: t.id, prioridad: t.prioridad, clientId: t.clientId, top5: prioridadTop5(fila) !== null, prioridadTop5: prioridadTop5(fila), ajustes: await ajustesDelTicket(db, t.id) }
  }

  app.get('/api/tickets/:id/prioridad', requireAuth(db), asyncHandler(async (req, res) => {
    const t = await ticketParaAjuste(db, String(req.params.id))
    // A · existencia
    if (!t) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    res.json(await resumenDelTicket(t))
  }))

  app.post('/api/tickets/:id/prioridad', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const t = await ticketParaAjuste(db, String(req.params.id))
    // A · existencia
    if (!t) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    // Hasta 6344b4a, B1 · estado: el ticket sin cliente y el cliente que no era Top 5 recibían 409 (S-8); la decisión
    // prioridad-tres-niveles (`p3b-prioridad-tres-niveles`: el Director Técnico ajusta en cualquier ticket) lo levantó y no queda escalón B1.
    // La escalera es A 404 < B 403 < C 422 (las dos guardas `409` se retiraron; este comentario conserva sus tres líneas).
    // B · permiso
    if (!puedeAjustarPrioridadTicket(user)) { res.status(403).json({ error: 'Ajustar la prioridad de un ticket requiere el cargo Director Comercial con el área Comercial, o el cargo Director Técnico' }); return }
    // C · contenido
    const cuerpo = ajusteDelCuerpo(req.body, t.prioridad)
    if (!cuerpo.ok) { res.status(422).json({ error: cuerpo.errors[0], errors: cuerpo.errors }); return }
    await ajustarPrioridad(db, { ticketId: t.id, de: t.prioridad, prioridad: cuerpo.prioridad, motivo: cuerpo.motivo, por: user.name })
    res.json(await resumenDelTicket({ ...t, prioridad: cuerpo.prioridad }))
  }))

  /**
   * «Mis tickets» (RQ-VT-09, E-099): los abiertos derivados al usuario, en el orden de la cola del taller. Lo ordena
   * `colaDelTaller` (la MISMA función que el tablero) y `filter` conserva ese orden; el cliente no reordena (regla 13).
   */
  app.get('/api/mis-tickets', requireAuth(db), leerBusqueda, asyncHandler(async (req, res) => {
    const yo = req.user!.id
    res.json((await colaDelTaller(db, await getActiveTickets(db, yo, busquedaDe(res)))).filter((t) => esDeMisTickets(t, yo)))
  }))
  /**
   * La lista de «Remisión creada» (RQ-VT-10, `decision/cola-del-taller-los-tres-cabos` punto 4): TODOS los tickets en ese estado,
   * del que más tiempo lleva en él al que menos, con `enEstadoDesde` calculado aquí (regla 13). Una vista: no concede permiso;
   * «Habilitar Servicio» lo sigue guardando `ticketService.ts` por estado y área. Cualquier sesión la lee, como el resto.
   */
  app.get('/api/remision-creada', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await listaRemisionCreada(db))
  }))
}
