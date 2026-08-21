import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { upsertEquipo, searchEquipos, getEquipo, countEquipos, type EquipoRow } from './equipos'
import { createEquipo, updateEquipo, setEquipoActive, listEquiposManage, getEquipoFull } from './equipos'
import { getEquipoHistorial } from './equipos'
import type { EntradaHojaDeVida, HistorialTicket } from '@ambientalia/shared'
import { FROM_STATUS_CREACION } from '@ambientalia/shared'

// Filas al estilo de las que dejó la carga inicial: `client_id` NULL y el cliente solo como texto.
// Siguen siendo la mayoría en producción, así que los tests deben seguir cubriéndolas.
const rows: EquipoRow[] = [
  { id: 'eq-corola', serial: '85HHP0N0', marca: 'Horiba', modelo: 'APMA-370', tipo: 'Analizador de Monóxido de Carbono (CO)', cliente_nombre: 'Corola Ambiental S.A.S.', source: 'seed', raw: null },
  { id: 'eq-gecelca', serial: '18A22052', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor de Material Particulado PM10/PM2.5', cliente_nombre: 'Gecelca S.A. E.S.P.', source: 'seed', raw: null },
]

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('equipos repo', () => {
  it('upsert + búsqueda por serie/cliente/tipo + count', async () => {
    for (const r of rows) await upsertEquipo(db, r)
    expect(await countEquipos(db)).toBe(2)
    expect((await searchEquipos(db, '85HHP')).map((e) => e.serial)).toEqual(['85HHP0N0'])
    expect((await searchEquipos(db, 'gecelca')).map((e) => e.marca)).toEqual(['Grimm'])
    expect((await searchEquipos(db, 'monóxido')).length).toBe(1)
    const e = await getEquipo(db, rows[0].id)
    expect(e).toMatchObject({ serial: '85HHP0N0', tipo: 'Analizador de Monóxido de Carbono (CO)', clienteNombre: 'Corola Ambiental S.A.S.' })
  })

  it('upsert es idempotente (mismo id no duplica)', async () => {
    await upsertEquipo(db, rows[0])
    await upsertEquipo(db, rows[0])
    expect(await countEquipos(db)).toBe(1)
  })

  /**
   * El selector de equipo del formulario de ticket se acota al cliente elegido, y desde la
   * reconciliación de `client_id` (2026-08-09) esa acotación es **solo el id**.
   *
   * Antes se cruzaba además por contención del nombre en los dos sentidos, porque la carga inicial
   * dejó ~352 equipos con `client_id` NULL y el cliente como texto libre. Ese apaño ya no hace falta
   * —el backfill enlazó el 96,6 %— y tenía un coste que este test fija: la contención por texto metía
   * equipos de OTRO cliente en cuanto los nombres compartían un fragmento.
   */
  it('searchEquipos acota al cliente SOLO por client_id; sin cliente devuelve todos', async () => {
    const conId = (serial: string, cliente: string, clientId: string) =>
      createEquipo(db, { serial, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: cliente, clientId, modeloId: null })

    const suyo = await conId('18A0001', 'Ambientalia S.A.S.', 'cli-amb')
    await conId('18A0002', 'AGQ Colombia S.A.S.', 'cli-agq')
    // Comparte fragmento de nombre con el cliente buscado pero es de otro: el cruce por texto lo
    // colaba, y colar el equipo de un cliente ajeno es peor que no encontrar el propio.
    await conId('18A0003', 'Ambientalia del Caribe S.A.S.', 'cli-caribe')
    // Sin `client_id`: lo que dejó la carga inicial. Ya NO aparece al acotar por cliente — es el
    // precio de la simplificación, y por eso hubo que rellenar `client_id` antes de hacerla.
    await upsertEquipo(db, { id: 'e-sin-id', serial: '18A0004', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', cliente_nombre: 'Ambientalia S.A.S.', source: 'seed', raw: null })
    // El id buscado es PREFIJO de este otro. Fija que la acotación compara identidad y no texto: con
    // un LIKE en vez de `=` este equipo se colaría, y los ids de Books son numéricos largos y
    // parecidos entre sí (`2251824000016870091` / `2251824000017370011`), justo donde eso pasaría.
    await conId('18A0005', 'Ambientalia Dos S.A.S.', 'cli-amb-2')

    expect((await searchEquipos(db, '18A', 'cli-amb')).map((e) => e.id)).toEqual([suyo])

    // Sin cliente → todos (la salida de emergencia del formulario sigue intacta, y es lo que hace
    // alcanzables los equipos a los que aún les falte el `client_id`).
    expect((await searchEquipos(db, '18A')).length).toBe(5)
  })
})

describe('equipos CRUD (Subsistema F)', () => {
  it('create (id propio + client_id), getFull, y aparece en searchEquipos', async () => {
    const id = await createEquipo(db, { serial: 'NEW1', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'cli1', modeloId: null })
    expect(id).toMatch(/^eq-/)
    expect(await getEquipoFull(db, id)).toMatchObject({ serial: 'NEW1', marca: 'Grimm', active: true, clientId: 'cli1', clienteNombre: 'ACME' })
    expect((await searchEquipos(db, 'NEW1')).length).toBe(1)
  })

  it('desactivar lo saca de searchEquipos pero sigue en listEquiposManage', async () => {
    const id = await createEquipo(db, { serial: 'NEW2', marca: 'Horiba', modelo: 'APMA', tipo: 'CO', clienteNombre: 'X', clientId: 'cli1', modeloId: null })
    await setEquipoActive(db, id, false)
    expect((await searchEquipos(db, 'NEW2')).length).toBe(0)
    expect((await listEquiposManage(db, 'NEW2')).map((e) => e.active)).toEqual([false])
  })

  it('update cambia campos y reconcilia cliente', async () => {
    const id = await createEquipo(db, { serial: 'NEW3', marca: 'Grimm', modelo: 'm', tipo: 'Monitor', clienteNombre: 'Viejo', clientId: null, modeloId: null })
    await updateEquipo(db, id, { tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
    expect(await getEquipoFull(db, id)).toMatchObject({ tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
  })
})

async function insTicket(id: string, number: number, serial: string | null, equipoId: string | null, status: string, creado = 'now()') {
  await db.query(
    `INSERT INTO tickets (id,number,subject,status,status_type,serial,equipo_id,created_time) VALUES ($1,$2,$3,$4,'Open',$5,$6,${creado})`,
    [id, number, `Ticket ${number}`, status, serial, equipoId],
  )
}

/** Los tickets de la cronología, en orden. Casi todas las aserciones miran justo esto. */
const etapasDe = (t: HistorialTicket) => t.pasos.flatMap((p) => (p.clase === 'etapa' ? [p.etapa] : []))
const remisionesDe = (t: HistorialTicket) => t.pasos.flatMap((p) => (p.clase === 'remision' ? [p.remision] : []))
const soloTickets = (h: { cronologia: EntradaHojaDeVida[] }) =>
  h.cronologia.flatMap((e) => (e.clase === 'ticket' ? [e.ticket] : []))

describe('getEquipoHistorial', () => {
  it('empareja por equipo_id y por serial, agrupa transiciones', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-1', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1', modeloId: null })
    await insTicket('app-1', 901, 'SN-1', eqId, 'Ingresado')
    await insTicket('zoho-1', 303, 'SN-1', null, 'Finalizado')
    await insTicket('otro-1', 500, 'SN-X', null, 'Ingresado')
    await db.query(`INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at) VALUES ('app-1','Habilitar Servicio','OV asignada','Ingresado','Comercial','Admin',now())`)
    const h = await getEquipoHistorial(db, eqId)
    expect(h).not.toBeNull()
    expect(h!.equipo.serial).toBe('SN-1')
    expect(soloTickets(h!).map((t) => t.id).sort()).toEqual(['app-1', 'zoho-1'])
    const app1 = soloTickets(h!).find((t) => t.id === 'app-1')!
    expect(app1.number).toBe('#901')
    expect(etapasDe(app1).map((x) => x.transitionName)).toEqual(['Habilitar Servicio'])
  })

  it('empareja históricos por el serial dentro del asunto (token), sin falsos positivos', async () => {
    const eqId = await createEquipo(db, { serial: '18A19042', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'CHEMILAB', clientId: 'c1', modeloId: null })
    // histórico de Zoho: serial/codigo_servicio NULL; el serial vive en el asunto.
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('h1',190,'Servicio Técnico CHEMILAB GRIMM EDM 180C MT_18A19042_EDM180C_260305','Finalizado','Closed',now())`)
    // falso positivo: el serial es subcadena de uno más largo (18A190420) → NO debe entrar.
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('h2',191,'Servicio MT_18A190420_EDM180C_260305','Ingresado','Open',now())`)
    const h = await getEquipoHistorial(db, eqId)
    expect(soloTickets(h!).map((t) => t.id)).toEqual(['h1'])
  })

  // `(creación)` es el centinela que marca la foto de creación, no un estado. Los otros dos lectores
  // lo reconocen con `esCreacion` y lo cuentan aparte; sin esto, la hoja de vida enseñaba al usuario
  // "Enviar · (creación) → OV asignada", que es un literal interno asomando por la interfaz.
  it('la fila de creación se cuenta como creación, no como una transición genérica', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-C', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1', modeloId: null })
    await insTicket('app-c', 1000001, 'SN-C', eqId, 'OV asignada')
    await db.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at)
       VALUES ('app-c','Enviar',$1,'OV asignada','Comercial','Administrador','2026-08-03T10:00:00Z'),
              ('app-c','Habilitar','OV asignada','Ingresado','Comercial','Administrador','2026-08-04T10:00:00Z')`,
      [FROM_STATUS_CREACION],
    )
    const h = await getEquipoHistorial(db, eqId)
    const t = soloTickets(h!)[0]
    expect(etapasDe(t).map((x) => [x.transitionName, x.fromStatus, x.toStatus])).toEqual([
      ['Ticket creado', null, null],
      ['Habilitar', 'OV asignada', 'Ingresado'],
    ])
  })

  it('devuelve null si el equipo no existe', async () => {
    expect(await getEquipoHistorial(db, 'eq-nope')).toBeNull()
  })
})

/** Remisión de la hoja de vida: por defecto vigente, de la app y sin ticket. */
function insRemision(o: {
  id: string; creada: string; equipoId?: string | null; serial?: string | null; ticketId?: string | null
  origen?: string; anulada?: boolean; resultado?: unknown; fecha?: string
}) {
  return db.query(
    `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,equipo_id,serial,incluye,observaciones,
                             creado_por,estado,empresa,origen,resultado,created_at,anulada_at,anulada_por)
     VALUES ($1,$2,'entrada',$3,'Calibración',$4,$5,'["cabezal","tubo"]'::jsonb,'Ingresa sin sensor.',
             'Julián Maya','ok','Gecelca S.A. E.S.P.',$6,$7,$8,${o.anulada ? "now(),'Admin'" : 'NULL,NULL'})`,
    [o.id, o.ticketId ?? null, o.fecha ?? '2026-08-04', o.equipoId ?? null, o.serial ?? null,
      o.origen ?? 'app', o.resultado === undefined ? null : JSON.stringify(o.resultado), o.creada],
  )
}

describe('getEquipoHistorial · las remisiones en la cronología', () => {
  /**
   * El técnico que recibe un Grimm quiere ver todo lo que pasó con ese número de serie, en orden. La
   * cronología ordena los TICKETS de más reciente a más antiguo, y cada remisión va dentro del suyo:
   * recibir el equipo es un paso del servicio, no un suceso de otro rango.
   */
  it('cada remisión va dentro de su ticket, y los tickets de más reciente a más antiguo', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-M', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'Gecelca', clientId: 'c1', modeloId: null })
    await insTicket('t-viejo', 94112, 'SN-M', eqId, 'Finalizado', "'2024-10-03T09:00:00Z'")
    await insRemision({ id: 'rem-vieja', equipoId: eqId, ticketId: 't-viejo', creada: '2024-10-03T08:00:00Z' })
    await insTicket('t-nuevo', 100042, 'SN-M', eqId, 'Ingresado', "'2026-08-06T10:00:00Z'")
    await insRemision({ id: 'rem-nueva', equipoId: eqId, ticketId: 't-nuevo', creada: '2026-08-06T11:00:00Z' })

    const h = await getEquipoHistorial(db, eqId)

    expect(h!.cronologia.map((e) => (e.clase === 'ticket' ? e.ticket.id : e.remision.id)))
      .toEqual(['t-nuevo', 't-viejo'])
    expect(remisionesDe(soloTickets(h!)[0]).map((r) => r.id)).toEqual(['rem-nueva'])
    expect(remisionesDe(soloTickets(h!)[1]).map((r) => r.id)).toEqual(['rem-vieja'])
  })

  // La misma simetría que ya tienen los tickets. El histórico importado resolvió `equipo_id` cruzando
  // por serial, pero las 3 filas que no casaron con ningún equipo lo tienen NULL: para ésas el serial
  // es la única vía.
  it('empareja las remisiones por equipo_id y también por serial', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-S', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1', modeloId: null })
    await insRemision({ id: 'por-id', equipoId: eqId, creada: '2026-08-01T10:00:00Z' })
    await insRemision({ id: 'por-serial', serial: 'SN-S', creada: '2026-08-02T10:00:00Z' })
    await insRemision({ id: 'de-otro', serial: 'SN-OTRO', creada: '2026-08-03T10:00:00Z' })

    const h = await getEquipoHistorial(db, eqId)
    expect(h!.cronologia.map((e) => e.clase === 'remision' && e.remision.id)).toEqual(['por-serial', 'por-id'])
  })

  /**
   * De las 149 históricas, 146 tienen equipo y solo 90 tienen ticket. Esas ~56 huérfanas fueron el
   * motivo de enseñarlas antes en tarjetas sueltas; ahora se cuelgan del ticket más cercano en fecha
   * y van MARCADAS, que es la diferencia entre suponer y suponer a escondidas.
   */
  it('la que tiene ticket va a ese; la huérfana se cuelga por fecha y queda marcada', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-H', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1', modeloId: null })
    await insTicket('t-1', 777, 'SN-H', eqId, 'Ingresado', "'2026-08-05T10:00:00Z'")
    await insRemision({ id: 'con-ticket', equipoId: eqId, ticketId: 't-1', creada: '2026-08-05T11:00:00Z' })
    await insRemision({ id: 'sin-ticket', equipoId: eqId, creada: '2025-03-12T12:00:00Z', origen: 'historico' })

    const h = await getEquipoHistorial(db, eqId)
    const rems = remisionesDe(soloTickets(h!).find((t) => t.id === 't-1')!)

    // Las dos comparten el mismo día de servicio, así que empatan al ordenar y mandan en el orden en
    // que llegan. Lo que fija el test no es ese orden, sino que las dos acaban dentro del ticket.
    expect(rems.map((r) => [r.id, r.ticketNumero, r.origen, r.asociadaPorFecha])).toEqual([
      ['con-ticket', '#777', 'app', undefined],
      ['sin-ticket', null, 'historico', true],
    ])
    // La fecha que se enseña es la del SERVICIO, no el instante en que se registró.
    const conTicket = rems.find((r) => r.id === 'con-ticket')!
    expect(conTicket.fecha).toBe('2026-08-04')
    expect(conTicket.tecnico).toBe('Julián Maya')
    expect(conTicket.incluye).toEqual(['cabezal', 'tubo'])
  })

  // Misma regla que en CONVERSACIONES: la hoja de vida es el relato del equipo, y una anulada es un
  // documento que un administrador retiró de en medio. HISTORIA sigue siendo el sitio donde consta.
  it('deja fuera las remisiones anuladas', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-A', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1', modeloId: null })
    await insRemision({ id: 'vigente', equipoId: eqId, creada: '2026-08-01T10:00:00Z' })
    await insRemision({ id: 'anulada', equipoId: eqId, creada: '2026-08-02T10:00:00Z', anulada: true })

    const h = await getEquipoHistorial(db, eqId)
    expect(h!.cronologia.map((e) => e.clase === 'remision' && e.remision.id)).toEqual(['vigente'])
  })

  it('la remisión trae sus enlaces de Drive y sus fotos como adjuntos', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-F', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1', modeloId: null })
    await insRemision({ id: 'con-fotos', equipoId: eqId, creada: '2026-08-01T10:00:00Z', resultado: { pdfId: 'PDF', carpetaUrl: 'https://drive.google.com/drive/folders/CAR' } })
    await db.query(
      `INSERT INTO remision_fotos (id,remision_id,filename,content_type,content_b64,size,created_at)
       VALUES ('rf-1','con-fotos','entrada-1.jpg','image/jpeg','Zm90bw==',2048,'2026-08-01T10:01:00Z')`,
    )
    // Una histórica nunca pasó por n8n: `resultado` NULL y sin fotos. Es la mayoría del histórico.
    await insRemision({ id: 'pelada', equipoId: eqId, creada: '2025-01-01T10:00:00Z', origen: 'historico' })

    const h = await getEquipoHistorial(db, eqId)
    const rems = h!.cronologia.flatMap((e) => (e.clase === 'remision' ? [e.remision] : []))
    expect(rems[0].adjuntos).toEqual([
      { name: 'Remisión de entrada', size: 'PDF', path: 'https://drive.google.com/file/d/PDF/view', url: 'https://drive.google.com/file/d/PDF/view' },
      { name: 'Carpeta en Drive', size: 'Carpeta', path: 'https://drive.google.com/drive/folders/CAR', url: 'https://drive.google.com/drive/folders/CAR' },
      { name: 'entrada-1.jpg', size: 'Foto', path: '/api/remisiones/con-fotos/fotos/rf-1', url: '/api/remisiones/con-fotos/fotos/rf-1', isImage: true },
    ])
    expect(rems[1].adjuntos).toEqual([])
  })
})

/**
 * La hoja de vida de un equipo con años de servicio en Zoho: hasta el barrido de historia, sus
 * tickets salían aquí como tarjetas sin una sola etapa debajo, porque `ticket_transitions` solo
 * guarda lo que se hizo desde Desk. Los datos estaban en `ticket_history`, en otra forma.
 */
describe('getEquipoHistorial · etapas venidas de Zoho', () => {
  const evento = (ticketId: string, e: Record<string, unknown>, cuando: string) =>
    db.query('INSERT INTO ticket_history (id,ticket_id,event_name,event_time,raw) VALUES ($1,$2,$3,$4,$5)',
      [`h-${ticketId}-${cuando}-${String(e.eventName)}`, ticketId, String(e.eventName), new Date(cuando), JSON.stringify(e)])

  const CAMBIO = (de: string, a: string, cuando: string) => ({
    eventName: 'TicketUpdated', eventTime: cuando,
    actor: { name: ' Blueprint estado del Servicio', type: 'Blueprint' },
    eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: de, updatedValue: a } }],
    actorInfo: [{ propertyName: 'Transition', propertyValue: { id: 'tr-1', name: 'ingreso' } }],
  })
  const COMENTARIO = (cuando: string) => ({
    eventName: 'CommentAdded', eventTime: cuando,
    actor: { name: 'Equipo  Técnico ', type: 'Agent' },
    eventInfo: [
      { propertyName: 'Content', propertyValue: '<div>Equipo ingresa sin accesorios.</div>' },
      { propertyName: 'AttachmentNames', propertyValue: ['231228 - SGI.pdf'] },
    ],
    actorInfo: [{ propertyName: 'Transition', propertyValue: { id: 'tr-1', name: 'ingreso' } }],
  })
  const EJECUCION = (cuando: string) => ({
    eventName: 'BlueprintTransitionPerformed', eventTime: cuando,
    actor: { name: 'Equipo  Técnico ', type: 'Agent' },
    eventInfo: [{ propertyName: 'Transition', propertyValue: { id: 'tr-1', name: 'ingreso' } }],
    actorInfo: [],
  })

  it('un ticket de Zoho enseña sus etapas, con quién y con el comentario', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-9', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'SGI', clientId: 'c1', modeloId: null })
    await insTicket('zoho-9', 543, 'SN-9', null, 'Finalizado')
    const t = '2024-01-04T16:02:25.000Z'
    await evento('zoho-9', CAMBIO('Ingresado', 'En Proceso', t), t)
    await evento('zoho-9', EJECUCION(t), t)
    await evento('zoho-9', COMENTARIO(t), t)

    const h = await getEquipoHistorial(db, eqId)
    const [etapa] = etapasDe(soloTickets(h!).find((x) => x.id === 'zoho-9')!)

    expect(etapa).toMatchObject({
      transitionName: 'ingreso',
      fromStatus: 'Ingresado',
      toStatus: 'En Proceso',
      performedBy: 'Equipo  Técnico',
      comentario: 'Equipo ingresa sin accesorios.',
      adjuntos: ['231228 - SGI.pdf'],
    })
  })

  /**
   * Un ticket que empezó en Zoho y siguió en Desk tiene etapas de las DOS épocas. Quedarse con una
   * sola perdería media historia, y es justo el caso de los tickets que estaban vivos el día del
   * cambio de herramienta.
   */
  it('junta las etapas de Zoho con las de Desk, en orden', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-8', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'SGI', clientId: 'c1', modeloId: null })
    await insTicket('zoho-8', 544, 'SN-8', null, 'Ingresado')
    const viejo = '2024-01-04T16:02:25.000Z'
    await evento('zoho-8', CAMBIO('Ingresado', 'En Proceso', viejo), viejo)
    await db.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at)
       VALUES ('zoho-8','Aprobación','Notificación cliente','En Proceso','Comercial','Ángela',$1)`,
      [new Date('2026-08-20T10:00:00.000Z')],
    )

    const h = await getEquipoHistorial(db, eqId)
    const etapas = etapasDe(soloTickets(h!).find((x) => x.id === 'zoho-8')!)

    expect(etapas.map((e) => e.transitionName)).toEqual(['ingreso', 'Aprobación'])
  })

  // Un ticket nacido en Desk no tiene historia en Zoho: sus etapas siguen saliendo tal cual, sin que
  // la unión le añada ni le quite nada.
  it('no toca los tickets que nacieron en Desk', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-7', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'SGI', clientId: 'c1', modeloId: null })
    await insTicket('app-7', 545, 'SN-7', eqId, 'Ingresado')
    await db.query(`INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at) VALUES ('app-7','Habilitar Servicio','OV asignada','Ingresado','Comercial','Admin',now())`)

    const h = await getEquipoHistorial(db, eqId)
    const etapas = etapasDe(soloTickets(h!).find((x) => x.id === 'app-7')!)

    expect(etapas.map((e) => e.transitionName)).toEqual(['Habilitar Servicio'])
    expect(etapas[0].comentario).toBeUndefined()
  })
})

/**
 * Las remisiones van DENTRO de la tarjeta de su ticket, al mismo nivel que las etapas.
 *
 * Antes salían en tarjetas sueltas al nivel del ticket, y eso las hacía parecer otra cosa de otro
 * rango: para quien lee una hoja de vida, recibir el equipo es un paso del servicio igual que
 * diagnosticarlo.
 */
describe('getEquipoHistorial · remisiones dentro del ticket', () => {
  const insRemision = (id: string, ticketId: string, equipoId: string | null, fecha: string, origen = 'app') =>
    db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,equipo_id,serial,incluye,creado_por,estado,origen,created_at)
       VALUES ($1,$2,'entrada',$3,'Diagnóstico',$4,'SN-R','[]','Julián','ok',$5,$3)`,
      [id, ticketId, new Date(fecha), equipoId, origen],
    )

  it('la remisión de un ticket sale dentro de su tarjeta, no fuera', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-R', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'AGQ', clientId: 'c1', modeloId: null })
    await insTicket('app-r1', 970, 'SN-R', eqId, 'Por Facturar')
    await insRemision('rem-1', 'app-r1', eqId, '2026-07-15T10:00:00.000Z')

    const h = await getEquipoHistorial(db, eqId)

    // Ya no queda ninguna tarjeta de remisión al nivel del ticket.
    expect(h!.cronologia.filter((e) => e.clase === 'remision')).toEqual([])
    const ticket = soloTickets(h!).find((t) => t.id === 'app-r1')!
    expect(remisionesDe(ticket).map((r) => r.id)).toEqual(['rem-1'])
    expect(remisionesDe(ticket)[0].asociadaPorFecha).toBeUndefined()
  })

  /**
   * Las etapas y las remisiones se mezclan por fecha en una sola línea de tiempo: la remisión de
   * entrada es anterior al diagnóstico, y enseñarla detrás contaría el servicio al revés.
   */
  it('se ordenan mezcladas con las etapas, por fecha', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-R', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'AGQ', clientId: 'c1', modeloId: null })
    await insTicket('app-r2', 971, 'SN-R', eqId, 'Por Facturar')
    await insRemision('rem-2', 'app-r2', eqId, '2026-07-15T10:00:00.000Z')
    await db.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at)
       VALUES ('app-r2','Habilitar Servicio','OV asignada','Ingresado','Comercial','Ángela',$1)`,
      [new Date('2026-07-24T10:00:00.000Z')],
    )

    const h = await getEquipoHistorial(db, eqId)
    const pasos = soloTickets(h!).find((t) => t.id === 'app-r2')!.pasos

    expect(pasos.map((p) => p.clase)).toEqual(['remision', 'etapa'])
  })

  /**
   * El caso del #970: una remisión histórica cuyo número de ticket de Zoho ya no existe en la base.
   * Se enlazó al equipo por el serial y a ningún ticket, así que se cuelga de la más cercana en fecha
   * — y va MARCADA, porque si el equipo tuvo dos servicios seguidos la suposición puede ser la mala.
   */
  it('una remisión huérfana se cuelga del ticket más cercano y lo dice', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-R', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'AGQ', clientId: 'c1', modeloId: null })
    await insTicket('app-viejo', 900, 'SN-R', eqId, 'Finalizado', "'2026-01-10'")
    await insTicket('app-cerca', 970, 'SN-R', eqId, 'Por Facturar', "'2026-07-24'")
    // `ticket_id` apunta a un ticket que no existe: es lo que deja la importación cuando el número de
    // Zoho no casa con nada.
    await insRemision('rem-h', 'no-existe', eqId, '2026-07-15T10:00:00.000Z', 'historico')

    const h = await getEquipoHistorial(db, eqId)

    expect(h!.cronologia.filter((e) => e.clase === 'remision')).toEqual([])
    const cerca = soloTickets(h!).find((t) => t.id === 'app-cerca')!
    expect(remisionesDe(cerca).map((r) => r.id)).toEqual(['rem-h'])
    expect(remisionesDe(cerca)[0].asociadaPorFecha).toBe(true)
    expect(remisionesDe(soloTickets(h!).find((t) => t.id === 'app-viejo')!)).toEqual([])
  })

  /**
   * Un equipo con remisiones y sin un solo ticket en la base: no hay dónde colgarlas, así que se
   * quedan sueltas. Esconderlas sería peor que enseñarlas fuera de sitio — son lo único que consta.
   */
  it('sin tickets donde colgarla, la remisión se queda suelta', async () => {
    const eqId = await createEquipo(db, { serial: 'SN-R', marca: 'Grimm', modelo: 'EDM', tipo: 'Monitor', clienteNombre: 'AGQ', clientId: 'c1', modeloId: null })
    await insRemision('rem-sola', 'no-existe', eqId, '2026-07-15T10:00:00.000Z', 'historico')

    const h = await getEquipoHistorial(db, eqId)

    expect(h!.cronologia.filter((e) => e.clase === 'remision')).toHaveLength(1)
  })
})
