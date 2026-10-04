import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { createRole } from './auth/roles'
import { ticketsConSlaVencido } from './db/sla'
import { db, instalarArnes, appWith, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * LA LISTA DE «REMISIÓN CREADA» (F1B-07, L3; `vistas-tablero` RQ-VT-10, `decision/cola-del-taller-los-tres-cabos` punto 4).
 * La ordena el SERVIDOR (regla invariable 13) por el instante en que el ticket entró en el estado, el MISMO que mide la
 * alarma de SLA (`entradasActuales`): el más antiguo primero, los sin entrada al final, empates por número de ticket.
 */
const RC = 'Remisión creada'
const ticket = (id: string, number: number, status = RC, extra: { statusType?: string; priority?: string | null; ov?: string | null } = {}) =>
  db.query('INSERT INTO tickets (id, number, subject, status, status_type, priority, orden_venta) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, number, `T${number}`, status, extra.statusType ?? 'Open', extra.priority ?? null, extra.ov ?? null])
const entroEn = (id: string, estado: string, cuando: string) =>
  db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ($1,$2,$3,$4)', [id, 'x', estado, new Date(cuando)])
const pedir = async (cookie?: string, dbPropia?: Queryable) => {
  const r = request(appWith({}, dbPropia).app).get('/api/remision-creada')
  return cookie ? r.set('Cookie', cookie) : r
}
const ids = (res: { body: Array<{ id: string }> }) => res.body.map((t) => t.id)
async function sesionConArea(area: string): Promise<string> {
  const rol = await createRole(db, { name: `Rol-${area}`, areas: [area] })
  const u = await createUser(db, { email: `${rol.id}@x.co`, name: `Op ${area}`, passwordHash: 'h', roleId: rol.id })
  return `sid=${await createSession(db, u.id)}`
}
async function sesion(n: number): Promise<string> {
  const u = await createUser(db, { email: `u${n}@x.co`, name: `Usuario ${n}`, passwordHash: 'h' })
  return `sid=${await createSession(db, u.id)}`
}

describe('GET /api/remision-creada · el orden (RQ-VT-10)', () => {
  it('RC-1 · del más antiguo al más reciente en el estado', async () => {
    for (const [id, n, cuando] of [['d5', 1, '2026-09-05T10:00:00Z'], ['d2', 2, '2026-09-08T10:00:00Z'], ['d9', 3, '2026-09-01T10:00:00Z']] as const) {
      await ticket(id, n); await entroEn(id, RC, cuando)
    }
    const res = await pedir(await sesion(1))
    expect(res.status).toBe(200)
    expect(ids(res)).toEqual(['d9', 'd5', 'd2'])
    expect(res.body[0].enEstadoDesde).toBe('2026-09-01T10:00:00.000Z')
  })

  it('RC-2 · si entró varias veces cuenta la ÚLTIMA entrada', async () => {
    await ticket('dos', 1); await entroEn('dos', RC, '2026-08-01T00:00:00Z'); await entroEn('dos', RC, '2026-09-10T00:00:00Z')
    await ticket('uno', 2); await entroEn('uno', RC, '2026-09-05T00:00:00Z')
    const res = await pedir(await sesion(1))
    expect(ids(res)).toEqual(['uno', 'dos'])
    expect(res.body[1].enEstadoDesde).toBe('2026-09-10T00:00:00.000Z')
  })

  it('RC-3 · una entrada posterior a OTRO estado no cuenta: se usa la última a Remisión creada', async () => {
    await ticket('a', 1); await entroEn('a', RC, '2026-09-01T00:00:00Z'); await entroEn('a', 'Ticket creado', '2026-09-15T00:00:00Z')
    await ticket('b', 2); await entroEn('b', RC, '2026-09-03T00:00:00Z')
    const res = await pedir(await sesion(1))
    expect(ids(res)).toEqual(['a', 'b'])
    expect(res.body[0].enEstadoDesde).toBe('2026-09-01T00:00:00.000Z')
  })

  it('RC-4 · sin fila de entrada va al FINAL, con el instante vacío, y no se omite', async () => {
    await ticket('sin', 1)
    await ticket('x', 2); await entroEn('x', RC, '2026-09-05T00:00:00Z'); await ticket('y', 3); await entroEn('y', RC, '2026-09-06T00:00:00Z')
    const res = await pedir(await sesion(1))
    expect(ids(res)).toEqual(['x', 'y', 'sin'])
    expect(res.body[2].enEstadoDesde).toBeNull()
  })

  it('RC-5 · los empates, y el tramo sin entrada, por número de ticket ascendente', async () => {
    await ticket('v20', 20); await entroEn('v20', RC, '2026-09-05T00:00:00Z'); await ticket('v10', 10); await entroEn('v10', RC, '2026-09-05T00:00:00Z')
    await ticket('s30', 30); await ticket('s5', 5)
    expect(ids(await pedir(await sesion(1)))).toEqual(['v10', 'v20', 's5', 's30'])
  })

  it('RC-6 · la prioridad no cambia el orden: el Low antiguo va delante del Urgent reciente', async () => {
    await ticket('urg', 1, RC, { priority: 'Urgent' }); await entroEn('urg', RC, '2026-09-08T00:00:00Z')
    await ticket('low', 2, RC, { priority: 'Low' }); await entroEn('low', RC, '2026-09-01T00:00:00Z')
    expect(ids(await pedir(await sesion(1)))).toEqual(['low', 'urg'])
  })
})

describe('GET /api/remision-creada · el contenido (RQ-VT-10)', () => {
  it('RC-7 · con o sin orden de venta entran los dos', async () => {
    await ticket('conOV', 1, RC, { ov: 'OV-1' }); await ticket('sinOV', 2)
    expect(ids(await pedir(await sesion(1))).sort()).toEqual(['conOV', 'sinOV'])
  })

  it('RC-8 · sólo Remisión creada: ni Notificado ni un cerrado', async () => {
    await ticket('rc', 1); await ticket('notif', 2, 'Notificado'); await ticket('cerrado', 3, RC, { statusType: 'Closed' })
    expect(ids(await pedir(await sesion(1)))).toEqual(['rc'])
  })

  it('RC-9 · H5: el instante es el MISMO que mide la alarma (`ticketsConSlaVencido`) para el mismo ticket', async () => {
    await ticket('al', 1); await entroEn('al', RC, '2026-09-01T12:00:00Z'); await entroEn('al', 'Notificado', '2026-09-03T12:00:00Z')
    const vencidos = await ticketsConSlaVencido(db, new Date('2026-09-30T12:00:00Z'))
    const alarma = vencidos.find((v) => v.id === 'al')
    expect(alarma).toBeDefined()
    const res = await pedir(await sesion(1))
    expect(res.body[0].enEstadoDesde).toBe(alarma!.desde.toISOString())
  })
})

describe('GET /api/remision-creada · acceso y coste', () => {
  it('RC-10 · sin sesión → 401; cualquier área la lee', async () => {
    await ticket('rc', 1)
    expect((await pedir()).status).toBe(401)
    for (const area of ['Comercial', 'Servicio Técnico', 'Compras']) {
      const res = await request(appWith().app).get('/api/remision-creada').set('Cookie', await sesionConArea(area))
      expect(res.status).toBe(200)
      expect(ids(res)).toEqual(['rc'])
    }
  })

  it('RC-11 · sin N+1: las mismas consultas con 3 que con 6 tickets', async () => {
    const cookie = await sesion(1)
    const medir = async () => {
      let consultas = 0
      const contador: Queryable = { query: (t, p) => { consultas++; return db.query(t, p) } }
      const res = await pedir(cookie, contador)
      expect(res.status).toBe(200)
      return { consultas, filas: res.body.length }
    }
    const sembrar = async (desde: number, hasta: number) => {
      for (let i = desde; i < hasta; i++) { await ticket(`q${i}`, 100 + i); await entroEn(`q${i}`, RC, `2026-09-${String(10 + i).padStart(2, '0')}T00:00:00Z`) }
    }
    await sembrar(0, 3)
    const con3 = await medir()
    await sembrar(3, 6)
    const con6 = await medir()
    expect([con3.filas, con6.filas]).toEqual([3, 6])
    expect(con6.consultas).toBe(con3.consultas)
  })
})

/** Caracterización (nace verde): la lista no concede ni quita permiso; «Habilitar Servicio» lo sigue guardando el servidor por área. */
describe('«Habilitar Servicio» desde un ticket de la lista sigue guardado por el servidor', () => {
  it('RC-12 · un usuario de Servicio Técnico recibe 403 por área y el ticket no se mueve', async () => {
    await ticket('rc', 1); await entroEn('rc', RC, '2026-09-05T00:00:00Z')
    const cookie = await userCookie(['Servicio Técnico'])
    const res = await request(appWith().app).post('/api/tickets/rc/transition').set('Cookie', cookie).send({ transitionId: 'habilitar_servicio', values: {} })
    expect(res.status).toBe(403)
    expect(((await db.query("SELECT status FROM tickets WHERE id='rc'")).rows[0] as { status: string }).status).toBe(RC)
  })
})
