import { TIPO_CALIBRACION } from './ticketCreate'

/**
 * calibracion-directa (F1C-08, RQ-TS-52, RQ-TS-54, RQ-TS-55, RQ-PM-38, RQ-PM-39): regla pura de la ruta abreviada de la
 * calibración y de su escape. Sin reloj ni base de datos: la lee igual el servidor (que la impone) y el cliente (que sólo
 * la pinta, regla invariable 13). El interruptor NO vive aquí: es la cláusula de `motivoQuitadaPorInterruptor`
 * (`controlCalidad.ts`), de modo que el `409` del servidor y el filtro del panel cubren las dos transiciones sin tocar su llamada.
 */
export const ID_CALIBRACION_DIRECTA = 'calibracion_directa'
export const ID_FALLA_CALIBRACION = 'falla_calibracion'
export const IDS_CALIBRACION_DIRECTA: ReadonlySet<string> = new Set([ID_CALIBRACION_DIRECTA, ID_FALLA_CALIBRACION])
/** La key del campo de texto obligatorio del escape en el catálogo; una prueba exige que sea la de `falla_calibracion`. */
export const CLAVE_DESCRIPCION_FALLA = 'Descripción de la falla'

/** Lo que la regla necesita del ticket: el tipo de servicio tal como está y si tiene orden de venta por alguna vía. */
export interface TicketParaCalibracion { tipoServicio: string | null; tieneOrdenVenta: boolean }

/**
 * Por qué la transición no se ofrece a ese ticket; `null` si se ofrece (o si no es de las dos). Comparación EXACTA del tipo,
 * como `ticketCreate.ts` y `ordenOVI.ts` (S-11): `calibración` en minúscula no toma el atajo. Orden: tipo antes que orden de
 * venta. El contenido de la OV no se lee nunca (S-2).
 */
export function motivoNoCalibracionDirecta(transitionId: string, tk: TicketParaCalibracion): string | null {
  if (transitionId === ID_CALIBRACION_DIRECTA) {
    if (tk.tipoServicio !== TIPO_CALIBRACION) return 'La calibración directa es sólo para tickets de tipo de servicio Calibración'
    if (!tk.tieneOrdenVenta) return 'La calibración directa exige una orden de venta asignada al ticket'
  }
  if (transitionId === ID_FALLA_CALIBRACION && tk.tipoServicio !== TIPO_CALIBRACION) return '"Falla en calibración" es sólo para tickets de tipo de servicio Calibración'
  return null
}

export function visibleCalibracionDirecta(transitionId: string, tk: TicketParaCalibracion): boolean {
  return motivoNoCalibracionDirecta(transitionId, tk) === null
}

/**
 * Sólo en el escape: la descripción con texto de sólo espacios. Ausente o vacía ya la da `transitionExec` (el `empty` no
 * recorta), así que no se duplica el error (molde de `erroresContenidoControlCalidad`).
 */
export function erroresDescripcionFalla(transitionId: string, values: Record<string, unknown>): string[] {
  if (transitionId !== ID_FALLA_CALIBRACION) return []
  const v = values[CLAVE_DESCRIPCION_FALLA]
  return typeof v === 'string' && v.length > 0 && v.trim() === '' ? [`"${CLAVE_DESCRIPCION_FALLA}" no puede estar en blanco`] : []
}
