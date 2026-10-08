import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { calcularIndicadores, diaEnZona, sumarDias, type DiaCivil, type EtiquetaHito, type Indicador, type PasoDelHistorial, type TicketParaIndicadores } from '@ambientalia/shared'
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
  cierres: Set<DiaCivil>; calificaciones: Map<string, string>
}
const iso = (v: unknown): string | null => (v == null ? null : v instanceof Date ? v.toISOString() : String(v))
const objeto = (v: unknown): Record<string, unknown> => {
  const x = typeof v === 'string' ? (() => { try { return JSON.parse(v) as unknown } catch { return null } })() : v
  return x !== null && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {}
}

/**
 * Cuatro consultas de lectura con parámetros ligados: tickets, TODAS sus transiciones (un `JOIN`, agrupadas en
 * memoria), las respuestas de la encuesta de esos tickets (el mismo `JOIN`; gana la última, RQ-KP-22) y cierres. El periodo se ensancha un día por lado y el corte exacto, sobre el día de creación en
 * Bogotá, se hace en memoria con `diaEnZona` (nunca se escribe el desplazamiento a mano).
 */
export async function leerEntradasIndicadores(db: Queryable, p: { desde: DiaCivil | null; hasta: DiaCivil | null }): Promise<EntradasIndicadores> {
  const params: unknown[] = []
  const filtros: string[] = []
  if (p.desde) { params.push(`${sumarDias(p.desde, -1)}T00:00:00Z`); filtros.push(`t.created_time >= $${params.length}`) }
  if (p.hasta) { params.push(`${sumarDias(p.hasta, 2)}T00:00:00Z`); filtros.push(`t.created_time < $${params.length}`) }
  const donde = filtros.length ? ` WHERE ${filtros.join(' AND ')}` : ''
  const fechas = ETIQUETAS.map((e) => `t.${COLUMNA_DE_HITO[e]}`).join(', ')

  const rt = await db.query(`SELECT t.id, t.number, t.status, t.created_time, t.codigo_servicio, t.dias_entrega, ${fechas}, t.custom_fields FROM tickets t${donde} ORDER BY t.number`, params)
  const tickets: TicketParaIndicadores[] = []
  for (const r of rt.rows) {
    const creadoEn = iso(r.created_time)
    const dia = diaEnZona(creadoEn)
    // Sin periodo salen todos (RQ-KP-13), incluso sin `created_time`; con periodo, uno que no se puede situar no sale.
    if (dia === null ? (p.desde || p.hasta) : (p.desde && dia < p.desde) || (p.hasta && dia > p.hasta)) continue
    const f: TicketParaIndicadores['fechas'] = {}
    for (const e of ETIQUETAS) { const v = r[COLUMNA_DE_HITO[e]]; f[e] = v == null ? null : comoDiaCivil(v) }
    tickets.push({ id: String(r.id), numero: Number(r.number), estado: String(r.status ?? ''), codigoServicio: r.codigo_servicio ?? null, creadoEn, diasEntrega: r.dias_entrega == null ? null : Number(r.dias_entrega), fechas: f, camposZoho: objeto(r.custom_fields) })
  }

  const rh = await db.query(`SELECT tt.ticket_id, tt.transition_id, tt.values, tt.performed_at FROM ticket_transitions tt JOIN tickets t ON t.id = tt.ticket_id${donde} ORDER BY tt.performed_at, tt.id`, params)
  const vistos = new Set(tickets.map((t) => t.id))
  const historial = new Map<string, PasoDelHistorial[]>()
  for (const r of rh.rows) {
    const id = String(r.ticket_id)
    if (!vistos.has(id)) continue
    const paso: PasoDelHistorial = { transitionId: String(r.transition_id ?? ''), performedAt: iso(r.performed_at) ?? '', values: objeto(r.values) }
    historial.set(id, [...(historial.get(id) ?? []), paso])
  }
  const re = await db.query(`SELECT e.ticket_id, e.calificacion FROM public.encuesta_respuestas e JOIN tickets t ON t.id = e.ticket_id${donde} ORDER BY e.respondida_at, e.id`, params)
  const calificaciones = new Map<string, string>()
  for (const r of re.rows) { const id = String(r.ticket_id); if (vistos.has(id)) calificaciones.set(id, String(r.calificacion)) }
  return { tickets, historial, calificaciones, cierres: new Set(await listarCierres(db)) }
}

export interface FilaIndicadores { ticketId: string; codigoServicio: string | null; indicadores: Indicador[] }

/** Los nueve indicadores de cada ticket. El 51 sale del historial y el 55 de la última respuesta de la encuesta de cada ticket (RQ-KP-22). */
export function tablaIndicadores(e: EntradasIndicadores): FilaIndicadores[] {
  return e.tickets.map((t) => ({ ticketId: t.id, codigoServicio: t.codigoServicio, indicadores: calcularIndicadores(t, e.historial.get(t.id) ?? [], { cierres: e.cierres, calificacionSatisfaccion: e.calificaciones.get(t.id) ?? null }) }))
}
