import { describe, it, expect } from 'vitest'
import { buildCodigoServicio, buildSubject, parseCodigoFromPotential, defaultPrefijoFor, extractServiceCode, TIPOS_SERVICIO } from './ticketCreate'

describe('defaultPrefijoFor', () => {
  it('Calibración → CG; Diagnóstico/Mantenimiento/otros → MT', () => {
    expect(defaultPrefijoFor('Calibración')).toBe('CG')
    expect(defaultPrefijoFor('Diagnóstico')).toBe('MT')
    expect(defaultPrefijoFor('Mantenimiento')).toBe('MT')
    expect(defaultPrefijoFor('Garantía')).toBe('MT')
    expect(defaultPrefijoFor('Reparación')).toBe('MT')
  })
})

describe('TIPOS_SERVICIO', () => {
  // Lista unificada con la del formulario de remisiones, que aporta 'Reparación'.
  it('incluye Reparación y deja los comodines al final', () => {
    expect(TIPOS_SERVICIO).toContain('Reparación')
    expect(TIPOS_SERVICIO.slice(-2)).toEqual(['No aplica', 'Otro'])
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

describe('extractServiceCode', () => {
  it('extrae serial + código de 4 partes', () => {
    expect(extractServiceCode('Servicio Técnico CHEMILAB GRIMM EDM 180C MT_18A19042_EDM180C_260305'))
      .toEqual({ serial: '18A19042', codigo: 'MT_18A19042_EDM180C_260305' })
  })
  it('extrae código de 3 partes (sin fecha)', () => {
    expect(extractServiceCode('Equipo Nuevo Laboratorio HV_219587_Defender520'))
      .toEqual({ serial: '219587', codigo: 'HV_219587_Defender520' })
  })
  /**
   * Casos REALES del histórico de Zoho: un lote entero de asuntos trae un espacio pegado al guion
   * bajo. El patrón viejo usaba `[^_\s]+`, que lo rechazaba, y esos tickets se quedaban sin serial
   * —y por tanto sin poder enlazarse con su equipo— sin que nada lo delatara.
   */
  it('tolera espacios pegados a los guiones bajos y normaliza el código que devuelve', () => {
    // Lote del 2024-07-05: espacio tras el prefijo.
    expect(extractServiceCode('Equipo Nuevo  Analizador de óxidos de nitrógeno HV_ S2X9CPH3_APNA-370'))
      .toEqual({ serial: 'S2X9CPH3', codigo: 'HV_S2X9CPH3_APNA-370' })
    // Espacio antes del segundo guion bajo, y fecha de 5 dígitos que NO es fecha válida.
    expect(extractServiceCode('Servicio Técnico A&MA Monitor de Partículas CG_18A18102 _EDM180C_26031'))
      .toEqual({ serial: '18A18102', codigo: 'CG_18A18102_EDM180C' })
  })

  // El código que se guarda no debe arrastrar los espacios del asunto: es el que después se compara
  // y se enseña, y `MT_ 18A19042 _EDM180C` y `MT_18A19042_EDM180C` tienen que ser el mismo dato.
  it('el código normalizado es idéntico venga con espacios o sin ellos', () => {
    const conEspacios = extractServiceCode('X MT_ 18A19042 _EDM180C_260305')
    const sinEspacios = extractServiceCode('X MT_18A19042_EDM180C_260305')
    expect(conEspacios).toEqual(sinEspacios)
    expect(conEspacios).toEqual({ serial: '18A19042', codigo: 'MT_18A19042_EDM180C_260305' })
  })

  // Lo que NO se puede recuperar y debe seguir dando null: sin segmento de modelo no hay código.
  it('sigue devolviendo null cuando falta el modelo, aunque haya prefijo y serial', () => {
    expect(extractServiceCode('AGQ Colombia S.A.S. Monitor de partículas CG_18A1204')).toBeNull()
    expect(extractServiceCode('Ambienciq Ingenieros S.A.S. Analizador de O3 MT_ NW6')).toBeNull()
  })

  it('null si no hay código', () => {
    expect(extractServiceCode('Servicio Técnico sin código')).toBeNull()
    expect(extractServiceCode(null)).toBeNull()
  })
})
