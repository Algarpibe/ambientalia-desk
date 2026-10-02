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
