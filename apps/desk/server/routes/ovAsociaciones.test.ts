import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { asociarOV, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()

/**
 * API de `ov_asociaciones` (asociacion-ov-ticket, lote 5; `tickets-core` RQ-TC-19 y RQ-TC-20).
 *
 * Escalera de precedencia de liberar (F1B-10): A `404` inexistente < B `403` sin Comercial / `409` ya liberada
 * < C `422` motivo vacío. Las lecturas las puede pedir cualquier usuario con sesión (supuesto reversible:
 * leer no decide nada y la ficha la ve también Servicio Técnico).
 */
const asociar = (ticketId: string, numero: string) =>
  asociarOV(db, { ticketId, numero, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
const fila = async (id: number) => (await db.query('SELECT * FROM ov_asociaciones WHERE id = $1', [id])).rows[0]
const cuantas = async () => Number((await db.query('SELECT count(*) AS n FROM ov_asociaciones')).rows[0].n)

// Cada rol es una fila: [nombre, cookie (null = sin sesión), estado esperado al liberar, estado esperado al leer].
type Rol = [string, (() => Promise<string>) | null, number, number]
const ROLES: Rol[] = [
  ['sin sesión', null, 401, 401],
  ['Servicio Técnico', () => userCookie(['Servicio Técnico']), 403, 200],
  ['Compras sola', () => userCookie(['Compras']), 403, 200],
  ['Comercial', () => userCookie(['Comercial']), 200, 200],
  ['Comercial + Compras', () => userCookie(['Comercial', 'Compras']), 200, 200],
  ['administrador', () => adminCookie(), 200, 200],
]

describe('PUT /api/ov-asociaciones/:id/liberar · matriz por área', () => {
  it.each(ROLES)('%s', async (_n, cookie, esperadoLiberar) => {
    const a = await asociar('t1', 'OV-2026-001')
    const { app } = appWith()
    const rq = request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).send({ motivo: 'error de tecleo' })
    const res = cookie ? await rq.set('Cookie', await cookie()) : await rq
    expect(res.status).toBe(esperadoLiberar)
    if (esperadoLiberar === 200) {
      expect(res.body).toMatchObject({ id: a.id, motivo_liberacion: 'error de tecleo' })
      expect(res.body.liberada_at).toBeTruthy()
    } else {
      const f = await fila(a.id)
      expect(f.liberada_at).toBeNull()
      expect(f.motivo_liberacion).toBeNull()
    }
  })
})

describe.each([
  ['GET /api/tickets/:id/ov-asociaciones', '/api/tickets/t1/ov-asociaciones'],
  ['GET /api/ov-asociaciones/cuarentena', '/api/ov-asociaciones/cuarentena'],
  ['GET /api/ov-asociaciones/saldo/:lote', '/api/ov-asociaciones/saldo/OV-2026-170'],
])('%s · matriz por área', (_n, url) => {
  it.each(ROLES)('%s', async (_r, cookie, _liberar, esperadoLectura) => {
    const { app } = appWith()
    const rq = request(app).get(url)
    const res = cookie ? await rq.set('Cookie', await cookie()) : await rq
    expect(res.status).toBe(esperadoLectura)
  })
})

describe('GET /api/tickets/:id/ov-asociaciones', () => {
  it('devuelve las vigentes y las liberadas, distinguibles por liberada_at', async () => {
    const v = await asociar('t1', 'OV-2026-001')
    const l = await asociar('t1', 'OV-2026-002')
    await liberarAsociacion(db, l.id, 'Comercial', 'duplicada')
    await asociar('t2', 'OV-2026-003')
    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/ov-asociaciones').set('Cookie', await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const por = Object.fromEntries(res.body.map((r: { numero: string }) => [r.numero, r]))
    expect(por['OV-2026-001'].liberada_at).toBeNull()
    expect(por['OV-2026-002'].liberada_at).toBeTruthy()
    expect(por['OV-2026-001'].id).toBe(v.id)
  })
})

describe('PUT /api/ov-asociaciones/:id/liberar · escalera A < B < C', () => {
  it('liberar conserva la fila (el recuento no cambia) y guarda quién y por qué', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    await asociar('t2', 'OV-2026-002')
    const antes = await cuantas()
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Comercial'])).send({ motivo: '  ticket duplicado  ' })
    expect(res.status).toBe(200)
    expect(await cuantas()).toBe(antes)
    expect(await fila(a.id)).toMatchObject({ liberada_por: 'Op', motivo_liberacion: 'ticket duplicado' })
  })

  it('A: inexistente → 404 aunque el usuario no sea Comercial (A antes que B)', async () => {
    const { app } = appWith()
    const res = await request(app).put('/api/ov-asociaciones/9999/liberar').set('Cookie', await userCookie(['Servicio Técnico'])).send({ motivo: '' })
    expect(res.status).toBe(404)
  })

  // Regla de mutación 1: las dos guardas activas a la vez. B (403) antes que C (422).
  it('sin Comercial Y motivo vacío → 403, no 422', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Servicio Técnico'])).send({ motivo: '   ' })
    expect(res.status).toBe(403)
    expect((await fila(a.id)).liberada_at).toBeNull()
  })

  it('ya liberada Y motivo vacío (Comercial) → 409, no 422', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    await liberarAsociacion(db, a.id, 'Comercial', 'primera')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Comercial'])).send({})
    expect(res.status).toBe(409)
    expect((await fila(a.id)).motivo_liberacion).toBe('primera')
  })

  it('sin Comercial Y ya liberada → 403, no 409', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    await liberarAsociacion(db, a.id, 'Comercial', 'primera')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Servicio Técnico'])).send({ motivo: 'x' })
    expect(res.status).toBe(403)
  })

  it.each([[{ motivo: '' }], [{ motivo: '   ' }], [{}], [{ motivo: 7 }]])('C: motivo %j → 422 y la fila no cambia', async (body) => {
    const a = await asociar('t1', 'OV-2026-001')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Comercial'])).send(body)
    expect(res.status).toBe(422)
    expect((await fila(a.id)).liberada_at).toBeNull()
  })
})

describe('GET /api/ov-asociaciones/cuarentena y /saldo/:lote', () => {
  const ov = (id: string, n: string) => db.query(
    "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ($1,$2,'c','Corola','2026-06-01',1,'open',$3)",
    [id, n, JSON.stringify({ order_status: 'open' })])

  it('cuarentena devuelve listarCuarentena', async () => {
    await ov('s1', 'OV-2026-170-01'); await ov('s2', 'OV-2026-170-X9')
    const { app } = appWith()
    const res = await request(app).get('/api/ov-asociaciones/cuarentena').set('Cookie', await userCookie(['Comercial']))
    expect(res.body.map((c: { number: string }) => c.number)).toEqual(['OV-2026-170-X9'])
  })

  it('saldo devuelve saldoPorLote', async () => {
    await ov('s1', 'OV-2026-170-01'); await ov('s2', 'OV-2026-170-02')
    await asociarOV(db, { ticketId: 't1', numero: 'OV-2026-170-01', salesorderId: 's1', origen: 'alta', actor: 't', fechaOrdenCompra: null })
    const { app } = appWith()
    const res = await request(app).get('/api/ov-asociaciones/saldo/OV-2026-170').set('Cookie', await userCookie(['Comercial']))
    expect(res.body).toEqual({ lote: 'OV-2026-170', creadas: 2, consumidas: 1, libres: 1, consumido: 50 })
  })

  it('un lote con formato inválido → 422', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/ov-asociaciones/saldo/OV-2026-170-01').set('Cookie', await userCookie(['Comercial']))
    expect(res.status).toBe(422)
  })
})
