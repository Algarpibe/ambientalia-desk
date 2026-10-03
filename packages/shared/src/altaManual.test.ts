import { describe, it, expect } from 'vitest'
import { PREFIJO_PROVISIONAL, esIdProvisional, serialesCoinciden, normalizarNit, nitCoincide, primerConflictoUnicidad, motivoAltaPendiente } from './altaManual'

describe('PREFIJO_PROVISIONAL / esIdProvisional (D4, RQ-TC-30)', () => {
  it('el prefijo es «prov-» y distingue un id provisional de uno de Books', () => {
    expect(PREFIJO_PROVISIONAL).toBe('prov-')
    expect(esIdProvisional('prov-8d1f')).toBe(true)
    expect(esIdProvisional('2345678000001234567')).toBe(false)
    expect(esIdProvisional('')).toBe(false)
    expect(esIdProvisional(null)).toBe(false)
  })
})

describe('serialesCoinciden (RQ-HV-16: recortados, el servidor decide)', () => {
  it('coinciden con espacios de más a los lados', () => {
    expect(serialesCoinciden('ABC123', 'ABC123')).toBe(true)
    expect(serialesCoinciden('  ABC123 ', 'ABC123\t')).toBe(true)
  })
  it('no coinciden si difieren en un carácter o en las mayúsculas', () => {
    expect(serialesCoinciden('ABC123', 'ABC124')).toBe(false)
    expect(serialesCoinciden('abc123', 'ABC123')).toBe(false)
  })
  it('dos vacíos no coinciden (la presencia es del escalón A, no una coincidencia)', () => {
    expect(serialesCoinciden('', '')).toBe(false)
    expect(serialesCoinciden('   ', '  ')).toBe(false)
    expect(serialesCoinciden(undefined, undefined)).toBe(false)
  })
})

describe('normalizarNit / nitCoincide (P-B, RQ-TC-30: sin puntos, espacios ni dígito de verificación)', () => {
  it('la base es lo anterior al primer guion, sólo dígitos', () => {
    expect(normalizarNit('900.123.456-7')).toBe('900123456')
    expect(normalizarNit('900 123 456')).toBe('900123456')
    expect(normalizarNit(' 900123456 ')).toBe('900123456')
    expect(normalizarNit('---')).toBe('')
    expect(normalizarNit('abc')).toBe('')
    expect(normalizarNit(null)).toBe('')
  })

  it('«900.123.456-7» ≡ «900123456» y «900 123 456» ≡ «900123456», en los dos sentidos del formato', () => {
    expect(nitCoincide('900123456', '900.123.456-7')).toBe(true)
    expect(nitCoincide('900 123 456', '900123456')).toBe(true)
    expect(nitCoincide('900.123.456-7', '900123456')).toBe(true)
  })

  it('DV pegado sin guion: «9001234567» casa con «900.123.456-7» y no con «900123456» ni con «900.123.456-3»', () => {
    expect(nitCoincide('9001234567', '900.123.456-7')).toBe(true)
    expect(nitCoincide('9001234567', '900123456')).toBe(false)
    expect(nitCoincide('9001234567', '900.123.456-3')).toBe(false)
  })

  it('un NIT distinto no casa', () => {
    expect(nitCoincide('800555666', '900.123.456-7')).toBe(false)
  })

  it('guarda del vacío, lado tecleado: «---» o «abc» nunca casan, ni con un NIT de Books vacío', () => {
    expect(nitCoincide('---', '---')).toBe(false)
    expect(nitCoincide('abc', 'abc')).toBe(false)
    expect(nitCoincide('---', '')).toBe(false)
    expect(nitCoincide('', '900123456')).toBe(false)
  })

  it('guarda del vacío, lado de Books: un NIT nulo, vacío o sin dígitos nunca casa', () => {
    expect(nitCoincide('900123456', null)).toBe(false)
    expect(nitCoincide('900123456', undefined)).toBe(false)
    expect(nitCoincide('900123456', '')).toBe(false)
    expect(nitCoincide('900123456', '---')).toBe(false)
    expect(nitCoincide('900123456', 'N/A')).toBe(false)
    // con el tecleado también sin dígitos: es donde la igualdad de dos vacíos se dispararía
    expect(nitCoincide('---', null)).toBe(false)
    expect(nitCoincide('abc', 'N/A')).toBe(false)
  })
})

describe('primerConflictoUnicidad (escalón D, P6: gana el NIT y la OV va la última)', () => {
  const candidatos = [{ id: 'c1', name: 'Uno' }]
  it('con los dos conflictos a la vez devuelve el del NIT', () => {
    expect(primerConflictoUnicidad({ nitEnBooks: candidatos, ovEnUso: { number: 9 } })).toEqual({ tipo: 'nit', candidatos })
  })
  it('sólo la OV → el de la OV; sólo el NIT → el del NIT; ninguno → null', () => {
    expect(primerConflictoUnicidad({ nitEnBooks: [], ovEnUso: { number: 9 } })).toEqual({ tipo: 'ov', ticket: { number: 9 } })
    expect(primerConflictoUnicidad({ nitEnBooks: candidatos, ovEnUso: null })).toEqual({ tipo: 'nit', candidatos })
    expect(primerConflictoUnicidad({ nitEnBooks: [], ovEnUso: null })).toBeNull()
  })
})

describe('motivoAltaPendiente (RQ-TS-32, escalón B de «Habilitar Servicio»)', () => {
  it('ninguno pendiente → null', () => {
    expect(motivoAltaPendiente({ clienteProvisional: false, equipoPendiente: false })).toBeNull()
  })
  it('sólo el cliente provisional nombra el cliente y no el equipo', () => {
    const m = motivoAltaPendiente({ clienteProvisional: true, equipoPendiente: false })!
    expect(m).toContain('cliente')
    expect(m).not.toContain('equipo')
  })
  it('sólo el equipo pendiente nombra el equipo y no el cliente', () => {
    const m = motivoAltaPendiente({ clienteProvisional: false, equipoPendiente: true })!
    expect(m).toContain('equipo')
    expect(m).not.toContain('cliente')
  })
  it('los dos a la vez se nombran juntos, en un solo mensaje', () => {
    const m = motivoAltaPendiente({ clienteProvisional: true, equipoPendiente: true })!
    expect(m).toContain('cliente')
    expect(m).toContain('equipo')
  })
})
