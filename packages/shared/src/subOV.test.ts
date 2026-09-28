import { describe, it, expect } from 'vitest'
import { clasificarOV, motivoCuarentena, erroresCuarentena, esCuarentena } from './subOV'

/**
 * Clasificador de subOV (asociacion-ov-ticket, lote 4; RQ-TC-18). Regla, tras `trim`:
 *   1. `^OV-(\d{4})-(\d{3,4})-(\d{2})$`  → subOV canónica, lote `OV-AAAA-NNN(N)`.
 *   2. `^OVI?-\d{4}-\d{3,4}$`            → ordinaria (OV u OVI simple).
 *   3. esa base SEGUIDA DE CUALQUIER OTRO sufijo → cuarentena (S-2). Una OVI nunca tiene subOV canónica, así
 *      que `OVI-…` con sufijo es cuarentena aunque el sufijo sea de dos dígitos (S-8).
 *   4. cualquier otro formato → ordinaria (no es asunto del clasificador).
 */
describe('clasificarOV · tabla de casos', () => {
  const subov: [string, string, string][] = [
    ['OV-2026-001-01', 'OV-2026-001', '01'],
    ['OV-2026-0001-12', 'OV-2026-0001', '12'],
    ['  OV-2026-001-01  ', 'OV-2026-001', '01'], // los espacios se recortan antes de casar
  ]
  it.each(subov)('%s → subOV del lote %s, sufijo %s', (numero, lote, sufijo) => {
    expect(clasificarOV(numero)).toEqual({ tipo: 'subov', lote, sufijo })
    expect(motivoCuarentena(numero)).toBeNull()
  })

  const ordinarias: unknown[] = [
    'OV-2026-001', 'OV-2026-0001', 'OVI-2026-001', '  OV-2026-001  ', // la base simple, con o sin espacios
    'SO-00123', 'OV-26-001', 'ov-2026-001-X9', '', '   ', null, undefined, 42, // otro formato o no-texto
  ]
  it.each(ordinarias)('%j → ordinaria', (numero) => {
    expect(clasificarOV(numero)).toEqual({ tipo: 'ordinaria' })
    expect(motivoCuarentena(numero)).toBeNull()
    expect(esCuarentena(numero)).toBe(false)
  })

  // Cada uno es la base `OVI?-AAAA-NNN(N)` seguida de un resto que NO es exactamente `-` + 2 dígitos sobre `OV-`.
  const cuarentena: [string, string][] = [
    ['OV-2026-001-X9', 'sufijo no numérico'],
    ['OVI-2026-001-01', 'OVI nunca tiene subOV canónica (S-8): aunque el sufijo sea de dos dígitos'],
    ['OVI-2026-001-X9', 'OVI con sufijo (S-8)'],
    ['OV-2026-001-1', 'un solo dígito: el canónico son exactamente dos'],
    ['OV-2026-001-001', 'tres dígitos: el canónico son exactamente dos'],
    ['OV-2026-001-01-02', 'doble sufijo'],
    ['OV-2026-001 -01', 'espacio dentro del número (el trim sólo recorta los bordes)'],
    ['OV-2026-001_01', 'separador distinto de guion'],
    ['OV-2026-001A', 'letra pegada a la base'],
    ['  OV-2026-001-X9  ', 'con espacios en los bordes, tras el trim sigue siendo no canónico'],
  ]
  it.each(cuarentena)('%s → cuarentena (%s)', (numero) => {
    const c = clasificarOV(numero)
    expect(c.tipo).toBe('cuarentena')
    expect(esCuarentena(numero)).toBe(true)
    expect(motivoCuarentena(numero)).toContain(numero.trim())
  })
})

describe('erroresCuarentena', () => {
  it('devuelve un motivo por cada número en cuarentena y se salta lo que no es texto o es válido', () => {
    const e = erroresCuarentena(['OV-2026-001', undefined, 'OV-2026-001-X9', null, 'OV-2026-001-01', 'OVI-2026-002-05'])
    expect(e).toHaveLength(2)
    expect(e[0]).toContain('OV-2026-001-X9')
    expect(e[1]).toContain('OVI-2026-002-05')
  })
  it('sin nada en cuarentena, lista vacía', () => {
    expect(erroresCuarentena([])).toEqual([])
    expect(erroresCuarentena([undefined, 'OV-2026-001'])).toEqual([])
  })
})
