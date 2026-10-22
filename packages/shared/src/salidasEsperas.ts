import { puedeEjecutarTransicionConDecisionales, type ContextoDecisionales } from './decisionales'
import { esCargo, puedeEjecutarTransicion, type Cargo, type SujetoDePermiso } from './cargos'
import type { Transition } from './transitions'

/**
 * salidas-esperas (F1C-03, RQ-TS-60, RQ-TS-61, RQ-PM-42..44; `decision/c3-salida-esperas`, corregida por
 * `decision/f1c03-quien-ejecuta-salidas`): las dos salidas nuevas de las esperas, su interruptor y la regla del ejecutor como
 * regla pura. Sin reloj ni base de datos: la lee igual el servidor (que la impone) y el cliente (que sólo la pinta, regla invariable 13).
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

/** Los orígenes desde los que `anulacion` entra en la regla del ejecutor; desde `Rev./Diagnostico` y demás, la regla no opina. */
export const ORIGENES_ANULACION_EN_ESPERA: ReadonlySet<string> = new Set(['En Espera de Repuestos', 'Servicio externo'])

/** Los dos cargos que ejecutan las salidas de las esperas externas; el administrador, además (exento de todo cargo, `cargos.ts`). */
export const CARGOS_EJECUTORES_SALIDA: readonly Cargo[] = ['Director Comercial', 'Coordinador Comercial']

/**
 * El motivo corto del cobro del diagnóstico: el campo de texto obligatorio del catálogo (`cfText`, `transitions.ts:262`). Va a la traza
 * y NO a `tickets.custom_fields` (lo quita `ticketService.ts:133`, molde de `CLAVE_DESCRIPCION_FALLA`).
 */
export const CLAVE_MOTIVO_COBRO = 'Motivo del cobro de diagnóstico'

export interface ContextoSalidasEsperas { activo: boolean }
export const SALIDAS_ESPERAS_APAGADO: ContextoSalidasEsperas = Object.freeze({ activo: false })

export type EjecutorSalida = { via: 'permitido' } | { via: 'denegado'; mensaje: string }

/** ¿Entra en la regla del ejecutor? El cobro del diagnóstico desde sus orígenes, y `anulacion` sólo desde las dos esperas externas. */
export function esSalidaDeEspera(transitionId: string, origen: string): boolean {
  if (transitionId === ID_COBRO_DIAGNOSTICO) return true
  return transitionId === 'anulacion' && ORIGENES_ANULACION_EN_ESPERA.has(origen)
}

/**
 * Quién ejecuta la salida: `null` si el interruptor está apagado o la transición no entra en la regla (no opina). Si entra, sólo el
 * administrador o un cargo de `CARGOS_EJECUTORES_SALIDA`; cualquier otro, `denegado`. El derivado del ticket no cuenta.
 */
export function ejecutorDeSalida(
  t: Pick<Transition, 'id' | 'name'>,
  tk: { status: string },
  s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>,
  ctx: ContextoSalidasEsperas,
): EjecutorSalida | null {
  if (!ctx.activo || !esSalidaDeEspera(t.id, tk.status)) return null
  if (s.isAdmin || (esCargo(s.cargoPermiso) && CARGOS_EJECUTORES_SALIDA.includes(s.cargoPermiso))) return { via: 'permitido' }
  return { via: 'denegado', mensaje: `"${t.name}" desde «${tk.status}» la ejecutan sólo el Director Comercial o la Coordinadora Comercial` }
}

/** Escalón C: el motivo del cobro no puede ir sólo con espacios. Ausente o vacío lo dice `buildTransitionPlan` (campo obligatorio). */
export function erroresMotivoCobro(transitionId: string, values: Record<string, unknown>): string[] {
  if (transitionId !== ID_COBRO_DIAGNOSTICO) return []
  const v = values[CLAVE_MOTIVO_COBRO]
  return typeof v === 'string' && v.length > 0 && v.trim() === '' ? [`"${CLAVE_MOTIVO_COBRO}" no puede estar en blanco`] : []
}

/**
 * Compuesta: excepción explícita a Decisionales por cargo (molde `IDS_FIRMA_CC`, `decisionales.ts`). Si hay veredicto, área y lista corta
 * (`puedeEjecutarTransicion`) Y que no sea `denegado`; si no, `puedeEjecutarTransicionConDecisionales` intacta.
 */
export function puedeEjecutarConSalidasEsperas(
  s: SujetoDePermiso,
  t: Pick<Transition, 'id' | 'name' | 'area'>,
  tk: { status: string },
  dec: ContextoDecisionales,
  sal: ContextoSalidasEsperas,
): boolean {
  const v = ejecutorDeSalida(t, tk, s, sal)
  if (v) return puedeEjecutarTransicion(s, t) && v.via !== 'denegado'
  return puedeEjecutarTransicionConDecisionales(s, t, dec)
}
