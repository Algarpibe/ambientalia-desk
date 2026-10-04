import { describe, it, expect } from 'vitest'
import { compararIndicadores, parDeIndicador, TOLERANCIA_DIAS, type ParComparacion } from './indicadoresComparacion'
import type { ColumnaIndicador, Indicador, Valor } from './indicadores'

// F1F-05, lote 5a (RQ-KP-16). Cifras calculadas a mano; la aplicación no emite veredicto ni bandera.
const SD: Valor<number | string> = { tipo: 'sin_dato', motivo: 'x' }
const v = (n: number | string): Valor<number | string> => ({ tipo: 'valor', valor: n })
const par = (columna: ColumnaIndicador, app: Valor<number | string>, zoho: unknown, o: Partial<ParComparacion> = {}): ParComparacion =>
  ({ ticketId: 't1', columna, app, variante: SD, zoho, hitos: [], reentrante: null, diasNoHabiles: null, ...o })
const col = (r: ReturnType<typeof compararIndicadores>, c: ColumnaIndicador) => r.porColumna.find((x) => x.columna === c)!
const cuenta = (c: { comparados: number; coincidentes: number; diferentes: number; sinComparar: number; porcentaje: number | null }) =>
  [c.comparados, c.coincidentes, c.diferentes, c.sinComparar, c.porcentaje]

describe('compararIndicadores (RQ-KP-16)', () => {
  it('la tolerancia de la letra es de un día', () => expect(TOLERANCIA_DIAS).toBe(1))

  it('C1 · cuatro pares del 50·53: (6,7) (6,8) (sin dato,3) (6,null) → 2 comparados, 1 coincidente, 1 diferente, 2 sin comparar, 50', () => {
    const r = compararIndicadores([
      par('50_53', v(6), 7, { ticketId: 'a' }), par('50_53', v(6), 8, { ticketId: 'b' }),
      par('50_53', SD, 3, { ticketId: 'c' }), par('50_53', v(6), null, { ticketId: 'd' }),
    ])
    expect(cuenta(col(r, '50_53'))).toEqual([2, 1, 1, 2, 50])
  })

  it('C2 · la tolerancia es de un día: (6,5) y (6,7) coinciden, (6,8) no; con 2 de diferencia hay diferencia', () => {
    const r = compararIndicadores([par('59', v(6), 5, { ticketId: 'a' }), par('59', v(6), 7, { ticketId: 'b' }), par('59', v(6), 8, { ticketId: 'c' })])
    expect(cuenta(col(r, '59'))).toEqual([3, 2, 1, 0, 66.7])
    expect(col(r, '59').diferencias.map((d) => [d.ticketId, d.delta])).toEqual([['c', 2]])
  })

  it('C2b · el cero y un tiempo igual coinciden; la diferencia absoluta no depende del signo', () => {
    const r = compararIndicadores([par('59', v(-3), -4, { ticketId: 'a' }), par('59', v(0), 0, { ticketId: 'b' }), par('59', v(-3), -5, { ticketId: 'c' })])
    expect(cuenta(col(r, '59'))).toEqual([3, 2, 1, 0, 66.7])
  })

  it('C3 · un par sin valor de Zoho (null, ausente, vacío, no numérico) va aparte: ni coincide ni difiere', () => {
    const r = compararIndicadores([
      par('59', v(4), 4, { ticketId: 'a' }), par('59', v(4), 9, { ticketId: 'b' }),
      par('59', v(4), null, { ticketId: 'c' }), par('59', v(4), undefined, { ticketId: 'd' }),
      par('59', v(4), '', { ticketId: 'e' }), par('59', v(4), 'abc', { ticketId: 'f' }),
    ])
    expect(cuenta(col(r, '59'))).toEqual([2, 1, 1, 4, 50])
  })

  it('C3b · un valor de Zoho numérico en texto cuenta como su número', () => {
    expect(cuenta(col(compararIndicadores([par('59', v(4), '5')]), '59'))).toEqual([1, 1, 0, 0, 100])
  })

  it('C4 · un «sin dato» en la aplicación nunca coincide, ni siquiera contra 0', () => {
    const r = compararIndicadores([par('50_53', SD, 0)])
    expect(cuenta(col(r, '50_53'))).toEqual([0, 0, 0, 1, null])
  })

  it('C5 · un «sin dato» en la variante va aparte aunque la letra sí se compare', () => {
    const r = compararIndicadores([{ ...par('47', v(3), 3), variante: SD }])
    expect(cuenta(col(r, '47'))).toEqual([1, 1, 0, 0, 100])
    expect(cuenta(col(r, '47').variante)).toEqual([0, 0, 0, 1, null])
  })

  it('C6 · textos del 54: (Cumple, cumple) coincide, (Cumple, No Cumple) difiere, (sin dato, Cumple) va aparte', () => {
    const r = compararIndicadores([par('54', v('Cumple'), 'cumple', { ticketId: 'a' }), par('54', v('Cumple'), 'No Cumple', { ticketId: 'b' }), par('54', SD, 'Cumple', { ticketId: 'c' })])
    expect(cuenta(col(r, '54'))).toEqual([2, 1, 1, 1, 50])
    expect(col(r, '54').diferencias[0]).toMatchObject({ app: 'Cumple', zoho: 'No Cumple', delta: null })
  })

  it('C6b · el recorte de espacios laterales no cambia el texto; los espacios interiores sí', () => {
    const r = compararIndicadores([par('55', v('Muy bueno'), ' muy bueno ', { ticketId: 'a' }), par('55', v('Muy bueno'), 'Muy  bueno', { ticketId: 'b' })])
    expect(cuenta(col(r, '55'))).toEqual([2, 1, 1, 0, 50])
  })

  it('C6c · en el 54 un valor de Zoho que no es Cumple/No cumple no es valor de Zoho; en el 55 el texto sí cuenta', () => {
    expect(cuenta(col(compararIndicadores([par('54', v('Cumple'), 'Pendiente')]), '54'))).toEqual([0, 0, 0, 1, null])
    expect(cuenta(col(compararIndicadores([par('55', v('Bueno'), 'Bueno ')]), '55'))).toEqual([1, 1, 0, 0, 100])
  })

  it('C6d · un número en una columna de texto (y al revés) es un par sin comparar', () => {
    expect(cuenta(col(compararIndicadores([par('54', v(3), 'Cumple')]), '54'))).toEqual([0, 0, 0, 1, null])
    expect(cuenta(col(compararIndicadores([par('59', v('x'), 3)]), '59'))).toEqual([0, 0, 0, 1, null])
  })

  it('C7 · letra contra Zoho y fórmula de Zoho contra Zoho: valor 6, variante 8, Zoho 8 → letra 1 diferente, variante 1 coincidente', () => {
    const r = compararIndicadores([{ ...par('50_53', v(6), 8), variante: v(8) }])
    expect(cuenta(col(r, '50_53'))).toEqual([1, 0, 1, 0, 0])
    expect(cuenta(col(r, '50_53').variante)).toEqual([1, 1, 0, 0, 100])
    expect(col(r, '50_53').diferencias.map((d) => d.contra)).toEqual(['valor'])
    expect(col(r, '50_53').variante.diferencias).toEqual([])
  })

  it('C7b · una diferencia de la variante se lista en la variante, con contra «formula_zoho», y no entre las de la letra', () => {
    const r = compararIndicadores([{ ...par('50_53', v(8), 8), variante: v(5) }])
    expect(col(r, '50_53').diferencias).toEqual([])
    expect(col(r, '50_53').variante.diferencias.map((d) => [d.contra, d.app, d.zoho])).toEqual([['formula_zoho', 5, 8]])
  })

  it('C8 · la diferencia mayor lleva los días descontados, los hitos con su fuente y la reentrancia', () => {
    const hitos = [{ nombre: 'Fecha Orden De Venta', dia: '2026-12-24', fuente: 'transicion' }, { nombre: 'Fecha Finalización ST', dia: '2027-01-05', fuente: 'columna_heredada' }]
    const r = compararIndicadores([par('50_53', v(6), 8, { ticketId: 'x', hitos, reentrante: true, diasNoHabiles: ['2026-12-25', '2027-01-01'] })])
    expect(col(r, '50_53').diferencias).toEqual([{ ticketId: 'x', columna: '50_53', contra: 'valor', app: 6, zoho: 8, delta: 2, hitos, reentrante: true, diasNoHabiles: ['2026-12-25', '2027-01-01'] }])
  })

  it('C9 · los tickets: coincide el ticket cuyos pares comparables coinciden todos; sin pares comparables no entra', () => {
    const r = compararIndicadores([
      par('59', v(4), 4, { ticketId: 'a' }), par('58', v(2), 2, { ticketId: 'a' }),
      par('59', v(4), 4, { ticketId: 'b' }), par('58', v(2), 9, { ticketId: 'b' }),
      par('59', v(4), 4, { ticketId: 'c' }), par('58', v(2), null, { ticketId: 'c' }),
      par('59', SD, 4, { ticketId: 'd' }),
    ])
    expect(r.tickets).toEqual({ comparados: 3, coincidentes: 2, porcentaje: 66.7 })
  })

  it('C10 · el porcentaje lleva un decimal: 1 de 8 = 12.5, 1 de 3 = 33.3', () => {
    const ocho = [par('59', v(1), 1, { ticketId: 'k0' }), ...Array.from({ length: 7 }, (_, i) => par('59', v(1), 9, { ticketId: `k${i + 1}` }))]
    expect(col(compararIndicadores(ocho), '59').porcentaje).toBe(12.5)
    const tres = [par('59', v(1), 1, { ticketId: 'a' }), par('59', v(1), 9, { ticketId: 'b' }), par('59', v(1), 9, { ticketId: 'c' })]
    expect(col(compararIndicadores(tres), '59').porcentaje).toBe(33.3)
  })

  it('C11 · con comparados = 0 el porcentaje es null, nunca 0 ni 100', () => {
    const r = compararIndicadores([par('59', SD, 3)])
    expect(col(r, '59').porcentaje).toBeNull()
    expect(col(r, '59').variante.porcentaje).toBeNull()
    expect(r.tickets.porcentaje).toBeNull()
  })

  it('C12 · mensajes: sin ningún valor de Zoho, y con valor de Zoho pero sin par comparable; y los nueve indicadores siempre están', () => {
    const sin = compararIndicadores([par('59', v(4), null), par('50_53', v(4), 'abc')])
    expect(sin).toMatchObject({ comparable: false, mensaje: 'sin valor de Zoho con que comparar' })
    expect(sin.porColumna.map((c) => c.columna)).toEqual(['47', '49', '50_53', '51', '54', '55', '57', '58', '59'])
    expect(sin.porColumna.every((c) => c.porcentaje === null && c.variante.porcentaje === null)).toBe(true)
    const nada = compararIndicadores([par('59', SD, 4)])
    expect(nada).toMatchObject({ comparable: false, mensaje: 'sin pares comparables' })
    expect(compararIndicadores([])).toMatchObject({ comparable: false, mensaje: 'sin valor de Zoho con que comparar' })
    expect(compararIndicadores([par('59', v(4), 4)])).toMatchObject({ comparable: true, mensaje: null })
  })

  it('C13 · sin veredicto: ninguna clave de aprobado, semáforo, umbral ni meta, y la nota dice que la letra no precisa el 95 %', () => {
    const r = compararIndicadores([par('59', v(4), 4)])
    const claves = (JSON.stringify(r).match(/"([^"]+)":/g) ?? []).join(' ').toLowerCase()
    expect(claves).not.toMatch(/aprob|suspen|sem[aá]foro|umbral|meta|color|veredicto/)
    expect(r.nota).toContain('no precisa')
    expect(r.nota).toContain('no decide si se aprueba')
  })

  it('C14 · tolerancia propia: con 2 el par (6,8) coincide', () => {
    expect(cuenta(col(compararIndicadores([par('59', v(6), 8)], 2), '59'))).toEqual([1, 1, 0, 0, 100])
    expect(compararIndicadores([], 2).tolerancia).toBe(2)
  })

  it('C15 · parDeIndicador toma valor, variante, valorZoho, hitos con fuente, reentrancia y días descontados', () => {
    const i: Indicador = {
      columna: '50_53', valor: v(6), formulaZoho: v(8), valorZoho: 8, unidad: 'dias_habiles',
      hitos: { 'Fecha Finalización ST': { dia: '2027-01-05', fuente: 'columna_heredada', escrituras: 1 } },
      reentrante: false, marcas: [], diasNoHabilesDelIntervalo: ['2027-01-01'],
    }
    expect(parDeIndicador('t9', i)).toEqual({
      ticketId: 't9', columna: '50_53', app: v(6), variante: v(8), zoho: 8,
      hitos: [{ nombre: 'Fecha Finalización ST', dia: '2027-01-05', fuente: 'columna_heredada' }], reentrante: false, diasNoHabiles: ['2027-01-01'],
    })
  })
})
