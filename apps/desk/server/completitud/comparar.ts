/**
 * verificacion-completitud (1G-03, D8, D11) · comparación pura de ids. Sin lectura de Zoho ni de la base.
 * Las listas se comparan como CONJUNTOS de ids: el recuento declarado por Zoho no se lee nunca (E-266) y igual cantidad con ids distintos
 * es discrepancia. Toda salida va en orden fijo: por longitud y luego por texto (`'9'` antes que `'10'`).
 */
export interface AdjuntoId { id: string; size: number | null }
export interface ComparacionIds { faltaEnDesk: string[]; faltaEnZoho: string[]; casan: number }
export interface ComparacionAdjuntos extends ComparacionIds { distintoTamano: { id: string; zoho: number | null; desk: number | null }[] }

const porLongitudYTexto = (a: string, b: string): number => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)

export function compararIds(zoho: string[], desk: string[]): ComparacionIds {
  const z = new Set(zoho)
  const d = new Set(desk)
  return { faltaEnDesk: [...z].filter((id) => !d.has(id)).sort(porLongitudYTexto), faltaEnZoho: [...d].filter((id) => !z.has(id)).sort(porLongitudYTexto), casan: [...z].filter((id) => d.has(id)).length }
}

/** Unión por id de las dos vías de adjuntos de Zoho: cada id cuenta una vez y manda el tamaño del lado de la conversación (el primero). */
export function unirPorId(deConversaciones: AdjuntoId[], deSegunda: AdjuntoId[]): AdjuntoId[] {
  const unidos = new Map<string, AdjuntoId>()
  for (const a of [...deConversaciones, ...deSegunda]) if (!unidos.has(a.id)) unidos.set(a.id, a)
  return [...unidos.values()]
}

/** Adjuntos de Zoho frente a los de Desk por id y `size`: el mismo id con otro tamaño es diferencia (CA-3), no ausencia. */
export function compararAdjuntos(zoho: AdjuntoId[], desk: AdjuntoId[]): ComparacionAdjuntos {
  const delDesk = new Map(desk.map((a) => [a.id, a.size]))
  const delZoho = new Map(zoho.map((a) => [a.id, a.size]))
  const ids = compararIds([...delZoho.keys()], [...delDesk.keys()])
  const distintoTamano = [...delZoho].filter(([id, size]) => delDesk.has(id) && delDesk.get(id) !== size).map(([id, size]) => ({ id, zoho: size, desk: delDesk.get(id) ?? null })).sort((a, b) => porLongitudYTexto(a.id, b.id))
  return { ...ids, casan: ids.casan - distintoTamano.length, distintoTamano }
}
