import { describe, it, expect } from 'vitest'
import { LOTE_OV, fechaCalendario, estadoContrato, motivoVencido, prioridadAlNacer, hoyEnZona, trimestresDelContrato, trimestreEn } from '@ambientalia/shared'

/**
 * Contrato por lote (registro-contrato, lote 1; `tickets-core` RQ-TC-21, RQ-TC-22). Se importa desde
 * `@ambientalia/shared` a propósito: así la prueba comprueba también el export de `index.ts`.
 */
describe('fechaCalendario · sólo un día real en forma YYYY-MM-DD', () => {
  it.each(['2026-12-31', '2028-02-29', '  2026-10-01  '])('%s → el día, recortado', (v) => {
    expect(fechaCalendario(v)).toBe(v.trim())
  })
  it.each<unknown>(['2026-02-30', '2027-02-29', '31/12/2026', '', '   ', null, undefined, 20261231, '2026-12-31T00:00:00Z'])(
    '%s → null', (v) => {
      expect(fechaCalendario(v)).toBeNull()
    })
})

describe('LOTE_OV · la OV madre, nunca una subOV', () => {
  it.each(['OV-2026-170', 'OV-2026-1700'])('%s es un lote', (v) => expect(LOTE_OV.test(v)).toBe(true))
  it.each(['OV-2026-170-01', 'OVI-2026-170', 'OV-2026-17', 'OV-2026-17000', "OV-2026-170'; DROP TABLE contratos"])(
    '%s no es un lote', (v) => expect(LOTE_OV.test(v)).toBe(false))
})

describe('estadoContrato · las dos fechas incluidas (S-4, S-5)', () => {
  const c = { fechaInicio: '2026-10-01', fechaFin: '2026-12-31' }
  it.each([
    ['2026-09-30', 'no_iniciado'], // la víspera del inicio
    ['2026-10-01', 'vigente'], // inicio = hoy
    ['2026-11-15', 'vigente'],
    ['2026-12-31', 'vigente'], // fin = hoy
    ['2027-01-01', 'vencido'], // fin = ayer
  ])('hoy %s → %s', (hoy, estado) => expect(estadoContrato(c, hoy)).toBe(estado))
  it('un contrato de un solo día está vigente ese día y sólo ese', () => {
    const unDia = { fechaInicio: '2026-10-01', fechaFin: '2026-10-01' }
    expect([estadoContrato(unDia, '2026-09-30'), estadoContrato(unDia, '2026-10-01'), estadoContrato(unDia, '2026-10-02')])
      .toEqual(['no_iniciado', 'vigente', 'vencido'])
  })
})

describe('motivoVencido · sólo una subOV de un lote con contrato vencido (RQ-TC-25)', () => {
  const contrato = { id: 7, lote: 'OV-2026-170', fechaInicio: '2026-01-01', fechaFin: '2026-06-30' }
  it('subOV del lote y contrato vencido → texto que nombra lote, contrato y fin', () => {
    const m = motivoVencido('OV-2026-170-01', contrato, '2026-07-01')
    expect(m).toMatch(/OV-2026-170-01/)
    expect(m).toMatch(/lote OV-2026-170/)
    expect(m).toMatch(/contrato nº 7/)
    expect(m).toMatch(/2026-06-30/)
  })
  it.each<[string, string, typeof contrato | null]>([
    ['OV-2026-170', '2026-07-01', contrato], // la OV madre (ordinaria) no se bloquea
    ['OVI-2026-170', '2026-07-01', contrato],
    ['OV-2026-170-X9', '2026-07-01', contrato], // cuarentena: su guarda es otra
    ['OV-2026-170-01', '2026-06-30', contrato], // fin = hoy: sigue vigente
    ['OV-2026-170-01', '2025-12-31', contrato], // aún no iniciado: no está vencido
    ['OV-2026-170-01', '2026-07-01', null], // sin contrato
  ])('%s el %s → null', (numero, hoy, c) => expect(motivoVencido(numero, c, hoy)).toBeNull())
  it('un contrato de OTRO lote no bloquea la subOV', () => {
    expect(motivoVencido('OV-2026-171-01', contrato, '2026-07-01')).toBeNull()
  })
})

describe('hoyEnZona · el día en Bogotá, nunca el del proceso (S-11)', () => {
  it('las 23:30 de Bogotá del 31-dic son las 04:30Z del 1-ene: hoy es 31-dic, y el contrato que acaba ese día sigue vigente', () => {
    const hoy = hoyEnZona(new Date('2027-01-01T04:30:00Z'))
    expect(hoy).toBe('2026-12-31')
    expect(estadoContrato({ fechaInicio: '2026-01-01', fechaFin: '2026-12-31' }, hoy)).toBe('vigente')
  })
  it('a las 00:00 de Bogotá del 1-ene (05:00Z) ya es 1-ene, y el mismo contrato está vencido', () => {
    const hoy = hoyEnZona(new Date('2027-01-01T05:00:00Z'))
    expect(hoy).toBe('2027-01-01')
    expect(estadoContrato({ fechaInicio: '2026-01-01', fechaFin: '2026-12-31' }, hoy)).toBe('vencido')
  })
})

describe('prioridadAlNacer · High con contrato vigente; si no, exactamente lo de antes (ticketService.ts:106 en 9288779)', () => {
  it.each<[unknown, string]>([['Low', 'High'], [undefined, 'High'], ['', 'High'], ['High', 'High']])(
    'con contrato vigente, pedida %j → %s', (pedida, esperada) => expect(prioridadAlNacer(pedida, true)).toBe(esperada))
  it.each<[unknown, string | null]>([['Low', 'Low'], ['Medium', 'Medium'], [undefined, null], ['', null], [null, null]])(
    'sin contrato vigente, pedida %j → %j', (pedida, esperada) => expect(prioridadAlNacer(pedida, false)).toBe(esperada))
})

describe('trimestresDelContrato · desde el inicio, con recorte a fin de mes; el último acaba en el fin (S-12)', () => {
  it('un año desde el 1-oct: cuatro trimestres naturales', () => {
    expect(trimestresDelContrato('2026-10-01', '2027-09-30')).toEqual([
      { k: 1, inicio: '2026-10-01', fin: '2026-12-31' },
      { k: 2, inicio: '2027-01-01', fin: '2027-03-31' },
      { k: 3, inicio: '2027-04-01', fin: '2027-06-30' },
      { k: 4, inicio: '2027-07-01', fin: '2027-09-30' },
    ])
  })
  it('fin de mes: desde el 31-ene, 30-abr → 31-jul → 31-oct, calculado SIEMPRE desde el inicio (encadenar daría 30-jul)', () => {
    expect(trimestresDelContrato('2026-01-31', '2026-12-31').map((t) => [t.inicio, t.fin])).toEqual([
      ['2026-01-31', '2026-04-29'], ['2026-04-30', '2026-07-30'], ['2026-07-31', '2026-10-30'], ['2026-10-31', '2026-12-31'],
    ])
  })
  it('año bisiesto: desde el 30-nov, el trimestre 2 empieza el 29-feb en 2028 y el 28-feb en 2027', () => {
    expect(trimestresDelContrato('2027-11-30', '2028-11-29')[1]).toEqual({ k: 2, inicio: '2028-02-29', fin: '2028-05-29' })
    expect(trimestresDelContrato('2026-11-30', '2027-11-29')[1]).toEqual({ k: 2, inicio: '2027-02-28', fin: '2027-05-29' })
  })
  it('año bisiesto: desde el 29-feb, el trimestre 5 empieza el 28-feb del año siguiente', () => {
    expect(trimestresDelContrato('2028-02-29', '2029-06-30')[4]).toEqual({ k: 5, inicio: '2029-02-28', fin: '2029-05-28' })
  })
  it('el último trimestre se recorta en el fin del contrato', () => {
    expect(trimestresDelContrato('2026-10-01', '2026-11-15')).toEqual([{ k: 1, inicio: '2026-10-01', fin: '2026-11-15' }])
  })
})

describe('trimestreEn · el trimestre en curso, o null fuera de la vigencia', () => {
  const c = { fechaInicio: '2026-10-01', fechaFin: '2027-09-30' }
  it.each<[string, number | null]>([
    ['2026-09-30', null], ['2026-10-01', 1], // inicio = hoy
    ['2026-12-31', 1], ['2027-01-01', 2], // cambio de trimestre
    ['2027-09-30', 4], ['2027-10-01', null], // fin = hoy, fin = ayer
  ])('hoy %s → %j', (hoy, k) => expect(trimestreEn(c, hoy)).toBe(k))
})
