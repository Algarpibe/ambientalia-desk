import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { upsertTicket, upsertAccount } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho, accountRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { upsertEquipo } from './db/equipos'
import { db, instalarArnes, equipoRow, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

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

  /**
   * La FECHA de la orden, no solo su número.
   *
   * Sin ella, «Habilitar Servicio» es un callejón: el campo de la orden llega bloqueado —el ticket ya
   * la trae— así que el buscador de órdenes no se pinta, y ese buscador es lo ÚNICO que rellena la
   * fecha. El de remisiones ya la capturaba (`routes/remision.ts:193`); el alta era la vía que no.
   */
  it('captura también la fecha de la orden de venta, para que Habilitar Servicio no la pida', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date) VALUES ('so1','OV-2026-200','cli1','2026-07-15')")
    const eq = await seedEquipo()
    const { app } = appWith()

    await request(app).post('/api/tickets').set('Cookie', cookie).send({
      salesOrderId: 'so1', equipoId: eq.id, tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio de mantenimiento', prefijo: 'MT',
    })

    const t = (await db.query("SELECT fecha_orden_venta FROM tickets WHERE salesorder_id='so1'")).rows[0]
    // `date` vuelve como Date; la suite corre en UTC, así que el ISO no corre de día.
    expect((t.fecha_orden_venta as Date).toISOString().slice(0, 10)).toBe('2026-07-15')
  })

  // Una orden tecleada a mano no viene de Books y no tiene fecha que traer: no se inventa ninguna.
  it('sin orden de Books no inventa fecha', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli2','Camposol')")
    const eq = await seedEquipo()
    const { app } = appWith()

    await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli2', equipoId: eq.id, tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo', prefijo: 'CG', ordenVenta: 'manual-1',
    })

    const t = (await db.query("SELECT fecha_orden_venta FROM tickets WHERE orden_venta='manual-1'")).rows[0]
    expect(t.fecha_orden_venta).toBeNull()
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

describe('DELETE /api/tickets/:id (admin)', () => {
  const sembrar = async (id: string, numero: number) => {
    await db.query('INSERT INTO tickets (id, number, status, managed_by_app) VALUES ($1,$2,$3,true)', [id, numero, 'Ingresado'])
    await db.query('INSERT INTO ticket_transitions (ticket_id, transition_name, from_status, to_status, performed_by) VALUES ($1,$2,$3,$4,$5)',
      [id, 'Habilitar', 'Ticket creado', 'Ingresado', 'Admin'])
  }
  const existe = async (id: string) =>
    Number(((await db.query('SELECT COUNT(*)::int AS n FROM tickets WHERE id=$1', [id])).rows[0] as { n: number }).n) === 1

  it('dryRun enseña lo que se iría sin borrarlo; sin él borra de verdad', async () => {
    const cookie = await adminCookie()
    await sembrar('app-1', 10000)
    const { app } = appWith()

    const seco = await request(app).delete('/api/tickets/app-1?dryRun=true').set('Cookie', cookie)
    expect(seco.status).toBe(200)
    expect(seco.body.dryRun).toBe(true)
    expect(seco.body.ticket).toMatchObject({ numero: 10000 })
    expect(seco.body.filas).toHaveLength(10)
    expect(await existe('app-1')).toBe(true)

    const real = await request(app).delete('/api/tickets/app-1').set('Cookie', cookie)
    expect(real.status).toBe(200)
    expect(real.body).toEqual({ ...seco.body, dryRun: false })
    expect(await existe('app-1')).toBe(false)
  })

  // El caso que justifica el 409: borrarlo aquí solo lo haría volver en la siguiente sincronización.
  it('un ticket de Zoho da 409 y sigue vivo, sin pedirlo a Zoho', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('12345', 987, 'Ingresado', true)")
    const { app, sync } = appWith()

    const res = await request(app).delete('/api/tickets/12345').set('Cookie', cookie)
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/sincronizaci/i)
    expect(await existe('12345')).toBe(true)
    expect(sync.syncTicket).not.toHaveBeenCalled()
  })

  it('404 si no existe, y no lo pide a Zoho para poder borrarlo', async () => {
    const cookie = await adminCookie()
    const { app, sync } = appWith()
    expect((await request(app).delete('/api/tickets/app-inventado').set('Cookie', cookie)).status).toBe(404)
    expect(sync.syncTicket).not.toHaveBeenCalled()
  })

  it('403 al no administrador (y el ticket sigue vivo); 401 sin sesión', async () => {
    await sembrar('app-1', 10000)
    const op = await userCookie(['Servicio Técnico'])
    const { app } = appWith()

    expect((await request(app).delete('/api/tickets/app-1').set('Cookie', op)).status).toBe(403)
    expect(await existe('app-1')).toBe(true)
    expect((await request(app).delete('/api/tickets/app-1')).status).toBe(401)
  })
})

/**
 * El barrido que trae de Zoho la historia de los tickets antiguos. Lo que se comprueba aquí es la
 * FORMA de la ruta, no el barrido —ése tiene sus tests en `sync.historyBackfill.test.ts`—: que el
 * conteo responde esperando y el barrido no, que es la diferencia que evita una petición colgada
 * varios minutos.
 */
