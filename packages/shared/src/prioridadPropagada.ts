import { prioridadAlNacer } from './contratos'
import type { PrioridadAsignable } from './prioridad'

/**
 * Propagación del Top 5 a los tickets abiertos (propagar-top5-lista-remision-creada, F1B-07;
 * `decision/cola-del-taller-los-tres-cabos`, punto 3). Cálculo PURO: «la calculada» es `prioridadAlNacer`
 * (`contratos.ts`), la misma fórmula del alta, sin una segunda implementación (regla invariable 13).
 */

/** Orígenes de una fila de `prioridad_ajustes` que escribe el Top 5. Todo lo demás, incluido NULL, es un ajuste manual. */
export const ORIGENES_TOP5 = ['top5', 'top5_revertido', 'top5_al_nacer'] as const
export type OrigenTop5 = (typeof ORIGENES_TOP5)[number]

/** El motivo de la traza: la base lo exige no vacío (`prioridad_ajustes_motivo`). */
export const MOTIVO_POR_ORIGEN: Record<OrigenTop5, string> = {
  top5: 'Prioridad del cliente Top 5',
  top5_revertido: 'El cliente dejó de ser Top 5: vuelve a la prioridad calculada',
  top5_al_nacer: 'El ticket nació bajo el Top 5 de su cliente',
}

export interface TrazaDePrioridad { de: string | null; origen: string | null }

/** Manual = todo lo que no esté en la lista. Falla cerrado: un origen desconocido exime al ticket (D7). */
export function esAjusteManual(origen: unknown): boolean {
  return !(typeof origen === 'string' && (ORIGENES_TOP5 as readonly string[]).includes(origen))
}

/** El `de` de la primera fila del Top 5 posterior a la última reversión, o `null` si no hay (D5). `filas` va de antigua a reciente. */
export function baseDeTop5(filas: readonly TrazaDePrioridad[]): { de: string | null } | null {
  const tras = filas.slice(filas.map((f) => f.origen).lastIndexOf('top5_revertido') + 1)
  const primera = tras.find((f) => !esAjusteManual(f.origen))
  return primera ? { de: primera.de } : null
}

/** La base de un ticket que nace bajo Top 5: el respaldo recibido (el alta pasa `PRIORIDAD_POR_DEFECTO`), sin contrato ni Top 5. Una sola fórmula. */
export function baseAlNacer(pedida: unknown): string | null {
  return prioridadAlNacer(pedida, false, null)
}

/** El cambio que el Top 5 impone a un ticket abierto, o `null` si no hay que tocarlo. Orden: manual, base, fórmula, igual. */
export function cambioPorTop5(x: {
  actual: string | null; filas: readonly TrazaDePrioridad[]; contratoVigente: boolean; top5: PrioridadAsignable | null
}): { de: string | null; a: string | null; origen: 'top5' | 'top5_revertido' } | null {
  if (x.filas.some((f) => esAjusteManual(f.origen))) return null
  const base = baseDeTop5(x.filas)
  if (!x.top5 && !base) return null
  const a = prioridadAlNacer(base ? base.de : x.actual, x.contratoVigente, x.top5)
  if (a === x.actual) return null
  return { de: x.actual, a, origen: x.top5 ? 'top5' : 'top5_revertido' }
}
