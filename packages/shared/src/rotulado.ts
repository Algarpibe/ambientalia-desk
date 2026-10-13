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
