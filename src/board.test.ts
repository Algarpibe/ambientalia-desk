import { describe, it, expect } from 'vitest'
import { groupTicketsByColumn, visibleColumns } from './board'
import type { Ticket } from '../shared/types'

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
