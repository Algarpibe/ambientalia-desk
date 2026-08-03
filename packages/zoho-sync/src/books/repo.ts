import type { Queryable } from '../db/migrate'
import type { ClientLite, SalesOrderLite } from '@ambientalia/shared'

function clientToLite(r: any): ClientLite {
  return { id: r.id, name: r.name, nit: r.nit ?? undefined, email: r.email ?? undefined, companyName: r.company_name ?? undefined }
}
function salesOrderToLite(r: any): SalesOrderLite {
  return {
    id: r.id, number: r.number, clientId: r.client_id ?? undefined, customerName: r.customer_name ?? undefined,
    date: r.date ?? undefined, total: r.total != null ? Number(r.total) : undefined, status: r.status ?? undefined,
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
    `SELECT id,name,company_name,nit,email FROM clients
     WHERE COALESCE(contact_type,'customer') = 'customer'
       AND (LOWER(name) LIKE $1 OR LOWER(COALESCE(company_name,'')) LIKE $1 OR LOWER(COALESCE(nit,'')) LIKE $1)
     ORDER BY name LIMIT $2`,
    [like, limit],
  )
  return r.rows.map(clientToLite)
}

export async function getClient(db: Queryable, id: string): Promise<ClientLite | null> {
  const r = await db.query('SELECT id,name,company_name,nit,email FROM clients WHERE id=$1', [id])
  return r.rows[0] ? clientToLite(r.rows[0]) : null
}

export async function searchSalesOrders(db: Queryable, q: string, clientId?: string | null, limit = 20): Promise<SalesOrderLite[]> {
  const like = `%${q.toLowerCase()}%`
  const params: unknown[] = [like]
  let clientFilter = ''
  if (clientId) { params.push(clientId); clientFilter = `AND client_id = $${params.length}` }
  params.push(limit)
  // Solo las OVs que en Zoho salen con "Estado de pedido" = Confirmado (`order_status = 'open'`):
  // quedan fuera borradores, facturadas y anuladas. Las parcialmente facturadas siguen dentro
  // (siguen confirmadas y con ítems pendientes). El lookup por id (getSalesOrder) NO filtra, para
  // que una OV ya elegida se siga resolviendo aunque cambie de estado entre elegir y guardar.
  const r = await db.query(
    `SELECT id,number,client_id,customer_name,date,total,status,ticket_number,potential_name FROM sales_orders
     WHERE order_status = 'open'
       AND (LOWER(number) LIKE $1 OR LOWER(COALESCE(customer_name,'')) LIKE $1) ${clientFilter}
     ORDER BY date DESC NULLS LAST LIMIT $${params.length}`,
    params,
  )
  return r.rows.map(salesOrderToLite)
}

export async function getSalesOrder(db: Queryable, id: string): Promise<SalesOrderLite | null> {
  const r = await db.query('SELECT id,number,client_id,customer_name,date,total,status,ticket_number,potential_name FROM sales_orders WHERE id=$1', [id])
  return r.rows[0] ? salesOrderToLite(r.rows[0]) : null
}
