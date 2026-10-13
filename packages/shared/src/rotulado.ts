import { canExecuteTransition } from './permissions'

/**
 * Rotulado de la remisión de entrada (F1B-04, `rotulado-tras-enviar`; `remisiones` RQ-RE-40, RQ-RE-41).
 *
 * Puro, sin base ni red. Lo consume el servidor (la marca `pendienteRotular` y el permiso de la acción) y, por
 * la regla invariable 13, lo consumirá el cliente sin reescribirlo.
 */

/**
 * ¿Está pendiente de rotular? Verdadero si y sólo si la remisión es del formulario nuevo (`novedades` no nulo),
 * está enviada con éxito (`ok` u `ok_con_avisos`), no está anulada y `rotulado_at` es nulo (RQ-RE-41).
 * Informa, no alarma: ninguna guarda ni alarma la lee (S3).
 */
export function pendienteDeRotular(rem: { novedades: unknown; estado: string; anuladaAt: string | null; rotuladoAt: string | null }): boolean {
  return rem.novedades != null && (rem.estado === 'ok' || rem.estado === 'ok_con_avisos') && !rem.anuladaAt && !rem.rotuladoAt
}

/** ¿Puede esta sesión confirmar el rotulado? El área Servicio Técnico o un administrador (S1, RQ-RE-40). */
export function puedeConfirmarRotulado(s: { areas: string[]; isAdmin: boolean }): boolean {
  return canExecuteTransition(s.areas, s.isAdmin, 'Servicio Técnico')
}

/**
 * ¿Hay que avisar de que la etiqueta DYMO no se generó? (F1B-04, `rotulado-tras-enviar`; `derivacion-avisos` RQ-AV-22, G1).
 * Verdadero si el desenlace es `ok` u `ok_con_avisos` Y `resultado.dymoId` está vacío: ausente, `null`, cadena vacía o de
 * sólo espacios, o `resultado` que no es un objeto. Con `error` NO avisa. No lee `avisos[].paso` ni ningún texto del flujo.
 * Hipótesis: que `dymoId` llegue vacío cuando la etiqueta falla son datos de segunda mano del analista (nodo «Code Resumen
 * Entrada» de n8n, leído el 2026-10-12), sin ejecución real contra la que contrastarlos.
 */
export function etiquetaNoGenerada(estado: string, resultado: unknown): boolean {
  if (estado !== 'ok' && estado !== 'ok_con_avisos') return false
  const dymoId = resultado !== null && typeof resultado === 'object' ? (resultado as { dymoId?: unknown }).dymoId : undefined
  return typeof dymoId !== 'string' || dymoId.trim() === ''
}
