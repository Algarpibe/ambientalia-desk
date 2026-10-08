// Los nueve indicadores de Zoho (F1F-05, spec `kpis`). Módulo PURO: sin base, sin red, sin ficheros.
// Lote 1: hitos con su fuente, tiempos naturales (47, 57, 58, 59), 51 desde la transición de entrega, 55 desde la calificación que aporta la lectura, y la lectura del
// valor que Zoho ya calculó. Lote 2: días hábiles (49, 50·53), 54 y la variante «fórmula de Zoho».
import { diasHabilesEntre, esDiaHabil, sumarDias, type DiaCivil } from './calendarioLaboral'
import { diaEnZona } from './fechasDerivadas'
import { HITO_INDICADORES_ROTOS, marcaIngresoAServicio, type PasoDelHistorial } from './bodegaje'

export type EtiquetaHito =
  | 'Fecha Remisión Entrada' | 'Fecha Remisión de Salida' | 'Fecha Revisión Informe' | 'Fecha de Cotización'
  | 'Fecha Orden de Compra' | 'Fecha Orden De Venta' | 'Fecha Recepción de repuestos' | 'Fecha Finalización ST'
  | 'Fecha creación ticket'
export type ColumnaIndicador = '47' | '49' | '50_53' | '51' | '54' | '55' | '57' | '58' | '59'
export type FuenteHito = 'transicion' | 'columna_heredada' | 'ausente'
export interface Hito { dia: DiaCivil | null; fuente: FuenteHito; escrituras: number }
export type Valor<T> = { tipo: 'valor'; valor: T } | { tipo: 'sin_dato'; motivo: string }

export interface Indicador<T = number | string> {
  columna: ColumnaIndicador
  valor: Valor<T>
  /** Variante de la fórmula de Zoho (RQ-KP-11). */
  formulaZoho: Valor<T>
  /** Lo que Zoho ya calculó y llegó sincronizado; nunca entra en `valor` (R5). */
  valorZoho: number | string | null
  unidad: 'dias_naturales' | 'dias_habiles' | 'cumplimiento' | 'calificacion'
  hitos: Record<string, Hito>
  /** `null`: ticket sin historial, no se puede saber. */
  reentrante: boolean | null
  marcas: Array<'orden_invertido' | 'sin_finalizar'>
  /** Días de lunes a viernes del intervalo que el calendario laboral descontó (festivos y cierres); sólo 49 y 50·53 (RQ-KP-16). */
  diasNoHabilesDelIntervalo: DiaCivil[] | null
}

export interface TicketParaIndicadores {
  id: string
  numero: number
  estado: string
  codigoServicio: string | null
  creadoEn: string | null
  diasEntrega: number | null
  fechas: Partial<Record<EtiquetaHito, DiaCivil | null>>
  camposZoho: Record<string, unknown>
}
export interface OpcionesIndicadores {
  cierres: ReadonlySet<DiaCivil>
  /**
   * La última calificación cargada del ticket (RQ-KP-22): la aporta la lectura y se usa tal cual.
   */
  calificacionSatisfaccion?: string | null
}

/** Hitos de cada columna: la tabla de RQ-KP-02. El guardián K14 la enfrenta a `INDICADORES_G6`. */
export const HITOS_POR_COLUMNA: Record<ColumnaIndicador, readonly string[]> = {
  '47': ['Fecha Remisión Entrada', 'Fecha Remisión de Salida'],
  '49': ['Fecha Revisión Informe', 'Fecha creación ticket'],
  '50_53': ['Fecha Orden De Venta', 'Fecha Recepción de repuestos', 'Fecha Finalización ST'],
  '51': ['Fecha Finalización ST'],
  '54': ['Fecha Orden De Venta', 'Fecha Recepción de repuestos', 'Fecha Finalización ST'],
  '55': [],
  '57': ['Fecha Revisión Informe', 'Fecha de Cotización'],
  '58': ['Fecha de Cotización', 'Fecha Orden de Compra'],
  '59': ['Fecha de Cotización', 'Fecha Orden De Venta'],
}

/** Nombres con que el diccionario de Zoho escribe cada columna, erratas incluidas (§5 del diseño). */
export const NOMBRES_ZOHO: Record<ColumnaIndicador, readonly string[]> = {
  '47': ['Tiempo permanecia', 'Tiempo permanencia'],
  '49': ['Tiempo de diagnóstico'],
  '50_53': ['Tiempo de servicio', 'Tiempo total servicio'],
  '51': ['Tiempo recogida del equipo'],
  '54': ['Cumplimiento del tiempo promesa'],
  '55': ['Calificación de satisfacción'],
  '57': ['Tiempo de cotización'],
  '58': ['Tiempo de orden de compra'],
  '59': ['Tiempo de orden de Venta'],
}
const TEXTUALES: readonly ColumnaIndicador[] = ['54', '55']

const NOMBRE_HITO: Record<EtiquetaHito, string> = {
  'Fecha Remisión Entrada': 'remisión de entrada', 'Fecha Remisión de Salida': 'remisión de salida',
  'Fecha Revisión Informe': 'revisión del informe', 'Fecha de Cotización': 'cotización',
  'Fecha Orden de Compra': 'orden de compra', 'Fecha Orden De Venta': 'orden de venta',
  'Fecha Recepción de repuestos': 'recepción de repuestos', 'Fecha Finalización ST': 'finalización del servicio',
  'Fecha creación ticket': 'creación del ticket',
}
/** La marca de la transición `ingreso_a_servicio`: hito del 49, sin columna heredada (RQ-KP-02). */
const MARCA_INGRESO = 'marca de ingreso a servicio', MARCA_ENTREGA = 'transición de entrega'
const MOTIVO_PROMESA = 'falta el tiempo promesa'
const MOTIVO_H1 = 'falta el hito: hora del último cambio de estado, pendiente de decisión'
const MOTIVO_H2 = 'falta el hito: satisfacción del cliente'

const sinDato = (motivo: string): Valor<never> => ({ tipo: 'sin_dato', motivo })
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const msDia = (d: DiaCivil) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
/** Resta de días civiles, con signo. No es cálculo de hábiles. */
const diasNaturalesEntre = (desde: DiaCivil, hasta: DiaCivil) => Math.round((msDia(hasta) - msDia(desde)) / 86_400_000)

/** El último valor legible del historial (orden de `performedAt`) y si no hay, la columna heredada. */
export function resolverHito(etiqueta: EtiquetaHito, t: TicketParaIndicadores, historial: PasoDelHistorial[]): Hito {
  const dias = [...historial]
    .sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt))
    .map((p) => diaEnZona(p.values[etiqueta]))
    .filter((d): d is string => d !== null)
  if (dias.length > 0) return { dia: dias[dias.length - 1], fuente: 'transicion', escrituras: dias.length }
  const columna = t.fechas[etiqueta] ?? null
  return columna ? { dia: columna, fuente: 'columna_heredada', escrituras: 0 } : { dia: null, fuente: 'ausente', escrituras: 0 }
}

/** Lo que Zoho ya calculó para la columna, buscado por los nombres del diccionario; `null` si no hay. */
export function valorDeZoho(columna: ColumnaIndicador, bolsas: ReadonlyArray<Record<string, unknown>>): { valor: number | string; campo: string } | null {
  const buscados = NOMBRES_ZOHO[columna].map(normalizar)
  for (const bolsa of bolsas) {
    for (const [campo, crudo] of Object.entries(bolsa)) {
      if (!buscados.includes(normalizar(campo))) continue
      const texto = typeof crudo === 'string' ? crudo.trim() : typeof crudo === 'number' ? String(crudo) : ''
      if (texto === '') continue
      if (TEXTUALES.includes(columna)) return { valor: texto, campo }
      if (/^-?\d+$/.test(texto)) return { valor: Number(texto), campo }
    }
  }
  return null
}

/** El día de Bogotá de la marca `ingreso_a_servicio` (la primera, `bodegaje.ts:225`) y cuántas veces se escribió. */
function hitoMarcaIngreso(historial: PasoDelHistorial[]): Hito {
  const dia = diaEnZona(marcaIngresoAServicio(historial))
  if (dia === null) return { dia: null, fuente: 'ausente', escrituras: 0 }
  return { dia, fuente: 'transicion', escrituras: historial.filter((p) => p.transitionId === HITO_INDICADORES_ROTOS).length }
}

function hitosDe(columna: ColumnaIndicador, t: TicketParaIndicadores, historial: PasoDelHistorial[]) {
  const hitos: Record<string, Hito> = {}
  for (const e of HITOS_POR_COLUMNA[columna]) hitos[e] = resolverHito(e as EtiquetaHito, t, historial)
  if (columna === '49') hitos[MARCA_INGRESO] = hitoMarcaIngreso(historial); if (columna === '51') hitos[MARCA_ENTREGA] = hitoEntrega(historial)
  const reentrante = historial.length === 0 ? null : Object.values(hitos).some((h) => h.escrituras >= 2)
  return { hitos, reentrante }
}

/** Días naturales `hasta − desde` con signo; si falta un hito, sin dato y dice cuál. */
function naturales(desde: EtiquetaHito, hasta: EtiquetaHito, hitos: Record<string, Hito>): Pick<Indicador, 'valor' | 'marcas'> {
  const falta = [desde, hasta].find((e) => hitos[e].dia === null)
  if (falta) return { valor: sinDato(`falta el hito: ${NOMBRE_HITO[falta]}`), marcas: [] }
  const n = diasNaturalesEntre(hitos[desde].dia as string, hitos[hasta].dia as string)
  return { valor: { tipo: 'valor', valor: n }, marcas: n < 0 ? ['orden_invertido'] : [] }
}

/** Los días de `(desde, hasta]`. Vacío si `hasta` no es posterior a `desde`. */
function diasDelIntervalo(desde: DiaCivil, hasta: DiaCivil): DiaCivil[] {
  const dias: DiaCivil[] = []
  for (let d = sumarDias(desde, 1); d <= hasta; d = sumarDias(d, 1)) dias.push(d)
  return dias
}
const esLunesAViernes = (d: DiaCivil) => { const w = new Date(msDia(d)).getUTCDay(); return w >= 1 && w <= 5 }

/**
 * FÓRMULA DE ZOHO, NO el calendario laboral: los días de lunes a viernes de `(desde, hasta]` SIN descontar
 * festivos ni cierres. Medido sobre el export (`apply-progress.md`, lote 1): es lo que Zoho cuenta en el 49 y
 * en el 50·53. «Hábil» con festivos sólo sale de `diasHabilesEntre` (RQ-KP-03); esta cuenta sólo alimenta
 * la variante `formulaZoho` (RQ-KP-11) y no debe usarse para nada más.
 */
export function diasLunesAViernesFormulaZoho(desde: DiaCivil, hasta: DiaCivil): number {
  return diasDelIntervalo(desde, hasta).filter(esLunesAViernes).length
}

/** Los días de lunes a viernes de `(desde, hasta]` que el calendario laboral no cuenta: festivos y cierres. */
const diasDescontados = (desde: DiaCivil, hasta: DiaCivil, cierres: ReadonlySet<DiaCivil>) =>
  diasDelIntervalo(desde, hasta).filter((d) => esLunesAViernes(d) && !esDiaHabil(d, cierres))

const valorDe = <T,>(valor: T): Valor<T> => ({ tipo: 'valor', valor })

/** El 50·53 de la letra y el de la fórmula de Zoho (RQ-KP-06): repuestos antes que orden de venta, tope 0. */
function servicio(h: Record<string, Hito>, cierres: ReadonlySet<DiaCivil>) {
  const fin = h['Fecha Finalización ST'].dia
  if (fin === null) return { valor: valorDe(0), formula: valorDe(0), marcas: ['sin_finalizar'] as Indicador['marcas'], descontados: null }
  const desde = h['Fecha Recepción de repuestos'].dia ?? h['Fecha Orden De Venta'].dia
  if (desde === null) {
    const falta = sinDato(`falta el hito: ${NOMBRE_HITO['Fecha Orden De Venta']}`)
    return { valor: falta, formula: falta, marcas: [] as Indicador['marcas'], descontados: null }
  }
  const invertido = fin < desde
  return {
    valor: valorDe(invertido ? 0 : diasHabilesEntre(desde, fin, cierres)),
    formula: valorDe(invertido ? 0 : diasLunesAViernesFormulaZoho(desde, fin)),
    marcas: (invertido ? ['orden_invertido'] : []) as Indicador['marcas'],
    descontados: diasDescontados(desde, fin, cierres),
  }
}

/** El 49 de la letra (desde la marca) y el de la fórmula de Zoho (desde la creación; R1): RQ-KP-05 y -11. */
function diagnostico(h: Record<string, Hito>, cierres: ReadonlySet<DiaCivil>) {
  const marca = h[MARCA_INGRESO].dia, revision = h['Fecha Revisión Informe'].dia, creacion = h['Fecha creación ticket'].dia
  const sinRevision = sinDato(`falta el hito: ${NOMBRE_HITO['Fecha Revisión Informe']}`)
  const formula: Valor<number> = creacion === null ? sinDato(`falta el hito: ${NOMBRE_HITO['Fecha creación ticket']}`)
    : revision === null ? sinRevision : valorDe(diasLunesAViernesFormulaZoho(creacion, revision))
  if (marca === null || revision === null) {
    return { valor: marca === null ? sinDato(`falta el hito: ${MARCA_INGRESO}`) : sinRevision, formula, marcas: [] as Indicador['marcas'], descontados: null }
  }
  const invertido = revision < marca
  return {
    valor: valorDe(invertido ? 0 : diasHabilesEntre(marca, revision, cierres)), formula,
    marcas: (invertido ? ['orden_invertido'] : []) as Indicador['marcas'], descontados: diasDescontados(marca, revision, cierres),
  }
}

/** El tiempo promesa (columna 52): el último `Días de entrega` del historial y, si no hay, la columna. */
function tiempoPromesa(t: TicketParaIndicadores, historial: PasoDelHistorial[]): number | null {
  const entero = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : null)
  const valores = [...historial]
    .sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt))
    .map((p) => entero(p.values['Días de entrega']))
    .filter((n): n is number => n !== null && Number.isInteger(n) && n >= 0)
  return valores.length > 0 ? valores[valores.length - 1] : t.diasEntrega
}

type Calculo = Pick<Indicador, 'valor' | 'marcas'> & Partial<Pick<Indicador, 'formulaZoho' | 'diasNoHabilesDelIntervalo'>>

/** Los nueve indicadores, en el orden de RQ-KP-01: 47, 49, 50·53, 51, 54, 55, 57, 58 y 59. */
export function calcularIndicadores(t: TicketParaIndicadores, historial: PasoDelHistorial[], o: OpcionesIndicadores): Indicador[] {
  const armar = (columna: ColumnaIndicador, unidad: Indicador['unidad'], calcular: (h: Record<string, Hito>) => Calculo, formulaZoho?: Valor<number | string>): Indicador => {
    const { hitos, reentrante } = hitosDe(columna, t, historial)
    const { formulaZoho: propia, diasNoHabilesDelIntervalo = null, ...calculo } = calcular(hitos)
    return {
      columna, unidad, hitos, reentrante, ...calculo, diasNoHabilesDelIntervalo,
      formulaZoho: propia ?? formulaZoho ?? calculo.valor, valorZoho: valorDeZoho(columna, [t.camposZoho])?.valor ?? null,
    }
  }
  const natural = (columna: ColumnaIndicador, desde: EtiquetaHito, hasta: EtiquetaHito, formula?: Valor<number | string>) =>
    armar(columna, 'dias_naturales', (h) => naturales(desde, hasta, h), formula)
  const v51 = (h: Record<string, Hito>): Calculo => {
    const entrega = h[MARCA_ENTREGA].dia, fin = h['Fecha Finalización ST'].dia
    if (entrega === null) return { valor: sinDato(`falta el hito: ${MARCA_ENTREGA}`), marcas: [] }
    if (fin === null) return { valor: sinDato(`falta el hito: ${NOMBRE_HITO['Fecha Finalización ST']}`), marcas: [] }
    const n = diasNaturalesEntre(fin, entrega); return { valor: valorDe(n), marcas: n < 0 ? ['orden_invertido'] : [] } }
  const v55: Valor<string> = o.calificacionSatisfaccion ? { tipo: 'valor', valor: o.calificacionSatisfaccion } : sinDato(MOTIVO_H2)
  const promesa = tiempoPromesa(t, historial)
  const cumple = (v53: Valor<number>, sinPromesa: Valor<string>): Valor<string> =>
    v53.tipo === 'sin_dato' ? v53 : promesa === null ? sinPromesa : valorDe(v53.valor <= promesa ? 'Cumple' : 'No cumple')
  return [
    natural('47', 'Fecha Remisión Entrada', 'Fecha Remisión de Salida', sinDato(MOTIVO_H1)),
    armar('49', 'dias_habiles', (h) => { const d = diagnostico(h, o.cierres); return { valor: d.valor, formulaZoho: d.formula, marcas: d.marcas, diasNoHabilesDelIntervalo: d.descontados } }),
    armar('50_53', 'dias_habiles', (h) => { const s = servicio(h, o.cierres); return { valor: s.valor, formulaZoho: s.formula, marcas: s.marcas, diasNoHabilesDelIntervalo: s.descontados } }),
    armar('51', 'dias_naturales', v51, sinDato(MOTIVO_H1)),
    armar('54', 'cumplimiento', (h) => {
      const s = servicio(h, o.cierres)
      return { valor: cumple(s.valor, sinDato(MOTIVO_PROMESA)), formulaZoho: cumple(s.formula, valorDe('Cumple')), marcas: s.marcas }
    }),
    armar('55', 'calificacion', () => ({ valor: v55, marcas: [] })),
    natural('57', 'Fecha Revisión Informe', 'Fecha de Cotización'),
    natural('58', 'Fecha de Cotización', 'Fecha Orden de Compra'),
    natural('59', 'Fecha de Cotización', 'Fecha Orden De Venta'),
  ]
}

/** Las transiciones que entregan el equipo al cliente (RQ-KP-09). El guardián de la prueba las enfrenta al catálogo. */
export const TRANSICIONES_DE_ENTREGA: readonly string[] = ['entrega_al_cliente', 'entrega_sin_factura']

/** El día de Bogotá de la ÚLTIMA fila de entrega por `performedAt` (S-A) y cuántas filas de entrega hay (RQ-KP-02, -10). */
function hitoEntrega(historial: PasoDelHistorial[]): Hito {
  const entregas = historial.filter((p) => TRANSICIONES_DE_ENTREGA.includes(p.transitionId))
    .sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt))
  const dia = diaEnZona(entregas[entregas.length - 1]?.performedAt ?? null)
  return dia === null ? { dia: null, fuente: 'ausente', escrituras: 0 } : { dia, fuente: 'transicion', escrituras: entregas.length }
}
