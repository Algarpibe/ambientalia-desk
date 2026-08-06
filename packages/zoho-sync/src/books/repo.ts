import type { Queryable } from '../db/migrate'
import type { ClientLite, SalesOrderLite } from '@ambientalia/shared'

function clientToLite(r: any): ClientLite {
  return {
    id: r.id, name: r.name, nit: r.nit ?? undefined, email: r.email ?? undefined, companyName: r.company_name ?? undefined,
    direccion: r.direccion ?? undefined, ciudad: r.ciudad ?? undefined,
    telefono: r.telefono ?? undefined, personaContacto: r.persona_contacto ?? undefined,
  }
}
/**
 * Una columna `date` (sin hora) como `YYYY-MM-DD`.
 *
 * Hace falta porque pg entrega un `date` como objeto `Date`, y al serializar a JSON sale el instante
 * completo (`2026-07-15T00:00:00.000Z`). El `<input type="date">` que recibe esta fecha en el
 * formulario de transición exige `YYYY-MM-DD` EXACTO: ante cualquier otra cosa se queda en blanco y
 * no avisa de nada.
 *
 * Con getters LOCALES y NO con `toISOString()`: pg construye ese `Date` como medianoche local, así
 * que al oeste de Greenwich —Colombia es UTC-5— el ISO cae al día ANTERIOR y la fecha rodaría un día.
 * Ese fallo no se manifiesta bajo `TZ=UTC`, que es lo que fuerza vitest, de modo que ningún test lo
 * cazaría: por eso queda escrito aquí.
 */
function fechaSolo(v: unknown): string | undefined {
  if (!v) return undefined
  if (v instanceof Date) {
    const dosCifras = (n: number) => String(n).padStart(2, '0')
    return `${v.getFullYear()}-${dosCifras(v.getMonth() + 1)}-${dosCifras(v.getDate())}`
  }
  return String(v).slice(0, 10)
}

function salesOrderToLite(r: any): SalesOrderLite {
  return {
    id: r.id, number: r.number, clientId: r.client_id ?? undefined, customerName: r.customer_name ?? undefined,
    date: fechaSolo(r.date), total: r.total != null ? Number(r.total) : undefined, status: r.status ?? undefined,
    ticketNumber: r.ticket_number ?? undefined, potentialName: r.potential_name ?? undefined,
  }
}

// `books.contacts` arrastra proveedores de la era n8n (el sync de Node solo ingiere
// contact_type=customer; el sweep no los borra porque SÍ existen en Zoho). Aquí se descartan para
// que el selector no muestre el mismo nombre repetido. Se excluye solo lo marcado explícitamente
// como NO cliente: las filas heredadas sin `contact_type` se conservan, porque son de procedencia
// desconocida y descartarlas podría ocultar clientes reales. `getClient` (por id) NO filtra, para
// que un ticket o equipo que ya apunte a una de esas filas siga resolviendo su empresa.
export async function searchClients(db: Queryable, q: string, limit = 20): Promise<ClientLite[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,name,company_name,nit,email,direccion,ciudad,telefono,persona_contacto FROM clients
     WHERE COALESCE(contact_type,'customer') = 'customer'
       AND (LOWER(name) LIKE $1 OR LOWER(COALESCE(company_name,'')) LIKE $1 OR LOWER(COALESCE(nit,'')) LIKE $1)
     ORDER BY name LIMIT $2`,
    [like, limit],
  )
  return r.rows.map(clientToLite)
}

export async function getClient(db: Queryable, id: string): Promise<ClientLite | null> {
  const r = await db.query('SELECT id,name,company_name,nit,email,direccion,ciudad,telefono,persona_contacto FROM clients WHERE id=$1', [id])
  return r.rows[0] ? clientToLite(r.rows[0]) : null
}

/**
 * `soloLibres` deja fuera las órdenes que ya usa algún ticket de Desk: al elegir una para un ticket
 * nuevo, las cogidas solo son ruido con el que equivocarse.
 *
 * Mira las DOS vías porque no siempre hay `salesorder_id`: solo lo deja quien eligió la OV en un
 * buscador. Los tickets venidos de Zoho y los creados tecleando el número a mano únicamente tienen
 * `orden_venta`, y sin esa segunda condición sus órdenes seguirían apareciendo como libres.
 *
 * Es opcional y por defecto NO se aplica: esta función vive en el paquete que también consume el
 * worker del hub, donde la tabla `tickets` puede no existir.
 */
export async function searchSalesOrders(db: Queryable, q: string, clientId?: string | null, limit = 20, soloLibres = false): Promise<SalesOrderLite[]> {
  const like = `%${q.toLowerCase()}%`
  const params: unknown[] = [like]
  let clientFilter = ''
  if (clientId) { params.push(clientId); clientFilter = `AND so.client_id = $${params.length}` }
  /*
   * Dos `NOT IN` y no un `NOT EXISTS` correlacionado, que sería lo natural: pg-mem —el motor de los
   * tests— no resuelve la correlación (`column "so.id" does not exist`, comprobado), así que ese
   * camino quedaba sin cobertura. `NOT IN` y `LEFT JOIN` sí los soporta.
   *
   * El `IS NOT NULL` / `<> ''` de cada subconsulta NO es adorno: `NOT IN` con un solo NULL dentro
   * devuelve NULL para TODAS las filas, y el buscador saldría vacío en cuanto un ticket tuviera la
   * columna sin rellenar — que es el caso de casi todos.
   */
  const libresFilter = soloLibres
    ? `AND so.id NOT IN (SELECT salesorder_id FROM tickets WHERE salesorder_id IS NOT NULL)
       AND so.number NOT IN (SELECT orden_venta FROM tickets WHERE COALESCE(orden_venta,'') <> '')`
    : ''
  params.push(limit)
  // Solo las OVs que en Zoho salen con "Estado de pedido" = Confirmado (`order_status = 'open'`):
  // quedan fuera borradores, facturadas y anuladas. Las parcialmente facturadas siguen dentro
  // (siguen confirmadas y con ítems pendientes). El lookup por id (getSalesOrder) NO filtra, para
  // que una OV ya elegida se siga resolviendo aunque cambie de estado entre elegir y guardar.
  const r = await db.query(
    `SELECT so.id,so.number,so.client_id,so.customer_name,so.date,so.total,so.status,so.ticket_number,so.potential_name
       FROM sales_orders so
      WHERE so.order_status = 'open'
        AND (LOWER(so.number) LIKE $1 OR LOWER(COALESCE(so.customer_name,'')) LIKE $1) ${clientFilter} ${libresFilter}
      ORDER BY so.date DESC NULLS LAST LIMIT $${params.length}`,
    params,
  )
  return r.rows.map(salesOrderToLite)
}

export async function getSalesOrder(db: Queryable, id: string): Promise<SalesOrderLite | null> {
  const r = await db.query('SELECT id,number,client_id,customer_name,date,total,status,ticket_number,potential_name FROM sales_orders WHERE id=$1', [id])
  return r.rows[0] ? salesOrderToLite(r.rows[0]) : null
}
