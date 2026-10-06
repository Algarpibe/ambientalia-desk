import { canExecuteTransition } from './permissions'
import { TRANSITIONS } from './transitions'

/**
 * Permisos por cargo (F1C-05, nivel CARGO). Regla pura: el cargo SÓLO restringe. La compuesta exige el
 * área (`canExecuteTransition`, intacta) Y, si el acto tiene excepción, el cargo; nunca amplía.
 *
 * `cargoPermiso` es la lista cerrada de `public.users.cargo_permiso`, distinta del `users.cargo` de
 * firma (texto libre, alarmas y derivación). Son los siete de `decision/c10b-gerente-director` más el de
 * `decision/cargo-encargado-de-inventario` (`openspec/config.yaml`); `cargos.test.ts` lee las dos para no divergir.
 */
export const CARGOS = [
  'Director Técnico', 'Coordinador Técnico', 'Técnico', 'Técnico de campo',
  'Director Comercial', 'Coordinador Comercial', 'Asistente Comercial', 'Especialista técnico',
] as const

export type Cargo = (typeof CARGOS)[number]

/** Igualdad exacta: no pliega mayúsculas ni espacios. Lo que no sea de la lista es «sin cargo». */
export function esCargo(x: unknown): x is Cargo {
  return typeof x === 'string' && (CARGOS as readonly string[]).includes(x)
}

const ID_LIBERACION_SIN_FACTURA = 'liberacion_sin_factura'

/** El cargo que exige cada acto restringido. Dato, no código: vaciarlo devuelve la matriz de área. */
export const EXCEPCIONES_POR_CARGO: {
  readonly transiciones: Readonly<Record<string, Cargo>>
  readonly crearOVIGarantia: Cargo
  readonly fijarPrioridadTop5: Cargo
} = {
  transiciones: { [ID_LIBERACION_SIN_FACTURA]: 'Director Comercial' },
  crearOVIGarantia: 'Director Técnico',
  fijarPrioridadTop5: 'Director Comercial',
}

export interface SujetoDePermiso { areas: string[]; isAdmin: boolean; cargoPermiso?: Cargo | null }

/** El cargo del sujeto tal como cuenta: fuera de la lista (o vacío) es `null`, aunque el tipo diga otra cosa. */
function cargoEfectivo(s: Pick<SujetoDePermiso, 'cargoPermiso'>): Cargo | null {
  return esCargo(s.cargoPermiso) ? s.cargoPermiso : null
}

/** El cargo que exige la transición y el sujeto no tiene; `null` si no hay excepción, si lo tiene o si es admin. */
export function cargoQueFaltaParaTransicion(
  transitionId: string,
  s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>,
): Cargo | null {
  if (s.isAdmin) return null
  if (!Object.hasOwn(EXCEPCIONES_POR_CARGO.transiciones, transitionId)) return null
  const exigido = EXCEPCIONES_POR_CARGO.transiciones[transitionId]
  return cargoEfectivo(s) === exigido ? null : exigido
}

/** Compuesta: área Y, si hay excepción, cargo. Nunca amplía lo que el área niega. */
export function puedeEjecutarTransicion(s: SujetoDePermiso, t: { id: string; area: string }): boolean {
  return canExecuteTransition(s.areas, s.isAdmin, t.area) && cargoQueFaltaParaTransicion(t.id, s) === null
}

const LIBERACION_SIN_FACTURA = TRANSITIONS.find((t) => t.id === ID_LIBERACION_SIN_FACTURA)

/** La Liberación sin factura: la compuesta sobre la transición de `TRANSITIONS` (falla cerrado si no está). */
export function puedeLiberarSinFactura(s: SujetoDePermiso): boolean {
  return LIBERACION_SIN_FACTURA !== undefined && puedeEjecutarTransicion(s, LIBERACION_SIN_FACTURA)
}

/**
 * Asociar una OVI a un ticket (F1B-03, `decision/e157-ovi-garantia-por-cargo`): basta el cargo Director Técnico; el admin pasa.
 * SIN área: el acto no tiene área propia y sólo AÑADE condición (RQ-PM-21). La llama `motivoCargoOVI` (`ordenOVI.ts`).
 */
export function puedeCrearOVIGarantia(s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>): boolean {
  if (s.isAdmin) return true
  return cargoEfectivo(s) === EXCEPCIONES_POR_CARGO.crearOVIGarantia
}

/**
 * Fijar la prioridad de los Top 5: área Comercial Y cargo Director Comercial; el admin pasa.
 * La llaman el PUT de la prioridad del cliente, el POST de ajuste por ticket y la guarda del técnico de `ticketService.ts` (F1B-07). Supuesto S-9 (reversible): el área del acto es Comercial.
 */
export function puedeFijarPrioridadTop5(s: SujetoDePermiso): boolean {
  return canExecuteTransition(s.areas, s.isAdmin, 'Comercial')
    && (s.isAdmin || cargoEfectivo(s) === EXCEPCIONES_POR_CARGO.fijarPrioridadTop5)
}

/**
 * Valida el cuerpo HTTP. Ausente, `null` o vacío → sin cargo (el alta sin el campo es válida; en la
 * edición la ruta sólo llama si el campo no es `undefined`). Una cadena de la lista, recortada → el
 * cargo. Cualquier otra cosa → error.
 */
export function cargoPermisoDelCuerpo(v: unknown): { ok: true; cargo: Cargo | null } | { ok: false; error: string } {
  if (v === undefined || v === null) return { ok: true, cargo: null }
  if (typeof v === 'string') {
    const recortado = v.trim()
    if (recortado === '') return { ok: true, cargo: null }
    if (esCargo(recortado)) return { ok: true, cargo: recortado }
  }
  return { ok: false, error: `El cargo debe ser uno de: ${CARGOS.join(', ')}` }
}
