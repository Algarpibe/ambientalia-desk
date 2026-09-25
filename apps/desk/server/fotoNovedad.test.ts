import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { db, instalarArnes, equipoRow, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 — «la foto se exige sólo cuando el equipo llega con novedad». RQ-RE-17, RQ-RE-18 (parte
 * servidor de la Fase 2, ya en `packages/shared/src/remision.test.ts`) y RQ-RE-08 (sexta puerta).
 *
 * Mismo ticket base que `remisiones.test.ts:124-130`, con su propio equipo/serial para no colisionar
 * con la suite de ese fichero (cada uno arranca su propia base pg-mem por prueba, así que no hace
 * falta, pero mantiene el patrón).
 */
const preparar = async () => {
  await upsertEquipo(db, equipoRow('eq-fn1', '18A20070')) // Grimm / EDM180C → grimm_edm180
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-fn1', 'Grimm', 'EDM180C', '18A1')`)
}
const crear = (app: import('express').Express, cookie: string, extra: object) =>
  request(app).post('/api/remisiones').set('Cookie', cookie)
    .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], permitirSegunda: true, ...extra })

describe('F1B-04 · el alta persiste hayNovedad', () => {
  // P2. Los cuatro casos comparten aserción: 201 y el valor persistido, nunca rechazo por este campo.
  it('true y false se guardan tal cual; ausente y no-booleano se guardan como null — P2', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()

    const conTrue = await crear(app, cookie, { hayNovedad: true })
    expect(conTrue.status).toBe(201)
    expect(conTrue.body.hayNovedad).toBe(true)

    const conFalse = await crear(app, cookie, { hayNovedad: false })
    expect(conFalse.status).toBe(201)
    expect(conFalse.body.hayNovedad).toBe(false)

    const sinClave = await crear(app, cookie, {})
    expect(sinClave.status).toBe(201)
    expect(sinClave.body.hayNovedad).toBeNull()

    const conCadena = await crear(app, cookie, { hayNovedad: 'true' })
    expect(conCadena.status).toBe(201)
    expect(conCadena.body.hayNovedad).toBeNull()

    // La respuesta del alta y la del GET coinciden — no es sólo el eco del POST.
    const get = await request(app).get(`/api/remisiones/${conTrue.body.id}`).set('Cookie', cookie)
    expect(get.body.hayNovedad).toBe(true)
  })
})

/**
 * RQ-RE-08, sexta puerta: con novedad declarada y cero fotos, `/enviar` responde 422 sin reclamar el
 * envío. Orden A<B<C<D de F1B-10: 404 (A) → anulada/ya enviada (B) → **novedad sin foto (C, nueva)** →
 * reclamación (D).
 */
describe('F1B-04 · POST /:id/enviar — sexta puerta de novedad sin foto', () => {
  // P3. Nace roja: hoy no existe la guarda, así que /enviar reclama y dispara el webhook.
  it('con novedad y cero fotos: 422, sin disparar a n8n, enviado_at sigue NULL — P3', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await crear(app, cookie, { hayNovedad: true })
      const env = await request(app).post(`/api/remisiones/${rem.body.id}/enviar`).set('Cookie', cookie)
      expect(env.status).toBe(422)
      expect(fakeFetch).not.toHaveBeenCalled()
      const fila = await db.query('SELECT enviado_at FROM remisiones WHERE id = $1', [rem.body.id])
      expect(fila.rows[0].enviado_at).toBeNull()
    } finally { vi.unstubAllGlobals() }
  })

  // P4 (C<D): tras el 422 de arriba, sube una foto y reintenta de inmediato → 200. Demuestra que la
  // guarda de la Fase 4 NO reclamó el envío (si lo hubiera hecho, este segundo intento daría 409).
  it('tras el 422, subir una foto y reenviar de inmediato tiene éxito — P4', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await crear(app, cookie, { hayNovedad: true })
      const id = rem.body.id
      expect((await request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)).status).toBe(422)

      const png = Buffer.from('89504e470d0a1a0a', 'hex')
      await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie)
        .attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })

      const env = await request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)
      expect(env.status).toBe(200)
      expect(fakeFetch).toHaveBeenCalledTimes(1)
    } finally { vi.unstubAllGlobals() }
  })

  // P5 (B<C): anulada y ya-enviada ganan a la guarda de novedad — no cambia su código de respuesta.
  it('anulada y ya enviada ganan a la guarda de novedad (orden B<C) — P5', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()

    const anulada = await crear(app, cookie, { hayNovedad: true })
    await db.query('UPDATE remisiones SET anulada_at = now() WHERE id = $1', [anulada.body.id])
    const envAnulada = await request(app).post(`/api/remisiones/${anulada.body.id}/enviar`).set('Cookie', cookie)
    expect(envAnulada.status).toBe(409)
    expect(envAnulada.body.error).toContain('anulada')

    const yaEnviada = await crear(app, cookie, { hayNovedad: true })
    await db.query("UPDATE remisiones SET estado = 'ok' WHERE id = $1", [yaEnviada.body.id])
    const envYaEnviada = await request(app).post(`/api/remisiones/${yaEnviada.body.id}/enviar`).set('Cookie', cookie)
    expect(envYaEnviada.status).toBe(409)
    expect(envYaEnviada.body.error).toContain('ya se envió')
  })

  // P6: sin novedad declarada (false o null/histórico), cero fotos no bloquea — no es retroactiva.
  it('sin novedad declarada, cero fotos no bloquea — P6', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const conFalse = await crear(app, cookie, { hayNovedad: false })
      expect((await request(app).post(`/api/remisiones/${conFalse.body.id}/enviar`).set('Cookie', cookie)).status).toBe(200)

      const sinDeclarar = await crear(app, cookie, {})
      expect((await request(app).post(`/api/remisiones/${sinDeclarar.body.id}/enviar`).set('Cookie', cookie)).status).toBe(200)
    } finally { vi.unstubAllGlobals() }
  })
})

/**
 * RQ-RE-17 · el payload a n8n no cambia (D8). `buildRemisionPayload` arma el cuerpo campo a campo, sin
 * *spread* de `Remision`, así que `hayNovedad` no puede colarse sola. Nace en VERDE: es una prueba de
 * guardia, no de un rojo previo — su valor se demuestra por mutación (M7), no por nacer rota.
 */
describe('F1B-04 · el payload a n8n no gana hayNovedad — P7', () => {
  it('con novedad y una foto, el cuerpo enviado no tiene la clave hayNovedad', async () => {
    const cookie = await adminCookie(); await preparar()
    const llamadas: Array<{ body: string }> = []
    const fakeFetch = vi.fn(async (_url: string, init: RequestInit) => {
      llamadas.push({ body: String(init.body) })
      return new Response('{}', { status: 202 })
    })
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await crear(app, cookie, { hayNovedad: true })
      const png = Buffer.from('89504e470d0a1a0a', 'hex')
      await request(app).post(`/api/remisiones/${rem.body.id}/fotos`).set('Cookie', cookie)
        .attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })

      const env = await request(app).post(`/api/remisiones/${rem.body.id}/enviar`).set('Cookie', cookie)
      expect(env.status).toBe(200)
      const enviado = JSON.parse(llamadas[0].body)
      expect(enviado).not.toHaveProperty('hayNovedad')
    } finally { vi.unstubAllGlobals() }
  })
})
