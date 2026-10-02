import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { datosTicket } from './db/ticketFuentes'
import { getAnalisisRows } from './analisis'
import { db, instalarArnes, appWith, adminCookie, equipoRow } from './testing/appHarness'

instalarArnes()

/**
 * F1B-15, lote 1, tarea 1.10: los lectores de clientes que no cubren `services/clientes.test.ts` ni
 * `db/ticketsConCliente.test.ts` (design.md §4). El provisional entra donde un usuario VE un ticket o un
 * equipo que ya lo lleva, y no entra donde se elige un cliente para otra cosa.
 */
const provisional = (id: string, razon: string) =>
  db.query(
    `INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo)
     VALUES ($1,$2,'800555666','Ana Ruiz','3001112233','ana@prov.co','no está en Books')`, [id, razon])
let n = 10000
const ticket = (id: string, clienteId: string) =>
  db.query("INSERT INTO tickets (id, number, status, status_type, managed_by_app, client_id) VALUES ($1, $3, 'OV asignada', 'Open', true, $2)", [id, clienteId, n++])

describe('historial y conversación (ticketFuentes.ts:172-174): el cliente del ticket', () => {
  it('un ticket de un provisional lleva su razón social; uno de Books, la de siempre', async () => {
    await provisional('prov-1', 'Zeta Provisional'); await ticket('tp', 'prov-1')
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name) VALUES ('c1','Acme','ACME S.A.S.')"); await ticket('tb', 'c1')
    expect((await datosTicket(db, 'tp')).cliente).toBe('Zeta Provisional')
    expect((await datosTicket(db, 'tb')).cliente).toBe('ACME S.A.S.')
  })
})

describe('análisis (analisis.ts): el cliente por ticket', () => {
  it('el ticket de un provisional sale con su razón social; el de Books, con el nombre de Books', async () => {
    await provisional('prov-1', 'Zeta Provisional'); await ticket('tp', 'prov-1')
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('c1','Acme SAS')"); await ticket('tb', 'c1')
    expect((await getAnalisisRows(db)).map((r) => r.cliente).sort()).toEqual(['Acme SAS', 'Zeta Provisional'])
  })
})

describe('remisión (remision.ts:203): empresa del cliente del ticket', () => {
  it('POST /api/remisiones copia la razón social y el contacto del provisional', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-p1', '18A20070'))
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0)")
    await provisional('prov-1', 'Zeta Provisional')
    await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                    VALUES ('t1', 10000, 'OV asignada', true, 'prov-1', 'Mantenimiento', 'eq-p1', 'Grimm', 'EDM180C', '18A1')`)
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ empresa: 'Zeta Provisional', personaContacto: 'Ana Ruiz' })
  })
})

describe('PATCH /api/equipos/:id (equipos.ts:81): sólo el mismo provisional que el equipo ya tiene', () => {
  it('otro provisional es 422; el mismo, 200', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('e1', 'S-1'))
    await provisional('prov-1', 'Uno'); await provisional('prov-2', 'Dos')
    await db.query("UPDATE equipos SET client_id = 'prov-1' WHERE id = 'e1'")
    const { app } = appWith()
    const otro = await request(app).patch('/api/equipos/e1').set('Cookie', cookie).send({ clientId: 'prov-2' })
    expect(otro.status).toBe(422)
    expect((await db.query("SELECT client_id FROM equipos WHERE id='e1'")).rows).toEqual([{ client_id: 'prov-1' }])
    const mismo = await request(app).patch('/api/equipos/e1').set('Cookie', cookie).send({ clientId: 'prov-1' })
    expect(mismo.status).toBe(200)
  })
})
