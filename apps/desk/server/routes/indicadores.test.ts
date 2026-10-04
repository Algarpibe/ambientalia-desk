import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

/**
 * F1F-05, lote 3 (RQ-KP-12 y -13). Escalera: 401 sesión < 403 administrador < 400 parámetros < consulta.
 * Las pruebas de POSICIÓN activan dos guardas a la vez (regla de mutación 1 de `CLAUDE.md`).
 */
instalarArnes()

const RUTA = '/api/indicadores'
const DATOS = /ticket_transitions|calendario_cierres|FROM tickets/i
function conEspia(): { app: ReturnType<typeof appWith>['app']; datos: () => string[] } {
  const vistas: string[] = []
  const q: Queryable = { query: ((sql: string, p?: unknown[]) => { vistas.push(sql); return db.query(sql, p) }) as Queryable['query'] }
  return { app: appWith({}, q).app, datos: () => vistas.filter((s) => DATOS.test(s)) }
}
async function k2(): Promise<void> {
  await db.query("INSERT INTO tickets (id, number, subject, status, created_time, codigo_servicio, dias_entrega, fecha_orden_venta, fecha_finalizacion_st) VALUES ('a', 1, 's', 'Finalizado', '2026-10-02T15:00:00Z', 'ST-1', 4, '2026-10-08', '2026-10-15')")
}

describe('RQ-KP-12 · guardas y su orden', () => {
  it('PG-1 · sin sesión y con ?desde=basura: 401 (no 400) y ninguna consulta de datos', async () => {
    const { app, datos } = conEspia()
    const res = await request(app).get(RUTA).query({ desde: 'basura' })
    expect(res.status).toBe(401)
    expect(datos()).toEqual([])
  })
  it.each([[{ desde: 'basura' }], [{}]])('PG-2 · usuario sin administrador y con %j: 403 (no 400) y ninguna consulta de datos', async (q) => {
    const cookie = await userCookie(['Comercial'])
    const { app, datos } = conEspia()
    const res = await request(app).get(RUTA).query(q).set('Cookie', cookie)
    expect(res.status).toBe(403)
    expect(datos()).toEqual([])
  })
  it.each([[{ desde: 'basura' }], [{ desde: '2026-12-31', hasta: '2026-12-01' }], [{ formato: 'xml' }]])('PG-3 · administrador con %j: 400 con { error } en español y ninguna consulta de datos', async (q) => {
    const cookie = await adminCookie()
    const { app, datos } = conEspia()
    const res = await request(app).get(RUTA).query(q).set('Cookie', cookie)
    expect(res.status).toBe(400)
    expect(typeof res.body.error).toBe('string')
    expect(datos()).toEqual([])
  })
})

describe('RQ-KP-13 · la forma del JSON', () => {
  it('administrador: 200 con { periodo, tickets, comparacion } y el K2 sembrado (50 = 4, variante 5)', async () => {
    await k2()
    const res = await request(appWith().app).get(RUTA).query({ desde: '2026-10-01' }).set('Cookie', await adminCookie())
    expect(res.status).toBe(200)
    expect(Object.keys(res.body).sort()).toEqual(['comparacion', 'periodo', 'tickets'])
    expect(res.body.periodo).toEqual({ desde: '2026-10-01', hasta: null })
    expect(res.body.comparacion).toBeNull()
    expect(res.body.tickets).toHaveLength(1)
    expect(Object.keys(res.body.tickets[0]).sort()).toEqual(['codigoServicio', 'indicadores', 'ticketId'])
    expect(res.body.tickets[0]).toMatchObject({ ticketId: 'a', codigoServicio: 'ST-1' })
    const ind = res.body.tickets[0].indicadores
    expect(ind.map((i: { columna: string }) => i.columna)).toEqual(['47', '49', '50_53', '51', '54', '55', '57', '58', '59'])
    const c50 = ind[2]
    expect(c50).toMatchObject({ valor: 4, unidad: 'dias_habiles', estado: 'calculado', formulaZoho: 5, valorZoho: null, sinFinalizar: false, reentrante: null })
    expect(c50.motivo).toBeUndefined()
    expect(c50.hitos).toContainEqual({ nombre: 'Fecha Finalización ST', dia: '2026-10-15', fuente: 'columna_heredada' })
    expect(Object.keys(c50).sort()).toEqual(['columna', 'estado', 'formulaZoho', 'hitos', 'reentrante', 'sinFinalizar', 'unidad', 'valor', 'valorZoho'])
  })
  it('un indicador sin dato: valor null, estado sin_dato y motivo en texto; sinFinalizar sólo en 50·53 y 54', async () => {
    await k2()
    const res = await request(appWith().app).get(RUTA).set('Cookie', await adminCookie())
    const ind = res.body.tickets[0].indicadores
    expect(ind[0]).toMatchObject({ columna: '47', valor: null, estado: 'sin_dato', motivo: 'falta el hito: remisión de entrada' })
    expect('sinFinalizar' in ind[0]).toBe(false)
    expect(ind[4]).toMatchObject({ columna: '54', valor: 'Cumple', sinFinalizar: false })
  })
  it('el negativo del 59 sale como número con sus dos hitos (RQ-KP-13)', async () => {
    await db.query("INSERT INTO tickets (id, number, subject, status, created_time, fecha_cotizacion, fecha_orden_venta) VALUES ('c', 3, 's', 'x', '2026-12-01T15:00:00Z', '2026-12-10', '2026-12-09')")
    const res = await request(appWith().app).get(RUTA).set('Cookie', await adminCookie())
    const i59 = res.body.tickets[0].indicadores[8]
    expect(i59).toMatchObject({ columna: '59', valor: -1, unidad: 'dias_naturales', estado: 'calculado' })
    expect(i59.hitos).toHaveLength(2)
    expect(i59.hitos.map((h: { fuente: string }) => h.fuente)).toEqual(['columna_heredada', 'columna_heredada'])
    expect('orden_invertido' in i59 || 'marcas' in i59).toBe(false)
  })
})
