import { describe, it, expect } from 'vitest'
import {
  PRIORIDADES_ASIGNABLES, esPrioridadAsignable, prioridadMasAlta, prioridadTop5, prioridadClienteDelCuerpo,
} from './prioridad'
import { TRANSITIONS } from './transitions'

describe('PRIORIDADES_ASIGNABLES · la lista blanca es la de transitions.ts:84 (RQ-TC-24, D-2)', () => {
  it('es literalmente High, Medium, Low', () => {
    expect([...PRIORIDADES_ASIGNABLES]).toEqual(['High', 'Medium', 'Low'])
  })
  it('es igual a las opciones del campo target priority de cada transición que lo declara (dos copias vigiladas por prueba)', () => {
    const conCampo = TRANSITIONS.filter((t) => t.fields.some((f) => f.target === 'priority'))
    expect(conCampo.length).toBeGreaterThan(0)
    for (const t of conCampo) {
      const campo = t.fields.find((f) => f.target === 'priority')!
      expect(campo.options, t.id).toEqual([...PRIORIDADES_ASIGNABLES])
    }
  })
})

describe('esPrioridadAsignable · igualdad exacta, sin plegar mayúsculas ni idioma (TC24-7)', () => {
  it.each(['High', 'Medium', 'Low'])('%s es asignable', (v) => expect(esPrioridadAsignable(v)).toBe(true))
  it.each<unknown>(['high', 'Alta', 'Urgent', '', ' High', 7, null, undefined, {}])('%j no lo es', (v) => expect(esPrioridadAsignable(v)).toBe(false))
})

describe('prioridadMasAlta · manda la más alta; desconocida pierde; empate gana a (S-3)', () => {
  it.each<[string | null, string | null, string | null]>([
    ['High', 'Medium', 'High'], ['Medium', 'High', 'High'],
    ['Low', 'Medium', 'Medium'], ['Medium', 'Low', 'Medium'],
    ['High', 'Low', 'High'], ['Low', 'High', 'High'],
    ['Urgent', 'High', 'Urgent'], ['High', 'Urgent', 'Urgent'],
    ['High', null, 'High'], [null, 'Low', 'Low'],
    ['Alta', 'Low', 'Low'], ['Low', 'Alta', 'Low'],
    [null, null, null],
  ])('(%j, %j) → %j', (a, b, esperada) => expect(prioridadMasAlta(a, b)).toBe(esperada))
  it('empate: devuelve a (dos desconocidas distintas, la primera)', () => {
    expect(prioridadMasAlta('Alta', 'Baja')).toBe('Alta')
  })
})

describe('prioridadTop5 · lee la fila a prueba de fallos (D-6): lo que no es asignable es null', () => {
  it('sin fila o con top5 falso → null', () => {
    expect(prioridadTop5(null)).toBeNull()
    expect(prioridadTop5({ top5: false, prioridad: 'High' })).toBeNull()
  })
  it('valor sucio en la base → null', () => {
    expect(prioridadTop5({ top5: true, prioridad: 'Alta' })).toBeNull()
    expect(prioridadTop5({ top5: true, prioridad: null })).toBeNull()
  })
  it('Top 5 con valor de la lista → ese valor', () => {
    expect(prioridadTop5({ top5: true, prioridad: 'Low' })).toBe('Low')
  })
})

describe('prioridadClienteDelCuerpo · valida el PUT (TC27-5, TC27-6, S-9)', () => {
  it('top5 no booleano → error', () => {
    for (const malo of ['true', 1, null, undefined]) {
      const r = prioridadClienteDelCuerpo({ top5: malo, prioridad: 'High' })
      expect(r.ok, String(malo)).toBe(false)
    }
  })
  it('top5 verdadero sin prioridad → error', () => {
    expect(prioridadClienteDelCuerpo({ top5: true }).ok).toBe(false)
  })
  it('top5 verdadero con Urgent o Alta → error', () => {
    for (const mala of ['Urgent', 'Alta', 'high', '']) expect(prioridadClienteDelCuerpo({ top5: true, prioridad: mala }).ok, mala).toBe(false)
  })
  it('top5 verdadero con valor de la lista → ok', () => {
    expect(prioridadClienteDelCuerpo({ top5: true, prioridad: 'Medium' })).toEqual({ ok: true, top5: true, prioridad: 'Medium' })
  })
  it('top5 falso → prioridad null aunque venga valor (S-9)', () => {
    expect(prioridadClienteDelCuerpo({ top5: false, prioridad: 'High' })).toEqual({ ok: true, top5: false, prioridad: null })
    expect(prioridadClienteDelCuerpo({ top5: false })).toEqual({ ok: true, top5: false, prioridad: null })
  })
  it('cuerpo que no es objeto → error', () => {
    for (const malo of [null, undefined, 'x', 7, []]) expect(prioridadClienteDelCuerpo(malo).ok, JSON.stringify(malo)).toBe(false)
  })
})
