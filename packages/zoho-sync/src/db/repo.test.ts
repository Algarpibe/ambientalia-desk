import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertAccount, upsertContact, upsertTicket, getTicketRow, countTickets } from './repo'
import { getActiveTickets, getAllTickets, getClosedTickets, countClosedTickets, getTicketWithRefs, nextTicketNumber, previewTicketNumber, insertTransition } from './repo'
import { applyTransition, createTicket, setTicketRead } from './repo'
import { reseedTicketNumber, APP_TICKET_NUMBER_BASE } from './migrate'
import { ticketRowFromZoho, accountRowFromZoho } from './mappers'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function zTicket(id: string, number: number, status = 'Ingresado') {
  return ticketRowFromZoho({ id, ticketNumber: String(number), status, statusType: 'Open', customFields: {} } as any)
}

describe('repo upserts', () => {
  it('upsertTicket inserta y actualiza', async () => {
    await upsertTicket(db, zTicket('1', 941))
    await upsertTicket(db, { ...zTicket('1', 941, 'En Proceso') })
    expect(await countTickets(db)).toBe(1)
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso')
  })

  it('upsertTicket NO sobrescribe si managed_by_app=true', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), managed_by_app: true, status: 'En Proceso' })
    await upsertTicket(db, { ...zTicket('1', 941, 'Ingresado') }) // viene del sync
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso') // preservado
    expect(r!.managed_by_app).toBe(true)
  })

  it('upsertAccount inserta', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'Gecelca' } as any))
    const r = await db.query('SELECT name FROM accounts WHERE id=$1', ['a1'])
    expect(r.rows[0].name).toBe('Gecelca')
  })
})

describe('upsertContact (modified_time + guarda managed_by_app)', () => {
  it('inserta con modified_time y no pisa los managed_by_app', async () => {
    await upsertContact(db, { id: 'c1', first_name: 'Ana', last_name: 'P', email: 'a@b.co', phone: '1', mobile: null, account_id: null, modified_time: '2026-05-01T00:00:00Z', source: 'zoho', managed_by_app: false, raw: {} })
    const row = (await db.query("SELECT first_name, modified_time FROM contacts WHERE id='c1'")).rows[0]
    expect(row.first_name).toBe('Ana')
    expect(row.modified_time).not.toBeNull()
  })
})

describe('repo queries', () => {
  it('getActiveTickets excluye cerrados y junta empresa/agente', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'Gecelca' } as any))
    await upsertTicket(db, { ...zTicket('1', 1, 'Ingresado'), account_id: 'a1' })
    await upsertTicket(db, { ...zTicket('2', 2, 'Finalizado'), status_type: 'Closed' })
    const list = await getActiveTickets(db)
    expect(list.map((x) => x.row.id)).toEqual(['1'])
    expect(list[0].refs.accountName).toBe('Gecelca')
  })

  it('nextTicketNumber continúa desde el máximo de la app e ignora números de Zoho', async () => {
    // un ticket de Zoho (managed_by_app=false) NO arrastra la secuencia de la app
    await upsertTicket(db, zTicket('1', 953))
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE)
    // con un ticket de app existente, continúa desde su número
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('app1', 1000010, 'Ingresado', true)")
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(1000011)
  })

  it('previewTicketNumber anticipa el número sin consumir la secuencia', async () => {
    expect(APP_TICKET_NUMBER_BASE).toBe(10_000) // los tickets creados en la app empiezan aquí
    await reseedTicketNumber(db)
    // Consultarlo no mueve nada: dos lecturas dan lo mismo y la secuencia sigue intacta.
    expect(await previewTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE)
    expect(await previewTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE)
    expect(await nextTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE)
    // Un ticket de Zoho no lo desplaza; uno de la app sí.
    await upsertTicket(db, zTicket('z1', 953))
    expect(await previewTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE)
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('app1', $1, 'Ingresado', true)", [APP_TICKET_NUMBER_BASE])
    expect(await previewTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE + 1)
  })

  it('insertTransition registra el historial', async () => {
    await upsertTicket(db, zTicket('1', 1))
    await insertTransition(db, { ticketId: '1', transitionId: 'aprobacion', transitionName: 'Aprobación', fromStatus: 'Notificación cliente', toStatus: 'En Proceso', area: 'Comercial', performedBy: 'app', values: { comment: 'ok' }, commentId: null })
    const r = await db.query('SELECT to_status FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(r.rows[0].to_status).toBe('En Proceso')
  })
})

describe('getAllTickets', () => {
  it('incluye cerrados; getActiveTickets no', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a',1,'A','Ingresado','Open',now())")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('b',2,'B','Finalizado','Closed',now())")
    expect((await getActiveTickets(db)).length).toBe(1)
    expect((await getAllTickets(db)).length).toBe(2)
  })
})

describe('getClosedTickets / countClosedTickets (paginación)', () => {
  beforeEach(async () => {
    // 3 cerrados (c1..c3, created_time creciente) + 2 activos (a1,a2) que NO deben aparecer.
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('c1',1,'C1','Finalizado','Closed','2026-01-01T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('c2',2,'C2','Finalizado','Closed','2026-02-01T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('c3',3,'C3','Finalizado','Closed','2026-03-01T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a1',4,'A1','Ingresado','Open','2026-04-01T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a2',5,'A2','Ingresado',NULL,'2026-05-01T00:00:00Z')")
  })

  it('getClosedTickets devuelve solo cerrados, respeta LIMIT y orden created_time desc', async () => {
    const page1 = await getClosedTickets(db, '', 2, 0)
    expect(page1.map((x) => x.row.id)).toEqual(['c3', 'c2'])
  })

  it('getClosedTickets respeta OFFSET (página siguiente)', async () => {
    const page2 = await getClosedTickets(db, '', 2, 2)
    expect(page2.map((x) => x.row.id)).toEqual(['c1'])
  })

  it('countClosedTickets cuenta solo cerrados (ignora activos)', async () => {
    expect(await countClosedTickets(db)).toBe(3)
  })
})

describe('applyTransition', () => {
  it('actualiza ticket (managed), inserta comentario e historial', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'OV asignada', statusType: 'Open', customFields: {} } as any))
    await applyTransition(
      db, '1', 'OV asignada',
      { id: 'habilitar_servicio', name: 'Habilitar Servicio', area: 'Comercial' },
      { status: 'Ingresado', statusType: 'Open', columns: { orden_venta: 'OV-1', fecha_cotizacion: '2026-05-19' }, customFields: {}, comment: 'ok' },
      'Equipo Técnico', { comment: 'ok' },
    )
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('Ingresado')
    expect(r!.managed_by_app).toBe(true)
    expect(r!.orden_venta).toBe('OV-1')
    const conv = await db.query('SELECT count(*)::int AS n FROM conversations WHERE ticket_id=$1', ['1'])
    expect(conv.rows[0].n).toBe(1)
    const hist = await db.query('SELECT to_status, from_status, performed_by FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(hist.rows[0].to_status).toBe('Ingresado')
    expect(hist.rows[0].from_status).toBe('OV asignada')
    expect(hist.rows[0].performed_by).toBe('Equipo Técnico')
  })
})

describe('ticket_reads (leído/no leído)', () => {
  it('setTicketRead marca leído/no leído por usuario; reactiva si se modifica tras leer', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time,modified_time) VALUES ('t1',1,'A','Ingresado','Open',now(),'2026-01-01T00:00:00Z')")
    const readFor = async (u: string) => (await getActiveTickets(db, u))[0].refs.read
    expect(await readFor('u1')).toBe(false)
    await setTicketRead(db, 'u1', 't1', true)
    expect(await readFor('u1')).toBe(true)
    expect(await readFor('u2')).toBe(false)
    await setTicketRead(db, 'u1', 't1', false)
    expect(await readFor('u1')).toBe(false)
    await setTicketRead(db, 'u1', 't1', true)
    await db.query("UPDATE tickets SET modified_time='2999-01-01T00:00:00Z' WHERE id='t1'")
    expect(await readFor('u1')).toBe(false)
  })
})

describe('createTicket (Subsistema C)', () => {
  // Nace en "Ticket creado" y NO en el "OV asignada" de Zoho: es la misma fase, pero ese nombre se
  // reserva para lo que llega por el sync (ver STATUS_OV_ASIGNADA), que sigue teniendo su columna.
  it('crea un ticket gestionado en "Ticket creado" con número de secuencia + transición #1', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    const id = await createTicket(db, {
      subject: 'Servicio Técnico Gecelca S.A. E.S.P. Monitor MT_18A20070_EDM180C_260604',
      codigoServicio: 'MT_18A20070_EDM180C_260604', classification: 'Equipo para servicio de mantenimiento',
      tipoServicio: 'Mantenimiento', equipo: 'Monitor de partículas', marca: 'Grimm', modelo: 'EDM180C',
      serial: '18A20070', ordenVenta: 'OV-2026-200', priority: null, clientId: 'cli1', salesorderId: 'so1', equipoId: 'eq-test', actor: 'Admin',
    })
    expect(id).toMatch(/^app-/)
    const row = (await db.query('SELECT number, status, status_type, managed_by_app, source, client_id, salesorder_id, equipo_id, orden_venta FROM tickets WHERE id=$1', [id])).rows[0]
    expect(row.status).toBe('Ticket creado')
    expect(row.status_type).toBe('Open')
    expect(row.managed_by_app).toBe(true)
    expect(row.source).toBe('app')
    expect(row.client_id).toBe('cli1')
    expect(row.salesorder_id).toBe('so1')
    expect(row.equipo_id).toBe('eq-test')
    expect(row.orden_venta).toBe('OV-2026-200')
    expect(Number(row.number)).toBeGreaterThan(0)
    const tr = (await db.query('SELECT to_status, transition_name, area, performed_by FROM ticket_transitions WHERE ticket_id=$1', [id])).rows[0]
    expect(tr).toMatchObject({ to_status: 'Ticket creado', transition_name: 'Enviar', area: 'Comercial', performed_by: 'Admin' })
    const active = await getActiveTickets(db)
    expect(active.find((t) => t.row.id === id)?.refs.accountName).toBe('Gecelca S.A. E.S.P.')
    const detail = await getTicketWithRefs(db, id)
    expect(detail?.refs.accountName).toBe('Gecelca S.A. E.S.P.')
  })

  // La transición de creación es el ÚNICO sitio donde puede quedar una foto de con qué nació el
  // ticket: las columnas de `tickets` son estado actual y cualquier cosa podría reescribirlas. Antes
  // solo se guardaba `orden_venta`, así que la historia tenía que leer la fila y mentir un poco.
  it('createTicket guarda el payload completo en values de la transición', async () => {
    const id = await createTicket(db, {
      subject: 'MT_18A20070_EDM180C_260805', priority: 'Medium', classification: 'Garantía',
      tipoServicio: 'Calibración', equipo: 'Monitor', marca: 'Grimm', modelo: 'EDM180C',
      serial: '18A20070', codigoServicio: 'MT_260805', ordenVenta: 'OV-2026-141',
      clientId: 'c1', salesorderId: 'so1', equipoId: 'eq1', actor: 'Luz Ángela',
    })
    const r = await db.query('SELECT values FROM ticket_transitions WHERE ticket_id = $1', [id])
    const v = typeof r.rows[0].values === 'string' ? JSON.parse(r.rows[0].values) : r.rows[0].values
    expect(v).toMatchObject({
      orden_venta: 'OV-2026-141', marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070',
      tipo_servicio: 'Calibración', clasificacion: 'Garantía', prioridad: 'Medium',
      codigo_servicio: 'MT_260805', client_id: 'c1',
    })
  })
})
