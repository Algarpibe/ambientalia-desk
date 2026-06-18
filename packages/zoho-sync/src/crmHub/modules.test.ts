import { describe, it, expect } from 'vitest'
import { MODULES, byTable, quoteLineRow } from './modules'

describe('crm modules', () => {
  it('hay 9 descriptores con table/apiName/fields/toRow', () => {
    expect(MODULES.map((m) => m.table).sort()).toEqual(['calls', 'campaigns', 'deals', 'events', 'leads', 'products', 'quotes', 'tasks', 'visits'])
    for (const m of MODULES) { expect(m.apiName).toBeTruthy(); expect(m.fields).toContain('Modified_Time'); expect(typeof m.toRow).toBe('function') }
  })
  it('deals.toRow extrae columnas clave, lookups id/name y raw', () => {
    const row = byTable('deals').toRow({ id: '1', Deal_Name: 'OV X', Amount: '500', Stage: 'Won', N_mero_Ticket: '958', Account_Name: { id: 'a1', name: 'Acme' }, Owner: { id: 'o1', name: 'Ana' }, Modified_Time: '2026-06-01T00:00:00Z' })
    expect(row.id).toBe('1'); expect(row.deal_name).toBe('OV X'); expect(row.amount).toBe(500)
    expect(row.account_id).toBe('a1'); expect(row.account_name).toBe('Acme'); expect(row.numero_ticket).toBe(958)
    expect(row.modified_time).toBe('2026-06-01T00:00:00Z'); expect(typeof row.raw).toBe('string')
  })
  it('leads.toRow mapea Full_Name, Converted__s y Converted_Deal lookup', () => {
    const row = byTable('leads').toRow({ id: 'l1', Full_Name: 'Juan Pérez', Converted__s: true, Converted_Deal: { id: 'd9', name: 'D' }, Modified_Time: '2026-01-01T00:00:00Z' })
    expect(row.full_name).toBe('Juan Pérez'); expect(row.is_converted).toBe(true); expect(row.converted_deal_id).toBe('d9')
  })
})

describe('crm modules - fase 2', () => {
  it('existe el descriptor visits con hasLines ausente', () => {
    const v = byTable('visits')
    expect(v.apiName).toBe('Visits'); expect(v.fields).toContain('Visited_Time'); expect(v.hasLines).toBeFalsy()
    const row = v.toRow({ id: 'v1', Visited_By: { id: 'c1', name: 'Cli', module: { api_name: 'Contacts' } }, Visited_Time: '2026-06-01T00:00:00Z', Time_Spent: '12', Modified_Time: '2026-06-01T00:00:00Z' })
    expect(row.id).toBe('v1'); expect(row.visited_by_id).toBe('c1'); expect(row.visited_by_module).toBe('Contacts'); expect(row.time_spent).toBe(12)
  })
  it('quotes tiene hasLines=true', () => { expect(byTable('quotes').hasLines).toBe(true) })
  it('quoteLineRow mapea la línea del subform', () => {
    const r = quoteLineRow('q1', { id: 'l1', Product_Name: { id: 'p1', name: 'Filtro' }, Quantity: '2', List_Price: '10', Net_Total: '20', Discount: '0', Sequence_Number: 1 })
    expect(r.id).toBe('l1'); expect(r.quote_id).toBe('q1'); expect(r.product_id).toBe('p1'); expect(r.product_name).toBe('Filtro')
    expect(r.quantity).toBe(2); expect(r.net_total).toBe(20); expect(typeof r.raw).toBe('string')
  })
})
