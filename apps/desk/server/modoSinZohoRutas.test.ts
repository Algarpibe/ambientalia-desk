import { describe, it, expect } from 'vitest'
import type { Request, Response } from 'express'
import request from 'supertest'
import { crearRegistroModoSinZoho, ErrorModoSinZohoDesk } from '@ambientalia/zoho-sync/modoSinZoho'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'
import {
  crearModoSinZoho, responderModoSinZoho, guardaModoSinZoho, esRecuento, esConteoHistoria,
  MENSAJE_MODO_SIN_ZOHO_DESK, MENSAJE_ADJUNTO_SIN_COPIA,
} from './routes/modoSinZohoDesk'

instalarArnes()

/**
 * modo-sin-zoho (1G-04, RQ-ZS-43 y RQ-ZS-44 puntos 4 y 6, L3) · la guarda común de las rutas de administración, el manejador central y el `GET`
 * de estado. Orden total de F1B-10: sesión (401) < rol (403) < MODO (503) < interruptor propio (403) < contenido (400) < ejecución: el modo es
 * escalón B y va tras el rol y ANTES del interruptor propio y de la validación. Todo lo impone el servidor (regla invariable 13): aquí se prueba
 * contra `createApp`, con la `zohoFetch` falsa del arnés y sin red. Molde: `completitud/verificacionRutas.test.ts`.
 */
const VERIFICACION = '/api/admin/verificacion-completitud'
const RELLENO_CONV = '/api/admin/relleno-conversaciones'
const RELLENO_ADJ = '/api/admin/relleno-adjuntos'
const ESTADO = '/api/admin/modo-sin-zoho-desk'
const abierto = (extra: Partial<Record<string, boolean>> = {}, registro = crearRegistroModoSinZoho()) =>
  ({ registro, ...appWith({ modoSinZohoDesk: true, ...extra }, undefined, undefined, registro) })

/** Dos cortes del mismo origen salen de esta función: el llamador del registro es su nombre. */
function cortarDesdeAqui(registro: ReturnType<typeof crearRegistroModoSinZoho>): void {
  try { registro.cortar('/tickets/9') } catch { /* el corte se traga a propósito: suma igual */ }
}

describe('crearModoSinZoho · sólo el literal true abre', () => {
  it('activo exactamente con modoSinZohoDesk === true, y crea un registro si no llega', () => {
    const abierto = crearModoSinZoho({ modoSinZohoDesk: true } as AppConfig)
    expect(abierto.activo).toBe(true)
    expect(abierto.registro.leer()).toEqual({ cortes: [], rechazos: [] })
    expect(crearModoSinZoho({ modoSinZohoDesk: false } as AppConfig).activo).toBe(false)
    expect(crearModoSinZoho({} as AppConfig).activo).toBe(false)
  })

  it('usa el registro que llega, la MISMA instancia', () => {
    const registro = crearRegistroModoSinZoho()
    expect(crearModoSinZoho({ modoSinZohoDesk: true } as AppConfig, registro).registro).toBe(registro)
  })
})

describe('esRecuento y esConteoHistoria · la noción de cada manejador', () => {
  const con = (limite: unknown) => ({ query: { limite } }) as unknown as Request
  it('esRecuento: sólo la cadena "0" exacta', () => {
    expect(['0', '00', '', 'abc', undefined, '5'].map((l) => esRecuento(con(l)))).toEqual([true, false, false, false, false, false])
  })
  it('esConteoHistoria: presente y Number(limite) === 0', () => {
    expect(['0', '00', '', 'abc', undefined, '5'].map((l) => esConteoHistoria(con(l)))).toEqual([true, true, true, false, false, false])
  })
})

describe('responderModoSinZoho · el rechazo y el 503', () => {
  const respuesta = (headersSent = false) => {
    const llamadas: unknown[] = []
    const res = { headersSent, status(c: number) { llamadas.push(c); return this }, json(b: unknown) { llamadas.push(b); return this } }
    return { res: res as unknown as Response, llamadas }
  }

  it('suma el patrón de la ruta (baseUrl + route.path, no la URL pedida) y responde 503 con el cuerpo de D-6', () => {
    const modo = crearModoSinZoho({ modoSinZohoDesk: true } as AppConfig)
    const { res, llamadas } = respuesta()
    const req = { method: 'POST', baseUrl: '/api/x', route: { path: '/:id/reply' }, originalUrl: '/api/x/MARCADOR-ID/reply?q=MARCADOR-QUERY', url: '/MARCADOR-ID/reply' } as unknown as Request
    responderModoSinZoho(req, res, modo)
    expect(llamadas).toEqual([503, { error: MENSAJE_MODO_SIN_ZOHO_DESK, motivo: 'modo-sin-zoho-desk' }])
    const leido = modo.registro.leer()
    expect(leido.rechazos.map((r) => [r.ruta, r.cuenta])).toEqual([['POST /api/x/:id/reply', 1]])
    expect(JSON.stringify(leido)).not.toContain('MARCADOR')
  })

  it('sin req.route la ruta es (ruta desconocida); con un mensaje propio lo usa', () => {
    const modo = crearModoSinZoho({ modoSinZohoDesk: true } as AppConfig)
    const { res, llamadas } = respuesta()
    responderModoSinZoho({ method: 'GET', baseUrl: '' } as unknown as Request, res, modo, MENSAJE_ADJUNTO_SIN_COPIA)
    expect(llamadas).toEqual([503, { error: MENSAJE_ADJUNTO_SIN_COPIA, motivo: 'modo-sin-zoho-desk' }])
    expect(modo.registro.leer().rechazos.map((r) => r.ruta)).toEqual(['(ruta desconocida)'])
  })

  it('con las cabeceras ya enviadas sólo suma: no responde otra vez', () => {
    const modo = crearModoSinZoho({ modoSinZohoDesk: true } as AppConfig)
    const { res, llamadas } = respuesta(true)
    responderModoSinZoho({ method: 'GET', baseUrl: '', route: { path: '/a' } } as unknown as Request, res, modo)
    expect(llamadas).toEqual([])
    expect(modo.registro.leer().rechazos.map((r) => [r.ruta, r.cuenta])).toEqual([['GET /a', 1]])
  })

  it('los textos de D-6 son los acordados', () => {
    expect(MENSAJE_MODO_SIN_ZOHO_DESK).toBe('La app está en modo sin Zoho Desk: esta función necesita Zoho Desk y no está disponible mientras dure el modo. Lo que ya está en la base de datos sigue disponible.')
    expect(MENSAJE_ADJUNTO_SIN_COPIA).toBe('Este adjunto no está en el almacenamiento propio y la app está en modo sin Zoho Desk: no se puede traer de Zoho mientras dure el modo.')
  })
})

describe('guardaModoSinZoho · cerrado o libre pasa, abierto responde', () => {
  const montar = (activo: boolean, libre?: (r: Request) => boolean) => {
    const modo = crearModoSinZoho({ modoSinZohoDesk: activo } as AppConfig)
    const llamadas: unknown[] = []
    const res = { headersSent: false, status(c: number) { llamadas.push(c); return this }, json(b: unknown) { llamadas.push(b); return this } } as unknown as Response
    let siguio = 0
    guardaModoSinZoho(modo, libre)({ method: 'GET', baseUrl: '', route: { path: '/z' }, query: {} } as unknown as Request, res, () => { siguio++ })
    return { modo, llamadas, siguio }
  }
  it('cerrado: next() y nada más', () => {
    const r = montar(false)
    expect([r.siguio, r.llamadas, r.modo.registro.leer().rechazos]).toEqual([1, [], []])
  })
  it('abierto y libre(req): next() y no suma', () => {
    const r = montar(true, () => true)
    expect([r.siguio, r.llamadas, r.modo.registro.leer().rechazos]).toEqual([1, [], []])
  })
  it('abierto y no libre: 503, un rechazo y no sigue', () => {
    const r = montar(true, () => false)
    expect(r.siguio).toBe(0)
    expect(r.llamadas[0]).toBe(503)
    expect(r.modo.registro.leer().rechazos.map((x) => x.ruta)).toEqual(['GET /z'])
  })
})

describe('verificacion-completitud · el modo es escalón B (RQ-ZS-44.4, posición probada)', () => {
  it('sin sesión 401 y sin rol 403, aunque el modo esté abierto: el modo va DESPUÉS del rol', async () => {
    const { app, zohoFetch } = abierto()
    expect((await request(app).post(VERIFICACION)).status).toBe(401)
    expect((await request(app).post(VERIFICACION).set('Cookie', await userCookie([]))).status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('abierto, con rol, el interruptor propio cerrado y limite=abc: 503 y no 403 ni 400, sin llamar a Zoho', async () => {
    const { app, zohoFetch, registro } = abierto()
    const r = await request(app).post(VERIFICACION).query({ limite: 'abc' }).set('Cookie', await adminCookie())
    expect([r.status, r.body.motivo, r.body.error]).toEqual([503, 'modo-sin-zoho-desk', MENSAJE_MODO_SIN_ZOHO_DESK])
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(registro.leer().rechazos.map((x) => x.ruta)).toEqual(['POST /api/admin/verificacion-completitud'])
  })

  it('abierto, interruptor propio ABIERTO y limite=abc: 503 y no 400 (el modo va antes de validar)', async () => {
    const { app } = abierto({ verificacionCompletitudHabilitada: true })
    expect((await request(app).post(VERIFICACION).query({ limite: 'abc' }).set('Cookie', await adminCookie())).status).toBe(503)
  })

  it('abierto y limite=0: da su recuento y no es rechazo', async () => {
    const { app, registro } = abierto()
    const r = await request(app).post(VERIFICACION).query({ limite: '0' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(registro.leer().rechazos).toEqual([])
  })

  it('cerrado el modo, el orden de hoy sigue igual: interruptor cerrado y limite=abc dan 403; abierto el interruptor, 400', async () => {
    const cookie = await adminCookie()
    expect((await request(appWith().app).post(VERIFICACION).query({ limite: 'abc' }).set('Cookie', cookie)).status).toBe(403)
    expect((await request(appWith({ verificacionCompletitudHabilitada: true }).app).post(VERIFICACION).query({ limite: 'abc' }).set('Cookie', cookie)).status).toBe(400)
  })

  it('el GET de estado no lleva guarda: abierto el modo da 200', async () => {
    const { app } = abierto()
    expect((await request(app).get(VERIFICACION).set('Cookie', await adminCookie())).status).toBe(200)
  })
})

describe('relleno-conversaciones · el modo es escalón B', () => {
  it('sin sesión 401 y sin rol 403 con el modo abierto', async () => {
    const { app } = abierto()
    expect((await request(app).post(RELLENO_CONV)).status).toBe(401)
    expect((await request(app).post(RELLENO_CONV).set('Cookie', await userCookie([]))).status).toBe(403)
  })

  it('abierto, interruptor propio cerrado y limite=abc: 503 y no 403 ni 400; con el interruptor abierto, 503 también', async () => {
    const cookie = await adminCookie()
    const cerrado = abierto()
    const r = await request(cerrado.app).post(RELLENO_CONV).query({ limite: 'abc' }).set('Cookie', cookie)
    expect([r.status, r.body.motivo]).toEqual([503, 'modo-sin-zoho-desk'])
    expect(cerrado.zohoFetch).not.toHaveBeenCalled()
    expect((await request(abierto({ rellenoConversacionesHabilitado: true }).app).post(RELLENO_CONV).query({ limite: 'abc' }).set('Cookie', cookie)).status).toBe(503)
  })

  it('abierto y limite=0: su recuento; cerrado el modo, el 403 de hoy', async () => {
    const cookie = await adminCookie()
    expect((await request(abierto().app).post(RELLENO_CONV).query({ limite: '0' }).set('Cookie', cookie)).status).toBe(200)
    expect((await request(appWith().app).post(RELLENO_CONV).query({ limite: 'abc' }).set('Cookie', cookie)).status).toBe(403)
  })

  it('el GET de estado no lleva guarda', async () => {
    expect((await request(abierto().app).get(RELLENO_CONV).set('Cookie', await adminCookie())).status).toBe(200)
  })
})

describe('relleno-adjuntos · el modo es escalón B', () => {
  it('abierto y con rol: 503 sin llamar a Zoho, antes del interruptor propio y del contenido', async () => {
    const { app, zohoFetch } = abierto()
    const cookie = await adminCookie()
    expect((await request(app).post(RELLENO_ADJ).set('Cookie', cookie)).status).toBe(503)
    expect((await request(app).post(RELLENO_ADJ).query({ limite: 'abc' }).set('Cookie', cookie)).status).toBe(503)
    expect((await request(app).post(RELLENO_ADJ).set('Cookie', await userCookie([]))).status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('abierto y limite=0: su recuento; el GET de estado, libre; cerrado el modo, el 403 de hoy', async () => {
    const cookie = await adminCookie()
    const { app } = abierto()
    expect((await request(app).post(RELLENO_ADJ).query({ limite: '0' }).set('Cookie', cookie)).status).toBe(200)
    expect((await request(app).get(RELLENO_ADJ).set('Cookie', cookie)).status).toBe(200)
    expect((await request(appWith().app).post(RELLENO_ADJ).set('Cookie', cookie)).status).toBe(403)
  })
})

describe('admin · las rutas que llaman a Zoho dan 503 con el modo abierto', () => {
  const rutas: [string, 'get' | 'post'][] = [
    ['/api/admin/measure-attachments', 'get'], ['/api/admin/backfill-details', 'get'], ['/api/admin/backfill-archived', 'post'],
  ]
  it.each(rutas)('%s: 503 que nombra el modo, sin llamar a zohoFetch ni a sync', async (ruta, verbo) => {
    const { app, zohoFetch, sync, registro } = abierto()
    const r = await request(app)[verbo](ruta).set('Cookie', await adminCookie())
    expect([r.status, r.body.motivo, r.body.error]).toEqual([503, 'modo-sin-zoho-desk', MENSAJE_MODO_SIN_ZOHO_DESK])
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(sync.backfillArchivedTickets).not.toHaveBeenCalled()
    expect(registro.leer().rechazos.map((x) => x.ruta)).toEqual([`${verbo.toUpperCase()} ${ruta}`])
  })

  it.each(rutas)('%s: sin sesión 401 y sin rol 403 (el modo va tras el rol)', async (ruta, verbo) => {
    const { app } = abierto()
    expect((await request(app)[verbo](ruta)).status).toBe(401)
    expect((await request(app)[verbo](ruta).set('Cookie', await userCookie([]))).status).toBe(403)
  })

  it.each(rutas)('%s: con el modo cerrado se comporta como hoy (no es 503)', async (ruta, verbo) => {
    const { app } = appWith()
    expect((await request(app)[verbo](ruta).set('Cookie', await adminCookie())).status).not.toBe(503)
  })
})

describe('backfill-history · libre sólo cuando el manejador cuenta (esConteoHistoria frente a su manejador)', () => {
  const RUTA = '/api/admin/backfill-history'
  const tabla: [string, boolean][] = [['0', true], ['00', true], ['', true], ['abc', false]]
  it.each(tabla)('limite=%j abierto: el recuento %s', async (limite, cuenta) => {
    const { app, sync, registro } = abierto()
    sync.backfillTicketHistory.mockResolvedValue({ intentados: 0, poblados: 0, fallidos: 0, restantes: 7 })
    const r = await request(app).post(RUTA).query({ limite }).set('Cookie', await adminCookie())
    if (cuenta) {
      expect([r.status, r.body.restantes]).toEqual([200, 7])
      expect(sync.backfillTicketHistory).toHaveBeenCalledWith({ limite: 0 })
      expect(registro.leer().rechazos).toEqual([])
    } else {
      expect(r.status).toBe(503)
      expect(sync.backfillTicketHistory).not.toHaveBeenCalled()
    }
  })

  it('sin limite abierto: 503 y no lanza nada; sin rol 403; cerrado el modo lo lanza como hoy', async () => {
    const abiertoApp = abierto()
    const cookie = await adminCookie()
    expect((await request(abiertoApp.app).post(RUTA).set('Cookie', cookie)).status).toBe(503)
    expect(abiertoApp.sync.backfillTicketHistory).not.toHaveBeenCalled()
    expect((await request(abiertoApp.app).post(RUTA).set('Cookie', await userCookie([]))).status).toBe(403)
    const cerrado = appWith()
    expect((await request(cerrado.app).post(RUTA).set('Cookie', cookie)).body).toEqual({ started: true })
  })
})

describe('el rechazo es rechazo, no corte; y la ruta es el patrón de Express', () => {
  it('tras un 503 de guarda, rechazos lleva la ruta SIN query ni ids y cortes está VACÍO', async () => {
    const { app, registro } = abierto()
    await request(app).get('/api/admin/measure-attachments').query({ restart: '1', marcador: 'MARCADOR-QUERY-77' }).set('Cookie', await adminCookie())
    const leido = registro.leer()
    expect(leido.cortes).toEqual([])
    expect(leido.rechazos.map((r) => [r.ruta, r.cuenta])).toEqual([['GET /api/admin/measure-attachments', 1]])
    expect(JSON.stringify(leido)).not.toContain('MARCADOR')
  })

  it('el segundo 503 de la misma ruta suma: cuenta 2 con primera y última', async () => {
    const { app, registro } = abierto()
    const cookie = await adminCookie()
    await request(app).get('/api/admin/backfill-details').set('Cookie', cookie)
    await request(app).get('/api/admin/backfill-details').set('Cookie', cookie)
    expect(registro.leer().rechazos.map((r) => [r.ruta, r.cuenta])).toEqual([['GET /api/admin/backfill-details', 2]])
  })
})

describe('manejador central · el error del corte que escapa da 503 y no 500', () => {
  const RUTA = '/api/admin/backfill-history'
  it('un manejador que deja escapar ErrorModoSinZohoDesk: 503 con el cuerpo de D-6 y su rechazo (H-2: el patrón de la ruta)', async () => {
    const registro = crearRegistroModoSinZoho()
    const { app, sync } = appWith({}, undefined, undefined, registro)
    sync.backfillTicketHistory.mockRejectedValue(new ErrorModoSinZohoDesk())
    const r = await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', await adminCookie())
    expect([r.status, r.body]).toEqual([503, { error: MENSAJE_MODO_SIN_ZOHO_DESK, motivo: 'modo-sin-zoho-desk' }])
    expect(registro.leer().rechazos.map((x) => [x.ruta, x.cuenta])).toEqual([['POST /api/admin/backfill-history', 1]])
    expect(registro.leer().cortes).toEqual([])
  })

  it('el que lleva la marca de otra copia del módulo también; un Error cualquiera sigue dando 500 y no suma', async () => {
    const registro = crearRegistroModoSinZoho()
    const { app, sync } = appWith({}, undefined, undefined, registro)
    const cookie = await adminCookie()
    sync.backfillTicketHistory.mockRejectedValueOnce(Object.assign(new Error('x'), { modoSinZohoDesk: true }))
    expect((await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', cookie)).status).toBe(503)
    sync.backfillTicketHistory.mockRejectedValueOnce(new Error('otro fallo'))
    expect((await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', cookie)).status).toBe(500)
    expect(registro.leer().rechazos.map((x) => x.cuenta)).toEqual([1])
  })
})

describe('GET /api/admin/modo-sin-zoho-desk (RQ-ZS-43)', () => {
  it('sin sesión 401 y con sesión sin rol 403', async () => {
    const { app } = appWith()
    expect((await request(app).get(ESTADO)).status).toBe(401)
    expect((await request(app).get(ESTADO).set('Cookie', await userCookie([]))).status).toBe(403)
  })

  it('cerrado: 200 con { activo: false, cortes: [], rechazos: [] }', async () => {
    const r = await request(appWith().app).get(ESTADO).set('Cookie', await adminCookie())
    expect([r.status, r.body]).toEqual([200, { activo: false, cortes: [], rechazos: [] }])
  })

  it('abierto: dos cortes de un origen y un rechazo, sin llamar a Zoho y sin sumarse a sí mismo', async () => {
    const { app, zohoFetch, registro } = abierto()
    cortarDesdeAqui(registro); cortarDesdeAqui(registro)
    const cookie = await adminCookie()
    expect((await request(app).get('/api/admin/measure-attachments').set('Cookie', cookie)).status).toBe(503)
    await request(app).get(ESTADO).set('Cookie', cookie)
    const r = await request(app).get(ESTADO).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body.activo).toBe(true)
    expect(r.body.cortes).toHaveLength(1)
    expect(r.body.cortes[0]).toMatchObject({ recurso: 'GET /tickets/{x}', cuenta: 2 })
    expect(r.body.cortes[0].llamador).toContain('cortarDesdeAqui')
    expect(r.body.rechazos.map((x: { ruta: string; cuenta: number }) => [x.ruta, x.cuenta])).toEqual([['GET /api/admin/measure-attachments', 1]])
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})
