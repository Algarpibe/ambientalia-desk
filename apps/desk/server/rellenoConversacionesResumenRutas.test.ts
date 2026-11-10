import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * calificaciones-cuadre-conversaciones (RQ-ZS-49, D-6, L3) · el `GET /api/admin/relleno-conversaciones` devuelve además la última pasada
 * guardada (`ultimaGuardada`): `null` sin pasadas, la de otra instancia tras un redespliegue (dos `appWith` sobre la misma base), `null`
 * y `200` si la lectura falla, y `POST ?limite=0` no deja fila. Contra el servidor real de `createApp` (arnés `testing/appHarness.ts`).
 */
const RUTA = '/api/admin/relleno-conversaciones'
const TABLA = 'public.relleno_conversaciones_pasadas'
const abierta = (dbPropia?: Queryable) => appWith({ rellenoConversacionesHabilitado: true } as never, dbPropia)
const filasTabla = async () => Number(((await db.query(`SELECT count(*)::int AS n FROM ${TABLA}`)).rows[0] as { n: number }).n)
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Una base que rechaza TODA sentencia sobre la tabla del resumen y deja pasar el resto (la sesión, la lista de tickets). */
const baseQueRechaza = (real: Queryable): Queryable => ({
  query: (text, params) => (text.includes('relleno_conversaciones_pasadas') ? Promise.reject(new Error('la base rechaza la tabla')) : real.query(text, params)),
})

describe('GET · ultimaGuardada (RQ-ZS-49)', () => {
  it('sin pasadas guardadas, ultimaGuardada es null y el estado de hoy sigue entero', async () => {
    const { app, zohoFetch } = abierta()
    const r = await request(app).get(RUTA).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body.ultimaGuardada).toBeNull()
    expect(r.body).toMatchObject({ enMarcha: false, terminado: false, recorridos: 0 })
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('tras una pasada en la instancia A, la instancia B (misma base, estado inicial) devuelve «sin pasada» más la de A, sin llamar a su zohoFetch', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('T1',1,'A','Ingresado')")
    const a = abierta()
    const cookie = await adminCookie()
    const lanzada = await request(a.app).post(RUTA).set('Cookie', cookie)
    expect(lanzada.body.lanzada).toBe(true)
    await vi.waitFor(async () => {
      const g = await request(a.app).get(RUTA).set('Cookie', cookie)
      expect(g.body.terminado).toBe(true)
      expect(g.body.ultimaGuardada?.terminadaAt).toEqual(expect.any(String))   // S-14: la fila se completa un instante después del `terminado`
    }, { timeout: 5000 })
    expect(await filasTabla()).toBe(1)

    const b = abierta()
    const r = await request(b.app).get(RUTA).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ enMarcha: false, terminado: false, recorridos: 0 })
    expect(r.body.ultimaGuardada).toMatchObject({ id: expect.any(Number), lanzadaAt: expect.any(String), terminadaAt: expect.any(String) })
    expect(r.body.ultimaGuardada.resumen).toMatchObject({ terminado: true, aRecorrer: 1, limite: null })
    expect(b.zohoFetch).not.toHaveBeenCalled()
  })

  it('con una base que rechaza la tabla, el GET sigue en 200 con ultimaGuardada null', async () => {
    const { app, zohoFetch } = abierta(baseQueRechaza(db))
    const r = await request(app).get(RUTA).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body.ultimaGuardada).toBeNull()
    expect(r.body).toMatchObject({ enMarcha: false, terminado: false })
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('POST ?limite=0 · no deja fila (RQ-ZS-49)', () => {
  it('el recuento no escribe en la tabla del resumen, con el interruptor cerrado o abierto', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('T1',1,'A','Ingresado')")
    const cookie = await adminCookie()
    for (const app of [appWith().app, abierta().app]) {
      const r = await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', cookie)
      expect(r.status).toBe(200)
      expect(r.body).toEqual({ aRecorrer: 1, saltadosApp: 0 })
    }
    await esperar(30)
    expect(await filasTabla()).toBe(0)
  })
})
