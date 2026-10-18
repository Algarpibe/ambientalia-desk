// F1C-04 (RQ-TS-44, RQ-TS-45): el tipo de evento de cada transición, de una lista cerrada.
// El resolutor lee los catálogos al llamarse, nunca al cargar el módulo: ningún orden de carga da una zona muerta.
import { transicionPorId } from './flujos'
import { TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA } from './transitions'

/** Grafía de M1.3 y M1.8 del maestro. */
export const TIPOS_EVENTO = ['Operativo', 'Decisional', 'Compras / Logístico', 'Administrativo'] as const
export type TipoEvento = (typeof TIPOS_EVENTO)[number]

/** Tipo de la transición con ese id (tres catálogos y los dos pasos del servidor); `null` si no existe. */
export function tipoEventoDeTransicion(transitionId: string | null | undefined): TipoEvento | null {
  if (!transitionId) return null
  const paso = [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA].find((p) => p.id === transitionId)
  return transicionPorId(transitionId)?.tipoEvento ?? paso?.tipoEvento ?? null
}
