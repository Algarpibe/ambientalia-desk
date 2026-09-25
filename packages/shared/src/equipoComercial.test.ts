import { describe, it, expect } from 'vitest'
import { cambiosComerciales, puedeEditarCamposRestringidos } from './equipoComercial'

describe('cambiosComerciales (D2)', () => {
  it('una clave AUSENTE en entrante no cuenta como cambio', () => {
    const guardado = { fechaFacturaCompra: '2026-01-10' }
    const entrante = {}
    expect(cambiosComerciales(guardado, entrante)).toEqual([])
  })

  it("entrante vacío ('') normaliza a null y cuenta como cambio cuando lo guardado no era null", () => {
    const guardado = { driveUrl: 'https://drive.google.com/x' }
    const entrante = { driveUrl: '' }
    expect(cambiosComerciales(guardado, entrante)).toEqual([
      { campo: 'driveUrl', anterior: 'https://drive.google.com/x', nuevo: null },
    ])
  })

  it('el mismo valor (fecha igual) no genera cambio', () => {
    const guardado = { finGarantia: '2026-01-10' }
    const entrante = { finGarantia: '2026-01-10' }
    expect(cambiosComerciales(guardado, entrante)).toEqual([])
  })

  it('un valor distinto genera un cambio con anterior y nuevo', () => {
    const guardado = { mantenedorId: 'cli-1' }
    const entrante = { mantenedorId: 'cli-2' }
    expect(cambiosComerciales(guardado, entrante)).toEqual([
      { campo: 'mantenedorId', anterior: 'cli-1', nuevo: 'cli-2' },
    ])
  })
})

describe('puedeEditarCamposRestringidos (D1)', () => {
  it('verdadero con área Comercial', () => {
    expect(puedeEditarCamposRestringidos(['Comercial'], false)).toBe(true)
  })

  it('verdadero con isAdmin aunque las áreas estén vacías', () => {
    expect(puedeEditarCamposRestringidos([], true)).toBe(true)
  })

  it('falso con áreas vacías y sin isAdmin', () => {
    expect(puedeEditarCamposRestringidos([], false)).toBe(false)
  })

  it('falso con un área distinta de Comercial', () => {
    expect(puedeEditarCamposRestringidos(['Servicio Técnico'], false)).toBe(false)
  })
})
