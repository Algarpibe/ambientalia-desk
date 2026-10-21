/**
 * salidas-esperas (F1C-03, RQ-TS-60, RQ-TS-61; `decision/c3-salida-esperas`): las dos salidas nuevas de las esperas y su
 * interruptor como regla pura. Sin reloj ni base de datos: la lee igual el servidor (que la impone) y el cliente (que sólo
 * la pinta, regla invariable 13). El resto de la regla —quién ejecuta la salida y el motivo del respaldo— llega en el lote I3b.
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
