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
