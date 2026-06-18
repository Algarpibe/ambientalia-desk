import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { searchClients, getClient, searchSalesOrders, getSalesOrder } from './repo'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('books repo (vistas sobre books.*)', () => {
  it('searchClients / getClient leen books.contacts', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name,nit,email) VALUES ('c1','Camposol Colombia S.A.S.','Camposol','901116362','a@b.co')")
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,nit) VALUES ('c2','Bancolombia S.A.','890903938')")
    expect((await searchClients(db, 'campo')).map((c) => c.id)).toEqual(['c1'])
    expect((await searchClients(db, '8909')).map((c) => c.id)).toEqual(['c2'])
    expect((await getClient(db, 'c1'))!.nit).toBe('901116362')
  })

  it('searchSalesOrders / getSalesOrder leen books.sales_orders + ticket_number desde raw', async () => {
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ('s1','OV-2026-117','cliA','Corola','2026-06-01',200,'invoiced','{\"cf_n_ticket\":\"954\"}')")
    expect((await searchSalesOrders(db, 'OV-2026-117')).length).toBe(1)
    expect((await getSalesOrder(db, 's1'))!.status).toBe('invoiced')
    expect((await getSalesOrder(db, 's1'))!.ticketNumber).toBe('954')
    expect((await searchSalesOrders(db, 'OV', 'cliA')).map((s) => s.id)).toEqual(['s1'])
  })
})
