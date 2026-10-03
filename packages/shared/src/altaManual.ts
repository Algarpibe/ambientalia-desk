/**
 * Alta manual de equipo y cliente desconocidos (F1B-15): dominio puro, apto para navegador. Regla
 * invariable 13, punto 1: el prefijo del id provisional y la comparación del serial viven aquí, y el
 * servidor y el cliente los consumen en vez de reescribirlos.
 */

/**
 * Prefijo del identificador de un cliente provisional (D4, RQ-TC-30). Un id de Books se resuelve por
 * Books ANTES de mirar este prefijo, así que su camino no cambia.
 */
export const PREFIJO_PROVISIONAL = 'prov-'

/** `true` si el id lleva el prefijo de un cliente provisional. Un valor que no es texto no lo lleva. */
export function esIdProvisional(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith(PREFIJO_PROVISIONAL)
}

/**
 * ¿El serial coincide con su confirmación? Se comparan recortados y sin tocar mayúsculas (RQ-HV-16). Dos
 * vacíos NO coinciden: la presencia del serial es del escalón A y no puede pasar por una coincidencia.
 */
export function serialesCoinciden(serial: unknown, confirmacion: unknown): boolean {
  if (typeof serial !== 'string' || typeof confirmacion !== 'string') return false
  const a = serial.trim()
  return a !== '' && a === confirmacion.trim()
}

/**
 * Base de un NIT para compararlo (P-B, RQ-TC-30): lo anterior al primer guion, sólo dígitos. Quita puntos,
 * espacios y el dígito de verificación escrito tras el guion: «900.123.456-7» ≡ «900123456». Sin dígitos da `''`.
 */
export function normalizarNit(nit: unknown): string {
  if (typeof nit !== 'string') return ''
  return nit.split('-')[0]!.replace(/\D/g, '')
}

/**
 * ¿El NIT tecleado en el alta es el de este contacto de Books? (P-B, supuesto reversible). Casa si la base del
 * tecleado es la base de Books, o si es exactamente base + DV del NIT de Books escrito con guion
 * («9001234567» casa con «900.123.456-7», y no con «900123456» ni con «900.123.456-3»: sin guion no se distingue
 * de una cédula de diez dígitos).
 *
 * LA GUARDA DEL VACÍO VIVE AQUÍ: una base vacía, de cualquiera de los dos lados, NUNCA casa. Sin ella dos NIT sin
 * dígitos («---» tecleado, o un contacto de Books sin NIT) serían «iguales» y bloquearían el alta con un `409`.
 */
export function nitCoincide(tecleado: unknown, books: unknown): boolean {
  const base = normalizarNit(tecleado)
  const baseBooks = normalizarNit(books)
  if (base === '' || baseBooks === '') return false
  if (base === baseBooks) return true
  const dv = typeof books === 'string' && books.includes('-') ? books.slice(books.indexOf('-') + 1).replace(/\D/g, '') : ''
  return dv !== '' && base === baseBooks + dv && typeof tecleado === 'string' && !tecleado.includes('-')
}

/** Primer conflicto de unicidad del alta (escalón D): el del NIT en Books, o el de la orden de venta, o `null`. */
export type ConflictoUnicidad<C, T> = { tipo: 'nit'; candidatos: C[] } | { tipo: 'ov'; ticket: T }

/**
 * Orden dentro del escalón D (P6): **gana el NIT y la OV va la última**, porque el `409` de la orden de venta
 * ha de seguir siendo la última guarda antes de la primera escritura (RQ-TC-31, RQ-TC-05). Pura, para que el orden
 * sea una prueba y no un comentario (regla de mutación 1). `nitEnBooks` vacío = sin coincidencia.
 */
export function primerConflictoUnicidad<C, T>(c: { nitEnBooks: C[]; ovEnUso: T | null | undefined }): ConflictoUnicidad<C, T> | null {
  if (c.nitEnBooks.length > 0) return { tipo: 'nit', candidatos: c.nitEnBooks }
  if (c.ovEnUso) return { tipo: 'ov', ticket: c.ovEnUso }
  return null
}

/**
 * Motivo por el que «Habilitar Servicio» no pasa (RQ-TS-32, escalón B): el cliente del ticket sigue siendo provisional
 * y/o su equipo sigue pendiente de validar. Nombra juntos lo que falte; `null` si no falta nada. Pura: el servidor la
 * aplica en `exigirAltaValidada` y el cliente sólo la consume para desactivar el botón (regla invariable 13).
 */
export function motivoAltaPendiente(p: { clienteProvisional: boolean; equipoPendiente: boolean }): string | null {
  const faltan: string[] = []
  if (p.clienteProvisional) faltan.push('el cliente es provisional y falta enlazarlo con un contacto de Books')
  if (p.equipoPendiente) faltan.push('el equipo está pendiente de validar')
  return faltan.length ? `No se puede habilitar el servicio: ${faltan.join(' y ')}` : null
}
