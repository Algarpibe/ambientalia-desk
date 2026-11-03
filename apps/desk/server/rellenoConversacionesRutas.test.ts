import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * relleno-completo-conversaciones (1G-01, RQ-ZS-29, L3) · las dos rutas `/api/admin/relleno-conversaciones` y su guarda.
 * Orden total de F1B-10: sesión (401) < rol (403) < interruptor (403) < contenido (400) < ejecución. El rol y el interruptor los impone el
 * servidor (regla invariable 13): aquí se prueban contra el servidor real de `createApp`, con la `zohoFetch` falsa del arnés.
 * Molde: `admin.test.ts` (401/403) y `migracionTicketsAbiertosRuta.test.ts` (interruptor cerrado antes de validar).
 */
const RUTA = '/api/admin/relleno-conversaciones'
const siembra = async () => {
  for (const [id, num] of [['T1', 1], ['T2', 2], ['T3', 3], ['T4', 4], ['T5', 5], ['app-x', 6]] as const) {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,$2,'A','Ingresado')", [id, num])
  }
}
const filas = async (tabla: string) => Number(((await db.query(`SELECT count(*)::int AS n FROM ${tabla}`)).rows[0] as { n: number }).n)
/** Una `zohoFetch` que nunca responde: la pasada queda EN MARCHA mientras dura la prueba. */
const colgada = (z: { mockImplementation: (f: () => Promise<Response>) => unknown }) => z.mockImplementation(() => new Promise<Response>(() => {}))
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const abierta = () => appWith({ rellenoConversacionesHabilitado: true } as never)

describe('relleno-conversaciones · sesión y rol (escalón B)', () => {
  it('sin sesión, 401 en POST y en GET', async () => {
    const { app, zohoFetch } = abierta()
    expect((await request(app).post(RUTA)).status).toBe(401)
    expect((await request(app).get(RUTA)).status).toBe(401)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('un usuario que no es superadministrador recibe 403 en POST y en GET, con el interruptor abierto, y no se lanza nada', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    const op = await userCookie([])
    expect((await request(app).post(RUTA).set('Cookie', op)).status).toBe(403)
    expect((await request(app).get(RUTA).set('Cookie', op)).status).toBe(403)
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', await adminCookie())).body.enMarcha).toBe(false)
  })

  it('con el interruptor cerrado, el rol va ANTES: el que no es superadministrador no oye hablar de la variable', async () => {
    const { app } = appWith()
    const r = await request(app).post(RUTA).set('Cookie', await userCookie([]))
    expect(r.status).toBe(403)
    expect(JSON.stringify(r.body)).not.toContain('RELLENO_CONVERSACIONES_HABILITADO')
  })
})

describe('relleno-conversaciones · interruptor cerrado (escalón B antes que el contenido C)', () => {
  it('POST cerrado: 403 que nombra la variable y ofrece limite=0, sin llamar a Zoho', async () => {
    await siembra()
    const { app, zohoFetch } = appWith()
    const r = await request(app).post(RUTA).set('Cookie', await adminCookie())
    expect(r.status).toBe(403)
    expect(r.body.error).toContain('RELLENO_CONVERSACIONES_HABILITADO')
    expect(r.body.error).toContain('limite=0')
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('cerrado y limite=abc: 403 y no 400 (la guarda va antes de validar)', async () => {
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ limite: 'abc' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(403)
    expect(r.body.error).toContain('RELLENO_CONVERSACIONES_HABILITADO')
  })

  it('cerrado y desde=abc&limite=5: 403 y no 400 (P1: el interruptor va antes de validar)', async () => {
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ desde: 'abc', limite: '5' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(403)
    expect(r.body.error).toContain('RELLENO_CONVERSACIONES_HABILITADO')
  })

  it('el GET no lo gobierna el interruptor: cerrado, devuelve el estado', async () => {
    const { app } = appWith()
    const r = await request(app).get(RUTA).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ enMarcha: false, terminado: false, recorridos: 0 })
  })
})

describe('relleno-conversaciones · validación (escalón C), con el interruptor abierto', () => {
  it('limite no numérico, negativo, decimal o vacío: 400', async () => {
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    for (const limite of ['abc', '-1', '1.5', '']) {
      expect((await request(app).post(RUTA).query({ limite }).set('Cookie', cookie)).status, `limite=${limite}`).toBe(400)
    }
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('desde no numérico: 400, y no se lanza nada', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    expect((await request(app).post(RUTA).query({ desde: 'abc' }).set('Cookie', cookie)).status).toBe(400)
    expect((await request(app).post(RUTA).query({ desde: 'abc', limite: '5' }).set('Cookie', cookie)).status).toBe(400)
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('relleno-conversaciones · limite=0 sólo cuenta (S-3)', () => {
  it.each([[false], [true]])('con el interruptor abierto=%s: cuenta 5 por recorrer y 1 app- saltado, sin Zoho y sin escribir', async (abierto) => {
    await siembra()
    const { app, zohoFetch, sync } = appWith({ rellenoConversacionesHabilitado: abierto } as never)
    const antes = [await filas('tickets'), await filas('conversations')]
    const cookie = await adminCookie()
    const r = await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ aRecorrer: 5, saltadosApp: 1 })
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(sync.syncTicket).not.toHaveBeenCalled()
    expect([await filas('tickets'), await filas('conversations')]).toEqual(antes)
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('con desde=3 cuenta sólo del 3 en adelante (triangula el recuento)', async () => {
    await siembra()
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ limite: '0', desde: '3' }).set('Cookie', await adminCookie())
    expect(r.body).toEqual({ aRecorrer: 3, saltadosApp: 1 })
  })

  it('limite=0 de un no superadministrador sigue siendo 403 (el rol manda aunque no escriba)', async () => {
    const { app } = appWith()
    expect((await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', await userCookie([]))).status).toBe(403)
  })
})

describe('relleno-conversaciones · POST en segundo plano, GET nunca lanza, POST en marcha', () => {
  it('el GET sin pasada devuelve «sin pasada» y NO lanza: ni Zoho ni estado en marcha, ni ahora ni después', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    const r = await request(app).get(RUTA).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ enMarcha: false, terminado: false, aRecorrer: 0 })
    await esperar(30)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('el POST responde SIN esperar la pasada (la zohoFetch nunca responde) y la pasada arranca', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    colgada(zohoFetch)
    const cookie = await adminCookie()
    const r = await request(app).post(RUTA).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body.lanzada).toBe(true)
    expect(r.body.estado.enMarcha).toBe(true)
    const t0 = Date.now()
    while (zohoFetch.mock.calls.length === 0 && Date.now() - t0 < 3000) await esperar(10)
    expect(zohoFetch.mock.calls.length).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/T1')
    const g = await request(app).get(RUTA).set('Cookie', cookie)
    expect(g.body).toMatchObject({ enMarcha: true, aRecorrer: 5, saltadosApp: 1 })
  })

  it('el POST pasa desde y limite a la pasada', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    colgada(zohoFetch)
    const r = await request(app).post(RUTA).query({ desde: '2', limite: '1' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body.estado).toMatchObject({ desde: 2, limite: 1 })
  })

  it('un segundo POST con la pasada en marcha devuelve su estado y NO lanza otra', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    colgada(zohoFetch)
    const cookie = await adminCookie()
    const primero = await request(app).post(RUTA).set('Cookie', cookie)
    expect(primero.body.lanzada).toBe(true)
    const segundo = await request(app).post(RUTA).query({ desde: '4' }).set('Cookie', cookie)
    expect(segundo.status).toBe(200)
    expect(segundo.body.lanzada).toBe(false)
    expect(segundo.body.estado).toMatchObject({ enMarcha: true, desde: null })
    await esperar(30)
    expect(zohoFetch.mock.calls.length).toBe(1)
  })
})
