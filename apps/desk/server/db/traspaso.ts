import type { HistoryEvent } from '@ambientalia/shared'
import { areasSiguientes, catalogoDelTicket, CLAVE_DERIVACION, ID_TRANSICION_MIGRACION } from '@ambientalia/shared'
import { esCreacion, iso, json } from './ticketFuentes'

/**
 * La línea de traspaso del historial (RQ-TZ-18): de quién a quién pasó el ticket en una transición.
 * Puro y derivado al leer: no consulta, no escribe y no crea avisos (RQ-AV-18).
 *
 * Origen y destino van en `title` y `details`, no en `actor`: el panel pinta hora, título y detalles.
 * Las etiquetas son «De» y «A», nunca «Derivado a», que ya usa el campo de la transición.
 *
 * Destino: la persona de `values.derivado_a` (por nombre; un id que no resuelve se enseña crudo) o, si no hay,
 * las áreas siguientes del estado de llegada. `areasSiguientes` se llama directa, sin restar las áreas de quien
 * actuó —la fila guarda su nombre, no sus áreas—, así que «Comercial → Comercial» también sale.
 *
 * Devuelve cero o un evento. `fila` necesita transition_id, transition_name, to_status, performed_by,
 * performed_at y values; `ticket.classification` es la ACTUAL del ticket (mismo límite que «Cliente» en la creación).
 */
export function lineaTraspaso(
  fila: Record<string, unknown>,
  nombres: Map<string, string>,
  ticket: { classification?: unknown },
): HistoryEvent[] {
  // El orden importa: la creación y el marcador de F1F-01 no son traspasos, y el marcador puede llevar destino.
  if (esCreacion(fila)) return []
  if (fila.transition_id === ID_TRANSICION_MIGRACION) return []

  const derivado = json(fila.values)[CLAVE_DERIVACION]
  const id = derivado == null ? '' : String(derivado).trim()
  const destino = id
    ? (nombres.get(id) ?? id)
    : typeof fila.to_status === 'string'
      ? areasSiguientes(fila.to_status, catalogoDelTicket({ classification: String(ticket.classification ?? ''), status: fila.to_status })).join(', ')
      : ''
  if (!destino) return []

  const origen = (fila.performed_by as string) ?? 'App'
  const etapa = String(fila.transition_name ?? '').trim()
  return [{
    eventName: 'AppTraspaso',
    time: iso(fila.performed_at),
    actor: origen,
    title: `Traspaso: ${origen} → ${destino}`,
    details: [{ label: 'De', value: origen }, { label: 'A', value: destino }, ...(etapa ? [{ label: 'Por la etapa', value: etapa }] : [])],
  }]
}
