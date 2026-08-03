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

  // `books.contacts` arrastra proveedores de la era n8n (el sync de Node solo ingiere
  // contact_type=customer, y el sweep no los borra porque SÍ existen en Zoho). El selector de
  // cliente no debe ofrecerlos. Las filas heredadas sin `contact_type` se conservan: son de
  // procedencia desconocida y descartarlas podría ocultar clientes reales.
  it('searchClients descarta proveedores y conserva las filas sin contact_type', async () => {
    const ins = (id: string, name: string, raw: string) =>
      db.query("INSERT INTO books.contacts (contact_id,contact_name,nit,raw) VALUES ($1,$2,'900700933',$3)", [id, name, raw])
    await ins('k-cli', 'Ambientalia S.A.S.', '{"contact_type":"customer"}')
    await ins('k-ven', 'Ambientalia S.A.S.', '{"contact_type":"vendor"}')
    await ins('k-old', 'Ambientalia Vieja', '{}')

    expect((await searchClients(db, 'ambientalia')).map((c) => c.id).sort()).toEqual(['k-cli', 'k-old'])
    // El lookup por id NO filtra: un ticket o equipo que ya apunte a esa fila debe seguir resolviéndola.
    expect((await getClient(db, 'k-ven'))!.id).toBe('k-ven')
  })

  it('searchSalesOrders / getSalesOrder leen books.sales_orders + ticket_number desde raw', async () => {
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ('s1','OV-2026-117','cliA','Corola','2026-06-01',200,'open','{\"cf_n_ticket\":\"954\",\"order_status\":\"open\"}')")
    expect((await searchSalesOrders(db, 'OV-2026-117')).length).toBe(1)
    expect((await getSalesOrder(db, 's1'))!.status).toBe('open')
    expect((await getSalesOrder(db, 's1'))!.ticketNumber).toBe('954')
    expect((await searchSalesOrders(db, 'OV', 'cliA')).map((s) => s.id)).toEqual(['s1'])
  })

  // El selector de OV del formulario de tickets solo debe ofrecer las que en Zoho salen con
  // "Estado de pedido" = Confirmado, es decir `order_status = 'open'`: fuera borradores,
  // facturadas y anuladas. Las parcialmente facturadas SÍ entran (siguen confirmadas).
  it('searchSalesOrders solo devuelve las OVs con order_status=open (Confirmado)', async () => {
    const ins = (id: string, num: string, orderStatus: string, status: string) =>
      db.query(
        "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ($1,$2,'cliA','Corola','2026-06-01',200,$3,$4)",
        [id, num, status, JSON.stringify({ order_status: orderStatus })],
      )
    await ins('s-open', 'OV-2026-001', 'open', 'open')                  // confirmada, sin facturar
    await ins('s-part', 'OV-2026-002', 'open', 'partially_invoiced')    // confirmada, parcialmente facturada
    await ins('s-inv', 'OV-2026-003', 'closed', 'invoiced')             // facturada → fuera
    await ins('s-draft', 'OV-2026-004', 'draft', 'draft')               // borrador → fuera
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ('s-null','OV-2026-005','cliA','Corola','2026-06-01',0,'open','{}')") // sin order_status → fuera

    expect((await searchSalesOrders(db, 'OV-2026')).map((s) => s.id).sort()).toEqual(['s-open', 's-part'])
    expect((await searchSalesOrders(db, 'OV', 'cliA')).map((s) => s.id).sort()).toEqual(['s-open', 's-part'])
    // El lookup por id NO filtra: una OV ya elegida debe seguir resolviéndose al crear el ticket.
    expect((await getSalesOrder(db, 's-inv'))!.id).toBe('s-inv')
  })
})
