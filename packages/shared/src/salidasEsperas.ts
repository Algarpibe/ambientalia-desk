import { canExecuteTransition } from './permissions'
import { areaDeDecision, cargosDecisionales, puedeEjecutarTransicionConDecisionales, type ContextoDecisionales } from './decisionales'
import { esCargo, puedeEjecutarTransicion, type SujetoDePermiso } from './cargos'
import type { Transition, TransitionField } from './transitions'

/**
 * salidas-esperas (F1C-03, RQ-TS-60, RQ-TS-61, RQ-PM-42..44; `decision/c3-salida-esperas`): las dos salidas nuevas de las esperas, su
 * interruptor y la regla del ejecutor como regla pura. Sin reloj ni base de datos: la lee igual el servidor (que la impone) y el cliente
 * (que sólo la pinta, regla invariable 13).
 *
 * El interruptor es una función HERMANA de `motivoQuitadaPorInterruptor` (`controlCalidad.ts`), no una cláusula más de ella:
 * esa recibe UN solo `activo` (`CONTROL_CALIDAD_LIBERACION`) y la llaman el servidor y el panel; meter un segundo
 * interruptor obligaría a cambiar las dos llamadas.
 */
export const ID_COBRO_DIAGNOSTICO = 'cobro_diagnostico_espera'
export const ID_SIN_PIEZA = 'sin_pieza_en_almacen'
/** Las dos transiciones que dependen de `SALIDAS_ESPERAS`: apagado, el servidor responde 409 y el panel no las ofrece. */
export const IDS_SALIDAS_NUEVAS: ReadonlySet<string> = new Set([ID_COBRO_DIAGNOSTICO, ID_SIN_PIEZA])

/** Por qué el interruptor quita la transición del panel; `null` si se queda. `visibleConSalidasEsperas` = (… === null). */
export function motivoQuitadaPorSalidasEsperas(transitionId: string, activo: boolean): string | null {
  if (IDS_SALIDAS_NUEVAS.has(transitionId) && !activo) return 'Las salidas de las esperas están apagadas (SALIDAS_ESPERAS)'
  return null
}

export function visibleConSalidasEsperas(transitionId: string, activo: boolean): boolean {
  return motivoQuitadaPorSalidasEsperas(transitionId, activo) === null
}

/** Los orígenes desde los que `anulacion` es una salida de espera; desde `Rev./Diagnostico` y demás sigue siendo Decisional por cargo. */
export const ORIGENES_ANULACION_EN_ESPERA: ReadonlySet<string> = new Set(['En Espera de Repuestos', 'Servicio externo'])

export const CLAVE_MOTIVO_RESPALDO = 'Motivo del respaldo'
/** El campo que el panel pide al respaldo. NO va en el catálogo: lo vería la persona a cargo y `buildTransitionPlan` lo escribiría en `custom_fields` (S-13). */
export const CAMPO_MOTIVO_RESPALDO: TransitionField =
  { key: CLAVE_MOTIVO_RESPALDO, label: CLAVE_MOTIVO_RESPALDO, kind: 'text', required: true, target: 'customField' }

export interface ContextoSalidasEsperas { activo: boolean; coordinadorTecnicoVacante: boolean }
export const SALIDAS_ESPERAS_APAGADO: ContextoSalidasEsperas = Object.freeze({ activo: false, coordinadorTecnicoVacante: false })

export type EjecutorSalida = { via: 'persona_a_cargo' } | { via: 'respaldo' } | { via: 'denegado'; mensaje: string }

/** ¿Es una salida de espera? `anulacion` sólo desde las dos esperas externas; las dos nuevas, siempre. */
export function esSalidaDeEspera(transitionId: string, origen: string): boolean {
  if (IDS_SALIDAS_NUEVAS.has(transitionId)) return true
  return transitionId === 'anulacion' && ORIGENES_ANULACION_EN_ESPERA.has(origen)
}

/**
 * Quién ejecuta la salida: `null` si el interruptor está apagado o la transición no es una salida de espera (no opina). Si no, en orden:
 * (a) la persona a cargo (`s.id === tk.derivadoA` con el área); (b) el respaldo (administrador o cargo de `cargosDecisionales` del área
 * de la decisión); (c) denegado. «Activo» no se consulta (S-12): quien ejecuta ya está activo, y un derivado nulo, inactivo o ajeno
 * simplemente no cumple (a) (S-2).
 */
export function ejecutorDeSalida(
  t: Pick<Transition, 'id' | 'name' | 'area'>,
  tk: { status: string; derivadoA: string | null },
  s: SujetoDePermiso & { id?: string | null },
  ctx: ContextoSalidasEsperas,
): EjecutorSalida | null {
  if (!ctx.activo || !esSalidaDeEspera(t.id, tk.status)) return null
  if (s.id != null && s.id === tk.derivadoA && canExecuteTransition(s.areas, s.isAdmin, t.area)) return { via: 'persona_a_cargo' }
  const area = areaDeDecision(t)
  const cargos = area ? cargosDecisionales(area, ctx.coordinadorTecnicoVacante) : []
  if (s.isAdmin || (esCargo(s.cargoPermiso) && cargos.includes(s.cargoPermiso))) return { via: 'respaldo' }
  return { via: 'denegado', mensaje: `"${t.name}" desde «${tk.status}» la ejecuta la persona a cargo del ticket o, con motivo, el Director o el Coordinador del área` }
}

/** Escalón C: el respaldo debe dar el motivo; la persona a cargo no lo da (no se descarta en silencio, S-14); `null` y `denegado` no opinan. */
export function erroresMotivoRespaldo(v: EjecutorSalida | null, values: Record<string, unknown>): string[] {
  if (v === null || v.via === 'denegado') return []
  const crudo = values[CLAVE_MOTIVO_RESPALDO]
  const hayTexto = typeof crudo === 'string' && crudo.trim() !== ''
  if (v.via === 'respaldo' && !hayTexto) return [`"${CLAVE_MOTIVO_RESPALDO}" es obligatorio: no eres la persona a cargo del ticket`]
  if (v.via === 'persona_a_cargo' && hayTexto) return [`"${CLAVE_MOTIVO_RESPALDO}" sólo lo da el respaldo: eres la persona a cargo del ticket`]
  return []
}

/**
 * Compuesta: excepción explícita a Decisionales por cargo (molde `IDS_FIRMA_CC`, `decisionales.ts`). Si hay veredicto, área y lista corta
 * (`puedeEjecutarTransicion`) Y que no sea `denegado`; si no, `puedeEjecutarTransicionConDecisionales` intacta.
 */
export function puedeEjecutarConSalidasEsperas(
  s: SujetoDePermiso & { id?: string | null },
  t: Pick<Transition, 'id' | 'name' | 'area'>,
  tk: { status: string; derivadoA: string | null },
  dec: ContextoDecisionales,
  sal: ContextoSalidasEsperas,
): boolean {
  const v = ejecutorDeSalida(t, tk, s, sal)
  if (v) return puedeEjecutarTransicion(s, t) && v.via !== 'denegado'
  return puedeEjecutarTransicionConDecisionales(s, t, dec)
}
