import type { DiaCivil } from './calendarioLaboral'
import { cierrePuestoPorMigracion, cierreQueCuenta, esPasoDeMigracion } from './cierreEnCifras'
import type { Estado } from './estados'
import { diaEnZona } from './fechasDerivadas'
import { CATALOGO_POR_FLUJO } from './flujos'

/**
 * El día de cierre de un ticket (F1F-05, `poblacion-cierre-variante-47-51`, RQ-KP-34). Regla pura: el servidor lee el historial y
 * `closed_time` y la aplica; ningún `.tsx` la repite (regla invariable 13).
 */

const FINALIZADO: Estado = 'Finalizado'

/**
 * Las transiciones cuyo destino es «Finalizado», derivadas UNA vez de TODOS los catálogos (`CATALOGO_POR_FLUJO` es el único punto que los
 * enumera). No se usa `transicionPorId`: devuelve la PRIMERA coincidencia entre catálogos. El guardián de la prueba la enfrenta al catálogo (S-7).
 */
export const TRANSICIONES_A_FINALIZADO: ReadonlySet<string> = new Set(
  Object.values(CATALOGO_POR_FLUJO).flatMap((catalogo) => catalogo.filter((t) => t.to === FINALIZADO).map((t) => t.id)),
)

type PasoParaCierre = { transitionId: unknown; performedAt: string; values: unknown }

/**
 * Orden S-1: (a) el mayor `performedAt` entre los pasos a «Finalizado» que no son el marcador de la migración; (b) si no hay, `closed_time`
 * pasado por `cierreQueCuenta` con el cierre que puso la migración según el ÚLTIMO marcador; (c) `null`. El cierre de la migración no cuenta (S-3).
 */
export function diaDeCierreDelTicket(pasos: readonly PasoParaCierre[], closedTime: string | null): DiaCivil | null {
  let mayor: string | null = null
  for (const p of pasos) {
    if (esPasoDeMigracion(p.transitionId) || !TRANSICIONES_A_FINALIZADO.has(String(p.transitionId))) continue
    if (mayor === null || Date.parse(p.performedAt) > Date.parse(mayor)) mayor = p.performedAt
  }
  if (mayor !== null) return diaEnZona(mayor)
  const marcadores = pasos.filter((p) => esPasoDeMigracion(p.transitionId))
  const ultimo = marcadores.length > 0 ? marcadores[marcadores.length - 1] : null
  return diaEnZona(cierreQueCuenta(closedTime, ultimo ? cierrePuestoPorMigracion(ultimo.values) : null))
}
