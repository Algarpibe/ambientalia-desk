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

/** El lote es la OV madre `OV-AAAA-NNN(N)`, sin sufijo: nunca una subOV ni una OVI. */
export const LOTE_OV = /^OV-\d{4}-\d{3,4}$/

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
