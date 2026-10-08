import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { CreateTicketInput } from '@ambientalia/zoho-sync/db/repo'
import { PREFIJO_PROVISIONAL } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'
import { exigirClienteProvisional, escribirAltaManual } from './altaManual'
import { crearTicketConEquipo, type EquipoAResolver } from './equipoNuevo'

instalarArnes()

/**
 * Alta manual de equipo y cliente desconocidos (F1B-15, lote 2a): RQ-TC-30, RQ-TC-31, RQ-TC-33, RQ-HV-16,
 * RQ-HV-17 y C-1 (en «Equipo nuevo» la fecha de factura sigue obligatoria). Arnés real: `POST /api/tickets`
 * contra pg-mem. Las pruebas de atomicidad miran la secuencia de verbos, porque pg-mem no revierte un
 * `ROLLBACK` de verdad (`services/equipoNuevo.test.ts`, Plan B de T0).
 */
const CLIENTE = { razonSocial: 'Acme Provisional SAS', nit: '800555666', contacto: 'Ana Ruiz', telefono: '3001112233', correo: 'ana@prov.co', motivo: 'Cliente nuevo, aún sin contacto en Books' }
const EQUIPO = { serial: 'SN-M1', confirmacionSerial: 'SN-M1', modeloId: 'mo-1', motivo: 'Equipo de un cliente nuevo' }
const BASE = { tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio de mantenimiento', prefijo: 'MT' }

const alta = (cookie: string, cuerpo: Record<string, unknown>, opciones: Parameters<typeof appWith>[0] = {}) =>
  request(appWith(opciones).app).post('/api/tickets').set('Cookie', cookie).send({ ...BASE, ...cuerpo })
const contar = async (tabla: string) => (await db.query(`SELECT COUNT(*)::int AS n FROM ${tabla}`)).rows[0].n as number
const nada = async () => ({ prov: await contar('public.clientes_provisionales'), equipos: await contar('equipos'), tickets: await contar('tickets') })

beforeEach(async () => {
  await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c1','Cliente Uno','900111222')")
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('ma-1','Horiba')")
  await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('ti-1','Analizador')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-1','ma-1','APSA-370','ti-1')")
})

describe('RQ-TC-30 · cliente provisional', () => {
  it('alta con cliente provisional y equipo manual: 201, nace en «Ticket creado» con las dos marcas y su traza', async () => {
    const res = await alta(await adminCookie(), { clienteManual: CLIENTE, equipoManual: EQUIPO })
    expect(res.status).toBe(201)
    const p = (await db.query('SELECT * FROM public.clientes_provisionales')).rows
    expect(p).toHaveLength(1)
    expect(p[0]).toMatchObject({ razon_social: 'Acme Provisional SAS', nit: '800555666', motivo: CLIENTE.motivo, creado_por_nombre: 'Admin', enlazado_a: null })
    expect(String(p[0].id).startsWith(PREFIJO_PROVISIONAL)).toBe(true)
    const t = (await db.query('SELECT status, client_id, equipo_id FROM tickets')).rows[0]
    expect(t).toMatchObject({ status: 'Ticket creado', client_id: p[0].id })
    const e = (await db.query('SELECT client_id, cliente_nombre, pendiente_validar, modelo, modelo_id, source FROM equipos')).rows[0]
    expect(e).toMatchObject({ client_id: p[0].id, cliente_nombre: 'Acme Provisional SAS', pendiente_validar: true, modelo: 'APSA-370', modelo_id: 'mo-1', source: 'app' })
    const traza = (await db.query("SELECT campo, valor_nuevo, usuario_nombre FROM public.equipos_cambios")).rows
    expect(traza).toEqual([{ campo: 'altaManual', valor_nuevo: EQUIPO.motivo, usuario_nombre: 'Admin' }])
    expect(res.body).toMatchObject({ company: 'Acme Provisional SAS', clienteProvisional: true })
  })

  it('soporte remoto nace en «Solicitud Soporte» con las dos marcas', async () => {
    const res = await alta(await adminCookie(), { clasificaciones: 'Soporte remoto', clienteManual: CLIENTE, equipoManual: EQUIPO })
    expect(res.status).toBe(201)
    expect((await db.query('SELECT status FROM tickets')).rows[0].status).toBe('Solicitud Soporte')
    expect((await db.query('SELECT pendiente_validar FROM equipos')).rows[0].pendiente_validar).toBe(true)
    expect(await contar('public.clientes_provisionales')).toBe(1)
  })

  it('faltan NIT y correo: 422 los nombra juntos y no se escribe nada', async () => {
    const res = await alta(await adminCookie(), { clienteManual: { ...CLIENTE, nit: '', correo: undefined }, equipoManual: EQUIPO })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('NIT')
    expect(res.body.error).toContain('correo')
    expect(res.body.error).not.toContain('razón social')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('motivo de sólo espacios: 422 y no se escribe nada', async () => {
    const res = await alta(await adminCookie(), { clienteManual: { ...CLIENTE, motivo: '   ' }, equipoManual: EQUIPO })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('motivo')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('exigirClienteProvisional · sin clienteManual devuelve null; con él, un id con prefijo único por llamada', () => {
    expect(exigirClienteProvisional({})).toBeNull()
    const a = exigirClienteProvisional({ clienteManual: CLIENTE })!
    const b = exigirClienteProvisional({ clienteManual: CLIENTE })!
    expect(a).toMatchObject({ razonSocial: 'Acme Provisional SAS', nit: '800555666', motivo: CLIENTE.motivo })
    expect(a.id.startsWith(PREFIJO_PROVISIONAL)).toBe(true)
    expect(a.id).not.toBe(b.id)
  })

  it('el id provisional no coincide con ningún id de books.contacts', async () => {
    await alta(await adminCookie(), { clienteManual: CLIENTE, equipoManual: EQUIPO })
    const id = (await db.query('SELECT id FROM public.clientes_provisionales')).rows[0].id as string
    const books = (await db.query('SELECT contact_id FROM books.contacts')).rows.map((r: { contact_id: string }) => r.contact_id)
    expect(books).toEqual(['c1'])
    expect(books).not.toContain(id)
  })

  it('un cliente de Books con equipo manual (sin provisional) también funciona, y no crea provisional', async () => {
    const res = await alta(await adminCookie(), { clientId: 'c1', equipoManual: EQUIPO })
    expect(res.status).toBe(201)
    expect(await contar('public.clientes_provisionales')).toBe(0)
    expect((await db.query('SELECT client_id, pendiente_validar FROM equipos')).rows[0]).toEqual({ client_id: 'c1', pendiente_validar: true })
  })
})

describe('RQ-HV-16 · equipo manual: serial doble comparado en el servidor', () => {
  it('serial ABC123 con confirmación ABC124: 422 y no se crea ticket, equipo ni cliente', async () => {
    const res = await alta(await adminCookie(), { clienteManual: CLIENTE, equipoManual: { ...EQUIPO, serial: 'ABC123', confirmacionSerial: 'ABC124' } })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('serial')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('el serial con espacios alrededor coincide con su confirmación (recortados)', async () => {
    const res = await alta(await adminCookie(), { clientId: 'c1', equipoManual: { ...EQUIPO, serial: ' SN-M1 ', confirmacionSerial: 'SN-M1' } })
    expect(res.status).toBe(201)
    expect((await db.query('SELECT serial FROM equipos')).rows[0].serial).toBe('SN-M1')
  })

  it('serial existente: reutiliza el equipo, equipos no gana filas y no hay traza', async () => {
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,source,active) VALUES ('eq-x','SN-M1','Horiba','APSA-370','Analizador','seed',true)")
    const res = await alta(await adminCookie(), { clientId: 'c1', equipoManual: EQUIPO })
    expect(res.status).toBe(201)
    expect(await contar('equipos')).toBe(1)
    expect((await db.query('SELECT equipo_id FROM tickets')).rows[0].equipo_id).toBe('eq-x')
    expect(await contar('public.equipos_cambios')).toBe(0)
  })

  it('modelo no catalogado con texto: se conserva tal cual, nace pendiente y deja traza', async () => {
    const equipoManual = { serial: 'SN-N1', confirmacionSerial: 'SN-N1', marca: 'Casera', modeloTexto: 'X-200 prototipo', tipo: 'Analizador', motivo: 'No está en el catálogo' }
    const res = await alta(await adminCookie(), { clientId: 'c1', equipoManual })
    expect(res.status).toBe(201)
    expect((await db.query('SELECT marca, modelo, tipo, modelo_id, pendiente_validar FROM equipos')).rows[0]).toEqual({ marca: 'Casera', modelo: 'X-200 prototipo', tipo: 'Analizador', modelo_id: null, pendiente_validar: true })
    expect((await db.query('SELECT campo, valor_nuevo FROM public.equipos_cambios')).rows).toEqual([{ campo: 'altaManual', valor_nuevo: 'No está en el catálogo' }])
  })

  it('modelo no catalogado sin texto: 422 y no se escribe nada', async () => {
    const equipoManual = { serial: 'SN-N1', confirmacionSerial: 'SN-N1', marca: 'Casera', modeloTexto: '  ', tipo: 'Analizador', motivo: 'No está' }
    const res = await alta(await adminCookie(), { clientId: 'c1', equipoManual })
    expect(res.status).toBe(422)
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('faltan serial, confirmación y motivo: 422 los nombra en la misma lista', async () => {
    const res = await alta(await adminCookie(), { clientId: 'c1', equipoManual: { modeloId: 'mo-1' } })
    expect(res.status).toBe(422)
    for (const dato of ['serial', 'confirmación', 'motivo']) expect(res.body.error).toContain(dato)
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('modeloId inexistente: 422 «Modelo no encontrado»', async () => {
    const res = await alta(await adminCookie(), { clientId: 'c1', equipoManual: { ...EQUIPO, modeloId: 'mo-no' } })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Modelo no encontrado')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })
})

describe('RQ-HV-17 y C-1 · los tres campos reservados a Comercial', () => {
  it.each([
    ['fechaFacturaCompra', '2026-01-15'],
    ['finGarantia', '2027-01-15'],
    ['mantenedorId', 'c1'],
  ])('%s en el alta manual (clasificación de servicio): 422 y no queda ninguna fila', async (campo, valor) => {
    const res = await alta(await adminCookie(), { clienteManual: CLIENTE, equipoManual: { ...EQUIPO, [campo]: valor } })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('Comercial')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('Comercial tampoco los puede mandar en el alta manual: finGarantia → 422', async () => {
    const res = await alta(await userCookie(['Comercial']), { clientId: 'c1', equipoManual: { ...EQUIPO, finGarantia: '2027-01-15' } })
    expect(res.status).toBe(422)
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('C-1 · en «Equipo nuevo» el alta manual SIN fecha de factura: 422 y no se escribe nada', async () => {
    const res = await alta(await adminCookie(), { clasificaciones: 'Equipo nuevo', clienteManual: CLIENTE, equipoManual: EQUIPO })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('fecha de factura')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('C-1 · en «Equipo nuevo» el alta manual CON fecha de factura: 201 y la fecha se guarda', async () => {
    const res = await alta(await adminCookie(), { clasificaciones: 'Equipo nuevo', clienteManual: CLIENTE, equipoManual: { ...EQUIPO, fechaFacturaCompra: '2026-01-15' } })
    expect(res.status).toBe(201)
    const e = (await db.query('SELECT fecha_factura_compra, pendiente_validar FROM equipos')).rows[0]
    expect(new Date(e.fecha_factura_compra).toISOString().slice(0, 10)).toBe('2026-01-15')
    expect(e.pendiente_validar).toBe(true)
  })

  it('C-1 · en «Equipo nuevo» la fecha de factura mal formada: 422; y finGarantia sigue reservado', async () => {
    const cookie = await adminCookie()
    const mala = await alta(cookie, { clasificaciones: 'Equipo nuevo', clientId: 'c1', equipoManual: { ...EQUIPO, fechaFacturaCompra: 'ayer' } })
    expect(mala.status).toBe(422)
    const garantia = await alta(cookie, { clasificaciones: 'Equipo nuevo', clientId: 'c1', equipoManual: { ...EQUIPO, fechaFacturaCompra: '2026-01-15', finGarantia: '2027-01-15' } })
    expect(garantia.status).toBe(422)
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('después se completan por el PATCH: Comercial pone finGarantia al equipo manual → 200 y fila de registro', async () => {
    await alta(await adminCookie(), { clientId: 'c1', equipoManual: EQUIPO })
    const id = (await db.query('SELECT id FROM equipos')).rows[0].id as string
    const res = await request(appWith().app).patch(`/api/equipos/${id}`).set('Cookie', await userCookie(['Comercial'])).send({ finGarantia: '2027-01-15' })
    expect(res.status).toBe(200)
    expect((await db.query("SELECT valor_nuevo FROM public.equipos_cambios WHERE campo = 'finGarantia'")).rows).toEqual([{ valor_nuevo: '2027-01-15' }])
  })
})

describe('RQ-TC-30/31 · provisional no se combina con cliente existente ni con orden de venta (C)', () => {
  it('provisional + clientId: 422 y no se escribe nada', async () => {
    const res = await alta(await adminCookie(), { clienteManual: CLIENTE, clientId: 'c1', equipoManual: EQUIPO })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('provisional')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('provisional + orden de venta: 422 y no se escribe nada', async () => {
    const res = await alta(await adminCookie(), { clienteManual: CLIENTE, ordenVenta: 'OV-900', equipoManual: EQUIPO })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('orden de venta')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('un provisional ya existente se reutiliza por su id en un segundo ticket, sin crear otro', async () => {
    const cookie = await adminCookie()
    await alta(cookie, { clienteManual: CLIENTE, equipoManual: EQUIPO })
    const id = (await db.query('SELECT id FROM public.clientes_provisionales')).rows[0].id as string
    const res = await alta(cookie, { clientId: id, equipoManual: { ...EQUIPO, serial: 'SN-M2', confirmacionSerial: 'SN-M2' } })
    expect(res.status).toBe(201)
    expect(await contar('public.clientes_provisionales')).toBe(1)
    expect((await db.query('SELECT DISTINCT client_id FROM tickets')).rows).toEqual([{ client_id: id }])
  })
})

describe('P3 · posición (regla de mutación 1): el contenido (C) gana a la unicidad de la OV (D)', () => {
  it('serial distinto de su confirmación + OV ya asociada a otro ticket → 422, no 409', async () => {
    await db.query("INSERT INTO tickets (id, number, subject, status, orden_venta) VALUES ('t-ov', 95001, 'Otro', 'Ticket creado', 'OV-777')")
    const res = await alta(await adminCookie(), { clientId: 'c1', ordenVenta: 'OV-777', equipoManual: { ...EQUIPO, serial: 'ABC123', confirmacionSerial: 'ABC124' } })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('serial')
  })

  it('control: con el serial coincidente, la misma OV ya usada sí da 409 (la guarda D sigue viva)', async () => {
    await db.query("INSERT INTO tickets (id, number, subject, status, orden_venta) VALUES ('t-ov', 95001, 'Otro', 'Ticket creado', 'OV-777')")
    const res = await alta(await adminCookie(), { clientId: 'c1', ordenVenta: 'OV-777', equipoManual: EQUIPO })
    expect(res.status).toBe(409)
    expect(await contar('equipos')).toBe(0)
  })
})

describe('RQ-TC-31 · atomicidad (verbos, porque pg-mem no revierte un ROLLBACK de verdad)', () => {
  interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
  function rastreador(falla?: (sql: string, n: number) => boolean) {
    const sqls: string[] = []
    let inserts = 0
    const ejecutar = async (sql: string) => {
      sqls.push(sql.trim().replace(/\s+/g, ' '))
      if (sql.trim().toUpperCase().startsWith('INSERT')) { inserts += 1; if (falla?.(sql, inserts)) throw new Error('boom') }
      return sql.includes('nextval') ? { rows: [{ n: 1 }] } : { rows: [] }
    }
    const conn: Queryable & ConPool = { query: ejecutar, connect: async () => ({ query: ejecutar, release: () => {} }) }
    return { conn, sqls, verbos: () => sqls.map((s) => s.split(' ')[0].toUpperCase()) }
  }
  const NUEVO: EquipoAResolver = {
    equipo: { id: '', serial: 'SN-X', marca: 'Horiba', modelo: 'APSA-370', tipo: 'Analizador' },
    datos: { serial: 'SN-X', marca: 'Horiba', modelo: 'APSA-370', tipo: 'Analizador', modeloId: 'mo-1', pendienteValidar: true },
  }
  const INPUT: CreateTicketInput = {
    subject: 'x', codigoServicio: null, classification: null, tipoServicio: null, equipo: null, marca: null, modelo: null,
    serial: 'SN-X', ordenVenta: null, priority: null, clientId: 'prov-1', salesorderId: null, equipoId: null, actor: 'Admin',
  }
  const MANUAL = { cliente: { id: 'prov-1', razonSocial: 'Acme', nit: '1', contacto: 'a', telefono: '2', correo: 'c', motivo: 'm' }, motivoEquipo: 'sin catálogo', actor: { id: 'u1', nombre: 'Admin' } }

  it('todo bien: provisional, equipo, traza y ticket caen en un único BEGIN…COMMIT', async () => {
    const { conn, sqls, verbos } = rastreador()
    await crearTicketConEquipo(conn, NUEVO, 'Acme', INPUT, MANUAL)
    expect(verbos()[0]).toBe('BEGIN')
    expect(verbos().at(-1)).toBe('COMMIT')
    const tablas = sqls.filter((s) => s.startsWith('INSERT')).map((s) => /INSERT INTO ([\w.]+)/.exec(s)![1])
    expect(tablas.slice(0, 3)).toEqual(['public.clientes_provisionales', 'equipos', 'public.equipos_cambios'])
    expect(tablas).toContain('tickets')
  })

  it('TC-31c · si el INSERT del ticket falla: ROLLBACK, ningún COMMIT, y las tres escrituras previas quedaron dentro de la transacción', async () => {
    const { conn, sqls, verbos } = rastreador((sql) => /INSERT INTO tickets/.test(sql.replace(/\s+/g, ' ')))
    await expect(crearTicketConEquipo(conn, NUEVO, 'Acme', INPUT, MANUAL)).rejects.toThrow('boom')
    expect(verbos()[0]).toBe('BEGIN')
    expect(verbos().at(-1)).toBe('ROLLBACK')
    expect(verbos()).not.toContain('COMMIT')
    expect(sqls.filter((s) => s.startsWith('INSERT'))).toHaveLength(4)
  })

  it('escribirAltaManual · sin cliente nuevo ni equipo nuevo no escribe nada y devuelve el equipo del ticket', async () => {
    const { conn, sqls } = rastreador()
    const id = await escribirAltaManual(conn, { cliente: null, motivoEquipo: null, actor: { id: 'u1', nombre: 'Admin' } }, null, 'Cliente', INPUT.clientId, 'eq-9')
    expect(id).toBe('eq-9')
    expect(sqls).toEqual([])
  })
})

describe('RQ-TC-33 · nada se escribe en Zoho ni en books.*', () => {
  /** Envuelve el pool (y los clientes de sus transacciones) para anotar cada sentencia. */
  function espiar(real: Queryable) {
    const sqls: string[] = []
    const envolver = (q: Queryable['query']): Queryable['query'] => ((sql: string, p?: unknown[]) => { sqls.push(sql.replace(/\s+/g, ' ')); return q.call(real, sql, p) }) as Queryable['query']
    const pool = real as unknown as ConPoolReal
    const espia = {
      query: envolver(real.query.bind(real)),
      connect: async () => { const c = await pool.connect(); return { query: envolver(c.query.bind(c)), release: () => c.release() } },
    }
    return { espia: espia as unknown as Queryable, sqls }
  }
  interface ConPoolReal { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }

  it('alta manual con provisional y equipo: cero llamadas a Zoho y ninguna sentencia de escritura sobre books.*', async () => {
    const { espia, sqls } = espiar(db)
    const { app, zohoFetch, sync } = appWith({}, espia)
    const res = await request(app).post('/api/tickets').set('Cookie', await adminCookie()).send({ ...BASE, clienteManual: CLIENTE, equipoManual: EQUIPO })
    expect(res.status).toBe(201)
    expect(sqls.some((s) => /^INSERT INTO public\.clientes_provisionales/.test(s))).toBe(true)
    expect(sqls.filter((s) => /^(INSERT|UPDATE|DELETE)/i.test(s) && /\bbooks\./i.test(s))).toEqual([])
    expect(zohoFetch).toHaveBeenCalledTimes(0)
    for (const f of Object.values(sync)) expect(f).toHaveBeenCalledTimes(0)
  })
})

describe('P-B · RQ-TC-30 «El NIT ya está en Books»: 409 con los candidatos (escalón D)', () => {
  const conNit = (nit: string, extra: Record<string, unknown> = {}) => alta(adminCookiePromesa, { clienteManual: { ...CLIENTE, nit }, equipoManual: EQUIPO, ...extra })
  let adminCookiePromesa = ''
  beforeEach(async () => { adminCookiePromesa = await adminCookie() })

  it('NIT tecleado «900123456» y Books «900.123.456-7»: 409 con { id, name } del contacto y nada escrito', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-nit','Laboratorio Existente','900.123.456-7')")
    const res = await conNit('900123456')
    expect(res.status).toBe(409)
    expect(res.body.candidatos).toEqual([{ id: 'c-nit', name: 'Laboratorio Existente' }])
    expect(res.body.error).toContain('Laboratorio Existente')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('un NIT que no casa con ninguno de Books: el alta sigue (201)', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-nit','Laboratorio Existente','900.123.456-7')")
    expect((await conNit('800555666')).status).toBe(201)
  })

  it('el NIT sigue siendo obligatorio: sin NIT, 422 y no 409', async () => {
    const res = await conNit('')
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('NIT')
  })

  it('varios contactos con el mismo NIT: el 409 devuelve TODOS, por nombre y luego por id, sea cual sea el orden de inserción', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-9','Zeta Sucursal','900123456'), ('c-2','Alfa Sucursal','900.123.456-7'), ('c-1','Alfa Sucursal','900 123 456')")
    const res = await conNit('900123456')
    expect(res.status).toBe(409)
    expect(res.body.candidatos).toEqual([
      { id: 'c-1', name: 'Alfa Sucursal' }, { id: 'c-2', name: 'Alfa Sucursal' }, { id: 'c-9', name: 'Zeta Sucursal' },
    ])
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('guarda del vacío, lado tecleado: «---» con un contacto de Books de NIT «---» NO casa (201)', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-g','Guion','---')")
    expect((await conNit('---')).status).toBe(201)
  })

  it('guarda del vacío, lado de Books: contactos con NIT vacío, nulo o sin dígitos NO bloquean un alta «---» (201)', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-v','Vacio',''), ('c-n','Nulo',NULL), ('c-s','Sin digitos','N/A')")
    expect((await conNit('---')).status).toBe(201)
  })

  it('P5 · posición frente al último guardia de C: serial distinto + NIT ya en Books → 422 del serial, no 409', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-nit','Laboratorio Existente','900.123.456-7')")
    const res = await conNit('900123456', { equipoManual: { ...EQUIPO, serial: 'ABC123', confirmacionSerial: 'ABC124' } })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('serial')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('un provisional con orden de venta ya usada y NIT en Books: 422 de C (no combina provisional con OV) y nada escrito', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-nit','Laboratorio Existente','900.123.456-7')")
    await db.query("INSERT INTO tickets (id, number, subject, status, orden_venta) VALUES ('t-ov', 95001, 'Otro', 'Ticket creado', 'OV-777')")
    const res = await conNit('900123456', { ordenVenta: 'OV-777' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('orden de venta')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 1 })
  })
})

describe('POSICIÓN (regla de mutación 1) · el 422 de datos que faltan del provisional (A) gana al contenido del equipo (C)', () => {
  // Las dos guardas pueden activarse a la vez en una petición real: el formulario manda cliente y equipo manuales
  // juntos, y quien lo rellena a prisa deja un dato del cliente en blanco Y se equivoca al repetir el serial.
  it('cliente manual sin NIT + serial distinto de su confirmación → 422 de los datos que faltan, no el del serial, y nada escrito', async () => {
    const sinNit = { ...CLIENTE, nit: '' }
    const res = await alta(await adminCookie(), { clienteManual: sinNit, equipoManual: { ...EQUIPO, serial: 'ABC123', confirmacionSerial: 'ABC124' } })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('Faltan datos del cliente provisional')
    expect(res.body.error).not.toContain('serial')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })
})

describe('RQ-TC-57 · NIT exentos (public.nit_exentos): el 409 de NIT en Books no se aplica a la lista, y sólo a ella', () => {
  const EXENTO = '222222222222'; let cookie = ''
  const conNit = async (nit: string, extra: Record<string, unknown> = {}, opciones: Parameters<typeof appWith>[0] = {}, dbPropia?: Queryable) =>
    request(appWith(opciones, dbPropia).app).post('/api/tickets').set('Cookie', cookie).send({ ...BASE, clienteManual: { ...CLIENTE, nit }, equipoManual: EQUIPO, ...extra })
  beforeEach(async () => {
    cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-cf','Consumidor Final SA','222222222222'), ('c-nit','Laboratorio Existente','900.123.456-7')")
  })

  it('el NIT exento sin formato, con Books que lo tiene: 201 y existen el provisional y el ticket', async () => {
    const res = await conNit(EXENTO)
    expect(res.status).toBe(201)
    expect(await contar('public.clientes_provisionales')).toBe(1)
    expect(await contar('tickets')).toBe(1)
  })

  it.each([['222.222.222.222'], ['222 222 222 222'], ['222222222222-2']])('el NIT exento con formato «%s» también: 201', async (nit) => {
    expect((await conNit(nit)).status).toBe(201)
  })

  it('dos provisionales con el mismo NIT exento se permiten (S-2)', async () => {
    expect((await conNit(EXENTO)).status).toBe(201)
    expect((await conNit(EXENTO, { equipoManual: { ...EQUIPO, serial: 'SN-M2', confirmacionSerial: 'SN-M2' } })).status).toBe(201)
    expect(await contar('public.clientes_provisionales')).toBe(2)
  })

  it('un NIT no exento repetido en Books sigue dando 409 con candidatos y nada escrito', async () => {
    const res = await conNit('900123456')
    expect(res.status).toBe(409)
    expect(res.body.candidatos).toEqual([{ id: 'c-nit', name: 'Laboratorio Existente' }])
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('fila inactiva: vuelve el 409 con candidatos', async () => {
    await db.query("UPDATE public.nit_exentos SET activo = false WHERE nit = '222222222222'")
    const res = await conNit(EXENTO)
    expect(res.status).toBe(409)
    expect(res.body.candidatos).toEqual([{ id: 'c-cf', name: 'Consumidor Final SA' }])
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('lista vacía: vuelve el 409 con candidatos', async () => {
    await db.query('DELETE FROM public.nit_exentos')
    const res = await conNit(EXENTO)
    expect(res.status).toBe(409)
    expect(res.body.candidatos).toEqual([{ id: 'c-cf', name: 'Consumidor Final SA' }])
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('base más dígito SIN guion contra Books con guion: sigue el 409 (comportamiento conocido, riesgo 1 de la propuesta)', async () => {
    await db.query("INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ('c-dv','Con digito','222222222222-2')")
    await db.query("DELETE FROM books.contacts WHERE contact_id = 'c-cf'")
    const res = await conNit('2222222222222')
    expect(res.status).toBe(409)
    expect(res.body.candidatos).toEqual([{ id: 'c-dv', name: 'Con digito' }])
  })

  // Posición (regla de mutación 1): la exención vive en D y no salta ninguna guarda de A, B ni C. Nacen verdes: son guardas.
  it('posición · exento + serial distinto de su confirmación → 422 del serial, no 201', async () => {
    const res = await conNit(EXENTO, { equipoManual: { ...EQUIPO, serial: 'ABC123', confirmacionSerial: 'ABC124' } })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('serial')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('posición · exento sin correo → 422 de A (datos que faltan), no 201', async () => {
    const res = await conNit(EXENTO, { clienteManual: { ...CLIENTE, nit: EXENTO, correo: undefined } })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('correo')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  it('posición · exento + clientId → 422 de C (un provisional no se combina con un cliente existente)', async () => {
    const res = await conNit(EXENTO, { clientId: 'c1' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('cliente existente')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })

  // Lectura: base espía propia que anota las sentencias (molde de RQ-TC-33, local a su describe).
  function espiar(real: Queryable) {
    const sqls: string[] = []
    const envolver = (q: Queryable['query']): Queryable['query'] => ((sql: string, p?: unknown[]) => { sqls.push(sql.replace(/\s+/g, ' ')); return q.call(real, sql, p) }) as Queryable['query']
    const pool = real as unknown as { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
    const espia = { query: envolver(real.query.bind(real)), connect: async () => { const c = await pool.connect(); return { query: envolver(c.query.bind(c)), release: () => c.release() } } }
    return { espia: espia as unknown as Queryable, sqls }
  }

  it('lectura · un alta sin cliente manual NO consulta public.nit_exentos', async () => {
    const { espia, sqls } = espiar(db)
    const res = await request(appWith({}, espia).app).post('/api/tickets').set('Cookie', cookie).send({ ...BASE, clientId: 'c1', equipoManual: { ...EQUIPO, serial: 'SN-M3', confirmacionSerial: 'SN-M3' } })
    expect(res.status).toBe(201)
    expect(sqls.filter((s) => /nit_exentos/.test(s))).toEqual([])
  })

  it('lectura · con NIT exento se lee la lista y NO se consultan los contactos de Books', async () => {
    const { espia, sqls } = espiar(db)
    const res = await conNit(EXENTO, {}, {}, espia)
    expect(res.status).toBe(201)
    expect(sqls.filter((s) => /FROM public\.nit_exentos/.test(s))).toHaveLength(1)
    expect(sqls.filter((s) => /FROM clients\b/.test(s))).toEqual([])
  })

  it('lectura · con NIT no exento se lee la lista y después los contactos de Books', async () => {
    const { espia, sqls } = espiar(db)
    const res = await conNit('800555666', {}, {}, espia)
    expect(res.status).toBe(201)
    expect(sqls.filter((s) => /FROM public\.nit_exentos/.test(s))).toHaveLength(1)
    expect(sqls.filter((s) => /FROM clients\b/.test(s))).toHaveLength(1)
  })

  // Posición frente a B (regla de mutación 1): el cargo de la OVI (`ticketService.ts:44`) corre antes que C (`:91`), y la exención no lo salta.
  // El cuerpo activa a la vez B (OVI tecleada, usuario de Comercial SIN el cargo) y C (provisional + orden de venta, 422): debe ganar el 403.
  it('posición · exento + orden OVI + usuario sin el cargo → 403 de B, no 201 ni el 422 de C', async () => {
    const res = await request(appWith().app).post('/api/tickets').set('Cookie', await userCookie(['Comercial']))
      .send({ ...BASE, clienteManual: { ...CLIENTE, nit: EXENTO }, ordenVenta: 'OVI-2026-001', equipoManual: EQUIPO })
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('OVI-2026-001')
    expect(await nada()).toEqual({ prov: 0, equipos: 0, tickets: 0 })
  })
})
