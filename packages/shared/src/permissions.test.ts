import { describe, it, expect } from 'vitest'
import { canExecuteTransition } from './permissions'
import { areasForTransition } from './transitions'

describe('areasForTransition', () => {
  it('descompone compuestas y deja simples', () => {
    expect(areasForTransition('Comercial')).toEqual(['Comercial'])
    expect(areasForTransition('Comercial / Compras')).toEqual(['Comercial', 'Compras'])
    expect(areasForTransition('Comercial / Servicio Técnico')).toEqual(['Comercial', 'Servicio Técnico'])
  })
})

describe('canExecuteTransition', () => {
  it('admin siempre puede', () => {
    expect(canExecuteTransition([], true, 'Servicio Técnico')).toBe(true)
  })
  it('rol que cubre el área puede; el que no, no', () => {
    expect(canExecuteTransition(['Servicio Técnico'], false, 'Servicio Técnico')).toBe(true)
    expect(canExecuteTransition(['Comercial'], false, 'Servicio Técnico')).toBe(false)
  })
  it('compuesta: basta cubrir una de las áreas', () => {
    expect(canExecuteTransition(['Compras'], false, 'Comercial / Compras')).toBe(true)
  })
  it('sin áreas no puede', () => {
    expect(canExecuteTransition([], false, 'Comercial')).toBe(false)
  })
})
