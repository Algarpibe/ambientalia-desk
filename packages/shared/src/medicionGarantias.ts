import { RESULTADOS_RECLAMACION, MONEDA_GARANTIA_PROVEEDOR, type GarantiaProveedor, type MonedaGarantiaProveedor, type ResultadoReclamacion } from './garantiaProveedor'

/**
 * Medición de las garantías con el proveedor por marca (F1B-13, `medicion-garantias-por-marca`).
 * Regla pura: el servidor lee las fichas y devuelve este resultado tal cual, y el cliente lo pinta
 * (regla invariable 13). La agrupación, la normalización y las sumas viven SÓLO aquí.
 */

/** Fichas «sí» con la misma (fabricante, referencia) a partir de las cuales hay falla repetida (S-2). */
export const UMBRAL_FALLA_REPETIDA = 2

/** Clave de agrupación (S-1): recortada y en minúsculas, sin plegar acentos (`Müller` ≠ `Muller`). */
export function claveMedicion(v: string | null): string {
  return (v ?? '').trim().toLowerCase()
}

export interface MedicionFabricante {
  /** Etiqueta del grupo: el fabricante recortado de la ficha de menor `id`; `null` si ninguna lo trae. */
  fabricante: string | null
  fichas: number
  /** Fichas abiertas o enviadas. */
  sinResolver: number
  /** Fichas «sí» sin `valorReclamado`: se cuentan aparte y no suman nada a `reclamado`. */
  sinValorReclamado: number
  reclamado: number
  recuperado: number; moneda: MonedaGarantiaProveedor
  /** `recuperado / reclamado`, o `null` si lo reclamado no es mayor que 0 (S-6). */
  cociente: number | null
  /** Resueltas por resultado; siempre las tres claves. */
  resultados: Record<ResultadoReclamacion, number>
}

export interface FallaRepetida {
  fabricante: string | null
  piezaReferencia: string
  fichas: number
  ticketIds: string[]
}

export interface MedicionGarantias {
  porFabricante: MedicionFabricante[]
  fallasRepetidas: FallaRepetida[]
}

const porClave = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const etiqueta = (v: string | null): string | null => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}

export function medirGarantias(fichas: readonly GarantiaProveedor[]): MedicionGarantias {
  // Orden por id: hace determinista la etiqueta del grupo y la lista de tickets, sea cual sea la entrada.
  const sis = fichas.filter(f => f.reclama).sort((a, b) => a.id - b.id)

  const grupos = new Map<string, MedicionFabricante>()
  for (const f of sis) {
    const clave = claveMedicion(f.fabricante)
    let g = grupos.get(clave)
    if (!g) {
      g = {
        fabricante: etiqueta(f.fabricante), fichas: 0, sinResolver: 0, sinValorReclamado: 0, reclamado: 0,
        recuperado: 0, moneda: MONEDA_GARANTIA_PROVEEDOR, cociente: null,
        resultados: Object.fromEntries(RESULTADOS_RECLAMACION.map(r => [r, 0])) as Record<ResultadoReclamacion, number>,
      }
      grupos.set(clave, g)
    }
    g.fichas += 1
    if (f.valorReclamado === null) g.sinValorReclamado += 1
    else g.reclamado += f.valorReclamado
    if (f.estado === 'resuelta') {
      g.recuperado += f.valorRecuperado ?? 0
      if (f.resultado) g.resultados[f.resultado] += 1
    } else {
      g.sinResolver += 1
    }
  }

  const porFabricante = [...grupos.entries()]
    .map(([clave, g]) => ({ clave, g: { ...g, cociente: g.reclamado > 0 ? g.recuperado / g.reclamado : null } }))
    .sort((a, b) => b.g.reclamado - a.g.reclamado || porClave(a.clave, b.clave))
    .map(x => x.g)

  const piezas = new Map<string, FallaRepetida & { clave: string }>()
  for (const f of sis) {
    const ref = (f.piezaReferencia ?? '').trim()
    if (ref === '') continue
    const clave = `${claveMedicion(f.fabricante)}\u0000${claveMedicion(ref)}`
    const p = piezas.get(clave)
    if (p) {
      p.fichas += 1
      p.ticketIds.push(f.ticketId)
    } else {
      piezas.set(clave, { clave, fabricante: etiqueta(f.fabricante), piezaReferencia: ref, fichas: 1, ticketIds: [f.ticketId] })
    }
  }

  const fallasRepetidas = [...piezas.values()]
    .filter(p => p.fichas >= UMBRAL_FALLA_REPETIDA)
    .sort((a, b) => b.fichas - a.fichas || porClave(a.clave, b.clave))
    .map(p => ({ fabricante: p.fabricante, piezaReferencia: p.piezaReferencia, fichas: p.fichas, ticketIds: p.ticketIds }))

  return { porFabricante, fallasRepetidas }
}

export interface FallaRepetidaConNumeros extends Omit<FallaRepetida, 'ticketIds'> {
  /** El número de cada ticket (`tickets.number`), en el orden de `ticketIds`; `null` si el ticket ya no existe. */
  numerosTicket: (number | null)[]
}

export interface MedicionGarantiasConNumeros {
  porFabricante: MedicionFabricante[]
  fallasRepetidas: FallaRepetidaConNumeros[]
}

/** Lo que responde la ruta: el id interno de Zoho se cambia por el número del ticket y no sale del servidor. */
export function conNumerosDeTicket(m: MedicionGarantias, numeros: ReadonlyMap<string, number>): MedicionGarantiasConNumeros {
  return {
    porFabricante: m.porFabricante,
    fallasRepetidas: m.fallasRepetidas.map(({ ticketIds, ...f }) => ({ ...f, numerosTicket: ticketIds.map(id => numeros.get(id) ?? null) })),
  }
}
