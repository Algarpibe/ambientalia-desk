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
function conEspia(): { app: ReturnType<typeof appWith>['app']; datos: () => string[]; todas: string[] } {
  const vistas: string[] = []
  const q: Queryable = { query: ((sql: string, p?: unknown[]) => { vistas.push(sql); return db.query(sql, p) }) as Queryable['query'] }
  return { app: appWith({}, q).app, datos: () => vistas.filter((s) => DATOS.test(s)), todas: vistas }
}
/** KP-18: el verbo de CADA sentencia ejecutada (la comprobación de sesión incluida) es SELECT; un `UPDATE` o `INSERT` en la ruta lo rompe. */
const noSelect = (sentencias: string[]): string[] => sentencias.filter((s) => !/^\s*SELECT\b/i.test(s))
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
    expect(res.body.comparacion).toMatchObject({ comparable: false, mensaje: 'sin valor de Zoho con que comparar' })
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

describe('RQ-KP-15 · formato=csv', () => {
  const CABECERA = 'ticket_id;codigo_servicio;columna;indicador;unidad;valor;estado;motivo;fuente_hitos;reentrante;sin_finalizar;formula_zoho;valor_zoho'
  const pedir = async (q: Record<string, string> = { formato: 'csv' }) =>
    request(appWith().app).get(RUTA).query(q).set('Cookie', await adminCookie())
  it('cabeceras de descarga y cuerpo con BOM, CRLF y la cabecera exacta de 13 columnas', async () => {
    await k2()
    const res = await pedir()
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="indicadores-\d{4}-\d{2}-\d{2}\.csv"$/)
    const cuerpo = res.text
    expect(cuerpo.startsWith('﻿')).toBe(true)
    const lineas = cuerpo.slice(1).split('\r\n')
    expect(lineas[0]).toBe(CABECERA)
    expect(lineas[lineas.length - 1]).toBe('')
  })
  it('una fila por ticket e indicador: 9 por ticket, en el orden de RQ-KP-01', async () => {
    await k2()
    await db.query("INSERT INTO tickets (id, number, subject, status, created_time, codigo_servicio) VALUES ('b', 2, 's', 'x', '2026-10-03T15:00:00Z', 'ST-2')")
    const lineas = ((await pedir()).text).slice(1).split('\r\n').filter((l) => l !== '')
    expect(lineas).toHaveLength(1 + 2 * 9)
    expect(lineas.slice(1, 10).map((l) => l.split(';')[2])).toEqual(['47', '49', '50_53', '51', '54', '55', '57', '58', '59'])
    expect(lineas[3]).toMatch(/^a;ST-1;50_53;[^;]+;dias_habiles;4;calculado;;/)
    expect(lineas[3]!.split(';')[11]).toBe('5')
    expect(lineas[10]).toMatch(/^b;ST-2;47;/)
  })
  it('una celda de texto con fórmula sale neutralizada y un negativo sale como número', async () => {
    await db.query("INSERT INTO tickets (id, number, subject, status, created_time, codigo_servicio, fecha_cotizacion, fecha_orden_venta) VALUES ('c', 3, 's', 'x', '2026-12-01T15:00:00Z', '=HYPERLINK(\"x\")', '2026-12-10', '2026-12-09')")
    const lineas = ((await pedir()).text).slice(1).split('\r\n')
    expect(lineas[1]).toMatch(/^c;"'=HYPERLINK\(""x""\)";47;/)
    expect(lineas.find((l) => l.split(';')[2] === '59')).toMatch(/;dias_naturales;-1;calculado;/)
  })
  it('sin tickets: sólo la cabecera', async () => {
    expect(((await pedir()).text).slice(1)).toBe(`${CABECERA}\r\n`)
  })
  it('las guardas son las mismas: sin sesión 401, sin administrador 403 y parámetros inválidos 400, sin consulta de datos', async () => {
    const { app, datos } = conEspia()
    expect((await request(app).get(RUTA).query({ formato: 'csv' })).status).toBe(401)
    expect((await request(app).get(RUTA).query({ formato: 'csv' }).set('Cookie', await userCookie(['Comercial']))).status).toBe(403)
    expect((await request(app).get(RUTA).query({ formato: 'csv', desde: 'basura' }).set('Cookie', await adminCookie())).status).toBe(400)
    expect(datos()).toEqual([])
  })
  it('PG-2 en CSV: un usuario sin administrador con parámetros inválidos recibe 403, no 400', async () => {
    const res = await request(appWith().app).get(RUTA).query({ formato: 'csv', desde: 'basura' }).set('Cookie', await userCookie(['Comercial']))
    expect(res.status).toBe(403)
  })
  it('sin formato la respuesta sigue siendo JSON', async () => {
    const res = await request(appWith().app).get(RUTA).set('Cookie', await adminCookie())
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })
})

describe('RQ-KP-17 · resumen de comparación', () => {
  const pedir = async () => (await request(appWith().app).get(RUTA).set('Cookie', await adminCookie())).body.comparacion
  const en = (c: { porColumna: Array<{ columna: string }> }, columna: string) => c.porColumna.find((x) => x.columna === columna) as unknown as Record<string, unknown> & { variante: Record<string, unknown>; diferencias: Array<Record<string, unknown>> }
  const ov = (id: string, n: number, cot: string, venta: string, zoho: string | null) =>
    db.query("INSERT INTO tickets (id, number, subject, status, created_time, fecha_cotizacion, fecha_orden_venta, custom_fields) VALUES ($1, $2, 's', 'x', '2026-12-01T15:00:00Z', $3, $4, $5)", [id, n, cot, venta, zoho === null ? '{}' : `{"Tiempo de orden de Venta": ${zoho}}`])

  it('sin valores de Zoho en los datos sincronizados: mensaje y porcentaje null en cada indicador', async () => {
    await k2()
    const c = await pedir()
    expect(c).toMatchObject({ comparable: false, mensaje: 'sin valor de Zoho con que comparar', tolerancia: 1 })
    expect(c.porColumna).toHaveLength(9)
    expect(c.porColumna.every((x: { porcentaje: unknown; variante: { porcentaje: unknown } }) => x.porcentaje === null && x.variante.porcentaje === null)).toBe(true)
    expect(c.tickets.porcentaje).toBeNull()
  })
  it('con valor de Zoho pero sin ningún par comparable: «sin pares comparables» y porcentaje null', async () => {
    await db.query(`INSERT INTO tickets (id, number, subject, status, created_time, custom_fields) VALUES ('s', 7, 's', 'x', '2026-12-01T15:00:00Z', '{"Tiempo de orden de Venta": 3}')`)
    const c = await pedir()
    expect(c).toMatchObject({ comparable: false, mensaje: 'sin pares comparables' })
    expect(en(c, '59')).toMatchObject({ comparados: 0, sinComparar: 1, porcentaje: null })
  })
  it('el escenario del 59: 3 comparados, 2 coincidentes, 66.7 y una diferencia mayor con sus hitos', async () => {
    await ov('x', 1, '2026-12-01', '2026-12-04', '3')
    await ov('y', 2, '2026-12-01', '2026-12-03', '3')
    await ov('z', 3, '2026-12-01', '2026-12-03', '5')
    const c = await pedir()
    expect(c).toMatchObject({ comparable: true, mensaje: null })
    expect(en(c, '59')).toMatchObject({ comparados: 3, coincidentes: 2, diferentes: 1, sinComparar: 0, porcentaje: 66.7 })
    expect(en(c, '59').diferencias).toHaveLength(1)
    expect(en(c, '59').diferencias[0]).toMatchObject({ ticketId: 'z', columna: '59', contra: 'valor', app: 2, zoho: 5, delta: 3, reentrante: null })
    expect((en(c, '59').diferencias[0] as { hitos: unknown[] }).hitos).toHaveLength(2)
    expect(c.tickets).toEqual({ comparados: 3, coincidentes: 2, porcentaje: 66.7 })
  })
  it('el 50·53 de Zoho se lee de «Tiempo de servicio»: letra 4 y variante 5 contra 5 coinciden dentro del día', async () => {
    await k2()
    await db.query(`UPDATE tickets SET custom_fields = '{"Tiempo de servicio": 5}' WHERE id = 'a'`)
    const c = await pedir()
    expect(en(c, '50_53')).toMatchObject({ comparados: 1, coincidentes: 1, porcentaje: 100 })
    expect(en(c, '50_53').variante).toMatchObject({ comparados: 1, coincidentes: 1, porcentaje: 100 })
  })
  it.each([['json', {}], ['csv', { formato: 'csv' }]])('KP-18 · sólo lectura en %s: toda sentencia de la petición es un SELECT', async (_n, q) => {
    await ov('x', 1, '2026-12-01', '2026-12-04', '3')
    const { app, todas } = conEspia()
    const res = await request(app).get(RUTA).query(q).set('Cookie', await adminCookie())
    expect(res.status).toBe(200)
    expect(todas.length).toBeGreaterThan(3)
    expect(noSelect(todas)).toEqual([])
  })
  it('sin veredicto en la respuesta y con las mismas tres lecturas: ningún fichero', async () => {
    await ov('x', 1, '2026-12-01', '2026-12-04', '3')
    const { app, datos } = conEspia()
    const res = await request(app).get(RUTA).set('Cookie', await adminCookie())
    expect(datos()).toHaveLength(3)
    expect(JSON.stringify(res.body.comparacion)).not.toMatch(/aprob|sem[aá]foro|umbral|veredicto/i)
  })
})
