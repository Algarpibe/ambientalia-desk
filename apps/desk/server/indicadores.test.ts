import { describe, it, expect } from 'vitest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { db, instalarArnes } from './testing/appHarness'
import { validarPeriodo, leerEntradasIndicadores, tablaIndicadores } from './indicadores'

/** F1F-05, lote 3 (RQ-KP-13 y -14): periodo validado, tres consultas de sólo lectura y la tabla calculada. */
instalarArnes()

function espia(): { q: Queryable; textos: string[] } {
  const textos: string[] = []
  return { textos, q: { query: ((sql: string, p?: unknown[]) => { textos.push(sql); return db.query(sql, p) }) as Queryable['query'] } }
}
async function ticket(id: string, n: number, creado: string, extra = ''): Promise<void> {
  await db.query(`INSERT INTO tickets (id, number, subject, status, created_time, codigo_servicio, dias_entrega, fecha_orden_venta ${extra ? ',' + extra.split('=')[0] : ''}) VALUES ($1, $2, 's', 'Finalizado', $3, 'ST-' || $2, 4, '2026-10-08' ${extra ? ',' + extra.split('=')[1] : ''})`, [id, n, creado])
}
async function paso(id: string, transicion: string, valores: Record<string, unknown>, cuando: string): Promise<void> {
  await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, values, performed_at) VALUES ($1, $2, $3, $4)', [id, transicion, JSON.stringify(valores), cuando])
}
const sinPeriodo = { desde: null, hasta: null }

describe('validarPeriodo (RQ-KP-13)', () => {
  it('sin parámetros: todos los tickets y formato json', () => {
    expect(validarPeriodo({})).toEqual({ ok: true, desde: null, hasta: null, formato: 'json' })
  })
  it.each([
    [{ desde: 'basura' }], [{ hasta: '2026-13-01' }], [{ desde: '2026-02-30' }], [{ desde: '2026-1-1' }],
    [{ desde: '2026-12-31', hasta: '2026-12-01' }], [{ formato: 'xml' }], [{ desde: ['2026-10-01', '2026-10-02'] }],
  ])('inválido %j: error en español', (q) => {
    const r = validarPeriodo(q)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toMatch(/[a-záéíóú]{4}/i)
  })
  it('desde igual a hasta vale; formato csv vale', () => {
    expect(validarPeriodo({ desde: '2026-10-01', hasta: '2026-10-01', formato: 'csv' })).toEqual({ ok: true, desde: '2026-10-01', hasta: '2026-10-01', formato: 'csv' })
  })
})

describe('leerEntradasIndicadores (RQ-KP-14)', () => {
  it('dos tickets y cinco transiciones: agrupa por ticket, en orden, y lleva los cierres', async () => {
    await ticket('a', 1, '2026-10-02T15:00:00Z'); await ticket('b', 2, '2026-10-03T15:00:00Z')
    await db.query("INSERT INTO calendario_cierres (fecha, motivo, registrado_por) VALUES ('2026-10-14', 'cierre', 'prueba')")
    await paso('a', 'x2', { 'Fecha Finalización ST': '2026-10-15' }, '2026-10-12T10:00:00Z')
    await paso('a', 'x1', { 'Fecha Recepción de repuestos': '2026-10-09' }, '2026-10-10T10:00:00Z')
    await paso('b', 'y1', {}, '2026-10-10T10:00:00Z'); await paso('b', 'y2', {}, '2026-10-11T10:00:00Z'); await paso('a', 'x0', {}, '2026-10-09T10:00:00Z')
    const e = await leerEntradasIndicadores(db, sinPeriodo)
    expect(e.tickets.map((t) => [t.id, t.numero, t.codigoServicio, t.diasEntrega])).toEqual([['a', 1, 'ST-1', 4], ['b', 2, 'ST-2', 4]])
    expect(e.tickets[0].fechas['Fecha Orden De Venta']).toBe('2026-10-08')
    expect(e.historial.get('a')?.map((p) => p.transitionId)).toEqual(['x0', 'x1', 'x2'])
    expect(e.historial.get('a')?.[1].values).toEqual({ 'Fecha Recepción de repuestos': '2026-10-09' })
    expect(e.historial.get('b')).toHaveLength(2)
    expect([...e.cierres]).toEqual(['2026-10-14'])
  })
  it.each([2, 20])('con %i tickets son EXACTAMENTE tres consultas, todas SELECT, sin una por ticket', async (n) => {
    for (let i = 1; i <= n; i++) { await ticket(`t${i}`, i, '2026-10-02T15:00:00Z'); await paso(`t${i}`, 'p', { a: 1 }, '2026-10-05T10:00:00Z'); await paso(`t${i}`, 'q', {}, '2026-10-06T10:00:00Z') }
    const { q, textos } = espia()
    const e = await leerEntradasIndicadores(q, sinPeriodo)
    expect(e.tickets).toHaveLength(n)
    expect(textos).toHaveLength(3)
    expect(textos.every((s) => /^\s*SELECT/i.test(s))).toBe(true)
  })
  it('un ticket sin created_time: sale sin periodo (RQ-KP-13, «todos») y no sale con periodo (no se puede situar)', async () => {
    await ticket('sin', 1, '2026-10-02T15:00:00Z')
    await db.query("UPDATE tickets SET created_time = NULL WHERE id = 'sin'")
    expect((await leerEntradasIndicadores(db, sinPeriodo)).tickets.map((t) => t.id)).toEqual(['sin'])
    expect((await leerEntradasIndicadores(db, { desde: '2026-10-01', hasta: null })).tickets).toEqual([])
    expect((await leerEntradasIndicadores(db, { desde: null, hasta: '2026-10-31' })).tickets).toEqual([])
  })
  it('el periodo se mide en Bogotá: 2026-10-01T03:00:00Z es el 30/09 y queda fuera con desde=2026-10-01', async () => {
    await ticket('fuera', 1, '2026-10-01T03:00:00Z'); await ticket('dentro', 2, '2026-10-01T05:00:00Z'); await ticket('tarde', 3, '2026-10-03T04:59:00Z')
    await paso('fuera', 'p', {}, '2026-10-05T10:00:00Z'); await paso('dentro', 'p', {}, '2026-10-05T10:00:00Z')
    const e = await leerEntradasIndicadores(db, { desde: '2026-10-01', hasta: '2026-10-02' })
    expect(e.tickets.map((t) => t.id)).toEqual(['dentro', 'tarde'])
    expect([...e.historial.keys()]).toEqual(['dentro'])
  })
  it('las columnas date entran como Date (pg real, medianoche UTC) o como texto (pg-mem)', async () => {
    await ticket('a', 1, '2026-10-02T15:00:00Z')
    const filas = [{ id: 'a', number: 1, status: 's', created_time: new Date('2026-10-02T15:00:00Z'), codigo_servicio: null, dias_entrega: null, custom_fields: {}, fecha_orden_venta: new Date('2026-10-08T00:00:00Z'), fecha_revision_informe: '2026-10-09' }]
    const falsa: Queryable = { query: async (sql: string) => ({ rows: /FROM ticket_transitions/.test(sql) ? [] : /calendario_cierres/.test(sql) ? [{ fecha: new Date('2026-10-14T00:00:00Z') }] : filas }) }
    const e = await leerEntradasIndicadores(falsa, sinPeriodo)
    expect(e.tickets[0].fechas).toMatchObject({ 'Fecha Orden De Venta': '2026-10-08', 'Fecha Revisión Informe': '2026-10-09' })
    expect(e.tickets[0].creadoEn).toBe('2026-10-02T15:00:00.000Z')
    expect([...e.cierres]).toEqual(['2026-10-14'])
  })
})

describe('tablaIndicadores', () => {
  it('una fila por ticket con los nueve indicadores (K2: 50 = 4, variante 5)', async () => {
    await ticket('a', 1, '2026-10-02T15:00:00Z', "fecha_finalizacion_st='2026-10-15'")
    const filas = tablaIndicadores(await leerEntradasIndicadores(db, sinPeriodo))
    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ ticketId: 'a', codigoServicio: 'ST-1' })
    expect(filas[0].indicadores.map((i) => i.columna)).toEqual(['47', '49', '50_53', '51', '54', '55', '57', '58', '59'])
    const c50 = filas[0].indicadores[2]
    expect([c50.valor, c50.formulaZoho]).toEqual([{ tipo: 'valor', valor: 4 }, { tipo: 'valor', valor: 5 }])
  })
})
