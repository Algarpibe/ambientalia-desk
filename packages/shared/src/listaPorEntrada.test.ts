import { describe, it, expect } from 'vitest'
import { ordenarPorEntrada } from './listaPorEntrada'

/** F1B-07, L3 (`vistas-tablero` RQ-VT-10): el orden de la lista de «Remisión creada», función pura de `shared`. */
const t = (id: string, number: string | number, enEstadoDesde: string | null, priority?: string) => ({ id, number, enEstadoDesde, priority })
const ids = (xs: Array<{ id: string }>) => xs.map((x) => x.id)

describe('ordenarPorEntrada', () => {
  it('el instante de entrada ascendente: el que lleva más tiempo en el estado va primero', () => {
    const r = ordenarPorEntrada([t('b', 2, '2026-09-10T00:00:00Z'), t('a', 1, '2026-09-01T00:00:00Z'), t('c', 3, '2026-09-20T00:00:00Z')])
    expect(ids(r)).toEqual(['a', 'b', 'c'])
  })

  it('el que no tiene entrada (null) va al final y no se omite', () => {
    expect(ids(ordenarPorEntrada([t('sin', 1, null), t('a', 2, '2026-09-10T00:00:00Z'), t('b', 3, '2026-09-01T00:00:00Z')]))).toEqual(['b', 'a', 'sin'])
  })

  it('un instante ilegible cuenta como sin entrada', () => {
    expect(ids(ordenarPorEntrada([t('mal', 1, 'no-es-fecha'), t('a', 2, '2026-09-10T00:00:00Z')]))).toEqual(['a', 'mal'])
  })

  it('el empate, y el tramo sin entrada, se resuelven por el número de ticket ascendente (SP-3), también con «#»', () => {
    expect(ids(ordenarPorEntrada([t('v20', '#20', '2026-09-01T00:00:00Z'), t('v10', '#10', '2026-09-01T00:00:00Z')]))).toEqual(['v10', 'v20'])
    expect(ids(ordenarPorEntrada([t('s20', 20, null), t('s9', 9, null), t('s10', 10, null)]))).toEqual(['s9', 's10', 's20'])
  })

  it('la prioridad no interviene: un Low antiguo va delante de un Urgent reciente', () => {
    expect(ids(ordenarPorEntrada([t('urg', 1, '2026-09-20T00:00:00Z', 'Urgent'), t('low', 2, '2026-09-01T00:00:00Z', 'Low')]))).toEqual(['low', 'urg'])
  })

  it('no muta la entrada', () => {
    const e = [t('b', 2, '2026-09-10T00:00:00Z'), t('a', 1, '2026-09-01T00:00:00Z')]
    ordenarPorEntrada(e)
    expect(ids(e)).toEqual(['b', 'a'])
  })
})
