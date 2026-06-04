import { describe, it, expect } from 'vitest'
import { clientFromBooks, salesOrderFromBooks } from './mappers'

describe('clientFromBooks', () => {
  it('mapea nombre, NIT (cf_nit) y persona de contacto', () => {
    const r = clientFromBooks({
      contact_id: 'c1', contact_name: 'Camposol Colombia S.A.S.', company_name: 'Camposol Colombia S.A.S.',
      cf_nit: '901116362', email: 'a@b.co', phone: '', mobile: '300', first_name: 'Alejandra', last_name: 'Amador',
      customer_sub_type: 'business', status: 'active', last_modified_time: '2023-11-29T15:23:28-0500',
    } as any)
    expect(r.id).toBe('c1')
    expect(r.name).toBe('Camposol Colombia S.A.S.')
    expect(r.nit).toBe('901116362')
    expect(r.contact_person).toBe('Alejandra Amador')
    expect(r.source).toBe('books')
  })
})

describe('salesOrderFromBooks', () => {
  it('mapea número, cliente, total, estado y n° de ticket (cf_n_ticket)', () => {
    const r = salesOrderFromBooks({
      salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_id: 'c1', customer_name: 'Corola Ambiental S.A.S.',
      date: '2026-06-01', total: 1745593, currency_code: 'COP', status: 'invoiced', cf_n_ticket: '944',
      zcrm_potential_name: 'Corola - 0526 - MT_18A10077_EDM180D_260416', salesperson_name: 'Luz Ángela Mora',
      last_modified_time: '2026-06-03T15:26:09-0500',
    } as any)
    expect(r.id).toBe('s1')
    expect(r.number).toBe('OV-2026-117')
    expect(r.client_id).toBe('c1')
    expect(r.total).toBe(1745593)
    expect(r.status).toBe('invoiced')
    expect(r.ticket_number).toBe('944')
    expect(r.potential_name).toContain('MT_18A10077')
  })
})
