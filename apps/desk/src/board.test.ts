import { describe, it, expect } from 'vitest'
import { groupTicketsByColumn, visibleColumns, groupByPriority, groupByDueDate } from './board'
import type { Ticket } from '@ambientalia/shared'

const t = (id: string, status: string): Ticket => ({
  id, number: `#${id}`, title: 't', company: 'c', time: '', status,
})

describe('groupTicketsByColumn', () => {
  it('agrupa por columna del Blueprint y cuenta', () => {
    const groups = groupTicketsByColumn([
      t('1', 'Ingresado'), t('2', 'Ingresado'), t('3', 'En Proceso'), t('4', 'Solicitado'),
    ])
    expect(groups.ingresado.map((x) => x.id)).toEqual(['1', '2'])
    expect(groups.proceso.map((x) => x.id)).toEqual(['3'])
    expect(groups.solicitado.map((x) => x.id)).toEqual(['4'])
  })

  it('estados sin columna propia caen en "otros"', () => {
    const groups = groupTicketsByColumn([t('9', 'Estado Inesperado')])
    expect(groups.otros.map((x) => x.id)).toEqual(['9'])
  })
})

describe('visibleColumns', () => {
  const cols = [{ id: 'a' }, { id: 'b' }, { id: 'otros' }]
  it('hideEmpty: oculta columnas en 0 (y otros vacía)', () => {
    expect(visibleColumns(cols, { a: 2, b: 0, otros: 0 }, true).map((c) => c.id)).toEqual(['a'])
  })
  it('sin hideEmpty: muestra todas menos otros vacía', () => {
    expect(visibleColumns(cols, { a: 2, b: 0, otros: 0 }, false).map((c) => c.id)).toEqual(['a', 'b'])
    expect(visibleColumns(cols, { a: 2, b: 0, otros: 1 }, false).map((c) => c.id)).toEqual(['a', 'b', 'otros'])
  })
})

const mk = (id: string, extra: Partial<Ticket>): Ticket => ({ id, number: `#${id}`, title: '', company: '', time: '', status: 'X', ...extra })

describe('groupByPriority', () => {
  it('agrupa High/Medium/Low/otra (Urgent→High)', () => {
    const g = groupByPriority([mk('1', { priority: 'High' }), mk('2', { priority: 'Urgent' }), mk('3', { priority: 'Medium' }), mk('4', { priority: 'Low' }), mk('5', { priority: null })])
    expect(g.High.map((x) => x.id)).toEqual(['1', '2'])
    expect(g.Medium.map((x) => x.id)).toEqual(['3'])
    expect(g.Low.map((x) => x.id)).toEqual(['4'])
    expect(g.otra.map((x) => x.id)).toEqual(['5'])
  })
})

describe('groupByDueDate', () => {
  it('buckets por vencimiento respecto a now', () => {
    const now = new Date(2026, 5, 4, 12, 0, 0)
    const g = groupByDueDate([
      mk('v', { dueDate: '2026-06-01' }),
      mk('h', { dueDate: new Date(2026, 5, 4, 18).toISOString() }),
      mk('s', { dueDate: new Date(2026, 5, 7).toISOString() }),
      mk('a', { dueDate: new Date(2026, 5, 20).toISOString() }),
      mk('n', { dueDate: null }),
    ], now)
    expect(g.vencidos.map((x) => x.id)).toEqual(['v'])
    expect(g.hoy.map((x) => x.id)).toEqual(['h'])
    expect(g.semana.map((x) => x.id)).toEqual(['s'])
    expect(g.adelante.map((x) => x.id)).toEqual(['a'])
    expect(g.sinfecha.map((x) => x.id)).toEqual(['n'])
  })
})
