import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * LA COLA DEL TALLER (F1B-07, lote 2b; `vistas-tablero` RQ-VT-09, `decision/e099-orden-cola-taller`), contra la base.
 *
 * El orden lo impone el SERVIDOR (regla invariable 13): `GET /api/tickets` y `GET /api/mis-tickets` salen de la misma
 * función, `colaDelTaller`. Dentro de una prioridad manda la ÚLTIMA «Habilitar Servicio» (S-10a); sin fila cuenta
 * `created_time` (S-10b).
 */
const ticket = async (id: string, number: number, priority: string | null, created: string, extra: { derivado?: string; statusType?: string } = {}) => {
  await db.query('INSERT INTO tickets (id, number, subject, status, status_type, priority, created_time, derivado_a) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, number, `T${number}`, 'Ingresado', extra.statusType ?? 'Open', priority, created, extra.derivado ?? null])
}
const habilitar = async (id: string, cuando: string) => {
  await db.query("INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ($1,'habilitar_servicio','Habilitado',$2)", [id, cuando])
}
const ids = (res: { body: Array<{ id: string }> }) => res.body.map((t) => t.id)
async function sesion(n: number): Promise<{ cookie: string; id: string }> {
  const u = await createUser(db, { email: `u${n}@x.co`, name: `Usuario ${n}`, passwordHash: 'h' })
  return { cookie: `sid=${await createSession(db, u.id)}`, id: u.id }
}
const pedir = (ruta: string, cookie: string, dbPropia?: Queryable) => request(appWith({}, dbPropia).app).get(ruta).set('Cookie', cookie)

describe('GET /api/tickets · el tablero llega en el orden de la cola (RQ-VT-09)', () => {
  it('VT09-1 · las cinco prioridades en orden: Urgent, High, Medium, Low, null', async () => {
    const c = '2026-09-01T00:00:00Z'
    await ticket('low', 1, 'Low', c); await ticket('nul', 2, null, c); await ticket('urg', 3, 'Urgent', c); await ticket('med', 4, 'Medium', c); await ticket('hig', 5, 'High', c)
    expect(ids(await pedir('/api/tickets', await adminCookie()))).toEqual(['urg', 'hig', 'med', 'low', 'nul'])
  })

  it('VT09-2 · el creado DESPUÉS pero habilitado ANTES va delante', async () => {
    await ticket('creadoAntes', 1, 'High', '2026-08-01T00:00:00Z'); await habilitar('creadoAntes', '2026-09-20T10:00:00Z')
    await ticket('creadoDespues', 2, 'High', '2026-09-30T00:00:00Z'); await habilitar('creadoDespues', '2026-09-01T10:00:00Z')
    expect(ids(await pedir('/api/tickets', await adminCookie()))).toEqual(['creadoDespues', 'creadoAntes'])
  })

  it('VT09-3 · un ticket habilitado DOS veces cuenta la última (S-10a)', async () => {
    await ticket('dos', 1, 'Medium', '2026-01-03T00:00:00Z'); await habilitar('dos', '2026-02-01T00:00:00Z'); await habilitar('dos', '2026-09-25T00:00:00Z')
    await ticket('una', 2, 'Medium', '2026-01-02T00:00:00Z'); await habilitar('una', '2026-09-10T00:00:00Z')
    // con la primera habilitación `dos` iría delante; con la última (25/09) va detrás de `una` (10/09)
    expect(ids(await pedir('/api/tickets', await adminCookie()))).toEqual(['una', 'dos'])
  })

  it('VT09-4 · un ticket SIN fila de habilitación cuenta created_time (S-10b)', async () => {
    await ticket('conFila', 1, 'Medium', '2026-01-01T00:00:00Z'); await habilitar('conFila', '2026-09-25T00:00:00Z')
    await ticket('sinFila', 2, 'Medium', '2026-09-15T00:00:00Z')
    await ticket('sinFilaTarde', 3, 'Medium', '2026-09-28T00:00:00Z')
    expect(ids(await pedir('/api/tickets', await adminCookie()))).toEqual(['sinFila', 'conFila', 'sinFilaTarde'])
  })

  it('VT09-5 · Low habilitado antes que High: High va delante (la urgencia manda sobre la fecha)', async () => {
    await ticket('low', 1, 'Low', '2026-09-20T00:00:00Z'); await habilitar('low', '2026-01-02T00:00:00Z')
    await ticket('high', 2, 'High', '2026-09-01T00:00:00Z'); await habilitar('high', '2026-09-30T00:00:00Z')
    expect(ids(await pedir('/api/tickets', await adminCookie()))).toEqual(['high', 'low'])
  })

  it('VT09-6 · una prioridad desconocida («Alta») va al final', async () => {
    await ticket('alta', 1, 'Alta', '2026-09-01T00:00:00Z'); await ticket('low', 2, 'Low', '2026-01-01T00:00:00Z')
    expect(ids(await pedir('/api/tickets', await adminCookie()))).toEqual(['low', 'alta'])
  })

  it('VT09-8 · conserva esperandoAprobacionCliente y el orden de la cola a la vez', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,priority,created_time) VALUES ('nc',70,'NC','Notificación cliente','Open','Low','2026-06-03T00:00:00Z')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,priority,created_time) VALUES ('ot',71,'OT','Notificado','Open','High','2026-06-02T00:00:00Z')")
    await db.query("INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ('nc','x','Notificación cliente','2026-09-09T13:00:00Z')")
    await db.query("INSERT INTO public.alarmas_avisadas (ticket_id, estado, entrada_at, avisos_creados) VALUES ('nc','Notificación cliente','2026-09-09T13:00:00Z',1)")
    const res = await pedir('/api/tickets', await adminCookie())
    expect(ids(res)).toEqual(['ot', 'nc'])
    expect(res.body.map((t: { esperandoAprobacionCliente: boolean }) => t.esperandoAprobacionCliente)).toEqual([false, true])
  })

  it('sin sesión → 401', async () => {
    expect((await request(appWith().app).get('/api/tickets')).status).toBe(401)
  })
})

describe('GET /api/mis-tickets · sólo los suyos, abiertos y en el orden de la cola (RQ-VT-09)', () => {
  it('VT09-7 · sólo los abiertos derivados al usuario, con la misma forma y el orden de la cola', async () => {
    const yo = await sesion(1); const otro = await sesion(2)
    await ticket('m-low', 1, 'Low', '2026-09-01T00:00:00Z', { derivado: yo.id })
    await ticket('m-high', 2, 'High', '2026-09-02T00:00:00Z', { derivado: yo.id })
    await ticket('m-cerrado', 3, 'Urgent', '2026-09-03T00:00:00Z', { derivado: yo.id, statusType: 'Closed' })
    await ticket('de-otro', 4, 'Urgent', '2026-09-04T00:00:00Z', { derivado: otro.id })
    await ticket('sin-derivar', 5, 'Urgent', '2026-09-05T00:00:00Z')
    const res = await pedir('/api/mis-tickets', yo.cookie)
    expect(res.status).toBe(200)
    expect(ids(res)).toEqual(['m-high', 'm-low'])
    const general = await pedir('/api/tickets', yo.cookie)
    expect(res.body[0]).toEqual(general.body.find((t: { id: string }) => t.id === 'm-high'))
  })

  it('el orden de «Mis tickets» usa la habilitación: el habilitado antes va delante', async () => {
    const yo = await sesion(1)
    await ticket('tarde', 1, 'High', '2026-08-01T00:00:00Z', { derivado: yo.id }); await habilitar('tarde', '2026-09-20T00:00:00Z')
    await ticket('pronto', 2, 'High', '2026-09-30T00:00:00Z', { derivado: yo.id }); await habilitar('pronto', '2026-09-01T00:00:00Z')
    expect(ids(await pedir('/api/mis-tickets', yo.cookie))).toEqual(['pronto', 'tarde'])
  })

  it('sin sesión → 401', async () => {
    expect((await request(appWith().app).get('/api/mis-tickets')).status).toBe(401)
  })
})

describe('la cola del taller · VT09-9 sin N+1', () => {
  /** Cuenta las consultas que hace UNA petición: el número ha de ser el mismo con N que con 2N tickets. */
  async function medir(ruta: string, cookie: string): Promise<{ consultas: number; filas: number }> {
    let consultas = 0
    const contador: Queryable = { query: (t, p) => { consultas++; return db.query(t, p) } }
    const res = await pedir(ruta, cookie, contador)
    expect(res.status).toBe(200)
    return { consultas, filas: res.body.length }
  }

  it.each(['/api/tickets', '/api/mis-tickets'])('%s hace las mismas consultas con 3 que con 6 tickets', async (ruta) => {
    const yo = await sesion(1)
    const sembrar = async (desde: number, hasta: number) => {
      for (let i = desde; i < hasta; i++) {
        await ticket(`q${i}`, 1000 + i, i % 2 ? 'High' : 'Low', '2026-09-01T00:00:00Z', { derivado: yo.id })
        await habilitar(`q${i}`, `2026-09-${String(10 + i).padStart(2, '0')}T00:00:00Z`)
      }
    }
    await sembrar(0, 3)
    const con3 = await medir(ruta, yo.cookie)
    await sembrar(3, 6)
    const con6 = await medir(ruta, yo.cookie)
    expect([con3.filas, con6.filas]).toEqual([3, 6])
    expect(con6.consultas).toBe(con3.consultas)
  })
})
