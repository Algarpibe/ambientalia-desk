import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { asociarOV } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { crearContrato } from '../db/contratos'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()

/**
 * API de contratos (registro-contrato, lote 3; `tickets-core` RQ-TC-21 y RQ-TC-23).
 *
 * LECTURAS: cualquier usuario con sesión (S-16). ALTA: Comercial o administrador, impuesto AQUÍ con
 * `canExecuteTransition` de `shared` (regla invariable 13). Escalera del alta (F1B-10): B `403` < C `422` < D `409`.
 * El «ticket de contrato» es DERIVADO: ningún endpoint lo acepta como campo (`decision/anexo-53-contratos`).
 */
const VALIDO = { clientId: 'C-1', lote: 'OV-2026-170', fechaInicio: '2026-01-15', fechaFin: '2026-12-31' }
const cliente = (id = 'C-1') => db.query('INSERT INTO books.contacts (contact_id, contact_name) VALUES ($1, $2)', [id, `Cliente ${id}`])
const filas = async () => (await db.query('SELECT * FROM contratos ORDER BY id')).rows
const registrar = (over: Partial<typeof VALIDO> = {}) => crearContrato(db, { ...VALIDO, ...over, creadoPor: 'previo' })

// [nombre, cookie (null = sin sesión), estado al crear, estado al leer]
type Rol = [string, (() => Promise<string>) | null, number, number]
const ROLES: Rol[] = [
  ['sin sesión', null, 401, 401],
  ['Servicio Técnico', () => userCookie(['Servicio Técnico']), 403, 200],
  ['Compras sola', () => userCookie(['Compras']), 403, 200],
  ['Comercial', () => userCookie(['Comercial']), 201, 200],
  ['Comercial + Compras', () => userCookie(['Comercial', 'Compras']), 201, 200],
  ['administrador sin área', () => adminCookie(), 201, 200],
]
const con = async (rq: request.Test, cookie: (() => Promise<string>) | null) => (cookie ? rq.set('Cookie', await cookie()) : rq)

describe('POST /api/contratos · matriz por área (impuesta en el servidor)', () => {
  it.each(ROLES)('%s', async (_n, cookie, esperado) => {
    await cliente()
    const res = await con(request(appWith().app).post('/api/contratos').send(VALIDO), cookie)
    expect(res.status).toBe(esperado)
    if (esperado === 201) {
      expect(res.body).toMatchObject({ ...VALIDO, ritmoAvisadoTrimestre: null })
      expect(res.body.creadoPor).toBe(_n === 'administrador sin área' ? 'Admin' : 'Op')
      expect(res.body.createdAt).toBeTruthy()
      expect(await filas()).toHaveLength(1)
    } else {
      expect(await filas()).toEqual([])
    }
  })

  it('403 también con cuerpo inválido, sin fila', async () => {
    const res = await request(appWith().app).post('/api/contratos').set('Cookie', await userCookie(['Servicio Técnico']))
      .send({ lote: 'basura', fechaInicio: '31/12/2026' })
    expect(res.status).toBe(403)
    expect(await filas()).toEqual([])
  })
})

describe.each([
  ['GET /api/contratos', () => '/api/contratos'],
  ['GET /api/contratos/:id', (id: number) => `/api/contratos/${id}`],
  ['GET /api/tickets/:id/contrato', () => '/api/tickets/t1/contrato'],
])('%s · matriz por área (lectura abierta a sesión)', (_n, url) => {
  it.each(ROLES)('%s', async (_r, cookie, _crear, esperado) => {
    const c = await registrar()
    const res = await con(request(appWith().app).get(url(c.id)), cookie)
    expect(res.status).toBe(esperado)
  })
})

describe('lecturas', () => {
  it('GET /api/contratos lista; la ficha trae contrato, estado y saldo del lote', async () => {
    const c = await registrar()
    const cookie = await userCookie(['Servicio Técnico'])
    const app = appWith().app
    expect((await request(app).get('/api/contratos').set('Cookie', cookie)).body).toEqual([c])
    const ficha = await request(app).get(`/api/contratos/${c.id}`).set('Cookie', cookie)
    expect(ficha.body).toMatchObject({ contrato: c, saldo: { lote: 'OV-2026-170', creadas: 0 } })
    expect(['no_iniciado', 'vigente', 'vencido']).toContain(ficha.body.estado)
  })

  it('404 con :id no numérico SIN consultar contratos, y 404 con id inexistente', async () => {
    let consultas = 0
    const espia: Queryable = { query: ((sql: string, p?: unknown[]) => { if (/contratos/.test(sql)) consultas++; return db.query(sql, p) }) as Queryable['query'] }
    const cookie = await userCookie(['Servicio Técnico'])
    const app = appWith({}, espia).app
    const abc = await request(app).get('/api/contratos/abc').set('Cookie', cookie)
    expect(abc.status).toBe(404)
    expect(consultas).toBe(0)
    expect((await request(app).get('/api/contratos/999').set('Cookie', cookie)).status).toBe(404)
  })

  it('GET /api/tickets/:id/contrato devuelve la derivación', async () => {
    const c = await registrar({ fechaInicio: '2020-01-01', fechaFin: '2099-12-31' })
    await asociarOV(db, { ticketId: 't1', numero: 'OV-2026-170-01', salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
    const res = await request(appWith().app).get('/api/tickets/t1/contrato').set('Cookie', await userCookie(['Servicio Técnico']))
    expect(res.body).toEqual({ deContrato: true, contrato: c, subOV: 'OV-2026-170-01' })
  })
})

describe('POST /api/contratos · contenido (422) y unicidad (409)', () => {
  it.each<[string, Record<string, unknown>]>([
    ['lote con forma de subOV', { lote: 'OV-2026-170-01' }],
    ['lote hostil', { lote: "OV-2026-170'; DROP TABLE contratos" }],
    ['fin anterior al inicio', { fechaFin: '2026-01-14' }],
    ['sin fecha de fin', { fechaFin: undefined }],
    ['fecha irreal', { fechaInicio: '2026-02-30' }],
    ['fecha en otra forma', { fechaFin: '31/12/2026' }],
    ['lote vacío', { lote: '' }],
    ['cliente inexistente', { clientId: 'C-INVENTADO' }],
  ])('%s → 422, sin fila', async (_n, cambio) => {
    await cliente()
    const res = await request(appWith().app).post('/api/contratos').set('Cookie', await userCookie(['Comercial'])).send({ ...VALIDO, ...cambio })
    expect(res.status).toBe(422)
    expect(res.body.error).toBeTruthy()
    expect(await filas()).toEqual([])
  })

  it('un segundo contrato del mismo lote, aunque sea de otro cliente → 409 y la fila existente intacta', async () => {
    await cliente(); await cliente('C-2')
    await registrar()
    const antes = await filas()
    const res = await request(appWith().app).post('/api/contratos').set('Cookie', await userCookie(['Comercial'])).send({ ...VALIDO, clientId: 'C-2' })
    expect(res.status).toBe(409)
    expect(await filas()).toEqual(antes)
  })

  it('carrera: el SELECT previo no la ve y la base responde 23505 → 409, no 500', async () => {
    await cliente()
    const ciego: Queryable = { query: ((sql: string, p?: unknown[]) =>
      /FROM contratos WHERE lote/.test(sql) ? Promise.resolve({ rows: [] }) : db.query(sql, p)) as Queryable['query'] }
    const cookie = await userCookie(['Comercial'])
    await registrar()
    const res = await request(appWith({}, ciego).app).post('/api/contratos').set('Cookie', cookie).send(VALIDO)
    expect(res.status).toBe(409)
    expect(await filas()).toHaveLength(1)
  })
})

describe('POST /api/contratos · POSICIÓN: B 403 < C 422 < D 409 (regla de mutación 1)', () => {
  const INVALIDO = { ...VALIDO, fechaFin: '2026-01-01' } // fin < inicio, sobre un lote YA registrado

  it('sin Comercial + contenido inválido + lote registrado → 403', async () => {
    await cliente(); await registrar()
    const res = await request(appWith().app).post('/api/contratos').set('Cookie', await userCookie(['Servicio Técnico'])).send(INVALIDO)
    expect(res.status, 'gana B: el permiso').toBe(403)
  })

  it('Comercial + contenido inválido + lote registrado → 422, no 409; con contenido válido, el 409', async () => {
    await cliente(); await registrar()
    const app = appWith().app
    const cookie = await userCookie(['Comercial'])
    const ambas = await request(app).post('/api/contratos').set('Cookie', cookie).send(INVALIDO)
    expect(ambas.status, 'gana C: el contenido, no la unicidad').toBe(422)
    const soloD = await request(app).post('/api/contratos').set('Cookie', cookie).send(VALIDO)
    expect(soloD.status, 'control de población: sin el defecto de contenido, el mismo lote contesta 409').toBe(409)
  })
})

describe('el «ticket de contrato» es DERIVADO: ningún cuerpo lo fija', () => {
  const FIJAR = { deContrato: true, de_contrato: true, esContrato: true, contrato: 1, contratoId: 1, contrato_id: 1 }

  async function alta(cookie: string, ov: { so: string; numero: string } | null, extra: Record<string, unknown>) {
    if (ov) await db.query('INSERT INTO books.sales_orders (salesorder_id, salesorder_number, customer_id, date) VALUES ($1, $2, $3, $4)', [ov.so, ov.numero, 'C-1', '2026-07-15'])
    const res = await request(appWith().app).post('/api/tickets').set('Cookie', cookie).send({
      equipoId: 'eq-1', clientId: 'C-1', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo', prefijo: 'MT', ...(ov ? { salesOrderId: ov.so } : {}), ...extra,
    })
    expect(res.status, JSON.stringify(res.body)).toBe(201)
    return String((res.body as { id: unknown }).id)
  }
  const derivacion = async (cookie: string, id: string) =>
    (await request(appWith().app).get(`/api/tickets/${id}/contrato`).set('Cookie', cookie)).body

  it('alta con el campo a true y sin subOV de contrato → no es de contrato; alta con el campo a false y subOV vigente → sí lo es', async () => {
    await cliente()
    await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','18A20070','Grimm','EDM180C','Monitor')")
    await registrar({ fechaInicio: '2020-01-01', fechaFin: '2099-12-31' })
    const cookie = await adminCookie()

    const sinOV = await alta(cookie, null, FIJAR)
    expect(await derivacion(cookie, sinOV)).toEqual({ deContrato: false })

    const conSubOV = await alta(cookie, { so: 'so1', numero: 'OV-2026-170-01' }, { deContrato: false, de_contrato: false, contrato: null })
    expect(await derivacion(cookie, conSubOV)).toMatchObject({ deContrato: true, subOV: 'OV-2026-170-01' })

    // Y no hay dónde guardarlo: ni `tickets` ni `ov_asociaciones` tienen columna de contrato.
    const columnas = [
      ...Object.keys((await db.query('SELECT * FROM tickets WHERE id = $1', [sinOV])).rows[0]),
      ...Object.keys((await db.query('SELECT * FROM ov_asociaciones LIMIT 1')).rows[0]),
    ]
    expect(columnas.filter((c) => /contrat/i.test(c))).toEqual([])
  })

  it('el alta del contrato ignora id, creadoPor, createdAt y cualquier marca de «de contrato» del cuerpo', async () => {
    await cliente()
    const res = await request(appWith().app).post('/api/contratos').set('Cookie', await userCookie(['Comercial']))
      .send({ ...VALIDO, ...FIJAR, id: 999, creadoPor: 'otro', createdAt: '2000-01-01', ritmoAvisadoTrimestre: 4 })
    expect(res.status, JSON.stringify(res.body)).toBe(201)
    expect(res.body).toMatchObject({ creadoPor: 'Op', ritmoAvisadoTrimestre: null })
    expect(res.body.id).not.toBe(999)
    expect(Object.keys(res.body).sort()).toEqual(['clientId', 'creadoPor', 'createdAt', 'fechaFin', 'fechaInicio', 'id', 'lote', 'ritmoAvisadoTrimestre'])
  })
})

describe('GET /api/contratos/:id/informe (lote 4, RQ-ZS-15)', () => {
  it.each(ROLES)('%s · lectura abierta a sesión', async (_r, cookie, _crear, esperado) => {
    const c = await registrar()
    expect((await con(request(appWith().app).get(`/api/contratos/${c.id}/informe`), cookie)).status).toBe(esperado)
  })

  it('404 con :id no numérico SIN consultar, y 404 con id inexistente', async () => {
    let consultas = 0
    const espia: Queryable = { query: ((sql: string, p?: unknown[]) => { if (/contratos|sales_orders|ov_asociaciones|ticket_transitions/.test(sql)) consultas++; return db.query(sql, p) }) as Queryable['query'] }
    const cookie = await userCookie(['Servicio Técnico'])
    const app = appWith({}, espia).app
    expect((await request(app).get('/api/contratos/abc/informe').set('Cookie', cookie)).status).toBe(404)
    expect(consultas).toBe(0)
    expect((await request(app).get('/api/contratos/999/informe').set('Cookie', cookie)).status).toBe(404)
  })

  it('200 con la forma del design §6', async () => {
    const c = await registrar()
    const res = await request(appWith().app).get(`/api/contratos/${c.id}/informe`).set('Cookie', await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(200)
    expect(Object.keys(res.body).sort()).toEqual(['consumido', 'contrato', 'creadas', 'diasHastaFin', 'ejecutadas', 'enCurso', 'estado', 'hoy',
      'huecos', 'libres', 'porcentajeEjecutado', 'sinFecha', 'subOV', 'trimestres'])
    expect(res.body.contrato).toEqual(c)
  })
})
