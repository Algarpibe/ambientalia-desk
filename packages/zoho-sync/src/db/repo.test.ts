import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertAccount, upsertContact, upsertTicket, getTicketRow, countTickets } from './repo'
import { getActiveTickets, getAllTickets, getClosedTickets, countClosedTickets, getTicketWithRefs, nextTicketNumber, previewTicketNumber, insertTransition } from './repo'
import { applyTransition, createTicket, setTicketRead } from './repo'
import { reseedTicketNumber, APP_TICKET_NUMBER_BASE } from './migrate'
import { ticketRowFromZoho, accountRowFromZoho } from './mappers'
import { TICKET_COLS } from './repo'
import { PROMOTED_COLUMNS } from './rows'

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

  /**
   * La derivación es un concepto de la app: Zoho no tiene ese campo y nunca lo manda. Si `derivado_a`
   * entrara en `TICKET_COLS`, cada pasada del sync la reescribiría a NULL y el ticket perdería a su
   * responsable solo, sin que nadie tocara nada y sin dejar rastro. Hoy se salva porque la columna se
   * añade por ALTER y esa lista no la incluye; este test es lo que impide que alguien «complete» la
   * lista sin saber lo que rompe.
   */
  it('el sync de Zoho NO pisa la derivación del ticket', async () => {
    await upsertTicket(db, zTicket('1', 941))
    await db.query("UPDATE tickets SET derivado_a = 'u-1' WHERE id = '1'")

    await upsertTicket(db, { ...zTicket('1', 941, 'En Proceso') })

    const r = await db.query('SELECT derivado_a FROM tickets WHERE id = $1', ['1'])
    expect((r.rows[0] as { derivado_a: string | null }).derivado_a).toBe('u-1')
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

/**
 * `opts.transaccionAbierta` (RQ-TC-16, `alta-equipo-nuevo-en-ticket`, Fase 2). Cuando `createEquipo` y
 * `createTicket` comparten UNA transacción abierta desde fuera (`enTransaccion`, `apps/desk/server`),
 * `createTicket` NO puede abrir la suya propia — anidar transacciones con `pool.connect()` dos veces
 * sobre el mismo pool las independiza (cada `connect()` reserva un cliente NUEVO), y un fallo tras el
 * `INSERT` del ticket ya no revertiría el `INSERT` del equipo. El flag es explícito, no un pato
 * implícito (`typeof pool.connect !== 'function'`): design.md, decisión «Atomicidad».
 */
describe('createTicket · opts.transaccionAbierta (RQ-TC-16)', () => {
  it('con transaccionAbierta:true NO abre conexión propia, aunque el db recibido SÍ la tenga', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli2','Ambientalia S.A.S.')")
    let connectLlamado = false
    const conPoolFalso: Queryable & { connect: () => Promise<{ query: Queryable['query']; release: () => void }> } = {
      query: (text, params) => db.query(text, params),
      connect: async () => { connectLlamado = true; throw new Error('no debería llamarse con transaccionAbierta:true') },
    }
    const id = await createTicket(conPoolFalso, {
      subject: 'Servicio Técnico Ambientalia S.A.S.', codigoServicio: 'MT_1', classification: 'Correctivo',
      tipoServicio: 'Mantenimiento', equipo: 'Monitor', marca: 'Grimm', modelo: 'EDM180C', serial: '18A20071',
      ordenVenta: null, priority: null, clientId: 'cli2', salesorderId: null, equipoId: 'eq-nuevo', actor: 'Admin',
    }, { transaccionAbierta: true })
    expect(connectLlamado).toBe(false)
    expect(id).toMatch(/^app-/)
    const row = (await db.query('SELECT equipo_id FROM tickets WHERE id=$1', [id])).rows[0]
    expect(row.equipo_id).toBe('eq-nuevo')
  })
})

/**
 * C9 · LA COLUMNA DE LA FECHA DE AVISO NO ENTRA EN `TICKET_COLS`, Y ESO ES LO QUE LA SALVA.
 *
 * `TICKET_COLS` es la lista que el upsert del sync sobrescribe con lo que traiga Zoho
 * (`repo.ts:88`). `fecha_aviso_cliente` NO viene de Zoho —la crea C9 y la escribe
 * `habilitado_para_entrega`—, así que meterla ahí la pondría a `null` en cada pasada del sync, cada
 * 3 minutos, sin error y sin traza. Es la misma razón por la que `derivado_a` tampoco está
 * (`schema.sql:118-123`).
 *
 * La prueba es la pareja de la de `transitionExec.test.ts`: aquélla comprueba que el valor ENTRA por
 * la columna; ésta, que el sync no la BORRA.
 */
describe('C9 · la columna de la fecha de aviso sobrevive al sync', () => {
  it('fecha_aviso_cliente no está en TICKET_COLS, igual que derivado_a', () => {
    expect(TICKET_COLS as readonly string[]).not.toContain('fecha_aviso_cliente')
    expect(TICKET_COLS as readonly string[]).not.toContain('derivado_a')
  })

  it('pero sí está en PROMOTED_COLUMNS, que es lo que la manda a columna y no al jsonb', () => {
    expect(PROMOTED_COLUMNS.map((p) => p.col)).toContain('fecha_aviso_cliente')
    const entrada = PROMOTED_COLUMNS.find((p) => p.col === 'fecha_aviso_cliente')!
    expect([entrada.label, entrada.kind]).toEqual(['Fecha de aviso al cliente', 'date'])
  })
})

/**
 * parche-iv11-orden-venta (F1B-11, parche 1 de 3) · marca de fila `ov_elegida_en_app_at`.
 *
 * IV-11: `orden_venta`/`fecha_orden_venta` se pisaban en cada pasada del sync aunque un escritor de
 * la app las hubiera fijado, porque la única frontera de escritura era `managed_by_app` (fila entera).
 * Estas pruebas fijan la frontera FINA, por columna: con la marca puesta, esas dos columnas quedan
 * protegidas aunque `managed_by_app` sea `false`.
 */
describe('upsertTicket · marca ov_elegida_en_app_at protege orden_venta/fecha_orden_venta', () => {
  it('con la marca y OV distinta de Zoho: las dos columnas quedan intactas, subject sí cambia, y devuelve el descriptor', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP', fecha_orden_venta: '2026-01-01', subject: 'viejo' })
    await db.query("UPDATE tickets SET ov_elegida_en_app_at = now() WHERE id='1'")
    const d = await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-ZOHO', fecha_orden_venta: '2026-02-02', subject: 'nuevo' })
    const r = await getTicketRow(db, '1')
    expect(r!.orden_venta).toBe('OV-APP')
    expect((r!.fecha_orden_venta as unknown as Date).toISOString().slice(0, 10)).toBe('2026-01-01')
    expect(r!.subject).toBe('nuevo') // el resto de TICKET_COLS sigue actualizándose con normalidad
    expect(d).toEqual({ ticketId: '1', numero: 941, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' })
  })

  it('sin la marca, Zoho sigue mandando (comportamiento actual, sin cambios)', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP' })
    const d = await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-ZOHO' })
    expect((await getTicketRow(db, '1'))!.orden_venta).toBe('OV-ZOHO')
    expect(d).toBeNull()
  })

  it('managed_by_app=true gana aunque la marca esté puesta: el salto de :59 sigue PRIMERO', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), managed_by_app: true, orden_venta: 'OV-APP' })
    await db.query("UPDATE tickets SET ov_elegida_en_app_at = now() WHERE id='1'")
    const d = await upsertTicket(db, { ...zTicket('1', 941, 'En Proceso'), orden_venta: 'OV-ZOHO' })
    expect(d).toBeNull()
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('Ingresado') // ni siquiera el status se toca: managed_by_app sale antes de mirar nada más
  })

  it('Zoho vacío tras trim no cuenta como discrepancia (S-2)', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP' })
    await db.query("UPDATE tickets SET ov_elegida_en_app_at = now() WHERE id='1'")
    const d = await upsertTicket(db, { ...zTicket('1', 941), orden_venta: '   ' })
    expect(d).toBeNull()
    expect((await getTicketRow(db, '1'))!.orden_venta).toBe('OV-APP')
  })

  // Distingue el chequeo de "Zoho vacío" del de "igual al último avisado": con `ov_zoho_avisada` NO
  // vacío, un Zoho vacío que sólo comprobara contra `ov_zoho_avisada`/`orden_venta` colaría igual
  // (ambos son distintos de ''), así que hace falta la comprobación explícita de vacío (S-2).
  it('Zoho vacío tras trim no cuenta como discrepancia aunque ov_zoho_avisada tenga otro valor', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP' })
    await db.query("UPDATE tickets SET ov_elegida_en_app_at = now(), ov_zoho_avisada = 'OV-OLD' WHERE id='1'")
    const d = await upsertTicket(db, { ...zTicket('1', 941), orden_venta: '   ' })
    expect(d).toBeNull()
  })

  it('Zoho igual al último valor ya avisado (ov_zoho_avisada) no repite la discrepancia', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP' })
    await db.query("UPDATE tickets SET ov_elegida_en_app_at = now(), ov_zoho_avisada = 'OV-ZOHO' WHERE id='1'")
    const d = await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-ZOHO' })
    expect(d).toBeNull()
  })

  it('Zoho igual al valor que ya tiene la aplicación no es discrepancia', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP' })
    await db.query("UPDATE tickets SET ov_elegida_en_app_at = now() WHERE id='1'")
    const d = await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP' })
    expect(d).toBeNull()
  })

  it('ov_elegida_en_app_at y ov_zoho_avisada no están en TICKET_COLS: el sync nunca las escribe', () => {
    expect(TICKET_COLS as readonly string[]).not.toContain('ov_elegida_en_app_at')
    expect(TICKET_COLS as readonly string[]).not.toContain('ov_zoho_avisada')
  })
})

describe('createTicket / writeTransition ponen la marca al fijar la orden de venta (D6)', () => {
  const inputBase = {
    subject: 'S', codigoServicio: null, classification: null, tipoServicio: null, equipo: null,
    marca: null, modelo: null, serial: null, priority: null, salesorderId: null, equipoId: null, actor: 'Admin',
  }

  it('createTicket marca ov_elegida_en_app_at cuando ordenVenta no está vacía', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','X')")
    const id = await createTicket(db, { ...inputBase, ordenVenta: 'OV-1', clientId: 'cli1' })
    const r = await db.query('SELECT ov_elegida_en_app_at FROM tickets WHERE id=$1', [id])
    expect(r.rows[0].ov_elegida_en_app_at).not.toBeNull()
  })

  it('createTicket NO marca cuando ordenVenta viene vacía o null', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli2','Y')")
    const id = await createTicket(db, { ...inputBase, ordenVenta: null, clientId: 'cli2' })
    const r = await db.query('SELECT ov_elegida_en_app_at FROM tickets WHERE id=$1', [id])
    expect(r.rows[0].ov_elegida_en_app_at).toBeNull()
  })

  it('writeTransition (habilitar_servicio) marca cuando plan.columns fija orden_venta no vacía', async () => {
    await upsertTicket(db, zTicket('1', 5, 'OV asignada'))
    await applyTransition(
      db, '1', 'OV asignada',
      { id: 'habilitar_servicio', name: 'Habilitar Servicio', area: 'Comercial' },
      { status: 'Ingresado', statusType: 'Open', columns: { orden_venta: 'OV-9' }, customFields: {} },
      'Equipo Técnico', {},
    )
    const r = await db.query('SELECT ov_elegida_en_app_at FROM tickets WHERE id=$1', ['1'])
    expect(r.rows[0].ov_elegida_en_app_at).not.toBeNull()
  })

  it('writeTransition NO marca cuando plan.columns.orden_venta viene vacía', async () => {
    await upsertTicket(db, zTicket('1', 5, 'OV asignada'))
    await applyTransition(
      db, '1', 'OV asignada',
      { id: 'habilitar_servicio', name: 'Habilitar Servicio', area: 'Comercial' },
      { status: 'Ingresado', statusType: 'Open', columns: { orden_venta: '' }, customFields: {} },
      'Equipo Técnico', {},
    )
    const r = await db.query('SELECT ov_elegida_en_app_at FROM tickets WHERE id=$1', ['1'])
    expect(r.rows[0].ov_elegida_en_app_at).toBeNull()
  })

  it('writeTransition NO marca cuando plan.columns no incluye orden_venta', async () => {
    await upsertTicket(db, zTicket('1', 5, 'OV asignada'))
    await applyTransition(
      db, '1', 'OV asignada',
      { id: 'aprobacion', name: 'Aprobación', area: 'Comercial' },
      { status: 'En Proceso', statusType: 'Open', columns: {}, customFields: {} },
      'Equipo Técnico', {},
    )
    const r = await db.query('SELECT ov_elegida_en_app_at FROM tickets WHERE id=$1', ['1'])
    expect(r.rows[0].ov_elegida_en_app_at).toBeNull()
  })
})

/**
 * parche-iv11-orden-venta (RQ-ZS-01) · remediación del verify: `salesorder_id` queda fuera de
 * `TICKET_COLS` desde antes de este parche (se añadió por `ALTER`, `schema.sql:187`) y por eso el
 * upsert del sync nunca la toca, con marca o sin ella. Cierto por construcción según el
 * verify-report (WARNING 1); esta prueba lo fija contra regresión con una pasada REAL de
 * `upsertTicket`, no sólo leyendo la lista.
 */
describe('parche-iv11-orden-venta · salesorder_id no cambia en una pasada de upsertTicket (RQ-ZS-01, remediación verify)', () => {
  it('con la marca puesta, salesorder_id sobrevive a una pasada del sync y no está en TICKET_COLS', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-APP' })
    await db.query("UPDATE tickets SET ov_elegida_en_app_at = now(), salesorder_id = 'SO-APP' WHERE id='1'")
    await upsertTicket(db, { ...zTicket('1', 941), orden_venta: 'OV-ZOHO' })
    const r = await getTicketRow(db, '1')
    expect(r!.salesorder_id).toBe('SO-APP')
    expect(TICKET_COLS as readonly string[]).not.toContain('salesorder_id')
  })
})

/**
 * blueprint-soporte-remoto (F1B-06, cambio 2 · RQ-TC-06, RQ-TC-07, RQ-SR-04, RQ-SR-11) · el escritor único
 * `createTicket` decide el estado de nacimiento con `estadoInicialDelAlta` (shared) y la fila y la foto #1
 * salen de la MISMA constante. `modalidad` es columna propia: fuera de `TICKET_COLS`, el sync no la pisa.
 */
describe('createTicket · nacimiento por clasificación y modalidad (F1B-06, cambio 2)', () => {
  const base = {
    subject: 'Soporte', codigoServicio: 'SR_1', tipoServicio: 'Soporte', equipo: 'Monitor', marca: 'Grimm', modelo: 'EDM180C',
    serial: '18A20070', ordenVenta: null, priority: null, clientId: 'c1', salesorderId: null, equipoId: 'eq1', actor: 'Admin',
  }
  const valores = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>
  const leer = async (id: string) => ({
    fila: (await db.query('SELECT status, modalidad FROM tickets WHERE id=$1', [id])).rows[0],
    foto: (await db.query('SELECT transition_id, from_status, to_status, area, values FROM ticket_transitions WHERE ticket_id=$1', [id])).rows,
  })

  it('un alta de Soporte remoto con modalidad «en sitio» nace en Solicitud Soporte: fila, foto #1 y values.modalidad', async () => {
    const id = await createTicket(db, { ...base, classification: 'Soporte remoto', modalidad: 'en sitio' })
    const { fila, foto } = await leer(id)
    expect(fila).toMatchObject({ status: 'Solicitud Soporte', modalidad: 'en sitio' })
    expect(foto).toHaveLength(1)
    expect(foto[0]).toMatchObject({ transition_id: 'enviar', from_status: '(creación)', to_status: 'Solicitud Soporte', area: 'Comercial' })
    expect(valores(foto[0].values).modalidad).toBe('en sitio')
  })

  it('Soporte remoto sin modalidad (null): columna NULL y values SIN la clave; «soporte remoto» normalizado nace igual', async () => {
    const a = await createTicket(db, { ...base, classification: 'Soporte remoto', modalidad: null })
    const la = await leer(a)
    expect(la.fila).toMatchObject({ status: 'Solicitud Soporte', modalidad: null })
    expect(Object.keys(valores(la.foto[0].values))).not.toContain('modalidad')
    const b = await createTicket(db, { ...base, classification: ' soporte remoto ' })
    expect((await leer(b)).fila.status).toBe('Solicitud Soporte')
  })

  // REGRESIÓN (requisito 1 de supervisión): las otras dos clasificaciones nacen EXACTAMENTE como hoy.
  it.each(['Equipo nuevo', 'Equipo para servicio de mantenimiento'])('%s nace en Ticket creado, modalidad NULL, values sin la clave, y nunca en OV asignada', async (clasificacion) => {
    const id = await createTicket(db, { ...base, classification: clasificacion })
    const { fila, foto } = await leer(id)
    expect(fila).toMatchObject({ status: 'Ticket creado', modalidad: null })
    expect(foto).toHaveLength(1)
    expect(foto[0]).toMatchObject({ transition_id: 'enviar', from_status: '(creación)', to_status: 'Ticket creado', area: 'Comercial' })
    expect(Object.keys(valores(foto[0].values))).not.toContain('modalidad')
    expect(fila.status).not.toBe('OV asignada')
  })

  // pg-mem NO revierte un ROLLBACK (`transaccion.test.ts:25`): la atomicidad se prueba por la secuencia de verbos.
  it('si falla el segundo INSERT de un alta de soporte remoto: BEGIN, INSERT ticket, INSERT foto (falla), ROLLBACK, sin COMMIT', async () => {
    const pool = db as unknown as { query: Queryable['query']; connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
    const verbos: string[] = []
    const envuelto = {
      query: pool.query.bind(pool),
      connect: async () => {
        const c = await pool.connect()
        return {
          query: ((sql: string, p?: unknown[]) => {
            verbos.push(/INSERT INTO ticket_transitions/.test(sql) ? 'INSERT foto' : /INSERT INTO tickets/.test(sql) ? 'INSERT ticket' : sql.trim().split(/s+/)[0])
            return /INSERT INTO ticket_transitions/.test(sql) ? Promise.reject(new Error('fallo forzado')) : c.query(sql, p)
          }) as Queryable['query'],
          release: () => c.release(),
        }
      },
    } as unknown as Queryable
    await expect(createTicket(envuelto, { ...base, classification: 'Soporte remoto', modalidad: 'remoto' })).rejects.toThrow('fallo forzado')
    expect(verbos).toEqual(['BEGIN', 'INSERT ticket', 'INSERT foto', 'ROLLBACK'])
  })

  it('modalidad está fuera de TICKET_COLS y de PROMOTED_COLUMNS', () => {
    expect(TICKET_COLS as readonly string[]).not.toContain('modalidad')
    expect(PROMOTED_COLUMNS.map((p) => p.col)).not.toContain('modalidad')
  })

  // Una fila NO gestionada por la app (`managed_by_app = false`), que es la que el sync sí reescribe: con una
  // gestionada `upsertTicket` se abstiene entera y la prueba no probaría nada. El asunto cambia = el upsert corrió.
  it('una pasada real del sync sobre una fila no gestionada reescribe el asunto y NO pisa la modalidad', async () => {
    await upsertTicket(db, { ...zTicket('z-sr', 960, 'Solicitud Soporte'), classification: 'Soporte remoto', subject: 'Asunto de Zoho v1' })
    await db.query("UPDATE tickets SET modalidad = 'en sitio' WHERE id = 'z-sr'")
    await upsertTicket(db, { ...zTicket('z-sr', 960, 'Solicitud Soporte'), classification: 'Soporte remoto', subject: 'Asunto de Zoho v2' })
    const r = (await db.query("SELECT subject, modalidad, managed_by_app FROM tickets WHERE id = 'z-sr'")).rows[0]
    expect(r).toEqual({ subject: 'Asunto de Zoho v2', modalidad: 'en sitio', managed_by_app: false })
  })
})
