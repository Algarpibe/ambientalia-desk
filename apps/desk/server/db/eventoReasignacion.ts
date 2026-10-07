import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { HistoryEvent } from '@ambientalia/shared'
import { reasignacionesDelTicket, type Reasignacion } from './reasignaciones'

/**
 * La línea del historial para una reasignación (trazas RQ-TZ-20): «Reasignación: Ana → Beto», con De, A, Motivo y
 * Reasignado por. Puro y derivado al leer, como `lineaTraspaso`: no consulta, no escribe y no crea avisos.
 *
 * Origen nulo se lee «Sin derivar». Un id que no resuelve se enseña crudo a propósito (mismo criterio que
 * `camposDiligenciados`): no debería pasar, porque `usosDeUsuario` impide borrar a quien figura aquí, y verlo es lo único
 * que permitiría diagnosticarlo. `reasignadoPor` ya es un nombre, no un id: no se traduce.
 */
export function eventoReasignacion(r: Reasignacion, nombres: Map<string, string>): HistoryEvent {
  const de = r.de == null ? 'Sin derivar' : (nombres.get(r.de) ?? r.de)
  const a = nombres.get(r.a) ?? r.a
  return {
    eventName: 'AppReasignacion',
    time: r.reasignadoAt,
    actor: r.reasignadoPor,
    title: `Reasignación: ${de} → ${a}`,
    details: [{ label: 'De', value: de }, { label: 'A', value: a }, { label: 'Motivo', value: r.motivo }, { label: 'Reasignado por', value: r.reasignadoPor }],
  }
}

/**
 * Las reasignaciones de un ticket como eventos del historial. Los nombres se piden con `SELECT id, name FROM users` SOLO
 * si el ticket tiene alguna: abrir el historial de un ticket que nunca se reasignó no paga esa consulta (molde de
 * `nombresDerivados`; sin `ANY($1)`, pg-mem no tipa los arrays enlazados).
 */
export async function eventosReasignacion(db: Queryable, ticketId: string): Promise<HistoryEvent[]> {
  const filas = await reasignacionesDelTicket(db, ticketId)
  if (filas.length === 0) return []
  const r = await db.query('SELECT id, name FROM users')
  const nombres = new Map((r.rows as Array<Record<string, unknown>>).map((x) => [String(x.id), String(x.name)]))
  return filas.map((f) => eventoReasignacion(f, nombres))
}
