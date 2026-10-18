// anulado-con-motivo (F1C-01, lote 2): los anulados no cuentan en las tres métricas de servicios cumplidos (RQ-TC-71, D6).
import { describe, it, expect } from 'vitest'
import { computeAnalisis } from './analisis'
import { resolucionPromedioMs } from './cierreEnCifras'
import type { AnalisisRow } from './types'

const DESDE = new Date('2026-05-01T00:00:00Z')
const HASTA = new Date('2026-05-31T23:59:59Z')
const base = { marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio' }
const finalizado = (over: Partial<AnalisisRow> = {}): AnalisisRow =>
  ({ ...base, status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-11T00:00:00Z', diasEntrega: 5, ...over })
const anulado = (over: Partial<AnalisisRow> = {}): AnalisisRow =>
  ({ ...base, status: 'Anulado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-03T00:00:00Z', diasEntrega: 5, ...over })

describe('RQ-TC-71 · los anulados no cuentan como servicios cumplidos', () => {
  it('un anulado no cuenta como finalizado, ni en la tendencia del mes', () => {
    const a = computeAnalisis([anulado(), finalizado()], DESDE, HASTA)
    expect(a.finalizados).toBe(1)
    expect(a.tendencia.find((m) => m.mes === '2026-05')).toMatchObject({ finalizados: 1 })
  })
  it('un anulado no entra en el tiempo promedio (2 días de él, 10 del finalizado)', () => {
    const a = computeAnalisis([anulado(), finalizado()], DESDE, HASTA)
    expect(a.tiempoPromedioDias).toBe(10)
  })
  it('un anulado dentro de su promesa no entra en el cumplimiento (el finalizado está fuera de ella)', () => {
    const a = computeAnalisis([anulado(), finalizado()], DESDE, HASTA)
    expect(a.cumplimientoPct).toBe(0)
  })
  it('un anulado sigue contando como creado y no como activo', () => {
    const a = computeAnalisis([anulado()], DESDE, HASTA)
    expect(a.creados).toBe(1)
    expect(a.activos).toBe(0)
    expect(a.finalizados).toBe(0)
    expect(a.tiempoPromedioDias).toBeNull()
    expect(a.cumplimientoPct).toBeNull()
  })
})

describe('RQ-TC-71 · la ficha de cliente no promedia los anulados (S-5)', () => {
  const t = (id: string, status: string, closedAt: string) => ({ id, status, statusType: 'Closed', createdAt: '2027-01-10T00:00:00Z', closedAt })
  it('la media de resolución es la del finalizado sólo', () => {
    const tickets = [t('f', 'Finalizado', '2027-01-10T04:00:00Z'), t('x', 'Anulado', '2027-01-10T01:00:00Z')]
    expect(resolucionPromedioMs(tickets, new Map(), new Date('2027-01-31T00:00:00Z'))).toBe(4 * 3600000)
  })
  it('con sólo anulados no hay media', () => {
    expect(resolucionPromedioMs([t('x', 'Anulado', '2027-01-10T01:00:00Z')], new Map(), new Date('2027-01-31T00:00:00Z'))).toBeNull()
  })
})
