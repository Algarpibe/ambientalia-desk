import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { STATUS_REMISION_CREADA } from '@ambientalia/shared'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { createEquipo } from './db/equipos'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * LA MARCA «EN GARANTÍA» EN LAS LISTAS Y EL DETALLE (F1B-18; `tickets-core` RQ-TC-58/59, `vistas-tablero` RQ-VT-14), contra la base.
 *
 * La marca la calcula el SERVIDOR (regla invariable 13) y sale por los cuatro productores: la cola (`GET /api/tickets`,
 * `GET /api/mis-tickets`), los cerrados (`?scope=closed`), «Remisión creada» y el detalle. El día se mide en Bogotá.
 */
const G1 = '2026-03-16T01:00:00Z' // 15/03 20:00 en Bogotá
const G2 = '2026-03-16T05:30:00Z' // 16/03 00:30 en Bogotá

const equipo = (serial: string, finGarantia: string | null) =>
  createEquipo(db, { serial, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'Gecelca', clientId: null, modeloId: null, finGarantia })
const ticket = (id: string, number: number, creado: string, equipoId: string | null, extra: { status?: string; statusType?: string; derivado?: string } = {}) =>
  db.query('INSERT INTO tickets (id, number, subject, status, status_type, created_time, equipo_id, derivado_a) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, number, `T${number}`, extra.status ?? 'Ingresado', extra.statusType ?? 'Open', creado, equipoId, extra.derivado ?? null])
type Fila = { id: string; garantia?: string }
const marca = (res: { body: Fila[] }, id: string) => res.body.find((t) => t.id === id)?.garantia
const pedir = (ruta: string, cookie: string, dbPropia?: Queryable) => request(appWith({}, dbPropia).app).get(ruta).set('Cookie', cookie)

/** Cinco tickets con los resultados posibles, la frontera (G2) incluida. */
async function sembrarCinco(extra: { status?: string; statusType?: string; derivado?: string } = {}) {
  const conFin = await equipo('GA-1', '2026-03-15'); const sinFin = await equipo('GA-2', null)
  await ticket('enGar', 1, G1, conFin, extra)
  await ticket('sinDato', 2, G1, sinFin, extra)
  await ticket('vencida', 3, '2026-04-01T15:00:00Z', conFin, extra)
  await ticket('sinEquipo', 4, G1, null, extra)
  await ticket('frontera', 5, G2, conFin, extra)
}
async function sesion(n: number): Promise<{ cookie: string; id: string }> {
  const u = await createUser(db, { email: `g${n}@x.co`, name: `Usuario ${n}`, passwordHash: 'h' })
  return { cookie: `sid=${await createSession(db, u.id)}`, id: u.id }
}

describe('R1 · GET /api/tickets lleva la marca de garantía', () => {
  it('en_garantia, sin_dato, vencida (frontera incluida) y sin equipo (sin marca)', async () => {
    await sembrarCinco()
    const res = await pedir('/api/tickets', await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(5)
    expect(marca(res, 'enGar')).toBe('en_garantia')
    expect(marca(res, 'sinDato')).toBe('sin_dato')
    expect(marca(res, 'vencida')).toBe('vencida')
    expect(marca(res, 'frontera')).toBe('vencida')
    expect(res.body.find((t: Fila) => t.id === 'sinEquipo')).not.toHaveProperty('garantia')
  })
})

describe('R2 · los cerrados conservan la marca', () => {
  it('GET /api/tickets?scope=closed', async () => {
    await sembrarCinco({ status: 'Finalizado', statusType: 'Closed' })
    const res = await pedir('/api/tickets?scope=closed', await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(5)
    expect(marca({ body: res.body.items }, 'enGar')).toBe('en_garantia')
    expect(marca({ body: res.body.items }, 'sinDato')).toBe('sin_dato')
    expect(marca({ body: res.body.items }, 'frontera')).toBe('vencida')
    expect(res.body.items.find((t: Fila) => t.id === 'sinEquipo')).not.toHaveProperty('garantia')
  })
})

describe('R3 · el detalle lleva la marca', () => {
  it.each([['enGar', 'en_garantia'], ['sinDato', 'sin_dato'], ['vencida', 'vencida'], ['frontera', 'vencida']])('GET /api/tickets/%s → %s', async (id, esperada) => {
    await sembrarCinco()
    const res = await pedir(`/api/tickets/${id}`, await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body.garantia).toBe(esperada)
  })

  it('un ticket sin equipo no lleva marca', async () => {
    await sembrarCinco()
    const res = await pedir('/api/tickets/sinEquipo', await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body).not.toHaveProperty('garantia')
  })

  it('RQ-TC-59 · calcular la marca no escribe nada: ni transiciones ni cambio de estado', async () => {
    await sembrarCinco()
    const antes = (await db.query('SELECT COUNT(*)::int AS n FROM ticket_transitions')).rows[0].n
    const estadoAntes = (await db.query("SELECT status, modified_time FROM tickets WHERE id='enGar'")).rows[0]
    expect((await pedir('/api/tickets/enGar', await adminCookie())).status).toBe(200)
    expect((await db.query('SELECT COUNT(*)::int AS n FROM ticket_transitions')).rows[0].n).toBe(antes)
    expect((await db.query("SELECT status, modified_time FROM tickets WHERE id='enGar'")).rows[0]).toEqual(estadoAntes)
  })
})

describe('R4 · GET /api/remision-creada lleva la marca', () => {
  it('en_garantia, sin_dato, vencida y sin equipo', async () => {
    await sembrarCinco({ status: STATUS_REMISION_CREADA })
    const res = await pedir('/api/remision-creada', await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(5)
    expect(marca(res, 'enGar')).toBe('en_garantia')
    expect(marca(res, 'sinDato')).toBe('sin_dato')
    expect(marca(res, 'vencida')).toBe('vencida')
    expect(res.body.find((t: Fila) => t.id === 'sinEquipo')).not.toHaveProperty('garantia')
  })
})

describe('R5 · GET /api/mis-tickets lleva la marca', () => {
  it('en_garantia, sin_dato, frontera vencida y sin equipo', async () => {
    const yo = await sesion(1)
    await sembrarCinco({ derivado: yo.id })
    const res = await pedir('/api/mis-tickets', yo.cookie)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(5)
    expect(marca(res, 'enGar')).toBe('en_garantia')
    expect(marca(res, 'sinDato')).toBe('sin_dato')
    expect(marca(res, 'frontera')).toBe('vencida')
    expect(res.body.find((t: Fila) => t.id === 'sinEquipo')).not.toHaveProperty('garantia')
  })
})

describe('la lectura de garantías falla: la ruta no se cae (D5)', () => {
  /** Un `Queryable` que lanza SOLO en la consulta de garantías (la que lee `fin_garantia`) y deja pasar el resto. */
  const sinGarantias = (): Queryable => ({
    query: (t, p) => /fin_garantia/i.test(t) ? Promise.reject(new Error('equipos caída')) : db.query(t, p),
  })

  it('GET /api/tickets/:id responde 200 sin la marca', async () => {
    await sembrarCinco()
    const res = await pedir('/api/tickets/enGar', await adminCookie(), sinGarantias())
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('enGar')
    expect(res.body).not.toHaveProperty('garantia')
  })

  it('GET /api/tickets responde 200, los mismos tickets y el mismo orden, sin la marca', async () => {
    await sembrarCinco()
    const cookie = await adminCookie()
    const normal = await pedir('/api/tickets', cookie)
    const roto = await pedir('/api/tickets', cookie, sinGarantias())
    expect(roto.status).toBe(200)
    expect(roto.body.map((t: Fila) => t.id)).toEqual(normal.body.map((t: Fila) => t.id))
    expect(normal.body.some((t: Fila) => t.garantia)).toBe(true)
    expect(roto.body.some((t: Fila) => 'garantia' in t)).toBe(false)
  })
})

describe('la marca no añade consultas por ticket (sin N+1, RQ-TC-59)', () => {
  /** Cuenta las consultas que hace UNA petición: ha de ser el mismo número con 3 que con 6 tickets, cada uno con su equipo. */
  it('GET /api/tickets hace las mismas consultas con 3 que con 6 tickets con equipo', async () => {
    let consultas = 0
    const contador: Queryable = { query: (t, p) => { consultas++; return db.query(t, p) } }
    const cookie = await adminCookie()
    const sembrar = async (desde: number, hasta: number) => {
      for (let i = desde; i < hasta; i++) await ticket(`n${i}`, 100 + i, G1, await equipo(`GN-${i}`, '2026-03-15'))
    }
    const medir = async () => { consultas = 0; const res = await pedir('/api/tickets', cookie, contador); expect(res.status).toBe(200); return { consultas, filas: res.body.length } }
    await sembrar(0, 3)
    const con3 = await medir()
    await sembrar(3, 6)
    const con6 = await medir()
    expect([con3.filas, con6.filas]).toEqual([3, 6])
    expect(con6.consultas).toBe(con3.consultas)
  })
})
