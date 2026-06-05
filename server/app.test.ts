import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { upsertTicket, upsertAccount, getTicketRow } from './db/repo'
import { ticketRowFromZoho, accountRowFromZoho } from './db/mappers'
import { upsertClient, upsertSalesOrder } from './books/repo'
import { clientFromBooks, salesOrderFromBooks } from './books/mappers'
import { upsertEquipo, listEquiposManage } from './db/equipos'
import { parseEquiposCsv } from './db/seedEquipos'
import { createApp } from './app'
import type { AppConfig } from './config'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { createRole } from './auth/roles'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function appWith(overrides: Partial<{ enableWrites: boolean }> = {}) {
  const config = { enableWrites: false, ...overrides } as AppConfig
  const sync = { backfillTickets: vi.fn(), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn() }
  const zohoFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  const app = createApp({ db, zohoFetch, sync, config })
  return { app, sync, zohoFetch }
}

async function adminCookie(): Promise<string> {
  const u = await createUser(db, { email: 'admin@x.co', name: 'Admin', passwordHash: await hashPassword('password123'), isAdmin: true })
  return `sid=${await createSession(db, u.id)}`
}
async function userCookie(areas: string[]): Promise<string> {
  const role = await createRole(db, { name: 'Rol-' + areas.join('-'), areas })
  const u = await createUser(db, { email: 'op@x.co', name: 'Op', passwordHash: await hashPassword('password123'), roleId: role.id })
  return `sid=${await createSession(db, u.id)}`
}

describe('GET /api/tickets', () => {
  it('devuelve tickets activos normalizados desde Postgres', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'AGQ' } as any))
    await upsertTicket(db, { ...ticketRowFromZoho({ id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado', statusType: 'Open', customFields: {} } as any), account_id: 'a1' })
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
  })

  it('GET /api/tickets sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/tickets?scope=all', () => {
  it('scope=all incluye cerrados; sin scope solo activos; campos enriquecidos', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,priority,due_date,created_time,channel,dias_entrega) VALUES ('a',1,'A','Ingresado','Open','High','2026-06-10',now(),'Email','5')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('b',2,'B','Finalizado','Closed',now())")
    const { app } = appWith()
    const active = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(active.body.map((t: any) => t.number)).toEqual(['#1'])
    const all = await request(app).get('/api/tickets?scope=all').set('Cookie', cookie)
    expect(all.body.length).toBe(2)
    expect(all.body.find((t: any) => t.number === '#1')).toMatchObject({ priority: 'High', statusType: 'Open', channel: 'Email', diasEntrega: '5' })
  })
})

describe('escrituras', () => {
  it('POST reply → 403 si enableWrites=false', async () => {
    const cookie = await adminCookie()
    const { app, zohoFetch } = appWith({ enableWrites: false })
    const res = await request(app).post('/api/tickets/1/reply').set('Cookie', cookie).send({ content: 'hola' })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('GET /api/clients y /api/sales-orders (Books)', () => {
  it('busca clientes (con sesión)', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'c1', contact_name: 'Camposol Colombia S.A.S.', cf_nit: '901116362', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=campo').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'c1', nit: '901116362' })
  })

  it('busca órdenes de venta (con sesión)', async () => {
    const cookie = await adminCookie()
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_name: 'Corola', date: '2026-06-01', status: 'open', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).get('/api/sales-orders?search=OV-2026').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 's1', number: 'OV-2026-117' })
  })

  it('GET /api/clients sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=x')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/equipos', () => {
  it('busca equipos (con sesión)', async () => {
    const cookie = await adminCookie()
    const [eq] = parseEquiposCsv('Nombre cliente;Marca;Modelo;Numero serie;Tipo\nGecelca S.A. E.S.P.;Grimm;EDM180C;18A22052;Monitor PM10/PM2.5')
    await upsertEquipo(db, eq)
    const { app } = appWith()
    const res = await request(app).get('/api/equipos?search=18A22052').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ serial: '18A22052', marca: 'Grimm', tipo: 'Monitor PM10/PM2.5' })
  })

  it('GET /api/equipos sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/equipos?search=x')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/tickets/:id/transition (Postgres)', () => {
  it('400 si la transición es desconocida', async () => {
    const cookie = await adminCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'no-existe', values: {} })
    expect(res.status).toBe(400)
  })

  it('409 si la transición no aplica desde el estado actual', async () => {
    const cookie = await adminCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    // 'aprobacion' exige estar en 'Notificación cliente', no en 'Ingresado'.
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'x' } })
    expect(res.status).toBe(409)
  })

  it('422 si faltan campos obligatorios', async () => {
    const cookie = await adminCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'ingreso_a_servicio', values: {} })
    expect(res.status).toBe(422)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('aplica la transición en Postgres y registra al usuario como actor', async () => {
    const cookie = await adminCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'aprobado' } })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('En Proceso')
    const r = await getTicketRow(db, '1')
    expect(r!.managed_by_app).toBe(true)
    const hist = await db.query('SELECT performed_by FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(hist.rows[0].performed_by).toBe('Admin')
  })

  it('403 si el rol del usuario no cubre el área de la transición', async () => {
    const cookie = await userCookie(['Servicio Técnico']) // 'aprobacion' es área Comercial
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'x' } })
    expect(res.status).toBe(403)
  })

  it('200 si el rol del usuario cubre el área', async () => {
    const cookie = await userCookie(['Comercial']) // 'aprobacion' es área Comercial
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'ok' } })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('En Proceso')
  })
})

describe('POST /api/tickets (crear)', () => {
  const seedEquipo = async () => {
    const [eq] = parseEquiposCsv('Nombre cliente;Marca;Modelo;Numero serie;Tipo\nGecelca S.A. E.S.P.;Grimm;EDM180C;18A20070;Monitor PM10/PM2.5')
    await upsertEquipo(db, eq)
    return eq
  }

  it('crea desde una OV con equipo: deriva cliente + orden, toma marca/modelo/serie/tipo del equipo', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli1', contact_name: 'Gecelca S.A. E.S.P.', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 'so1', salesorder_number: 'OV-2026-200', customer_id: 'cli1', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    const eq = await seedEquipo()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      salesOrderId: 'so1', equipoId: eq.id, tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio de mantenimiento', prefijo: 'MT',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('OV asignada')
    expect(res.body.company).toBe('Gecelca S.A. E.S.P.')
    const t = (await db.query("SELECT marca, modelo, serial, equipo, equipo_id, salesorder_id FROM tickets WHERE salesorder_id='so1'")).rows[0]
    expect(t).toMatchObject({ marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070', equipo: 'Monitor PM10/PM2.5', equipo_id: eq.id })
  })

  it('crea sin OV con cliente manual + equipo', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli2', contact_name: 'Camposol', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const eq = await seedEquipo()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli2', equipoId: eq.id, tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo', prefijo: 'CG', ordenVenta: 'manual-1',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('OV asignada')
  })

  it('422 si el equipo no existe', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cli3', contact_name: 'X', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli3', equipoId: 'eq-inexistente', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo', prefijo: 'MT',
    })
    expect(res.status).toBe(422)
  })

  it('422 sin equipo', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({ tipoServicio: 'Mantenimiento' })
    expect(res.status).toBe(422)
  })

  it('401 sin sesión', async () => {
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').send({ equipoId: 'x' })
    expect(res.status).toBe(401)
  })
})

describe('Gestión de equipos (Subsistema F)', () => {
  it('crea un equipo (cliente de Books) y lo desactiva', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cliF', contact_name: 'Cliente F', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({
      serial: 'SN-F1', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10', clientId: 'cliF',
    })
    expect(create.status).toBe(201)
    expect(create.body).toMatchObject({ serial: 'SN-F1', marca: 'Grimm', active: true, clientId: 'cliF', clienteNombre: 'Cliente F' })
    const id = create.body.id
    const patch = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ active: false, tipo: 'Analizador CO' })
    expect(patch.status).toBe(200)
    expect(patch.body).toMatchObject({ active: false, tipo: 'Analizador CO' })
    expect((await listEquiposManage(db, 'SN-F1')).length).toBe(1)
  })

  it('422 sin serial o sin cliente; 422 si el cliente no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ clientId: 'x' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S', clientId: 'no-existe' })).status).toBe(422)
  })

  it('facets devuelve marcas/tipos; manage lista; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cliG', contact_name: 'G', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-G', marca: 'Horiba', tipo: 'O3', clientId: 'cliG' })
    const f = await request(app).get('/api/equipos/facets').set('Cookie', cookie)
    expect(f.status).toBe(200)
    expect(f.body.marcas).toContain('Horiba')
    const m = await request(app).get('/api/equipos/manage?search=SN-G').set('Cookie', cookie)
    expect(m.status).toBe(200)
    expect(m.body.items[0]).toMatchObject({ serial: 'SN-G' })
    expect((await request(app).get('/api/equipos/manage')).status).toBe(401)
  })

  it('DELETE solo super admin: no-admin 403, sin sesión 401, admin 200', async () => {
    const admin = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cliD', contact_name: 'D', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', admin).send({ serial: 'SN-DEL', clientId: 'cliD' })).body.id
    const op = await userCookie([])
    expect((await request(app).delete(`/api/equipos/${id}`).set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete(`/api/equipos/${id}`)).status).toBe(401)
    expect((await request(app).delete(`/api/equipos/${id}`).set('Cookie', admin)).status).toBe(200)
    expect((await listEquiposManage(db, 'SN-DEL')).length).toBe(0)
  })

  it('GET /api/equipos/:id/historial → equipo + tickets; 404; 401', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'cH', contact_name: 'H', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const eqId = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-H', marca: 'Grimm', clientId: 'cH' })).body.id
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,serial,equipo_id,created_time) VALUES ('h1',777,'T','Ingresado','Open','SN-H',$1,now())`, [eqId])
    const res = await request(app).get(`/api/equipos/${eqId}/historial`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.equipo.serial).toBe('SN-H')
    expect(res.body.tickets[0]).toMatchObject({ id: 'h1', number: '#777' })
    expect((await request(app).get('/api/equipos/eq-nope/historial').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/equipos/${eqId}/historial`)).status).toBe(401)
  })
})
