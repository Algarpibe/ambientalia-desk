import { describe, it, expect } from 'vitest'
import { computeAnalisis } from './analisis'
import type { AnalisisRow } from './types'

const rows: AnalisisRow[] = [
  { status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-10T00:00:00Z', finalizadoAt: null, diasEntrega: null, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-05T00:00:00Z', diasEntrega: 5, marca: 'Horiba', cliente: 'ACME', tecnico: 'Ana' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-11T00:00:00Z', diasEntrega: 3, marca: 'Grimm', cliente: 'Otro', tecnico: 'Beto' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2025-01-01T00:00:00Z', finalizadoAt: '2025-01-02T00:00:00Z', diasEntrega: 5, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana' },
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
    expect(a.tendencia.find((m) => m.mes === '2026-05')).toMatchObject({ creados: 3, finalizados: 2 })
  })

  it('null cuando no hay finalizados/promesas en el rango', () => {
    const a = computeAnalisis([], new Date('2026-01-01T00:00:00Z'), new Date('2026-12-31T00:00:00Z'))
    expect(a.tiempoPromedioDias).toBeNull()
    expect(a.cumplimientoPct).toBeNull()
  })
})
