import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { crearRegistroModoSinZoho, ErrorModoSinZohoDesk } from '@ambientalia/zoho-sync/modoSinZoho'
import { logger } from './util/logger'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'
import { MENSAJE_MODO_SIN_ZOHO_DESK, MENSAJE_ADJUNTO_SIN_COPIA } from './routes/modoSinZohoDesk'

instalarArnes()

/**
 * modo-sin-zoho (1G-04, RQ-ZS-40 y RQ-ZS-44 puntos 3, 4, 5 y 6, L4) · las aperturas sirven lo local, la respuesta da `503` en su posición y el
 * adjunto sin copia responde claro. Orden de la respuesta (excepción escrita en RQ-ZS-44.4): `ENABLE_WRITES` (403) < área (403) < MODO (503).
 * Todo lo impone el servidor (regla invariable 13): aquí se prueba contra `createApp`, con `sync` y `zohoFetch` falsos del arnés y sin red.
 * Moldes: `tickets.test.ts` (aperturas) y `adjuntos/servirLocal.test.ts` (adjunto).
 */
const LOCAL = '90210' // id numérico: no nació en la app, así que cerrado el modo iría al `sync` perezoso
const SIN_DATOS = '77777'
const abierto = (extra: Partial<Record<string, boolean | string>> = {}, registro = crearRegistroModoSinZoho()) =>
  ({ registro, ...appWith({ modoSinZohoDesk: true, ...extra }, undefined, undefined, registro) })

async function sembrarTicketLocal(): Promise<void> {
  await db.query(`INSERT INTO tickets (id,number,subject,status) VALUES ('${LOCAL}',702,'E','Ingresado')`)
  await db.query(`INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('${LOCAL}','Habilitar','OV asignada','Ingresado','Admin','2026-08-03T10:00:00Z')`)
}

describe('aperturas con el modo abierto · lo local sin llamar a sync, y 404 sin datos (RQ-ZS-44.3)', () => {
  it('detalle, conversaciones e historia del ticket con datos locales: 200 con lo local y sync sin una llamada', async () => {
    await sembrarTicketLocal()
    const cookie = await adminCookie()
    const { app, sync } = abierto()
    const detalle = await request(app).get(`/api/tickets/${LOCAL}`).set('Cookie', cookie)
    expect(detalle.status).toBe(200)
    expect(detalle.body).toMatchObject({ number: '#702' })
    const conv = await request(app).get(`/api/tickets/${LOCAL}/conversations`).set('Cookie', cookie)
    expect(conv.status).toBe(200)
    expect(conv.body.map((m: { content: string }) => m.content)).toEqual(['Habilitar: OV asignada → Ingresado'])
    const hist = await request(app).get(`/api/tickets/${LOCAL}/history`).set('Cookie', cookie)
    expect(hist.status).toBe(200)
    expect(hist.body.map((e: { title: string }) => e.title)).toContain('Transición: Habilitar')
    for (const espia of Object.values(sync)) expect(espia).not.toHaveBeenCalled()
  })

  it('el ticket sin datos locales: 404 en las tres aperturas y sync sin una llamada', async () => {
    const cookie = await adminCookie()
    const { app, sync } = abierto()
    for (const sufijo of ['', '/conversations', '/history']) {
      const res = await request(app).get(`/api/tickets/${SIN_DATOS}${sufijo}`).set('Cookie', cookie)
      expect([sufijo, res.status, res.body]).toEqual([sufijo, 404, { error: 'Ticket no encontrado' }])
    }
    for (const espia of Object.values(sync)) expect(espia).not.toHaveBeenCalled()
  })

  it('cerrado, el detalle y la conversación siguen yendo a sync (el modo no cambia lo de hoy)', async () => {
    await sembrarTicketLocal()
    const cookie = await adminCookie()
    const { app, sync } = appWith()
    await request(app).get(`/api/tickets/${LOCAL}`).set('Cookie', cookie)
    await request(app).get(`/api/tickets/${LOCAL}/conversations`).set('Cookie', cookie)
    await request(app).get(`/api/tickets/${LOCAL}/history`).set('Cookie', cookie)
    expect(sync.syncTicket).toHaveBeenCalledWith(LOCAL)
    expect(sync.syncConversations).toHaveBeenCalledWith(LOCAL)
    expect(sync.syncTicketHistory).toHaveBeenCalledWith(LOCAL)
  })
})

describe('POST /api/tickets/:id/reply · la posición del 503 (RQ-ZS-44.4, excepción)', () => {
  const responder = (app: ReturnType<typeof appWith>['app'], cookie: string) =>
    request(app).post(`/api/tickets/${LOCAL}/reply`).set('Cookie', cookie).send({ content: 'hola', to: 'a@x.co' })

  it('ENABLE_WRITES cerrado: su 403, aunque el modo esté abierto y aunque no haya área', async () => {
    const cookie = await userCookie([])
    const { app, zohoFetch, registro } = abierto({ enableWrites: false })
    const res = await responder(app, cookie)
    expect([res.status, res.body.error]).toEqual([403, 'Escrituras deshabilitadas (ENABLE_WRITES=false)'])
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(registro.leer().rechazos).toEqual([])
  })

  it('ENABLE_WRITES abierto y sin área: el 403 del área, no el 503', async () => {
    const cookie = await userCookie([])
    const { app, zohoFetch, registro } = abierto({ enableWrites: true })
    const res = await responder(app, cookie)
    expect([res.status, res.body.error]).toEqual([403, 'Tu rol no tiene un área asignada para responder'])
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(registro.leer().rechazos).toEqual([])
  })

  it('con ENABLE_WRITES y área: 503 con el texto del modo, rechazo en su ruta y zohoFetch sin una llamada', async () => {
    const cookie = await userCookie(['Servicio Técnico'])
    const { app, zohoFetch, registro } = abierto({ enableWrites: true })
    const res = await responder(app, cookie)
    expect([res.status, res.body]).toEqual([503, { error: MENSAJE_MODO_SIN_ZOHO_DESK, motivo: 'modo-sin-zoho-desk' }])
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(registro.leer().rechazos.map((r) => [r.ruta, r.cuenta])).toEqual([['POST /api/tickets/:id/reply', 1]])
  })

  it('cerrado, la respuesta llama a Zoho como hoy', async () => {
    const cookie = await userCookie(['Servicio Técnico'])
    const { app, zohoFetch } = appWith({ enableWrites: true })
    await responder(app, cookie)
    expect(zohoFetch).toHaveBeenCalled()
  })
})

describe('GET /api/attachment · con copia se sirve, sin ella 503 claro (RQ-ZS-40, RQ-ZS-44.5 y .6)', () => {
  const HREF = (id: string) => `/tickets/10/comments/20/attachments/${id}/content`
  const MARCADOR = 'MARCADOR-NOMBRE-ADJUNTO'
  let base: string
  let dir: string
  beforeEach(async () => {
    base = await mkdtemp(join(tmpdir(), 'modo-adj-'))
    dir = join(base, 'volumen'); await mkdir(dir)
    await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ('T10', 10, 'Asunto', 'Ingresado')")
  })
  afterEach(async () => { await rm(base, { recursive: true, force: true }); vi.restoreAllMocks() })

  async function fila(id: string, size: number | null = null): Promise<void> {
    await db.query('INSERT INTO attachments (id, ticket_id, name, size, content_type, zoho_href, storage_path) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, 'T10', `${MARCADOR}.png`, size, 'image/png', HREF(id), size === null ? null : id])
  }
  const pedir = (app: ReturnType<typeof appWith>['app'], id: string, cookie: string) =>
    request(app).get('/api/attachment').query({ path: HREF(id) }).set('Cookie', cookie)
  const lineasDeCaida = (espia: ReturnType<typeof vi.spyOn>) =>
    espia.mock.calls.filter((c: unknown[]) => typeof c[0] === 'object' && c[0] !== null && 'motivo' in (c[0] as object))

  it('con copia local válida se sirve igual que hoy, sin llamar a Zoho ni dejar línea de caída', async () => {
    await fila('5001', 8); await writeFile(join(dir, '5001'), Buffer.alloc(8, 7))
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const { app, zohoFetch } = abierto({ adjuntosDir: dir })
    const res = await pedir(app, '5001', cookie).buffer(true)
    expect(res.status).toBe(200)
    expect(res.headers['content-length']).toBe('8')
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(lineasDeCaida(espia)).toHaveLength(0)
  })

  it('sin copia: 503 con el texto de D-6, una línea de log sin el nombre, rechazo en su ruta y Zoho sin llamadas', async () => {
    await fila('5002')
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const { app, zohoFetch, registro } = abierto({ adjuntosDir: dir })
    const res = await pedir(app, '5002', cookie)
    expect([res.status, res.body]).toEqual([503, { error: MENSAJE_ADJUNTO_SIN_COPIA, motivo: 'modo-sin-zoho-desk' }])
    expect(zohoFetch).not.toHaveBeenCalled()
    const lineas = lineasDeCaida(espia)
    expect(lineas).toHaveLength(1)
    expect(lineas[0][0]).toMatchObject({ adjunto: '5002', ticket: 10, motivo: 'sin copia' })
    expect(JSON.stringify(espia.mock.calls)).not.toContain(MARCADOR); expect(JSON.stringify(espia.mock.calls)).not.toContain(HREF('5002'))
    expect(registro.leer().rechazos.map((r) => [r.ruta, r.cuenta])).toEqual([['GET /api/attachment', 1]])
  })

  it('sin sesión: 401 y la ruta inválida: 400, antes de cualquier 503', async () => {
    const { app } = abierto({ adjuntosDir: dir })
    expect((await request(app).get('/api/attachment').query({ path: HREF('5003') })).status).toBe(401)
    const cookie = await userCookie(['Servicio Técnico'])
    expect((await request(app).get('/api/attachment').query({ path: '/otra/cosa' }).set('Cookie', cookie)).status).toBe(400)
  })

  it('H-2 · cerrado y con un zohoFetch que lanza el error del corte: 503 por el manejador central y rechazo GET /api/attachment', async () => {
    await fila('5004')
    const cookie = await userCookie(['Servicio Técnico'])
    const registro = crearRegistroModoSinZoho()
    const { app, zohoFetch } = appWith({ adjuntosDir: dir }, undefined, undefined, registro)
    zohoFetch.mockRejectedValue(new ErrorModoSinZohoDesk())
    const res = await pedir(app, '5004', cookie)
    expect([res.status, res.body]).toEqual([503, { error: MENSAJE_MODO_SIN_ZOHO_DESK, motivo: 'modo-sin-zoho-desk' }])
    expect(registro.leer().rechazos).toMatchObject([{ ruta: 'GET /api/attachment', cuenta: 1 }])
  })
})
