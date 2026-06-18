import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { searchClients, getClient, searchSalesOrders, getSalesOrder } from './repo'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('books repo (lectores)', () => {
  it('searchClients / getClient por nombre y NIT', async () => {
    await db.query("INSERT INTO clients (id,name,company_name,nit,email) VALUES ('c1','Camposol Colombia S.A.S.','Camposol','901116362','a@b.co')")
    await db.query("INSERT INTO clients (id,name,nit) VALUES ('c2','Bancolombia S.A.','890903938')")
    expect((await searchClients(db, 'campo')).map((c) => c.id)).toEqual(['c1'])
    expect((await searchClients(db, '8909')).map((c) => c.id)).toEqual(['c2'])
    expect((await getClient(db, 'c1'))!.nit).toBe('901116362')
  })

  it('searchSalesOrders / getSalesOrder por número y cliente', async () => {
    await db.query("INSERT INTO sales_orders (id,number,client_id,customer_name,date,total,status,ticket_number) VALUES ('s1','OV-2026-117','cliA','Corola',' 2026-06-01',200,'invoiced','954')")
    expect((await searchSalesOrders(db, 'OV-2026-117')).length).toBe(1)
    expect((await getSalesOrder(db, 's1'))!.status).toBe('invoiced')
    expect((await getSalesOrder(db, 's1'))!.ticketNumber).toBe('954')
    expect((await searchSalesOrders(db, 'OV', 'cliA')).map((s) => s.id)).toEqual(['s1'])
  })
})
