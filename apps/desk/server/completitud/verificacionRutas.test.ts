import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()

/**
 * verificacion-completitud (1G-03, RQ-ZS-39, L6) · `POST` y `GET` de `/api/admin/verificacion-completitud` y su guarda.
 * Orden total de F1B-10: sesión (401) < rol (403) < interruptor (403) < contenido (400) < ejecución. El rol, el interruptor y la validación los impone el
 * servidor (regla invariable 13): aquí se prueban contra `createApp`, con la `zohoFetch` falsa del arnés y sin red. Molde: `rellenoAdjuntosRutas.test.ts`.
 */
const RUTA = '/api/admin/verificacion-completitud'
const VARIABLE = 'VERIFICACION_COMPLETITUD_HABILITADA'
const appTs = readFileSync(path.resolve(__dirname, '..', 'app.ts'), 'utf8')

const ticket = (id: string, numero: number) => db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,$2,'A','Ingresado')", [id, numero])
const colgada = (z: { mockImplementation: (f: () => Promise<Response>) => unknown }) => z.mockImplementation(() => new Promise<Response>(() => {}))
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const abierta = () => appWith({ verificacionCompletitudHabilitada: true })

describe('verificacion-completitud · sesión y rol (escalones A y B)', () => {
  it('sin sesión, 401 en POST y en GET', async () => {
    const { app, zohoFetch } = abierta()
    expect((await request(app).post(RUTA)).status).toBe(401)
    expect((await request(app).get(RUTA)).status).toBe(401)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('un usuario que no es superadministrador recibe 403 en POST y en GET con el interruptor abierto, y no se lanza nada', async () => {
    await ticket('Z1', 1)
    const { app, zohoFetch } = abierta()
    const op = await userCookie([])
    expect((await request(app).post(RUTA).set('Cookie', op)).status).toBe(403)
    expect((await request(app).get(RUTA).set('Cookie', op)).status).toBe(403)
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', await adminCookie())).body.enMarcha).toBe(false)
  })

  it('P2 · cerrado y limite=abc: el que no es superadministrador recibe el 403 de ROL, que no nombra la variable', async () => {
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ limite: 'abc' }).set('Cookie', await userCookie([]))
    expect(r.status).toBe(403)
    expect(JSON.stringify(r.body)).not.toContain(VARIABLE)
  })
})

describe('verificacion-completitud · interruptor (escalón B antes que el contenido C)', () => {
  it('P1 · cerrado y limite=abc: el superadministrador recibe 403 que nombra la variable y no 400, sin llamar a Zoho; abierto, el 400', async () => {
    const cerrada = appWith(); const cookie = await adminCookie()
    const r = await request(cerrada.app).post(RUTA).query({ limite: 'abc' }).set('Cookie', cookie)
    expect([r.status, String(r.body.error).includes(VARIABLE), String(r.body.error).includes('limite=0')]).toEqual([403, true, true])
    expect((await request(cerrada.app).post(RUTA).query({ desde: 'abc', limite: '5' }).set('Cookie', cookie)).status).toBe(403)
    expect(cerrada.zohoFetch).not.toHaveBeenCalled()
    expect((await request(abierta().app).post(RUTA).query({ limite: 'abc' }).set('Cookie', cookie)).status).toBe(400)
  })

  it('cerrado sin parámetros: 403 que nombra la variable y no se lanza nada', async () => {
    const { app, zohoFetch } = appWith()
    const cookie = await adminCookie()
    const r = await request(app).post(RUTA).set('Cookie', cookie)
    expect([r.status, String(r.body.error).includes(VARIABLE)]).toEqual([403, true])
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('sólo `true` abre: un valor que no es el booleano `true` (TRUE, 1, vacío) deja cerrado y `true` lanza', async () => {
    const cookie = await adminCookie()
    for (const valor of ['TRUE', 1, '']) {
      const { app, zohoFetch } = appWith({ verificacionCompletitudHabilitada: valor as never })
      expect((await request(app).post(RUTA).query({ limite: '5' }).set('Cookie', cookie)).status, `valor=${String(valor)}`).toBe(403)
      expect(zohoFetch).not.toHaveBeenCalled()
    }
    const { app, zohoFetch } = abierta(); colgada(zohoFetch)
    const r = await request(app).post(RUTA).query({ limite: '5' }).set('Cookie', cookie)
    expect([r.status, r.body.lanzada, r.body.estado.enMarcha, r.body.estado.limite]).toEqual([200, true, true, 5])
  })

  it('el literal de app.ts: el interruptor llega a la ruta como booleano estricto de la variable de configuración (M8)', () => {
    const registro = appTs.split(/\r?\n/).find((l) => l.includes('registerVerificacionCompletitudRoutes(app')) ?? ''
    expect(registro).toContain('habilitado: config.verificacionCompletitudHabilitada === true')
    expect(appTs).toContain("from './routes/verificacionCompletitud'")
    expect(appTs).toContain("from './completitud/verificacion'")
  })
})

describe('verificacion-completitud · validación (escalón C), con todo abierto', () => {
  it('desde=1.5 y limite=x: 400 y no se llama a Zoho; tampoco con signo, vacío o decimal; no se lanza nada', async () => {
    await ticket('Z1', 1)
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    for (const q of [{ desde: '1.5' }, { limite: 'x' }, { desde: '-1', limite: '5' }, { limite: '' }, { limite: '1.5' }]) {
      expect((await request(app).post(RUTA).query(q).set('Cookie', cookie)).status, JSON.stringify(q)).toBe(400)
    }
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })
})

describe('verificacion-completitud · limite=0 sólo cuenta y no necesita el interruptor', () => {
  it.each([[false], [true]])('con el interruptor abierto=%s: recuento y estimación de Desk, cero llamadas a Zoho, sin pasada', async (abierto) => {
    await ticket('Z1', 1); await ticket('Z2', 2); await ticket('app-3', 3)
    const { app, zohoFetch } = appWith({ verificacionCompletitudHabilitada: abierto })
    const cookie = await adminCookie()
    const r = await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ lista: { version: 1 }, desde: null, desk: { tickets: 3 }, appNacidos: 1, porComparar: 2, peticionesMinimas: 10 })
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('con desde=2 cuenta sólo del ticket 2 en adelante (triangula) y limite=0 de un no superadministrador sigue siendo 403', async () => {
    await ticket('Z1', 1); await ticket('Z2', 2); await ticket('app-3', 3)
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ limite: '0', desde: '2' }).set('Cookie', await adminCookie())
    expect([r.body.desde, r.body.porComparar, r.body.peticionesMinimas]).toEqual([2, 1, 7])
    expect((await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', await userCookie([]))).status).toBe(403)
  })
})

describe('verificacion-completitud · POST en segundo plano, una a la vez, GET nunca lanza', () => {
  it('el GET sin pasada devuelve «sin pasada» y NO lanza: ni Zoho ni estado en marcha, ni ahora ni después', async () => {
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    const r = await request(app).get(RUTA).set('Cookie', cookie)
    expect([r.status, r.body]).toEqual([200, { enMarcha: false, terminado: false, fase: null, desde: null, limite: null, informe: null }])
    await esperar(30)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('el POST responde SIN esperar la pasada (Zoho no responde) y con una en marcha el segundo devuelve su estado sin lanzar otra', async () => {
    const { app, zohoFetch } = abierta(); colgada(zohoFetch)
    const cookie = await adminCookie()
    const a = await request(app).post(RUTA).set('Cookie', cookie)
    expect([a.status, a.body.lanzada, a.body.estado.enMarcha]).toEqual([200, true, true])
    await esperar(20)
    const llamadas = zohoFetch.mock.calls.length
    const b = await request(app).post(RUTA).set('Cookie', cookie)
    expect([b.status, b.body.lanzada, b.body.estado.enMarcha]).toEqual([200, false, true])
    await esperar(20)
    expect(zohoFetch.mock.calls.length).toBe(llamadas)
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body).toMatchObject({ enMarcha: true, fase: 'A' })
  })

  it('una pasada con error: el GET devuelve el estado con su error (código cerrado, sin el mensaje del driver), 200 y sin lanzar otra', async () => {
    const fallaLaBase: Queryable = { query: (sql: string, p?: unknown[]) => (/^SELECT id, number FROM tickets$/.test(sql) ? Promise.reject(new Error('detalle-del-driver-9931')) : db.query(sql, p)) } as Queryable
    const { app, zohoFetch } = appWith({ verificacionCompletitudHabilitada: true }, fallaLaBase)
    zohoFetch.mockImplementation(async () => new Response(JSON.stringify({ data: [] })))
    const cookie = await adminCookie()
    expect((await request(app).post(RUTA).set('Cookie', cookie)).body.lanzada).toBe(true)
    let r = await request(app).get(RUTA).set('Cookie', cookie)
    for (let i = 0; i < 200 && !r.body.terminado; i++) { await esperar(5); r = await request(app).get(RUTA).set('Cookie', cookie) }
    expect([r.status, r.body.terminado, r.body.enMarcha, r.body.error]).toEqual([200, true, false, 'base'])
    expect(JSON.stringify(r.body)).not.toContain('detalle-del-driver')
  })
})
