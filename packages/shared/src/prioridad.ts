/**
 * Prioridad del cliente y Top 5 (F1B-07, parte decidida; `tickets-core` RQ-TC-24, RQ-TC-27).
 *
 * Dominio puro, apto para navegador. Una sola fuente de la lista, del orden y de «la más alta»: el servidor
 * y el cliente la CONSUMEN, nunca la reescriben (regla invariable 13). `prioridadAlNacer` (`contratos.ts`)
 * la usa para decidir la prioridad de un ticket recién nacido.
 */

import type { Transition } from './transitions'
import { puedeAjustarPrioridadTicket, type SujetoDePermiso } from './cargos'

/** Lo que se puede FIJAR: dos niveles. Igual a las opciones del campo `priority` de `transitions.ts:84` (una prueba lo vigila, D-2). */
export const PRIORIDADES_ASIGNABLES = ['High', 'Medium'] as const
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

export const MENSAJE_PRIORIDAD_BLOQUEADA = 'La prioridad del ticket la ajustan el Director Comercial o el Director Técnico: tu cargo no puede cambiarla en esta etapa'

export type CuerpoAjuste =
  | { ok: true; prioridad: PrioridadAsignable; motivo: string }
  | { ok: false; errors: string[] }

/**
 * Valida el cuerpo del `POST` de ajuste por ticket (RQ-TC-29). Acumula TODOS los errores: la prioridad ha de ser
 * asignable y distinta de la actual (D-9: una traza sin cambio no dice nada) y el motivo no puede quedar vacío tras `trim`.
 */
export function ajusteDelCuerpo(v: unknown, actual: string | null): CuerpoAjuste {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return { ok: false, errors: ['El cuerpo debe ser un objeto con prioridad y motivo'] }
  const { prioridad, motivo } = v as Record<string, unknown>
  const errors: string[] = []
  const m = typeof motivo === 'string' ? motivo.trim() : ''
  if (!esPrioridadAsignable(prioridad)) errors.push(`La prioridad debe ser una de: ${PRIORIDADES_ASIGNABLES.join(', ')}`)
  else if (prioridad === actual) errors.push('La prioridad nueva es igual a la actual')
  if (m === '') errors.push('El motivo es obligatorio')
  return errors.length || !esPrioridadAsignable(prioridad) ? { ok: false, errors } : { ok: true, prioridad, motivo: m }
}

/**
 * La guarda del técnico (RQ-TS-21): verdadero si la transición declara un campo `target: 'priority'` (D-8), el cuerpo trae
 * una prioridad no vacía, distinta de la actual, y el sujeto NO cumple `puedeAjustarPrioridadTicket` (se CONSUME de `cargos.ts`;
 * el admin pasa ahí). El Director Técnico ajusta, por cargo y sin área (prioridad-tres-niveles); el área de la transición la guarda aparte.
 */
export function cambiaPrioridadSinPermiso(t: Pick<Transition, 'fields'>, valores: unknown, actual: string | null, s: SujetoDePermiso): boolean {
  if (!t.fields.some((f) => f.target === 'priority')) return false
  const pedida = typeof valores === 'object' && valores !== null ? (valores as Record<string, unknown>).priority : undefined
  if (pedida === undefined || pedida === null || pedida === '') return false
  return pedida !== actual && !puedeAjustarPrioridadTicket(s)
}

/**
 * La cola del taller (F1B-07, lote 2b; `vistas-tablero` RQ-VT-09, `decision/e099-orden-cola-taller`).
 *
 * UNA sola función de orden: la consumen `GET /api/tickets` y `GET /api/mis-tickets` (el cliente no ordena, regla 13).
 * `habilitadoAt` es la ÚLTIMA habilitación del ticket (S-10a); sin ella cuenta `createdAt`, que es `created_time` de la
 * base tal como lo expone `Ticket` (S-10b). Sin ninguna de las dos fechas válidas, el ticket va al final de su rango.
 */
export function instanteDeCola(t: { habilitadoAt?: string | null; createdAt?: string | null }): number | null {
  const ms = Date.parse(t.habilitadoAt ?? t.createdAt ?? '')
  return Number.isNaN(ms) ? null : ms
}

/** Copia ordenada, estable, sin mutar la entrada: rango de prioridad descendente; empate → instante ascendente. */
export function ordenarColaTaller<T extends { priority?: string | null; habilitadoAt?: string | null; createdAt?: string | null }>(xs: readonly T[]): T[] {
  return [...xs].sort((a, b) => {
    const r = rangoDe(b.priority ?? null) - rangoDe(a.priority ?? null)
    if (r !== 0) return r
    const ia = instanteDeCola(a), ib = instanteDeCola(b)
    if (ia === null || ib === null) return ia === ib ? 0 : ia === null ? 1 : -1
    return ia - ib
  })
}

/** «Mis tickets»: abiertos y derivados al usuario. El MISMO predicado que usa el filtro de la vista (H5). */
export function esDeMisTickets(t: { statusType?: string | null; derivado?: { id: string } | null }, userId: string): boolean {
  return t.statusType !== 'Closed' && t.derivado?.id === userId
}

/** La prioridad con la que nace un ticket sin contrato vigente ni Top 5: el alta la pasa como respaldo, el cuerpo no se lee. */
export const PRIORIDAD_POR_DEFECTO: PrioridadAsignable = 'Medium'

/** D9 (S-K): una prioridad pedida en la transición, no vacía, distinta de la actual y fuera de la lista, es un error; reenviar la actual (aunque sea heredada) no. */
export function erroresPrioridadPedida(t: Pick<Transition, 'fields'>, valores: unknown, actual: string | null): string[] {
  if (!t.fields.some((f) => f.target === 'priority')) return []
  const pedida = typeof valores === 'object' && valores !== null ? (valores as Record<string, unknown>).priority : undefined
  if (pedida === undefined || pedida === null || pedida === '' || pedida === actual || esPrioridadAsignable(pedida)) return []
  return [`La prioridad debe ser una de: ${PRIORIDADES_ASIGNABLES.join(', ')}`]
}
