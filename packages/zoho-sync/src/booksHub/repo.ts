import type { Queryable } from '../db/migrate'
import type { ContactRow, ItemRow, SalesOrderRow, InvoiceRow, SoLineRow, InvoiceLineRow, CustomerPaymentRow, PaymentInvoiceRow, PurchaseOrderRow, PoLineRow, RetainerInvoiceRow } from './mappers'

const J = (v: unknown) => JSON.stringify(v ?? null)

/**
 * Tablas-cabecera de books.* con marca de agua. Antes la unión se escribía a mano en dos
 * sitios (aquí y en `incremental` de sync.ts); una tabla nueva obligaba a acordarse de ambos.
 */
export type BooksTable = 'contacts' | 'items' | 'sales_orders' | 'invoices' | 'customer_payments' | 'purchase_orders' | 'retainer_invoices'

export async function upsertContact(db: Queryable, r: ContactRow): Promise<void> {
  await db.query(
    `INSERT INTO books.contacts (contact_id,contact_name,company_name,email,nit,direccion,ciudad,departamento,telefono,persona_contacto,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now())
     ON CONFLICT (contact_id) DO UPDATE SET contact_name=EXCLUDED.contact_name,company_name=EXCLUDED.company_name,
       email=EXCLUDED.email,nit=EXCLUDED.nit,direccion=EXCLUDED.direccion,ciudad=EXCLUDED.ciudad,
       departamento=EXCLUDED.departamento,telefono=EXCLUDED.telefono,persona_contacto=EXCLUDED.persona_contacto,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.contact_id, r.contact_name, r.company_name, r.email, r.nit,
      r.direccion, r.ciudad, r.departamento, r.telefono, r.persona_contacto, J(r.raw), r.zoho_last_modified],
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

export async function upsertCustomerPayment(db: Queryable, r: CustomerPaymentRow): Promise<void> {
  await db.query(
    `INSERT INTO books.customer_payments (payment_id,payment_number,customer_id,customer_name,date,payment_mode,reference_number,currency_code,exchange_rate,amount,bcy_amount,unused_amount,bcy_unused_amount,tax_amount_withheld,payment_status,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,now())
     ON CONFLICT (payment_id) DO UPDATE SET payment_number=EXCLUDED.payment_number,customer_id=EXCLUDED.customer_id,customer_name=EXCLUDED.customer_name,
       date=EXCLUDED.date,payment_mode=EXCLUDED.payment_mode,reference_number=EXCLUDED.reference_number,currency_code=EXCLUDED.currency_code,exchange_rate=EXCLUDED.exchange_rate,
       amount=EXCLUDED.amount,bcy_amount=EXCLUDED.bcy_amount,unused_amount=EXCLUDED.unused_amount,bcy_unused_amount=EXCLUDED.bcy_unused_amount,
       tax_amount_withheld=EXCLUDED.tax_amount_withheld,payment_status=EXCLUDED.payment_status,raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.payment_id, r.payment_number, r.customer_id, r.customer_name, r.date, r.payment_mode, r.reference_number, r.currency_code, r.exchange_rate, r.amount, r.bcy_amount, r.unused_amount, r.bcy_unused_amount, r.tax_amount_withheld, r.payment_status, J(r.raw), r.zoho_last_modified],
  )
}

async function insertPaymentInvoice(db: Queryable, r: PaymentInvoiceRow): Promise<void> {
  await db.query(
    `INSERT INTO books.customer_payment_invoices (invoice_payment_id,payment_id,invoice_id,invoice_number,amount_applied,tax_amount_withheld,total,balance,due_date,apply_date,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
     ON CONFLICT (invoice_payment_id) DO UPDATE SET payment_id=EXCLUDED.payment_id,invoice_id=EXCLUDED.invoice_id,invoice_number=EXCLUDED.invoice_number,
       amount_applied=EXCLUDED.amount_applied,tax_amount_withheld=EXCLUDED.tax_amount_withheld,total=EXCLUDED.total,balance=EXCLUDED.balance,
       due_date=EXCLUDED.due_date,apply_date=EXCLUDED.apply_date,raw=EXCLUDED.raw,synced_at=now()`,
    [r.invoice_payment_id, r.payment_id, r.invoice_id, r.invoice_number, r.amount_applied, r.tax_amount_withheld, r.total, r.balance, r.due_date, r.apply_date, J(r.raw)],
  )
}

/** Reemplaza TODAS las facturas aplicadas de un pago (borra previas + inserta), evitando huérfanas. */
export async function replacePaymentInvoices(db: Queryable, paymentId: string, lines: PaymentInvoiceRow[]): Promise<void> {
  await db.query('DELETE FROM books.customer_payment_invoices WHERE payment_id=$1', [paymentId])
  for (const l of lines) await insertPaymentInvoice(db, l)
}

export async function upsertPurchaseOrder(db: Queryable, r: PurchaseOrderRow): Promise<void> {
  await db.query(
    `INSERT INTO books.purchase_orders (purchaseorder_id,purchaseorder_number,reference_number,vendor_id,vendor_name,date,delivery_date,status,order_status,received_status,billed_status,currency_code,exchange_rate,total,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now())
     ON CONFLICT (purchaseorder_id) DO UPDATE SET purchaseorder_number=EXCLUDED.purchaseorder_number,reference_number=EXCLUDED.reference_number,
       vendor_id=EXCLUDED.vendor_id,vendor_name=EXCLUDED.vendor_name,date=EXCLUDED.date,delivery_date=EXCLUDED.delivery_date,
       status=EXCLUDED.status,order_status=EXCLUDED.order_status,received_status=EXCLUDED.received_status,billed_status=EXCLUDED.billed_status,
       currency_code=EXCLUDED.currency_code,exchange_rate=EXCLUDED.exchange_rate,total=EXCLUDED.total,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.purchaseorder_id, r.purchaseorder_number, r.reference_number, r.vendor_id, r.vendor_name, r.date, r.delivery_date, r.status, r.order_status, r.received_status, r.billed_status, r.currency_code, r.exchange_rate, r.total, J(r.raw), r.zoho_last_modified],
  )
}

async function insertPoLine(db: Queryable, r: PoLineRow): Promise<void> {
  await db.query(
    `INSERT INTO books.purchase_order_line_items (line_item_id,purchaseorder_id,item_id,sku,name,quantity,quantity_received,quantity_cancelled,quantity_billed,rate,bcy_rate,item_total,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
     ON CONFLICT (line_item_id) DO UPDATE SET purchaseorder_id=EXCLUDED.purchaseorder_id,item_id=EXCLUDED.item_id,sku=EXCLUDED.sku,name=EXCLUDED.name,
       quantity=EXCLUDED.quantity,quantity_received=EXCLUDED.quantity_received,quantity_cancelled=EXCLUDED.quantity_cancelled,quantity_billed=EXCLUDED.quantity_billed,
       rate=EXCLUDED.rate,bcy_rate=EXCLUDED.bcy_rate,item_total=EXCLUDED.item_total,raw=EXCLUDED.raw,synced_at=now()`,
    [r.line_item_id, r.purchaseorder_id, r.item_id, r.sku, r.name, r.quantity, r.quantity_received, r.quantity_cancelled, r.quantity_billed, r.rate, r.bcy_rate, r.item_total, J(r.raw)],
  )
}

/** Reemplaza TODAS las líneas de una OC (borra previas + inserta), evitando huérfanas. */
export async function replacePoLines(db: Queryable, purchaseorderId: string, lines: PoLineRow[]): Promise<void> {
  await db.query('DELETE FROM books.purchase_order_line_items WHERE purchaseorder_id=$1', [purchaseorderId])
  for (const l of lines) await insertPoLine(db, l)
}

export async function upsertRetainerInvoice(db: Queryable, r: RetainerInvoiceRow): Promise<void> {
  await db.query(
    `INSERT INTO books.retainer_invoices (retainerinvoice_id,retainerinvoice_number,reference_number,date,status,customer_id,customer_name,currency_code,total,payment_made,payment_drawn,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
     ON CONFLICT (retainerinvoice_id) DO UPDATE SET retainerinvoice_number=EXCLUDED.retainerinvoice_number,reference_number=EXCLUDED.reference_number,
       date=EXCLUDED.date,status=EXCLUDED.status,customer_id=EXCLUDED.customer_id,customer_name=EXCLUDED.customer_name,
       currency_code=EXCLUDED.currency_code,total=EXCLUDED.total,payment_made=EXCLUDED.payment_made,payment_drawn=EXCLUDED.payment_drawn,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.retainerinvoice_id, r.retainerinvoice_number, r.reference_number, r.date, r.status, r.customer_id, r.customer_name, r.currency_code, r.total, r.payment_made, r.payment_drawn, J(r.raw), r.zoho_last_modified],
  )
}

/** Marca de agua: máximo zoho_last_modified de una de las tablas-cabecera. */
export async function maxZohoLastModified(db: Queryable, table: BooksTable): Promise<string | null> {
  const r = await db.query(`SELECT MAX(zoho_last_modified) AS m FROM books.${table}`)
  return r.rows[0]?.m ?? null
}
