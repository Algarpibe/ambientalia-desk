// Búsqueda del listado de tickets por número, serial, código de servicio y cliente (RQ-VT-11, RQ-VT-17). Su patrón es
// UNO para los cuatro campos de texto y lo comparte el autocompletado de la recepción (RQ-VT-12); dos pruebas lo enfrentan
// a `searchEquipos` y a `searchClients`/`normalizarNombreCliente` (molde H5). El cliente NO la reescribe.

/** Longitud máxima del texto de búsqueda, medida DESPUÉS de recortar los extremos. */
export const BUSQUEDA_MAX = 64

/** Tope de `integer` en Postgres: un número mayor no cabe en `tickets.number` y no puede compararse. */
const INTEGER_MAX = 2147483647

/**
 * Patrón `LIKE` de serial, código y cliente: recorta los extremos, pasa a minúsculas y envuelve en `%…%` («contiene»).
 * Espacios interiores, `%`, `_`, acentos y puntuación se conservan tal cual (S-1 de RQ-VT-17). El vacío da `%%`.
 */
export function patronSerial(q: string): string {
  return `%${q.trim().toLowerCase()}%`
}

export interface BusquedaTickets { numero: number | null; patron: string }

export type LecturaBusqueda = { ok: true; filtro: BusquedaTickets | null } | { ok: false; error: string }

/**
 * Lee el `q` crudo de la petición. `undefined`, vacío o de sólo espacios: sin búsqueda. Lo que no es texto
 * o supera `BUSQUEDA_MAX` tras recortar: error. El número sale de `^#?(\d+)$` sobre el texto recortado; el
 * patrón de texto lleva el texto entero, `#` incluido.
 */
export function leerBusquedaTickets(q: unknown): LecturaBusqueda {
  if (q === undefined) return { ok: true, filtro: null }
  if (typeof q !== 'string') return { ok: false, error: 'Búsqueda inválida' }
  const texto = q.trim()
  if (texto === '') return { ok: true, filtro: null }
  if (texto.length > BUSQUEDA_MAX) return { ok: false, error: `La búsqueda admite ${BUSQUEDA_MAX} caracteres como máximo` }
  const m = /^#?(\d+)$/.exec(texto)
  const n = m ? Number(m[1]) : null
  return { ok: true, filtro: { numero: n !== null && n <= INTEGER_MAX ? n : null, patron: patronSerial(texto) } }
}
