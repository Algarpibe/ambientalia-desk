import { describe, it, expect, afterEach, vi } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { MENSAJES_AMPLIACION, type DiaCivil } from '@ambientalia/shared'
import { crearContrato, contratoPorId } from '../db/contratos'
import { registerContratosRoutes } from './contratos'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()
afterEach(() => { vi.useRealTimers() })

/**
 * `POST /api/contratos/:id/ampliar` (ampliacion-contrato, F1B-11; `tickets-core` RQ-TC-54). Escalera:
 * A existencia `404` < B permiso `403` < C contenido `422` < D carrera `409`. Cada par de posición se prueba con las
 * DOS guardas activas a la vez (regla de mutación 1).
 */
const VIGENTE = '2031-06-30'
const contrato = (fechaFin = VIGENTE) => crearContrato(db, { clientId: 'C-1', lote: 'OV-2031-001', fechaInicio: '2031-01-01', fechaFin, creadoPor: 'previo' })
const fechaDe = async (id: number) => (await contratoPorId(db, id))!.fechaFin
const trazas = async () => (await db.query('SELECT * FROM contrato_ampliaciones ORDER BY id')).rows
const OK = { fechaFin: '2031-09-30', motivo: 'Prórroga acordada' }

/** Aplicación mínima con `hoy` inyectado. */
const appHoy = (hoy: DiaCivil, dbPropia?: Queryable) => {
  const app = express(); app.use(express.json()); app.use(cookieParser())
  registerContratosRoutes(app, { db: dbPropia ?? db, hoy: () => hoy })
  return app
}
const HOY = '2031-07-15'
const comercial = () => userCookie(['Comercial'])
const ampliar = (app: express.Express, id: number | string, cookie: string | null, body: unknown = OK) => {
  const rq = request(app).post(`/api/contratos/${id}/ampliar`)
  return (cookie ? rq.set('Cookie', cookie) : rq).send(body as object)
}

/** Carrera determinista: sin `connect`, escribe OTRA `fecha_fin` justo antes de reenviar el `UPDATE` de la ampliación. */
const conCarrera = (id: number, colada: string) => {
  let n = 0
  const dbPropia = {
    query: async (sql: string, params?: unknown[]) => {
      if (sql.startsWith('UPDATE contratos SET fecha_fin')) { n++; await db.query('UPDATE contratos SET fecha_fin = $1 WHERE id = $2', [colada, id]) }
      return db.query(sql, params)
    },
  } as unknown as Queryable
  return { dbPropia, disparos: () => n }
}

describe('éxito, permiso y sesión', () => {
  it('Comercial amplía: 200 con contrato, ampliaciones y fechaFinOriginal; la traza lleva a la persona de la sesión', async () => {
    const c = await contrato()
    const res = await ampliar(appHoy(HOY), c.id, await comercial(), { ...OK, motivo: '  Prórroga acordada  ' })
    expect(res.status).toBe(200)
    expect(res.body.contrato.fechaFin).toBe('2031-09-30')
    expect(res.body.fechaFinOriginal).toBe(VIGENTE)
    expect(res.body.ampliaciones).toHaveLength(1)
    expect(res.body.ampliaciones[0]).toMatchObject({ fechaAnterior: VIGENTE, fechaNueva: '2031-09-30', motivo: 'Prórroga acordada', ampliadoPor: 'Op' })
    expect(await fechaDe(c.id)).toBe('2031-09-30')
    expect(await trazas()).toHaveLength(1)
  })

  it('el administrador sin área Comercial también amplía', async () => {
    const c = await contrato()
    const res = await ampliar(appHoy(HOY), c.id, await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body.ampliaciones[0].ampliadoPor).toBe('Admin')
  })

  it.each([
    ['sin sesión', null, 401],
    ['Servicio Técnico', () => userCookie(['Servicio Técnico']), 403],
    ['Compras sola', () => userCookie(['Compras']), 403],
    ['Comercial + Compras', () => userCookie(['Comercial', 'Compras']), 200],
  ] as const)('matriz por área · %s', async (_n, cookie, esperado) => {
    const c = await contrato()
    const res = await ampliar(appHoy(HOY), c.id, cookie ? await cookie() : null)
    expect(res.status).toBe(esperado)
    if (esperado !== 200) { expect(await trazas()).toEqual([]); expect(await fechaDe(c.id)).toBe(VIGENTE) }
  })

  it('403 sin escribir nada y con el mensaje del permiso', async () => {
    const c = await contrato()
    const res = await ampliar(appHoy(HOY), c.id, await userCookie(['Servicio Técnico']))
    expect(res.body.error).toBe(MENSAJES_AMPLIACION.permiso)
    expect(await trazas()).toEqual([])
  })

  it('`ampliado_por` es el de la sesión aunque el cuerpo traiga otro nombre', async () => {
    const c = await contrato()
    const res = await ampliar(appHoy(HOY), c.id, await comercial(), { ...OK, ampliadoPor: 'Otro', ampliado_por: 'Otro', ampliadoAt: '2000-01-01' })
    expect(res.status).toBe(200)
    expect((await trazas())[0].ampliado_por).toBe('Op')
  })
})

describe('posición de las guardas (dos activas a la vez)', () => {
  it('A↔B: Servicio Técnico sobre un id inexistente → 404', async () => {
    const res = await ampliar(appHoy(HOY), 999, await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(MENSAJES_AMPLIACION.inexistente)
  })

  it('A↔C: Comercial, id inexistente y cuerpo vacío → 404', async () => {
    expect((await ampliar(appHoy(HOY), 999, await comercial(), {})).status).toBe(404)
  })

  it('id no numérico → 404 sin llegar a la base de contratos', async () => {
    let consultas = 0
    const espia = { query: ((sql: string, p?: unknown[]) => { if (/contratos/.test(sql)) consultas++; return db.query(sql, p) }) as Queryable['query'] }
    const res = await ampliar(appHoy(HOY, espia), 'abc', await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(404)
    expect(consultas).toBe(0)
  })

  it('B↔C: Servicio Técnico, contrato real y cuerpo inválido → 403, sin fila', async () => {
    const c = await contrato()
    const res = await ampliar(appHoy(HOY), c.id, await userCookie(['Servicio Técnico']), { fechaFin: 'basura' })
    expect(res.status).toBe(403)
    expect(await trazas()).toEqual([])
  })

  it('B↔D: Servicio Técnico, cuerpo válido y carrera → 403 y el doble no dispara', async () => {
    const c = await contrato()
    const { dbPropia, disparos } = conCarrera(c.id, '2031-07-31')
    const res = await ampliar(appHoy(HOY, dbPropia), c.id, await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(403)
    expect(disparos()).toBe(0)
    expect(await fechaDe(c.id)).toBe(VIGENTE)
  })

  it('C↔D: Comercial, motivo vacío y carrera → 422, el doble no dispara y la fecha queda intacta', async () => {
    const c = await contrato()
    const { dbPropia, disparos } = conCarrera(c.id, '2031-07-31')
    const res = await ampliar(appHoy(HOY, dbPropia), c.id, await comercial(), { fechaFin: '2031-09-30', motivo: '   ' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe(MENSAJES_AMPLIACION.motivo)
    expect(disparos()).toBe(0)
    expect(await fechaDe(c.id)).toBe(VIGENTE)
    expect(await trazas()).toEqual([])
  })

  it('dentro de C: la fecha inválida gana al motivo vacío', async () => {
    const c = await contrato()
    const res = await ampliar(appHoy(HOY), c.id, await comercial(), { fechaFin: '2031-02-30', motivo: '' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe(MENSAJES_AMPLIACION.fecha)
  })

  it('D sola: 409 con el mensaje de la carrera, sin fila y con la fecha como la dejó la otra escritura', async () => {
    const c = await contrato()
    const { dbPropia, disparos } = conCarrera(c.id, '2031-07-31')
    const res = await ampliar(appHoy(HOY, dbPropia), c.id, await comercial())
    expect(res.status).toBe(409)
    expect(res.body.error).toBe(MENSAJES_AMPLIACION.carrera)
    expect(disparos()).toBe(1)
    expect(await trazas()).toEqual([])
    expect(await fechaDe(c.id)).toBe('2031-07-31')
  })
})

describe('bordes de año con `hoy` inyectado', () => {
  it('plazo abierto el 31/12 y cerrado el 01/01', async () => {
    const c = await contrato()
    const cookie = await comercial()
    const abierto = await ampliar(appHoy('2031-12-31'), c.id, cookie, { fechaFin: '2031-12-31', motivo: 'm' })
    expect(abierto.status).toBe(200)
    const d = await crearContrato(db, { clientId: 'C-1', lote: 'OV-2031-002', fechaInicio: '2031-01-01', fechaFin: VIGENTE, creadoPor: 'previo' })
    const cerrado = await ampliar(appHoy('2032-01-01'), d.id, cookie, { fechaFin: '2031-12-31', motivo: 'm' })
    expect(cerrado.status).toBe(422)
    expect(cerrado.body.error).toBe(MENSAJES_AMPLIACION.plazoCerrado)
  })

  it('sin `hoy` inyectado, el reloj real en la zona de negocio: 2027-01-01T03:00Z aún es 31/12 de 2026', async () => {
    const c = await crearContrato(db, { clientId: 'C-1', lote: 'OV-2026-001', fechaInicio: '2026-01-01', fechaFin: '2026-06-30', creadoPor: 'previo' })
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2027-01-01T03:00:00Z'))
    const res = await ampliar(appWith().app, c.id, await comercial(), { fechaFin: '2026-12-31', motivo: 'm' })
    expect(res.status).toBe(200)
  })
})

describe('GET /api/contratos/:id · lectura ampliada', () => {
  it('sin ampliaciones: ampliaciones vacío y fechaFinOriginal igual a la fecha de fin, nunca nulo', async () => {
    const c = await contrato()
    const res = await request(appWith().app).get(`/api/contratos/${c.id}`).set('Cookie', await comercial())
    expect(res.status).toBe(200)
    expect(res.body.ampliaciones).toEqual([])
    expect(res.body.fechaFinOriginal).toBe(VIGENTE)
  })

  it('tras dos ampliaciones: traza en orden y fechaFinOriginal de la PRIMERA; contrato, estado y saldo se conservan', async () => {
    const c = await contrato()
    const cookie = await comercial()
    expect((await ampliar(appHoy(HOY), c.id, cookie, { fechaFin: '2031-09-30', motivo: 'uno' })).status).toBe(200)
    expect((await ampliar(appHoy(HOY), c.id, cookie, { fechaFin: '2031-12-31', motivo: 'dos' })).status).toBe(200)
    const res = await request(appWith().app).get(`/api/contratos/${c.id}`).set('Cookie', cookie)
    expect(res.body.ampliaciones.map((a: { motivo: string }) => a.motivo)).toEqual(['uno', 'dos'])
    expect(res.body.ampliaciones.map((a: { fechaNueva: string }) => a.fechaNueva)).toEqual(['2031-09-30', '2031-12-31'])
    expect(res.body.fechaFinOriginal).toBe(VIGENTE)
    expect(res.body.contrato).toMatchObject({ id: c.id, lote: 'OV-2031-001', fechaFin: '2031-12-31' })
    expect(['no_iniciado', 'vigente', 'vencido']).toContain(res.body.estado)
    expect(res.body.saldo).toMatchObject({ lote: 'OV-2031-001', creadas: 0 })
  })

  it('sin sesión → 401', async () => {
    const c = await contrato()
    expect((await request(appWith().app).get(`/api/contratos/${c.id}`)).status).toBe(401)
  })
})

describe('remediación del verify · motivo entero, campos extra ignorados y tope fijo', () => {
  it('W-1: el motivo largo llega ENTERO a la base y a la ficha, recortado sólo en los extremos', async () => {
    const c = await contrato()
    const largo = 'Prórroga '.repeat(900).trim()
    const cookie = await comercial()
    const res = await ampliar(appHoy(HOY), c.id, cookie, { ...OK, motivo: `  ${largo}  ` })
    expect(res.status).toBe(200)
    expect(largo.length).toBeGreaterThan(5000)
    expect((await trazas())[0].motivo).toBe(largo)
    const ficha = await request(appWith().app).get(`/api/contratos/${c.id}`).set('Cookie', cookie)
    expect(ficha.body.ampliaciones[0].motivo).toBe(largo)
  })

  it('W-2: `hoy`, `contratoId` e `id` del cuerpo se ignoran: se amplía el contrato de la URL con el reloj inyectado', async () => {
    const c = await contrato()
    const otro = await crearContrato(db, { clientId: 'C-1', lote: 'OV-2031-009', fechaInicio: '2031-01-01', fechaFin: VIGENTE, creadoPor: 'previo' })
    // Con el `hoy` inyectado (2031-07-15) el plazo está abierto; con el del cuerpo (2032-06-01) estaría cerrado.
    const res = await ampliar(appHoy(HOY), c.id, await comercial(), { ...OK, hoy: '2032-06-01', contratoId: otro.id, id: otro.id })
    expect(res.status).toBe(200)
    expect(await fechaDe(c.id)).toBe('2031-09-30')
    expect(await fechaDe(otro.id)).toBe(VIGENTE)
    const filas = await trazas()
    expect(filas).toHaveLength(1)
    expect(Number(filas[0].contrato_id)).toBe(c.id)
  })

  it('RQ-TC-53 por la ruta: varias veces, el tope no se mueve (200, 200, 422 «pasa del tope»)', async () => {
    const c = await crearContrato(db, { clientId: 'C-1', lote: 'OV-2026-003', fechaInicio: '2026-01-01', fechaFin: '2026-03-31', creadoPor: 'previo' })
    const cookie = await comercial()
    const app = appHoy('2026-04-01')
    expect((await ampliar(app, c.id, cookie, { fechaFin: '2026-06-30', motivo: 'uno' })).status).toBe(200)
    expect((await ampliar(app, c.id, cookie, { fechaFin: '2026-12-31', motivo: 'dos' })).status).toBe(200)
    const tercera = await ampliar(app, c.id, cookie, { fechaFin: '2027-01-01', motivo: 'tres' })
    expect(tercera.status).toBe(422)
    expect(tercera.body.error).toBe(MENSAJES_AMPLIACION.pasaDelTope)
    expect(await fechaDe(c.id)).toBe('2026-12-31')
    const ficha = await request(appWith().app).get(`/api/contratos/${c.id}`).set('Cookie', cookie)
    expect(ficha.body.fechaFinOriginal).toBe('2026-03-31')
    expect(await trazas()).toHaveLength(2)
  })
})
