import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * HUECOS DE LA VERIFICACIÓN de `busqueda-ticket-serial` (F1B-08): lo que `busquedaTickets.test.ts` no fija por HTTP.
 * `%` y `_` sin escapar (S-4), el tope de 64 con espacios a los lados (S-9) y el mismo filtro en `items` y `total`.
 */
const ticket = (n: number, serial: string | null, cerrado = false) => db.query(
  'INSERT INTO tickets (id, number, subject, status, status_type, serial, created_time) VALUES ($1,$2,$3,$4,$5,$6,$7)',
  [`t-${n}`, n, `T${n}`, cerrado ? 'Finalizado' : 'Ingresado', cerrado ? 'Closed' : 'Open', serial, new Date(Date.UTC(2026, 0, 1) + n * 60_000).toISOString()],
)
let cookie = ''
const get = (ruta: string) => request(appWith().app).get(ruta).set('Cookie', cookie)

describe('huecos de la búsqueda por HTTP', () => {
  it('S-4: «%» y «_» llegan sin escapar y son comodines; un ticket sin serial no casa', async () => {
    cookie = await adminCookie(); await ticket(1, 'AB-1'); await ticket(2, 'XY-2'); await ticket(3, null)
    expect((await get('/api/tickets?q=%25')).body.map((t: { number: string }) => t.number).sort()).toEqual(['#1', '#2'])
    expect((await get('/api/tickets?q=A_-1')).body.map((t: { number: string }) => t.number)).toEqual(['#1'])
    expect((await get('/api/tickets?q=_')).body).toHaveLength(2)
  })

  it('S-9: 64 caracteres tras recortar son válidos aunque lleven espacios a los lados; 65 no', async () => {
    cookie = await adminCookie(); await ticket(1, 'a'.repeat(64))
    const res = await get(`/api/tickets?q=${encodeURIComponent(`  ${'a'.repeat(64)}  `)}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect((await get(`/api/tickets?q=${encodeURIComponent(` ${'a'.repeat(65)} `)}`)).status).toBe(422)
  })

  it('scope=closed: items y total salen del mismo filtro con comodín, y scope=all junta activos y cerrados', async () => {
    cookie = await adminCookie(); await ticket(1, 'LOTE-1', true); await ticket(2, 'LOTE-2', true); await ticket(3, 'LOTE-3'); await ticket(4, 'OTRO', true)
    const c = (await get('/api/tickets?scope=closed&q=lote_')).body
    expect(c.total).toBe(2)
    expect(c.items.map((t: { number: string }) => t.number).sort()).toEqual(['#1', '#2'])
    expect((await get('/api/tickets?scope=all&q=lote')).body).toHaveLength(3)
  })

  it('D8: un equipo desactivado sigue encontrando su ticket por su serial', async () => {
    cookie = await adminCookie()
    await upsertEquipo(db, { id: 'eq-9', serial: 'BAJA-99', marca: null, modelo: null, tipo: null, cliente_nombre: null, source: 'test', raw: null })
    await db.query("UPDATE equipos SET active = false WHERE id = 'eq-9'")
    await db.query('INSERT INTO tickets (id, number, subject, status, status_type, equipo_id) VALUES ($1,$2,$3,$4,$5,$6)', ['t-9', 9, 'T9', 'Ingresado', 'Open', 'eq-9'])
    expect((await get('/api/tickets?q=baja-99')).body.map((t: { number: string }) => t.number)).toEqual(['#9'])
  })
})
