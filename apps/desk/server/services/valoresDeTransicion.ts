import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { valoresEfectivos, fuentesQueNecesita, type Transition } from '@ambientalia/shared'
import { iso } from '../db/ticketFuentes'
import { listRemisionesByTicket } from '../db/remisiones'
import { instanteUltimaTransicion } from '../db/fechasTicket'

/**
 * F1A-07 · IV-2 — lee las fuentes que la transición necesita y devuelve los valores EFECTIVOS.
 *
 * `fuentesQueNecesita` vacío → CERO consultas (P-2, vale para las 31 transiciones que no declaran
 * ninguna de las tres fechas). La lectura no es guarda: no contesta nada por sí sola, sólo entrega el
 * dato a `valoresEfectivos` (regla 13, punto 1: la regla vive en `packages/shared`, esto sólo lee).
 */
export async function valoresConFechasDerivadas(
  db: Queryable,
  current: { row: { id: string; created_time: string | null } },
  t: Transition,
  recibidos: unknown,
): Promise<{ values: Record<string, unknown>; erroresFecha: string[] }> {
  const fuentes = fuentesQueNecesita(t)
  if (fuentes.size === 0) return valoresEfectivos(t, recibidos, {})

  // `created_time` se declara `string | null`, pero pg y pg-mem entregan `Date` (A-6, mismo gesto
  // que `fechasTicket.ts:34`); `iso()` normaliza los dos casos antes de la fórmula.
  const createdAt = fuentes.has('createdAt') ? iso(current.row.created_time) : undefined
  const remisiones = fuentes.has('remisionEntrada') ? await listRemisionesByTicket(db, current.row.id) : undefined
  const escaladoARevisionAt = fuentes.has('escaladoARevisionAt')
    ? await instanteUltimaTransicion(db, current.row.id, 'escalado_a_revision')
    : undefined

  return valoresEfectivos(t, recibidos, { createdAt, remisiones, escaladoARevisionAt })
}
