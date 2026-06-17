import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { clientFromBooks, salesOrderFromBooks } from './mappers'
import { upsertClient, upsertSalesOrder, searchClients, searchSalesOrders, getClient, getSalesOrder, maxLastModified } from './repo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('books repo', () => {
  it('upsert + búsqueda de clientes por nombre/NIT', async () => {
    await upsertClient(db, clientFromBooks({ contact_id: 'c1', contact_name: 'Camposol Colombia S.A.S.', cf_nit: '901116362', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    await upsertClient(db, clientFromBooks({ contact_id: 'c2', contact_name: 'Bancolombia S.A.', cf_nit: '890903938', last_modified_time: '2024-01-02T00:00:00Z' } as any))
    expect((await searchClients(db, 'campo')).map((c) => c.id)).toEqual(['c1'])
    expect((await searchClients(db, '8909')).map((c) => c.id)).toEqual(['c2'])
    expect((await getClient(db, 'c1'))!.nit).toBe('901116362')
  })

  it('upsert actualiza (no duplica) y búsqueda de OV por número/cliente', async () => {
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_name: 'Corola Ambiental', date: '2026-06-01', total: 100, status: 'open', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_name: 'Corola Ambiental', date: '2026-06-01', total: 200, status: 'invoiced', last_modified_time: '2026-06-02T00:00:00Z' } as any))
    expect((await searchSalesOrders(db, 'OV-2026-117')).length).toBe(1)
    expect((await getSalesOrder(db, 's1'))!.status).toBe('invoiced')
    expect((await searchSalesOrders(db, 'corola')).map((s) => s.id)).toEqual(['s1'])
  })

  it('searchSalesOrders filtra por cliente cuando se da clientId', async () => {
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's1', salesorder_number: 'OV-1', customer_id: 'cliA', customer_name: 'A', date: '2026-06-01', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's2', salesorder_number: 'OV-2', customer_id: 'cliB', customer_name: 'B', date: '2026-06-02', last_modified_time: '2026-06-02T00:00:00Z' } as any))
    expect((await searchSalesOrders(db, 'OV')).map((s) => s.id).sort()).toEqual(['s1', 's2'])
    expect((await searchSalesOrders(db, 'OV', 'cliA')).map((s) => s.id)).toEqual(['s1'])
    expect((await searchSalesOrders(db, '', 'cliB')).map((s) => s.id)).toEqual(['s2'])
  })

  it('maxLastModified devuelve la marca de agua', async () => {
    await upsertClient(db, clientFromBooks({ contact_id: 'c1', contact_name: 'A', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    await upsertClient(db, clientFromBooks({ contact_id: 'c2', contact_name: 'B', last_modified_time: '2024-03-01T00:00:00Z' } as any))
    const wm = await maxLastModified(db, 'clients')
    expect(new Date(wm!).getTime()).toBe(new Date('2024-03-01T00:00:00Z').getTime())
  })
})
