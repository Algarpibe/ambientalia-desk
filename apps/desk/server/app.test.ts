import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertTicket, upsertAccount, getTicketRow } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho, accountRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { upsertEquipo } from './db/equipos'
import { REMISIONES_HISTORICAS } from './db/remisionesHistoricasSeed'
import { createApp } from './app'
import { clearAnalisisCache } from './analisis'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { RemisionListado } from '@ambientalia/shared'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { createRole, actualizarRecibeAvisos } from './auth/roles'
import { listarAvisos } from './db/avisos'
import { db, instalarArnes, equipoRow, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * La lista de personas a las que se puede derivar un ticket. Vive aparte de `/api/users` a propósito:
 * derivar lo hace CUALQUIERA que ejecute una transición, no solo un administrador, y `/api/users`
 * publica correo, rol y áreas —el modelo de autorización entero— además de los usuarios dados de baja.
 */

describe('GET /api/personas', () => {
  it('sin sesión responde 401', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/personas')).status).toBe(401)
  })

  it('un usuario NO administrador puede pedirla', async () => {
    const cookie = await userCookie(['Servicio Técnico'])
    const { app } = appWith()
    const res = await request(app).get('/api/personas').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: expect.any(String), nombre: 'Op', cargo: null }])
  })

  // Derivar a alguien que ya no trabaja aquí es una vía muerta: el ticket queda con un responsable
  // que nunca lo va a abrir.
  it('no ofrece a los usuarios dados de baja', async () => {
    const cookie = await adminCookie()
    const baja = await createUser(db, { email: 'baja@x.co', name: 'Baja', passwordHash: await hashPassword('password123') })
    await db.query('UPDATE users SET active = false WHERE id = $1', [baja.id])
    const { app } = appWith()

    const res = await request(app).get('/api/personas').set('Cookie', cookie)
    expect(res.body.map((p: { nombre: string }) => p.nombre)).toEqual(['Admin'])
  })

  /**
   * La aserción que impide el atajo de reutilizar `listUsers`: sería una línea, funcionaría, y
   * publicaría a todo el mundo quién es administrador y qué áreas tiene cada rol.
   */
  it('no publica correo, áreas ni si es administrador', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app } = appWith()
    const res = await request(app).get('/api/personas').set('Cookie', cookie)
    expect(Object.keys(res.body[0]).sort()).toEqual(['cargo', 'id', 'nombre'])
  })
})

/**
 * Derivar el ticket a una persona en cualquier etapa. Es opcional, así que la etapa tiene que poder
 * ejecutarse sin ella; y es una FK de hecho contra `users`, así que el servidor la valida.
 */

describe('derivación en las transiciones', () => {
  async function ticketEnFaseInicial() {
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")
  }

  it('guarda la derivación en su columna y en el histórico de la transición', async () => {
    const cookie = await adminCookie()
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: await hashPassword('password123') })
    await ticketEnFaseInicial()
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
    expect(res.status).toBe(200)

    const t = await db.query('SELECT derivado_a FROM tickets WHERE id = $1', ['t1'])
    expect((t.rows[0] as { derivado_a: string }).derivado_a).toBe(dest.id)
    // La cadena de derivaciones no necesita tabla propia: `values` ya la guarda etapa a etapa.
    const tr = await db.query("SELECT values FROM ticket_transitions WHERE ticket_id='t1'")
    expect((tr.rows[0] as { values: Record<string, unknown> }).values.derivado_a).toBe(dest.id)
  })

  /**
   * La ida y vuelta completa: sin que el ticket DEVUELVA su derivación, la etapa siguiente abriría la
   * casilla en blanco y confirmarla borraría al responsable. Es lo que hace que «se puede cambiar en
   * cada etapa» funcione de verdad y no solo sobre el papel.
   */
  it('el ticket devuelve a quién está derivado, con su cargo', async () => {
    const cookie = await adminCookie()
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Johny Luna', passwordHash: await hashPassword('password123') })
    await db.query("UPDATE users SET cargo = 'Director Técnico' WHERE id = $1", [dest.id])
    await ticketEnFaseInicial()
    const { app } = appWith()

    await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })

    const res = await request(app).get('/api/tickets/t1').set('Cookie', cookie)
    // Las iniciales las calcula el servidor con el mismo `initialsOf` del propietario de Zoho, para
    // que los dos avatares se vean igual.
    expect(res.body.derivado).toEqual({ id: dest.id, nombre: 'Johny Luna', cargo: 'Director Técnico', initials: 'JL' })
    // Y no se confunde con el propietario de Zoho, que en un ticket de la app no existe.
    expect(res.body.ownerName).toBeUndefined()
  })

  /**
   * El ticket lleva encima cuándo se escaló a revisión, que es lo que la pantalla propone como «Fecha
   * Revisión Informe» dos etapas más adelante. Va en el detalle y no se calcula en el navegador porque
   * el dato vive en `ticket_transitions`, y pedir el historial entero para sacar una fecha sería
   * traerse el relato completo del ticket en cada apertura del formulario.
   */
  it('el detalle lleva la fecha del último escalado a revisión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Notificado')")
    for (const [tid, cuando] of [
      ['escalado_a_revision', '2026-08-01T15:00:00.000Z'],
      ['escalado_a_revision', '2026-08-09T15:00:00.000Z'],
    ]) {
      await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, performed_at) VALUES ($1,$2,$3)',
        ['t1', tid, new Date(cuando)])
    }
    const { app } = appWith()

    const res = await request(app).get('/api/tickets/t1').set('Cookie', cookie)
    // La ÚLTIMA: si volvió a corrección y se re-escaló, la revisión que vale es la de después.
    expect(res.body.escaladoARevisionAt).toBe('2026-08-09T15:00:00.000Z')
  })

  // Un ticket que nunca pasó por revisión no puede inventarse la fecha: se deja vacía y se teclea.
  it('sin escalado a revisión, el detalle no trae fecha', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const { app } = appWith()

    const res = await request(app).get('/api/tickets/t1').set('Cookie', cookie)
    expect(res.body.escaladoARevisionAt).toBeNull()
  })

  /**
   * El detalle también lleva a quién se derivó PRIMERO, que es a quien «Aprobación» devuelve el
   * trabajo: para entonces el ticket viene derivado a Comercial —quien acaba de aprobar— y sin esto se
   * quedaría en la mesa equivocada.
   */
  it('el detalle lleva al primer derivado del ticket', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Notificación cliente')")
    for (const [cuando, values] of [
      ['2026-08-01T15:00:00.000Z', { orden_venta: 'OV-1' }],
      ['2026-08-03T15:00:00.000Z', { derivado_a: 'u-tecnico' }],
      ['2026-08-07T15:00:00.000Z', { derivado_a: 'u-comercial' }],
    ] as Array<[string, Record<string, unknown>]>) {
      await db.query('INSERT INTO ticket_transitions (ticket_id, values, performed_at) VALUES ($1,$2,$3)',
        ['t1', JSON.stringify(values), new Date(cuando)])
    }
    const { app } = appWith()

    const res = await request(app).get('/api/tickets/t1').set('Cookie', cookie)
    expect(res.body.primerDerivado).toBe('u-tecnico')
  })

  // El tablero y la tabla necesitan el dato en la LISTA, no solo en el detalle: son consultas
  // distintas y es fácil añadir el join en una y olvidarlo en las otras tres.
  it('la lista de tickets también trae la derivación', async () => {
    const cookie = await adminCookie()
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Johny Luna', passwordHash: await hashPassword('password123') })
    await ticketEnFaseInicial()
    await db.query('UPDATE tickets SET derivado_a = $1 WHERE id = $2', [dest.id, 't1'])
    const { app } = appWith()

    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.body[0].derivado).toMatchObject({ nombre: 'Johny Luna', initials: 'JL' })
  })

  // Sin `LEFT JOIN`, un `INNER JOIN` haría desaparecer del tablero todos los tickets sin derivar,
  // que hoy son casi todos.
  it('un ticket sin derivar sigue apareciendo en la lista', async () => {
    const cookie = await adminCookie()
    await ticketEnFaseInicial()
    const { app } = appWith()

    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].derivado).toBeNull()
  })

  /**
   * ⚠️ BARRERA DE ARQUITECTURA, no una comprobación de rutina.
   *
   * `docs/modelo-autorizacion.md` decidió expresamente que NO hay propiedad por ticket ni
   * segmentación de visibilidad: el equipo se cubre entre sí y necesita ver el panorama completo. La
   * derivación dice de quién es el TRABAJO, nunca quién puede VER el ticket.
   *
   * Es una «mejora» facilísima de colar —un `AND derivado_a = $usuario` en `getActiveTickets` parece
   * lo obvio— y rompería el modelo sin que nada fallara. Este test existe para que falle.
   */
  it('la derivación NO oculta el ticket a los demás', async () => {
    const otro = await createUser(db, { email: 'otro@x.co', name: 'Otro', passwordHash: await hashPassword('password123') })
    const cookie = await userCookie(['Servicio Técnico'])
    await ticketEnFaseInicial()
    await db.query('UPDATE tickets SET derivado_a = $1 WHERE id = $2', [otro.id, 't1'])
    const { app } = appWith()

    // Lo ve en la lista aunque esté derivado a otra persona…
    expect((await request(app).get('/api/tickets').set('Cookie', cookie)).body).toHaveLength(1)
    // …y puede abrirlo.
    expect((await request(app).get('/api/tickets/t1').set('Cookie', cookie)).status).toBe(200)
  })

  /**
   * El aviso de punta a punta. Lo que hay que ver es que llega a SU destinatario y a nadie más: la
   * campana es lo único de la app que enseña algo distinto a cada persona.
   */
  it('derivar avisa al destinatario, y solo a él', async () => {
    const cookieAdmin = await adminCookie()
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Johny Luna', passwordHash: await hashPassword('password123') })
    const cookieDest = `sid=${await createSession(db, dest.id)}`
    const cookieTercero = await userCookie(['Comercial'])
    await ticketEnFaseInicial()
    const { app } = appWith()

    await request(app).post('/api/tickets/t1/transition').set('Cookie', cookieAdmin)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })

    const suyos = await request(app).get('/api/avisos').set('Cookie', cookieDest)
    expect(suyos.body).toHaveLength(1)
    expect(suyos.body[0]).toMatchObject({ ticketId: 't1', leido: false })
    expect(suyos.body[0].texto).toBe('Admin te derivó el ticket #10000 en «Habilitar Servicio»')

    expect((await request(app).get('/api/avisos').set('Cookie', cookieTercero)).body).toEqual([])

    // Y se puede marcar leído, que es lo que apaga la campana.
    expect((await request(app).post('/api/avisos/leidos').set('Cookie', cookieDest).send({ ids: [suyos.body[0].id] })).status).toBe(204)
    expect((await request(app).get('/api/avisos').set('Cookie', cookieDest)).body[0].leido).toBe(true)
  })

  // La casilla llega prellenada en cada etapa: sin la regla del cambio, confirmar varias transiciones
  // seguidas le mandaría el mismo aviso a la misma persona una y otra vez.
  it('repetir la derivación en la etapa siguiente no vuelve a avisar', async () => {
    const cookieAdmin = await adminCookie()
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Johny Luna', passwordHash: await hashPassword('password123') })
    const cookieDest = `sid=${await createSession(db, dest.id)}`
    await ticketEnFaseInicial()
    const { app } = appWith()

    await request(app).post('/api/tickets/t1/transition').set('Cookie', cookieAdmin)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
    // Siguiente etapa, misma persona: es lo que hace el formulario al llegar prellenado.
    await request(app).post('/api/tickets/t1/transition').set('Cookie', cookieAdmin)
      .send({ transitionId: 'ingreso_a_servicio', values: { comment: 'x', 'Código Servicio': 'CG_1', 'Fecha creación ticket': '2026-08-01', 'Fecha Remisión Entrada': '2026-08-02', derivado_a: dest.id } })

    expect((await request(app).get('/api/avisos').set('Cookie', cookieDest)).body).toHaveLength(1)
  })

  it('la etapa se ejecuta igual sin derivar a nadie', async () => {
    const cookie = await adminCookie()
    await ticketEnFaseInicial()
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1' } })
    expect(res.status).toBe(200)
    const t = await db.query('SELECT derivado_a FROM tickets WHERE id = $1', ['t1'])
    expect((t.rows[0] as { derivado_a: string | null }).derivado_a).toBeNull()
  })

  /**
   * El navegador manda un id, y un id no comprobado es una FK rota: el ticket quedaría apuntando a
   * alguien que no existe y la ficha no sabría a quién enseñar. Un usuario dado de baja se rechaza por
   * lo mismo que no sale en el desplegable — nunca va a abrir ese ticket.
   */
  it('rechaza derivar a alguien que no existe o que está dado de baja', async () => {
    const cookie = await adminCookie()
    const baja = await createUser(db, { email: 'baja@x.co', name: 'Baja', passwordHash: await hashPassword('password123') })
    await db.query('UPDATE users SET active = false WHERE id = $1', [baja.id])
    await ticketEnFaseInicial()
    const { app } = appWith()
    const enviar = (derivado_a: string) => request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a } })

    expect((await enviar('no-existe')).status).toBe(422)
    expect((await enviar(baja.id)).status).toBe(422)
    // Y el ticket no se movió: la transición entera se rechaza, no a medias.
    const t = await db.query('SELECT status FROM tickets WHERE id = $1', ['t1'])
    expect((t.rows[0] as { status: string }).status).toBe('Ticket creado')
  })
})

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
    const sync = { backfillTickets: vi.fn(), backfillArchivedTickets: vi.fn().mockResolvedValue(0), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn(), syncActivities: vi.fn(), syncTicketHistory: vi.fn(), backfillTicketHistory: vi.fn(), syncContacts: vi.fn() } as any
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

describe('Límite de subida', () => {
  // A propósito NO se deriva de la constante del servidor: si el test leyera el mismo número que el
  // código, cambiarlo nunca rompería nada. Aquí "11 MB" es el dato de entrada, y "10 MB" el contrato.
  const demasiadoGrande = () => Buffer.alloc(11 * 1024 * 1024)

  it('ficha técnica: por encima del límite responde 413 diciendo cuál es el límite', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/catalogo/modelos/m1/documentos').set('Cookie', cookie)
      .field('tipo', 'manual').field('nombre', 'Manual')
      .attach('archivo', demasiadoGrande(), { filename: 'manual.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(413)
    expect(res.body.error).toContain('10 MB')
  })

  // Las otras dos puertas comparten el mismo multer y el mismo manejador: si el arreglo fuera un parche
  // por ruta, estas dos seguirían en 500. Por eso se prueban las tres y no solo la que motivó el cambio.
  it('fotos de remisión: por encima del límite responde 413', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/remisiones/r1/fotos').set('Cookie', cookie)
      .attach('file', demasiadoGrande(), { filename: 'equipo.png', contentType: 'image/png' })
    expect(res.status).toBe(413)
    expect(res.body.error).toContain('10 MB')
  })

  it('adjuntos de resolución: por encima del límite responde 413', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie)
      .attach('file', demasiadoGrande(), { filename: 'a.png', contentType: 'image/png' })
    expect(res.status).toBe(413)
    expect(res.body.error).toContain('10 MB')
  })

  // El nombre del campo no es el mismo en las tres rutas ('archivo' en el catálogo, 'file' en las otras),
  // así que equivocarlo es un error real y frecuente. Es culpa del cliente: 400, no el 500 de antes.
  it('un campo de fichero inesperado responde 400, no 500', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie)
      .attach('campo-que-no-espera', Buffer.from('hola'), { filename: 'a.png', contentType: 'image/png' })
    expect(res.status).toBe(400)
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

  /**
   * FASE 2, de punta a punta: con el equipo enlazado a un modelo del catálogo, el checklist sale de la
   * lista de ACCESORIOS de ese modelo y ya no del perfil. Es lo que separa a un APMA de un APSA, que
   * compartían perfil y por tanto lista.
   *
   * El perfil se siembra a propósito con un ítem distinto: si apareciera en la respuesta, la
   * conmutación no habría ocurrido y el resto de tests no lo notaría —los suyos no enlazan modelo—.
   */
  it('con el equipo enlazado a un modelo, el checklist sale de sus accesorios y no del perfil', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-r1', '18A20070'))
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Del perfil viejo',0)")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query(`INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre,orden) VALUES
      ('art-1','cmod-1','accesorio','Sensor 157-L',0),
      ('art-2','cmod-1','accesorio','Cable RJ45',1),
      ('art-3','cmod-1','consumible_repuesto','Filtro PM10',0)`)
    await db.query("UPDATE equipos SET modelo_id='cmod-1' WHERE id='eq-r1'")
    await conTicket('eq-r1')
    const { app } = appWith()

    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.body.origenChecklist).toBe('modelo')
    // En el orden de la ficha, y sin el consumible: «Incluye» es lo que ACOMPAÑA al equipo.
    expect(res.body.incluye).toEqual(['Sensor 157-L', 'Cable RJ45'])

    // Y la puerta de creación valida contra la MISMA fuente. Si leyeran de sitios distintos, lo que el
    // técnico ve marcable dejaría de ser lo que el servidor acepta.
    const viejo = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-11', incluye: ['Del perfil viejo'] })
    expect(viejo.status).toBe(422)
    const nuevo = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-11', incluye: ['Cable RJ45'] })
    expect(nuevo.status).toBe(201)
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

  /**
   * La transición a «Remisión creada» la escribe el CALLBACK de n8n, que no tiene sesión —n8n no manda
   * la cookie—. Firmarla con el marcador `TRANSITION_ACTOR` ponía «Equipo Técnico» en el hilo de un
   * ticket que había llevado una sola persona de principio a fin, y esa firma parece un usuario que
   * nunca intervino. El autor correcto ya está guardado en la propia remisión.
   */
  it('la transición del callback la firma quien creó la remisión, no el marcador', async () => {
    const cookie = await adminCookie(); await preparar()
    // `preparar()` deja el ticket en «OV asignada», el nombre de Zoho, y esa fase no entra nunca en la
    // sincronización: moverla marcaría el ticket como gestionado por la app. Solo avanzan los nacidos
    // aquí, que es el caso que este test reproduce.
    await db.query("UPDATE tickets SET status='Ticket creado' WHERE id='t1'")
    const { app } = appWith({ remisionCallbackToken: 'secreto-cb' })
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })

    await request(app).post(`/api/remisiones/${rem.body.id}/callback`)
      .set('X-Remision-Callback', 'secreto-cb').send({ estado: 'ok' })

    const tr = await db.query(
      "SELECT performed_by FROM ticket_transitions WHERE ticket_id='t1' AND to_status='Remisión creada'",
    )
    expect(tr.rows).toHaveLength(1)
    expect((tr.rows[0] as { performed_by: string }).performed_by).toBe('Admin')
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

// Los artículos salen de `books.items`, replicada del hub. Alimenta la validación del SKU de la ficha
// técnica y, más adelante, la elección de accesorios/consumibles/repuestos por modelo.

describe('GET /api/articulos (Books)', () => {
  const articulo = (id: string, nombre: string, sku: string, categoria: string, status = 'active') =>
    db.query('INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ($1,$2,$3,$4,$5)', [id, nombre, sku, categoria, status])

  it('busca por SKU y por nombre, y devuelve la categoría', async () => {
    const cookie = await adminCookie()
    await articulo('i1', 'Filtro PM10', 'F-001', 'C&R EDM 180')
    await articulo('i2', 'Bomba de vacío', 'B-002', 'C&R AP Series')
    const { app } = appWith()

    const porSku = await request(app).get('/api/articulos?search=F-001').set('Cookie', cookie)
    expect(porSku.status).toBe(200)
    expect(porSku.body).toEqual([{ id: 'i1', sku: 'F-001', nombre: 'Filtro PM10', categoria: 'C&R EDM 180' }])

    const porNombre = await request(app).get('/api/articulos?search=bomba').set('Cookie', cookie)
    expect(porNombre.body.map((a: { sku: string }) => a.sku)).toEqual(['B-002'])
  })

  // Un artículo retirado en Books no debe ofrecerse para elegir: sería proponer algo que ya no se vende.
  it('no ofrece artículos inactivos', async () => {
    const cookie = await adminCookie()
    await articulo('i-viejo', 'Filtro descatalogado', 'F-OLD', 'C&R EDM 180', 'inactive')
    const { app } = appWith()

    expect((await request(app).get('/api/articulos?search=F-OLD').set('Cookie', cookie)).body).toEqual([])
  })

  it('GET /api/articulos sin sesión → 401', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/articulos?search=x')).status).toBe(401)
  })

  /**
   * El SKU de la ficha era una cadena que alguien tecleaba y no se contrastaba con nada. Ahora la ficha
   * dice **a qué artículo corresponde**, y la pantalla puede enseñarlo o avisar de que no existe.
   *
   * Se resuelve en el servidor y no en el navegador para que la comparación exacta —incluido el no
   * distinguir mayúsculas— viva en un solo sitio.
   */
  it('la ficha del modelo resuelve el artículo de su SKU, o null si ninguno lo lleva', async () => {
    const cookie = await adminCookie()
    await articulo('i1', 'Filtro PM10', 'F-001', 'C&R EDM 180')
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('cmod-1','cmar-1','EDM180C','f-001')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('cmod-2','cmar-1','EDM180D','NO-EXISTE')")
    const { app } = appWith()

    // El SKU se guardó en minúsculas y el artículo lo tiene en mayúsculas: debe casar igual.
    const casa = await request(app).get('/api/catalogo/modelos/cmod-1/ficha').set('Cookie', cookie)
    expect(casa.status).toBe(200)
    expect(casa.body.skuArticulo).toEqual({ id: 'i1', sku: 'F-001', nombre: 'Filtro PM10', categoria: 'C&R EDM 180' })

    const noCasa = await request(app).get('/api/catalogo/modelos/cmod-2/ficha').set('Cookie', cookie)
    expect(noCasa.body.sku).toBe('NO-EXISTE')
    expect(noCasa.body.skuArticulo).toBeNull()
  })
})

describe('Artículos por modelo (accesorios / consumibles / repuestos)', () => {
  const prepararModelo = async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1','Filtro PM10','F-001','C&R EDM 180','active')")
  }

  /**
   * Misma regla que el alta de equipos desde el catálogo: lo que identifica al artículo lo escribe el
   * SERVIDOR leyéndolo de Books, no el navegador. Si el nombre viajara desde el cliente, el mismo
   * artículo acabaría con dos grafías y volveríamos al problema que Books viene a resolver.
   */
  it('el alta desde Books toma sku y nombre del artículo, ignorando lo que mande el navegador', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()

    const res = await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
      .send({ clase: 'consumible_repuesto', itemId: 'i1', sku: 'INVENTADO', nombre: 'Nombre inventado' })
    expect(res.status).toBe(201)

    const lista = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(lista.body).toEqual([
      { id: expect.any(String), clase: 'consumible_repuesto', origen: 'manual', itemId: 'i1', sku: 'F-001', nombre: 'Filtro PM10', orden: 0, activo: true },
    ])
  })

  /**
   * El corazón del rediseño: el modelo guarda las CATEGORÍAS que le aplican y la lista se deriva de
   * Books. Un APMA-370 lleva `Opcional AP Series` de accesorios y `C&R AP Series` + `C&R APMA-370` de
   * consumibles/repuestos — la de la serie y la del modelo, sumadas.
   */
  it('asigna categorías de consumibles y repuestos, y deriva de ellas la lista', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i2','Maletín','M-1','Opcional AP Series','active')")
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i3','Filtro de serie','S-1','C&R AP Series','active')")
    const { app } = appWith()
    const asignar = (clase: string, categoria: string) =>
      request(app).post('/api/catalogo/modelos/cmod-1/categorias').set('Cookie', cookie).send({ clase, categoria })

    // La vía de bloque queda solo para consumibles y repuestos: accesorios y mano de obra se eligen
    // artículo a artículo, y la puerta se cierra en el SERVIDOR, no solo escondiendo el desplegable.
    expect((await asignar('accesorio', 'Opcional AP Series')).status).toBe(422)
    expect((await asignar('mano_obra', 'Opcional AP Series')).status).toBe(422)
    expect((await asignar('consumible_repuesto', 'C&R AP Series')).status).toBe(201)
    expect((await asignar('consumible_repuesto', 'C&R AP Series')).status).toBe(409) // repetida

    const cats = await request(app).get('/api/catalogo/modelos/cmod-1/categorias').set('Cookie', cookie)
    expect(cats.body).toEqual([
      { id: expect.any(String), clase: 'consumible_repuesto', categoria: 'C&R AP Series', articulos: 1 },
    ])

    // El maletín NO entra: su categoría no llegó a asignarse, así que no lo deriva nadie.
    const lista = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(lista.body.map((a: { sku: string; origen: string }) => [a.sku, a.origen])).toEqual([['S-1', 'categoria']])

    // Quitar la categoría retira sus artículos: no hay que borrarlos uno a uno.
    expect((await request(app).delete(`/api/catalogo/categorias/${cats.body[0].id}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)).body).toEqual([])
  })

  // El selector necesita saber qué categorías existen. Se ofrecen TODAS, no solo las de prefijo `C&R`
  // y `Opcional`: hay artículos relevantes en `Accesorios`, `Meteorología` o `Kunak Air Series`.
  it('lista las categorías disponibles de Books con su conteo', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i2','Tubo','T-1','Accesorios','active')")
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i3','Viejo','V-1','Accesorios','inactive')")
    const { app } = appWith()

    const res = await request(app).get('/api/articulos/categorias').set('Cookie', cookie)
    expect(res.status).toBe(200)
    // Solo cuenta los activos, que son los que la lista derivada acabará mostrando.
    expect(res.body).toEqual([
      { categoria: 'Accesorios', articulos: 1 },
      { categoria: 'C&R EDM 180', articulos: 1 },
    ])
  })

  it('acepta ítems de texto libre, que son los que no tienen artículo en Books', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()

    expect((await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
      .send({ clase: 'accesorio', nombre: 'Manuales' })).status).toBe(201)

    const lista = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(lista.body[0]).toMatchObject({ clase: 'accesorio', nombre: 'Manuales' })
    expect(lista.body[0].itemId).toBeUndefined()
  })

  it('rechaza clase desconocida, nombre vacío, artículo inexistente y repetido', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()
    const alta = (body: Record<string, unknown>) =>
      request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie).send(body)

    expect((await alta({ clase: 'inventada', nombre: 'X' })).status).toBe(422)
    expect((await alta({ clase: 'accesorio', nombre: '   ' })).status).toBe(422)
    expect((await alta({ clase: 'consumible_repuesto', itemId: 'no-existe' })).status).toBe(422)
    expect((await alta({ clase: 'accesorio', nombre: 'Manuales' })).status).toBe(201)
    expect((await alta({ clase: 'accesorio', nombre: 'Manuales' })).status).toBe(409)
  })

  it('mueve de clase, desactiva y borra; 404 si el modelo no existe', async () => {
    const cookie = await adminCookie()
    await prepararModelo()
    const { app } = appWith()
    const creado = await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
      .send({ clase: 'consumible_repuesto', itemId: 'i1' })
    const id = creado.body.id

    expect((await request(app).patch(`/api/catalogo/articulos/${id}`).set('Cookie', cookie).send({ clase: 'accesorio', activo: false })).status).toBe(200)
    const tras = await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)
    expect(tras.body[0]).toMatchObject({ clase: 'accesorio', activo: false })

    expect((await request(app).delete(`/api/catalogo/articulos/${id}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', cookie)).body).toEqual([])

    expect((await request(app).get('/api/catalogo/modelos/no-existe/articulos').set('Cookie', cookie)).status).toBe(404)
  })

  // Leer lo necesita el técnico que prepara una remisión; administrar la lista es otra cosa.
  it('leer exige sesión; escribir exige super administrador', async () => {
    const admin = await adminCookie()
    await prepararModelo()
    const op = await userCookie([])
    const { app } = appWith()

    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos')).status).toBe(401)
    expect((await request(app).get('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', op)).status).toBe(200)
    expect((await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', op).send({ clase: 'accesorio', nombre: 'X' })).status).toBe(403)
    expect((await request(app).post('/api/catalogo/modelos/cmod-1/articulos').set('Cookie', admin).send({ clase: 'accesorio', nombre: 'X' })).status).toBe(201)
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

// El paso que de verdad enciende la pestaña HOJA DE VIDA del histórico: el serial suelto no basta,
// hace falta el `equipo_id`. Los dos backfills se disparan en orden desde la misma consola.

describe('POST /api/admin/backfill-equipo-id (admin)', () => {
  it('enlaza lo inequívoco y reparte el resto por motivo; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO equipos (id,serial,marca) VALUES ('eq-x','18A19042','Grimm')")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app,serial) VALUES ('e1',1,'S','Finalizado',false,'18A19042')")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app,serial) VALUES ('e2',2,'S','Finalizado',false,'NO-EXISTE')")
    const { app } = appWith()

    const res = await request(app).post('/api/admin/backfill-equipo-id').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ enlazados: 1, sinEquipo: 1 })
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='e1'")).rows[0].equipo_id).toBe('eq-x')

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-equipo-id').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-equipo-id')).status).toBe(401)
  })
})

// Cierra el otro hueco de la carga inicial: los equipos traían el cliente como texto libre y sin
// `client_id`. `?dryRun=true` existe para mirar las cifras antes de tocar ~352 filas de producción.

describe('POST /api/admin/backfill-client-id (admin)', () => {
  it('enlaza lo inequívoco y devuelve los pendientes; dryRun no escribe; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO equipos (id,serial,marca,cliente_nombre) VALUES ('eq-1','S1','Grimm','GECELCA')")
    await db.query("INSERT INTO equipos (id,serial,marca,cliente_nombre) VALUES ('eq-2','S2','Grimm','Cliente Fantasma')")
    const { app } = appWith()

    const seco = await request(app).post('/api/admin/backfill-client-id?dryRun=true').set('Cookie', admin)
    expect(seco.status).toBe(200)
    expect(seco.body).toMatchObject({ enlazados: 1, sinCliente: 1 })
    expect((await db.query("SELECT client_id FROM equipos WHERE id='eq-1'")).rows[0].client_id).toBeNull()

    const res = await request(app).post('/api/admin/backfill-client-id').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ enlazados: 1, sinCliente: 1 })
    expect(res.body.pendientes).toEqual([
      { id: 'eq-2', serial: 'S2', clienteNombre: 'Cliente Fantasma', motivo: 'sin-cliente' },
    ])
    expect((await db.query("SELECT client_id FROM equipos WHERE id='eq-1'")).rows[0].client_id).toBe('cli1')

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-client-id').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-client-id')).status).toBe(401)
  })
})

// Convierte ~700 filas de tecleo en revisión: copia a cada modelo el checklist del perfil que hoy le
// aplica. Se dispara a mano una vez, como el resto de siembras.

describe('POST /api/admin/seed-articulos (admin)', () => {
  it('siembra los accesorios por modelo; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0)")
    const { app } = appWith()

    const res = await request(app).post('/api/admin/seed-articulos').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ modelos: 1, insertados: 1, existentes: 0 })

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/seed-articulos').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/seed-articulos')).status).toBe(401)
  })
})

// Retira las copias de texto libre que dejó la siembra, obsoletas desde que la lista se deriva de las
// categorías de Books. `?dryRun=true` devuelve el detalle completo, que es la copia de seguridad.

describe('POST /api/admin/limpiar-articulos-sembrados (admin)', () => {
  it('dryRun lista sin borrar; sin él borra; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Datalogger',0)")
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre) VALUES ('a1','cmod-1','accesorio','Datalogger')")
    const { app } = appWith()

    const seco = await request(app).post('/api/admin/limpiar-articulos-sembrados?dryRun=true').set('Cookie', admin)
    expect(seco.status).toBe(200)
    expect(seco.body).toMatchObject({ borrados: 1, detalle: [{ modelo: 'Grimm EDM180C', articulos: ['Datalogger'] }] })
    expect((await db.query('SELECT count(*)::int AS n FROM catalogo_articulos')).rows[0].n).toBe(1)

    expect((await request(app).post('/api/admin/limpiar-articulos-sembrados').set('Cookie', admin)).body).toMatchObject({ borrados: 1 })
    expect((await db.query('SELECT count(*)::int AS n FROM catalogo_articulos')).rows[0].n).toBe(0)

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/limpiar-articulos-sembrados').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/limpiar-articulos-sembrados')).status).toBe(401)
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

  /** Modelo listo para colgarle ficha. Devuelve su id. */
  async function modeloParaFicha(app: ReturnType<typeof appWith>['app'], cookie: string): Promise<string> {
    const marcaId = (await request(app).post('/api/catalogo/marcas').set('Cookie', cookie).send({ nombre: 'Horiba' })).body.id
    return (await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'APSA-370' })).body.id
  }

  it('alta de enlace y de fichero; la ficha los devuelve y el proxy sirve el fichero', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)

    const enlace = await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'Manual de usuario', url: 'https://ejemplo/m.pdf' })
    expect(enlace.status).toBe(201)

    const subida = await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .field('tipo', 'foto').field('nombre', 'Vista frontal')
      .attach('archivo', Buffer.from('imagen'), { filename: 'f.png', contentType: 'image/png' })
    expect(subida.status).toBe(201)

    const ficha = await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', cookie)
    expect(ficha.status).toBe(200)
    expect(ficha.body.foto).toMatchObject({ nombre: 'Vista frontal', url: null })
    expect(ficha.body.documentos.map((d: { nombre: string }) => d.nombre)).toEqual(['Manual de usuario'])

    const contenido = await request(app).get(`/api/catalogo/modelos/${modeloId}/documentos/${ficha.body.foto.id}/contenido`).set('Cookie', cookie)
    expect(contenido.status).toBe(200)
    expect(contenido.headers['content-type']).toContain('image/png')
    // `image/png` lo parsea supertest como binario: llega en `.body` (Buffer), no en `.text`
    // (que se queda `undefined` para cualquier tipo que superagent trate como binario).
    expect(contenido.body).toEqual(Buffer.from('imagen'))
  })

  // Un enlace no tiene fichero que servir.
  it('404 al pedir el contenido de un documento que es un enlace', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    const id = (await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).body.id
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/documentos/${id}/contenido`).set('Cookie', cookie)).status).toBe(404)
  })

  it('422 sin nombre, sin url ni fichero, o con un tipo que no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    const post = (body: object) => request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie).send(body)
    expect((await post({ tipo: 'manual', nombre: '', url: 'https://x' })).status).toBe(422)
    expect((await post({ tipo: 'manual', nombre: 'M' })).status).toBe(422)
    expect((await post({ tipo: 'inventado', nombre: 'M', url: 'https://x' })).status).toBe(422)
  })

  it('el sku se guarda por el PATCH del modelo y sale en la ficha', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    expect((await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ sku: 'SKU-9' })).status).toBe(200)
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', cookie)).body.sku).toBe('SKU-9')
  })

  // Es la regresión más fácil de introducir y la más difícil de notar: todo seguiría funcionando,
  // solo más lento cada día que pasara.
  it('GET /api/catalogo sigue sin devolver documentos ni base64', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .field('tipo', 'foto').field('nombre', 'F')
      .attach('archivo', Buffer.from('IMAGENSECRETA'), { filename: 'f.png', contentType: 'image/png' })

    const c = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(JSON.stringify(c.body)).not.toContain('IMAGENSECRETA')
    expect(JSON.stringify(c.body)).not.toContain('documentos')
  })

  it('leer la ficha exige sesión; escribir exige super administrador', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, admin)
    const docId = (await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', admin)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).body.id
    const op = await userCookie(['Servicio Técnico'])

    // Leer: cualquiera con sesión. El técnico tiene que poder abrir el manual.
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', op)).status).toBe(200)
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`)).status).toBe(401)

    // Escribir: solo super administrador.
    const alta = `/api/catalogo/modelos/${modeloId}/documentos`
    expect((await request(app).post(alta).set('Cookie', op).send({ tipo: 'manual', nombre: 'X', url: 'https://y' })).status).toBe(403)
    expect((await request(app).post(alta).send({ tipo: 'manual', nombre: 'X', url: 'https://y' })).status).toBe(401)
    const baja = `/api/catalogo/modelos/${modeloId}/documentos/${docId}`
    expect((await request(app).delete(baja).set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete(baja)).status).toBe(401)
    expect((await request(app).delete(baja).set('Cookie', admin)).status).toBe(200)
  })

  // El código ya los maneja bien (leerFicha, existeEnCatalogo y borrarDocumento devuelven todos un
  // "no" limpio), pero solo estaba probado a nivel de repo — nunca por HTTP.
  it('404 sobre un modelo o un documento que no existen', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).get('/api/catalogo/modelos/cmod-inventado/ficha').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).post('/api/catalogo/modelos/cmod-inventado/documentos').set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).status).toBe(404)

    const modeloId = await modeloParaFicha(app, cookie)
    expect((await request(app).delete(`/api/catalogo/modelos/${modeloId}/documentos/cdoc-inventado`).set('Cookie', cookie)).status).toBe(404)
  })
})

/**
 * El segundo disparador de avisos: el ticket entra en una fase que le toca a OTRA área. No es la
 * derivación —ahí se nombra a una persona—; aquí el testigo pasa a un cargo.
 */

describe('avisos por cambio de área', () => {
  it('avisa al rol receptor del área que recibe el testigo, no a quien ejecutó', async () => {
    // Quien recibe el testigo: el coordinador comercial, con la casilla marcada.
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    // Un comercial SIN la casilla: no debe recibir nada, para que el test distinga rol de área.
    const otro = await createRole(db, { name: 'Asistente Comercial', areas: ['Comercial'] })
    const beto = await createUser(db, { email: 'beto@x.co', name: 'Beto', passwordHash: 'h', roleId: otro.id })

    // Quien ejecuta: Servicio Técnico. `userCookie` le crea su propio rol.
    const cookie = await userCookie(['Servicio Técnico'])
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'En Proceso', true)")
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'finalizacion_servicio', values: { comment: 'listo', 'Fecha Finalización ST': '2026-08-12' } })
    expect(res.status).toBe(200)

    const deAna = await listarAvisos(db, ana.id)
    expect(deAna).toHaveLength(1)
    expect(deAna[0].texto).toMatch(/Por Facturar/)
    expect(await listarAvisos(db, beto.id)).toEqual([])
  })

  // «Facturado» deja el ticket en «Liberación Comercial», cuya transición siguiente TAMBIÉN es de
  // Comercial: avisar ahí sería decirle a Comercial que le toca a Comercial.
  it('no avisa cuando la fase siguiente sigue siendo del área que actuó', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })

    const cookie = await userCookie(['Comercial'])
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10001, 'Por Facturar', true)")
    const { app } = appWith()

    await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'facturado', values: { comment: 'ok', 'Fecha De Factura': '2026-08-12' } })

    expect(await listarAvisos(db, ana.id)).toEqual([])
  })
})

describe('avisos por correo', () => {
  it('la derivación manda el correo al derivado y sella enviado_at', async () => {
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: 'h' })
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")

    const fake = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fake)
    try {
      const { app } = appWith({ avisosWebhookUrl: 'https://n8n/webhook/avisos', appBaseUrl: 'https://desk.example' })
      const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
        .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
      expect(res.status).toBe(200)

      const body = JSON.parse(fake.mock.calls[0][1].body as string)
      expect(body.avisos).toHaveLength(1)
      expect(body.avisos[0]).toMatchObject({ email: 'dest@x.co', nombre: 'Destino', url: 'https://desk.example' })
      expect(body.avisos[0].texto).toMatch(/te derivó/)
    } finally {
      vi.unstubAllGlobals()
    }

    const sellados = await db.query('SELECT id FROM avisos WHERE enviado_at IS NOT NULL')
    expect(sellados.rows).toHaveLength(1)
  })

  // El canal apagado no puede romper nada: es el estado por defecto y el de cualquier despliegue que
  // aún no tenga el flujo montado.
  it('sin webhook configurado la transición funciona igual y el aviso queda sin sellar', async () => {
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: 'h' })
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
    expect(res.status).toBe(200)

    expect((await db.query('SELECT id FROM avisos WHERE enviado_at IS NULL')).rows).toHaveLength(1)
  })

  // Un n8n caído NO puede tumbar una transición ya escrita: es el invariante de todo este canal.
  it('un n8n caído no rompe la transición', async () => {
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: 'h' })
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')))
    try {
      const { app } = appWith({ avisosWebhookUrl: 'https://n8n/webhook/avisos' })
      const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
        .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
      expect(res.status).toBe(200)
    } finally {
      vi.unstubAllGlobals()
    }

    const t = await db.query('SELECT status FROM tickets WHERE id = $1', ['t1'])
    expect((t.rows[0] as { status: string }).status).toBe('Ingresado')
    expect((await db.query('SELECT id FROM avisos WHERE enviado_at IS NULL')).rows).toHaveLength(1)
  })

  /**
   * La copia de verificación de la fase de pruebas, de punta a punta: es lo único que comprueba que el
   * aviso de DERIVACIÓN sale marcado desde el servicio. Sin este test, quitar `conCopia` en
   * `ticketService` no rompería nada y la copia dejaría de salir en silencio.
   */
  it('con dirección de copia configurada, la derivación sale también para el administrador', async () => {
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: 'h' })
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")

    const fake = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fake)
    try {
      const { app } = appWith({ avisosWebhookUrl: 'https://n8n/webhook/avisos', avisosCopiaEmail: 'copia@x.co' })
      const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
        .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
      expect(res.status).toBe(200)

      const body = JSON.parse(fake.mock.calls[0][1].body as string)
      expect(body.avisos.map((a: { email: string }) => a.email)).toEqual(['dest@x.co', 'copia@x.co'])
    } finally {
      vi.unstubAllGlobals()
    }

    // La copia NO es una fila de `avisos`: solo se sella el aviso de verdad.
    expect((await db.query('SELECT id FROM avisos')).rows).toHaveLength(1)
  })
})

/**
 * El borrado de un ticket desde la aplicación. Sustituye al runbook manual de nueve tablas.
 * `?dryRun=true` es la vista previa: mismos números, sin escribir.
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

describe('POST /api/admin/backfill-history (admin)', () => {
  it('con límite 0 responde el conteo esperando', async () => {
    const admin = await adminCookie()
    const { app, sync } = appWith()
    sync.backfillTicketHistory.mockResolvedValue({ intentados: 0, poblados: 0, fallidos: 0, restantes: 42 })

    const res = await request(app).post('/api/admin/backfill-history?limite=0').set('Cookie', admin)

    expect(res.status).toBe(200)
    expect(res.body.restantes).toBe(42)
    expect(sync.backfillTicketHistory).toHaveBeenCalledWith({ limite: 0 })
  })

  // Sin límite el barrido dura minutos: se lanza al fondo y la petición vuelve enseguida. Esperarlo
  // dejaría la petición colgada hasta que el proxy la cortara, y el trabajo a medias sin avisar.
  it('sin límite lo lanza en segundo plano y devuelve enseguida', async () => {
    const admin = await adminCookie()
    const { app, sync } = appWith()

    const res = await request(app).post('/api/admin/backfill-history?pausaMs=800').set('Cookie', admin)

    expect(res.body).toEqual({ started: true })
    expect(sync.backfillTicketHistory).toHaveBeenCalledWith({ limite: undefined, pausaMs: 800 })
  })

  it('403 no-admin; 401 sin sesión', async () => {
    const { app } = appWith()
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-history').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-history')).status).toBe(401)
  })
})

/**
 * Una ruta de API que no existe tiene que decirlo en JSON.
 *
 * En producción, detrás de `createApp`, hay un `app.use` que sirve `index.html` para que funcionen las
 * rutas del navegador. Sin este 404, ese comodín se tragaba también las de `/api`: pedir un endpoint
 * mal escrito —o uno que existe en el código pero todavía no en el servidor desplegado— devolvía la
 * página entera con un 200, y quien llamaba se encontraba con «Unexpected token '<'» en vez de con un
 * 404. El síntoma no se parecía en nada a la causa.
 */

describe('rutas de API inexistentes', () => {
  it('404 en JSON, sin tragárselo el comodín del SPA', async () => {
    const { app } = appWith()
    const res = await request(app).post('/api/admin/no-existe')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Ruta de API no encontrada' })
  })

  // Lo que NO cuelga de /api sigue de largo: es lo que deja pasar las rutas del navegador al SPA.
  it('no toca las rutas que no son de API', async () => {
    const { app } = appWith()
    expect((await request(app).get('/tickets/123')).body).toEqual({})
  })
})
