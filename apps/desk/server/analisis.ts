import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { esIdProvisional, cierreQueCuenta, conEstadoNormalizado, type AnalisisRow } from '@ambientalia/shared'
import { nombresProvisionales } from './db/clientesProvisionales'; import { cierresPuestosPorMigracion } from './db/cierresDeMigracion'; import { tiemposDelRelojPorTicket } from './db/relojSla'

function toIso(v: unknown): string | null {
  if (v == null) return null
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

export async function getAnalisisRows(db: Queryable, ahora: Date = new Date()): Promise<AnalisisRow[]> {
  const r = await db.query(
    `SELECT t.id, t.status, t.status_type, t.created_time, t.closed_time, t.fecha_finalizacion_st, t.dias_entrega, t.marca, t.tipo_servicio, t.classification,
            COALESCE(a.name, cl.name) AS cliente, t.client_id, g.name AS tecnico
     FROM tickets t
     LEFT JOIN accounts a ON t.account_id=a.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     LEFT JOIN agents g ON t.assignee_id=g.id`,
  )
  const filas = (r.rows as any[]).map(conEstadoNormalizado)
  // Segunda consulta (F1B-15, RQ-TC-34): el cliente provisional no está en la vista `clients` del JOIN.
  const [provisionales, migracion, tiempos] = await Promise.all([nombresProvisionales(db, filas.filter((x) => !x.cliente && esIdProvisional(x.client_id)).map((x) => x.client_id)), cierresPuestosPorMigracion(db), tiemposDelRelojPorTicket(db, filas, ahora)]) // F1C-06: tercera consulta fija, sólo si hay cerradas
  return filas.map((x) => ({
    status: x.status, statusType: x.status_type ?? null,
    createdAt: toIso(x.created_time),
    finalizadoAt: toIso(x.fecha_finalizacion_st) ?? cierreQueCuenta(toIso(x.closed_time), migracion.get(String(x.id)) ?? null), // RQ-TC-69: sin el cierre de la migración
    diasEntrega: x.dias_entrega != null && x.dias_entrega !== '' ? Number(x.dias_entrega) : null,
    marca: x.marca ?? null,
    tipoServicio: x.tipo_servicio ?? null, clasificaciones: x.classification ?? null,
    cliente: x.cliente ?? provisionales.get(x.client_id) ?? null, tecnico: x.tecnico ?? null, slaHoras: tiempos.get(String(x.id))?.slaHoras ?? null, totalHoras: tiempos.get(String(x.id))?.totalHoras ?? null,
  }))
}

let cache: { rows: AnalisisRow[]; at: number } | null = null
const ANALISIS_TTL_MS = 5 * 60 * 1000
/** getAnalisisRows con caché en memoria (TTL 5 min). `now` inyectable para tests. */
export async function getAnalisisRowsCached(db: Queryable, now: number = Date.now()): Promise<AnalisisRow[]> {
  if (cache && now - cache.at < ANALISIS_TTL_MS) return cache.rows
  const rows = await getAnalisisRows(db)
  cache = { rows, at: now }
  return rows
}
/** Resetea la caché (para tests). */
export function clearAnalisisCache(): void { cache = null }

export function rangeToFromTo(range: string, now: Date): { from: Date | null; to: Date } {
  const day = 86400000
  if (range === 'mes') return { from: new Date(now.getTime() - 30 * day), to: now }
  if (range === 'trimestre') return { from: new Date(now.getTime() - 90 * day), to: now }
  if (range === 'anio') return { from: new Date(now.getTime() - 365 * day), to: now }
  return { from: null, to: now }
}
