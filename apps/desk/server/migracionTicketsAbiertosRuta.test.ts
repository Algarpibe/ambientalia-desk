import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'
import { logger } from './util/logger'

instalarArnes()

/**
 * migracion-tickets-abiertos (F1F-01), `zoho-sync` RQ-ZS-17: la ruta `POST /api/admin/migrar-tickets-abiertos`.
 * Orden de guardas (diseño §7, regla de mutación 1): 401 → 403 → 400 → 409 → escrituras. «No invocó al ejecutor» se
 * lee en el espía de SQL: el ejecutor es lo único que consulta `tickets` por el predicado de abiertos.
 */
const CORTE = '2026-12-01T00:00:00-05:00'
const URL = '/api/admin/migrar-tickets-abiertos'
const SERVICIO = ['Servicio Técnico']

async function tk(id: string, number: number, status: string): Promise<void> {
  await db.query("INSERT INTO tickets (id, number, subject, status, status_type, created_time) VALUES ($1,$2,'Asunto',$3,'Open','2026-10-01T10:00:00Z')", [id, number, status])
}
function espiar(habilitada = false) {
  const sqls: string[] = []
  const pool = db as unknown as { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
  const env = (q: Queryable['query']): Queryable['query'] => ((sql: string, p?: unknown[]) => { sqls.push(sql.replace(/\s+/g, ' ').trim()); return q(sql, p) }) as Queryable['query']
  const espia = { query: env(db.query.bind(db)), connect: async () => { const c = await pool.connect(); return { query: env(c.query.bind(c)), release: () => c.release() } } } as unknown as Queryable
  return { app: appWith({ migracionTicketsHabilitada: habilitada }, espia).app, sqls }
}
const leyoTickets = (sqls: string[]) => sqls.some((s) => /FROM tickets WHERE \(status_type/i.test(s))
const escribio = (sqls: string[]) => sqls.some((s) => /^(INSERT INTO ticket_transitions|UPDATE tickets)/i.test(s))
const estados = async () => (await db.query('SELECT id, status, managed_by_app FROM tickets ORDER BY id')).rows

describe('guardas, en orden', () => {
  beforeEach(async () => { await tk('t1', 4100, 'Entregado') })

  it('sin sesión: 401 sin invocar al ejecutor', async () => {
    const { app, sqls } = espiar()
    expect((await request(app).post(URL).query({ corte: CORTE })).status).toBe(401)
    expect(leyoTickets(sqls)).toBe(false)
  })

  it('sin rol de administrador: 403 sin invocar al ejecutor', async () => {
    const cookie = await userCookie(SERVICIO)
    const { app, sqls } = espiar()
    expect((await request(app).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: 'true' })).status).toBe(403)
    expect(leyoTickets(sqls)).toBe(false)
  })

  it('un no administrador con corte inválido ve 403, no 400', async () => {
    const cookie = await userCookie(SERVICIO)
    expect((await request(appWith().app).post(URL).set('Cookie', cookie).query({ corte: 'ayer' })).status).toBe(403)
  })

  it.each([
    ['sin corte', {}], ['fecha pelada', { corte: '2026-12-01' }], ['sin desfase', { corte: '2026-12-01T00:00:00' }], ['no es fecha', { corte: '2026-13-45T00:00:00Z' }],
    ['aplicar=1', { corte: CORTE, aplicar: '1' }], ['aplicar=TRUE', { corte: CORTE, aplicar: 'TRUE' }], ['aplicar=1 sin corte', { aplicar: '1' }],
  ])('400 %s, sin leer nada', async (_n, query) => {
    const cookie = await adminCookie()
    const { app, sqls } = espiar()
    expect((await request(app).post(URL).set('Cookie', cookie).query(query)).status).toBe(400)
    expect(leyoTickets(sqls)).toBe(false)
  })

  it.each([
    ['día imposible (31 de febrero)', '2026-02-31T00:00:00Z'], ['hora 24', '2026-12-01T24:00:00Z'], ['minuto 60', '2026-12-01T10:60:00Z'], ['día 0', '2026-12-00T00:00:00Z'],
  ])('400 con un corte que V8 desplazaría en silencio: %s', async (_n, corte) => {
    const { app, sqls } = espiar()
    expect((await request(app).post(URL).set('Cookie', await adminCookie()).query({ corte })).status).toBe(400)
    expect(leyoTickets(sqls)).toBe(false)
  })

  it('control positivo: una fecha real con desfase distinto de cero pasa y se normaliza a UTC', async () => {
    const res = await request(appWith().app).post(URL).set('Cookie', await adminCookie()).query({ corte: '2026-02-28T23:30:00+05:30' })
    expect(res.status).toBe(200)
    expect(res.body.corte).toBe('2026-02-28T18:00:00.000Z')
  })

  it('sin sesión y con corte inválido: 401, no 400 (la sesión va antes de validar)', async () => {
    expect((await request(appWith().app).post(URL).query({ corte: 'ayer' })).status).toBe(401)
  })

  it('control positivo de leyoTickets: una petición que sí lee tickets lo vuelve verdadero', async () => {
    const { app, sqls } = espiar()
    expect((await request(app).post(URL).set('Cookie', await adminCookie()).query({ corte: CORTE })).status).toBe(200)
    expect(leyoTickets(sqls)).toBe(true)
  })

  it('corte inválido con un sin equivalencia en la base ve 400, no 409', async () => {
    await tk('t9', 4900, 'Estado raro')
    expect((await request(appWith({ migracionTicketsHabilitada: true }).app).post(URL).set('Cookie', await adminCookie()).query({ corte: 'ayer', aplicar: 'true' })).status).toBe(400)
  })

  it('un migrable y un sin equivalencia con aplicar=true no dejan ni INSERT ni UPDATE', async () => {
    await tk('t9', 4900, 'Estado raro')
    const { app, sqls } = espiar(true)
    expect((await request(app).post(URL).set('Cookie', await adminCookie()).query({ corte: CORTE, aplicar: 'true' })).status).toBe(409)
    expect(escribio(sqls)).toBe(false)
  })
})

describe('respuestas', () => {
  let cookie = ''
  beforeEach(async () => { cookie = await adminCookie() })
  const llamar = async (query: Record<string, string>, app = appWith({ migracionTicketsHabilitada: true }).app) => request(app).post(URL).set('Cookie', cookie).query(query)

  it('200 en seco por defecto: sin aplicar no se escribe nada', async () => {
    await tk('t1', 4100, 'Entregado')
    const { app, sqls } = espiar()
    const res = await llamar({ corte: CORTE }, app)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ aplicar: false, aplicado: false, migrables: 1, corte: '2026-12-01T05:00:00.000Z' })
    expect(escribio(sqls)).toBe(false)
    expect(await estados()).toEqual([{ id: 't1', status: 'Entregado', managed_by_app: false }])
  })

  it('200 en seco con la negativa rellena', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('t9', 4900, 'Estado raro')
    const res = await llamar({ corte: CORTE, aplicar: 'false' })
    expect(res.status).toBe(200)
    expect(res.body.negativa).toEqual({ motivo: 'estados-sin-equivalencia', estados: ['Estado raro'] })
  })

  it('409 con el informe completo al aplicar con negativa, y nada cambia', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('t9', 4900, 'Estado raro')
    const res = await llamar({ corte: CORTE, aplicar: 'true' })
    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({ aplicar: true, aplicado: false, negativa: { estados: ['Estado raro'] }, sinEquivalencia: [{ estado: 'Estado raro', tickets: 1, numeros: [4900] }] })
    expect((await estados()).every((x) => x.managed_by_app === false)).toBe(true)
  })

  it('200 al aplicar, con el informe igual al de la pasada en seco salvo aplicar y aplicado, y el informe va al log', async () => {
    await tk('t1', 4100, 'Entregado')
    const info = vi.spyOn(logger, 'info')
    const seco = await llamar({ corte: CORTE })
    const res = await llamar({ corte: CORTE, aplicar: 'true' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ aplicar: true, aplicado: true })
    const sinModo = (b: Record<string, unknown>) => ({ ...b, aplicar: null, aplicado: null })
    expect(sinModo(res.body)).toEqual(sinModo(seco.body))
    expect(await estados()).toEqual([{ id: 't1', status: 'Finalizado', managed_by_app: true }])
    expect(info.mock.calls.some((c) => JSON.stringify(c).includes('"migrables":1'))).toBe(true)
    info.mockRestore()
  })
})

describe('interruptor MIGRACION_TICKETS_HABILITADA (E-231): nace cerrado y sólo gobierna aplicar=true', () => {
  let cookie = ''
  beforeEach(async () => { cookie = await adminCookie(); await tk('t1', 4100, 'Entregado') })

  it('apagado + aplicar=true: 403 con el nombre de la variable, sin leer ni escribir la base', async () => {
    const { app, sqls } = espiar()
    const res = await request(app).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: 'true' })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/MIGRACION_TICKETS_HABILITADA/)
    expect(leyoTickets(sqls)).toBe(false)
    expect(escribio(sqls)).toBe(false)
    expect(await estados()).toEqual([{ id: 't1', status: 'Entregado', managed_by_app: false }])
  })

  it('apagado: la pasada en seco sigue respondiendo 200, sin aplicar y con aplicar=false', async () => {
    for (const query of [{ corte: CORTE }, { corte: CORTE, aplicar: 'false' }]) {
      const { app, sqls } = espiar()
      const res = await request(app).post(URL).set('Cookie', cookie).query(query)
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ aplicar: false, aplicado: false, migrables: 1 })
      expect(escribio(sqls)).toBe(false)
    }
  })

  it('posición: apagado + aplicar=true con un sin equivalencia en la base ve 403, no 409', async () => {
    await tk('t9', 4900, 'Estado raro')
    expect((await request(appWith().app).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: 'true' })).status).toBe(403)
  })

  it('posición: apagado + aplicar=true con corte inválido ve 403, no 400 (permiso B antes que contenido C, F1B-10)', async () => {
    expect((await request(appWith().app).post(URL).set('Cookie', cookie).query({ corte: 'ayer', aplicar: 'true' })).status).toBe(403)
  })

  it('posición: un no administrador con el interruptor apagado ve el 403 del rol, no el del interruptor', async () => {
    const res = await request(appWith().app).post(URL).set('Cookie', await userCookie(SERVICIO)).query({ corte: CORTE, aplicar: 'true' })
    expect(res.status).toBe(403)
    expect(JSON.stringify(res.body)).not.toMatch(/MIGRACION_TICKETS_HABILITADA/)
  })

  it('apagado + aplicar inválido sigue siendo 400: el interruptor sólo mira aplicar=true', async () => {
    expect((await request(appWith().app).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: '1' })).status).toBe(400)
  })

  it('encendido + aplicar=true: el comportamiento de hoy, aplica y escribe', async () => {
    const { app, sqls } = espiar(true)
    const res = await request(app).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: 'true' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ aplicar: true, aplicado: true })
    expect(escribio(sqls)).toBe(true)
    expect(await estados()).toEqual([{ id: 't1', status: 'Finalizado', managed_by_app: true }])
  })
})

/**
 * rechazo-migracion-409 (F1F-01), `zoho-sync` RQ-ZS-23 · la ejecución a la que otra se adelantó responde `409` con mensaje claro y `motivo`.
 * El ayudante interviene el `UPDATE` del ejecutor para reproducir el adelantamiento; el rechazo se distingue por tipo, nunca por texto.
 */
const mensajeRechazo = (n: number) => `Otra ejecución de la migración está en curso o acaba de confirmarse (o el ticket ${n} cambió en la aplicación mientras ésta escribía). Esta ejecución no escribió nada. Compruébalo con una pasada en seco —la misma llamada sin \`aplicar\`— antes de volver a lanzarla.`
const esUpdate = (sql: string) => /^UPDATE tickets SET status/i.test(sql.trim())
function conGancho(antes: (sql: string, p: unknown[]) => Promise<void> | void, habilitada = true) {
  const pool = db as unknown as { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
  const env = (q: Queryable['query']): Queryable['query'] => (async (sql: string, p: unknown[] = []) => { await antes(sql, p); return q(sql, p) }) as Queryable['query']
  const espia = { query: env(db.query.bind(db)), connect: async () => { const c = await pool.connect(); return { query: env(c.query.bind(c)), release: () => c.release() } } } as unknown as Queryable
  return appWith({ migracionTicketsHabilitada: habilitada }, espia).app
}

describe('rechazo de la ejecución adelantada (RQ-ZS-23): 409 con mensaje claro', () => {
  let cookie = ''
  let disparos = 0
  beforeEach(async () => { cookie = await adminCookie(); disparos = 0; await tk('t1', 4100, 'Entregado') })
  const adelantar = (id: string) => async (sql: string, p: unknown[]) => { if (esUpdate(sql) && p[0] === id) { disparos++; await db.query('UPDATE tickets SET managed_by_app = true WHERE id = $1', [id]) } }
  const lanzar = (app: ReturnType<typeof conGancho>) => request(app).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: 'true' })

  it('caso 1 · rechazo: 409 con el mensaje entero y motivo otra-ejecucion', async () => {
    await tk('t2', 4200, 'OV asignada')
    const res = await lanzar(conGancho(adelantar('t2')))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: mensajeRechazo(4200), motivo: 'otra-ejecucion' })
    expect(res.body).not.toHaveProperty('aplicado')
    expect(res.body).not.toHaveProperty('negativa')
    expect(disparos).toBe(1)
  })

  it('caso 2 · otro error cualquiera sigue dando 500 «Error interno»', async () => {
    const res = await lanzar(conGancho((sql) => { if (esUpdate(sql)) throw new Error('fallo forzado') }))
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Error interno' })
  })

  it('caso 3 · posición: con el interruptor apagado se ve el 403, no el rechazo', async () => {
    const res = await lanzar(conGancho(adelantar('t1'), false))
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/MIGRACION_TICKETS_HABILITADA/)
    expect(res.body).not.toHaveProperty('motivo')
    expect(disparos).toBe(0)
  })

  it('caso 4 · posición: con negativa se ve el 409 del informe, no el rechazo', async () => {
    await tk('t9', 4900, 'Estado raro')
    const res = await lanzar(conGancho(adelantar('t1')))
    expect(res.status).toBe(409)
    expect(res.body.negativa).toEqual({ motivo: 'estados-sin-equivalencia', estados: ['Estado raro'] })
    expect(res.body).not.toHaveProperty('motivo')
    expect(res.body).not.toHaveProperty('error')
    expect(disparos).toBe(0)
  })

  it('caso 5 · registro: el rechazo va al registro como aviso, no como error', async () => {
    await tk('t2', 4200, 'OV asignada')
    const warn = vi.spyOn(logger, 'warn')
    const error = vi.spyOn(logger, 'error')
    await lanzar(conGancho(adelantar('t2')))
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toEqual({ numero: 4200 })
    expect(String(warn.mock.calls[0][1])).toContain('pasó a estar gobernado')
    expect(error).not.toHaveBeenCalled()
    warn.mockRestore(); error.mockRestore()
  })
})

describe('rechazo de la ejecución adelantada (RQ-ZS-23): se distingue por tipo, no por texto', () => {
  it('caso 6 · un error genérico con el MISMO texto del rechazo sigue dando 500, no 409', async () => {
    const cookie = await adminCookie()
    await tk('t1', 4100, 'Entregado')
    const texto = 'El ticket 4100 pasó a estar gobernado entre la lectura y la escritura: se deshace la migración entera'
    const res = await request(conGancho((sql) => { if (esUpdate(sql)) throw new Error(texto) })).post(URL).set('Cookie', cookie).query({ corte: CORTE, aplicar: 'true' })
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Error interno' })
  })
})
