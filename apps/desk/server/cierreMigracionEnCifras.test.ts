import { describe, it, expect } from 'vitest'
import { ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION, computeAnalisis } from '@ambientalia/shared'
import { asociarOV } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { db, instalarArnes } from './testing/appHarness'
import { getAnalisisRows } from './analisis'
import { getAccountDetail, getContactDetail } from './db/directory'
import { crearContrato } from './db/contratos'
import { informeContrato } from './db/informeContrato'
import { leerEntradasIndicadores, tablaIndicadores } from './indicadores'
import { cierresPuestosPorMigracion } from './db/cierresDeMigracion'

instalarArnes()

/**
 * fecha-migracion-fuera-de-cifras (F1F-01, `decision/h1-fechas-migrados`, `tickets-core` RQ-TC-69): la fecha de cierre que
 * puso la migración, y su marcador, no entran en Análisis, en la media de la ficha de cliente, en el informe de contrato ni
 * en los indicadores. La fecha se conserva en `tickets.closed_time` (E-207).
 */
const MIGRACION = '2026-12-12T15:00:00.000Z'
const ZOHO = '2026-11-03T10:00:00.000Z'

let n = 5000
async function ticket(id: string, closedTime: string | null, extra: { account?: string; contact?: string; status?: string } = {}) {
  await db.query(
    `INSERT INTO tickets (id, number, subject, status, status_type, created_time, closed_time, account_id, contact_id)
     VALUES ($1, $2, 's', $3, 'Closed', '2026-11-01T10:00:00Z', $4, $5, $6)`,
    [id, ++n, extra.status ?? 'Finalizado', closedTime, extra.account ?? null, extra.contact ?? null],
  )
}
async function marcador(ticketId: string, origen: 'zoho' | 'migracion', destino: string) {
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values, performed_at)
     VALUES ($1, $2, $3, 'Entregado', 'Finalizado', 'Servicio Técnico', $4, $5, $6)`,
    [ticketId, ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION,
      JSON.stringify({ regla: 'entregado-a-finalizado', closed_time_previo: origen === 'zoho' ? destino : null, closed_time_destino: destino, cierre_origen: origen }), MIGRACION],
  )
}

describe('cierresPuestosPorMigracion', () => {
  it('da por ticket sólo el cierre de los marcadores con origen «migracion»', async () => {
    await ticket('m', MIGRACION); await marcador('m', 'migracion', MIGRACION)
    await ticket('z', ZOHO); await marcador('z', 'zoho', ZOHO)
    expect([...(await cierresPuestosPorMigracion(db)).entries()].map(([k, v]) => [k, new Date(v).toISOString()])).toEqual([['m', MIGRACION]])
  })
})

describe('Análisis (RQ-TC-69)', () => {
  it('el cierre puesto por la migración no es finalizadoAt y no cuenta; el de Zoho sí; la fecha sigue en la base', async () => {
    await ticket('m', MIGRACION); await marcador('m', 'migracion', MIGRACION)
    await ticket('z', ZOHO); await marcador('z', 'zoho', ZOHO)
    await ticket('normal', ZOHO)
    const filas = await getAnalisisRows(db)
    const fin = (i: number) => filas[i]!.finalizadoAt && new Date(filas[i]!.finalizadoAt!).toISOString()
    expect(filas.map((_, i) => fin(i)).sort()).toEqual([null, ZOHO, ZOHO].sort())
    const a = computeAnalisis(filas, new Date('2026-01-01T00:00:00Z'), new Date('2027-01-31T00:00:00Z'))
    expect(a.finalizados).toBe(2)
    const enBase = await db.query("SELECT closed_time FROM tickets WHERE id = 'm'")
    expect(new Date(String(enBase.rows[0].closed_time)).toISOString()).toBe(MIGRACION)
  })
})

describe('ficha de cliente (RQ-TC-69)', () => {
  it('la media de resolución la calcula el servidor y no lleva el cierre de la migración', async () => {
    await db.query("INSERT INTO accounts (id, name) VALUES ('acc-1', 'Cliente')")
    await db.query("INSERT INTO contacts (id, first_name, account_id) VALUES ('ct-1', 'Ana', 'acc-1')")
    await ticket('normal', '2026-11-01T12:00:00Z', { account: 'acc-1', contact: 'ct-1' })
    await ticket('m', MIGRACION, { account: 'acc-1', contact: 'ct-1' }); await marcador('m', 'migracion', MIGRACION)
    expect((await getAccountDetail(db, 'acc-1', new Date('2027-01-31T00:00:00Z')))!.resolucionPromedioMs).toBe(2 * 3600000)
    expect((await getContactDetail(db, 'ct-1', new Date('2027-01-31T00:00:00Z')))!.resolucionPromedioMs).toBe(2 * 3600000)
  })
  it('sin ningún cierre que cuente, null', async () => {
    await db.query("INSERT INTO accounts (id, name) VALUES ('acc-2', 'Otro')")
    await ticket('m', MIGRACION, { account: 'acc-2' }); await marcador('m', 'migracion', MIGRACION)
    expect((await getAccountDetail(db, 'acc-2', new Date('2027-01-31T00:00:00Z')))!.resolucionPromedioMs).toBeNull()
  })
})

describe('informe de contrato (RQ-TC-69, S-3)', () => {
  const LOTE = 'OV-2026-900'
  async function subOVConTicket(sufijo: string, ticketId: string) {
    await db.query(
      "INSERT INTO books.sales_orders (salesorder_id, salesorder_number, customer_id, date, status, raw) VALUES ($1, $2, 'C-1', '2026-01-10', 'open', '{}')",
      [`so-${sufijo}`, `${LOTE}-${sufijo}`],
    )
    await asociarOV(db, { ticketId, numero: `${LOTE}-${sufijo}`, salesorderId: `so-${sufijo}`, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  }
  it('el marcador con «migracion» no fecha la subOV; con «zoho» fecha con la de Zoho', async () => {
    const c = await crearContrato(db, { clientId: 'C-1', lote: LOTE, fechaInicio: '2026-01-01', fechaFin: '2026-12-31', creadoPor: 'c' })
    await ticket('m', MIGRACION); await marcador('m', 'migracion', MIGRACION); await subOVConTicket('01', 'm')
    await ticket('z', ZOHO); await marcador('z', 'zoho', ZOHO); await subOVConTicket('02', 'z')
    const inf = await informeContrato(db, c, '2026-12-20')
    const fecha = (num: string) => inf.subOV.find((s) => s.numero === `${LOTE}-${num}`)!.fechaEjecucion
    expect(fecha('01')).toBeNull()
    expect(fecha('02')).toBe('2026-11-03')
    expect(inf.sinFecha.map((s) => s.numero)).toEqual([`${LOTE}-01`])
  })
})

describe('indicadores (RQ-TC-69, S-5)', () => {
  it('el marcador no es un paso del historial: «reentrante» sigue siendo sin dato', async () => {
    await ticket('m', MIGRACION); await marcador('m', 'migracion', MIGRACION)
    const e = await leerEntradasIndicadores(db, { desde: null, hasta: null })
    expect(e.historial.get('m')).toBeUndefined()
    const fila = tablaIndicadores(e).find((f) => f.ticketId === 'm')!
    expect([...new Set(fila.indicadores.map((i) => i.reentrante))]).toEqual([null])
  })
})
