import { describe, it, expect } from 'vitest'
import { ORIGENES_TOP5, MOTIVO_POR_ORIGEN, esAjusteManual, baseDeTop5, baseAlNacer, cambioPorTop5, type TrazaDePrioridad } from './prioridadPropagada'
import { prioridadAlNacer } from './contratos'

/**
 * propagar-top5-lista-remision-creada (F1B-07, L2a) · el cálculo PURO de la propagación. «La calculada» es
 * `prioridadAlNacer` (`contratos.ts`): no hay una segunda fórmula. Las filas van del más antiguo al más reciente.
 */
const f = (de: string | null, origen: string | null): TrazaDePrioridad => ({ de, origen })
const base = { contratoVigente: false }

describe('esAjusteManual · todo lo que no esté en la lista de orígenes del Top 5 (falla cerrado)', () => {
  it.each<unknown>([null, undefined, '', 'otro', 'TOP5', 7, {}])('%j es manual', (o) => expect(esAjusteManual(o)).toBe(true))
  it.each([...ORIGENES_TOP5])('%s no es manual', (o) => expect(esAjusteManual(o)).toBe(false))
  it('cada origen del Top 5 tiene su motivo, no vacío (la base rechaza el motivo vacío)', () => {
    for (const o of ORIGENES_TOP5) expect(MOTIVO_POR_ORIGEN[o].trim().length, o).toBeGreaterThan(0)
  })
})

describe('baseDeTop5 · el `de` de la primera fila Top 5 posterior a la última reversión', () => {
  it('sin filas, o sólo manuales, no hay base', () => {
    expect(baseDeTop5([])).toBeNull()
    expect(baseDeTop5([f('Low', null), f('Low', 'otro')])).toBeNull()
  })
  it('la primera fila Top 5 manda, también la de nacimiento; las manuales intercaladas no cuentan', () => {
    expect(baseDeTop5([f('Low', 'top5'), f('High', 'top5')])).toEqual({ de: 'Low' })
    expect(baseDeTop5([f('Low', null), f('Medium', 'top5_al_nacer')])).toEqual({ de: 'Medium' })
  })
  it('una base puede ser «sin prioridad»', () => {
    expect(baseDeTop5([f(null, 'top5')])).toEqual({ de: null })
  })
  it('corta en la última reversión: lo anterior no cuenta', () => {
    expect(baseDeTop5([f('Low', 'top5'), f('High', 'top5_revertido'), f('Medium', 'top5')])).toEqual({ de: 'Medium' })
    expect(baseDeTop5([f('Low', 'top5'), f('High', 'top5_revertido')])).toBeNull()
  })
})

describe('cambioPorTop5 · manual, base, fórmula, igual', () => {
  it('marcar: toma la del Top 5 y guarda lo que había', () => {
    expect(cambioPorTop5({ actual: 'Low', filas: [], ...base, top5: 'High' })).toEqual({ de: 'Low', a: 'High', origen: 'top5' })
  })
  it('cambiar la prioridad de un Top 5: la base sigue siendo la primera', () => {
    expect(cambioPorTop5({ actual: 'High', filas: [f('Low', 'top5')], ...base, top5: 'Medium' })).toEqual({ de: 'High', a: 'Medium', origen: 'top5' })
  })
  it('sin contrato, un Top 5 más bajo baja el ticket (S-5)', () => {
    expect(cambioPorTop5({ actual: 'High', filas: [], ...base, top5: 'Medium' })).toEqual({ de: 'High', a: 'Medium', origen: 'top5' })
  })
  it('desmarcar: vuelve a la base', () => {
    expect(cambioPorTop5({ actual: 'High', filas: [f('Low', 'top5')], ...base, top5: null })).toEqual({ de: 'High', a: 'Low', origen: 'top5_revertido' })
  })
  it('con contrato vigente y un Top 5 Medium, el ticket queda High (la fórmula es prioridadAlNacer)', () => {
    const r = cambioPorTop5({ actual: 'Low', filas: [], contratoVigente: true, top5: 'Medium' })
    expect(r).toEqual({ de: 'Low', a: 'High', origen: 'top5' })
    expect(r!.a).toBe(prioridadAlNacer('Low', true, 'Medium'))
  })
  it('desmarcar con contrato vigente: «la calculada» sigue siendo High, así que un ticket High no cambia', () => {
    expect(cambioPorTop5({ actual: 'High', filas: [f('Low', 'top5')], contratoVigente: true, top5: null })).toBeNull()
  })
  it('un ajuste manual, antes o después de propagar, exime al ticket', () => {
    expect(cambioPorTop5({ actual: 'Low', filas: [f('Low', null)], ...base, top5: 'High' })).toBeNull()
    expect(cambioPorTop5({ actual: 'High', filas: [f('Low', 'top5'), f('High', null)], ...base, top5: null })).toBeNull()
  })
  it('un origen desconocido exime (falla cerrado)', () => {
    expect(cambioPorTop5({ actual: 'Low', filas: [f('Low', 'otro')], ...base, top5: 'High' })).toBeNull()
  })
  it('desmarcar sin base no toca el ticket (S-10)', () => {
    expect(cambioPorTop5({ actual: 'High', filas: [], ...base, top5: null })).toBeNull()
  })
  it('igual a la actual: nada que hacer', () => {
    expect(cambioPorTop5({ actual: 'High', filas: [], ...base, top5: 'High' })).toBeNull()
  })
  it('revertir a «sin prioridad»: a es null', () => {
    expect(cambioPorTop5({ actual: 'High', filas: [f(null, 'top5')], ...base, top5: null })).toEqual({ de: 'High', a: null, origen: 'top5_revertido' })
  })
  it('ciclo marcar, desmarcar, transición a Medium, marcar, desmarcar: vuelve a Medium, no a Low (S-4)', () => {
    const filas = [f('Low', 'top5'), f('High', 'top5_revertido'), f('Medium', 'top5')]
    expect(cambioPorTop5({ actual: 'High', filas, ...base, top5: null })).toEqual({ de: 'High', a: 'Medium', origen: 'top5_revertido' })
  })
})

describe('baseAlNacer · la prioridad PEDIDA sin contrato ni Top 5 (D-1 del orquestador, L2b)', () => {
  it.each<[unknown, string | null]>([['Low', 'Low'], ['Medium', 'Medium'], ['High', 'High'], [undefined, null], [null, null], ['Alta', 'Alta'], ['Urgent', 'Urgent']])('pedida %j → %j', (pedida, esperada) => {
    expect(baseAlNacer(pedida)).toBe(esperada)
  })
  it('es la misma fórmula del alta con contrato falso y sin Top 5: no hay una segunda implementación', () => {
    for (const p of ['Low', 'Medium', 'High', 'Urgent', 'Alta', undefined, 7]) expect(baseAlNacer(p)).toBe(prioridadAlNacer(p, false, null))
  })
})
