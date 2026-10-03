import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { getActiveTickets } from '../db/ticketsConCliente'
import { puedeFijarPrioridadTop5, prioridadClienteDelCuerpo, ajusteDelCuerpo, prioridadTop5, esDeMisTickets } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { filaPrioridadCliente, listarTop5, fijarPrioridadCliente, ticketParaAjuste, ajustesDelTicket, ajustarPrioridad } from '../db/prioridadCliente'
import { colaDelTaller } from '../db/colaTaller'

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
    res.json(await fijarPrioridadCliente(db, { clientId, top5: cuerpo.top5, prioridad: cuerpo.prioridad, por: user.name }))
  }))

  // AJUSTE POR TICKET (RQ-TC-29). Escalera: A el ticket no existe (404) < B1 el cliente no es Top 5 o el ticket no tiene
  // cliente (409, S-8) < B2 sin permiso (403) < C contenido (422, todos los errores en `errors[]`). B1 antes que B2 sigue el
  // precedente «estado antes que permiso» (`ticketService.test.ts:137-141`).
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
    // B1 · estado: el cliente ha de ser Top 5
    if (!t.clientId) { res.status(409).json({ error: 'El ticket no tiene cliente: no se puede ajustar su prioridad' }); return }
    if (prioridadTop5(await filaPrioridadCliente(db, t.clientId)) === null) { res.status(409).json({ error: 'El cliente del ticket no es Top 5: la prioridad sólo se ajusta a mano en los Top 5' }); return }
    // B2 · permiso
    if (!puedeFijarPrioridadTop5(user)) { res.status(403).json({ error: 'Ajustar la prioridad de un ticket requiere el área Comercial y el cargo Director Comercial' }); return }
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
  app.get('/api/mis-tickets', requireAuth(db), asyncHandler(async (req, res) => {
    const yo = req.user!.id
    res.json((await colaDelTaller(db, await getActiveTickets(db, yo))).filter((t) => esDeMisTickets(t, yo)))
  }))
}
