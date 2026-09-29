/**
 * Contrato por lote (registro-contrato, F1B-11 cambio 3; `tickets-core` RQ-TC-21, RQ-TC-22, RQ-TC-25).
 *
 * Dominio puro, apto para navegador. Las fechas son días civiles `YYYY-MM-DD` y se comparan como cadenas:
 * con esa forma el orden lexicográfico ES el orden del calendario. «Hoy» es siempre el día en la zona de
 * negocio (`ZONA_NEGOCIO`, `fechasDerivadas.ts:13`), nunca la del proceso (S-11): se reusa `diaEnZona`.
 */
import { diaEnZona } from './fechasDerivadas'
import { sumarDias, type DiaCivil } from './calendarioLaboral'
import { clasificarOV } from './subOV'

// El lote es la OV madre `OV-AAAA-NNN(N)`, sin sufijo: nunca una subOV ni una OVI. Lo decide `esLote` (al final).
// Aquí vivía `LOTE_OV`, una regex paralela a la de `clasificarOV`: retirada en el lote 4 (limpieza H5).

export interface Contrato {
  id: number
  clientId: string
  lote: string
  fechaInicio: DiaCivil
  fechaFin: DiaCivil
  creadoPor: string
  createdAt: string
  ritmoAvisadoTrimestre: number | null
}

/** Lo que la vigencia necesita de un contrato: sus dos fechas, las dos incluidas. */
export type VigenciaContrato = Pick<Contrato, 'fechaInicio' | 'fechaFin'>

export type EstadoContrato = 'no_iniciado' | 'vigente' | 'vencido'

const FORMA_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Un día real en forma `YYYY-MM-DD` (rechaza `2026-02-30`), o `null`. Un instante no es una fecha de contrato. */
export function fechaCalendario(valor: unknown): DiaCivil | null {
  if (typeof valor !== 'string') return null
  const texto = valor.trim()
  return FORMA_FECHA.test(texto) ? diaEnZona(texto) : null
}

/** `no_iniciado` antes del inicio, `vencido` después del fin; vigente con los dos extremos incluidos (S-4, S-5). */
export function estadoContrato(c: VigenciaContrato, hoy: DiaCivil): EstadoContrato {
  if (hoy < c.fechaInicio) return 'no_iniciado'
  if (c.fechaFin < hoy) return 'vencido'
  return 'vigente'
}

/**
 * El motivo del bloqueo de una subOV (`subOV.ts:32-36`) cuyo lote tiene el contrato vencido, o `null`. Una OV
 * ordinaria, una en cuarentena o un contrato de otro lote no se bloquean aquí (RQ-TC-25, escalón C).
 */
export function motivoVencido(
  numero: unknown, contrato: Pick<Contrato, 'id' | 'lote' | 'fechaInicio' | 'fechaFin'> | null, hoy: DiaCivil,
): string | null {
  const c = clasificarOV(numero)
  if (c.tipo !== 'subov' || !contrato || contrato.lote !== c.lote) return null
  if (estadoContrato(contrato, hoy) !== 'vencido') return null
  return `La orden de venta ${String(numero).trim()} es del lote ${c.lote}, y su contrato nº ${contrato.id} venció el ${contrato.fechaFin}: no se puede asociar a ningún ticket`
}

/** El día civil de hoy en la zona de negocio (S-11). `diaEnZona` de un `Date` válido nunca es `null`. */
export function hoyEnZona(ahora: Date = new Date()): DiaCivil {
  return diaEnZona(ahora)!
}

/** `'High'` si el lote tiene contrato vigente; si no, exactamente la regla de hoy (`ticketService.ts:106` en `9288779`). */
export function prioridadAlNacer(pedida: unknown, conContratoVigente: boolean): string | null {
  if (conContratoVigente) return 'High'
  return pedida ? String(pedida) : null
}

export interface Trimestre { k: number; inicio: DiaCivil; fin: DiaCivil }

/** `inicio` + `meses`, con el día recortado al último del mes de llegada (31-ene + 3 → 30-abr). */
function sumarMeses(inicio: DiaCivil, meses: number): DiaCivil {
  const [anio, mes, dia] = inicio.split('-').map(Number)
  const total = mes! - 1 + meses
  const a = anio! + Math.floor(total / 12)
  const m = total % 12
  const ultimo = new Date(Date.UTC(a, m + 1, 0)).getUTCDate()
  return `${a}-${String(m + 1).padStart(2, '0')}-${String(Math.min(dia!, ultimo)).padStart(2, '0')}`
}

/**
 * Los trimestres del contrato (S-12): el k empieza en `inicio + 3(k-1)` meses, calculado SIEMPRE desde el
 * inicio —encadenar arrastraría el recorte (31-ene → 30-abr → 30-jul)—, y acaba el día antes del siguiente
 * o en `fin`, lo que llegue antes.
 */
export function trimestresDelContrato(inicio: DiaCivil, fin: DiaCivil): Trimestre[] {
  const trimestres: Trimestre[] = []
  for (let k = 1; ; k++) {
    const desde = sumarMeses(inicio, 3 * (k - 1))
    if (desde > fin) return trimestres
    const siguiente = sumarDias(sumarMeses(inicio, 3 * k), -1)
    trimestres.push({ k, inicio: desde, fin: siguiente < fin ? siguiente : fin })
  }
}

/** El número del trimestre que contiene `hoy`, o `null` si el contrato no está vigente ese día. */
export function trimestreEn(c: VigenciaContrato, hoy: DiaCivil): number | null {
  if (estadoContrato(c, hoy) !== 'vigente') return null
  return trimestresDelContrato(c.fechaInicio, c.fechaFin).find((t) => t.inicio <= hoy && hoy <= t.fin)!.k
}

/**
 * Si `valor` es un lote (registro-contrato, lote 3): la OV madre que `clasificarOV` (`subOV.ts:32-36`) devolvería
 * para una subOV canónica suya. Se decide con el clasificador y no con una regex propia, para que «lote» y «subOV»
 * no puedan divergir; sin recortar: un lote con espacios no es un lote. Es la única definición de lote (sin `LOTE_OV`).
 */
export function esLote(valor: unknown): boolean {
  if (typeof valor !== 'string') return false
  const c = clasificarOV(`${valor}-01`)
  return c.tipo === 'subov' && c.lote === valor
}

/*
 * Lote 4 — informe trimestral (`zoho-sync` RQ-ZS-15; `decision/anexo-53-contratos`). Lo calcula el servidor
 * (`apps/desk/server/db/informeContrato.ts`); aquí viven las piezas puras y la forma que devuelve.
 */

const ms = (d: DiaCivil): number => { const [a, m, dd] = d.split('-').map(Number); return Date.UTC(a!, m! - 1, dd!) }

/** Días de calendario de `desde` a `hasta` (negativo si `hasta` es anterior), por aritmética pura con `Date.UTC`. */
export function diasEntre(desde: DiaCivil, hasta: DiaCivil): number {
  return Math.round((ms(hasta) - ms(desde)) / 86_400_000)
}

/** `parte` sobre `total` en %, redondeado como el `consumido` de `saldoPorLote`; 0 sin total. */
export function porcentaje(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((100 * parte) / total)
}

export type EstadoSubOV = 'libre' | 'en_curso' | 'ejecutada'

/**
 * El estado de una subOV creada según el ticket de su asociación VIGENTE (`null` = no hay): ejecutada sólo si ese
 * ticket está HOY en `Finalizado` (S-6). Un ticket reabierto deja de estar ejecutado aunque llegara a finalizar.
 */
export function estadoSubOV(statusTicket: string | null): EstadoSubOV {
  if (statusTicket == null) return 'libre'
  return statusTicket === 'Finalizado' ? 'ejecutada' : 'en_curso'
}

/** Lo que la columna «informe» dice de cada servicio: el documento no está en los datos (hueco declarado). */
export const INFORME_NO_DISPONIBLE = 'No disponible en los datos'

export interface SubOVDelInforme {
  numero: string
  salesorderId: string
  estado: EstadoSubOV
  ticketId: string | null
  ticketNumber: number | null
  /** Día de la PRIMERA llegada del ticket a `Finalizado` (S-15); `null` si no está ejecutada o no hay transición. */
  fechaEjecucion: DiaCivil | null
}

export interface ServicioDelInforme {
  subOV: string
  ticketId: string
  ticketNumber: number | null
  equipo: string | null
  serial: string | null
  tipoServicio: string | null
  fecha: DiaCivil
  informe: typeof INFORME_NO_DISPONIBLE
}

export interface TrimestreDelInforme extends Trimestre {
  /** Ejecutadas con fecha en o antes del cierre del trimestre (acumulado, S-7). */
  ejecutadasAlCierre: number
  porcentajeEjecutado: number
  servicios: ServicioDelInforme[]
}

export interface InformeContrato {
  contrato: Contrato
  estado: EstadoContrato
  hoy: DiaCivil
  creadas: number
  ejecutadas: number
  enCurso: number
  libres: number
  porcentajeEjecutado: number
  /** El `consumido` de `saldoPorLote` (asociaciones vigentes / creadas): NO es el % ejecutado. */
  consumido: number
  diasHastaFin: number
  subOV: SubOVDelInforme[]
  trimestres: TrimestreDelInforme[]
  /** Ejecutadas hoy sin fila de `ticket_transitions` hacia `Finalizado`: sin fecha, fuera de los acumulados. */
  sinFecha: SubOVDelInforme[]
  huecos: string[]
}

/*
 * Lote 5 — ritmo del contrato (`derivacion-avisos` RQ-AV-14) y exportación CSV del informe (S-17, S-23).
 */

/**
 * Si al ritmo actual el contrato no consumirá todas sus subOV antes del fin (S-8, S-19): sólo vigente, desde el
 * trimestre 2 y con creadas. Proyección = ejecutadas + (ejecutadas / transcurridos) × restantes, con transcurridos
 * contando el día de inicio (`diasEntre + 1`) y restantes = `diasEntre(hoy, fin)`.
 */
export function ritmoInsuficiente(c: VigenciaContrato, creadas: number, ejecutadas: number, hoy: DiaCivil): boolean {
  const k = trimestreEn(c, hoy)
  if (k == null || k < 2 || creadas <= 0) return false
  const transcurridos = diasEntre(c.fechaInicio, hoy) + 1
  const restantes = diasEntre(hoy, c.fechaFin)
  return ejecutadas + (ejecutadas / transcurridos) * restantes < creadas
}

/**
 * Una celda CSV segura (S-17; misma regla que tenía `csvCampo` de `RemisionesPage.tsx:86` en `5d93eb7`, más TAB y CR).
 * Un TEXTO que empieza por `=`, `+`, `-`, `@`, TAB o CR se lee como fórmula en Excel/Sheets: se le antepone `'`.
 * Luego se entrecomilla si lleva comilla, coma, CR o LF, duplicando las comillas internas.
 *
 * Un NÚMERO pasa tal cual, también negativo (`-5`): lo calcula el servidor, no lo escribe nadie, y neutralizarlo lo
 * convertiría en texto y rompería ordenar y sumar en la hoja. El TEXTO `"-5"` sí se neutraliza: en texto libre no hay
 * forma barata de distinguirlo de `-5+cmd|…`, y quien exporta números los pasa como número.
 */
export function celdaCSV(v: string | number | null | undefined): string {
  if (v == null) return ''
  if (typeof v === 'number') return String(v)
  const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
  return /[",\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

const COLUMNAS_CSV = ['Fila', 'Trimestre', 'Desde', 'Hasta', '% ejecutado acumulado', 'SubOV libres hoy', 'Días hasta el fin',
  'SubOV', 'Ticket', 'Equipo', 'Serial', 'Tipo de servicio', 'Fecha', 'Informe']

/**
 * El CSV del informe (S-23): una fila por trimestre y, debajo, una por cada servicio suyo. El cliente sólo le pone el
 * BOM y lo descarga (regla 13: no calcula nada). Separador `,` y fin de línea CRLF, como `RemisionesPage.tsx`.
 */
export function csvDelInforme(inf: Pick<InformeContrato, 'libres' | 'diasHastaFin' | 'trimestres'>): string {
  const filas: Array<Array<string | number | null>> = [COLUMNAS_CSV]
  for (const t of inf.trimestres) {
    filas.push(['Trimestre', t.k, t.inicio, t.fin, t.porcentajeEjecutado, inf.libres, inf.diasHastaFin, null, null, null, null, null, null, null])
    for (const s of t.servicios) {
      filas.push(['Servicio', t.k, null, null, null, null, null, s.subOV, s.ticketNumber, s.equipo, s.serial, s.tipoServicio, s.fecha, s.informe])
    }
  }
  return filas.map((f) => f.map(celdaCSV).join(',')).join('\r\n')
}
