import { describe, it, expect, afterEach } from 'vitest'
import { estadoGarantia, sugerenciaPorGarantia } from './garantia'
import { TRANSITIONS } from './transitions'

/**
 * F1B-18 · la marca «En garantía» / «Garantía sin dato» (RQ-TC-58). El día de creación se mide en `ZONA_NEGOCIO`
 * (Bogotá) y el fin de garantía es una fecha de calendario `YYYY-MM-DD`: se comparan como cadenas.
 */
const G1 = '2026-03-16T01:00:00Z' // 15/03 20:00 en Bogotá
const G2 = '2026-03-16T05:30:00Z' // 16/03 00:30 en Bogotá

describe('estadoGarantia', () => {
  it('G1 · 01:00Z es todavía el 15/03 en Bogotá: con fin 15/03 está en garantía', () => {
    expect(estadoGarantia(G1, '2026-03-15')).toBe('en_garantia')
  })
  it('G2 · 05:30Z ya es el 16/03 en Bogotá: con fin 15/03 está vencida', () => {
    expect(estadoGarantia(G2, '2026-03-15')).toBe('vencida')
  })
  it('G3 · el mismo día del fin cuenta como en garantía (<=, no <)', () => {
    expect(estadoGarantia('2026-03-15T15:00:00Z', '2026-03-15')).toBe('en_garantia')
  })
  it('G4 · el fin anterior al día de creación es vencida', () => {
    expect(estadoGarantia('2026-03-15T15:00:00Z', '2026-03-14')).toBe('vencida')
  })
  it.each([null, undefined, '', '  ', '2026-02-30'])('G5 · fin %j → sin_dato', (fin) => {
    expect(estadoGarantia(G1, fin)).toBe('sin_dato')
  })
  it('G6 · un ISO con hora no es fecha de calendario: sin_dato', () => {
    expect(estadoGarantia(G1, '2026-03-15T00:00:00.000Z')).toBe('sin_dato')
  })
  it('G7 · un Date equivalente da lo mismo que la cadena', () => {
    expect(estadoGarantia(new Date(G1), '2026-03-15')).toBe('en_garantia')
    expect(estadoGarantia(new Date(G2), '2026-03-15')).toBe('vencida')
  })
  it.each([null, undefined, '', 'no es fecha', '2026-03-15T10:00:00'])('G8 · creación ilegible o sin desplazamiento (%j) → null', (creado) => {
    expect(estadoGarantia(creado, '2026-03-15')).toBeNull()
  })
  it('G8 · con creación ilegible gana null aunque el fin falte', () => {
    expect(estadoGarantia(null, null)).toBeNull()
  })
})

describe('estadoGarantia · la frontera no depende de la zona del proceso (RQ-TC-58)', () => {
  const tzInicial = process.env.TZ
  afterEach(() => { if (tzInicial === undefined) delete process.env.TZ; else process.env.TZ = tzInicial })

  it.each(['America/Bogota', 'UTC'])('con TZ=%s los dos instantes frontera dan lo mismo', (tz) => {
    process.env.TZ = tz
    expect(estadoGarantia(G1, '2026-03-15')).toBe('en_garantia')
    expect(estadoGarantia(G2, '2026-03-15')).toBe('vencida')
  })
})

describe('sugerenciaPorGarantia', () => {
  it('G9 · Notificado con en_garantia sugiere reporte_por_garantia', () => {
    expect(sugerenciaPorGarantia('Notificado', 'en_garantia')).toBe('reporte_por_garantia')
  })
  it.each([['En Proceso', 'en_garantia'], ['Notificado', 'sin_dato'], ['Notificado', 'vencida'], ['Notificado', null], ['Notificado', undefined]] as const)(
    'G9 · %s con %s no sugiere nada', (estado, marca) => {
      expect(sugerenciaPorGarantia(estado, marca)).toBeNull()
    })
  it('G9 · la transición sugerida existe y sale de Notificado', () => {
    const t = TRANSITIONS.find((x) => x.id === 'reporte_por_garantia')
    expect(t?.from).toContain('Notificado')
  })
})
