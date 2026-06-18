import type { Queryable } from '../db/migrate'
import type { ContactRow, ItemRow, SalesOrderRow, InvoiceRow, SoLineRow, InvoiceLineRow } from './mappers'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertContact(db: Queryable, r: ContactRow): Promise<void> {
  await db.query(
    `INSERT INTO books.contacts (contact_id,contact_name,company_name,email,nit,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,now())
     ON CONFLICT (contact_id) DO UPDATE SET contact_name=EXCLUDED.contact_name,company_name=EXCLUDED.company_name,
       email=EXCLUDED.email,nit=EXCLUDED.nit,raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.contact_id, r.contact_name, r.company_name, r.email, r.nit, J(r.raw), r.zoho_last_modified],
  )
}

export async function upsertItem(db: Queryable, r: ItemRow): Promise<void> {
  await db.query(
    `INSERT INTO books.items (item_id,name,category_id,category_name,status,rate,purchase_rate,sku,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
     ON CONFLICT (item_id) DO UPDATE SET name=EXCLUDED.name,category_id=EXCLUDED.category_id,category_name=EXCLUDED.category_name,
       status=EXCLUDED.status,rate=EXCLUDED.rate,purchase_rate=EXCLUDED.purchase_rate,sku=EXCLUDED.sku,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.item_id, r.name, r.category_id, r.category_name, r.status, r.rate, r.purchase_rate, r.sku, J(r.raw), r.zoho_last_modified],
  )
}

export async function upsertSalesOrder(db: Queryable, r: SalesOrderRow): Promise<void> {
  await db.query(
    `INSERT INTO books.sales_orders (salesorder_id,salesorder_number,reference_number,date,customer_id,customer_name,status,currency_code,exchange_rate,sub_total,total,bcy_sub_total,bcy_tax_total,bcy_total,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now())
     ON CONFLICT (salesorder_id) DO UPDATE SET salesorder_number=EXCLUDED.salesorder_number,reference_number=EXCLUDED.reference_number,
       date=EXCLUDED.date,customer_id=EXCLUDED.customer_id,customer_name=EXCLUDED.customer_name,status=EXCLUDED.status,
       currency_code=EXCLUDED.currency_code,exchange_rate=EXCLUDED.exchange_rate,sub_total=EXCLUDED.sub_total,total=EXCLUDED.total,
       bcy_sub_total=EXCLUDED.bcy_sub_total,bcy_tax_total=EXCLUDED.bcy_tax_total,bcy_total=EXCLUDED.bcy_total,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.salesorder_id, r.salesorder_number, r.reference_number, r.date, r.customer_id, r.customer_name, r.status, r.currency_code, r.exchange_rate, r.sub_total, r.total, r.bcy_sub_total, r.bcy_tax_total, r.bcy_total, J(r.raw), r.zoho_last_modified],
  )
}

export async function upsertInvoice(db: Queryable, r: InvoiceRow): Promise<void> {
  await db.query(
    `INSERT INTO books.invoices (invoice_id,invoice_number,reference_number,date,due_date,customer_id,customer_name,status,currency_code,exchange_rate,sub_total,total,bcy_sub_total,bcy_tax_total,bcy_total,salesorder_id,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,now())
     ON CONFLICT (invoice_id) DO UPDATE SET invoice_number=EXCLUDED.invoice_number,reference_number=EXCLUDED.reference_number,
       date=EXCLUDED.date,due_date=EXCLUDED.due_date,customer_id=EXCLUDED.customer_id,customer_name=EXCLUDED.customer_name,status=EXCLUDED.status,
       currency_code=EXCLUDED.currency_code,exchange_rate=EXCLUDED.exchange_rate,sub_total=EXCLUDED.sub_total,total=EXCLUDED.total,
       bcy_sub_total=EXCLUDED.bcy_sub_total,bcy_tax_total=EXCLUDED.bcy_tax_total,bcy_total=EXCLUDED.bcy_total,salesorder_id=EXCLUDED.salesorder_id,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.invoice_id, r.invoice_number, r.reference_number, r.date, r.due_date, r.customer_id, r.customer_name, r.status, r.currency_code, r.exchange_rate, r.sub_total, r.total, r.bcy_sub_total, r.bcy_tax_total, r.bcy_total, r.salesorder_id, J(r.raw), r.zoho_last_modified],
  )
}

async function insertSoLine(db: Queryable, r: SoLineRow): Promise<void> {
  await db.query(
    `INSERT INTO books.salesorder_line_items (line_item_id,salesorder_id,item_id,name,quantity,rate,bcy_rate,item_total,tax_percentage,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
     ON CONFLICT (line_item_id) DO UPDATE SET salesorder_id=EXCLUDED.salesorder_id,item_id=EXCLUDED.item_id,name=EXCLUDED.name,
       quantity=EXCLUDED.quantity,rate=EXCLUDED.rate,bcy_rate=EXCLUDED.bcy_rate,item_total=EXCLUDED.item_total,tax_percentage=EXCLUDED.tax_percentage,raw=EXCLUDED.raw,synced_at=now()`,
    [r.line_item_id, r.salesorder_id, r.item_id, r.name, r.quantity, r.rate, r.bcy_rate, r.item_total, r.tax_percentage, J(r.raw)],
  )
}
async function insertInvoiceLine(db: Queryable, r: InvoiceLineRow): Promise<void> {
  await db.query(
    `INSERT INTO books.invoice_line_items (line_item_id,invoice_id,item_id,name,quantity,rate,bcy_rate,item_total,tax_percentage,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
     ON CONFLICT (line_item_id) DO UPDATE SET invoice_id=EXCLUDED.invoice_id,item_id=EXCLUDED.item_id,name=EXCLUDED.name,
       quantity=EXCLUDED.quantity,rate=EXCLUDED.rate,bcy_rate=EXCLUDED.bcy_rate,item_total=EXCLUDED.item_total,tax_percentage=EXCLUDED.tax_percentage,raw=EXCLUDED.raw,synced_at=now()`,
    [r.line_item_id, r.invoice_id, r.item_id, r.name, r.quantity, r.rate, r.bcy_rate, r.item_total, r.tax_percentage, J(r.raw)],
  )
}

/** Reemplaza TODAS las líneas de un salesorder (borra previas + inserta nuevas), evitando huérfanas. */
export async function replaceSoLines(db: Queryable, salesorderId: string, lines: SoLineRow[]): Promise<void> {
  await db.query('DELETE FROM books.salesorder_line_items WHERE salesorder_id=$1', [salesorderId])
  for (const l of lines) await insertSoLine(db, l)
}
export async function replaceInvoiceLines(db: Queryable, invoiceId: string, lines: InvoiceLineRow[]): Promise<void> {
  await db.query('DELETE FROM books.invoice_line_items WHERE invoice_id=$1', [invoiceId])
  for (const l of lines) await insertInvoiceLine(db, l)
}

/** Marca de agua: máximo zoho_last_modified de una de las 4 tablas-cabecera. */
export async function maxZohoLastModified(db: Queryable, table: 'contacts' | 'items' | 'sales_orders' | 'invoices'): Promise<string | null> {
  const r = await db.query(`SELECT MAX(zoho_last_modified) AS m FROM books.${table}`)
  return r.rows[0]?.m ?? null
}
