import { randomUUID } from 'node:crypto'
import { describe, it, expect } from 'vitest'
import { db, instalarArnes } from '../testing/appHarness'
import { HttpError } from '../util/httpError'
import { executeTransition } from './ticketService'

/**
 * F1A-07 · IV-2 — `executeTransition` impone las tres fechas derivadas, contra el código de HOY.
 *
 * RED por ASERCIÓN, no por import: no importa el módulo nuevo (`valoresDeTransicion.ts` aún no
 * existe). Cubre los cinco criterios de `design.md` §6.2 más las dos pruebas de posición de §6.3
 * (regla de mutación 1). `design.md` §6.1: montaje con precedente leído (`repo.test.ts:128`,
 * `eliminarTicket.test.ts:126`, `transiciones.test.ts:72-73`).
 */

instalarArnes()

const ADMIN = { areas: [], isAdmin: true, name: 'Admin', id: 'u-admin' }

/** El `HttpError` que lanzó la llamada, con su código y su cuerpo. Falla si NO lanzó (patrón de `ticketService.test.ts:46-54`). */
async function fallo(fn: () => Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    await fn()
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: e.body as Record<string, unknown> }
    throw e
  }
  throw new Error('se esperaba un HttpError y la llamada no lanzó ninguno')
}

async function ticket(id: string, estado: string, numero: number, createdTime?: string): Promise<void> {
  await db.query(
    'INSERT INTO tickets (id, number, subject, status, created_time) VALUES ($1,$2,$3,$4,$5)',
    [id, numero, 'Unidad valoresDeTransicion', estado, createdTime ? new Date(createdTime) : null],
  )
}

async function remision(
  ticketId: string,
  fecha: string,
  opts: { tipo?: string; createdAt?: string; anuladaAt?: string } = {},
): Promise<void> {
  await db.query(
    'INSERT INTO remisiones (id, ticket_id, tipo, fecha, created_at, anulada_at) VALUES ($1,$2,$3,$4,$5,$6)',
    [`rem-${randomUUID()}`, ticketId, opts.tipo ?? 'entrada', fecha,
      opts.createdAt ? new Date(opts.createdAt) : new Date(), opts.anuladaAt ? new Date(opts.anuladaAt) : null],
  )
}

async function escalado(ticketId: string, transitionId: string, performedAt: string): Promise<void> {
  await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, performed_at) VALUES ($1,$2,$3)',
    [ticketId, transitionId, new Date(performedAt)])
}

async function fechaColumna(ticketId: string, columna: string): Promise<string | null> {
  const r = await db.query(`SELECT ${columna} FROM tickets WHERE id = $1`, [ticketId])
  const v = r.rows[0]?.[columna]
  return v instanceof Date ? v.toISOString().slice(0, 10) : (v ?? null)
}

async function historialValues(ticketId: string, transitionId: string): Promise<Record<string, unknown>> {
  const r = await db.query(
    'SELECT values FROM ticket_transitions WHERE ticket_id = $1 AND transition_id = $2 ORDER BY performed_at DESC LIMIT 1',
    [ticketId, transitionId],
  )
  const v = r.rows[0]?.values
  return (typeof v === 'string' ? JSON.parse(v) : v) ?? {}
}

describe('1 · navegador ≠ derivado en las tres: gana SIEMPRE el derivado (D-1)', () => {
  it('1a · «Fecha creación ticket» y «Fecha Remisión Entrada» (ingreso_a_servicio)', async () => {
    await ticket('t1', 'Ingresado', 8200, '2026-09-10T00:30:00Z')
    await remision('t1', '2026-08-01')

    await executeTransition(db, 't1', {
      transitionId: 'ingreso_a_servicio',
      values: { 'Código Servicio': 'CS-1', 'Fecha creación ticket': '2020-01-01', 'Fecha Remisión Entrada': '2020-01-01' },
    }, ADMIN)

    expect(await fechaColumna('t1', 'fecha_creacion_ticket')).toBe('2026-09-09')
    expect(await fechaColumna('t1', 'fecha_remision_entrada')).toBe('2026-08-01')
    const hist = await historialValues('t1', 'ingreso_a_servicio')
    expect(hist['Fecha creación ticket']).toBe('2026-09-09')
    expect(hist['Fecha Remisión Entrada']).toBe('2026-08-01')
  })

  it('1b · «Fecha Revisión Informe» (reporte_por_garantia)', async () => {
    await ticket('t1', 'Notificado', 8201)
    await escalado('t1', 'escalado_a_revision', '2026-09-10T00:30:00Z')

    await executeTransition(db, 't1', {
      transitionId: 'reporte_por_garantia',
      values: { 'Fecha Revisión Informe': '2020-01-01' },
    }, ADMIN)

    expect(await fechaColumna('t1', 'fecha_revision_informe')).toBe('2026-09-09')
    const hist = await historialValues('t1', 'reporte_por_garantia')
    expect(hist['Fecha Revisión Informe']).toBe('2026-09-09')
  })
})

it('2 · «Fecha Remisión Entrada» toma la entrada VIGENTE más reciente, ignorando la anulada y la de salida', async () => {
  await ticket('t1', 'Ingresado', 8202)
  await remision('t1', '2026-01-01', { createdAt: '2026-01-01T00:00:00Z' })
  await remision('t1', '2026-02-01', { createdAt: '2026-02-01T00:00:00Z' })
  await remision('t1', '2026-03-01', { createdAt: '2026-03-01T00:00:00Z', anuladaAt: '2026-03-02T00:00:00Z' })
  await remision('t1', '2026-04-01', { tipo: 'salida', createdAt: '2026-04-01T00:00:00Z' })

  await executeTransition(db, 't1', {
    transitionId: 'ingreso_a_servicio',
    values: { 'Código Servicio': 'CS-2', 'Fecha creación ticket': '2026-01-15' },
  }, ADMIN)

  expect(await fechaColumna('t1', 'fecha_remision_entrada')).toBe('2026-02-01')
})

it('3 · con fuente, la transición pasa aunque el navegador no mande las fechas', async () => {
  await ticket('t1', 'Ingresado', 8203, '2026-09-10T00:30:00Z')
  await remision('t1', '2026-08-01')

  const res = await executeTransition(db, 't1', {
    transitionId: 'ingreso_a_servicio',
    values: { 'Código Servicio': 'CS-3' },
  }, ADMIN)

  expect(res).toBeDefined()
  expect(await fechaColumna('t1', 'fecha_remision_entrada')).toBe('2026-08-01')
})

describe('4 · sin fuente: lo tecleado válido pasa, lo inválido da 422 con el mensaje', () => {
  it('«2026-02-28» pasa (no regresión: ya pasaba hoy sin este módulo)', async () => {
    await ticket('t1', 'Notificado', 8204)
    const res = await executeTransition(db, 't1', {
      transitionId: 'reporte_por_garantia', values: { 'Fecha Revisión Informe': '2026-02-28' },
    }, ADMIN)
    expect(res).toBeDefined()
  })

  it.each([
    ['2026-02-30', 'día que no existe'],
    ['10/09/2026', 'formato distinto de YYYY-MM-DD'],
    ['2026-09-10T00:30', 'fecha-hora sin desplazamiento'],
  ])('«%s» (%s) da 422 con «Fecha inválida en el campo: Fecha Revisión Informe»', async (valor) => {
    await ticket('t1', 'Notificado', 8205)
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: 'reporte_por_garantia', values: { 'Fecha Revisión Informe': valor },
    }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual(['Fecha inválida en el campo: Fecha Revisión Informe'])
  })
})

it('5 · P-2: «Fecha Remisión Entrada» enviada en una transición que no la declara no llega al historial', async () => {
  await ticket('t1', 'Rev./Diagnostico', 8206)
  await executeTransition(db, 't1', {
    transitionId: 'escalado_a_revision',
    values: { priority: 'High', 'Días de entrega': 5, 'Fecha Remisión Entrada': '2026-01-01' },
  }, ADMIN)
  const hist1 = await historialValues('t1', 'escalado_a_revision')
  expect('Fecha Remisión Entrada' in hist1).toBe(false)

  await ticket('t2', 'Notificado', 8207)
  await executeTransition(db, 't2', {
    transitionId: 'reporte_por_garantia',
    values: { 'Fecha Revisión Informe': '2026-05-01', 'Fecha Remisión Entrada': '2026-01-01' },
  }, ADMIN)
  const hist2 = await historialValues('t2', 'reporte_por_garantia')
  expect('Fecha Remisión Entrada' in hist2).toBe(false)
})

/**
 * P-a/P-b — regla de mutación 1: la POSICIÓN de la guarda de fecha derivada, no sólo su condición.
 * `design.md` §6.3. Posible porque `TRANSITIONS` añade la derivación a TODAS (`transitions.ts:295-298`).
 */
describe('posición (regla de mutación 1)', () => {
  it('P-a · sin remisión, fecha inválida Y derivado_a inexistente: SÓLO el error de fecha (gana a la derivación)', async () => {
    await ticket('t1', 'Ingresado', 8208, '2026-09-10T00:30:00Z')
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: 'ingreso_a_servicio',
      values: { 'Código Servicio': 'CS-4', 'Fecha Remisión Entrada': '2026-02-30', derivado_a: 'no-existe' },
    }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual(['Fecha inválida en el campo: Fecha Remisión Entrada'])
  })

  it('P-b · lo mismo, y ADEMÁS sin «Código Servicio»: los dos errores, presencia antes que validez', async () => {
    await ticket('t1', 'Ingresado', 8209, '2026-09-10T00:30:00Z')
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: 'ingreso_a_servicio',
      values: { 'Fecha Remisión Entrada': '2026-02-30', derivado_a: 'no-existe' },
    }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual([
      'Falta el campo obligatorio: Código Servicio',
      'Fecha inválida en el campo: Fecha Remisión Entrada',
    ])
  })
})
