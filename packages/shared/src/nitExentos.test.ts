import { describe, it, expect } from 'vitest'
import { esNitExento } from './nitExentos'

/**
 * RQ-TC-57 · `esNitExento`: función pura sobre la lista que lee el servidor. La noción de «mismo NIT» es la de
 * `nitCoincide`, no una segunda implementación.
 */
const LISTA = ['222222222222']

describe('esNitExento (RQ-TC-57)', () => {
  it.each([
    ['sin formato', '222222222222'],
    ['con puntos', '222.222.222.222'],
    ['con espacios', '222 222 222 222'],
    ['con guion y dígito', '222222222222-2'],
  ])('un NIT %s de la lista es exento', (_nombre, nit) => {
    expect(esNitExento(nit, LISTA)).toBe(true)
  })

  it('una fila de la lista escrita con puntos casa igual', () => {
    expect(esNitExento('222222222222', ['222.222.222.222'])).toBe(true)
  })

  it('otro NIT no es exento', () => {
    expect(esNitExento('900123456', LISTA)).toBe(false)
  })

  it('con la lista vacía nadie es exento', () => {
    expect(esNitExento('222222222222', [])).toBe(false)
  })

  it.each([[''], ['   '], ['---']])('un NIT sin dígitos («%s») nunca es exento, ni con entradas válidas ni con una entrada vacía', (nit) => {
    expect(esNitExento(nit, LISTA)).toBe(false)
    expect(esNitExento(nit, [''])).toBe(false)
  })

  it.each([[undefined], [null], [222222222222], [{}]])('un valor que no es texto (%s) no es exento', (nit) => {
    expect(esNitExento(nit, LISTA)).toBe(false)
  })

  it('base más dígito de verificación SIN guion no es exento (comportamiento conocido, contrato de nitCoincide)', () => {
    expect(esNitExento('2222222222222', LISTA)).toBe(false)
  })
})
