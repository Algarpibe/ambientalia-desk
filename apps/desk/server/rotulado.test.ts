import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { reclamarEnvio } from './db/remisiones'
import { db, instalarArnes, equipoRow, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`rotulado-tras-enviar`) · lote 1a: quién envió (RQ-RE-42, R42-a, R42-b, R42-d).
 * `reclamarEnvio` escribe `enviado_por_id` en el MISMO UPDATE que gana la reclamación; `liberarEnvio` lo limpia.
 */
type App = import('express').Express
const URL_N8N = { remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' }
const PNG = Buffer.from('89504e470d0a1a0a', 'hex')

const preparar = async () => {
  await upsertEquipo(db, equipoRow('eq-rc1', '18A20070'))
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-rc1', 'Grimm', 'EDM180C', '18A1')`)
}
const conN8n = async (prueba: (fetchMock: ReturnType<typeof vi.fn>) => Promise<void>) => {
  const fetchMock = vi.fn(async (...args: [string, RequestInit]) => { void args; return new Response('{}', { status: 202 }) })
  vi.stubGlobal('fetch', fetchMock)
  try { await prueba(fetchMock) } finally { vi.unstubAllGlobals() }
}
const nueva = async (app: App, cookie: string) =>
  (await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], novedades: ['sin_novedad'], rotulado: true })).body.id as string
const subirTodas = async (app: App, cookie: string, id: string) => {
  for (const categoria of ['equipo', 'accesorios', 'embalaje']) {
    const r = await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie).field('categoria', categoria).attach('file', PNG, { filename: 'f.png', contentType: 'image/png' })
    expect(r.status).toBe(201)
  }
}
const enviar = (app: App, cookie: string, id: string) => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)
const idDe = async (email: string) => String((await db.query('SELECT id FROM users WHERE email = $1', [email])).rows[0].id)
const enviadoPor = async (id: string) => (await db.query('SELECT enviado_por_id FROM remisiones WHERE id = $1', [id])).rows[0].enviado_por_id
const enviadoAt = async (id: string) => (await db.query('SELECT enviado_at FROM remisiones WHERE id = $1', [id])).rows[0].enviado_at

describe('RQ-RE-42 · quién envió: enviado_por_id (R42-a, R42-b, R42-d)', () => {
  it('R42-a · el envío ganador guarda el id de quien envió, y un reenvío tras un error lo sobrescribe con el de quien reenvía', () => conN8n(async () => {
    const admin = await adminCookie(); const op = await userCookie(['Servicio Técnico']); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, admin); await subirTodas(app, admin, id)
    expect(await enviadoPor(id), 'antes de enviar nadie envió').toBeNull()
    expect((await enviar(app, admin, id)).status).toBe(200)
    expect(await enviadoPor(id)).toBe(await idDe('admin@x.co'))
    // el callback informa un error: el envío ya no está en curso y se puede reenviar
    await db.query("UPDATE remisiones SET estado = 'error', resuelto_at = now() WHERE id = $1", [id])
    expect((await enviar(app, op, id)).status).toBe(200)
    expect(await enviadoPor(id), 'el reenvío sobrescribe').toBe(await idDe('op@x.co'))
  }))

  it('R42-b · quien pierde la reclamación no escribe, y el 422 de contenido tampoco', () => conN8n(async (n8n) => {
    const admin = await adminCookie(); const op = await userCookie(['Servicio Técnico']); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, admin)
    expect((await enviar(app, admin, id)).status, 'sin fotos: puerta de contenido').toBe(422)
    expect(await enviadoPor(id), 'el 422 de contenido no escribe').toBeNull()
    expect(n8n).not.toHaveBeenCalled()
    await subirTodas(app, admin, id)
    expect((await enviar(app, admin, id)).status).toBe(200)
    const ganador = await enviadoPor(id)
    expect(ganador).toBe(await idDe('admin@x.co'))
    expect((await enviar(app, op, id)).status, 'quien llega tarde pierde la reclamación').toBe(409)
    expect(await enviadoPor(id), 'quien pierde no escribe').toBe(ganador)
  }))

  it('R42-d · si el disparo no sale, liberarEnvio limpia enviado_por_id junto con enviado_at', () => conN8n(async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith() // sin remisionWebhookUrl: el disparo no sale
    const id = await nueva(app, admin); await subirTodas(app, admin, id)
    const r = await enviar(app, admin, id)
    expect(r.status).toBe(502)
    expect(await enviadoAt(id)).toBeNull()
    expect(await enviadoPor(id), 'quien no llegó a enviar no es «quien envió»').toBeNull()
  }))

  it('R42-e · pg-mem acepta `enviado_por_id = $4` con el parámetro en null:reclamarEnvio sin el cuarto argumento gana y deja NULL (nace verde)', async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, admin)
    expect(await reclamarEnvio(db, id)).toBe(true)
    expect(await enviadoAt(id)).not.toBeNull()
    expect(await enviadoPor(id)).toBeNull()
  })
})
