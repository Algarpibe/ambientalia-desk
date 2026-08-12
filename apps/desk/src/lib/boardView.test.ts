import { describe, it, expect } from 'vitest'
import type { Ticket } from '@ambientalia/shared'
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

/**
 * «Mis Tickets» filtra por DERIVACIÓN, y solo en la vista.
 *
 * ⚠️ Nunca en el servidor: `docs/modelo-autorizacion.md` decidió que no hay propiedad por ticket ni
 * segmentación de visibilidad. Esto es una comodidad para barrer lo propio, no un permiso.
 */
describe('applyBoardView · mis tickets', () => {
  const mios = [
    T({ id: 'm1', derivado: { id: 'yo', nombre: 'Yo', cargo: null, initials: 'YO' } }),
    T({ id: 'm2', statusType: 'Closed', derivado: { id: 'yo', nombre: 'Yo', cargo: null, initials: 'YO' } }),
    T({ id: 'otro', derivado: { id: 'tu', nombre: 'Tú', cargo: null, initials: 'TU' } }),
    T({ id: 'nadie', derivado: null }),
  ]

  it('trae solo los derivados a mí, y excluye los cerrados', () => {
    expect(applyBoardView(mios, 'mios', now, 'yo').map((t) => t.id)).toEqual(['m1'])
  })

  /**
   * Sin usuario NO se devuelve todo. Enseñar el tablero entero bajo el rótulo «Mis Tickets» es la
   * mentira peor de las dos posibles: quien lo lea creerá que todo eso es suyo.
   */
  it('sin usuario devuelve vacío, nunca el tablero entero', () => {
    expect(applyBoardView(mios, 'mios', now)).toEqual([])
  })
})

describe('viewLabel / FUNCTIONAL_BY_LABEL', () => {
  it('viewLabel mapea key→etiqueta con fallback', () => {
    expect(viewLabel('cerrados')).toBe('Tickets cerrados')
    expect(viewLabel('zzz')).toBe('Todos los Tickets')
  })
  it('FUNCTIONAL_BY_LABEL mapea etiqueta→key', () => {
    expect(FUNCTIONAL_BY_LABEL['Tickets en espera']).toBe('espera')
    // Era `toBeUndefined()`: «Mis Tickets» estaba en el Sidebar como ítem decorativo. Ahora es una
    // vista de verdad y se reutiliza esa misma etiqueta, que ya estaba puesta.
    expect(FUNCTIONAL_BY_LABEL['Mis Tickets']).toBe('mios')
  })
})
