import { describe, it, expect } from 'vitest'
import {
  HITOS_POR_COLUMNA, NOMBRES_ZOHO, calcularIndicadoresNaturales, resolverHito, valorDeZoho,
  type ColumnaIndicador, type Indicador, type TicketParaIndicadores,
} from './indicadores'
import { INDICADORES_G6 } from './reentrancia'

// Etiquetas literales de PROMOTED_COLUMNS, las mismas con que se escribe `ticket_transitions.values`.
const REV = 'Fecha Revisión Informe', COT = 'Fecha de Cotización', OC = 'Fecha Orden de Compra'
const OV = 'Fecha Orden De Venta', ENT = 'Fecha Remisión Entrada', SAL = 'Fecha Remisión de Salida'
const FIN = 'Fecha Finalización ST'

const paso = (n: number, performedAt: string, values: Record<string, unknown>) => ({ transitionId: `p${n}`, performedAt, values })
const tk = (o: Partial<TicketParaIndicadores> = {}): TicketParaIndicadores => ({
  id: 't', numero: 1, estado: 'x', creadoEn: null, codigoServicio: null, diasEntrega: null, fechas: {}, camposZoho: {}, ...o,
})
const OPC = { cierres: new Set<string>() }
const calc = (t: TicketParaIndicadores, h = [] as ReturnType<typeof paso>[], o: object = {}) =>
  calcularIndicadoresNaturales(t, h, { ...OPC, ...o })
const de = (fila: Indicador[], c: ColumnaIndicador) => fila.find((i) => i.columna === c)!
const dato = (i: Indicador) => (i.valor.tipo === 'valor' ? i.valor.valor : i.valor.motivo)

describe('resolverHito (RQ-KP-02)', () => {
  it.each([
    ['el historial gana a la columna', tk({ fechas: { [COT]: '2026-12-01' } }), [paso(1, '2026-12-02T15:00:00Z', { [COT]: '2026-12-10' })], { dia: '2026-12-10', fuente: 'transicion', escrituras: 1 }],
    ['vale el ÚLTIMO por performedAt aunque llegue desordenado', tk(), [paso(2, '2026-12-08T15:00:00Z', { [COT]: '2026-12-10' }), paso(1, '2026-12-02T15:00:00Z', { [COT]: '2026-12-05' })], { dia: '2026-12-10', fuente: 'transicion', escrituras: 2 }],
    ['sin historial, la columna con su marca', tk({ fechas: { [COT]: '2026-12-10' } }), [], { dia: '2026-12-10', fuente: 'columna_heredada', escrituras: 0 }],
    ['un valor ilegible del historial cae a la columna', tk({ fechas: { [COT]: '2026-12-01' } }), [paso(1, '2026-12-02T15:00:00Z', { [COT]: 'basura' })], { dia: '2026-12-01', fuente: 'columna_heredada', escrituras: 0 }],
    ['ausente en las dos fuentes', tk(), [paso(1, '2026-12-02T15:00:00Z', { [REV]: '2026-12-01' })], { dia: null, fuente: 'ausente', escrituras: 0 }],
    ['el instante se reduce al día de Bogotá', tk(), [paso(1, '2026-12-02T15:00:00Z', { [COT]: '2026-12-03T03:00:00Z' })], { dia: '2026-12-02', fuente: 'transicion', escrituras: 1 }],
  ])('%s', (_n, t, h, esperado) => {
    expect(resolverHito(COT, t, h)).toEqual(esperado)
  })
})

describe('naturales con signo: 47, 57, 58, 59 (RQ-KP-03, -04, -08)', () => {
  const K8 = tk({ fechas: { [REV]: '2026-03-02', [COT]: '2026-03-05', [OC]: '2026-03-09', [OV]: '2026-03-10' } })

  it('K8 heredado: 57 = 3, 58 = 4, 59 = 5, fuente de la columna y reentrante null', () => {
    const f = calc(K8)
    expect(['57', '58', '59'].map((c) => dato(de(f, c as ColumnaIndicador)))).toEqual([3, 4, 5])
    expect(Object.values(de(f, '57').hitos).map((h) => h.fuente)).toEqual(['columna_heredada', 'columna_heredada'])
    expect(de(f, '57').reentrante).toBeNull()
  })
  it('K8b signo: cotización 03-05 y OV 03-04 dan 59 = -1 con orden_invertido; el 57 en orden no lo lleva', () => {
    const f = calc(tk({ fechas: { [COT]: '2026-03-05', [OV]: '2026-03-04', [REV]: '2026-03-01' } }))
    expect(dato(de(f, '59'))).toBe(-1)
    expect(de(f, '59').marcas).toEqual(['orden_invertido'])
    expect(de(f, '57').marcas).toEqual([])
  })
  it('K9 el historial gana: K8 más un paso con cotización 03-07 da 57 = 5, fuente transicion', () => {
    const i = de(calc(K8, [paso(1, '2026-03-06T15:00:00Z', { [COT]: '2026-03-07' })]), '57')
    expect(dato(i)).toBe(5)
    expect(i.hitos[COT].fuente).toBe('transicion')
  })
  it.each([
    ['entrada 2026-12-16 y salida 2027-01-02', { [ENT]: '2026-12-16', [SAL]: '2027-01-02' }, 17],
    ['K10 entrada 2026-10-01 y salida 2026-10-15', { [ENT]: '2026-10-01', [SAL]: '2026-10-15' }, 14],
    ['mismo día', { [ENT]: '2026-10-01', [SAL]: '2026-10-01' }, 0],
    ['sin salida: dice cuál falta y no usa otra fecha', { [ENT]: '2026-10-01', [FIN]: '2026-10-09' }, 'falta el hito: remisión de salida'],
    ['sin entrada', { [SAL]: '2026-10-15' }, 'falta el hito: remisión de entrada'],
  ])('47 %s', (_n, fechas, esperado) => {
    expect(dato(de(calc(tk({ fechas })), '47'))).toBe(esperado)
  })
  it('falta la cotización: el 57 es sin dato con su motivo', () => {
    expect(dato(de(calc(tk({ fechas: { [REV]: '2026-12-10' } })), '57'))).toBe('falta el hito: cotización')
  })
  it('las unidades y el orden de las columnas', () => {
    const f = calc(K8)
    expect(f.map((i) => `${i.columna}:${i.unidad}`)).toEqual([
      '47:dias_naturales', '51:dias_naturales', '55:calificacion', '57:dias_naturales', '58:dias_naturales', '59:dias_naturales',
    ])
  })
  it('la fórmula de Zoho: el 47 es sin dato aunque haya salida; el 57 es igual que la letra', () => {
    const f = calc(tk({ fechas: { [ENT]: '2026-12-16', [SAL]: '2027-01-02', [REV]: '2026-12-10', [COT]: '2026-12-13' } }), [], { horaActualizacionEstado: '2027-01-10T15:00:00Z' })
    expect(de(f, '47').formulaZoho).toEqual({ tipo: 'sin_dato', motivo: 'falta el hito: hora del último cambio de estado, pendiente de decisión' })
    expect(de(f, '57').formulaZoho).toEqual({ tipo: 'valor', valor: 3 })
  })
})

describe('reentrancia (RQ-KP-10)', () => {
  const dos = [paso(1, '2026-12-02T15:00:00Z', { [REV]: '2026-12-01', [COT]: '2026-12-05' }), paso(2, '2026-12-09T15:00:00Z', { [COT]: '2026-12-10' })]
  it('dos cotizaciones: el 57 vale el último, es reentrante, y el 58 también (comparte la cotización)', () => {
    const f = calc(tk(), dos)
    expect(dato(de(f, '57'))).toBe(9)
    expect(de(f, '57').reentrante).toBe(true)
    expect(de(f, '58').reentrante).toBe(true)
  })
  it('una sola cotización: false; el 47 con historial sin remisiones también', () => {
    const f = calc(tk(), dos.slice(0, 1))
    expect(de(f, '57').reentrante).toBe(false)
    expect(de(f, '47').reentrante).toBe(false)
  })
  it('sin historial: null', () => {
    expect(de(calc(tk({ fechas: { [COT]: '2026-12-10' } })), '57').reentrante).toBeNull()
  })
})

describe('51 y 55: sin dato salvo entrada opcional (RQ-KP-09)', () => {
  const fin = tk({ fechas: { [FIN]: '2027-01-05' } })
  const PEND = 'falta el hito: hora del último cambio de estado, pendiente de decisión'
  it('K13 sin entrada opcional el 51 es sin dato con motivo en texto, aunque haya finalización', () => {
    expect(dato(de(calc(fin), '51'))).toBe(PEND)
  })
  it.each([
    ['2027-01-08T15:00:00Z', 3],
    ['2027-01-09T03:00:00Z', 3], // 22:00 del día 8 en Bogotá: no es el 9
  ])('con horaActualizacionEstado %s el 51 vale %i', (hora, esperado) => {
    expect(dato(de(calc(fin, [], { horaActualizacionEstado: hora }), '51'))).toBe(esperado)
  })
  it('con la hora y sin finalización, dice qué falta', () => {
    expect(dato(de(calc(tk(), [], { horaActualizacionEstado: '2027-01-08T15:00:00Z' }), '51'))).toBe('falta el hito: finalización del servicio')
  })
  it('el 55 sin entrada es sin dato', () => {
    expect(dato(de(calc(tk()), '55'))).toBe('falta el hito: satisfacción del cliente')
  })
  it('R5: el 55 de Zoho va en valorZoho y el valor propio sigue sin dato', () => {
    const i = de(calc(tk({ camposZoho: { 'Calificación de satisfacción': 'Good' } })), '55')
    expect(i.valor).toEqual({ tipo: 'sin_dato', motivo: 'falta el hito: satisfacción del cliente' })
    expect(i.valorZoho).toBe('Good')
  })
  it('la calificación aportada se usa tal cual, sin transformar', () => {
    expect(dato(de(calc(tk(), [], { calificacionSatisfaccion: ' Muy Bueno ' }), '55'))).toBe(' Muy Bueno ')
  })
})

describe('valorDeZoho (K15)', () => {
  it.each([
    ['«Tiempo permanecia» con la errata del diccionario', '47', { 'Tiempo permanecia': 7 }, { valor: 7, campo: 'Tiempo permanecia' }],
    [' tiempo de diagnostico  (sin tilde, espacios, minúsculas)', '49', { ' tiempo  de diagnostico ': 4 }, { valor: 4, campo: ' tiempo  de diagnostico ' }],
    ['"12" → 12', '57', { 'Tiempo de cotización': '12' }, { valor: 12, campo: 'Tiempo de cotización' }],
    ['el texto del 54 se conserva', '54', { 'Cumplimiento del tiempo promesa': 'No Cumple' }, { valor: 'No Cumple', campo: 'Cumplimiento del tiempo promesa' }],
    ['ausente → null', '58', { otro: 3 }, null],
    ['texto no numérico en columna numérica → null', '59', { 'Tiempo de orden de Venta': 'mucho' }, null],
    ['vacío en columna de texto → null', '55', { 'Calificación de satisfacción': '  ' }, null],
  ])('%s', (_n, col, bolsa, esperado) => {
    expect(valorDeZoho(col as ColumnaIndicador, [bolsa])).toEqual(esperado)
  })
  it('busca en todas las bolsas, en orden', () => {
    expect(valorDeZoho('50_53', [{}, { 'Tiempo total servicio': '5' }])).toEqual({ valor: 5, campo: 'Tiempo total servicio' })
    expect(NOMBRES_ZOHO['50_53']).toEqual(['Tiempo de servicio', 'Tiempo total servicio'])
  })
})

describe('K14 guardián contra INDICADORES_G6', () => {
  it.each(INDICADORES_G6.flatMap((g) => g.campos.map((campo) => [g.nombre, g.columnas, campo] as const)))(
    '%s %j: «%s» es hito de su columna',
    (_nombre, columnas, campo) => {
      const col = columnas.length === 2 ? '50_53' : String(columnas[0])
      expect(HITOS_POR_COLUMNA[col as ColumnaIndicador]).toContain(campo)
    },
  )
})
