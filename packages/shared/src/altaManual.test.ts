import { describe, it, expect } from 'vitest'
import { PREFIJO_PROVISIONAL, esIdProvisional, serialesCoinciden } from './altaManual'

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
