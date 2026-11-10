import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import request from 'supertest'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createSync } from '@ambientalia/zoho-sync/sync'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { crearRellenoConversaciones, type EstadoRelleno } from './rellenoConversaciones'
import { db as dbArnes, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * calificaciones-cuadre-conversaciones (RQ-ZS-50, D-7, CA-8, L3) · `numeros` acota la pasada del relleno a una lista de números de ticket
 * (los 51 de E-257). Dos niveles: el módulo (`crearRellenoConversaciones`, pg-mem y `createSync` real, molde
 * `apps/desk/server/rellenoConversacionesResumen.test.ts`) y la ruta (`createApp` con el arnés). La posición del `400` se prueba con DOS
 * guardas activas a la vez (regla de mutación 1): `numeros=x` más sesión, rol, modo o interruptor, y cada una gana al `400`.
 */
const config = { departmentId: 'DEP' } as AppConfig
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = () => new Response(null, { status: 204 })
const conv = (id: string) => ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' })
const detalle = (id: string, numero: number) =>
  ({ id, ticketNumber: String(numero), subject: 'Asunto ' + id, status: 'Ingresado', commentCount: '0', threadCount: '1' })

/** Un servidor falso: cada ticket `Zn` tiene su detalle y UNA conversación. */
function servidor() {
  return vi.fn(async (path: string) => {
    const m = /^\/tickets\/([^/?]+)(\/conversations)?\?(.*)$/.exec(path)
    if (m && !m[2]) return json(detalle(m[1], Number(m[1].slice(1))))
    if (m && m[2]) return Number(new URLSearchParams(m[3]).get('from')) === 0 ? json({ data: [conv(m[1] + '-c0')] }) : vacio()
    if (path.startsWith('/contacts/') || path.startsWith('/accounts/')) return json({}, 404)
    throw new Error('petición inesperada ' + path)
  })
}
/** Los ids cuyo detalle se pidió, en el orden de las peticiones. */
const detallesPedidos = (z: ReturnType<typeof servidor>) =>
  z.mock.calls.map((c) => /^\/tickets\/([^/?]+)\?include=/.exec(String(c[0]))?.[1]).filter((x): x is string => x !== undefined)

describe('módulo · numeros acota la pasada (D-7)', () => {
  let db: Queryable
  const sembrar = async () => {
    for (const [id, n] of [['Z10', 10], ['Z11', 11], ['app-12', 12], ['Z13', 13], ['Z14', 14], ['Z15', 15]] as const) {
      await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ($1, $2, 'Viejo', 'Ingresado')", [id, n])
    }
  }
  const montar = (zohoFetch: ReturnType<typeof servidor>) => {
    const sync = createSync({ zohoFetch, db, config })
    return crearRellenoConversaciones({ zohoFetch, db, sync, marcar: false, pausaMs: 0, pausa429Ms: 0, registrar: () => {} })
  }
  const esperarFin = (r: { estado(): EstadoRelleno }) => vi.waitFor(() => expect(r.estado().terminado).toBe(true), { timeout: 5000 })
  const ultimaFila = async () => {
    const f = (await db.query('SELECT terminada_at, resumen FROM public.relleno_conversaciones_pasadas ORDER BY id DESC LIMIT 1')).rows[0] as { terminada_at: unknown; resumen: unknown }
    return { terminada: f?.terminada_at ?? null, resumen: (typeof f?.resumen === 'string' ? JSON.parse(f.resumen) : f?.resumen) as Record<string, unknown> }
  }

  beforeEach(async () => {
    const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
    vi.restoreAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('numeros [14, 12, 11] (el 12 es app-): recorre sólo el 11 y el 14, en ese orden, y el 12 se salta como hoy', async () => {
    await sembrar()
    const z = servidor(); const r = montar(z)
    r.lanzar({ numeros: [14, 12, 11] })
    await esperarFin(r)
    expect(detallesPedidos(z)).toEqual(['Z11', 'Z14'])
    expect(r.estado()).toMatchObject({ numeros: [14, 12, 11], aRecorrer: 2, saltadosApp: 1, recorridos: 2, noEncontrados: [] })
  })

  it('sin numeros recorre los de siempre y el estado lleva numeros null y noEncontrados vacío', async () => {
    await sembrar()
    const z = servidor(); const r = montar(z)
    expect(r.estado()).toMatchObject({ numeros: null, noEncontrados: [] })
    r.lanzar({})
    await esperarFin(r)
    expect(detallesPedidos(z)).toEqual(['Z10', 'Z11', 'Z13', 'Z14', 'Z15'])
    expect(r.estado()).toMatchObject({ numeros: null, noEncontrados: [], aRecorrer: 5, saltadosApp: 1 })
  })

  it('un número que no está en la base se nombra en noEncontrados y no se recorre; numeros y noEncontrados quedan en la fila guardada', async () => {
    await sembrar()
    const z = servidor(); const r = montar(z)
    r.lanzar({ numeros: [11, 99, 14] })
    await esperarFin(r)
    expect(detallesPedidos(z)).toEqual(['Z11', 'Z14'])
    expect(r.estado()).toMatchObject({ aRecorrer: 2, noEncontrados: [99] })
    await vi.waitFor(async () => expect((await ultimaFila()).terminada).not.toBeNull(), { timeout: 5000 })
    expect((await ultimaFila()).resumen).toMatchObject({ numeros: [11, 99, 14], noEncontrados: [99], aRecorrer: 2 })
  })

  it('con limite, acota DESPUÉS de filtrar por numeros', async () => {
    await sembrar()
    const z = servidor(); const r = montar(z)
    r.lanzar({ numeros: [15, 13, 14], limite: 2 })
    await esperarFin(r)
    expect(detallesPedidos(z)).toEqual(['Z13', 'Z14'])
    expect(r.estado()).toMatchObject({ aRecorrer: 2, recorridos: 2, limite: 2 })
  })

  it('recuento con numeros añade noEncontrados; sin numeros no lo lleva (el toEqual de hoy)', async () => {
    await sembrar()
    const r = montar(servidor())
    expect(await r.recuento({ numeros: [11, 14, 999] })).toEqual({ aRecorrer: 2, saltadosApp: 0, noEncontrados: [999] })
    expect(await r.recuento({ numeros: [12, 11] })).toEqual({ aRecorrer: 1, saltadosApp: 1, noEncontrados: [] })
    expect(await r.recuento({})).toEqual({ aRecorrer: 5, saltadosApp: 1 })
    expect(await r.recuento({ desde: 14 })).toEqual({ aRecorrer: 2, saltadosApp: 0 })
  })
})

describe('ruta · numeros (RQ-ZS-50)', () => {
  const RUTA = '/api/admin/relleno-conversaciones'
  const siembra = async () => {
    for (const [id, n] of [['T11', 11], ['T12', 12], ['T14', 14], ['app-x', 20]] as const) {
      await dbArnes.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,$2,'A','Ingresado')", [id, n])
    }
  }
  const filasTabla = async () => Number(((await dbArnes.query('SELECT count(*)::int AS n FROM public.relleno_conversaciones_pasadas')).rows[0] as { n: number }).n)
  const lista = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(',')
  const abierta = () => appWith({ rellenoConversacionesHabilitado: true } as never)
  const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  it('interruptor cerrado y numeros=11,14,999&limite=0: cuenta 2, 0 app- y nombra el 999, sin Zoho ni fila', async () => {
    await siembra()
    const { app, zohoFetch, sync } = appWith()
    const r = await request(app).post(RUTA).query({ numeros: '11,14,999', limite: '0' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ aRecorrer: 2, saltadosApp: 0, noEncontrados: [999] })
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(sync.syncTicket).not.toHaveBeenCalled()
    expect(await filasTabla()).toBe(0)
  })

  it('numeros sin ordenar y con repetidos se normalizan: ascendente y sin repetidos', async () => {
    await siembra()
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ numeros: '14,11,14,11', limite: '0' }).set('Cookie', await adminCookie())
    expect(r.body).toEqual({ aRecorrer: 2, saltadosApp: 0, noEncontrados: [] })
  })

  it('el POST sin limite lanza la pasada sólo con esos números y el estado los lleva', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    zohoFetch.mockImplementation(() => new Promise<Response>(() => {}))
    const r = await request(app).post(RUTA).query({ numeros: '14,11' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body.lanzada).toBe(true)
    expect(r.body.estado).toMatchObject({ numeros: [11, 14], aRecorrer: 0 })
    await vi.waitFor(() => expect(zohoFetch.mock.calls.length).toBe(1), { timeout: 3000 })
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/T11')
  })

  it.each([
    ['vacío', { numeros: '' }],
    ['una letra', { numeros: '1,x' }],
    ['una coma doble', { numeros: '1,,2' }],
    ['201 números', { numeros: lista(201) }],
    ['repetido en la query', { numeros: ['1', '2'] }],
    ['junto a desde', { numeros: '1,2', desde: '1' }],
  ])('numeros %s: 400 y no llama a Zoho', async (_n, query) => {
    await siembra()
    const { app, zohoFetch } = abierta()
    const r = await request(app).post(RUTA).query(query).set('Cookie', await adminCookie())
    expect(r.status).toBe(400)
    expect(r.body.error).toContain('numeros')
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(await filasTabla()).toBe(0)
  })

  it('el 400 también vale con limite=0 y el interruptor cerrado', async () => {
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ numeros: '1,x', limite: '0' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(400)
  })

  it('200 números no dan 400 (el tope es 200 y entra)', async () => {
    await siembra()
    const { app } = appWith()
    const r = await request(app).post(RUTA).query({ numeros: lista(200), limite: '0' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body.aRecorrer).toBe(3)
  })

  describe('posición del 400 (regla de mutación 1): numeros=x activa el 400 y además una guarda anterior', () => {
    const q = { numeros: 'x' }

    it('sin sesión: 401 y no 400', async () => {
      const { app } = abierta()
      expect((await request(app).post(RUTA).query(q)).status).toBe(401)
    })

    it('con sesión sin permiso de rol: 403 de rol y no 400', async () => {
      const { app } = abierta()
      const r = await request(app).post(RUTA).query(q).set('Cookie', await userCookie([]))
      expect(r.status).toBe(403)
      expect(JSON.stringify(r.body)).not.toContain('RELLENO_CONVERSACIONES_HABILITADO')
    })

    it('modo sin Zoho abierto: 503 y no 400 ni 403', async () => {
      const { app, zohoFetch } = appWith({ modoSinZohoDesk: true, rellenoConversacionesHabilitado: false } as never)
      const r = await request(app).post(RUTA).query(q).set('Cookie', await adminCookie())
      expect([r.status, r.body.motivo]).toEqual([503, 'modo-sin-zoho-desk'])
      expect(zohoFetch).not.toHaveBeenCalled()
    })

    it('interruptor cerrado y sin limite=0: 403 que nombra la variable y no 400', async () => {
      const { app } = appWith()
      const r = await request(app).post(RUTA).query(q).set('Cookie', await adminCookie())
      expect(r.status).toBe(403)
      expect(r.body.error).toContain('RELLENO_CONVERSACIONES_HABILITADO')
    })

    it('todo abierto: 400', async () => {
      const { app } = abierta()
      expect((await request(app).post(RUTA).query(q).set('Cookie', await adminCookie())).status).toBe(400)
    })
  })
})
