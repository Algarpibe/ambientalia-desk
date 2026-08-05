import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getHistorialTicket } from './historial'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const insTicket = (id: string) =>
  db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,1,'A','Ingresado')", [id])

describe('getHistorialTicket', () => {
  // La regresión que motiva todo esto: antes era `if (Zoho) else (app)`, así que un ticket con las
  // dos cosas solo enseñaba las de Zoho.
  it('devuelve los eventos de Zoho Y las transiciones de la app', async () => {
    await insTicket('t1')
    await db.query(
      "INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h1','t1','CommentAdded','2026-08-01T10:00:00Z','Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', eventTime: '2026-08-01T10:00:00Z', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })],
    )
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at) VALUES ('t1','Habilitar Servicio','OV asignada','Ingresado','Comercial','Admin','2026-08-02T10:00:00Z')")
    const { eventos } = await getHistorialTicket(db, 't1')
    expect(eventos.map((e) => e.title)).toEqual([
      'Transición: Habilitar Servicio',
      'Ana ha publicado un comentario',
    ])
  })

  it('la fila de creación sale como "Ticket creado" con los datos de la foto', async () => {
    await insTicket('t2')
    await db.query(
      "INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('t2','Enviar','(creación)','OV asignada','Luz','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-2026-141', marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070', tipo_servicio: 'Calibración' })],
    )
    const { eventos } = await getHistorialTicket(db, 't2')
    expect(eventos[0].title).toBe('Ticket creado')
    expect(eventos[0].actor).toBe('Luz')
    expect(eventos[0].details).toContainEqual({ label: 'Orden de venta', value: 'OV-2026-141' })
    expect(eventos[0].details).toContainEqual({ label: 'Equipo', value: 'Grimm EDM180C · serie 18A20070' })
    expect(eventos[0].details).toContainEqual({ label: 'Tipo de servicio', value: 'Calibración' })
  })

  // Los tickets creados antes de guardar la foto: la historia cae a la fila del ticket.
  // El nombre del cliente NO está en `tickets`: hay que resolverlo contra la vista `clients`. Este
  // test existe porque es el único camino del compositor que toca otra tabla, y sin él quedaría sin
  // ejercitar hasta producción.
  it('resuelve el nombre del cliente y prefiere la empresa al contacto', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name) VALUES ('cli1','Edgar Barrera','SERAMBIENTE S.A.S.')")
    await db.query("INSERT INTO tickets (id,number,subject,status,client_id) VALUES ('tc',20,'A','Ingresado','cli1')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('tc','Enviar','(creación)','OV asignada','Luz','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-1' })])
    const { eventos } = await getHistorialTicket(db, 'tc')
    expect(eventos[0].details).toContainEqual({ label: 'Cliente', value: 'SERAMBIENTE S.A.S.' })
  })

  it('sin foto en values, la creación lee los datos de la fila del ticket', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,marca,modelo,serial) VALUES ('t3',3,'A','Ingresado','Horiba','APNA-370','VMH2YJP3')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('t3','Enviar','(creación)','OV asignada','Luz','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-9' })])
    const { eventos } = await getHistorialTicket(db, 't3')
    expect(eventos[0].details).toContainEqual({ label: 'Equipo', value: 'Horiba APNA-370 · serie VMH2YJP3' })
  })

  it('una transición normal expone un detalle por campo diligenciado', async () => {
    await insTicket('t4')
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('t4','Diagnosticar','Ingresado','En Proceso','Juan','2026-08-03T10:00:00Z',$1)",
      [JSON.stringify({ diagnostico: 'Sensor averiado', requiere_repuestos: 'Sí' })])
    const { eventos } = await getHistorialTicket(db, 't4')
    expect(eventos[0].details).toContainEqual({ label: 'Estado', value: 'Ingresado → En Proceso' })
    expect(eventos[0].details).toContainEqual({ label: 'Diagnostico', value: 'Sensor averiado' })
    expect(eventos[0].details).toContainEqual({ label: 'Requiere repuestos', value: 'Sí' })
  })

  it('una remisión resuelta produce creada + desenlace, con el enlace a Drive', async () => {
    await insTicket('t5')
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,incluye,observaciones,creado_por,estado,resultado,created_at,resuelto_at)
       VALUES ('r1','t5','entrada','2026-08-04','Calibración','["Cabezal","tubo"]'::jsonb,'Sin caja','Julián','ok',$1,'2026-08-04T14:00:00Z','2026-08-04T14:01:00Z')`,
      [JSON.stringify({ carpetaUrl: 'https://drive.google.com/carpeta', fotos: { recibidas: 3, subidas: 3 } })],
    )
    const { eventos } = await getHistorialTicket(db, 't5')
    expect(eventos.map((e) => e.title)).toEqual(['Remisión: Creada', 'Remisión de entrada creada'])
    expect(eventos[1].details).toContainEqual({ label: 'Técnico', value: 'Julián' })
    expect(eventos[1].details).toContainEqual({ label: 'Incluye', value: 'Cabezal, tubo' })
    expect(eventos[1].details).toContainEqual({ label: 'Observaciones', value: 'Sin caja' })
    expect(eventos[0].details).toContainEqual({ label: 'Carpeta en Drive', value: '<a href="https://drive.google.com/carpeta" target="_blank" rel="noopener noreferrer">Abrir carpeta</a>', html: true })
  })

  // Una remisión anulada PASÓ. El historial registra lo que pasó, no lo que sigue vigente.
  it('una remisión anulada aparece, con su tercer evento', async () => {
    await insTicket('t6')
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at,anulada_at,anulada_por)
       VALUES ('r2','t6','entrada','2026-08-04','Julián','ok','2026-08-04T14:00:00Z','2026-08-05T09:00:00Z','Admin')`,
    )
    const { eventos } = await getHistorialTicket(db, 't6')
    expect(eventos.map((e) => e.title)).toEqual(['Remisión anulada', 'Remisión de entrada creada'])
    expect(eventos[0].details).toContainEqual({ label: 'Anulada por', value: 'Admin' })
  })

  it('una carpetaUrl que no sea https no produce enlace', async () => {
    await insTicket('t7')
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,resultado,created_at,resuelto_at)
       VALUES ('r3','t7','entrada','2026-08-04','Julián','ok',$1,'2026-08-04T14:00:00Z','2026-08-04T14:01:00Z')`,
      [JSON.stringify({ carpetaUrl: 'javascript:alert(1)' })],
    )
    const { eventos } = await getHistorialTicket(db, 't7')
    expect(eventos[0].details.some((d) => d.label === 'Carpeta en Drive')).toBe(false)
  })

  it('ordena todo por fecha descendente', async () => {
    await insTicket('t8')
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t8','Uno','A','B','X','2026-08-01T10:00:00Z')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t8','Tres','B','C','X','2026-08-03T10:00:00Z')")
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at) VALUES ('r4','t8','entrada','2026-08-02','X','pendiente','2026-08-02T10:00:00Z')`,
    )
    const { eventos } = await getHistorialTicket(db, 't8')
    expect(eventos.map((e) => e.title)).toEqual([
      'Transición: Tres', 'Remisión de entrada creada', 'Transición: Uno',
    ])
  })

  // El sync perezoso preguntaba "¿está vacío el historial?". Con la unión eso ya no distingue nada:
  // un ticket de la app SIEMPRE tiene su transición de creación, así que preguntaría a Zoho por un
  // ticket que Zoho no conoce, en cada apertura.
  it('dice si hay que pedirle la historia a Zoho, y no la pide para un ticket de la app', async () => {
    // El id lo acuña `createTicket` con este prefijo: es lo que marca que el ticket nació aquí.
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('app-9',9,'A','Ingresado',true)")
    expect((await getHistorialTicket(db, 'app-9')).sincronizarConZoho).toBe('no')

    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('t10',10,'A','Ingresado',false)")
    expect((await getHistorialTicket(db, 't10')).sincronizarConZoho).toBe('ahora')

    await db.query(
      "INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h10','t10','CommentAdded','2026-08-01T10:00:00Z','Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [] })],
    )
    expect((await getHistorialTicket(db, 't10')).sincronizarConZoho).toBe('en-segundo-plano')
  })

  // El agujero: `writeTransition` pone `managed_by_app=true` y `source='app'` en TODA transición
  // hecha desde Desk, también las de un ticket de Zoho. Discriminar por ellas dejaba a ese ticket sin
  // refrescar su historia de Zoho desde la primera vez que alguien lo moviera aquí — para siempre,
  // porque `syncTicketHistory` no se llama desde ningún otro sitio.
  it('un ticket de Zoho movido en la app sigue refrescando su historia de Zoho', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app,source) VALUES ('98765',11,'A','Ingresado',true,'app')")
    await db.query(
      "INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h11','98765','CommentAdded','2026-08-01T10:00:00Z','Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [] })],
    )
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('98765','Habilitar','OV asignada','Ingresado','Admin','2026-08-02T10:00:00Z')")
    const { eventos, sincronizarConZoho } = await getHistorialTicket(db, '98765')
    expect(sincronizarConZoho).toBe('en-segundo-plano')
    // Y las dos fuentes salen juntas, que es el otro medio bug del mismo sitio.
    expect(eventos.map((e) => e.title)).toEqual(['Transición: Habilitar', 'Ana ha publicado un comentario'])
  })
})
