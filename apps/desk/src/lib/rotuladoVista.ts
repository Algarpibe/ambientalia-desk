import { puedeConfirmarRotulado } from '@ambientalia/shared'
import { fmtFechaHora } from './remisionResultado'

/**
 * Qué se pinta del rotulado de una remisión (rotulado-tras-enviar; `remisiones` RQ-RE-40 y RQ-RE-41).
 *
 * Regla invariable 13: la condición «pendiente de rotular» la calcula el servidor (`pendienteRotular`, que viaja
 * en la remisión) y aquí sólo se LEE; no se recalcula con estado, anulada ni novedades. El permiso de confirmar es
 * el predicado compartido `puedeConfirmarRotulado`; el servidor lo impone con el 403 de la acción. Pura, sin red.
 */
export type VistaRotulado =
  | { tipo: 'nada' }
  | { tipo: 'pendiente'; puedeConfirmar: boolean }
  | { tipo: 'confirmado'; texto: string }

export function vistaRotulado(
  rem: { pendienteRotular: boolean; novedades: unknown; rotuladoAt: string | null; rotuladoPor: string | null },
  sesion: { areas: string[]; isAdmin: boolean } | null,
): VistaRotulado {
  if (rem.pendienteRotular) return { tipo: 'pendiente', puedeConfirmar: !!sesion && puedeConfirmarRotulado(sesion) }
  if (rem.novedades != null && rem.rotuladoAt) {
    const cuando = fmtFechaHora(rem.rotuladoAt)
    return { tipo: 'confirmado', texto: rem.rotuladoPor ? `Rotulado y guardado: lo confirmó ${rem.rotuladoPor} el ${cuando}` : `Rotulado y guardado el ${cuando}` }
  }
  return { tipo: 'nada' }
}
