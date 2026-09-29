import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ALARMAS_SLA } from '@ambientalia/shared'
import { entradasActuales } from './sla'
import { logger } from '../util/logger'

/**
 * La marca de tablero «esperando aprobación del cliente» (alarmas-horas-habiles, F1B-08; `vistas-tablero` RQ-VT-07).
 *
 * La decide el SERVIDOR (regla invariable 13) y se lee de la MARCA de la alarma, no del calendario: un ticket la
 * lleva si está en un estado cuya alarma declara `marcaTablero` y hay fila en `public.alarmas_avisadas` para su
 * entrada ACTUAL a ese estado (misma `entrada_at`, comparada por `getTime()`, como en `services/alarmasSla.ts`). Al
 * salir del estado, o al reentrar, deja de llevarla aunque la fila vieja siga ahí. Es una vista: no escribe nada.
 *
 * NUNCA lanza: ante un error deja un `warn` y devuelve el conjunto vacío, porque la marca no puede tumbar el tablero.
 */
export async function ticketsEsperandoAprobacionCliente(db: Queryable): Promise<Set<string>> {
  try {
    const estados = Object.entries(ALARMAS_SLA).filter(([, a]) => a?.marcaTablero).map(([e]) => e)
    if (estados.length === 0) return new Set()
    const m = estados.map((_, i) => `$${i + 1}`).join(', ')
    const tickets = (await db.query(`SELECT id, status FROM tickets WHERE status IN (${m})`, estados)).rows as Array<{ id: string; status: string }>
    const entradas = await entradasActuales(db, tickets, estados)
    const estadoDe = new Map(tickets.map((t) => [String(t.id), t.status]))
    const r = await db.query(`SELECT ticket_id, estado, entrada_at FROM public.alarmas_avisadas WHERE estado IN (${m})`, estados)
    const marcados = new Set<string>()
    for (const x of r.rows as Array<{ ticket_id: string; estado: string; entrada_at: string | Date }>) {
      const id = String(x.ticket_id)
      if (estadoDe.get(id) === x.estado && entradas.get(id)?.getTime() === new Date(x.entrada_at).getTime()) marcados.add(id)
    }
    return marcados
  } catch (e) {
    logger.warn({ err: e }, 'no se pudo leer la marca «esperando aprobación del cliente»; el tablero sale sin ella')
    return new Set()
  }
}
