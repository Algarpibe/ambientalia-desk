import { describe, it, expect } from 'vitest'
import { compararIds, unirPorId, compararAdjuntos } from './comparar'

/**
 * verificacion-completitud (1G-03, D8 y D11) · comparación pura de ids, en las dos direcciones.
 * QUÉ COMPRUEBA: igual número con ids distintos es diferencia (CA-2, E-266: el recuento declarado no se lee); orden por longitud y luego texto;
 * un adjunto visto por las dos vías cuenta una vez, con el tamaño del lado de la conversación primero; y el otro tamaño es diferencia (CA-3).
 * QUÉ NO COMPRUEBA: la lectura de Zoho ni de la base (L3 y L5).
 */
describe('compararIds', () => {
  it('igual cantidad con ids distintos es discrepancia en su lado (CA-2)', () => {
    expect(compararIds(['a1', 'a2'], ['a1', 'a3'])).toEqual({ faltaEnDesk: ['a2'], faltaEnZoho: ['a3'], casan: 1 })
  })

  it('con listas iguales no hay diferencia, y con cuatro ids de cada lado cuenta las cuatro que casan', () => {
    expect(compararIds(['c', 'a', 'd', 'b'], ['a', 'b', 'c', 'd'])).toEqual({ faltaEnDesk: [], faltaEnZoho: [], casan: 4 })
  })

  it('ordena por longitud y luego por texto: el 9 antes que el 10', () => {
    const r = compararIds(['10', '9', '100', 'b', 'a'], [])
    expect(r.faltaEnDesk).toEqual(['9', 'a', 'b', '10', '100'])
    expect(r.casan).toBe(0)
  })

  it('un id repetido en una lista cuenta una vez', () => {
    expect(compararIds(['x', 'x', 'y'], ['y'])).toEqual({ faltaEnDesk: ['x'], faltaEnZoho: [], casan: 1 })
  })
})

describe('unirPorId', () => {
  it('el adjunto 4001 por las dos vías cuenta una vez', () => {
    const r = unirPorId([{ id: '4001', size: 10 }], [{ id: '4001', size: 10 }, { id: '4002', size: 20 }])
    expect(r.map((a) => a.id)).toEqual(['4001', '4002'])
  })

  it('el tamaño del lado de la conversación va primero', () => {
    expect(unirPorId([{ id: '4001', size: 10 }], [{ id: '4001', size: 99 }])).toEqual([{ id: '4001', size: 10 }])
  })
})

describe('compararAdjuntos', () => {
  it('4001 casa; 4002 con otro tamaño es diferencia de tamaño con los dos lados (CA-3)', () => {
    const r = compararAdjuntos([{ id: '4001', size: 10 }, { id: '4002', size: 20 }], [{ id: '4001', size: 10 }, { id: '4002', size: 25 }])
    expect(r).toEqual({ faltaEnDesk: [], faltaEnZoho: [], casan: 1, distintoTamano: [{ id: '4002', zoho: 20, desk: 25 }] })
  })

  it('lo que falta en cada lado sale ordenado, y un tamaño nulo frente a un número es diferencia', () => {
    const r = compararAdjuntos([{ id: '10', size: 1 }, { id: '9', size: null }, { id: '5', size: 7 }], [{ id: '5', size: null }, { id: '77', size: 3 }])
    expect(r.faltaEnDesk).toEqual(['9', '10'])
    expect(r.faltaEnZoho).toEqual(['77'])
    expect(r.casan).toBe(0)
    expect(r.distintoTamano).toEqual([{ id: '5', zoho: 7, desk: null }])
  })
})
