import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { TicketWithRefs } from '@ambientalia/zoho-sync/db/repo'
import { rowToTicket } from '@ambientalia/zoho-sync/db/mappers'
import { ordenarColaTaller, type Ticket } from '@ambientalia/shared'
import { ticketsEsperandoAprobacionCliente } from './alarmasAvisadas'

/**
 * La cola del taller (F1B-07, lote 2b; `vistas-tablero` RQ-VT-09). Una vista: no escribe nada.
 *
 * `fechasHabilitacion` hace UNA consulta sea cual sea el número de tickets (sin N+1) y se queda con la ÚLTIMA
 * habilitación de cada uno, `MAX(performed_at)` (S-10a). Un ticket sin fila no aparece en el mapa y cuenta `created_time` (S-10b).
 */
export async function fechasHabilitacion(db: Queryable): Promise<Map<string, string>> {
  const r = await db.query(`SELECT ticket_id, MAX(performed_at) AS habilitado_at FROM ticket_transitions WHERE transition_id = 'habilitar_servicio' GROUP BY ticket_id`)
  const m = new Map<string, string>()
  for (const x of r.rows as Array<{ ticket_id: string; habilitado_at: string | Date }>) m.set(String(x.ticket_id), new Date(x.habilitado_at).toISOString())
  return m
}

/** Los tickets en el orden de la cola, con la marca `esperandoAprobacionCliente` (RQ-VT-07) y `habilitadoAt`. */
export async function colaDelTaller(db: Queryable, list: TicketWithRefs[]): Promise<Array<Ticket & { habilitadoAt: string | null }>> {
  const marcados = await ticketsEsperandoAprobacionCliente(db)
  const habilitados = await fechasHabilitacion(db)
  return ordenarColaTaller(list.map(({ row, refs }) => ({ ...rowToTicket(row, refs), esperandoAprobacionCliente: marcados.has(String(row.id)), habilitadoAt: habilitados.get(String(row.id)) ?? null })))
}
