const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)
const str = (v: unknown): string | null => (v != null && v !== '' ? String(v) : null)

export interface ContactRow { contact_id: string; contact_name: string | null; company_name: string | null; email: string | null; nit: string | null; direccion: string | null; ciudad: string | null; departamento: string | null; telefono: string | null; persona_contacto: string | null; raw: unknown; zoho_last_modified: string | null }
export interface ItemRow { item_id: string; name: string | null; category_id: string | null; category_name: string | null; status: string | null; rate: number | null; purchase_rate: number | null; sku: string | null; raw: unknown; zoho_last_modified: string | null }
export interface SalesOrderRow { salesorder_id: string; salesorder_number: string | null; reference_number: string | null; date: string | null; customer_id: string | null; customer_name: string | null; status: string | null; currency_code: string | null; exchange_rate: number | null; sub_total: number | null; total: number | null; bcy_sub_total: number | null; bcy_tax_total: number | null; bcy_total: number | null; raw: unknown; zoho_last_modified: string | null }
export interface LineRow { line_item_id: string; item_id: string | null; name: string | null; quantity: number | null; rate: number | null; bcy_rate: number | null; item_total: number | null; tax_percentage: number | null; raw: unknown }
export interface SoLineRow extends LineRow { salesorder_id: string }
export interface InvoiceLineRow extends LineRow { invoice_id: string }
export interface InvoiceRow { invoice_id: string; invoice_number: string | null; reference_number: string | null; date: string | null; due_date: string | null; customer_id: string | null; customer_name: string | null; status: string | null; currency_code: string | null; exchange_rate: number | null; sub_total: number | null; total: number | null; bcy_sub_total: number | null; bcy_tax_total: number | null; bcy_total: number | null; salesorder_id: string | null; raw: unknown; zoho_last_modified: string | null }
export interface CustomerPaymentRow { payment_id: string; payment_number: string | null; customer_id: string | null; customer_name: string | null; date: string | null; payment_mode: string | null; reference_number: string | null; currency_code: string | null; exchange_rate: number | null; amount: number | null; bcy_amount: number | null; unused_amount: number | null; bcy_unused_amount: number | null; tax_amount_withheld: number | null; payment_status: string | null; raw: unknown; zoho_last_modified: string | null }
export interface PaymentInvoiceRow { invoice_payment_id: string; payment_id: string; invoice_id: string | null; invoice_number: string | null; amount_applied: number | null; tax_amount_withheld: number | null; total: number | null; balance: number | null; due_date: string | null; apply_date: string | null; raw: unknown }
export interface PurchaseOrderRow { purchaseorder_id: string; purchaseorder_number: string | null; reference_number: string | null; vendor_id: string | null; vendor_name: string | null; date: string | null; delivery_date: string | null; status: string | null; order_status: string | null; received_status: string | null; billed_status: string | null; currency_code: string | null; exchange_rate: number | null; total: number | null; raw: unknown; zoho_last_modified: string | null }
export interface PoLineRow { line_item_id: string; purchaseorder_id: string; item_id: string | null; sku: string | null; name: string | null; quantity: number | null; quantity_received: number | null; quantity_cancelled: number | null; quantity_billed: number | null; rate: number | null; bcy_rate: number | null; item_total: number | null; raw: unknown }

export function contactRow(raw: any): ContactRow {
  // Dirección y teléfono viven en `billing_address`, que SOLO viene en el detalle del contacto
  // (GET /contacts/{id}), no en el listado. El documento de remisión los imprime, de ahí que se
  // promuevan a columnas. El `phone` de primer nivel suele venir vacío y el bueno es el de la
  // dirección, pero se prefiere el de primer nivel cuando está relleno.
  const dir = raw.billing_address ?? {}
  // La persona de contacto se compone aquí y no en la vista: pg-mem no implementa TRIM ni CONCAT_WS,
  // y la sentencia entera del CREATE VIEW fallaría dejando la vista `clients` sin crear.
  const persona = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim()
  return {
    contact_id: raw.contact_id, contact_name: str(raw.contact_name), company_name: str(raw.company_name),
    email: str(raw.email), nit: str(raw.cf_nit ?? raw.custom_field_hash?.cf_nit),
    direccion: str(dir.address), ciudad: str(dir.city), departamento: str(dir.state),
    telefono: str(raw.phone) ?? str(dir.phone), persona_contacto: str(persona),
    raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
export function itemRow(raw: any): ItemRow {
  return {
    item_id: raw.item_id, name: str(raw.name), category_id: str(raw.category_id), category_name: str(raw.category_name),
    status: str(raw.status), rate: num(raw.rate), purchase_rate: num(raw.purchase_rate), sku: str(raw.sku),
    raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
export function salesOrderRow(raw: any): SalesOrderRow {
  return {
    salesorder_id: raw.salesorder_id, salesorder_number: str(raw.salesorder_number), reference_number: str(raw.reference_number),
    date: raw.date || null, customer_id: str(raw.customer_id), customer_name: str(raw.customer_name), status: str(raw.status),
    currency_code: str(raw.currency_code), exchange_rate: num(raw.exchange_rate), sub_total: num(raw.sub_total), total: num(raw.total),
    bcy_sub_total: num(raw.bcy_sub_total), bcy_tax_total: num(raw.bcy_tax_total), bcy_total: num(raw.bcy_total),
    raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
function lineCommon(raw: any): LineRow {
  return {
    line_item_id: raw.line_item_id, item_id: str(raw.item_id), name: str(raw.name), quantity: num(raw.quantity),
    rate: num(raw.rate), bcy_rate: num(raw.bcy_rate), item_total: num(raw.item_total), tax_percentage: num(raw.tax_percentage), raw,
  }
}
export function soLineRow(salesorderId: string, raw: any): SoLineRow { return { ...lineCommon(raw), salesorder_id: salesorderId } }
export function invoiceLineRow(invoiceId: string, raw: any): InvoiceLineRow { return { ...lineCommon(raw), invoice_id: invoiceId } }
export function invoiceRow(raw: any): InvoiceRow {
  return {
    invoice_id: raw.invoice_id, invoice_number: str(raw.invoice_number), reference_number: str(raw.reference_number),
    date: raw.date || null, due_date: raw.due_date || null, customer_id: str(raw.customer_id), customer_name: str(raw.customer_name),
    status: str(raw.status), currency_code: str(raw.currency_code), exchange_rate: num(raw.exchange_rate), sub_total: num(raw.sub_total),
    total: num(raw.total), bcy_sub_total: num(raw.bcy_sub_total), bcy_tax_total: num(raw.bcy_tax_total), bcy_total: num(raw.bcy_total),
    salesorder_id: str(raw.salesorder_id), raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
export function customerPaymentRow(raw: any): CustomerPaymentRow {
  const amount = num(raw.amount)
  const exch = num(raw.exchange_rate)
  const unused = num(raw.unused_amount)
  const toBcy = (v: number | null) => (v != null && exch != null ? v * exch : null)
  return {
    payment_id: raw.payment_id, payment_number: str(raw.payment_number),
    customer_id: str(raw.customer_id), customer_name: str(raw.customer_name),
    date: raw.date || null, payment_mode: str(raw.payment_mode), reference_number: str(raw.reference_number),
    currency_code: str(raw.currency_code), exchange_rate: exch,
    amount, bcy_amount: toBcy(amount), unused_amount: unused, bcy_unused_amount: toBcy(unused),
    tax_amount_withheld: num(raw.tax_amount_withheld), payment_status: str(raw.payment_status),
    raw, zoho_last_modified: raw.last_modified_time ?? raw.updated_time ?? null,
  }
}
export function paymentInvoiceRow(paymentId: string, raw: any): PaymentInvoiceRow {
  return {
    invoice_payment_id: raw.invoice_payment_id, payment_id: paymentId,
    invoice_id: str(raw.invoice_id), invoice_number: str(raw.invoice_number),
    amount_applied: num(raw.amount_applied), tax_amount_withheld: num(raw.tax_amount_withheld),
    total: num(raw.total), balance: num(raw.balance),
    due_date: raw.due_date || null, apply_date: raw.apply_date || null, raw,
  }
}
export function purchaseOrderRow(raw: any): PurchaseOrderRow {
  return {
    purchaseorder_id: raw.purchaseorder_id, purchaseorder_number: str(raw.purchaseorder_number),
    reference_number: str(raw.reference_number), vendor_id: str(raw.vendor_id), vendor_name: str(raw.vendor_name),
    date: raw.date || null, delivery_date: raw.delivery_date || null,
    status: str(raw.status), order_status: str(raw.order_status),
    received_status: str(raw.received_status), billed_status: str(raw.billed_status),
    currency_code: str(raw.currency_code), exchange_rate: num(raw.exchange_rate), total: num(raw.total),
    raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
export function poLineRow(purchaseorderId: string, raw: any): PoLineRow {
  return {
    line_item_id: raw.line_item_id, purchaseorder_id: purchaseorderId,
    item_id: str(raw.item_id), sku: str(raw.sku), name: str(raw.name),
    quantity: num(raw.quantity), quantity_received: num(raw.quantity_received),
    quantity_cancelled: num(raw.quantity_cancelled), quantity_billed: num(raw.quantity_billed),
    rate: num(raw.rate), bcy_rate: num(raw.bcy_rate), item_total: num(raw.item_total), raw,
  }
}
