import { ID_TRANSICION_MIGRACION } from './migracionTickets'

/**
 * La fecha que puso la migración, y su marcador, no entran en ninguna cifra (F1F-01, `fecha-migracion-fuera-de-cifras`;
 * `decision/h1-fechas-migrados`, RQ-TC-69). La fecha se CONSERVA en `tickets.closed_time` (E-207): esto sólo decide qué
 * cuenta. Regla pura: el servidor lee el marcador y la aplica; ningún `.tsx` la repite (regla invariable 13).
 */

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const instante = (v: string | null): number | null => {
  if (v === null) return null
  const n = new Date(v).getTime()
  return Number.isNaN(n) ? null : n
}
const destino = (values: unknown, origen: 'zoho' | 'migracion'): string | null =>
  esObjeto(values) && values.cierre_origen === origen && typeof values.closed_time_destino === 'string' ? values.closed_time_destino : null

/** El paso que la migración deja en `ticket_transitions` (`ID_TRANSICION_MIGRACION`). */
export function esPasoDeMigracion(transitionId: unknown): boolean {
  return transitionId === ID_TRANSICION_MIGRACION
}

/** El `closed_time` que puso la migración, leído del `values` de su marcador; `null` si el origen no es exactamente «migracion». */
export function cierrePuestoPorMigracion(values: unknown): string | null {
  return destino(values, 'migracion')
}

/** El cierre que cuenta en una cifra: `null` si es el MISMO instante que puso la migración (S-1); si no, el del ticket. */
export function cierreQueCuenta(closedTime: string | null, puestoPorMigracion: string | null): string | null {
  const a = instante(closedTime)
  if (a === null) return null
  return a === instante(puestoPorMigracion) ? null : closedTime
}

/**
 * La llegada que cuenta de un paso del historial (S-3): el marcador nunca fecha por su `performedAt`, que es el instante de la
 * migración; con `cierre_origen: 'zoho'` fecha con su `closed_time_destino`, que es la de Zoho. Otro paso, por su `performedAt`.
 */
export function llegadaQueCuenta(paso: { transitionId: unknown; performedAt: string; values: unknown }): string | null {
  if (!esPasoDeMigracion(paso.transitionId)) return paso.performedAt
  return destino(paso.values, 'zoho')
}

/** Media en ms de `closedAt − createdAt` de los cerrados cuyo cierre cuenta Y cae en la ventana de seis meses (`puestos`: ticket → cierre de la migración; RQ-TC-70). */
export function resolucionPromedioMs(
  tickets: readonly { id: string; statusType: string | null; createdAt: string | null; closedAt: string | null }[],
  puestos: ReadonlyMap<string, string>,
  ahora: Date,
): number | null {
  const desde = inicioVentanaResolucion(ahora)
  const duraciones: number[] = []
  for (const t of tickets) {
    if (t.statusType !== 'Closed') continue
    const fin = instante(cierreQueCuenta(t.closedAt, puestos.get(t.id) ?? null)), inicio = instante(t.createdAt)
    if (fin === null || inicio === null || fin < desde) continue
    duraciones.push(fin - inicio)
  }
  return duraciones.length ? duraciones.reduce((s, d) => s + d, 0) / duraciones.length : null
}

/** Meses hacia atrás que abarca la media de resolución de la ficha (RQ-TC-70). */
export const MESES_VENTANA_RESOLUCION = 6

/** Inicio de la ventana (ms): `ahora` menos `MESES_VENTANA_RESOLUCION` meses en UTC; el límite inferior está incluido. */
export function inicioVentanaResolucion(ahora: Date): number {
  const d = new Date(ahora.getTime())
  d.setUTCMonth(d.getUTCMonth() - MESES_VENTANA_RESOLUCION)
  return d.getTime()
}
