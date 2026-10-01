/**
 * Prioridad del cliente y Top 5 (F1B-07, parte decidida; `tickets-core` RQ-TC-24, RQ-TC-27).
 *
 * Dominio puro, apto para navegador. Una sola fuente de la lista, del orden y de «la más alta»: el servidor
 * y el cliente la CONSUMEN, nunca la reescriben (regla invariable 13). `prioridadAlNacer` (`contratos.ts`)
 * la usa para decidir la prioridad de un ticket recién nacido.
 */

/** Lo que se puede FIJAR. Igual a las opciones del campo `priority` de `transitions.ts:84` (una prueba lo vigila, D-2). */
export const PRIORIDADES_ASIGNABLES = ['High', 'Medium', 'Low'] as const
export type PrioridadAsignable = (typeof PRIORIDADES_ASIGNABLES)[number]

/** Igualdad exacta: no pliega mayúsculas ni idioma (`'high'`, `'Alta'` y `'Urgent'` no son asignables, S-3). */
export function esPrioridadAsignable(x: unknown): x is PrioridadAsignable {
  return typeof x === 'string' && (PRIORIDADES_ASIGNABLES as readonly string[]).includes(x)
}

/** `Urgent` se COMPARA (viene de Zoho) pero no se ofrece (S-3). Lo desconocido vale 0 y pierde ante todo. */
const RANGO: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 }
const rangoDe = (p: string | null): number => (p !== null && Object.prototype.hasOwnProperty.call(RANGO, p) ? RANGO[p] : 0)

/** La más alta de las dos. Una desconocida o `null` pierde; en empate gana `a`. */
export function prioridadMasAlta(a: string | null, b: string | null): string | null {
  return rangoDe(b) > rangoDe(a) ? b : a
}

/**
 * La prioridad que impone el Top 5 de un cliente, o `null`. Falla cerrado (D-6): sin fila, con `top5` falso
 * o con un valor que no es de la lista (un dato sucio en la base) no impone nada.
 */
export function prioridadTop5(f: { top5: boolean; prioridad: unknown } | null): PrioridadAsignable | null {
  return f && f.top5 && esPrioridadAsignable(f.prioridad) ? f.prioridad : null
}

export type CuerpoPrioridadCliente =
  | { ok: true; top5: boolean; prioridad: PrioridadAsignable | null }
  | { ok: false; errors: string[] }

/**
 * Valida el cuerpo del `PUT` de la prioridad del cliente. `top5` es booleano; si es `true`, la prioridad es
 * obligatoria y de la lista; si es `false`, se guarda `null` aunque venga un valor (S-9).
 */
export function prioridadClienteDelCuerpo(v: unknown): CuerpoPrioridadCliente {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return { ok: false, errors: ['El cuerpo debe ser un objeto con top5 y prioridad'] }
  const { top5, prioridad } = v as Record<string, unknown>
  if (typeof top5 !== 'boolean') return { ok: false, errors: ['top5 debe ser verdadero o falso'] }
  if (!top5) return { ok: true, top5: false, prioridad: null }
  if (!esPrioridadAsignable(prioridad)) return { ok: false, errors: [`La prioridad debe ser una de: ${PRIORIDADES_ASIGNABLES.join(', ')}`] }
  return { ok: true, top5: true, prioridad }
}
