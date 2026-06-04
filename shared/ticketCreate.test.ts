import { describe, it, expect } from 'vitest'
import { buildCodigoServicio, buildSubject, parseCodigoFromPotential, defaultPrefijoFor } from './ticketCreate'

describe('defaultPrefijoFor', () => {
  it('Calibración → CG; Diagnóstico/Mantenimiento/otros → MT', () => {
    expect(defaultPrefijoFor('Calibración')).toBe('CG')
    expect(defaultPrefijoFor('Diagnóstico')).toBe('MT')
    expect(defaultPrefijoFor('Mantenimiento')).toBe('MT')
    expect(defaultPrefijoFor('Garantía')).toBe('MT')
  })
})

describe('buildCodigoServicio', () => {
  it('arma PREFIJO_serie_modelo_AAMMDD', () => {
    expect(buildCodigoServicio({ prefijo: 'MT', serie: '18A20070', modelo: 'EDM180C', fecha: new Date(2026, 5, 4) }))
      .toBe('MT_18A20070_EDM180C_260604')
  })
})

describe('buildSubject', () => {
  it('arma el asunto estandarizado y colapsa espacios', () => {
    expect(buildSubject({ cliente: 'Gecelca S.A. E.S.P.', tipoEquipo: 'Monitor de partículas', codigo: 'MT_18A20070_EDM180C_260604' }))
      .toBe('Servicio Técnico Gecelca S.A. E.S.P. Monitor de partículas MT_18A20070_EDM180C_260604')
  })
})

describe('parseCodigoFromPotential', () => {
  it('extrae prefijo/serie/modelo cuando hay código', () => {
    expect(parseCodigoFromPotential('Corola - 0526 - MT_18A10077_EDM180D_260416'))
      .toEqual({ prefijo: 'MT', serie: '18A10077', modelo: 'EDM180D' })
  })
  it('devuelve null si no hay código', () => {
    expect(parseCodigoFromPotential('Daphnia - Alquiler Cilindros')).toBeNull()
    expect(parseCodigoFromPotential(null)).toBeNull()
  })
})
