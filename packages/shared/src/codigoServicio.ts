/**
 * El código de servicio se fija una vez y luego queda bloqueado (`tickets-core` RQ-TC-81 a RQ-TC-83;
 * `transitions-st` RQ-TS-65, RQ-TS-66; `decision/ingreso-servicio-reescribe-codigo`).
 *
 * Dominio puro, apto para navegador. Una sola fuente de la regla: el servidor (`ticketService.ts`) y el cliente
 * (`TransitionPanel.tsx`) la CONSUMEN, nunca la reescriben (regla invariable 13, punto 1).
 */

import type { Transition } from './transitions'
import type { SujetoDePermiso } from './cargos'
import { buildCodigoServicio, prefijoDeducido } from './ticketCreate'

/** La clave del campo en los `values` es su etiqueta (`transitions.ts`, `cfText('Código Servicio')`). */
export const CLAVE_CODIGO_SERVICIO = 'Código Servicio'
/** Clave de la traza con el valor previo: con forma de etiqueta, para que el historial la enseñe sin diccionario (`etiquetaCampo`). */
export const CLAVE_CODIGO_SERVICIO_ANTERIOR = 'Código Servicio anterior'
export const MENSAJE_CODIGO_BLOQUEADO = 'El código de servicio de este ticket ya está fijado: sólo un administrador puede cambiarlo'

/** La excepción es sólo `isAdmin`: un cargo de dirección no exime. */
export function puedeCambiarCodigoServicio(s: Pick<SujetoDePermiso, 'isAdmin'>): boolean {
  return s.isAdmin
}

const llevaElCampo = (t: Pick<Transition, 'fields'>): boolean => t.fields.some((f) => f.key === CLAVE_CODIGO_SERVICIO)
/** Vacío con la MISMA definición que `transitionExec.ts` (`buildTransitionPlan`): lo para el 422 de obligatorios, no esta guarda. */
const esVacio = (v: unknown): boolean => v === undefined || v === null || v === ''
const pedidoDe = (valores: unknown): unknown =>
  typeof valores === 'object' && valores !== null ? (valores as Record<string, unknown>)[CLAVE_CODIGO_SERVICIO] : undefined

/**
 * Verdadero si la transición lleva el campo, el ticket YA tiene código (guardado recortado no vacío), el cuerpo trae uno
 * no vacío y distinto tras recortar, y el sujeto no es administrador. Un pedido de sólo espacios no es vacío para el plan y se
 * escribiría tal cual, así que cuenta como cambio.
 */
export function cambiaCodigoSinPermiso(t: Pick<Transition, 'fields'>, valores: unknown, actual: string | null, s: Pick<SujetoDePermiso, 'isAdmin'>): boolean {
  if (!llevaElCampo(t)) return false
  const previo = (actual ?? '').trim()
  if (previo === '') return false
  const pedido = pedidoDe(valores)
  if (esVacio(pedido)) return false
  return String(pedido).trim() !== previo && !puedeCambiarCodigoServicio(s)
}

/** La propuesta para un ticket sin código: la del alta (`buildCodigoServicio`), con el día de Bogotá de `created_time`. Nunca lanza. */
export function propuestaCodigoServicio(d: { clasificacion?: string | null; tipoServicio?: string | null; serie?: string | null; modelo?: string | null; creadoEn?: Date | string | null }): string {
  return buildCodigoServicio({ prefijo: prefijoDeducido(d.clasificacion, d.tipoServicio), serie: d.serie ?? '', modelo: d.modelo ?? '', fecha: d.creadoEn ?? null })
}

/**
 * El valor previo es un hecho derivado del servidor (molde de `valoresConMotivo`): se borra el del cuerpo y sólo se pone el del
 * ticket cuando la transición lleva el campo, había código y el nuevo, recortado, es distinto.
 */
export function valoresConCodigoPrevio(values: Record<string, unknown>, t: Pick<Transition, 'fields'>, actual: string | null): Record<string, unknown> {
  const resto = { ...values }; delete resto[CLAVE_CODIGO_SERVICIO_ANTERIOR]
  const previo = (actual ?? '').trim()
  const nuevo = resto[CLAVE_CODIGO_SERVICIO]
  return llevaElCampo(t) && previo !== '' && !esVacio(nuevo) && String(nuevo).trim() !== previo ? { ...resto, [CLAVE_CODIGO_SERVICIO_ANTERIOR]: previo } : resto
}
