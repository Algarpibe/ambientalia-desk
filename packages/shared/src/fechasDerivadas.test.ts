import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { ZONA_NEGOCIO, FUENTE_DE_FECHA, diaEnZona, fechasDerivadas, fuentesQueNecesita, valoresEfectivos } from './fechasDerivadas'
import type { Transition } from './transitions'

/**
 * F1A-07 · IV-2 — la fórmula única de las tres fechas derivadas.
 *
 * `design.md` §4.1: `diaEnZona` tiene CINCO ramas (A-5); `fechasDerivadas` deriva de las tres fuentes;
 * `valoresEfectivos` recalcula siempre que hay fuente (D-1), filtra las tres etiquetas del `values`
 * crudo (P-2) y valida lo tecleado sin fuente (D-3).
 */

const campo = (label: string): Transition['fields'][number] =>
  ({ key: label, label, kind: 'date', required: false, target: 'customField' })

describe('diaEnZona · las cinco ramas de A-5', () => {
  it('1 · una YYYY-MM-DD real pasa tal cual, sin desplazarse de día', () => {
    expect(diaEnZona('2026-09-09')).toBe('2026-09-09')
  })

  it('2 · una YYYY-MM-DD irreal (día que no existe) da null', () => {
    expect(diaEnZona('2026-02-30')).toBeNull()
  })

  it('3 · un instante con Z se reduce al día en Bogotá, no al día UTC', () => {
    expect(diaEnZona('2026-09-10T00:30:00Z')).toBe('2026-09-09')
  })

  it('3b · un instante como Date hace lo mismo que como string', () => {
    expect(diaEnZona(new Date('2026-09-10T00:30:00Z'))).toBe('2026-09-09')
  })

  it('4 · una fecha-hora SIN desplazamiento da null (la trampa que A-5 evita)', () => {
    expect(diaEnZona('2026-09-10T00:30:00')).toBeNull()
  })

  it('5 · un valor ilegible da null', () => {
    expect(diaEnZona('10/09/2026')).toBeNull()
    expect(diaEnZona(12345)).toBeNull()
    expect(diaEnZona(null)).toBeNull()
  })
})

describe('fechasDerivadas · las tres fuentes', () => {
  it('deriva las tres cuando las tres fuentes están disponibles', () => {
    const r = fechasDerivadas({
      createdAt: '2026-09-10T00:30:00Z',
      remisiones: [{ tipo: 'entrada', fecha: '2026-08-01' }],
      escaladoARevisionAt: '2026-09-10T00:30:00Z',
    })
    expect(r).toEqual({
      'Fecha creación ticket': '2026-09-09',
      'Fecha Remisión Entrada': '2026-08-01',
      'Fecha Revisión Informe': '2026-09-09',
    })
  })

  it('«Fecha Remisión Entrada» es la PRIMERA de tipo «entrada» de la lista (la más reciente)', () => {
    const r = fechasDerivadas({
      remisiones: [
        { tipo: 'salida', fecha: '2026-09-05' },
        { tipo: 'entrada', fecha: '2026-09-01' },
        { tipo: 'entrada', fecha: '2026-08-01' },
      ],
    })
    expect(r['Fecha Remisión Entrada']).toBe('2026-09-01')
  })

  it('sin ninguna fuente, las tres dan null', () => {
    expect(fechasDerivadas({})).toEqual({
      'Fecha creación ticket': null, 'Fecha Remisión Entrada': null, 'Fecha Revisión Informe': null,
    })
  })
})

describe('fuentesQueNecesita', () => {
  it('recoge la fuente de cada etiqueta declarada por la transición', () => {
    const t = { fields: [campo('Fecha creación ticket'), campo('Fecha Remisión Entrada'), campo('Comentario')] }
    expect(fuentesQueNecesita(t)).toEqual(new Set(['createdAt', 'remisionEntrada']))
  })

  it('una transición sin ninguna de las tres etiquetas no pide nada (P-2, las 31 restantes)', () => {
    expect(fuentesQueNecesita({ fields: [campo('Prioridad')] })).toEqual(new Set())
  })
})

describe('valoresEfectivos', () => {
  const t = { fields: [campo('Fecha Remisión Entrada')] }

  it('D-1 · con fuente, la derivada GANA aunque el navegador mande otra cosa', () => {
    const { values, erroresFecha } = valoresEfectivos(t, { 'Fecha Remisión Entrada': '2026-01-01' }, {
      remisiones: [{ tipo: 'entrada', fecha: '2026-08-01' }],
    })
    expect(values['Fecha Remisión Entrada']).toBe('2026-08-01')
    expect(erroresFecha).toEqual([])
  })

  it('sin fuente, lo tecleado válido pasa', () => {
    const { values, erroresFecha } = valoresEfectivos(t, { 'Fecha Remisión Entrada': '2026-02-28' }, {})
    expect(values['Fecha Remisión Entrada']).toBe('2026-02-28')
    expect(erroresFecha).toEqual([])
  })

  it('D-3 · sin fuente, lo tecleado inválido da el mensaje exacto', () => {
    const { erroresFecha } = valoresEfectivos(t, { 'Fecha Remisión Entrada': '2026-02-30' }, {})
    expect(erroresFecha).toEqual(['Fecha inválida en el campo: Fecha Remisión Entrada'])
  })

  it('sin fuente ni valor tecleado, no se escribe nada y no hay error (la ausencia la contesta transitionExec)', () => {
    const { values, erroresFecha } = valoresEfectivos(t, {}, {})
    expect('Fecha Remisión Entrada' in values).toBe(false)
    expect(erroresFecha).toEqual([])
  })

  it('P-2 · las tres etiquetas se filtran de `recibidos` aunque la transición no las declare', () => {
    const sinFechas = { fields: [campo('Comentario')] }
    const { values } = valoresEfectivos(sinFechas, { 'Fecha Remisión Entrada': '2026-08-01', comment: 'ok' }, {})
    expect('Fecha Remisión Entrada' in values).toBe(false)
    expect(values.comment).toBe('ok')
  })

  it('el resto de `recibidos` se copia tal cual, sin tocar', () => {
    const { values } = valoresEfectivos(t, { comment: 'hola', prioridad: 'High' }, {})
    expect(values).toMatchObject({ comment: 'hola', prioridad: 'High' })
  })

  it('un `recibidos` que no es objeto plano se trata como vacío', () => {
    const { values, erroresFecha } = valoresEfectivos(t, 'no-objeto', {})
    expect(values).toEqual({})
    expect(erroresFecha).toEqual([])
  })
})

/**
 * DEMOSTRACIÓN DE ZONA (A.1.5, criterios 6-7) — las TRES condiciones del analista (obs. #846):
 * autocomprobación propia en cada bloque, `vi.stubEnv('TZ', …)` por bloque, y la fase roja se obtiene
 * por MUTACIÓN (A.5.5), no aquí: este fichero ya nace en verde.
 */
describe.each(['UTC', 'America/Bogota'])('zona · %s', (zona) => {
  beforeAll(() => { vi.stubEnv('TZ', zona) })
  afterAll(() => { vi.unstubAllEnvs() })

  it(`autocomprobación propia — new Date('2026-09-10').getDate() en ${zona}`, () => {
    const esperado = zona === 'America/Bogota' ? 9 : 10
    expect(new Date('2026-09-10').getDate()).toBe(esperado)
  })

  it(`el día de 2026-09-10T00:30:00Z en ZONA_NEGOCIO (${ZONA_NEGOCIO}) no depende de la zona del proceso`, () => {
    expect(diaEnZona('2026-09-10T00:30:00Z')).toBe('2026-09-09')
  })
})

it('el mapa FUENTE_DE_FECHA declara exactamente las tres etiquetas del diseño', () => {
  expect(Object.keys(FUENTE_DE_FECHA)).toEqual(['Fecha creación ticket', 'Fecha Remisión Entrada', 'Fecha Revisión Informe'])
})
