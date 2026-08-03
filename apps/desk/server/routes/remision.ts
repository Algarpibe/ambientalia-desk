import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { RemisionNueva } from '@ambientalia/shared'
import { perfilChecklist } from '@ambientalia/shared'
import { getTicketWithRefs } from '@ambientalia/zoho-sync/db/repo'
import { getEquipoFull } from '../db/equipos'
import { getChecklist } from './../db/remisionChecklist'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

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
    }
    res.json(payload)
  }))
}
