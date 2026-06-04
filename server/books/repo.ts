import type { Queryable } from '../db/migrate'
import type { ClientRow, SalesOrderRow } from './mappers'
import type { ClientLite, SalesOrderLite } from '../../shared/types'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertClient(db: Queryable, r: ClientRow): Promise<void> {
  await db.query(
    `INSERT INTO clients (id,name,company_name,nit,email,phone,mobile,contact_person,customer_sub_type,status,source,raw,last_modified_time,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now())
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,company_name=EXCLUDED.company_name,nit=EXCLUDED.nit,
       email=EXCLUDED.email,phone=EXCLUDED.phone,mobile=EXCLUDED.mobile,contact_person=EXCLUDED.contact_person,
       customer_sub_type=EXCLUDED.customer_sub_type,status=EXCLUDED.status,raw=EXCLUDED.raw,
       last_modified_time=EXCLUDED.last_modified_time,synced_at=now(),updated_at=now()`,
    [r.id, r.name, r.company_name, r.nit, r.email, r.phone, r.mobile, r.contact_person, r.customer_sub_type, r.status, r.source, J(r.raw), r.last_modified_time],
  )
}

export async function upsertSalesOrder(db: Queryable, r: SalesOrderRow): Promise<void> {
  await db.query(
    `INSERT INTO sales_orders (id,number,client_id,customer_name,date,total,currency_code,status,ticket_number,potential_name,salesperson_name,source,raw,last_modified_time,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())
     ON CONFLICT (id) DO UPDATE SET number=EXCLUDED.number,client_id=EXCLUDED.client_id,customer_name=EXCLUDED.customer_name,
       date=EXCLUDED.date,total=EXCLUDED.total,currency_code=EXCLUDED.currency_code,status=EXCLUDED.status,
       ticket_number=EXCLUDED.ticket_number,potential_name=EXCLUDED.potential_name,salesperson_name=EXCLUDED.salesperson_name,
       raw=EXCLUDED.raw,last_modified_time=EXCLUDED.last_modified_time,synced_at=now(),updated_at=now()`,
    [r.id, r.number, r.client_id, r.customer_name, r.date, r.total, r.currency_code, r.status, r.ticket_number, r.potential_name, r.salesperson_name, r.source, J(r.raw), r.last_modified_time],
  )
}

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

export async function searchClients(db: Queryable, q: string, limit = 20): Promise<ClientLite[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,name,company_name,nit,email FROM clients
     WHERE LOWER(name) LIKE $1 OR LOWER(COALESCE(company_name,'')) LIKE $1 OR LOWER(COALESCE(nit,'')) LIKE $1
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
  const r = await db.query(
    `SELECT id,number,client_id,customer_name,date,total,status,ticket_number,potential_name FROM sales_orders
     WHERE (LOWER(number) LIKE $1 OR LOWER(COALESCE(customer_name,'')) LIKE $1) ${clientFilter}
     ORDER BY date DESC NULLS LAST LIMIT $${params.length}`,
    params,
  )
  return r.rows.map(salesOrderToLite)
}

export async function getSalesOrder(db: Queryable, id: string): Promise<SalesOrderLite | null> {
  const r = await db.query('SELECT id,number,client_id,customer_name,date,total,status,ticket_number,potential_name FROM sales_orders WHERE id=$1', [id])
  return r.rows[0] ? salesOrderToLite(r.rows[0]) : null
}

export async function maxLastModified(db: Queryable, table: 'clients' | 'sales_orders'): Promise<string | null> {
  const r = await db.query(`SELECT MAX(last_modified_time) AS m FROM ${table}`)
  return r.rows[0]?.m ?? null
}
