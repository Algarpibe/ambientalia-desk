import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { upsertTicket, upsertAccount, getTicketRow } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho, accountRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { upsertEquipo, listEquiposManage } from './db/equipos'
import type { EquipoRow } from './db/equipos'
import { REMISIONES_HISTORICAS } from './db/remisionesHistoricasSeed'

/** Equipo al estilo de la carga inicial: `client_id` NULL y cliente solo como texto libre. */
const equipoRow = (id: string, serial: string, cliente = 'Gecelca S.A. E.S.P.'): EquipoRow =>
  ({ id, serial, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10/PM2.5', cliente_nombre: cliente, source: 'seed', raw: null })
import { createApp } from './app'
import { clearAnalisisCache } from './analisis'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { RemisionListado } from '@ambientalia/shared'
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

function appWith(overrides: Partial<{ enableWrites: boolean; remisionCallbackToken: string; remisionWebhookUrl: string }> = {}) {
  const config = { enableWrites: false, remisionWebhookUrl: '', remisionCallbackToken: '', ...overrides } as AppConfig
  const sync = { backfillTickets: vi.fn(), backfillArchivedTickets: vi.fn().mockResolvedValue(0), syncRecent: vi.fn(), syncTicket: vi.fn().mockResolvedValue(undefined), syncConversations: vi.fn().mockResolvedValue(undefined), syncActivities: vi.fn(), syncTicketHistory: vi.fn().mockResolvedValue(undefined), syncContacts: vi.fn() }
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

describe('Seguridad: helmet + rate-limit', () => {
  it('helmet añade cabeceras de seguridad', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/auth/login').send()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
  it('rate-limit: bloquea login tras demasiados intentos', async () => {
    const { app } = appWith()
    let last: any
    for (let i = 0; i < 11; i++) last = await request(app).post('/api/auth/login').send({ email: 'no@x.co', password: 'mal' })
    expect(last.status).toBe(429)
  })
})

describe('Error-handler central', () => {
  it('error no manejado → 500 genérico (sin filtrar el mensaje)', async () => {
    const config = { enableWrites: false } as AppConfig
    const sync = { backfillTickets: vi.fn(), backfillArchivedTickets: vi.fn().mockResolvedValue(0), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn(), syncActivities: vi.fn(), syncTicketHistory: vi.fn(), syncContacts: vi.fn() } as any
    const zohoFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const cookie = await adminCookie() // sesión válida en la BD real (requireAuth la valida antes de getContacts)
    const boomDb = { query: (sql: string, params?: unknown[]) => {
      if (/FROM sessions|FROM users/i.test(sql)) return db.query(sql, params) // deja pasar la autenticación
      throw new Error('detalle-interno-secreto')
    } } as unknown as Queryable
    const app = createApp({ db: boomDb, zohoFetch, sync, config })
    const res = await request(app).get('/api/contacts').set('Cookie', cookie)
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Error interno')
    expect(JSON.stringify(res.body)).not.toContain('detalle-interno-secreto')
  })
})

describe('GET /api/tickets', () => {
  it('devuelve tickets activos normalizados desde Postgres', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'AGQ' } as any))
    await db.query("INSERT INTO contacts (id,first_name,last_name) VALUES ('c1','Sebastián','Laguna')")
    await upsertTicket(db, { ...ticketRowFromZoho({ id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado', statusType: 'Open', customFields: {} } as any), account_id: 'a1', contact_id: 'c1' })
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado', contactName: 'Sebastián Laguna', contactId: 'c1', accountId: 'a1' })
  })

  it('GET /api/tickets sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(401)
  })

  it('marca leído por usuario (POST /:id/read) y GET lo refleja; 401 sin sesión', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time,modified_time) VALUES ('t9',9,'Z','Ingresado','Open',now(),'2026-01-01T00:00:00Z')")
    const cookie = await adminCookie()
    const { app } = appWith()
    const before = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(before.body.find((t: any) => t.number === '#9').read).toBe(false)
    const m = await request(app).post('/api/tickets/t9/read').set('Cookie', cookie).send({ read: true })
    expect(m.status).toBe(200)
    const after = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(after.body.find((t: any) => t.number === '#9').read).toBe(true)
    expect((await request(app).post('/api/tickets/t9/read').send({ read: true })).status).toBe(401)
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

describe('GET /api/tickets?scope=closed (paginado)', () => {
  const seedMixed = async () => {
    // 1 activo + 3 cerrados (created_time creciente)
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a',10,'A','Ingresado','Open','2026-06-01T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('c1',1,'C1','Finalizado','Closed','2026-01-01T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('c2',2,'C2','Finalizado','Closed','2026-02-01T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('c3',3,'C3','Finalizado','Closed','2026-03-01T00:00:00Z')")
  }

  it('GET /api/tickets (default) → array solo de activos (ningún Closed)', async () => {
    const cookie = await adminCookie()
    await seedMixed()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.every((t: any) => t.statusType !== 'Closed')).toBe(true)
    expect(res.body.map((t: any) => t.number)).toEqual(['#10'])
  })

  it('?scope=closed&page=1 → {items,total,page,pageSize} solo cerrados', async () => {
    const cookie = await adminCookie()
    await seedMixed()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets?scope=closed&page=1').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(3)
    expect(res.body.page).toBe(1)
    expect(res.body.pageSize).toBe(50)
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.items.length).toBeLessThanOrEqual(res.body.pageSize)
    expect(res.body.items.every((t: any) => t.statusType === 'Closed')).toBe(true)
  })

  it('?scope=closed&page=99 → items vacío, total correcto', async () => {
    const cookie = await adminCookie()
    await seedMixed()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets?scope=closed&page=99').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.items).toEqual([])
    expect(res.body.total).toBe(3)
    expect(res.body.page).toBe(99)
  })
})

describe('GET /api/tickets/:id/history', () => {
  it('mapea el historial de Zoho; un ticket solo con transiciones devuelve las suyas; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await db.query("INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h1','t1','CommentAdded',now(),'Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })])
    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/history').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ title: 'Ana ha publicado un comentario' })
    // Este segundo tramo se llamaba "fallback" y ya no lo es: la historia de Zoho y las transiciones
    // salen JUNTAS, no una en lugar de la otra. Lo que sigue comprobando es que un ticket sin nada de
    // Zoho no se queda mudo — que era el síntoma que el nombre viejo describía al revés.
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t2',2,'B','Ingresado')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t2','Habilitar','OV asignada','Ingresado','Admin',now())")
    const f = await request(app).get('/api/tickets/t2/history').set('Cookie', cookie)
    expect(f.body[0]).toMatchObject({ title: 'Transición: Habilitar' })
    expect((await request(app).get('/api/tickets/t1/history')).status).toBe(401)
  })

  it('compone Zoho + transiciones + remisiones en una sola línea de tiempo', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await db.query("INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h1','t1','CommentAdded','2026-08-01T10:00:00Z','Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })])
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t1','Habilitar','OV asignada','Ingresado','Admin','2026-08-02T10:00:00Z')")
    await db.query("INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at) VALUES ('rh1','t1','entrada','2026-08-03','Julián','pendiente','2026-08-03T10:00:00Z')")

    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/history').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((e: { title: string }) => e.title)).toEqual([
      'Remisión de entrada creada',
      'Transición: Habilitar',
      'Ana ha publicado un comentario',
    ])
    expect((await request(app).get('/api/tickets/t1/history')).status).toBe(401)
  })
})

describe('GET /api/tickets/:id/conversations (hilo compuesto)', () => {
  // El ticket se crea POR LA API a propósito, en vez de insertar la fila `(creación)` a mano: es el
  // único sitio donde se comprueba que lo que ESCRIBE `createTicket` es lo que RECONOCEN los
  // compositores. Con la inserción a mano, cambiar el `from_status` que marca la creación —o las
  // claves de la foto— dejaría los dos paneles contando la creación como una transición genérica sin
  // que fallara ningún test.
  it('mezcla la creación —creada por la API— con la remisión, y no le pide nada a Zoho', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name) VALUES ('cli-c1','Gecelca','Gecelca S.A. E.S.P.')")
    await upsertEquipo(db, equipoRow('eq-c1', '18A20070'))
    const { app, sync } = appWith()

    const creado = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli-c1', equipoId: 'eq-c1', tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo',
      prefijo: 'CG', ordenVenta: 'OV-2026-141', prioridad: 'Media',
    })
    expect(creado.status).toBe(201)
    const id: string = creado.body.id

    // `createTicket` data la creación con `now()`, así que la remisión se data una hora después para
    // que el orden esperado no dependa del reloj de quien corre los tests.
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,observaciones,creado_por,estado,created_at)
       VALUES ('rc1',$1,'entrada','2026-08-02','Calibración','El equipo ingresa sin sensor.','Julián','ok',now() + interval '1 hour')`,
      [id],
    )

    const res = await request(app).get(`/api/tickets/${id}/conversations`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((m: { author: string }) => m.author)).toEqual(['Julián', 'Admin'])
    expect(res.body[0].content).toBe('El equipo ingresa para Calibración.\nEl equipo ingresa sin sensor.')
    expect(res.body[1].content).toBe([
      'Ticket creado para Gecelca S.A. E.S.P.', // la razón social ya trae su punto: no se le añade otro
      'Equipo: Grimm EDM180C · serie 18A20070',
      'Tipo de servicio: Calibración',
      'Orden de venta: OV-2026-141',
      'Clasificación: Equipo nuevo · Prioridad: Media',
    ].join('\n'))
    // Lo que arregla esta ruta: un ticket nacido en la app no existe en Zoho y no se le pregunta por él.
    expect(sync.syncConversations).not.toHaveBeenCalled()
    expect((await request(app).get(`/api/tickets/${id}/conversations`)).status).toBe(401)
  })

  // Un ticket de Zoho sin conversaciones locales sí entra por el sync perezoso, y ahí el `await` pasó
  // a ir dentro de un `try`: es el único cambio de comportamiento deliberado de esta tanda —antes un
  // Zoho caído tumbaba la petición con un 500— y sin test alguien lo "arregla" de vuelta sin enterarse.
  it('sync perezoso con Zoho caído: degrada a 200 con el hilo compuesto, no a 500', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('90210',702,'E','Ingresado')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('90210','Habilitar','OV asignada','Ingresado','Admin','2026-08-03T10:00:00Z')")
    const { app, sync } = appWith()
    sync.syncConversations.mockRejectedValue(new Error('zoho down'))
    const res = await request(app).get('/api/tickets/90210/conversations').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(sync.syncConversations).toHaveBeenCalledWith('90210')
    // Lo que hace útil la degradación: se sirve lo que la app sí sabe del ticket, no una lista vacía.
    expect(res.body.map((m: { content: string }) => m.content)).toEqual(['Habilitar: OV asignada → Ingresado'])
  })
})

describe('F3-02 lectura asíncrona (lazy + background)', () => {
  it('detalle: con ticket local sirve 200 sin bloquear y dispara syncTicket en background (un rechazo no rompe)', async () => {
    const cookie = await adminCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: 'tx1', ticketNumber: '500', subject: 'Local', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app, sync } = appWith()
    sync.syncTicket.mockRejectedValue(new Error('zoho down'))
    const res = await request(app).get('/api/tickets/tx1').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.number).toBe('#500')
    expect(sync.syncTicket).toHaveBeenCalledWith('tx1')
  })

  it('historial vacío → lazy (await): puebla y devuelve lo poblado; syncTicketHistory llamado', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('tx2',2,'B','Ingresado')")
    const { app, sync } = appWith()
    sync.syncTicketHistory.mockImplementation(async () => {
      await db.query("INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('hx1','tx2','CommentAdded',now(),'Ana',$1)",
        [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })])
    })
    const res = await request(app).get('/api/tickets/tx2/history').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(sync.syncTicketHistory).toHaveBeenCalledWith('tx2')
  })

  it('historial con datos → background: sirve local 200 y dispara syncTicketHistory (rechazo no rompe)', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('tx3',3,'C','Ingresado')")
    await db.query("INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('hx3','tx3','CommentAdded',now(),'Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })])
    const { app, sync } = appWith()
    sync.syncTicketHistory.mockRejectedValue(new Error('zoho down'))
    const res = await request(app).get('/api/tickets/tx3/history').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(sync.syncTicketHistory).toHaveBeenCalledWith('tx3')
  })

  it('conversaciones con datos → background refresh: sirve local 200 y dispara syncConversations (rechazo no rompe)', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('tx4',4,'D','Ingresado')")
    await db.query("INSERT INTO conversations (id,ticket_id,kind,author_name,content,commented_time) VALUES ('cv4','tx4','thread','Ana','hola',now())")
    const { app, sync } = appWith()
    sync.syncConversations.mockRejectedValue(new Error('zoho down'))
    const res = await request(app).get('/api/tickets/tx4/conversations').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(sync.syncConversations).toHaveBeenCalledWith('tx4')
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

  it('POST reply → 403 si el usuario no tiene área asignada (writes habilitados)', async () => {
    const cookie = await userCookie([]) // operador sin área, no admin
    const { app, zohoFetch } = appWith({ enableWrites: true })
    const res = await request(app).post('/api/tickets/1/reply').set('Cookie', cookie).send({ content: 'hola', to: 'x@y.co' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Tu rol no tiene un área asignada para responder')
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('POST reply → no 403 si el usuario tiene un área (writes habilitados)', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app } = appWith({ enableWrites: true })
    const res = await request(app).post('/api/tickets/1/reply').set('Cookie', cookie).send({ content: 'hola', to: 'x@y.co' })
    expect(res.status).not.toBe(403)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true })
  })

  // El correo YA salió cuando se refrescan las conversaciones. Si ese refresco tumbaba la petición
  // con un 500, el usuario leía "falló" sobre algo que sí se había enviado, y el reintento natural
  // mandaba un segundo correo al cliente. La ruta hermana de historia ya degradaba así; ésta no.
  it('POST reply → 200 aunque el refresco de conversaciones falle: el correo ya salió', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app, sync, zohoFetch } = appWith({ enableWrites: true })
    sync.syncConversations.mockRejectedValue(new Error('zoho down'))
    const res = await request(app).post('/api/tickets/1/reply').set('Cookie', cookie).send({ content: 'hola', to: 'x@y.co' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true })
    // Y el envío se intentó UNA vez: lo que se degrada es el refresco, no el correo.
    expect(zohoFetch.mock.calls.filter(([p]) => String(p).includes('sendReply'))).toHaveLength(1)
  })
})

describe('GET /api/clients y /api/sales-orders (Books)', () => {
  it('busca clientes (con sesión)', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,nit) VALUES ('c1','Camposol Colombia S.A.S.','901116362')")
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=campo').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'c1', nit: '901116362' })
  })

  it('busca órdenes de venta (con sesión)', async () => {
    const cookie = await adminCookie()
    // `order_status: open` = "Confirmado" en Zoho; el buscador solo ofrece esas (ver books/repo).
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ('s1','OV-2026-117','Corola','2026-06-01','open','{\"order_status\":\"open\"}')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ('s2','OV-2026-118','Corola','2026-06-02','invoiced','{\"order_status\":\"closed\"}')")
    const { app } = appWith()
    const res = await request(app).get('/api/sales-orders?search=OV-2026').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((s: { id: string }) => s.id)).toEqual(['s1']) // la facturada no se ofrece
    expect(res.body[0]).toMatchObject({ id: 's1', number: 'OV-2026-117' })
  })

  // `sales_orders.date` es una columna `date`: pg la entrega como Date y al serializar sale un ISO
  // completo. El `<input type="date">` que la recibe en el formulario de transición exige
  // `YYYY-MM-DD` EXACTO y ante cualquier otra cosa se queda en blanco, sin avisar de nada — que es
  // como se vio: orden de venta elegida y fecha vacía.
  it('la fecha de la orden de venta sale como YYYY-MM-DD, no como instante', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ('sf','OV-FECHA','Corola','2026-07-15','open','{\"order_status\":\"open\"}')")
    const { app } = appWith()
    const res = await request(app).get('/api/sales-orders?search=OV-FECHA').set('Cookie', cookie)
    expect(res.body[0].date).toBe('2026-07-15')
  })

  // Una OV ya usada por otro ticket no está libre. Se mira por las DOS vías porque no siempre hay
  // `salesorder_id`: los tickets de Zoho y los creados tecleando el número solo dejan `orden_venta`.
  it('soloLibres deja fuera las órdenes que ya usa otro ticket, por id o por número', async () => {
    const cookie = await adminCookie()
    const ov = (id: string, num: string) =>
      db.query('INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ($1,$2,\'Corola\',\'2026-06-01\',\'open\',\'{"order_status":"open"}\')', [id, num])
    await ov('libre', 'OV-LIBRE')
    await ov('porId', 'OV-POR-ID')
    await ov('porNumero', 'OV-POR-NUMERO')
    await db.query("INSERT INTO tickets (id,number,subject,status,salesorder_id) VALUES ('t-a',1,'A','Ingresado','porId')")
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta) VALUES ('t-b',2,'B','Ingresado','OV-POR-NUMERO')")

    const { app } = appWith()
    const todas = await request(app).get('/api/sales-orders?search=OV-').set('Cookie', cookie)
    expect(todas.body.map((s: { id: string }) => s.id).sort()).toEqual(['libre', 'porId', 'porNumero'])

    const libres = await request(app).get('/api/sales-orders?search=OV-&soloLibres=1').set('Cookie', cookie)
    expect(libres.body.map((s: { id: string }) => s.id)).toEqual(['libre'])
  })

  it('GET /api/clients sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=x')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/contacts y /api/accounts', () => {
  it('listan contactos y empresas (con sesión); 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,email,account_id) VALUES ('c1','Ana','P','a@b.co','a1')")
    const { app } = appWith()
    const c = await request(app).get('/api/contacts').set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.body[0]).toMatchObject({ name: 'Ana P', company: 'ACME', companyId: 'a1' })
    const e = await request(app).get('/api/accounts').set('Cookie', cookie)
    expect(e.body[0]).toMatchObject({ name: 'ACME' })
    expect((await request(app).get('/api/contacts')).status).toBe(401)
  })
})

describe('GET /api/contacts/:id y /api/accounts/:id', () => {
  it('detalle (con sesión); 404 inexistente; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,account_id) VALUES ('c1','Ana','P','a1')")
    const { app } = appWith()
    expect((await request(app).get('/api/contacts/c1').set('Cookie', cookie)).body).toMatchObject({ name: 'Ana P' })
    expect((await request(app).get('/api/accounts/a1').set('Cookie', cookie)).body).toMatchObject({ name: 'ACME' })
    expect((await request(app).get('/api/contacts/nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get('/api/contacts/c1')).status).toBe(401)
  })
})

describe('GET /api/remisiones/nueva', () => {
  /** Ticket 't1' de la app, con cliente de Books y una copia propia de marca/modelo/serie del equipo. */
  const conTicket = async (equipoId: string | null) => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query(
      `INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
       VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', $1, 'Grimm', 'EDM180C', '18A1')`,
      [equipoId],
    )
  }

  it('prellena desde el ticket y devuelve el checklist del perfil', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-r1', '18A20070'))              // Grimm / EDM180C
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0),('grimm_edm180','Datalogger',1)")
    await conTicket('eq-r1')
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ticketNumber: '10000', cliente: 'Gecelca S.A. E.S.P.', tipoServicio: 'Mantenimiento', perfil: 'grimm_edm180',
      equipo: { serial: '18A20070', marca: 'Grimm', modelo: 'EDM180C' },
    })
    expect(res.body.incluye).toEqual(['Manuales', 'Datalogger']) // en el orden del catálogo, no alfabético
  })

  // Los datos del equipo mandan sobre la copia que el ticket guardó al crearse.
  it('si el equipo se corrigió después, gana el registro del equipo', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, { ...equipoRow('eq-r2', 'SERIE-NUEVA'), modelo: 'EDM 280' })
    await conTicket('eq-r2')
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.body.equipo).toMatchObject({ serial: 'SERIE-NUEVA', modelo: 'EDM 280' })
    expect(res.body.perfil).toBe('grimm_edm280') // el perfil se recalcula con el modelo corregido
  })

  // Los tickets históricos de Zoho no tienen equipo_id: se cae a las columnas del propio ticket.
  it('sin equipo_id usa las columnas del ticket', async () => {
    const cookie = await adminCookie()
    await conTicket(null)
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.equipo).toMatchObject({ serial: '18A1', marca: 'Grimm', modelo: 'EDM180C' })
  })

  // Kunak sin ítems y catálogo sin sembrar dejan ambos `incluye` vacío. `catalogoCargado` es lo único
  // que los separa: sin él la app diría "este equipo no lleva accesorios" con el catálogo a medio cargar.
  it('distingue un perfil sin checklist del catálogo aún sin sembrar', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, { ...equipoRow('eq-r3', 'K1'), marca: 'Kunak', modelo: 'AIR' })
    await conTicket('eq-r3')
    const { app } = appWith()

    const sinSembrar = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(sinSembrar.body).toMatchObject({ perfil: 'kunak', incluye: [], catalogoCargado: false })

    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0)")
    const sembrado = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(sembrado.body).toMatchObject({ perfil: 'kunak', incluye: [], catalogoCargado: true })
  })

  it('404 si el ticket no existe, 400 sin ticketId, 401 sin sesión', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).get('/api/remisiones/nueva?ticketId=nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get('/api/remisiones/nueva').set('Cookie', cookie)).status).toBe(400)
    expect((await request(app).get('/api/remisiones/nueva?ticketId=t1')).status).toBe(401)
  })
})

describe('POST /api/remisiones', () => {
  const preparar = async () => {
    await upsertEquipo(db, equipoRow('eq-p1', '18A20070'))  // Grimm / EDM180C → grimm_edm180
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0),('grimm_edm180','Datalogger',1)")
    await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                    VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-p1', 'Grimm', 'EDM180C', '18A1')`)
  }

  it('crea la remisión en estado pendiente y la lista en el ticket', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'], observaciones: 'Llega con golpe' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      ticketId: 't1', estado: 'pendiente', perfil: 'grimm_edm180',
      serial: '18A20070', incluye: ['Manuales'], creadoPor: 'Admin', tipoServicio: 'Mantenimiento',
    })
    const lista = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(lista.body).toHaveLength(1)
    expect(lista.body[0].fotos).toEqual([])
  })

  // Autocontenida: la remisión guarda empresa y persona de contacto del cliente TAL COMO ERAN al
  // crearla, tomados de Books con el mismo respaldo (companyName → name) que usa el flujo de n8n.
  it('guarda empresa y personaContacto del cliente del ticket al crearla (con companyName)', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE books.contacts SET company_name = 'SERAMBIENTE S.A.S.', persona_contacto = 'Edgar Barrera' WHERE contact_id = 'cli1'")
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ empresa: 'SERAMBIENTE S.A.S.', personaContacto: 'Edgar Barrera' })
    const lista = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(lista.body[0]).toMatchObject({ empresa: 'SERAMBIENTE S.A.S.', personaContacto: 'Edgar Barrera' })
  })

  // Caso mayoritario en producción: muchos contactos de Books no traen `company_name`. Sin respaldo,
  // `empresa` quedaría NULL en casi toda remisión nueva mientras las 149 históricas sí la traen (se
  // llenaron con el NOMBRE del cliente, no con `company_name`) — la columna significaría cosas
  // distintas según la fila. `preparar()` ya inserta 'cli1' sin `company_name`, así que es el caso.
  it('si el cliente no tiene companyName, usa el name (mismo respaldo que el histórico y n8n)', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ empresa: 'Gecelca S.A. E.S.P.', personaContacto: null })
  })

  // El perfil decide qué checklist aplica, así que no puede venir del navegador: se recalcula aquí.
  it('rechaza ítems que no estén en el checklist del perfil', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales', 'Cabezal TSP'] })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('Cabezal TSP')
  })

  it('valida ticket y fecha', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie).send({ fecha: '2026-08-03' })).status).toBe(422)
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 'nope', fecha: '2026-08-03' })).status).toBe(422)
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '03/08/2026' })).status).toBe(422)
    expect((await request(app).post('/api/remisiones').send({ ticketId: 't1', fecha: '2026-08-03' })).status).toBe(401)
  })

  // La orden de venta se puede capturar aquí para no tener que hacerlo en Habilitar Servicio. NO es
  // obligatoria: cuando el equipo entra, la OV puede no existir todavía.
  it('captura la orden de venta en el ticket, resolviéndola de Books y sin pisar la que ya hubiera', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,raw) VALUES ('ov1','OV-2026-300','cli1','2026-07-15','{\"order_status\":\"open\"}')")
    const { app } = appWith()

    // Sin orden de venta: se crea igual. Es el caso normal cuando el equipo llega antes que la venta.
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })).status).toBe(201)

    const conOV = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], salesOrderId: 'ov1', permitirSegunda: true })
    expect(conOV.status).toBe(201)
    // El NÚMERO y la FECHA salen de Books, no del navegador: es un dato de otro sistema.
    const t = (await db.query("SELECT orden_venta, fecha_orden_venta, salesorder_id FROM tickets WHERE id='t1'")).rows[0]
    expect(t.orden_venta).toBe('OV-2026-300')
    // `date` vuelve como Date, no como texto. La suite corre en UTC (vitest.config), así que el ISO
    // no corre de día.
    expect((t.fecha_orden_venta as Date).toISOString().slice(0, 10)).toBe('2026-07-15')
    expect(t.salesorder_id).toBe('ov1')

    // Ya la tiene: una remisión posterior no puede cambiarla. En el formulario sale en gris.
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,raw) VALUES ('ov2','OV-OTRA','cli1','2026-07-20','{\"order_status\":\"open\"}')")
    await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], salesOrderId: 'ov2', permitirSegunda: true })
    expect((await db.query("SELECT orden_venta FROM tickets WHERE id='t1'")).rows[0].orden_venta).toBe('OV-2026-300')
  })

  it('una orden de venta que no existe en Books no crea la remisión', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], salesOrderId: 'no-existe' })
    expect(res.status).toBe(422)
    expect((await db.query("SELECT COUNT(*)::int AS n FROM remisiones WHERE ticket_id='t1'")).rows[0].n).toBe(0)
  })

  it('el formulario recibe la orden de venta que el ticket ya tiene', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE tickets SET orden_venta='OV-YA' WHERE id='t1'")
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.body.ordenVenta).toBe('OV-YA')
  })

  // El cartel del formulario era un consejo, no una barrera: si la consulta que lo alimenta falla, no
  // aparece y el duplicado vuelve a ser posible en silencio. Y un cliente directo de la API nunca lo
  // ve. Dos `pendiente` a la vez en un ticket son hoy dos entradas DEL MISMO equipo —el equipo se
  // deriva del ticket, no se acepta del navegador—, o sea un duplicado.
  it('no deja una segunda remisión pendiente en el ticket, salvo que se pida a propósito', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const crear = (extra: object = {}) => request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], ...extra })

    const primera = await crear()
    expect(primera.status).toBe(201)

    const segunda = await crear()
    expect(segunda.status).toBe(409)
    // Con el id de la que ya existe el cliente puede enviarla; sin él solo puede reintentar a ciegas.
    expect(segunda.body.remisionId).toBe(primera.body.id)

    // La salida deliberada sigue abierta: bloquear del todo dejaría al técnico sin poder crear otra
    // si n8n se cae y la primera se queda en `pendiente` para siempre.
    expect((await crear({ permitirSegunda: true })).status).toBe(201)
  })

  it('solo bloquea una PENDIENTE vigente: con desenlace, o anulada, deja crear la siguiente', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const crear = () => request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })

    const conDesenlace = await crear()
    await db.query("UPDATE remisiones SET estado='ok' WHERE id=$1", [conDesenlace.body.id])
    const segunda = await crear()
    expect(segunda.status).toBe(201) // la cerrada no estorba

    await db.query('UPDATE remisiones SET anulada_at=now() WHERE id=$1', [segunda.body.id])
    expect((await crear()).status).toBe(201) // la anulada tampoco
  })

  // El callback es la única vía de sacar una remisión de `pendiente`, y n8n no tiene sesión.
  // El envío va separado de la creación porque las fotos se suben en medio: si se disparase al
  // crear, el documento saldría sin registro fotográfico.
  it('enviar manda las fotos en base64 dentro del payload', async () => {
    const cookie = await adminCookie(); await preparar()
    const llamadas: Array<{ url: string; body: string }> = []
    const fakeFetch = vi.fn(async (url: string, init: RequestInit) => {
      llamadas.push({ url, body: String(init.body) })
      return new Response('{}', { status: 202 })
    })
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
      expect(llamadas).toHaveLength(0) // crear NO dispara

      const png = Buffer.from('89504e470d0a1a0a', 'hex')
      await request(app).post(`/api/remisiones/${rem.body.id}/fotos`).set('Cookie', cookie)
        .attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })

      const env = await request(app).post(`/api/remisiones/${rem.body.id}/enviar`).set('Cookie', cookie)
      expect(env.status).toBe(200)
      expect(llamadas).toHaveLength(1)
      const enviado = JSON.parse(llamadas[0].body)
      expect(enviado.fotos).toHaveLength(1)
      expect(enviado.fotos[0]).toMatchObject({ fileName: 'equipo.png', mimeType: 'image/png' })
      expect(enviado.fotos[0].data).toBe(png.toString('base64'))
    } finally { vi.unstubAllGlobals() }
  })

  // El documento que genera n8n debe reflejar lo que la remisión capturó AL CREARSE, no un getClient
  // fresco en el momento de enviar: hay ventana de reenvío y botón de reintentar, así que si alguien
  // corrige el cliente en Books entre medias, el documento no puede desdecir lo que la remisión dice.
  it('enviar manda a n8n la empresa y personaContacto GUARDADOS en la remisión, no los del cliente actual', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE books.contacts SET company_name = 'Nombre original S.A.S.', persona_contacto = 'Persona original' WHERE contact_id = 'cli1'")
    const llamadas: Array<{ url: string; body: string }> = []
    const fakeFetch = vi.fn(async (url: string, init: RequestInit) => {
      llamadas.push({ url, body: String(init.body) })
      return new Response('{}', { status: 202 })
    })
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
      expect(rem.body).toMatchObject({ empresa: 'Nombre original S.A.S.', personaContacto: 'Persona original' })

      // El cliente se corrige en Books DESPUÉS de crear la remisión.
      await db.query("UPDATE books.contacts SET company_name = 'Nombre corregido S.A.S.', persona_contacto = 'Persona corregida' WHERE contact_id = 'cli1'")

      const env = await request(app).post(`/api/remisiones/${rem.body.id}/enviar`).set('Cookie', cookie)
      expect(env.status).toBe(200)
      const enviado = JSON.parse(llamadas[0].body)
      expect(enviado.cliente).toMatchObject({ empresa: 'Nombre original S.A.S.', personaContacto: 'Persona original' })
    } finally { vi.unstubAllGlobals() }
  })

  // Reenviar una remisión ya cerrada crearía un segundo documento y una segunda carpeta en Drive para
  // el mismo equipo. Solo se reenvía lo que no llegó a buen puerto.
  it('no reenvía una remisión ya cerrada; reenviar una fallida la devuelve a pendiente', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada', remisionCallbackToken: 'secreto-cb' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const callback = (body: object) => request(app).post(`/api/remisiones/${id}/callback`)
        .set('X-Remision-Callback', 'secreto-cb').send(body)
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      await callback({ estado: 'ok' })
      expect((await enviar()).status).toBe(409)

      await callback({ estado: 'ok_con_avisos', resultado: { avisos: [{ paso: 'el correo al técnico' }] } })
      expect((await enviar()).status).toBe(409) // con avisos también cuenta como cerrada
      // El detalle que manda n8n se guarda entero: es lo que el panel enseña al técnico.
      const conAvisos = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
      expect(conAvisos.body.resultado.avisos).toEqual([{ paso: 'el correo al técnico' }])

      await callback({ estado: 'error', resultado: { fallos: [{ paso: 'el PDF de la remisión' }] } })
      expect((await enviar()).status).toBe(200)
      const tras = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
      expect(tras.body.estado).toBe('pendiente')
      expect(tras.body.resultado).toBeNull() // el detalle del intento anterior no se queda pegado
    } finally { vi.unstubAllGlobals() }
  })

  // Escenario real: técnico en campo con mala cobertura. El servidor dispara el webhook con éxito,
  // el técnico pierde la red antes de recibir la respuesta, y la pantalla le ofrece reintentar. Leer
  // el estado y luego decidir no basta —dos peticiones simultáneas pasarían las dos ese filtro—, así
  // que la garantía tiene que estar en la propia reclamación atómica, no en la comprobación previa.
  it('dos /enviar seguidos sobre una remisión pendiente: el segundo no duplica el disparo a n8n', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      expect((await enviar()).status).toBe(200)
      expect((await enviar()).status).toBe(409) // la ventana de reenvío sigue abierta: no se reclama de nuevo
      expect(fakeFetch).toHaveBeenCalledTimes(1) // la prueba de que no se generó un segundo documento
    } finally { vi.unstubAllGlobals() }
  })

  // Si el disparo ni siquiera llegó a salir (webhook mal configurado, por ejemplo), obligar a esperar
  // la ventana entera para reintentar sería absurdo: no se ganó nada guardando la reclamación.
  it('si el disparo a n8n falla, la reclamación se suelta y se puede reintentar de inmediato', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith() // sin remisionWebhookUrl: dispararRemision falla con 502, sin llamar a fetch
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

    expect((await enviar()).status).toBe(502)
    expect((await enviar()).status).toBe(502) // no 409: si no se hubiera soltado, esto sería 409
  })

  // `resuelto_at` es justo lo que distingue un intento que ya terminó de uno todavía en vuelo, así
  // que un error reciente se puede reenviar aunque `enviado_at` esté dentro de la ventana de reenvío.
  it('tras un callback de error se puede reenviar de inmediato aunque enviado_at sea reciente', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada', remisionCallbackToken: 'secreto-cb' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      expect((await enviar()).status).toBe(200) // deja enviado_at reciente
      await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb')
        .send({ estado: 'error', resultado: { fallos: [{ paso: 'el PDF de la remisión' }] } })

      expect((await enviar()).status).toBe(200) // no 409 pese a estar dentro de la ventana
      expect(fakeFetch).toHaveBeenCalledTimes(2)
    } finally { vi.unstubAllGlobals() }
  })

  // Si n8n está caído, `fetch` rechaza en vez de devolver una respuesta con error. Sin capturarlo en
  // `dispararRemision`, la excepción caería en el manejador central (500 genérico) sin pasar por
  // `liberarEnvio`, y el técnico se quedaría sin poder reintentar durante toda la ventana de reenvío.
  it('si n8n está caído (fetch rechaza), la ruta responde 502 —no 500— y suelta la reclamación', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      expect((await enviar()).status).toBe(502)
      expect((await enviar()).status).toBe(502) // no 409: la reclamación se soltó pese al fallo de red
    } finally { vi.unstubAllGlobals() }
  })

  // Los tests anteriores llaman a enviar() con await, uno tras otro: eso prueba que el estado
  // persiste entre llamadas, pero no ejercita la condición de carrera que reclamarEnvio existe para
  // cerrar. Si alguien reintrodujera un leer-y-decidir en dos pasos, esos tests seguirían en verde;
  // este no. pg-mem es de un solo hilo, así que no reproduce la carrera real de Postgres, pero sí
  // detecta la regresión estructural: que el UPDATE deje de ser atómico.
  it('dos /enviar simultáneos: exactamente uno gana, el otro 409, un solo disparo a n8n', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      const [a, b] = await Promise.all([enviar(), enviar()])
      const estados = [a.status, b.status].sort()
      expect(estados).toEqual([200, 409])
      expect(fakeFetch).toHaveBeenCalledTimes(1)
    } finally { vi.unstubAllGlobals() }
  })

  it('el callback exige el secreto compartido y solo acepta estados conocidos', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionCallbackToken: 'secreto-cb' })
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id

    expect((await request(app).post(`/api/remisiones/${id}/callback`).send({ estado: 'ok' })).status).toBe(401)
    expect((await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'otro').send({ estado: 'ok' })).status).toBe(401)
    expect((await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb').send({ estado: 'raro' })).status).toBe(422)

    const ok = await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb')
      .send({ estado: 'ok_con_avisos', resultado: { pdfId: 'drive-pdf-1', avisos: [{ paso: 'el correo al técnico' }] } })
    expect(ok.status).toBe(200)
    const lista = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(lista.body[0]).toMatchObject({ estado: 'ok_con_avisos', resultado: { pdfId: 'drive-pdf-1' } })
  })

  // Sin secreto configurado la ruta NO puede quedar abierta: se cierra con 503.
  it('sin REMISION_CALLBACK_TOKEN el callback responde 503, no 200', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const r = await request(app).post(`/api/remisiones/${rem.body.id}/callback`).set('X-Remision-Callback', '').send({ estado: 'ok' })
    expect(r.status).toBe(503)
  })

  it('sube fotos, las lista sin el base64 y las sirve con nosniff', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    const png = Buffer.from('89504e470d0a1a0a', 'hex')
    const up = await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie).attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })
    expect(up.status).toBe(201)
    expect(up.body).toMatchObject({ filename: 'equipo.png', contentType: 'image/png' })
    expect(up.body.contentB64).toBeUndefined() // el listado nunca devuelve el contenido

    const bajada = await request(app).get(`/api/remisiones/${id}/fotos/${up.body.id}`).set('Cookie', cookie)
    expect(bajada.status).toBe(200)
    expect(bajada.headers['x-content-type-options']).toBe('nosniff')

    const svg = Buffer.from('<svg/>')
    const malo = await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie).attach('file', svg, { filename: 'x.svg', contentType: 'image/svg+xml' })
    expect(malo.status).toBe(415) // SVG fuera: puede llevar script embebido
  })

  // El formulario sondea esta ruta tras enviar, esperando el desenlace que escribirá el callback.
  it('GET /:id devuelve la remisión con sus fotos; 404 si no existe; 401 sin sesión', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    const id = rem.body.id
    const png = Buffer.from('89504e470d0a1a0a', 'hex')
    await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie)
      .attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })

    const res = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id, estado: 'pendiente', incluye: ['Manuales'] })
    expect(res.body.fotos).toHaveLength(1)
    expect(res.body.fotos[0].contentB64).toBeUndefined() // el listado nunca lleva el base64

    expect((await request(app).get('/api/remisiones/rem-nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/remisiones/${id}`)).status).toBe(401)
  })

  // Anular es reversible A PROPÓSITO: la remisión es un documento que puede haberse mandado ya a un
  // cliente y su PDF sigue en Drive, así que la fila se marca y no se borra. Por eso desaparece de los
  // dos sitios donde se lista (panel del ticket y listado) y restaurar la devuelve a los dos.
  it('anular saca la remisión del listado y del panel del ticket; restaurar la devuelve a los dos', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id

    expect((await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)).status).toBe(200)

    const panelTrasAnular = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(panelTrasAnular.body).toHaveLength(0)
    const listadoTrasAnular = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(listadoTrasAnular.body.find((r: RemisionListado) => r.id === id)).toBeUndefined()

    expect((await request(app).post(`/api/remisiones/${id}/restaurar`).set('Cookie', cookie)).status).toBe(200)

    const panelTrasRestaurar = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(panelTrasRestaurar.body).toHaveLength(1)
    const listadoTrasRestaurar = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(listadoTrasRestaurar.body.find((r: RemisionListado) => r.id === id)).toBeDefined()
  })

  it('anuladaPor guarda quién anuló; el listado solo la trae con el flag de incluir anuladas', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)

    const sinFlag = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(sinFlag.body.find((r: RemisionListado) => r.id === id)).toBeUndefined()

    const conFlag = await request(app).get('/api/remisiones/listado?incluirAnuladas=1').set('Cookie', cookie)
    const fila = conFlag.body.find((r: RemisionListado) => r.id === id)
    expect(fila).toBeDefined()
    expect(fila.anuladaPor).toBe('Admin')
    expect(fila.anuladaAt).toBeTruthy()
  })

  // Mismo criterio que borrar un equipo o una resolución: solo administradores. requireAdmin va
  // DESPUÉS de requireAuth, así que sin sesión el corte es 401 y con sesión no-admin es 403.
  it('anular y restaurar exigen admin: 403 sin serlo, 401 sin sesión', async () => {
    const cookie = await adminCookie(); await preparar()
    const opCookie = await userCookie(['soporte'])
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id

    expect((await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', opCookie)).status).toBe(403)
    expect((await request(app).post(`/api/remisiones/${id}/anular`)).status).toBe(401)

    expect((await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)).status).toBe(200)

    expect((await request(app).post(`/api/remisiones/${id}/restaurar`).set('Cookie', opCookie)).status).toBe(403)
    expect((await request(app).post(`/api/remisiones/${id}/restaurar`)).status).toBe(401)
  })

  it('anular y restaurar responden 404 si la remisión no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).post('/api/remisiones/rem-nope/anular').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).post('/api/remisiones/rem-nope/restaurar').set('Cookie', cookie)).status).toBe(404)
  })

  // Enviar una remisión que se acaba de anular generaría un documento en Drive de algo que ya no
  // debería existir como tal: absurdo, y por eso se corta con 409 antes de llegar a n8n.
  it('una remisión anulada no se puede enviar', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)

    const env = await request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)
    expect(env.status).toBe(409)
    expect(env.body.error).toMatch(/anulad/i)
  })
})

// Alimenta la sección "Remisiones" de la cabecera: la vista tabular que tenía la hoja de Google,
// ahora con históricas y de la app juntas.
describe('GET /api/remisiones/listado', () => {
  it('remisión con equipo enlazado trae marca y modelo del equipo (no del ticket)', async () => {
    await upsertEquipo(db, equipoRow('eq-l1', '18A20070'))
    await db.query(
      `INSERT INTO remisiones (id, ticket_id, tipo, fecha, tipo_servicio, perfil, equipo_id, serial, incluye, observaciones, creado_por, estado, empresa, persona_contacto, origen)
       VALUES ('rem-l1', NULL, 'entrada', '2026-08-01', 'Mantenimiento', 'grimm_edm180', 'eq-l1', '18A20070', '["Manuales"]'::jsonb, 'Sin novedad', 'Julián Maya', 'ok', 'ACME', 'Juan Gómez', 'app')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({
      id: 'rem-l1', fecha: '2026-08-01', tecnico: 'Julián Maya', empresa: 'ACME',
      personaContacto: 'Juan Gómez', marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070',
      incluye: ['Manuales'], tipoServicio: 'Mantenimiento', observaciones: 'Sin novedad',
      estado: 'ok', origen: 'app', ticketId: null, ticketNumero: null,
    })
  })

  it('sin equipo enlazado, marca y modelo salen NULL sin reventar', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l2', 'entrada', '2026-07-01', 'Ana Pérez', 'ok', 'historico')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'rem-l2', marca: null, modelo: null })
  })

  it('sin ticket, ticketId y ticketNumero salen NULL', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l3', 'entrada', '2026-06-01', 'Ana Pérez', 'ok', 'historico')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body[0]).toMatchObject({ id: 'rem-l3', ticketId: null, ticketNumero: null })
  })

  it('con ticket, trae el número correcto', async () => {
    await db.query("INSERT INTO tickets (id,number,status) VALUES ('t-l4', 4200, 'Finalizado')")
    await db.query(
      `INSERT INTO remisiones (id, ticket_id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l4', 't-l4', 'entrada', '2026-05-01', 'Ana Pérez', 'ok', 'app')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body[0]).toMatchObject({ id: 'rem-l4', ticketId: 't-l4', ticketNumero: '#4200' })
  })

  it('ordena por fecha descendente', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen) VALUES
        ('rem-l5', 'entrada', '2026-01-01', 'A', 'ok', 'historico'),
        ('rem-l6', 'entrada', '2026-03-01', 'B', 'ok', 'historico'),
        ('rem-l7', 'entrada', '2026-02-01', 'C', 'ok', 'historico')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body.map((r: any) => r.id)).toEqual(['rem-l6', 'rem-l7', 'rem-l5'])
  })

  // `fecha` es un `date`: no tiene hora. La única hora que existe es `created_at`, y la pantalla la
  // muestra solo en las de la app (en una histórica sería la hora de la importación, no la del
  // servicio). Por eso el listado tiene que traerla, aunque la tabla decida cuándo pintarla.
  it('trae createdAt, que es donde vive la hora que `fecha` no tiene', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen, created_at)
       VALUES ('rem-l9', 'entrada', '2026-07-24', 'Julián Maya', 'ok', 'app', '2026-07-24T19:41:00Z')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body[0].id).toBe('rem-l9')
    expect(new Date(res.body[0].createdAt).toISOString()).toBe('2026-07-24T19:41:00.000Z')
  })

  it('401 sin sesión', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/remisiones/listado')).status).toBe(401)
  })

  // Ocultar el interruptor "Ver anuladas" en la UI no protege nada: sin este corte, cualquier
  // usuario con sesión podía pedir esta URL a mano (barra de direcciones, curl) y ver quién anuló
  // qué y cuándo. El listado normal (sin el flag) sigue abierto a cualquier usuario autenticado.
  it('incluirAnuladas exige admin: 403 sin serlo; el listado normal sigue abierto a cualquier sesión', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen, anulada_at, anulada_por)
       VALUES ('rem-l9', 'entrada', '2026-08-01', 'Ana Pérez', 'ok', 'app', now(), 'Admin')`,
    )
    const opCookie = await userCookie(['soporte'])
    const { app } = appWith()

    expect((await request(app).get('/api/remisiones/listado?incluirAnuladas=1').set('Cookie', opCookie)).status).toBe(403)

    const normal = await request(app).get('/api/remisiones/listado').set('Cookie', opCookie)
    expect(normal.status).toBe(200)
    expect(normal.body.find((r: RemisionListado) => r.id === 'rem-l9')).toBeUndefined()

    const cookie = await adminCookie()
    const conFlag = await request(app).get('/api/remisiones/listado?incluirAnuladas=1').set('Cookie', cookie)
    expect(conFlag.status).toBe(200)
    expect(conFlag.body.find((r: RemisionListado) => r.id === 'rem-l9')).toBeDefined()
  })

  // El riesgo de registrar /listado junto a /nueva: si quedara DESPUÉS de /:id, Express lo trataría
  // como si 'listado' fuera un id. Este test lo cubre desde los dos lados: la ruta nueva no se come
  // /nueva ni /:id, y tampoco al revés.
  it('no rompe /nueva ni /:id, y /listado no cae en /:id (regresión del orden de rutas)', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query(
      `INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, serial)
       VALUES ('t-l8', 4300, 'OV asignada', true, 'cli1', 'Mantenimiento', '18A1')`,
    )
    await db.query(
      `INSERT INTO remisiones (id, ticket_id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l8', 't-l8', 'entrada', '2026-08-03', 'Ana Pérez', 'pendiente', 'app')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()

    const listado = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(listado.status).toBe(200)
    expect(Array.isArray(listado.body)).toBe(true)

    const nueva = await request(app).get('/api/remisiones/nueva?ticketId=t-l8').set('Cookie', cookie)
    expect(nueva.status).toBe(200)

    const porId = await request(app).get('/api/remisiones/rem-l8').set('Cookie', cookie)
    expect(porId.status).toBe(200)
    expect(porId.body.id).toBe('rem-l8')
  })
})

describe('GET /api/equipos', () => {
  it('busca equipos (con sesión)', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-t1', '18A22052'))
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

  // La transición es la SEGUNDA puerta por la que una orden de venta entra en un ticket, y la regla
  // es la misma que en la creación: una OV, un ticket. El buscador de Habilitar Servicio ya solo
  // ofrece las libres, pero una lista no es una frontera.
  it('409 si Habilitar Servicio asigna una orden de venta que ya está en otro ticket', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta) VALUES ('t-dueno',900,'Ya','Ingresado','OV-YA')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type) VALUES ('2',906,'Sin OV','OV asignada','Open')")
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/2/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-YA', Serial: '18A1' } })
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('900')
  })

  // Un ticket no choca consigo mismo: reconfirmar la OV que ya tiene no es duplicarla. Sin excluirse,
  // Habilitar Servicio quedaría bloqueada justo para los tickets que llegan de Zoho con su OV puesta.
  it('Habilitar Servicio no bloquea la orden de venta que el propio ticket ya tiene', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,orden_venta) VALUES ('3',907,'Con su OV','OV asignada','Open','OV-MIA')")
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/3/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-MIA', Serial: '18A1' } })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/tickets (crear)', () => {
  const seedEquipo = async () => {
    const eq = equipoRow('eq-t2', '18A20070')
    await upsertEquipo(db, eq)
    return eq
  }

  it('crea desde una OV con equipo: deriva cliente + orden, toma marca/modelo/serie/tipo del equipo', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id) VALUES ('so1','OV-2026-200','cli1')")
    const eq = await seedEquipo()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      salesOrderId: 'so1', equipoId: eq.id, tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio de mantenimiento', prefijo: 'MT',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('Ticket creado')
    expect(res.body.company).toBe('Gecelca S.A. E.S.P.')
    const t = (await db.query("SELECT marca, modelo, serial, equipo, equipo_id, salesorder_id FROM tickets WHERE salesorder_id='so1'")).rows[0]
    expect(t).toMatchObject({ marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070', equipo: 'Monitor PM10/PM2.5', equipo_id: eq.id })
  })

  it('crea sin OV con cliente manual + equipo', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli2','Camposol')")
    const eq = await seedEquipo()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli2', equipoId: eq.id, tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo', prefijo: 'CG', ordenVenta: 'manual-1',
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('Ticket creado')
  })

  // Una orden de venta es de un solo servicio: si ya está en un ticket, no puede entrar en otro. Se
  // cierra en el endpoint y no solo en el buscador —esconder la opción no impide mandar el id— y se
  // miran las DOS vías, porque los tickets de Zoho y los creados tecleando el número solo dejan
  // `orden_venta`, sin `salesorder_id`.
  it('409 si la orden de venta ya está en otro ticket, por id o por número', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliX','Gecelca')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id) VALUES ('soX','OV-2026-300','cliX')")
    await db.query("INSERT INTO tickets (id,number,subject,status,salesorder_id) VALUES ('t-dueno',900,'Ya','Ingresado','soX')")
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta) VALUES ('t-num',901,'Ya','Ingresado','OV-TECLEADA')")
    const eq = await seedEquipo()
    const { app } = appWith()
    const base = { equipoId: eq.id, tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo', prefijo: 'MT' }

    const porId = await request(app).post('/api/tickets').set('Cookie', cookie).send({ ...base, salesOrderId: 'soX' })
    expect(porId.status).toBe(409)
    expect(porId.body.error).toContain('900')

    const porNumero = await request(app).post('/api/tickets').set('Cookie', cookie).send({ ...base, clientId: 'cliX', ordenVenta: 'OV-TECLEADA' })
    expect(porNumero.status).toBe(409)
    expect(porNumero.body.error).toContain('901')
  })

  it('422 si el equipo no existe', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli3','X')")
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
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliF','Cliente F')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-f1','Monitor PM10')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-f1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-f1','m-f1','EDM180C','t-f1')")
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({
      serial: 'SN-F1', modeloId: 'mo-f1', clientId: 'cliF',
    })
    expect(create.status).toBe(201)
    expect(create.body).toMatchObject({ serial: 'SN-F1', marca: 'Grimm', active: true, clientId: 'cliF', clienteNombre: 'Cliente F' })
    const id = create.body.id
    // El PATCH ya no acepta marca/modelo/tipo sueltos: los escribe el catálogo (vía `modeloId`) y
    // ningún otro camino los toca. Se manda a propósito junto con `active` para comprobar que se
    // ignoran en vez de limitarnos a no mandarlos — si alguien reintroduce su lectura del cuerpo
    // (de buena fe, porque un formulario "quiere" editar el tipo), este test debe reventar.
    const patch = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie)
      .send({ active: false, tipo: 'Analizador CO', marca: 'FALSA', modelo: 'FALSO' })
    expect(patch.status).toBe(200)
    expect(patch.body).toMatchObject({ active: false, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10' })
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
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliG','G')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-g','O3')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-g','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-g','m-g','APOA-370','t-g')")
    const { app } = appWith()
    await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-G', modeloId: 'mo-g', clientId: 'cliG' })
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
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliD','D')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-d','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-d','m-d','EDM180C')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', admin).send({ serial: 'SN-DEL', modeloId: 'mo-d', clientId: 'cliD' })).body.id
    const op = await userCookie([])
    expect((await request(app).delete(`/api/equipos/${id}`).set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete(`/api/equipos/${id}`)).status).toBe(401)
    expect((await request(app).delete(`/api/equipos/${id}`).set('Cookie', admin)).status).toBe(200)
    expect((await listEquiposManage(db, 'SN-DEL')).length).toBe(0)
  })

  it('GET /api/equipos/:id/historial → equipo + cronología de tickets y remisiones; 404; 401', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cH','H')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-h','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-h','m-h','EDM180C')")
    const { app } = appWith()
    const eqId = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-H', modeloId: 'mo-h', clientId: 'cH' })).body.id
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,serial,equipo_id,created_time) VALUES ('h1',777,'T','Ingresado','Open','SN-H',$1,'2026-08-05T10:00:00Z')`, [eqId])
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,equipo_id,creado_por,estado,created_at)
       VALUES ('rem-h','h1','entrada','2026-08-05','Calibración',$1,'Julián','ok','2026-08-05T11:00:00Z')`,
      [eqId],
    )
    const res = await request(app).get(`/api/equipos/${eqId}/historial`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.equipo.serial).toBe('SN-H')
    // La remisión es posterior al ticket, así que encabeza la cronología: las dos fuentes van mezcladas.
    expect(res.body.cronologia[0]).toMatchObject({ clase: 'remision', remision: { id: 'rem-h', ticketNumero: '#777' } })
    expect(res.body.cronologia[1]).toMatchObject({ clase: 'ticket', ticket: { id: 'h1', number: '#777' } })
    expect((await request(app).get('/api/equipos/eq-nope/historial').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/equipos/${eqId}/historial`)).status).toBe(401)
  })

  // El catálogo es la fuente: los textos marca/modelo/tipo del equipo se rellenan DESDE él y no se
  // aceptan del navegador. Así no pueden divergir, que es lo que esta fase viene a cerrar.
  it('crear un equipo toma marca, modelo y tipo del modelo del catálogo, ignorando lo que mande el cliente', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliC','Cliente C')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-1','Analizador de SO2')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-1','m-1','APSA-370','t-1')")
    const { app } = appWith()

    const res = await request(app).post('/api/equipos').set('Cookie', cookie)
      .send({ serial: 'SN-CAT', clientId: 'cliC', modeloId: 'mo-1', marca: 'INVENTADA', modelo: 'FALSA', tipo: 'MENTIRA' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ marca: 'Horiba', modelo: 'APSA-370', tipo: 'Analizador de SO2', modeloId: 'mo-1' })
  })

  it('422 sin modeloId, y 422 si el modelo no existe', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliD2','D')")
    const { app } = appWith()
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S1', clientId: 'cliD2' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S2', clientId: 'cliD2', modeloId: 'no-existe' })).status).toBe(422)
  })

  it('editar el modelo reescribe los tres textos del equipo', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliE2','E')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-a','Analizador de SO2'),('t-b','Monitor PM10')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-a','Horiba'),('m-b','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-a','m-a','APSA-370','t-a'),('mo-b','m-b','EDM180C','t-b')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-ED', clientId: 'cliE2', modeloId: 'mo-a' })).body.id

    const res = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ modeloId: 'mo-b' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10', modeloId: 'mo-b' })
  })

  // Regla deliberada: el PATCH no exige modeloId. El botón «Desactivar» del listado manda solo
  // { active }, y exigir el modelo en cada PATCH rompería la desactivación. Quien fuerza el modelo al
  // editar es el formulario (tarea posterior), no esta ruta.
  it('PATCH con solo { active } no exige modeloId', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliF2','F')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-f','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-f','m-f','EDM180C')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-DES', clientId: 'cliF2', modeloId: 'mo-f' })).body.id

    const res = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ active: false })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ active: false, marca: 'Grimm', modelo: 'EDM180C' })
  })
})

describe('GET /api/analisis (admin)', () => {
  it('admin obtiene métricas; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    clearAnalisisCache() // caché a nivel de módulo: aislar de filas cacheadas por otros tests
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a1',1,'A','Ingresado','Open',now())")
    const { app } = appWith()
    const res = await request(app).get('/api/analisis?range=todo').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(typeof res.body.activos).toBe('number')
    expect(Array.isArray(res.body.porEstado)).toBe(true)
    const op = await userCookie([])
    expect((await request(app).get('/api/analisis').set('Cookie', op)).status).toBe(403)
    expect((await request(app).get('/api/analisis')).status).toBe(401)
  })
})

describe('GET /api/tickets/:id/activities', () => {
  it('devuelve las actividades del ticket; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,due_date) VALUES ('a1','t1','Informe','In Progress','2026-03-24T00:00:00Z')")
    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/activities').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'a1', subject: 'Informe', status: 'In Progress' })
    expect((await request(app).get('/api/tickets/t1/activities')).status).toBe(401)
  })
})

describe('POST /api/admin/backfill-serial (admin)', () => {
  it('admin → {updated}; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('b1',1,'Servicio MT_18A19042_EDM180C_260305','Finalizado',false)")
    const { app } = appWith()
    const res = await request(app).post('/api/admin/backfill-serial').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body.updated).toBe(1)
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-serial').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-serial')).status).toBe(401)
  })
})

describe('POST /api/admin/backfill-archived (admin)', () => {
  it('admin arranca; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    const { app, sync } = appWith()
    const res = await request(app).post('/api/admin/backfill-archived').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ started: true })
    expect(sync.backfillArchivedTickets).toHaveBeenCalled()
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-archived').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-archived')).status).toBe(401)
  })
})

describe('POST /api/admin/import-remisiones-historicas (admin)', () => {
  it('admin con dryRun=true no escribe y devuelve el resumen; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const res = await request(app).post('/api/admin/import-remisiones-historicas?dryRun=true').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(REMISIONES_HISTORICAS.length)
    expect((await db.query('SELECT COUNT(*)::int AS n FROM remisiones')).rows[0].n).toBe(0)
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/import-remisiones-historicas').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/import-remisiones-historicas')).status).toBe(401)
  })
})

describe('AuthZ admin con sesión+rol (F2-02)', () => {
  it('admin endpoint exige sesión admin (no query-token)', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/admin/measure-attachments')).status).toBe(401) // sin sesión
    const op = await userCookie([]) // operador no admin (helper existente)
    expect((await request(app).get('/api/admin/measure-attachments').set('Cookie', op)).status).toBe(403)
  })
  it('backfill-details exige sesión admin', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/admin/backfill-details')).status).toBe(401)
    const op = await userCookie([])
    expect((await request(app).get('/api/admin/backfill-details').set('Cookie', op)).status).toBe(403)
  })
})

describe('Borrado de resolución solo superadmin (F2-03)', () => {
  it('borrar resolución exige superadmin', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const { app } = appWith()
    const op = await userCookie([])
    expect((await request(app).delete('/api/tickets/t1/resolution').set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete('/api/tickets/t1/resolution/attachments/x').set('Cookie', op)).status).toBe(403)
  })
})

describe('Resolución del ticket', () => {
  it('PUT guarda; GET devuelve; POST imagen 201; GET content sirve; 415 no-imagen; DELETE; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const { app } = appWith()
    expect((await request(app).put('/api/tickets/t1/resolution').set('Cookie', cookie).send({ html: '<p>ok</p>' })).status).toBe(200)
    const g = await request(app).get('/api/tickets/t1/resolution').set('Cookie', cookie)
    expect(g.body).toMatchObject({ html: '<p>ok</p>' })
    const png = Buffer.from('89504e470d0a1a0a', 'hex')
    const up = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie).attach('file', png, { filename: 'a.png', contentType: 'image/png' })
    expect(up.status).toBe(201)
    const attId = up.body.id
    const g2 = await request(app).get('/api/tickets/t1/resolution').set('Cookie', cookie)
    expect(g2.body.attachments).toHaveLength(1)
    const c = await request(app).get(`/api/tickets/t1/resolution/attachments/${attId}`).set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.headers['content-type']).toContain('image/png')
    const txt = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie).attach('file', Buffer.from('hola'), { filename: 'a.txt', contentType: 'text/plain' })
    expect(txt.status).toBe(415)
    expect((await request(app).delete(`/api/tickets/t1/resolution/attachments/${attId}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(app).get('/api/tickets/t1/resolution')).status).toBe(401)
  })

  it('DELETE /resolution borra el texto y todas las imágenes', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t2',2,'B','Ingresado')")
    const { app } = appWith()
    await request(app).put('/api/tickets/t2/resolution').set('Cookie', cookie).send({ html: '<p>algo</p>' })
    await request(app).post('/api/tickets/t2/resolution/attachments').set('Cookie', cookie).attach('file', Buffer.from('89504e470d0a1a0a', 'hex'), { filename: 'a.png', contentType: 'image/png' })
    expect((await request(app).delete('/api/tickets/t2/resolution').set('Cookie', cookie)).status).toBe(204)
    const g = await request(app).get('/api/tickets/t2/resolution').set('Cookie', cookie)
    expect(g.body.html).toBeNull()
    expect(g.body.attachments).toHaveLength(0)
  })
})

describe('Resolución — seguridad', () => {
  it('rechaza SVG (415) y sanea el HTML guardado', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t9',9,'A','Ingresado')")
    const { app } = appWith()
    // SVG rechazado
    const svg = await request(app).post('/api/tickets/t9/resolution/attachments').set('Cookie', cookie)
      .attach('file', Buffer.from('<svg/>'), { filename: 'x.svg', contentType: 'image/svg+xml' })
    expect(svg.status).toBe(415)
    // HTML saneado al guardar
    await request(app).put('/api/tickets/t9/resolution').set('Cookie', cookie)
      .send({ html: '<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)>' })
    const g = await request(app).get('/api/tickets/t9/resolution').set('Cookie', cookie)
    expect(g.body.html).not.toContain('<script')
    expect(g.body.html).not.toContain('onerror')
    expect(g.body.html).toContain('<p>ok</p>')
  })
})

describe('GET /api/attachment (SSRF guard)', () => {
  it('SSRF: ruta de adjunto arbitraria → 400 (con sesión)', async () => {
    const { app, zohoFetch } = appWith()
    const op = await userCookie([])
    const res = await request(app).get('/api/attachment?path=/evil/arbitrary').set('Cookie', op)
    expect(res.status).toBe(400)
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('GET /api/activities (global)', () => {
  it('lista (con sesión); 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',55,'T','Ingresado')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,created_time) VALUES ('a1','t1','Informe','In Progress','Open',now())")
    const { app } = appWith()
    const res = await request(app).get('/api/activities').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ subject: 'Informe', ticketNumber: '#55' })
    expect((await request(app).get('/api/activities')).status).toBe(401)
  })
})

/**
 * Las dos fases tempranas del Blueprint que la app dejó de compartir con Zoho. Un ticket nacido
 * aquí nace en "Ticket creado" y avanza a "Remisión creada" cuando n8n confirma el documento; los
 * que vienen de Zoho conservan "OV asignada", que es su nombre para la misma fase.
 */
describe('Estados tempranos: Ticket creado → Remisión creada', () => {
  const preparar = async () => {
    await upsertEquipo(db, equipoRow('eq-e1', '18A20070'))
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli-e','Gecelca S.A. E.S.P.')")
  }
  /** Un ticket nacido de verdad por la API: el estado inicial lo pone `createTicket`, no el test. */
  const crearTicket = async (app: ReturnType<typeof appWith>['app'], cookie: string) => {
    const r = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli-e', equipoId: 'eq-e1', tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo',
      prefijo: 'CG', ordenVenta: 'OV-1', prioridad: 'Media',
    })
    expect(r.status).toBe(201)
    return r.body.id as string
  }
  const estadoDe = async (id: string) =>
    (await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0].status

  it('el ticket nace en "Ticket creado", no en "OV asignada"', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    expect(await estadoDe(await crearTicket(app, cookie))).toBe('Ticket creado')
  })

  // El ticket avanza cuando el documento EXISTE, no cuando se registró la intención: un envío que
  // falla dejaría al ticket diciendo "Remisión creada" sin PDF ni carpeta detrás.
  it('el desenlace confirmado lo mueve a "Remisión creada"; uno en error lo deja donde estaba', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionCallbackToken: 'cb' })
    const ticketId = await crearTicket(app, cookie)
    const remId = async () => (await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId, fecha: '2026-08-03', incluye: [] })).body.id
    const callback = (id: string, estado: string) => request(app).post(`/api/remisiones/${id}/callback`)
      .set('X-Remision-Callback', 'cb').send({ estado })

    const fallida = await remId()
    await callback(fallida, 'error')
    expect(await estadoDe(ticketId)).toBe('Ticket creado')

    const buena = await remId()
    await callback(buena, 'ok')
    expect(await estadoDe(ticketId)).toBe('Remisión creada')
  })

  it('anular la única remisión confirmada lo devuelve, y restaurarla lo vuelve a adelantar', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionCallbackToken: 'cb' })
    const ticketId = await crearTicket(app, cookie)
    const id = (await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId, fecha: '2026-08-03', incluye: [] })).body.id
    await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'cb').send({ estado: 'ok' })
    expect(await estadoDe(ticketId)).toBe('Remisión creada')

    await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie).send()
    expect(await estadoDe(ticketId)).toBe('Ticket creado')

    await request(app).post(`/api/remisiones/${id}/restaurar`).set('Cookie', cookie).send()
    expect(await estadoDe(ticketId)).toBe('Remisión creada')
  })

  // La decisión del usuario: los estados nuevos son de los tickets de la app. Un ticket de Zoho
  // conserva el suyo, porque moverlo lo marcaría `managed_by_app` y lo sacaría del sync sin pedirlo.
  it('un ticket venido de Zoho conserva "OV asignada" aunque su remisión se confirme', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query(`INSERT INTO tickets (id, number, status, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                    VALUES ('90210', 700, 'OV asignada', 'cli-e', 'Calibración', 'eq-e1', 'Grimm', 'EDM180C', '18A20070')`)
    const { app } = appWith({ remisionCallbackToken: 'cb' })
    const id = (await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: '90210', fecha: '2026-08-03', incluye: [] })).body.id
    await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'cb').send({ estado: 'ok' })
    expect(await estadoDe('90210')).toBe('OV asignada')
  })
})

describe('Catálogo maestro de equipos', () => {
  /** Alta por la API, que es el camino que se quiere probar. */
  async function altaBasica(app: ReturnType<typeof appWith>['app'], cookie: string) {
    const tipoId = (await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })).body.id
    const marcaId = (await request(app).post('/api/catalogo/marcas').set('Cookie', cookie).send({ nombre: 'Horiba' })).body.id
    const modeloId = (await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'APSA-370', tipoId })).body.id
    return { tipoId, marcaId, modeloId }
  }

  it('alta de tipo, marca y modelo; GET los devuelve con el tipo resuelto', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    expect(modeloId).toMatch(/^cmod-/)
    const c = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.body.modelos[0]).toMatchObject({ nombre: 'APSA-370', tipoNombre: 'Analizador de SO2' })
  })

  it('409 al repetir el nombre de un tipo', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })
    const dup = await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })
    expect(dup.status).toBe(409)
  })

  // Sin claves foráneas en el esquema, la ruta es la única red contra un modelo colgando de nada.
  it('422 si la marca o el tipo del modelo no existen', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { marcaId } = await altaBasica(app, cookie)
    const sinMarca = await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId: 'cmar-inventada', nombre: 'X' })
    expect(sinMarca.status).toBe(422)
    const sinTipo = await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'Y', tipoId: 'ctip-inventado' })
    expect(sinTipo.status).toBe(422)
  })

  it('409 al borrar un modelo en uso, con el conteo en el mensaje', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    await db.query("INSERT INTO equipos (id,serial,modelo_id) VALUES ('eq-u','A',$1)", [modeloId])
    const res = await request(app).delete(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('1')
  })

  it('PATCH del modelo fija el tipo y devuelve cuántos equipos discrepan', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    const otro = (await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Calibrador Multigas' })).body.id
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-d','A','Horiba','APSA-370','Analizador de SO2',$1)", [modeloId])
    const res = await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ tipoId: otro, corregirEquipos: true })
    expect(res.status).toBe(200)
    expect(res.body.discrepan).toBe(1)
    const eq = await db.query("SELECT tipo FROM equipos WHERE id='eq-d'")
    expect(eq.rows[0].tipo).toBe('Calibrador Multigas')
  })

  // `?incluir=` es lo que evita que editar un equipo con un modelo ya desactivado deje el campo en
  // blanco: sin el modelo en la lista, el desplegable no tendría cómo mostrar el valor actual.
  it('?incluir= trae un modelo desactivado que de otro modo no saldría en el listado', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ activo: false })

    const sinIncluir = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(sinIncluir.body.modelos.find((m: { id: string }) => m.id === modeloId)).toBeUndefined()

    const conIncluir = await request(app).get(`/api/catalogo?incluir=${modeloId}`).set('Cookie', cookie)
    expect(conIncluir.body.modelos.find((m: { id: string }) => m.id === modeloId)).toBeDefined()
  })

  // Esconder el botón no protege el dato: la frontera es el endpoint. Se comprueba en TODAS las
  // rutas de escritura, no en una de muestra.
  it('escribir exige super administrador; leer solo exige sesión', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const { marcaId, modeloId, tipoId } = await altaBasica(app, admin)
    const op = await userCookie(['Servicio Técnico'])

    // El método se resuelve con una cadena de ternarios (no un índice dinámico `obj[metodo]`) para no
    // necesitar `as any`: cada rama llama al método de supertest ya tipado.
    const escrituras: Array<['post' | 'patch' | 'delete', string, object]> = [
      ['post', '/api/catalogo/tipos', { nombre: 'X' }],
      ['post', '/api/catalogo/marcas', { nombre: 'Y' }],
      ['post', '/api/catalogo/modelos', { marcaId, nombre: 'Z', tipoId }],
      ['patch', `/api/catalogo/tipos/${tipoId}`, { nombre: 'W' }],
      ['patch', `/api/catalogo/marcas/${marcaId}`, { activo: false }],
      ['patch', `/api/catalogo/modelos/${modeloId}`, { activo: false }],
      ['delete', `/api/catalogo/modelos/${modeloId}`, {}],
    ]
    const pedir = (metodo: 'post' | 'patch' | 'delete', ruta: string, cuerpo: object, cookie?: string) => {
      const req = metodo === 'post' ? request(app).post(ruta) : metodo === 'patch' ? request(app).patch(ruta) : request(app).delete(ruta)
      return cookie ? req.set('Cookie', cookie).send(cuerpo) : req.send(cuerpo)
    }
    for (const [metodo, ruta, cuerpo] of escrituras) {
      const sinRol = await pedir(metodo, ruta, cuerpo, op)
      expect([metodo, ruta, sinRol.status]).toEqual([metodo, ruta, 403])
      const sinSesion = await pedir(metodo, ruta, cuerpo)
      expect([metodo, ruta, sinSesion.status]).toEqual([metodo, ruta, 401])
    }
    expect((await request(app).get('/api/catalogo').set('Cookie', op)).status).toBe(200)
    expect((await request(app).get('/api/catalogo')).status).toBe(401)
    expect((await request(app).get('/api/catalogo/conflictos').set('Cookie', op)).status).toBe(403)
  })

  // La siembra se dispara a mano UNA vez tras desplegar. Hasta que corre, el catálogo está vacío y
  // no se puede dar de alta ningún equipo, así que es el primer botón que toca alguien en producción.
  it('la siembra puebla el catálogo desde los equipos; 403 no-admin; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-s1','A','Horiba','APSA-370','Analizador de SO2')")
    const { app } = appWith()

    const res = await request(app).post('/api/admin/seed-catalogo').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ marcasCreadas: 1, tiposCreados: 1, modelosCreados: 1, equiposEnlazados: 1, modelosPorRevisar: 0 })
    expect((await request(app).get('/api/catalogo').set('Cookie', cookie)).body.modelos[0].nombre).toBe('APSA-370')

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/seed-catalogo').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/seed-catalogo')).status).toBe(401)
  })

  // Reejecutarla es el caso real: alguien la dispara dos veces por si acaso. Los deltas se agotan,
  // pero `modelosPorRevisar` tiene que seguir diciendo cuánto queda pendiente — si devolviera 0 se
  // leería como "no hay nada que revisar" justo cuando sí lo hay.
  it('reejecutar la siembra agota los deltas pero sigue contando lo que queda por revisar', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-a','A','Horiba','APSA-370','Analizador de SO2')")
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-b','B','Horiba','APSA-370','Calibrador Multigas')")
    const { app } = appWith()

    const primera = await request(app).post('/api/admin/seed-catalogo').set('Cookie', cookie)
    expect(primera.body).toMatchObject({ modelosCreados: 1, conflictosNuevos: 1, modelosPorRevisar: 1 })

    const segunda = await request(app).post('/api/admin/seed-catalogo').set('Cookie', cookie)
    expect(segunda.body).toMatchObject({ modelosCreados: 0, conflictosNuevos: 0, modelosPorRevisar: 1 })
  })
})
