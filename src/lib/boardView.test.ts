import { describe, it, expect } from 'vitest'
import type { Ticket } from '../../shared/types'
import { applyBoardView, viewLabel, FUNCTIONAL_BY_LABEL } from './boardView'

const BASE = { id: 'x', number: '#1', subject: 's', status: 'Ingresado', statusType: 'Open', dueDate: null }
const T = (over: Partial<Ticket>): Ticket => ({ ...BASE, ...over } as Ticket)

const now = new Date('2026-06-06T00:00:00Z')
const tickets: Ticket[] = [
  T({ id: 'a', status: 'Ingresado', statusType: 'Open', dueDate: '2026-01-01T00:00:00Z' }),   // activo, vencido
  T({ id: 'b', status: 'En espera de repuesto', statusType: 'Open', dueDate: null }),          // en espera
  T({ id: 'c', status: 'Finalizado', statusType: 'Closed', dueDate: '2026-01-01T00:00:00Z' }), // cerrado (no vencido)
  T({ id: 'd', status: 'Diagnóstico', statusType: 'Open', dueDate: '2026-12-31T00:00:00Z' }),  // activo, futuro
]

describe('applyBoardView', () => {
  const ids = (key: string) => applyBoardView(tickets, key, now).map((t) => t.id).sort()
  it('todos = activos (excluye cerrados)', () => { expect(ids('todos')).toEqual(['a', 'b', 'd']) })
  it('cerrados = solo Closed', () => { expect(ids('cerrados')).toEqual(['c']) })
  it('abiertos = activos sin en espera', () => { expect(ids('abiertos')).toEqual(['a', 'd']) })
  it('espera = solo en espera', () => { expect(ids('espera')).toEqual(['b']) })
  it('vencidos = activo + fecha pasada (excluye sin fecha/futuro/cerrado)', () => { expect(ids('vencidos')).toEqual(['a']) })
  it('key desconocida → como todos', () => { expect(ids('zzz')).toEqual(['a', 'b', 'd']) })
})

describe('viewLabel / FUNCTIONAL_BY_LABEL', () => {
  it('viewLabel mapea key→etiqueta con fallback', () => {
    expect(viewLabel('cerrados')).toBe('Tickets cerrados')
    expect(viewLabel('zzz')).toBe('Todos los Tickets')
  })
  it('FUNCTIONAL_BY_LABEL mapea etiqueta→key', () => {
    expect(FUNCTIONAL_BY_LABEL['Tickets en espera']).toBe('espera')
    expect(FUNCTIONAL_BY_LABEL['Mis Tickets']).toBeUndefined()
  })
})
