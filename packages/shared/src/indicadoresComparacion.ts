// Comparación de los indicadores con lo que Zoho ya calculó (F1F-05, RQ-KP-16). Módulo PURO.
// La aplicación NO decide si se aprueba: no hay umbral, semáforo ni veredicto. El 95 % se juzga con la variante de Zoho y la letra es informativa (decision/f1f05-variante-juzga-el-95).
import type { DiaCivil } from './calendarioLaboral'
import type { ColumnaIndicador, Indicador, Valor } from './indicadores'

/** Letra de Gerencia: diferencia máxima de un día en los tiempos. */
export const TOLERANCIA_DIAS = 1
export const MENSAJE_SIN_ZOHO = 'sin valor de Zoho con que comparar'
export const MENSAJE_SIN_PARES = 'sin pares comparables'
export const NOTA_PORCENTAJES = 'El 95 % se juzga con la variante de la fórmula de Zoho, por indicador y por ticket. La letra de la aplicación es informativa: sus diferencias se explican por definición. La aplicación no decide si se aprueba.'

const COLUMNAS: readonly ColumnaIndicador[] = ['47', '49', '50_53', '51', '54', '55', '57', '58', '59']
const TEXTOS: readonly ColumnaIndicador[] = ['54', '55']

export interface HitoComparado { nombre: string; dia: DiaCivil | null; fuente: string }
export interface ParComparacion {
  ticketId: string
  columna: ColumnaIndicador
  app: Valor<number | string>
  variante: Valor<number | string>
  /** Lo que Zoho calculó y llegó sincronizado; cualquier cosa no usable es «sin valor de Zoho». */
  zoho: unknown
  hitos: HitoComparado[]
  reentrante: boolean | null
  diasNoHabiles: DiaCivil[] | null
}
export interface Diferencia {
  ticketId: string; columna: ColumnaIndicador; contra: 'valor' | 'formula_zoho'
  app: number | string; zoho: number | string; delta: number | null
  hitos: HitoComparado[]; reentrante: boolean | null; diasNoHabiles: DiaCivil[] | null
}
export interface Conteo { comparados: number; coincidentes: number; diferentes: number; sinComparar: number; porcentaje: number | null }
export interface ResumenColumna extends Conteo {
  columna: ColumnaIndicador
  /** Diferencias mayores de la letra contra Zoho. */
  diferencias: Diferencia[]
  /** La variante de la fórmula de Zoho contra Zoho, con sus propias diferencias. */
  variante: Conteo & { diferencias: Diferencia[] }
}
export interface ResumenComparacion {
  comparable: boolean
  mensaje: string | null
  tolerancia: number
  porColumna: ResumenColumna[]
  tickets: LecturaTickets; ticketsVariante: LecturaTickets
  nota: string
}

export function parDeIndicador(ticketId: string, i: Indicador): ParComparacion {
  return {
    ticketId, columna: i.columna, app: i.valor, variante: i.formulaZoho, zoho: i.valorZoho,
    hitos: Object.entries(i.hitos).map(([nombre, h]) => ({ nombre, dia: h.dia, fuente: h.fuente })),
    reentrante: i.reentrante, diasNoHabiles: i.diasNoHabilesDelIntervalo,
  }
}

const porcentaje = (c: number, n: number): number | null => (n === 0 ? null : Math.round((c * 1000) / n) / 10)
const norm = (s: string): string => s.trim().toLowerCase()

function zohoUsable(columna: ColumnaIndicador, z: unknown): number | string | null {
  if (TEXTOS.includes(columna)) {
    if (typeof z !== 'string' || z.trim() === '') return null
    return columna === '54' && !['cumple', 'no cumple'].includes(norm(z)) ? null : z
  }
  if (typeof z === 'number') return Number.isFinite(z) ? z : null
  if (typeof z === 'string' && z.trim() !== '' && Number.isFinite(Number(z))) return Number(z)
  return null
}

type Veredicto = { r: 'sin' } | { r: 'coincide' | 'difiere'; app: number | string; zoho: number | string; delta: number | null }
function evaluar(columna: ColumnaIndicador, v: Valor<number | string>, z: number | string | null, tol: number): Veredicto {
  if (z === null || v.tipo !== 'valor') return { r: 'sin' }
  if (TEXTOS.includes(columna)) {
    if (typeof v.valor !== 'string' || typeof z !== 'string') return { r: 'sin' }
    return { r: norm(v.valor) === norm(z) ? 'coincide' : 'difiere', app: v.valor, zoho: z, delta: null }
  }
  if (typeof v.valor !== 'number' || typeof z !== 'number') return { r: 'sin' }
  const delta = Math.abs(v.valor - z)
  return { r: delta <= tol ? 'coincide' : 'difiere', app: v.valor, zoho: z, delta }
}

const vacio = (): Conteo => ({ comparados: 0, coincidentes: 0, diferentes: 0, sinComparar: 0, porcentaje: null })
function sumar(c: Conteo, r: Veredicto['r']): void {
  if (r === 'sin') { c.sinComparar++; return }
  c.comparados++
  if (r === 'coincide') c.coincidentes++; else c.diferentes++
}
const cerrar = (c: Conteo): Conteo => ({ ...c, porcentaje: porcentaje(c.coincidentes, c.comparados) })

export function compararIndicadores(pares: ParComparacion[], tolerancia: number = TOLERANCIA_DIAS): ResumenComparacion {
  const cols = new Map(COLUMNAS.map((c) => [c, { letra: vacio(), variante: vacio(), diferencias: [] as Diferencia[], diferenciasVariante: [] as Diferencia[] }]))
  const porTicket = { valor: new Map<string, PorTicket>(), formula_zoho: new Map<string, PorTicket>() }
  let conZoho = 0
  for (const p of pares) {
    const acc = cols.get(p.columna)
    if (!acc) continue
    const z = zohoUsable(p.columna, p.zoho)
    if (z !== null) conZoho++
    for (const [contra, v, conteo] of [['valor', p.app, acc.letra], ['formula_zoho', p.variante, acc.variante]] as const) {
      const e = evaluar(p.columna, v, z, tolerancia)
      sumar(conteo, e.r)
      if (e.r === 'difiere') {
        const lista = contra === 'valor' ? acc.diferencias : acc.diferenciasVariante
        lista.push({ ticketId: p.ticketId, columna: p.columna, contra, app: e.app, zoho: e.zoho, delta: e.delta, hitos: p.hitos, reentrante: p.reentrante, diasNoHabiles: p.diasNoHabiles })
      }
      if (e.r !== 'sin') {
        const t = porTicket[contra].get(p.ticketId) ?? { comparados: 0, todoCoincide: true }
        t.comparados++
        if (e.r === 'difiere') t.todoCoincide = false
        porTicket[contra].set(p.ticketId, t)
      }
    }
  }
  const porColumna: ResumenColumna[] = COLUMNAS.map((columna) => {
    const a = cols.get(columna)!
    return { columna, ...cerrar(a.letra), diferencias: a.diferencias, variante: { ...cerrar(a.variante), diferencias: a.diferenciasVariante } }
  })
  const hayPares = porColumna.some((c) => c.comparados > 0 || c.variante.comparados > 0)
  const tickets = lecturaPorTicket(porTicket.valor)
  const ticketsVariante = lecturaPorTicket(porTicket.formula_zoho)
  return {
    comparable: hayPares,
    mensaje: conZoho === 0 ? MENSAJE_SIN_ZOHO : hayPares ? null : MENSAJE_SIN_PARES,
    tolerancia,
    porColumna,
    tickets, ticketsVariante,
    nota: NOTA_PORCENTAJES,
  }
}

/** La lectura por ticket de UNA lectura (la letra o la variante): comparado si tiene un par comparable, coincidente si todos coinciden (RQ-KP-40). */
export interface LecturaTickets { comparados: number; coincidentes: number; porcentaje: number | null }
type PorTicket = { comparados: number; todoCoincide: boolean }
function lecturaPorTicket(mapa: Map<string, PorTicket>): LecturaTickets {
  const ts = [...mapa.values()]
  const coinc = ts.filter((t) => t.todoCoincide).length
  return { comparados: ts.length, coincidentes: coinc, porcentaje: porcentaje(coinc, ts.length) }
}
