import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateBooks } from './migrate'
import { upsertContact, upsertItem, upsertSalesOrder, upsertInvoice, replaceSoLines, replaceInvoiceLines, upsertRetainerInvoice, maxZohoLastModified } from './repo'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow, retainerInvoiceRow } from './mappers'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateBooks(db) })

describe('booksHub repo', () => {
  it('upsertSalesOrder inserta y luego actualiza (no duplica)', async () => {
    await upsertSalesOrder(db, salesOrderRow({ salesorder_id: 's1', status: 'open', bcy_sub_total: 100, last_modified_time: '2026-06-01T00:00:00Z' }))
    await upsertSalesOrder(db, salesOrderRow({ salesorder_id: 's1', status: 'invoiced', bcy_sub_total: 200, last_modified_time: '2026-06-02T00:00:00Z' }))
    const r = await db.query("SELECT status, bcy_sub_total FROM books.sales_orders WHERE salesorder_id='s1'")
    expect(r.rows.length).toBe(1)
    expect(r.rows[0].status).toBe('invoiced')
  })

  it('replaceSoLines borra las líneas previas y deja solo las nuevas', async () => {
    await upsertSalesOrder(db, salesOrderRow({ salesorder_id: 's1', last_modified_time: '2026-06-01T00:00:00Z' }))
    await replaceSoLines(db, 's1', [soLineRow('s1', { line_item_id: 'a', bcy_rate: 1, quantity: 1 }), soLineRow('s1', { line_item_id: 'b', bcy_rate: 2, quantity: 1 })])
    await replaceSoLines(db, 's1', [soLineRow('s1', { line_item_id: 'c', bcy_rate: 3, quantity: 1 })])
    const r = await db.query("SELECT line_item_id FROM books.salesorder_line_items WHERE salesorder_id='s1' ORDER BY line_item_id")
    expect(r.rows.map((x: any) => x.line_item_id)).toEqual(['c'])
  })

  it('upsertItem y upsertContact persisten', async () => {
    await upsertContact(db, contactRow({ contact_id: 'c1', contact_name: 'A', last_modified_time: '2026-01-01T00:00:00Z' }))
    await upsertItem(db, itemRow({ item_id: 'i1', name: 'X', category_name: 'Cat', last_modified_time: '2026-01-01T00:00:00Z' }))
    expect((await db.query("SELECT 1 FROM books.contacts WHERE contact_id='c1'")).rows.length).toBe(1)
    expect((await db.query("SELECT category_name FROM books.items WHERE item_id='i1'")).rows[0].category_name).toBe('Cat')
  })

  it('upsertInvoice + replaceInvoiceLines', async () => {
    await upsertInvoice(db, invoiceRow({ invoice_id: 'f1', salesorder_id: 's1', status: 'sent', bcy_sub_total: 50, last_modified_time: '2026-06-01T00:00:00Z' }))
    await replaceInvoiceLines(db, 'f1', [invoiceLineRow('f1', { line_item_id: 'x', bcy_rate: 5, quantity: 2 })])
    expect((await db.query("SELECT salesorder_id FROM books.invoices WHERE invoice_id='f1'")).rows[0].salesorder_id).toBe('s1')
    expect((await db.query("SELECT count(*)::int n FROM books.invoice_line_items WHERE invoice_id='f1'")).rows[0].n).toBe(1)
  })

  it('maxZohoLastModified devuelve la marca de agua de la tabla', async () => {
    await upsertContact(db, contactRow({ contact_id: 'c1', contact_name: 'A', last_modified_time: '2026-01-01T00:00:00Z' }))
    await upsertContact(db, contactRow({ contact_id: 'c2', contact_name: 'B', last_modified_time: '2026-03-01T00:00:00Z' }))
    const wm = await maxZohoLastModified(db, 'contacts')
    expect(new Date(wm!).getTime()).toBe(new Date('2026-03-01T00:00:00Z').getTime())
  })

  it('upsertRetainerInvoice inserta, actualiza sin duplicar y da marca de agua', async () => {
    await upsertRetainerInvoice(db, retainerInvoiceRow({ retainerinvoice_id: 'ri1', status: 'sent', payment_made: 0, payment_drawn: 0, last_modified_time: '2026-09-01T00:00:00Z' }))
    await upsertRetainerInvoice(db, retainerInvoiceRow({ retainerinvoice_id: 'ri1', status: 'paid', payment_made: 500, payment_drawn: 0, last_modified_time: '2026-09-02T00:00:00Z' }))
    const r = await db.query("SELECT status, payment_made FROM books.retainer_invoices WHERE retainerinvoice_id='ri1'")
    expect(r.rows.length).toBe(1)
    expect(r.rows[0].status).toBe('paid')
    expect(Number(r.rows[0].payment_made)).toBe(500)
    const wm = await maxZohoLastModified(db, 'retainer_invoices')
    expect(new Date(wm!).getTime()).toBe(new Date('2026-09-02T00:00:00Z').getTime())
  })
})
