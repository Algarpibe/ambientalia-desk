import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { calcularIndicadores, esPasoDeMigracion, diaEnZona, esAnulado, conEstadoNormalizado, diaDeCierreDelTicket, flujoPorClasificacion, FLUJOS, type Flujo, type DiaCivil, type EtiquetaHito, type Indicador, type PasoDelHistorial, type TicketParaIndicadores } from '@ambientalia/shared'
import { comoDiaCivil, listarCierres } from './db/calendarioCierres'

// Lectura de los indicadores (F1F-05, RQ-KP-13 y -14): SOLO lectura, cuatro consultas pase lo que pase con el número de tickets.

const FORMA_DIA = /^\d{4}-\d{2}-\d{2}$/
const FORMATOS = ['json', 'csv'] as const
type Formato = (typeof FORMATOS)[number]

/** La columna `fecha_*` de cada hito de fecha (`PROMOTED_COLUMNS`, `packages/zoho-sync/src/db/rows.ts`). */
const COLUMNA_DE_HITO: Record<EtiquetaHito, string> = {
  'Fecha creación ticket': 'fecha_creacion_ticket', 'Fecha Remisión Entrada': 'fecha_remision_entrada',
  'Fecha Revisión Informe': 'fecha_revision_informe', 'Fecha de Cotización': 'fecha_cotizacion',
  'Fecha Orden de Compra': 'fecha_orden_compra', 'Fecha Orden De Venta': 'fecha_orden_venta',
  'Fecha Recepción de repuestos': 'fecha_recepcion_repuestos', 'Fecha Finalización ST': 'fecha_finalizacion_st',
  'Fecha Remisión de Salida': 'fecha_remision_salida',
}
const ETIQUETAS = Object.keys(COLUMNA_DE_HITO) as EtiquetaHito[]

export type PeriodoValidado =
  | { ok: true; desde: DiaCivil | null; hasta: DiaCivil | null; formato: Formato }
  | { ok: false; error: string }

/** `desde`/`hasta` (`YYYY-MM-DD`, fechas de calendario reales) y `formato`; lo demás es `400` (RQ-KP-13). */
export function validarPeriodo(q: { desde?: unknown; hasta?: unknown; formato?: unknown }): PeriodoValidado {
  const dia = (nombre: string, v: unknown): { dia: DiaCivil | null } | { error: string } =>
    v === undefined ? { dia: null }
      : typeof v === 'string' && FORMA_DIA.test(v) && diaEnZona(v) !== null ? { dia: v }
        : { error: `El parámetro «${nombre}» debe ser una fecha real con forma AAAA-MM-DD` }
  const d = dia('desde', q.desde), h = dia('hasta', q.hasta)
  if ('error' in d) return { ok: false, error: d.error }
  if ('error' in h) return { ok: false, error: h.error }
  const desde = d.dia, hasta = h.dia
  if (desde !== null && hasta !== null && desde > hasta) return { ok: false, error: 'El parámetro «desde» no puede ser posterior a «hasta»' }
  if (q.formato !== undefined && !FORMATOS.includes(q.formato as Formato)) return { ok: false, error: 'El parámetro «formato» debe ser json o csv' }
  return { ok: true, desde, hasta, formato: (q.formato as Formato | undefined) ?? 'json' }
}

export interface EntradasIndicadores {
  tickets: TicketParaIndicadores[]
  historial: Map<string, PasoDelHistorial[]>
  cierres: Set<DiaCivil>; calificaciones: Map<string, string>; clasificaciones: Map<string, string | null>
}
const iso = (v: unknown): string | null => (v == null ? null : v instanceof Date ? v.toISOString() : String(v))
const objeto = (v: unknown): Record<string, unknown> => {
  const x = typeof v === 'string' ? (() => { try { return JSON.parse(v) as unknown } catch { return null } })() : v
  return x !== null && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {}
}

/**
 * Cuatro consultas de lectura con parámetros ligados: tickets, TODAS sus transiciones (un `JOIN`, agrupadas en
 * memoria), las respuestas de la encuesta de esos tickets (el mismo `JOIN`; gana la última, RQ-KP-22) y cierres. El corte por periodo se hace en memoria y es sobre el día de cierre (RQ-KP-35); en SQL sólo `status_type`. El día va en
 * Bogotá, con `diaEnZona` (nunca se escribe el desplazamiento a mano).
 */
export async function leerEntradasIndicadores(db: Queryable, p: { desde: DiaCivil | null; hasta: DiaCivil | null }): Promise<EntradasIndicadores> {
  const params: unknown[] = []
  const filtros: string[] = []
  filtros.push("t.status_type = 'Closed'")
  const fueraDelPeriodo = (dia: DiaCivil | null): boolean => Boolean(dia === null ? (p.desde || p.hasta) : (p.desde && dia < p.desde) || (p.hasta && dia > p.hasta))
  const donde = filtros.length ? ` WHERE ${filtros.join(' AND ')}` : ''
  const fechas = ETIQUETAS.map((e) => `t.${COLUMNA_DE_HITO[e]}`).join(', ')

  const rt = await db.query(`SELECT t.id, t.number, t.status, t.classification, t.created_time, t.closed_time, t.codigo_servicio, t.dias_entrega, ${fechas}, t.custom_fields FROM tickets t${donde} ORDER BY t.number`, params)
  const candidatos: TicketParaIndicadores[] = []; const clasificaciones = new Map<string, string | null>(); const cerradoEn = new Map<string, string | null>()
  for (const r of rt.rows.map(conEstadoNormalizado)) {
    const creadoEn = iso(r.created_time)
    if (esAnulado(String(r.status ?? ''))) continue
    cerradoEn.set(String(r.id), iso(r.closed_time))
    // El corte por periodo espera al historial: el día de cierre sale de las transiciones y de `closed_time` (S-1, RQ-KP-34).
    const f: TicketParaIndicadores['fechas'] = {}
    for (const e of ETIQUETAS) { const v = r[COLUMNA_DE_HITO[e]]; f[e] = v == null ? null : comoDiaCivil(v) }
    clasificaciones.set(String(r.id), r.classification == null ? null : String(r.classification)); candidatos.push({ id: String(r.id), numero: Number(r.number), estado: String(r.status ?? ''), codigoServicio: r.codigo_servicio ?? null, creadoEn, diasEntrega: r.dias_entrega == null ? null : Number(r.dias_entrega), fechas: f, camposZoho: objeto(r.custom_fields) })
  }

  const rh = await db.query(`SELECT tt.ticket_id, tt.transition_id, tt.values, tt.performed_at FROM ticket_transitions tt JOIN tickets t ON t.id = tt.ticket_id${donde} ORDER BY tt.performed_at, tt.id`, params)
  const vistos = new Set(candidatos.map((t) => t.id))
  const historial = new Map<string, PasoDelHistorial[]>(); const marcadores = new Map<string, PasoDelHistorial>()
  for (const r of rh.rows) {
    const id = String(r.ticket_id)
    if (!vistos.has(id)) continue; if (esPasoDeMigracion(r.transition_id)) { marcadores.set(id, { transitionId: String(r.transition_id), performedAt: iso(r.performed_at) ?? '', values: objeto(r.values) }); continue } // RQ-TC-69, S-5: el marcador de la migración no es un paso, pero decide qué cierre cuenta
    const paso: PasoDelHistorial = { transitionId: String(r.transition_id ?? ''), performedAt: iso(r.performed_at) ?? '', values: objeto(r.values) }
    historial.set(id, [...(historial.get(id) ?? []), paso])
  } const tickets = poblacionPorCierre(candidatos, { historial, marcadores, cerradoEn, vistos, clasificaciones }, fueraDelPeriodo)
  const re = await db.query(`SELECT e.ticket_id, e.calificacion FROM public.encuesta_respuestas e JOIN tickets t ON t.id = e.ticket_id${donde} ORDER BY e.respondida_at, e.id`, params)
  const calificaciones = new Map<string, string>()
  for (const r of re.rows) { const id = String(r.ticket_id); if (vistos.has(id)) calificaciones.set(id, String(r.calificacion)) }
  return { tickets, historial, calificaciones, clasificaciones, cierres: new Set(await listarCierres(db)) }
}

export interface FilaIndicadores { ticketId: string; codigoServicio: string | null; indicadores: Indicador[] }

/** Los nueve indicadores de cada ticket. El 51 sale del historial y el 55 de la última respuesta de la encuesta de cada ticket (RQ-KP-22). */
export function tablaIndicadores(e: EntradasIndicadores): FilaIndicadores[] {
  return e.tickets.map((t) => ({ ticketId: t.id, codigoServicio: t.codigoServicio, indicadores: calcularIndicadores(t, e.historial.get(t.id) ?? [], { cierres: e.cierres, calificacionSatisfaccion: e.calificaciones.get(t.id) ?? null }) }))
}

// filtro-indicadores-por-flujo (F1F-05, RQ-KP-29 y -31): el parámetro `flujo` y el recorte de la lectura por flujo.

export const MENSAJE_FLUJO = 'El parámetro «flujo» debe ser servicio, equipo-nuevo o soporte-remoto'

export type FlujoValidado =
  | { ok: true; flujo: Flujo | null }
  | { ok: false; error: string }

/** `flujo` es uno de `FLUJOS` por igualdad exacta; ausente no filtra (`null`). Vacío, repetido (array) u otra grafía es `400` (RQ-KP-29). */
export function validarFlujo(v: unknown): FlujoValidado {
  if (v === undefined) return { ok: true, flujo: null }
  const flujo = FLUJOS.find((f) => f === v)
  return flujo === undefined ? { ok: false, error: MENSAJE_FLUJO } : { ok: true, flujo }
}

/** Sólo los tickets cuyo flujo POR CLASIFICACIÓN es el pedido; sin flujo, LA MISMA entrada. Historial, encuesta y cierres no se recortan (se buscan por id). */
export function recortarPorFlujo(e: EntradasIndicadores, flujo: Flujo | null): EntradasIndicadores {
  if (flujo === null) return e
  return { ...e, tickets: e.tickets.filter((t) => flujoPorClasificacion(e.clasificaciones.get(t.id)) === flujo) }
}

// poblacion-cierre-variante-47-51 (F1F-05, RQ-KP-34 y -35): fija el día de cierre de cada candidato y se queda con los que caen en el periodo. Lo que no entra se BORRA
// del historial, de los vistos y de las clasificaciones, para que la encuesta (filtrada por `vistos`) y el recorte por flujo sólo vean a los admitidos.
function poblacionPorCierre(
  candidatos: TicketParaIndicadores[],
  l: { historial: Map<string, PasoDelHistorial[]>; marcadores: Map<string, PasoDelHistorial>; cerradoEn: Map<string, string | null>; vistos: Set<string>; clasificaciones: Map<string, string | null> },
  fueraDelPeriodo: (dia: DiaCivil | null) => boolean,
): TicketParaIndicadores[] {
  const admitidos: TicketParaIndicadores[] = []
  for (const t of candidatos) {
    const marcador = l.marcadores.get(t.id)
    const dia = diaDeCierreDelTicket([...(l.historial.get(t.id) ?? []), ...(marcador ? [marcador] : [])], l.cerradoEn.get(t.id) ?? null)
    if (fueraDelPeriodo(dia)) { l.historial.delete(t.id); l.vistos.delete(t.id); l.clasificaciones.delete(t.id); continue }
    admitidos.push({ ...t, diaDeCierre: dia })
  }
  return admitidos
}
