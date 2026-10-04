import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { upsertEquipo } from './db/equipos'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * LA BÚSQUEDA DEL LISTADO POR HTTP (F1B-08, RQ-VT-11): `?q=` en `GET /api/tickets` y `GET /api/mis-tickets`.
 *
 * El servidor filtra y valida (regla invariable 13): la escalera es 401 (sin sesión) antes que 422 (contenido).
 */
const ticket = async (n: number, o: { serial?: string | null; equipoId?: string | null; cerrado?: boolean; prioridad?: string | null; derivado?: string } = {}) => {
  const creado = new Date(Date.UTC(2026, 0, 1) + n * 60_000).toISOString()
  await db.query(
    'INSERT INTO tickets (id, number, subject, status, status_type, serial, equipo_id, priority, derivado_a, created_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [`t-${n}`, n, `T${n}`, o.cerrado ? 'Finalizado' : 'Ingresado', o.cerrado ? 'Closed' : 'Open', o.serial ?? null, o.equipoId ?? null, o.prioridad ?? null, o.derivado ?? null, creado],
  )
}
const pedir = (ruta: string, cookie?: string) => {
  const r = request(appWith().app).get(ruta)
  return cookie ? r.set('Cookie', cookie) : r
}
const numeros = (res: { body: Array<{ number: string }> }) => res.body.map((t) => t.number).sort()
async function sesion(n: number): Promise<{ cookie: string; id: string }> {
  const u = await createUser(db, { email: `u${n}@x.co`, name: `Usuario ${n}`, passwordHash: 'h' })
  return { cookie: `sid=${await createSession(db, u.id)}`, id: u.id }
}

describe('GET /api/tickets?q= · activos', () => {
  it('criterio 1: por número exacto, con y sin #; 86 no devuelve el 864', async () => {
    await ticket(864, { serial: 'ZZ-1' }); await ticket(8640, { serial: 'ZZ-2' }); await ticket(7, { serial: 'ZZ-3' })
    const c = await adminCookie()
    expect(numeros(await pedir('/api/tickets?q=864', c))).toEqual(['#864'])
    expect(numeros(await pedir('/api/tickets?q=%23864', c))).toEqual(['#864'])
    expect(numeros(await pedir('/api/tickets?q=86', c))).toEqual([])
  })

  it('criterio 2: últimos dígitos del serial, mayúsculas y espacios a los lados', async () => {
    await ticket(1, { serial: 'SN-0042517' }); await ticket(2, { serial: 'OTRO-9' })
    const c = await adminCookie()
    expect(numeros(await pedir('/api/tickets?q=2517', c))).toEqual(['#1'])
    expect(numeros(await pedir('/api/tickets?q=sn-0042', c))).toEqual(['#1'])
    expect(numeros(await pedir('/api/tickets?q=%20%20Sn-0042517%20', c))).toEqual(['#1'])
  })

  it('el serial corregido del equipo también encuentra el ticket (criterio 3)', async () => {
    await upsertEquipo(db, { id: 'eq-1', serial: 'NUEVO-88', marca: null, modelo: null, tipo: null, cliente_nombre: null, source: 'test', raw: null })
    await ticket(10, { serial: 'VIEJO-77', equipoId: 'eq-1' }); await ticket(11, { serial: 'AJENO' })
    const c = await adminCookie()
    expect(numeros(await pedir('/api/tickets?q=nuevo-88', c))).toEqual(['#10'])
    expect(numeros(await pedir('/api/tickets?q=viejo-77', c))).toEqual(['#10'])
  })

  it('scope=all acepta q igual que el activo', async () => {
    await ticket(1, { serial: 'AAA' }); await ticket(2, { serial: 'BBB', cerrado: true })
    expect(numeros(await pedir('/api/tickets?scope=all&q=bbb', await adminCookie()))).toEqual(['#2'])
  })

  it('«%23» (un # solo) es válido y no encuentra nada', async () => {
    await ticket(1, { serial: 'AAA' })
    const res = await pedir('/api/tickets?q=%23', await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('la búsqueda no segmenta la visibilidad: dos áreas ven el mismo resultado', async () => {
    await ticket(1, { serial: 'COM-1' }); await ticket(2, { serial: 'OTRO' })
    const a = await pedir('/api/tickets?q=com-1', await userCookie(['Comercial']))
    const b = await pedir('/api/tickets?q=com-1', await adminCookie())
    expect(a.status).toBe(200)
    expect(numeros(a)).toEqual(['#1'])
    expect(numeros(b)).toEqual(['#1'])
  })
})

describe('GET /api/tickets?scope=closed&q= · cerrados con total filtrado', () => {
  it('total filtrado, página 2 con el resto y página fuera de rango vacía', async () => {
    for (let n = 1; n <= 55; n++) await ticket(n, { serial: `LOTE-${n}`, cerrado: true })
    for (let n = 101; n <= 103; n++) await ticket(n, { serial: `OTRO-${n}`, cerrado: true })
    const c = await adminCookie()
    const p1 = await pedir('/api/tickets?scope=closed&q=lote', c)
    expect(p1.status).toBe(200)
    expect(p1.body.total).toBe(55)
    expect(p1.body.items).toHaveLength(50)
    const p2 = await pedir('/api/tickets?scope=closed&page=2&q=lote', c)
    expect(p2.body.total).toBe(55)
    expect(p2.body.items).toHaveLength(5)
    const p9 = await pedir('/api/tickets?scope=closed&page=9&q=lote', c)
    expect(p9.body.items).toEqual([])
    expect(p9.body.total).toBe(55)
  })

  it('un cerrado que casa por número no aparece en activos y uno activo no aparece en cerrados', async () => {
    await ticket(864, { serial: 'X', cerrado: true }); await ticket(865, { serial: 'X' })
    const c = await adminCookie()
    expect(numeros(await pedir('/api/tickets?q=864', c))).toEqual([])
    const cerr = await pedir('/api/tickets?scope=closed&q=864', c)
    expect(cerr.body.total).toBe(1)
    expect(cerr.body.items.map((t: { number: string }) => t.number)).toEqual(['#864'])
  })
})

describe('GET /api/mis-tickets?q=', () => {
  it('sólo los derivados al usuario que casan, en el orden de la cola (RQ-VT-09)', async () => {
    const yo = await sesion(1); const otro = await sesion(2)
    await ticket(1, { serial: 'AB-1', prioridad: 'Low', derivado: yo.id })
    await ticket(2, { serial: 'AB-2', prioridad: 'Urgent', derivado: yo.id })
    await ticket(3, { serial: 'ZZ-3', prioridad: 'High', derivado: yo.id })
    await ticket(4, { serial: 'AB-4', prioridad: 'Urgent', derivado: otro.id })
    await ticket(5, { serial: 'AB-5', prioridad: 'Urgent', derivado: yo.id, cerrado: true })
    const res = await pedir('/api/mis-tickets?q=ab-', yo.cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((t: { number: string }) => t.number)).toEqual(['#2', '#1'])
  })
})

describe('validación del texto (escalón C, 422)', () => {
  it('65 caracteres con sesión → 422; 64 → 200; la lista repetida → 422', async () => {
    const c = await adminCookie()
    const r65 = await pedir(`/api/tickets?q=${'a'.repeat(65)}`, c)
    expect(r65.status).toBe(422)
    expect(r65.body.error).toBe('La búsqueda admite 64 caracteres como máximo')
    expect((await pedir(`/api/tickets?q=${'a'.repeat(64)}`, c)).status).toBe(200)
    expect((await pedir('/api/tickets?q=a&q=b', c)).status).toBe(422)
    expect((await pedir('/api/tickets?scope=closed&q=a&q=b', c)).status).toBe(422)
    expect((await pedir(`/api/mis-tickets?q=${'a'.repeat(65)}`, c)).status).toBe(422)
    expect((await pedir('/api/mis-tickets?q=a&q=b', c)).status).toBe(422)
  })

  it('80 espacios es lo mismo que no buscar', async () => {
    await ticket(1, { serial: 'AAA' }); await ticket(2, { serial: 'BBB' })
    const c = await adminCookie()
    const con = await pedir(`/api/tickets?q=${'%20'.repeat(80)}`, c)
    expect(con.status).toBe(200)
    expect(con.body).toEqual((await pedir('/api/tickets', c)).body)
  })
})

describe('posición de las guardas y q vacío (CARACTERIZACIÓN: nacen verdes)', () => {
  it('MP-2 · 65 caracteres SIN sesión → 401, no 422, en las dos rutas', async () => {
    const largo = 'a'.repeat(65)
    expect((await pedir(`/api/tickets?q=${largo}`)).status).toBe(401)
    expect((await pedir(`/api/mis-tickets?q=${largo}`)).status).toBe(401)
  })

  it('q ausente, vacío y de espacios dan el mismo cuerpo, en activos, cerrados y «Mis tickets»', async () => {
    const yo = await sesion(1)
    await ticket(1, { serial: 'AAA', derivado: yo.id }); await ticket(2, { serial: 'BBB', cerrado: true })
    for (const base of ['/api/tickets', '/api/tickets?scope=closed', '/api/mis-tickets']) {
      const sep = base.includes('?') ? '&' : '?'
      const sin = await pedir(base, yo.cookie)
      expect(sin.status).toBe(200)
      expect((await pedir(`${base}${sep}q=`, yo.cookie)).body).toEqual(sin.body)
      expect((await pedir(`${base}${sep}q=%20%20%20`, yo.cookie)).body).toEqual(sin.body)
    }
  })
})
