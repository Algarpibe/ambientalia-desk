import { describe, it, expect } from 'vitest'
import {
  COMPUESTOS, compuestoCanonico, compuestoDelCuerpo, patronVigente, tienePatronVigente,
  CLAVE_CERTIFICADO_FABRICA, CLAVE_MOTIVO_SIN_VERIFICACION, ETIQUETA_CLAVE_PROPIA, type GasPatronLeido,
} from './gasPatron'
import { hoyEnZona } from './contratos'

/**
 * Parte 1 del dominio de `gases-patron` (F1A-03, lote 1): lista cerrada, grafía canónica, vigencia y
 * «un compuesto tiene patrón vigente». Pura: el día de hoy entra como parámetro y nunca se lee el reloj.
 */
const HOY = '2026-10-01'
const gas = (compuesto: string | null, over: Partial<GasPatronLeido> = {}): GasPatronLeido =>
  ({ compuesto, disponible: true, vence: '2026-12-31', ...over })

describe('RQ-GP-01 · lista cerrada y grafía canónica', () => {
  it('GP01-3 · la lista son exactamente siete', () => {
    expect([...COMPUESTOS]).toEqual(['SO₂', 'NOₓ', 'CO', 'O₃', 'H₂S', 'TRS', 'NH₃'])
  })
  it.each<[string, string]>([
    ['SO2', 'SO₂'], [' so₂ ', 'SO₂'], ['SO₂', 'SO₂'], ['NOx', 'NOₓ'], ['O3', 'O₃'], ['H2S', 'H₂S'], ['NH3', 'NH₃'],
    ['co', 'CO'], ['trs', 'TRS'], ['so 2', 'SO₂'],
  ])('GP01-1 · %j → %s', (entrada, canonico) => {
    expect(compuestoCanonico(entrada)).toBe(canonico)
  })
  it('GP01-1 · «SO2», «SO₂» y « so2 » dan el mismo canónico', () => {
    const tres = ['SO2', 'SO₂', ' so2 '].map(compuestoCanonico)
    expect(new Set(tres)).toEqual(new Set(['SO₂']))
  })
  it.each<unknown>(['metano', 'SO3', '', '   ', null, undefined, 2, {}])('GP01-2 · %j no se reconoce', (v) => {
    expect(compuestoCanonico(v)).toBeNull()
  })
})

describe('compuestoDelCuerpo · lo que llega por HTTP al PATCH', () => {
  it.each<unknown>(['', '   ', null])('%j → nulo, sin error', (v) => {
    expect(compuestoDelCuerpo(v)).toEqual({ ok: true, valor: null })
  })
  it('una grafía equivalente se guarda canónica', () => {
    expect(compuestoDelCuerpo('so2')).toEqual({ ok: true, valor: 'SO₂' })
  })
  it.each<unknown>(['xyz', 'metano', 7])('%j fuera de lista → error con el valor', (v) => {
    const r = compuestoDelCuerpo(v)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('compuesto')
  })
})

describe('RQ-GP-03 · patronVigente', () => {
  it('GP03-1 · vence hoy, cuenta', () => {
    expect(patronVigente(gas('SO₂', { vence: HOY }), HOY)).toBe(true)
  })
  it('GP03-2 · venció ayer, no cuenta', () => {
    expect(patronVigente(gas('SO₂', { vence: '2026-09-30' }), HOY)).toBe(false)
  })
  it('GP03-3 · no disponible, no cuenta aunque venza en el futuro', () => {
    expect(patronVigente(gas('SO₂', { disponible: false }), HOY)).toBe(false)
  })
  it('vence o disponible nulos, no cuentan', () => {
    expect(patronVigente(gas('SO₂', { vence: null }), HOY)).toBe(false)
    expect(patronVigente(gas('SO₂', { disponible: null }), HOY)).toBe(false)
  })
  it('GP03-4 · el día es el de Bogotá, no el de UTC', () => {
    const hoy = hoyEnZona(new Date('2026-10-02T03:00:00Z'))
    expect(hoy).toBe('2026-10-01')
    expect(patronVigente(gas('SO₂', { vence: '2026-10-01' }), hoy)).toBe(true)
    expect(patronVigente(gas('SO₂', { vence: '2026-10-01' }), hoyEnZona(new Date('2026-10-02T05:00:00Z')))).toBe(false)
  })
})

describe('tienePatronVigente · un compuesto del equipo frente a las filas de la tabla', () => {
  it('GP01-4 · el equipo en crudo «SO₂» frente a la fila «SO2» cuenta', () => {
    expect(tienePatronVigente('SO₂', [gas('SO2')], HOY)).toBe(true)
    expect(tienePatronVigente('SO2', [gas('SO₂')], HOY)).toBe(true)
  })
  it('GP03-5 · varios cilindros del mismo compuesto, basta uno vigente', () => {
    const gases = [gas('CO', { vence: '2026-01-01' }), gas('CO', { vence: '2027-01-01' })]
    expect(tienePatronVigente('CO', gases, HOY)).toBe(true)
  })
  it('GP03-6 · el patrón de otro compuesto no cuenta', () => {
    expect(tienePatronVigente('CO', [gas('SO₂')], HOY)).toBe(false)
  })
  it('GP04-1 · tabla vacía → false, sin error', () => {
    expect(tienePatronVigente('SO₂', [], HOY)).toBe(false)
  })
  it('GP04-2 · todas vencidas o no disponibles → false', () => {
    const gases = [gas('SO₂', { vence: '2026-09-30' }), gas('SO₂', { disponible: false })]
    expect(tienePatronVigente('SO₂', gases, HOY)).toBe(false)
  })
  it('GP05-2 · una fila «XYZ» vigente no cuenta para ninguno de los siete', () => {
    for (const c of COMPUESTOS) expect(tienePatronVigente(c, [gas('XYZ')], HOY)).toBe(false)
  })
  it('un equipo sin compuesto o con uno no reconocido no tiene patrón', () => {
    expect(tienePatronVigente(null, [gas('SO₂')], HOY)).toBe(false)
    expect(tienePatronVigente('XYZ', [gas('XYZ')], HOY)).toBe(false)
  })
})

describe('claves propias del campo y del motivo', () => {
  it('son las dos claves del catálogo y del servidor', () => {
    expect(CLAVE_CERTIFICADO_FABRICA).toBe('certificado_fabrica')
    expect(CLAVE_MOTIVO_SIN_VERIFICACION).toBe('motivo_sin_verificacion')
  })
  it('sus etiquetas legibles', () => {
    expect(ETIQUETA_CLAVE_PROPIA).toEqual({
      certificado_fabrica: 'Número del certificado de fábrica',
      motivo_sin_verificacion: 'Liberado sin Verificación',
    })
  })
})
