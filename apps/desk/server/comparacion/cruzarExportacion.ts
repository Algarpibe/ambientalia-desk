// El cruce de la exportación con los tickets del periodo (F1F-05, RQ-KP-24 y -25, D2). PURO: sin base, red ni disco.
import { flujoPorClasificacion, type Flujo, type NumeroDistinto, type TicketParaIndicadores, type TicketRef } from '@ambientalia/shared'
import type { FilaExportacion } from './leerExportacion'

export interface ResultadoCruce {
  /** El ticket de Desk con `camposZoho` = la bolsa de la fila (DD-6), en el orden de `delPeriodo`. */
  cruzados: TicketParaIndicadores[]
  /** Del periodo y ausentes del fichero; `numero` es `tickets.number`. No entran en los pares (DD-7). */
  soloEnDesk: TicketRef[]
  /** Filas válidas cuyo «ID» no está entre los del periodo. */
  sinCruzar: FilaExportacion[]
  /** El id cruza y el número del fichero no es el de Desk (también si el del fichero es `null`). */
  numeroDistinto: NumeroDistinto[]
}

/**
 * La clave es el «ID» y se compara como texto: el número nunca cruza ni se aproxima (RQ-KP-24). Los datos sincronizados de un
 * ticket (`custom_fields`) no pasan al cruzado: la bolsa es sólo la de la fila (S-L).
 */
export function cruzarExportacion(filas: readonly FilaExportacion[], delPeriodo: readonly TicketParaIndicadores[]): ResultadoCruce {
  const porId = new Map(filas.map((f) => [f.id, f]))
  const delDesk = new Set(delPeriodo.map((t) => t.id))
  const cruzados: TicketParaIndicadores[] = [], soloEnDesk: TicketRef[] = [], numeroDistinto: NumeroDistinto[] = []
  for (const t of delPeriodo) {
    const f = porId.get(t.id)
    if (f === undefined) { soloEnDesk.push({ id: t.id, numero: t.numero }); continue }
    cruzados.push({ ...t, camposZoho: f.campos })
    if (f.numero !== t.numero) numeroDistinto.push({ id: t.id, numeroFichero: f.numero, numeroDesk: t.numero })
  }
  return { cruzados, soloEnDesk, sinCruzar: filas.filter((f) => !delDesk.has(f.id)), numeroDistinto }
}

/**
 * Las filas sin cruzar se reparten con los «ID» que Desk tiene (`numerosDeTickets`): si existe es un ticket FUERA del periodo
 * y no se dice que «no está en Desk» (S-N); si no existe, sólo está en el fichero. `numero` es el del fichero.
 */
export function repartirSinCruzar(sinCruzar: readonly FilaExportacion[], existentes: ReadonlyMap<string, number>): { soloEnFichero: TicketRef[]; fueraDelPeriodo: TicketRef[] } {
  const soloEnFichero: TicketRef[] = [], fueraDelPeriodo: TicketRef[] = []
  for (const f of sinCruzar) (existentes.has(f.id) ? fueraDelPeriodo : soloEnFichero).push({ id: f.id, numero: f.numero })
  return { soloEnFichero, fueraDelPeriodo }
}

// filtro-indicadores-por-flujo (F1F-05, RQ-KP-32, D6): el cruce con flujo. Se cruza con TODOS los del periodo y se reparte después: el ticket
// de otro flujo no es «fuera del periodo» ni «sólo en el fichero». El flujo es el de la CLASIFICACIÓN (D1), nunca el del estado (M6).
export interface TicketExistente { numero: number; clasificacion: string | null }
export interface CruceRepartido extends ResultadoCruce { soloEnFichero: TicketRef[]; fueraDelPeriodo: TicketRef[]; deOtroFlujo?: TicketRef[] }

/**
 * Con flujo: `cruzados`, `soloEnDesk` y `numeroDistinto` son sólo del flujo pedido; las filas cuyo «ID» Desk tiene con OTRO flujo, dentro o fuera
 * del periodo, van a `deOtroFlujo` (con el número del fichero) y ganan a los otros dos cubos; un «ID» ausente de Desk no tiene flujo y nunca entra.
 * Invariante: leídas = rechazadas + cruzados + soloEnFichero + fueraDelPeriodo + deOtroFlujo.
 */
export function cruzarPorFlujo(filas: readonly FilaExportacion[], delPeriodo: readonly TicketParaIndicadores[],
  clasificaciones: ReadonlyMap<string, string | null>, existentes: ReadonlyMap<string, TicketExistente>, flujo: Flujo): CruceRepartido {
  const delDesk = new Set(delPeriodo.map((t) => t.id))
  const flujoDe = (id: string): Flujo | undefined => {
    if (delDesk.has(id)) return flujoPorClasificacion(clasificaciones.get(id))
    const e = existentes.get(id)
    return e === undefined ? undefined : flujoPorClasificacion(e.clasificacion)
  }
  const deOtroFlujo: TicketRef[] = [], resto: FilaExportacion[] = []
  for (const f of filas) {
    const d = flujoDe(f.id)
    if (d !== undefined && d !== flujo) deOtroFlujo.push({ id: f.id, numero: f.numero }); else resto.push(f)
  }
  const c = cruzarExportacion(resto, delPeriodo.filter((t) => flujoDe(t.id) === flujo))
  return { ...c, ...repartirSinCruzar(c.sinCruzar, new Map([...existentes].map(([id, e]) => [id, e.numero]))), deOtroFlujo }
}
