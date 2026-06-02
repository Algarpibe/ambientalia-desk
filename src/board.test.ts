import { describe, it, expect } from 'vitest'
import { groupTicketsByColumn } from './board'
import type { Ticket } from '../shared/types'

const t = (id: string, status: string): Ticket => ({
  id, number: `#${id}`, title: 't', company: 'c', time: '', status,
})

describe('groupTicketsByColumn', () => {
  it('agrupa por columna y cuenta', () => {
    const groups = groupTicketsByColumn([
      t('1', 'Ingresado'), t('2', 'Ingresado'), t('3', 'En Proceso'), t('4', 'Finalizado'),
    ])
    expect(groups.ingresado.map((x) => x.id)).toEqual(['1', '2'])
    expect(groups.proceso.map((x) => x.id)).toEqual(['3'])
    expect(groups.proceso.length).toBe(1)
    expect(Object.values(groups).flat().some((x) => x.id === '4')).toBe(false)
  })
})
