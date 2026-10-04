import { describe, it, expect } from 'vitest'
import {
  HITOS_POR_COLUMNA, NOMBRES_ZOHO, calcularIndicadores, diasLunesAViernesFormulaZoho, resolverHito, valorDeZoho,
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
  calcularIndicadores(t, h, { ...OPC, ...o })
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
      '47:dias_naturales', '49:dias_habiles', '50_53:dias_habiles', '51:dias_naturales', '54:cumplimiento', '55:calificacion',
      '57:dias_naturales', '58:dias_naturales', '59:dias_naturales',
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

// ---- Lote 2: días hábiles (49, 50·53), 54 y variante de Zoho (RQ-KP-05 a -07, -11) ----
// Calendario comprobado a mano: 01/10/2026 jueves; el lunes 12/10 es festivo; 01/11 domingo, Todos los Santos
// pasa al lunes 02/11; 11/11 miércoles, Independencia de Cartagena pasa al lunes 16/11; 01/12/2026 martes,
// 08/12 martes festivo, 25/12 viernes festivo; 01/01/2027 viernes festivo.
const CRE = 'Fecha creación ticket', REP = 'Fecha Recepción de repuestos'
const ingreso = (performedAt: string) => ({ transitionId: 'ingreso_a_servicio', performedAt, values: {} })
const marcas = (i: Indicador) => i.marcas
const variante = (i: Indicador) => (i.formulaZoho.tipo === 'valor' ? i.formulaZoho.valor : i.formulaZoho.motivo)
const cierres = (...d: string[]) => ({ cierres: new Set(d) })

describe('lunes a viernes, fórmula de Zoho: sin festivos (RQ-KP-11)', () => {
  it.each([
    ['K1 fin de semana (2 a 6 de octubre)', '2026-10-01', '2026-10-06', 3],
    ['K2 con el festivo del 12/10 contado', '2026-10-08', '2026-10-15', 5],
    ['K3 con los dos festivos de noviembre contados', '2026-10-30', '2026-11-17', 12],
    ['fin de año: Navidad y Año Nuevo contados', '2026-12-24', '2027-01-05', 8],
    ['mismo día', '2026-10-05', '2026-10-05', 0],
    ['invertido', '2026-10-13', '2026-10-09', 0],
  ])('%s', (_n, desde, hasta, esperado) => {
    expect(diasLunesAViernesFormulaZoho(desde, hasta)).toBe(esperado)
  })
})

describe('50·53 en días hábiles (RQ-KP-06)', () => {
  const f = (fechas: TicketParaIndicadores['fechas'], o: object = {}) => de(calc(tk({ fechas }), [], o), '50_53')
  it.each([
    ['K1 fin de semana: 2, 5 y 6', { [OV]: '2026-10-01', [FIN]: '2026-10-06' }, {}, 3, 3, []],
    ['K2 festivo 12/10', { [OV]: '2026-10-08', [FIN]: '2026-10-15' }, {}, 4, 5, ['2026-10-12']],
    ['K2b cierre de empresa 14/10 además', { [OV]: '2026-10-08', [FIN]: '2026-10-15' }, cierres('2026-10-14'), 3, 5, ['2026-10-12', '2026-10-14']],
    ['K3 dos festivos (02/11 y 16/11)', { [OV]: '2026-10-30', [FIN]: '2026-11-17' }, {}, 10, 12, ['2026-11-02', '2026-11-16']],
    ['cierre de fin de año: 28, 29, 30, 31, 4 y 5', { [OV]: '2026-12-24', [FIN]: '2027-01-05' }, {}, 6, 8, ['2026-12-25', '2027-01-01']],
    ['el mismo rango con el 31/12 de empresa', { [OV]: '2026-12-24', [FIN]: '2027-01-05' }, cierres('2026-12-31'), 5, 8, ['2026-12-25', '2026-12-31', '2027-01-01']],
    ['K4 mismo día: 0', { [OV]: '2026-10-05', [FIN]: '2026-10-05' }, {}, 0, 0, []],
    ['K4 un día después: 1', { [OV]: '2026-10-05', [FIN]: '2026-10-06' }, {}, 1, 1, []],
    ['K6 los repuestos mandan sobre la OV', { [OV]: '2026-10-01', [REP]: '2026-10-08', [FIN]: '2026-10-15' }, {}, 4, 5, ['2026-10-12']],
    ['spec: OV 01/12, repuestos 10/12, fin 17/12 → 5 y no 11', { [OV]: '2026-12-01', [REP]: '2026-12-10', [FIN]: '2026-12-17' }, {}, 5, 5, []],
  ])('%s', (_n, fechas, o, esperado, zoho, descontados) => {
    const i = f(fechas, o)
    expect([dato(i), variante(i), i.diasNoHabilesDelIntervalo]).toEqual([esperado, zoho, descontados])
  })
  it('K5 invertido (repuestos 13/10, fin 09/10): 0 y orden_invertido; con la OV a 15/12 y fin 10/12, también', () => {
    const a = f({ [OV]: '2026-10-01', [REP]: '2026-10-13', [FIN]: '2026-10-09' })
    expect([dato(a), marcas(a)]).toEqual([0, ['orden_invertido']])
    const b = f({ [OV]: '2026-12-15', [FIN]: '2026-12-10' })
    expect([dato(b), variante(b), marcas(b)]).toEqual([0, 0, ['orden_invertido']])
  })
  it('K7 reentrante: dos llegadas de repuestos (05/10 y 13/10), fin 15/10 → 2 (14 y 15), reentrante y escrituras 2', () => {
    const h = [paso(1, '2026-10-05T15:00:00Z', { [REP]: '2026-10-05' }), paso(2, '2026-10-13T15:00:00Z', { [REP]: '2026-10-13' })]
    const i = de(calc(tk({ fechas: { [OV]: '2026-10-01', [FIN]: '2026-10-15' } }), h), '50_53')
    expect([dato(i), i.reentrante, i.hitos[REP].escrituras]).toEqual([2, true, 2])
  })
  it.each([
    ['con orden de venta', { [OV]: '2026-12-01' }],
    ['y sin orden de venta tampoco', {}],
  ])('sin finalización es 0 con sin_finalizar, %s', (_n, fechas) => {
    const i = f(fechas)
    expect([dato(i), variante(i), marcas(i)]).toEqual([0, 0, ['sin_finalizar']])
  })
  it('con finalización y sin ninguna fecha de inicio es sin dato', () => {
    const i = f({ [FIN]: '2026-12-10' })
    expect([dato(i), variante(i), marcas(i)]).toEqual(['falta el hito: orden de venta', 'falta el hito: orden de venta', []])
  })
  it('la finalización se lee en Bogotá: 2026-10-07T03:00:00Z es el 06/10 (22:00), no el 07', () => {
    const h = [paso(1, '2026-10-07T15:00:00Z', { [FIN]: '2026-10-07T03:00:00Z' })]
    expect(dato(de(calc(tk({ fechas: { [OV]: '2026-10-01' } }), h), '50_53'))).toBe(3)
  })
})

describe('49 en días hábiles, con la marca de ingreso (RQ-KP-05)', () => {
  const f = (fechas: TicketParaIndicadores['fechas'], h: ReturnType<typeof paso>[], t: Partial<TicketParaIndicadores> = {}) =>
    de(calc(tk({ fechas, ...t }), h), '49')
  it.each([
    ['K11 marca 06/10 02:30Z (día 5 en Bogotá), revisión 13/10, creación 28/09', '2026-10-06T02:30:00Z', { [REV]: '2026-10-13', [CRE]: '2026-09-28' }, 5, 11],
    ['spec: marca 02/12, revisión 10/12 (festivo 8/12), creación 01/12', '2026-12-02T15:00:00Z', { [REV]: '2026-12-10', [CRE]: '2026-12-01' }, 5, 7],
    ['spec: la marca 03/12 03:00Z es el día 2', '2026-12-03T03:00:00Z', { [REV]: '2026-12-10', [CRE]: '2026-12-01' }, 5, 7],
    ['mismo día de la marca y de la revisión: 0', '2026-12-02T15:00:00Z', { [REV]: '2026-12-02', [CRE]: '2026-12-02' }, 0, 0],
  ])('%s', (_n, instante, fechas, esperado, zoho) => {
    const i = f(fechas, [ingreso(instante)])
    expect([dato(i), variante(i)]).toEqual([esperado, zoho])
  })
  it('R1: heredado sin marca es sin dato aunque haya creación; la variante sí se calcula desde la creación', () => {
    const i = f({ [REV]: '2026-12-10', [CRE]: '2026-12-01' }, [])
    expect([dato(i), variante(i)]).toEqual(['falta el hito: marca de ingreso a servicio', 7])
  })
  it('R1: sin Fecha creación ticket la variante es sin dato, y no cae en created_time', () => {
    const i = f({ [REV]: '2026-12-10' }, [ingreso('2026-12-02T15:00:00Z')], { creadoEn: '2026-12-01T15:00:00Z' })
    expect([dato(i), variante(i)]).toEqual([5, 'falta el hito: creación del ticket'])
  })
  it('la creación puede venir del historial (la escribe ingreso_a_servicio) y gana a la columna', () => {
    const h = [{ transitionId: 'ingreso_a_servicio', performedAt: '2026-12-02T15:00:00Z', values: { [CRE]: '2026-12-02' } }]
    expect(variante(f({ [REV]: '2026-12-10', [CRE]: '2026-12-01' }, h))).toBe(6) // (02/12, 10/12] de lunes a viernes: 3, 4, 7, 8, 9, 10; con la columna (01/12) serían 7
  })
  it('sin revisión del informe: sin dato y dice cuál falta', () => {
    const i = f({ [CRE]: '2026-12-01' }, [ingreso('2026-12-02T15:00:00Z')])
    expect([dato(i), variante(i)]).toEqual(['falta el hito: revisión del informe', 'falta el hito: revisión del informe'])
  })
  it('invertido: 0 y orden_invertido; el festivo del intervalo queda como día descontado', () => {
    const a = f({ [REV]: '2026-12-02' }, [ingreso('2026-12-10T15:00:00Z')])
    expect([dato(a), marcas(a), a.diasNoHabilesDelIntervalo]).toEqual([0, ['orden_invertido'], []])
    const b = f({ [REV]: '2026-12-10' }, [ingreso('2026-12-02T15:00:00Z')])
    expect(b.diasNoHabilesDelIntervalo).toEqual(['2026-12-08'])
  })
  it('un cierre de empresa resta su día del 49 pero no de la variante', () => {
    const i = de(calcularIndicadores(tk({ fechas: { [REV]: '2026-12-10', [CRE]: '2026-12-01' } }), [ingreso('2026-12-02T15:00:00Z')], cierres('2026-12-04')), '49')
    expect([dato(i), variante(i)]).toEqual([4, 7])
  })
  it('reentrante cuenta las escrituras de la marca; sin historial es null', () => {
    const dos = f({ [REV]: '2026-12-10' }, [ingreso('2026-12-02T15:00:00Z'), ingreso('2026-12-04T15:00:00Z')])
    expect(dos.reentrante).toBe(true)
    expect(f({ [REV]: '2026-12-10' }, [ingreso('2026-12-02T15:00:00Z')]).reentrante).toBe(false)
    expect(f({ [REV]: '2026-12-10' }, []).reentrante).toBeNull()
  })
})

describe('54 cumplimiento del tiempo promesa (RQ-KP-07, -11)', () => {
  const f = (fechas: TicketParaIndicadores['fechas'], diasEntrega: number | null, h: ReturnType<typeof paso>[] = []) =>
    de(calc(tk({ fechas, diasEntrega }), h), '54')
  const NAV = { [OV]: '2026-12-24', [FIN]: '2027-01-05' } // 53 = 6, variante 8
  it.each([
    ['K12 53 = 4 con 52 = 4 cumple (igual); la variante (5, con el festivo) no', { [OV]: '2026-10-08', [FIN]: '2026-10-15' }, 4, 'Cumple', 'No cumple'],
    ['K12 53 = 4 con 52 = 3 no cumple', { [OV]: '2026-10-08', [FIN]: '2026-10-15' }, 3, 'No cumple', 'No cumple'],
    ['spec: 6 contra 6 cumple, pero la variante (8) no', NAV, 6, 'Cumple', 'No cumple'],
    ['spec: 6 contra 5 no cumple', NAV, 5, 'No cumple', 'No cumple'],
    ['un tiempo promesa de 0 es un valor: 53 = 1 no cumple', { [OV]: '2026-10-05', [FIN]: '2026-10-06' }, 0, 'No cumple', 'No cumple'],
    ['un tiempo promesa de 0 con 53 = 0 cumple', { [OV]: '2026-10-05', [FIN]: '2026-10-05' }, 0, 'Cumple', 'Cumple'],
  ])('%s', (_n, fechas, promesa, esperado, zoho) => {
    const i = f(fechas, promesa)
    expect([dato(i), variante(i)]).toEqual([esperado, zoho])
  })
  it('K12 sin finalización y 52 = 5: Cumple con sin_finalizar (el 53 vale 0)', () => {
    const i = f({ [OV]: '2026-12-01' }, 5)
    expect([dato(i), variante(i), marcas(i)]).toEqual(['Cumple', 'Cumple', ['sin_finalizar']])
  })
  it('K12 sin tiempo promesa: valor sin dato (no Cumple) y la variante de Zoho Cumple', () => {
    const i = f(NAV, null)
    expect([i.valor, variante(i)]).toEqual([{ tipo: 'sin_dato', motivo: 'falta el tiempo promesa' }, 'Cumple'])
  })
  it('si el 53 es sin dato, el 54 también (con su motivo), con y sin tiempo promesa', () => {
    expect(dato(f({ [FIN]: '2026-12-10' }, 5))).toBe('falta el hito: orden de venta')
    expect(variante(f({ [FIN]: '2026-12-10' }, null))).toBe('falta el hito: orden de venta')
  })
  it('la marca orden_invertido del 53 viaja con el 54', () => {
    expect(marcas(f({ [OV]: '2026-12-15', [FIN]: '2026-12-10' }, 3))).toEqual(['orden_invertido'])
  })
  it('el tiempo promesa del historial gana a la columna (último valor)', () => {
    const h = [paso(1, '2026-10-05T15:00:00Z', { 'Días de entrega': 3 }), paso(2, '2026-10-06T15:00:00Z', { 'Días de entrega': 4 })]
    expect(dato(f({ [OV]: '2026-10-08', [FIN]: '2026-10-15' }, 3, h))).toBe('Cumple') // 53 = 4 contra el último, 4
  })
})

describe('47: la variante de Zoho es sin dato con y sin la entrada opcional (RQ-KP-11)', () => {
  const PEND = { tipo: 'sin_dato', motivo: 'falta el hito: hora del último cambio de estado, pendiente de decisión' }
  it.each([
    ['sin entrada opcional', {}],
    ['con horaActualizacionEstado', { horaActualizacionEstado: '2026-10-20T15:00:00Z' }],
  ])('%s, con entrada y salida presentes', (_n, o) => {
    const i = de(calc(tk({ fechas: { [ENT]: '2026-10-01', [SAL]: '2026-10-15' } }), [], o), '47')
    expect([dato(i), i.formulaZoho]).toEqual([14, PEND])
  })
})

describe('los nueve, en orden (RQ-KP-01)', () => {
  it('un ticket vacío devuelve las nueve claves en orden, sin 48, 56 ni 16', () => {
    expect(calc(tk()).map((i) => i.columna)).toEqual(['47', '49', '50_53', '51', '54', '55', '57', '58', '59'])
  })
})

describe('57 y 58 con signo (RQ-KP-03, RQ-KP-18)', () => {
  it('57: cotización dos días antes de la revisión del informe vale -2', () => {
    expect(dato(de(calc(tk({ fechas: { [REV]: '2026-12-10', [COT]: '2026-12-08' } })), '57'))).toBe(-2)
  })
  it('58: orden de compra un día antes de la cotización vale -1', () => {
    expect(dato(de(calc(tk({ fechas: { [COT]: '2026-12-10', [OC]: '2026-12-09' } })), '58'))).toBe(-1)
  })
})
