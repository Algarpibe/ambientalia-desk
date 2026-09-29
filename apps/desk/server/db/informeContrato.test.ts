// registro-contrato, lote 4 — informe trimestral por contrato (`zoho-sync` RQ-ZS-15; `decision/anexo-53-contratos`).
// Una subOV creada está libre (sin asociación vigente), en curso (ticket abierto) o ejecutada (ticket HOY en
// `Finalizado`, fechada por su PRIMERA llegada a ese estado). % ejecutado = ejecutadas / creadas, distinto del
// `consumido` del saldo (asociaciones vigentes / creadas).
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { asociarOV, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { saldoPorLote } from '@ambientalia/zoho-sync/books/subOV'
import { INFORME_NO_DISPONIBLE } from '@ambientalia/shared'
import { crearContrato } from './contratos'
import { informeContrato } from './informeContrato'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const LOTE = 'OV-2026-170'
const HOY = '2026-07-15' // dentro del trimestre 3 de un contrato 2026-01-01 → 2026-12-31
const contrato = (over: { fechaInicio?: string; fechaFin?: string; lote?: string } = {}) =>
  crearContrato(db, { clientId: 'C-1', lote: LOTE, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', creadoPor: 'c', ...over })

let nTicket = 0
async function subOV(n: string, estado = 'open'): Promise<void> {
  await db.query(
    "INSERT INTO books.sales_orders (salesorder_id, salesorder_number, customer_id, date, status, raw) VALUES ($1, $2, 'C-1', '2026-01-10', $3, $4)",
    [`so-${n}`, `${LOTE}-${n}`, estado, JSON.stringify({ order_status: estado })],
  )
}
/** Un ticket asociado a la subOV `n`, en `status`, con sus llegadas a `Finalizado` (instantes ISO). */
async function servicio(n: string, status: string, llegadas: string[] = []): Promise<{ ticketId: string; asociacionId: number }> {
  const ticketId = `t-${n}`
  await db.query(
    'INSERT INTO tickets (id, number, subject, status, equipo, serial, tipo_servicio) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [ticketId, ++nTicket, 's', status, `Equipo ${n}`, `SER-${n}`, 'Mantenimiento'],
  )
  for (const at of llegadas) {
    await db.query("INSERT INTO ticket_transitions (ticket_id, to_status, performed_at) VALUES ($1, 'Finalizado', $2)", [ticketId, at])
  }
  const a = await asociarOV(db, { ticketId, numero: `${LOTE}-${n}`, salesorderId: `so-${n}`, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  return { ticketId, asociacionId: a.id }
}
const numeros = (xs: Array<{ numero?: string; subOV?: string }>) => xs.map((x) => x.numero ?? x.subOV)

describe('estados de las subOV y % ejecutado', () => {
  it('10 creadas: 3 finalizadas, 2 en curso, 5 libres → 30 % ejecutado; el saldo sigue en 5 consumidas y 50 %', async () => {
    const c = await contrato()
    for (let i = 1; i <= 10; i++) await subOV(String(i).padStart(2, '0'))
    for (const n of ['01', '02', '03']) await servicio(n, 'Finalizado', ['2026-02-10T15:00:00Z'])
    for (const n of ['04', '05']) await servicio(n, 'En Reparación')

    const inf = await informeContrato(db, c, HOY)
    expect(inf).toMatchObject({ creadas: 10, ejecutadas: 3, enCurso: 2, libres: 5, porcentajeEjecutado: 30 })
    expect(await saldoPorLote(db, LOTE)).toMatchObject({ creadas: 10, consumidas: 5, libres: 5, consumido: 50 })
  })

  it('CONSUMIDO frente a EJECUTADO: con subOV en curso, consumido > ejecutado sobre el mismo lote', async () => {
    const c = await contrato()
    for (const n of ['01', '02', '03', '04']) await subOV(n)
    await servicio('01', 'Finalizado', ['2026-03-01T15:00:00Z'])
    await servicio('02', 'En Reparación')
    await servicio('03', 'Por Facturar')

    const inf = await informeContrato(db, c, HOY)
    expect(inf.consumido).toBe(75) // 3 asociaciones vigentes / 4 creadas
    expect(inf.porcentajeEjecutado).toBe(25) // 1 finalizada / 4 creadas
    expect(inf.consumido).toBeGreaterThan(inf.porcentajeEjecutado)
  })

  it('cuarentena, borrador y anulada no cuentan ni aparecen: creadas 3', async () => {
    const c = await contrato()
    for (const n of ['01', '02', '03']) await subOV(n)
    await db.query("INSERT INTO books.sales_orders (salesorder_id, salesorder_number, customer_id, date, status) VALUES ('so-q', 'OV-2026-170-X9', 'C-1', '2026-01-10', 'open')")
    await subOV('04', 'draft'); await subOV('05', 'void')
    const inf = await informeContrato(db, c, HOY)
    expect(inf.creadas).toBe(3)
    expect(numeros(inf.subOV)).toEqual([`${LOTE}-01`, `${LOTE}-02`, `${LOTE}-03`])
  })

  it('un lote sin subOV en Books: 0 %, 0 libres y los días hasta el fin, sin error', async () => {
    const c = await contrato()
    expect(await informeContrato(db, c, '2026-12-01')).toMatchObject({ creadas: 0, libres: 0, porcentajeEjecutado: 0, diasHastaFin: 30 })
    expect((await informeContrato(db, c, '2027-01-05')).diasHastaFin).toBe(-5)
  })
})

describe('REVERSIÓN: el estado se lee hoy, nada queda grabado', () => {
  it('liberada: una subOV ejecutada cuya asociación se libera vuelve a LIBRE y sale de ejecutadas y servicios', async () => {
    const c = await contrato()
    await subOV('01'); await subOV('02')
    const { asociacionId } = await servicio('01', 'Finalizado', ['2026-02-10T15:00:00Z'])
    expect((await informeContrato(db, c, HOY)).ejecutadas).toBe(1)

    await liberarAsociacion(db, asociacionId, 'comercial', 'subOV equivocada')
    const inf = await informeContrato(db, c, HOY)
    expect(inf.subOV.find((s) => s.numero === `${LOTE}-01`)).toMatchObject({ estado: 'libre', ticketId: null, fechaEjecucion: null })
    expect(inf).toMatchObject({ ejecutadas: 0, libres: 2, porcentajeEjecutado: 0 })
    expect(inf.trimestres.flatMap((t) => t.servicios)).toEqual([])
  })

  it('liberada con el MISMO ticket asociado a otra subOV: la liberada es libre, sólo la vigente es ejecutada', async () => {
    const c = await contrato()
    await subOV('01'); await subOV('02')
    const { ticketId, asociacionId } = await servicio('01', 'Finalizado', ['2026-02-10T15:00:00Z'])
    await liberarAsociacion(db, asociacionId, 'comercial', 'era la 02')
    await asociarOV(db, { ticketId, numero: `${LOTE}-02`, salesorderId: 'so-02', origen: 'alta', actor: 't', fechaOrdenCompra: null })
    const inf = await informeContrato(db, c, HOY)
    expect(inf.subOV.map((s) => [s.numero, s.estado])).toEqual([[`${LOTE}-01`, 'libre'], [`${LOTE}-02`, 'ejecutada']])
    expect(inf.ejecutadas).toBe(1)
  })

  it('reabierta: un ticket que llegó a Finalizado y hoy está abierto deja de estar ejecutado (en curso, fuera de acumulados)', async () => {
    const c = await contrato()
    await subOV('01')
    await servicio('01', 'En Reparación', ['2026-02-10T15:00:00Z']) // llegó a Finalizado en t1 y se reabrió
    const inf = await informeContrato(db, c, HOY)
    expect(inf.subOV[0]).toMatchObject({ estado: 'en_curso', fechaEjecucion: null })
    expect(inf).toMatchObject({ ejecutadas: 0, enCurso: 1, porcentajeEjecutado: 0 })
    expect(inf.trimestres[0]).toMatchObject({ ejecutadasAlCierre: 0, porcentajeEjecutado: 0, servicios: [] })
  })

  it('reabierta y vuelta a finalizar: ejecutada, fechada por la PRIMERA llegada (S-15)', async () => {
    const c = await contrato()
    await subOV('01')
    await servicio('01', 'Finalizado', ['2026-05-20T15:00:00Z', '2026-02-10T15:00:00Z']) // insertadas fuera de orden
    const inf = await informeContrato(db, c, HOY)
    expect(inf.subOV[0]).toMatchObject({ estado: 'ejecutada', fechaEjecucion: '2026-02-10' })
    expect(numeros(inf.trimestres[0]!.servicios)).toEqual([`${LOTE}-01`])
    expect(inf.trimestres[1]!.servicios).toEqual([])
  })
})

describe('trimestres del contrato', () => {
  it('2 finalizadas en t1 y 3 en t2: 20 % y 50 % acumulado; los servicios de t2 son los 3 de t2', async () => {
    const c = await contrato()
    for (let i = 1; i <= 10; i++) await subOV(String(i).padStart(2, '0'))
    for (const n of ['01', '02']) await servicio(n, 'Finalizado', ['2026-02-10T15:00:00Z'])
    for (const n of ['03', '04', '05']) await servicio(n, 'Finalizado', ['2026-05-10T15:00:00Z'])

    const inf = await informeContrato(db, c, HOY)
    expect(inf.trimestres.map((t) => [t.k, t.inicio, t.fin])).toEqual([
      [1, '2026-01-01', '2026-03-31'], [2, '2026-04-01', '2026-06-30'], [3, '2026-07-01', '2026-09-30'],
    ])
    expect(inf.trimestres.map((t) => t.porcentajeEjecutado)).toEqual([20, 50, 50])
    expect(numeros(inf.trimestres[1]!.servicios)).toEqual([`${LOTE}-03`, `${LOTE}-04`, `${LOTE}-05`])
  })

  it('cada servicio trae equipo, serial, tipo, fecha y el hueco del informe declarado', async () => {
    const c = await contrato()
    await subOV('01')
    await servicio('01', 'Finalizado', ['2026-02-10T15:00:00Z'])
    const inf = await informeContrato(db, c, HOY)
    expect(inf.trimestres[0]!.servicios[0]).toEqual({
      subOV: `${LOTE}-01`, ticketId: 't-01', ticketNumber: expect.any(Number), equipo: 'Equipo 01', serial: 'SER-01',
      tipoServicio: 'Mantenimiento', fecha: '2026-02-10', informe: INFORME_NO_DISPONIBLE,
    })
    expect(inf.huecos.some((h) => /informe/i.test(h))).toBe(true)
  })

  it('Finalizado sin fila de ticket_transitions: ejecutada hoy, en sinFecha y fuera de los acumulados', async () => {
    const c = await contrato()
    await subOV('01'); await subOV('02')
    await servicio('01', 'Finalizado') // venido de Zoho, sin transición
    const inf = await informeContrato(db, c, HOY)
    expect(inf).toMatchObject({ ejecutadas: 1, porcentajeEjecutado: 50 })
    expect(numeros(inf.sinFecha)).toEqual([`${LOTE}-01`])
    expect(inf.trimestres.every((t) => t.ejecutadasAlCierre === 0 && t.servicios.length === 0)).toBe(true)
  })

  it('no iniciado → sin trimestres; vencido → todos', async () => {
    const c = await contrato()
    expect((await informeContrato(db, c, '2025-12-31')).trimestres).toEqual([])
    expect((await informeContrato(db, c, '2027-03-01')).trimestres.map((t) => t.k)).toEqual([1, 2, 3, 4])
  })
})
