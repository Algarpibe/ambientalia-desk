import { describe, it, expect } from 'vitest'
import { computeAnalisis } from './analisis'
import type { AnalisisRow } from './types'

const rows: AnalisisRow[] = [
  { status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-10T00:00:00Z', finalizadoAt: null, diasEntrega: null, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-05T00:00:00Z', diasEntrega: 5, marca: 'Horiba', cliente: 'ACME', tecnico: 'Ana', tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-11T00:00:00Z', diasEntrega: 3, marca: 'Grimm', cliente: 'Otro', tecnico: 'Beto', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2025-01-01T00:00:00Z', finalizadoAt: '2025-01-02T00:00:00Z', diasEntrega: 5, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio' },
]

describe('computeAnalisis', () => {
  it('KPIs, distribuciones y tendencia dentro del rango', () => {
    const from = new Date('2026-05-01T00:00:00Z')
    const to = new Date('2026-05-31T23:59:59Z')
    const a = computeAnalisis(rows, from, to)
    expect(a.activos).toBe(1)
    expect(a.creados).toBe(3)
    expect(a.finalizados).toBe(2)
    expect(a.tiempoPromedioDias).toBe(7)
    expect(a.cumplimientoPct).toBe(50)
    expect(a.porEstado).toEqual([{ label: 'Ingresado', value: 1 }])
    expect(a.porTecnico.find((p) => p.label === 'Ana')?.value).toBe(2)
    expect(a.porMarca.find((p) => p.label === 'Grimm')?.value).toBe(2)
    expect(a.porTipoServicio.find((p) => p.label === 'Mantenimiento')?.value).toBe(2)
    expect(a.porTipoServicio.find((p) => p.label === 'Calibración')?.value).toBe(1)
    expect(a.porClasificacion.find((p) => p.label === 'Equipo nuevo')?.value).toBe(2)
    expect(a.tendencia.find((m) => m.mes === '2026-05')).toMatchObject({ creados: 3, finalizados: 2 })
  })

  it('null cuando no hay finalizados/promesas en el rango', () => {
    const a = computeAnalisis([], new Date('2026-01-01T00:00:00Z'), new Date('2026-12-31T00:00:00Z'))
    expect(a.tiempoPromedioDias).toBeNull()
    expect(a.cumplimientoPct).toBeNull()
  })

  it('gestionPorEstado = antigüedad promedio (días) de los activos por estado', () => {
    const to = new Date('2026-05-31T00:00:00Z')
    const base = { finalizadoAt: null, diasEntrega: null, marca: null, cliente: null, tecnico: null, tipoServicio: null, clasificaciones: null }
    const r: AnalisisRow[] = [
      { ...base, status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-21T00:00:00Z' },
      { ...base, status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-11T00:00:00Z' },
      { ...base, status: 'En proceso', statusType: 'Open', createdAt: '2026-05-30T00:00:00Z' },
      { ...base, status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z' },
    ]
    const a = computeAnalisis(r, null, to)
    expect(a.gestionPorEstado).toEqual([
      { label: 'Ingresado', value: 15 },
      { label: 'En proceso', value: 1 },
    ])
  })
})

// RQ-TC-76 (F1C-06): las dos medias del reloj del SLA, en días hábiles de 9 horas a un decimal, sobre los MISMOS tickets que
// `tiempoPromedioDias` (cerrados, no anulados, con fin en el periodo; `analisis.ts:59`) y que además traen dato.
describe('computeAnalisis · tiempos del reloj del SLA (RQ-TC-76)', () => {
  const desde = new Date('2026-05-01T00:00:00Z'), hasta = new Date('2026-05-31T23:59:59Z')
  const base = { diasEntrega: null, marca: null, cliente: null, tecnico: null, tipoServicio: null, clasificaciones: null }
  const fin = (extra: Partial<AnalisisRow> = {}): AnalisisRow => ({
    ...base, status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-04T00:00:00Z', finalizadoAt: '2026-05-08T00:00:00Z', ...extra,
  })

  it('el SLA y el total se promedian en días de 9 horas', () => {
    const a = computeAnalisis([fin({ slaHoras: 9, totalHoras: 18 }), fin({ slaHoras: 27, totalHoras: 27 })], desde, hasta)
    expect(a.tiempoSlaPromedioDias).toBe(2)
    expect(a.tiempoTotalPromedioDias).toBe(2.5)
    expect(a.ticketsConReloj).toBe(2)
  })

  it('el resultado va a un decimal', () => {
    const a = computeAnalisis([fin({ slaHoras: 10, totalHoras: 10 })], desde, hasta) // 10 h / 9 = 1,111…
    expect(a.tiempoSlaPromedioDias).toBe(1.1)
    expect(a.tiempoTotalPromedioDias).toBe(1.1)
  })

  it('un ticket sin dato no entra en las medias, pero sí en tiempoPromedioDias', () => {
    const a = computeAnalisis([fin({ slaHoras: 18, totalHoras: 27 }), fin({ slaHoras: null, totalHoras: null }), fin()], desde, hasta)
    expect(a.tiempoSlaPromedioDias).toBe(2)
    expect(a.tiempoTotalPromedioDias).toBe(3)
    expect(a.ticketsConReloj).toBe(1)
    expect(a.finalizados).toBe(3)
    expect(a.tiempoPromedioDias).toBe(4)
  })

  it('un ticket con sólo uno de los dos tiempos no entra', () => {
    const a = computeAnalisis([fin({ slaHoras: 9, totalHoras: null }), fin({ slaHoras: null, totalHoras: 9 })], desde, hasta)
    expect(a.ticketsConReloj).toBe(0)
    expect(a.tiempoSlaPromedioDias).toBeNull()
  })

  it('ninguno con dato da null en las dos medias y cero en el contador', () => {
    const a = computeAnalisis([fin({ slaHoras: null, totalHoras: null }), fin()], desde, hasta)
    expect(a.tiempoSlaPromedioDias).toBeNull()
    expect(a.tiempoTotalPromedioDias).toBeNull()
    expect(a.ticketsConReloj).toBe(0)
    expect(computeAnalisis([], null, hasta)).toMatchObject({ tiempoSlaPromedioDias: null, tiempoTotalPromedioDias: null, ticketsConReloj: 0 })
  })

  it('un anulado no entra en los dos tiempos, igual que en las tres métricas de RQ-TC-71', () => {
    const anulado = fin({ status: 'Anulado', slaHoras: 90, totalHoras: 180 })
    const a = computeAnalisis([anulado, fin({ slaHoras: 9, totalHoras: 18 })], desde, hasta)
    expect(a.tiempoSlaPromedioDias).toBe(1)
    expect(a.tiempoTotalPromedioDias).toBe(2)
    expect(a.ticketsConReloj).toBe(1)
  })

  it('un cerrado fuera del periodo o con fin anterior a la creación tampoco entra', () => {
    const fuera = fin({ finalizadoAt: '2026-06-08T00:00:00Z', slaHoras: 90, totalHoras: 90 })
    const alReves = fin({ createdAt: '2026-05-09T00:00:00Z', slaHoras: 90, totalHoras: 90 })
    const a = computeAnalisis([fuera, alReves, fin({ slaHoras: 9, totalHoras: 9 })], desde, hasta)
    expect(a.tiempoSlaPromedioDias).toBe(1)
    expect(a.ticketsConReloj).toBe(1)
  })

  it('un abierto con dato no entra', () => {
    const abierto: AnalisisRow = { ...base, status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-04T00:00:00Z', finalizadoAt: null, slaHoras: 90, totalHoras: 90 }
    expect(computeAnalisis([abierto], desde, hasta).ticketsConReloj).toBe(0)
  })

  it('tiempoPromedioDias, el cumplimiento y el resto valen lo que valían', () => {
    const conReloj = rows.map((r) => ({ ...r, slaHoras: 9, totalHoras: 18 }))
    const antes = computeAnalisis(rows, new Date('2026-05-01T00:00:00Z'), new Date('2026-05-31T23:59:59Z'))
    const despues = computeAnalisis(conReloj, new Date('2026-05-01T00:00:00Z'), new Date('2026-05-31T23:59:59Z'))
    expect(despues.tiempoPromedioDias).toBe(7)
    expect(despues.cumplimientoPct).toBe(50)
    const sinReloj = (x: ReturnType<typeof computeAnalisis>): Record<string, unknown> => {
      const c: Record<string, unknown> = { ...x }
      for (const k of ['tiempoSlaPromedioDias', 'tiempoTotalPromedioDias', 'ticketsConReloj']) delete c[k]
      return c
    }
    expect(sinReloj(despues)).toEqual(sinReloj(antes))
    expect([despues.tiempoSlaPromedioDias, despues.tiempoTotalPromedioDias, despues.ticketsConReloj]).toEqual([1, 2, 2])
  })

  // W1 del verify: 15 h / 9 = 1,67 días; redondear da 1,7 y truncar daría 1,6. Fija el sentido del redondeo.
  it('la media se redondea al decimal más cercano, no se trunca', () => {
    expect(computeAnalisis([fin({ slaHoras: 15, totalHoras: 15 })], desde, hasta).tiempoSlaPromedioDias).toBe(1.7)
  })
})
