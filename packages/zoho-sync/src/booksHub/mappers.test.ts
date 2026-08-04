import { describe, it, expect } from 'vitest'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow, customerPaymentRow, paymentInvoiceRow, purchaseOrderRow, poLineRow } from './mappers'

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

  // Dirección y teléfono solo llegan en el DETALLE del contacto, dentro de billing_address.
  // El documento de remisión los imprime, así que se promueven a columnas.
  it('contactRow saca dirección, ciudad y teléfono de billing_address', () => {
    const r = contactRow({
      contact_id: 'c1', contact_name: 'Airlab', email: 'a@b.co', phone: '',
      billing_address: { address: 'Km 19 Troncal de Occidente', city: 'Mosquera', state: 'Cundinamarca', phone: '(1) 8941075' },
    })
    expect(r.direccion).toBe('Km 19 Troncal de Occidente')
    expect(r.ciudad).toBe('Mosquera')
    expect(r.departamento).toBe('Cundinamarca')
    // El phone de primer nivel viene vacío en Books; el bueno es el de la dirección.
    expect(r.telefono).toBe('(1) 8941075')
  })

  it('contactRow prefiere el teléfono de primer nivel si existe', () => {
    const r = contactRow({ contact_id: 'c1', phone: '3001234567', billing_address: { phone: '(1) 8941075' } })
    expect(r.telefono).toBe('3001234567')
  })

  it('contactRow tolera un contacto sin billing_address (el del listado)', () => {
    const r = contactRow({ contact_id: 'c1', contact_name: 'X' })
    expect(r.direccion).toBeNull()
    expect(r.ciudad).toBeNull()
    expect(r.telefono).toBeNull()
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

  it('customerPaymentRow calcula BCY = amount × exchange_rate y toma last-modified', () => {
    const r = customerPaymentRow({
      payment_id: 'p1', payment_number: 'PC-2026-1', customer_name: 'CORPAMAG', date: '2026-07-01',
      currency_code: 'COP', exchange_rate: '0.5', amount: '600', unused_amount: '0',
      tax_amount_withheld: '5000', payment_status: 'paid', updated_time: '2026-07-01T00:00:00Z',
    })
    expect(r.payment_id).toBe('p1')
    expect(r.amount).toBe(600)
    expect(r.bcy_amount).toBe(300)
    expect(r.bcy_unused_amount).toBe(0)
    expect(r.zoho_last_modified).toBe('2026-07-01T00:00:00Z')
  })

  it('purchaseOrderRow mapea cabecera de OC y guarda raw', () => {
    const r = purchaseOrderRow({
      purchaseorder_id: 'po1', purchaseorder_number: 'OC-2026-031', vendor_name: 'Iteco S.A.',
      date: '2026-05-14', delivery_date: '2026-07-30', status: 'open', received_status: 'to_be_received',
      currency_code: 'COP', total: '3554958', last_modified_time: '2026-05-19T00:00:00Z',
    })
    expect(r.purchaseorder_id).toBe('po1')
    expect(r.purchaseorder_number).toBe('OC-2026-031')
    expect(r.total).toBe(3554958)
    expect(r.received_status).toBe('to_be_received')
    expect(r.zoho_last_modified).toBe('2026-05-19T00:00:00Z')
  })

  it('poLineRow liga la línea a su OC con cantidades', () => {
    const r = poLineRow('po1', {
      line_item_id: 'pol1', item_id: 'i1', sku: 'J049', name: 'Filtro',
      quantity: '40', quantity_received: '0', quantity_cancelled: '0', bcy_rate: '19.64',
    })
    expect(r.line_item_id).toBe('pol1')
    expect(r.purchaseorder_id).toBe('po1')
    expect(r.sku).toBe('J049')
    expect(r.quantity).toBe(40)
    expect(r.quantity_received).toBe(0)
  })

  it('paymentInvoiceRow liga la aplicación a su pago', () => {
    const r = paymentInvoiceRow('p1', {
      invoice_payment_id: 'ip1', invoice_id: 'i1', invoice_number: 'AM1439',
      amount_applied: '1000000', total: '1200000', balance: '0', due_date: '2026-07-07', apply_date: '2026-07-01',
    })
    expect(r.invoice_payment_id).toBe('ip1')
    expect(r.payment_id).toBe('p1')
    expect(r.invoice_number).toBe('AM1439')
    expect(r.amount_applied).toBe(1000000)
    expect(r.balance).toBe(0)
  })
})
