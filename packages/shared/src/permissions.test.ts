import { describe, it, expect } from 'vitest'
import { canExecuteTransition } from './permissions'
import { areasForTransition, areasSiguientes } from './transitions'

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

describe('areasSiguientes', () => {
  // El caso que motivó la funcionalidad: Servicio Técnico termina y el ticket queda a la espera de
  // que Comercial facture. Las tres transiciones que salen de «Por Facturar» son de Comercial.
  it('desde «Por Facturar» le toca a Comercial', () => {
    expect(areasSiguientes('Por Facturar')).toEqual(['Comercial'])
  })

  // Las compuestas se descomponen, y cada área aparece UNA vez aunque la ofrezcan varias transiciones.
  it('descompone las áreas compuestas y no las repite', () => {
    expect(areasSiguientes('Notificación Comercial').sort()).toEqual(['Comercial', 'Compras', 'Servicio Técnico'])
  })

  // Un estado terminal no le toca a nadie: no hay transición que salga de él.
  it('un estado final no le toca a nadie', () => {
    expect(areasSiguientes('Finalizado')).toEqual([])
  })

  // Un estado que no existe tampoco: no se inventa nada ni revienta.
  it('un estado desconocido devuelve lista vacía', () => {
    expect(areasSiguientes('Estado que no existe')).toEqual([])
  })
})
