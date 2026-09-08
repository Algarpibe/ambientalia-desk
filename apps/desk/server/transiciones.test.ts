import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertTicket, getTicketRow } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { createRole, actualizarRecibeAvisos } from './auth/roles'
import { listarAvisos } from './db/avisos'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

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
