import type { BusquedaTickets } from '@ambientalia/shared'

/**
 * Fragmento SQL de la búsqueda del listado por número, serial, código de servicio y cliente (RQ-VT-11, RQ-VT-17).
 *
 * Vive en fichero propio y no dentro de `repo.ts` para que ese fichero, el más citado del repositorio,
 * no gane líneas: sólo llama a esta función.
 *
 * `desde` es el índice del primer parámetro libre. El serial va en la copia del ticket Y en el equipo (se corrige y la
 * copia no); el cliente, en la cuenta de Desk, en Books y en el provisional NO enlazado (`conProvisionales` lo rellena
 * después). Todo con subconsulta `IN (SELECT …)` y no con `LEFT JOIN`: no duplica filas y vale sin `JOIN` (recuento).
 *
 * Los paréntesis exteriores son la guarda de POSICIÓN: sin ellos el `OR` se salta el filtro de estado y
 * un cerrado que casa aparece entre los activos. Sin filtro devuelve cadenas vacías y ningún parámetro,
 * de modo que el SQL emitido es el de siempre.
 */
export function sqlBusquedaTickets(f: BusquedaTickets | null | undefined, desde: number): { and: string; where: string; params: unknown[] } {
  if (!f) return { and: '', where: '', params: [] }
  const conNumero = f.numero !== null
  const p = conNumero ? desde + 1 : desde
  const serial = `LOWER(t.serial) LIKE $${p} OR t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $${p}) OR LOWER(t.codigo_servicio) LIKE $${p} OR t.account_id IN (SELECT id FROM accounts WHERE LOWER(name) LIKE $${p}) OR t.client_id IN (SELECT id FROM clients WHERE LOWER(name) LIKE $${p}) OR t.client_id IN (SELECT id FROM public.clientes_provisionales WHERE enlazado_a IS NULL AND LOWER(razon_social) LIKE $${p})`
  const predicado = conNumero ? `(t.number = $${desde} OR ${serial})` : `(${serial})`
  return { and: ` AND ${predicado}`, where: ` WHERE ${predicado}`, params: conNumero ? [f.numero, f.patron] : [f.patron] }
}
