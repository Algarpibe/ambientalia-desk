// Los nueve indicadores de Zoho (F1F-05, spec `kpis`). Módulo PURO: sin base, sin red, sin ficheros.
// Lote 1: hitos con su fuente, tiempos naturales (47, 57, 58, 59), 51 y 55 «sin dato», y la lectura del
// valor que Zoho ya calculó. Los días hábiles (49, 50·53, 54) llegan en el lote 2.
import type { DiaCivil } from './calendarioLaboral'
import { diaEnZona } from './fechasDerivadas'
import type { PasoDelHistorial } from './bodegaje'

export type EtiquetaHito =
  | 'Fecha Remisión Entrada' | 'Fecha Remisión de Salida' | 'Fecha Revisión Informe' | 'Fecha de Cotización'
  | 'Fecha Orden de Compra' | 'Fecha Orden De Venta' | 'Fecha Recepción de repuestos' | 'Fecha Finalización ST'
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
  /** H-1: hoy la aplicación no guarda la hora del último cambio de estado; la ruta nunca la aporta. */
  horaActualizacionEstado?: string | null
  /** H-2: ídem para la calificación de satisfacción. Se usa tal cual. */
  calificacionSatisfaccion?: string | null
}

/** Hitos de cada columna: la tabla de RQ-KP-02. El guardián K14 la enfrenta a `INDICADORES_G6`. */
export const HITOS_POR_COLUMNA: Record<ColumnaIndicador, readonly string[]> = {
  '47': ['Fecha Remisión Entrada', 'Fecha Remisión de Salida'],
  '49': ['Fecha Revisión Informe'],
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
}
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

function hitosDe(columna: ColumnaIndicador, t: TicketParaIndicadores, historial: PasoDelHistorial[]) {
  const hitos: Record<string, Hito> = {}
  for (const e of HITOS_POR_COLUMNA[columna]) hitos[e] = resolverHito(e as EtiquetaHito, t, historial)
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

/** 47, 51, 55, 57, 58 y 59, en ese orden. El lote 2 suma 49, 50·53 y 54 en `calcularIndicadores`. */
export function calcularIndicadoresNaturales(t: TicketParaIndicadores, historial: PasoDelHistorial[], o: OpcionesIndicadores): Indicador[] {
  const armar = (columna: ColumnaIndicador, unidad: Indicador['unidad'], calcular: (h: Record<string, Hito>) => Pick<Indicador, 'valor' | 'marcas'>, formulaZoho?: Valor<number | string>): Indicador => {
    const { hitos, reentrante } = hitosDe(columna, t, historial)
    const calculo = calcular(hitos)
    return { columna, unidad, hitos, reentrante, ...calculo, formulaZoho: formulaZoho ?? calculo.valor, valorZoho: valorDeZoho(columna, [t.camposZoho])?.valor ?? null }
  }
  const natural = (columna: ColumnaIndicador, desde: EtiquetaHito, hasta: EtiquetaHito, formula?: Valor<number | string>) =>
    armar(columna, 'dias_naturales', (h) => naturales(desde, hasta, h), formula)
  const fin = resolverHito('Fecha Finalización ST', t, historial).dia
  const hora = o.horaActualizacionEstado ? diaEnZona(o.horaActualizacionEstado) : null
  const v51: Valor<number> = hora === null ? sinDato(MOTIVO_H1)
    : fin === null ? sinDato(`falta el hito: ${NOMBRE_HITO['Fecha Finalización ST']}`)
      : { tipo: 'valor', valor: diasNaturalesEntre(fin, hora) }
  const v55: Valor<string> = o.calificacionSatisfaccion ? { tipo: 'valor', valor: o.calificacionSatisfaccion } : sinDato(MOTIVO_H2)
  return [
    natural('47', 'Fecha Remisión Entrada', 'Fecha Remisión de Salida', sinDato(MOTIVO_H1)),
    armar('51', 'dias_naturales', () => ({ valor: v51, marcas: [] }), sinDato(MOTIVO_H1)),
    armar('55', 'calificacion', () => ({ valor: v55, marcas: [] }), sinDato(MOTIVO_H2)),
    natural('57', 'Fecha Revisión Informe', 'Fecha de Cotización'),
    natural('58', 'Fecha de Cotización', 'Fecha Orden de Compra'),
    natural('59', 'Fecha de Cotización', 'Fecha Orden De Venta'),
  ]
}
