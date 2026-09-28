import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { searchClients, getClient, searchSalesOrders, getSalesOrder } from './repo'; import { asociarOV, liberarAsociacion } from '../db/ovAsociaciones'

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
  // Los cinco los imprime el documento de remisión. Si la vista deja de exponerlos, la remisión sale
  // incompleta sin que falle nada — de ahí el test.
  it('la vista clients expone dirección, ciudad, teléfono y persona de contacto', async () => {
    await db.query(
      `INSERT INTO books.contacts (contact_id,contact_name,nit,email,direccion,ciudad,departamento,telefono,persona_contacto,raw)
       VALUES ('c1','Airlab Consulting S.A.S.','901229003','a@b.co','Km 19 Troncal de Occidente','Mosquera','Cundinamarca','(1) 8941075','José Luis López Parra','{"contact_type":"customer"}')`,
    )
    const r = await db.query('SELECT direccion, ciudad, departamento, telefono, persona_contacto FROM clients WHERE id=$1', ['c1'])
    expect(r.rows[0]).toMatchObject({
      direccion: 'Km 19 Troncal de Occidente', ciudad: 'Mosquera', departamento: 'Cundinamarca',
      telefono: '(1) 8941075', persona_contacto: 'José Luis López Parra',
    })
  })

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

/**
 * asociacion-ov-ticket · lote 2 (RQ-ZS-14, escenario 1): `soloLibres` también deja fuera la OV cuya única
 * traza de uso es una fila VIGENTE en `ov_asociaciones` —ni `tickets.salesorder_id` ni
 * `tickets.orden_venta` la mencionan—, por id y por número; una asociación liberada la devuelve al buscador.
 */
describe('searchSalesOrders · soloLibres y ov_asociaciones', () => {
  const ov = (id: string, numero: string) =>
    db.query(
      "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ($1,$2,'cliA','Corola','2026-06-01',200,'open','{\"order_status\":\"open\"}')",
      [id, numero],
    )
  const ids = async () => (await searchSalesOrders(db, 'OV-2026', null, 20, true)).map((s) => s.id).sort()

  it('excluye la OV asociada por id y la asociada sólo por número, y deja la libre', async () => {
    await ov('s-usada', 'OV-2026-501'); await ov('s-solonum', 'OV-2026-502'); await ov('s-libre', 'OV-2026-503')
    await asociarOV(db, { ticketId: 't-x', numero: 'OV-2026-501', salesorderId: 's-usada', origen: 'alta', actor: 'test', fechaOrdenCompra: null })
    await asociarOV(db, { ticketId: 't-y', numero: 'OV-2026-502', salesorderId: null, origen: 'habilitar_servicio', actor: 'test', fechaOrdenCompra: null })

    expect(await ids()).toEqual(['s-libre'])
    // Sin `soloLibres` (por defecto) el buscador no mira asociaciones: las tres siguen saliendo.
    expect((await searchSalesOrders(db, 'OV-2026')).map((s) => s.id).sort()).toEqual(['s-libre', 's-solonum', 's-usada'])
  })

  it('una asociación liberada devuelve la OV al buscador', async () => {
    await ov('s-usada', 'OV-2026-501')
    const fila = await asociarOV(db, { ticketId: 't-x', numero: 'OV-2026-501', salesorderId: 's-usada', origen: 'alta', actor: 'test', fechaOrdenCompra: null })
    expect(await ids()).toEqual([])
    await liberarAsociacion(db, fila.id, 'test', 'Liberada')
    expect(await ids()).toEqual(['s-usada'])
  })
})

// asociacion-ov-ticket · lote 4 (tarea 4.18, RQ-TC-18): una subOV en cuarentena no sale del buscador.
describe('searchSalesOrders · cuarentena de subOV', () => {
  const ov = (id: string, numero: string) =>
    db.query(
      "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ($1,$2,'cliA','Corola','2026-06-01',200,'open','{\"order_status\":\"open\"}')",
      [id, numero],
    )
  const ids = async (soloLibres: boolean, limit = 20) => (await searchSalesOrders(db, 'OV-2026', null, limit, soloLibres)).map((s) => s.id).sort()

  it('con y sin soloLibres, la subOV no canónica no aparece y la canónica y la ordinaria sí', async () => {
    await ov('s-madre', 'OV-2026-600'); await ov('s-canon', 'OV-2026-600-01'); await ov('s-cuar', 'OV-2026-600-X9')
    expect(await ids(false)).toEqual(['s-canon', 's-madre'])
    expect(await ids(true)).toEqual(['s-canon', 's-madre'])
  })

  it('el límite se cuenta DESPUÉS de quitar la cuarentena: las de cuarentena no se comen la página', async () => {
    await ov('s-c1', 'OV-2026-610-X1'); await ov('s-c2', 'OV-2026-610-X2'); await ov('s-ok1', 'OV-2026-611'); await ov('s-ok2', 'OV-2026-612')
    expect((await searchSalesOrders(db, 'OV-2026', null, 2, false)).map((s) => s.id).sort()).toEqual(['s-ok1', 's-ok2'])
  })
})
