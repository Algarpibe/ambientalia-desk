import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { rowToTicket } from '@ambientalia/zoho-sync/db/mappers'
import { ordenarPorEntrada, STATUS_REMISION_CREADA, type Ticket } from '@ambientalia/shared'
import { getActiveTickets } from './ticketsConCliente'
import { entradasActuales } from './sla'

/**
 * La lista de «Remisión creada» para Comercial (F1B-07, L3; `vistas-tablero` RQ-VT-10). Una vista: no escribe nada.
 * Dos lecturas fijas sea cual sea el número de tickets (sin N+1): los activos, de los que se queda el estado, y la ÚLTIMA
 * entrada de cada uno a su estado actual con `entradasActuales`, la MISMA que mide la alarma de SLA (H5). Sin entrada,
 * `enEstadoDesde` es null y el ticket va al final. El orden lo pone `ordenarPorEntrada` (`shared`).
 */
export async function listaRemisionCreada(db: Queryable): Promise<Array<Ticket & { enEstadoDesde: string | null }>> {
  const enEstado = (await getActiveTickets(db)).filter(({ row }) => row.status === STATUS_REMISION_CREADA)
  const entradas = await entradasActuales(db, enEstado.map(({ row }) => ({ id: String(row.id), status: String(row.status) })), [STATUS_REMISION_CREADA])
  return ordenarPorEntrada(enEstado.map(({ row, refs }) => ({ ...rowToTicket(row, refs), enEstadoDesde: entradas.get(String(row.id))?.toISOString() ?? null })))
}
