const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)
const str = (v: unknown): string | null => (v != null && v !== '' ? String(v) : null)

export interface ContactRow { contact_id: string; contact_name: string | null; company_name: string | null; email: string | null; nit: string | null; raw: unknown; zoho_last_modified: string | null }
export interface ItemRow { item_id: string; name: string | null; category_id: string | null; category_name: string | null; status: string | null; rate: number | null; purchase_rate: number | null; sku: string | null; raw: unknown; zoho_last_modified: string | null }
export interface SalesOrderRow { salesorder_id: string; salesorder_number: string | null; reference_number: string | null; date: string | null; customer_id: string | null; customer_name: string | null; status: string | null; currency_code: string | null; exchange_rate: number | null; sub_total: number | null; total: number | null; bcy_sub_total: number | null; bcy_tax_total: number | null; bcy_total: number | null; raw: unknown; zoho_last_modified: string | null }
export interface LineRow { line_item_id: string; item_id: string | null; name: string | null; quantity: number | null; rate: number | null; bcy_rate: number | null; item_total: number | null; tax_percentage: number | null; raw: unknown }
export interface SoLineRow extends LineRow { salesorder_id: string }
export interface InvoiceLineRow extends LineRow { invoice_id: string }
export interface InvoiceRow { invoice_id: string; invoice_number: string | null; reference_number: string | null; date: string | null; due_date: string | null; customer_id: string | null; customer_name: string | null; status: string | null; currency_code: string | null; exchange_rate: number | null; sub_total: number | null; total: number | null; bcy_sub_total: number | null; bcy_tax_total: number | null; bcy_total: number | null; salesorder_id: string | null; raw: unknown; zoho_last_modified: string | null }

export function contactRow(raw: any): ContactRow {
  return {
    contact_id: raw.contact_id, contact_name: str(raw.contact_name), company_name: str(raw.company_name),
    email: str(raw.email), nit: str(raw.cf_nit ?? raw.custom_field_hash?.cf_nit),
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
