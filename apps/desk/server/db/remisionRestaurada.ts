import type { HistoryEvent } from '@ambientalia/shared'
import { iso } from './ticketFuentes'

/**
 * Eventos del historial que deja restaurar una remisión (RQ-TZ-14). Puro: lee la fila que el compositor ya
 * trae, sin consultas ni escrituras.
 *
 * `[]` si `restaurada_at` es nulo. Si no: la anulación previa —que `restaurarRemision` copia antes de vaciar
 * las columnas vigentes— y la restauración. La anulación previa reutiliza el nombre de evento y el título de
 * la vigente («Remisión anulada»), así que el panel la pinta igual. Sin `anulacion_previa_at` (restauración
 * anterior a este cambio, S-3) sólo sale la restauración.
 */
export function eventosRestauracion(fila: Record<string, unknown>): HistoryEvent[] {
  const restaurada = iso(fila.restaurada_at)
  if (!restaurada) return []
  const out: HistoryEvent[] = []
  const previa = iso(fila.anulacion_previa_at)
  if (previa) {
    const por = (fila.anulacion_previa_por as string) ?? null
    out.push({ eventName: 'RemisionAnulada', time: previa, actor: por ?? 'App', title: 'Remisión anulada', details: por ? [{ label: 'Anulada por', value: por }] : [] })
  }
  const quien = (fila.restaurada_por as string) ?? null
  out.push({ eventName: 'RemisionRestaurada', time: restaurada, actor: quien ?? 'App', title: 'Remisión restaurada', details: quien ? [{ label: 'Restaurada por', value: quien }] : [] })
  return out
}
