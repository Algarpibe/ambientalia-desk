import { describe, it, expect } from 'vitest'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow } from './mappers'

describe('booksHub mappers', () => {
  it('contactRow mapea campos y guarda raw completo', () => {
    const raw = { contact_id: 'c1', contact_name: 'Camposol', company_name: 'Camposol SAS', email: 'a@b.co', cf_nit: '900', last_modified_time: '2026-01-01T00:00:00Z', extra: 1 }
    const r = contactRow(raw)
    expect(r.contact_id).toBe('c1')
    expect(r.contact_name).toBe('Camposol')
    expect(r.company_name).toBe('Camposol SAS')
    expect(r.nit).toBe('900')
    expect(r.zoho_last_modified).toBe('2026-01-01T00:00:00Z')
    expect((r.raw as any).extra).toBe(1)
  })

  it('itemRow toma category_name y rate', () => {
    const r = itemRow({ item_id: 'i1', name: 'Filtro', category_name: 'Repuestos', rate: '50.5', last_modified_time: '2026-01-02T00:00:00Z' })
    expect(r.item_id).toBe('i1')
    expect(r.category_name).toBe('Repuestos')
    expect(r.rate).toBe(50.5)
  })

  it('salesOrderRow toma totales y guarda detalle en raw', () => {
    const r = salesOrderRow({ salesorder_id: 's1', salesorder_number: 'OV-1', date: '2026-06-01', status: 'open', bcy_sub_total: '100', invoiced_status: 'not_invoiced', last_modified_time: '2026-06-01T00:00:00Z' })
    expect(r.salesorder_id).toBe('s1')
    expect(r.bcy_sub_total).toBe(100)
    expect((r.raw as any).invoiced_status).toBe('not_invoiced')
  })

  it('soLineRow liga la línea a su salesorder_id', () => {
    const r = soLineRow('s1', { line_item_id: 'l1', item_id: 'i1', name: 'X', quantity: '2', bcy_rate: '10', item_total: '20' })
    expect(r.line_item_id).toBe('l1')
    expect(r.salesorder_id).toBe('s1')
    expect(r.bcy_rate).toBe(10)
    expect(r.quantity).toBe(2)
  })

  it('invoiceRow toma salesorder_id y due_date', () => {
    const r = invoiceRow({ invoice_id: 'f1', invoice_number: 'FV-1', date: '2026-06-01', due_date: '2026-07-01', status: 'sent', salesorder_id: 's1', bcy_sub_total: '80', last_modified_time: '2026-06-01T00:00:00Z' })
    expect(r.invoice_id).toBe('f1')
    expect(r.salesorder_id).toBe('s1')
    expect(r.due_date).toBe('2026-07-01')
    expect(r.bcy_sub_total).toBe(80)
  })

  it('invoiceLineRow liga la línea a su invoice_id', () => {
    const r = invoiceLineRow('f1', { line_item_id: 'l9', item_id: 'i1', quantity: '3', bcy_rate: '5' })
    expect(r.invoice_id).toBe('f1')
    expect(r.bcy_rate).toBe(5)
  })
})
