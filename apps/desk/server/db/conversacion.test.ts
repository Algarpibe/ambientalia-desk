import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getConversacionTicket } from './conversacion'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const insTicket = (id: string, n: number) =>
  db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,$2,'A','Ingresado')", [id, n])

describe('getConversacionTicket', () => {
  it('la creación produce su entrada firmada, con cliente, equipo, servicio y orden', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name) VALUES ('cli1','Edgar','Airlab Consulting S.A.S.')")
    await db.query("INSERT INTO tickets (id,number,subject,status,client_id) VALUES ('app-1',1,'A','Ingresado','cli1')")
    await db.query(
      "INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('app-1','Enviar','(creación)','OV asignada','Luz Ángela','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-2026-141', marca: 'Grimm', modelo: 'EDM180C', serial: '18A19035', tipo_servicio: 'Calibración', clasificacion: 'Garantía', prioridad: 'Media' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-1')
    expect(mensajes).toHaveLength(1)
    expect(mensajes[0].author).toBe('Luz Ángela')
    expect(mensajes[0].type).toBe('Privado')
    expect(mensajes[0].content).toBe([
      'Ticket creado para Airlab Consulting S.A.S.',
      'Equipo: Grimm EDM180C · serie 18A19035',
      'Tipo de servicio: Calibración',
      'Orden de venta: OV-2026-141',
      'Clasificación: Garantía · Prioridad: Media',
    ].join('\n'))
  })

  // La prosa del hilo son las observaciones que escribió el técnico, tal cual: es lo que hace que
  // esto se lea como lo escrito a mano en Zoho y no como un volcado de campos.
  it('la remisión produce su entrada con observaciones, incluye y fotos', async () => {
    await insTicket('app-2', 2)
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,incluye,observaciones,creado_por,estado,resultado,created_at)
       VALUES ('r1','app-2','entrada','2026-08-04','Calibración','["cabezal","tubo"]'::jsonb,'El equipo ingresa sin sensor de temperatura y humedad.','Julián Maya','ok',$1,'2026-08-04T14:24:00Z')`,
      [JSON.stringify({ fotos: { recibidas: 3, subidas: 3 } })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-2')
    expect(mensajes[0].author).toBe('Julián Maya')
    expect(mensajes[0].content).toBe([
      'El equipo ingresa para Calibración.',
      'El equipo ingresa sin sensor de temperatura y humedad.',
      'Incluye: cabezal, tubo',
      'Registro fotográfico: 3 fotos',
    ].join('\n'))
  })

  it('los cuatro adjuntos salen como enlaces cuando los ids existen', async () => {
    await insTicket('app-3', 3)
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,resultado,created_at)
       VALUES ('r2','app-3','entrada','2026-08-04','Julián','ok',$1,'2026-08-04T14:00:00Z')`,
      [JSON.stringify({ carpetaUrl: 'https://drive.google.com/drive/folders/CAR', docId: 'DOC', pdfId: 'PDF', dymoId: 'DYM' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-3')
    expect(mensajes[0].attachments?.map((a) => [a.name, a.url])).toEqual([
      ['Remisión de entrada', 'https://drive.google.com/file/d/PDF/view'],
      ['Documento editable', 'https://docs.google.com/document/d/DOC/edit'],
      ['Etiqueta .dymo', 'https://drive.google.com/file/d/DYM/view'],
      ['Carpeta en Drive', 'https://drive.google.com/drive/folders/CAR'],
    ])
  })

  // Las 149 remisiones migradas de la hoja de Google nunca pasaron por n8n: `resultado` es NULL.
  it('una remisión sin resultado no lleva adjuntos y no revienta', async () => {
    await insTicket('app-4', 4)
    await db.query(
      "INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at) VALUES ('r3','app-4','entrada','2026-08-04','Julián','ok','2026-08-04T14:00:00Z')",
    )
    const { mensajes } = await getConversacionTicket(db, 'app-4')
    expect(mensajes[0].attachments).toBeUndefined()
  })

  it('una carpetaUrl que no sea https no produce adjunto', async () => {
    await insTicket('app-5', 5)
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,resultado,created_at)
       VALUES ('r4','app-5','entrada','2026-08-04','Julián','ok',$1,'2026-08-04T14:00:00Z')`,
      [JSON.stringify({ carpetaUrl: 'javascript:alert(1)' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-5')
    expect(mensajes[0].attachments).toBeUndefined()
  })

  // El hilo registra lo que pasó, y una remisión anulada pasó.
  it('una remisión anulada aparece igual', async () => {
    await insTicket('app-6', 6)
    await db.query(
      "INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at,anulada_at,anulada_por) VALUES ('r5','app-6','entrada','2026-08-04','Julián','ok','2026-08-04T14:00:00Z','2026-08-05T09:00:00Z','Admin')",
    )
    const { mensajes } = await getConversacionTicket(db, 'app-6')
    expect(mensajes).toHaveLength(1)
  })

  // La rama de SALIDA está en el roadmap escrito y hoy todo lo que se inserta es 'entrada', así que
  // sin este caso volver a "El equipo ingresa" y a "Remisión de entrada" fijos dejaría la suite en
  // verde — y el hilo diría que el equipo ingresa el día que se le devuelve al cliente.
  it('una remisión de salida no dice que el equipo ingresa', async () => {
    await insTicket('app-6b', 11)
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,creado_por,estado,resultado,created_at)
       VALUES ('r6','app-6b','salida','2026-08-04','Calibración','Julián','ok',$1,'2026-08-04T14:00:00Z')`,
      [JSON.stringify({ pdfId: 'PDF' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-6b')
    expect(mensajes[0].content).toBe('El equipo sale tras Calibración.')
    expect(mensajes[0].attachments?.[0].name).toBe('Remisión de salida')
  })

  it('una transición lista sus campos diligenciados', async () => {
    await insTicket('app-7', 7)
    await db.query(
      "INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at,values) VALUES ('app-7','Diagnosticar','Ingresado','En Proceso','Taller','Juan','2026-08-03T10:00:00Z',$1)",
      [JSON.stringify({ diagnostico: 'Sensor averiado' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-7')
    expect(mensajes[0].content).toBe([
      'Diagnosticar: Ingresado → En Proceso',
      'Área: Taller',
      'Diagnostico: Sensor averiado',
    ].join('\n'))
  })

  it('mezcla las conversaciones de Zoho con lo generado, más reciente primero', async () => {
    await insTicket('t8', 8)
    await db.query(
      "INSERT INTO conversations (id,ticket_id,author_name,is_public,content,content_type,commented_time) VALUES ('c1','t8','Ana',false,'Nota de Zoho','text','2026-08-02T10:00:00Z')",
    )
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t8','Habilitar','A','B','Admin','2026-08-03T10:00:00Z')")
    const { mensajes } = await getConversacionTicket(db, 't8')
    expect(mensajes.map((m) => m.author)).toEqual(['Admin', 'Ana'])
  })

  it('no le pide conversaciones a Zoho para un ticket nacido en la app', async () => {
    await insTicket('app-9', 9)
    expect((await getConversacionTicket(db, 'app-9')).sincronizarConZoho).toBe('no')
    await insTicket('98765', 10)
    expect((await getConversacionTicket(db, '98765')).sincronizarConZoho).toBe('ahora')
  })
})
