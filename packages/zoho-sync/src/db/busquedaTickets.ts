import type { BusquedaTickets } from '@ambientalia/shared'

/**
 * Fragmento SQL de la búsqueda del listado por número de ticket y por serial (RQ-VT-11).
 *
 * Vive en fichero propio y no dentro de `repo.ts` para que ese fichero, el más citado del repositorio,
 * no gane líneas: sólo llama a esta función.
 *
 * `desde` es el índice del primer parámetro libre de la consulta que lo usa. El serial se busca en la copia
 * del ticket Y en el equipo enlazado, porque el serial de un equipo se puede corregir y la copia no se
 * actualiza. Va con subconsulta `IN (SELECT …)` y no con `LEFT JOIN`: no puede duplicar filas.
 *
 * Los paréntesis exteriores son la guarda de POSICIÓN: sin ellos el `OR` se salta el filtro de estado y
 * un cerrado que casa aparece entre los activos. Sin filtro devuelve cadenas vacías y ningún parámetro,
 * de modo que el SQL emitido es el de siempre.
 */
export function sqlBusquedaTickets(f: BusquedaTickets | null | undefined, desde: number): { and: string; where: string; params: unknown[] } {
  if (!f) return { and: '', where: '', params: [] }
  const conNumero = f.numero !== null
  const p = conNumero ? desde + 1 : desde
  const serial = `LOWER(t.serial) LIKE $${p} OR t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $${p})`
  const predicado = conNumero ? `(t.number = $${desde} OR ${serial})` : `(${serial})`
  return { and: ` AND ${predicado}`, where: ` WHERE ${predicado}`, params: conNumero ? [f.numero, f.patron] : [f.patron] }
}
