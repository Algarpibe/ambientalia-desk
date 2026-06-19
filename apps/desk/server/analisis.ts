import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AnalisisRow } from '@ambientalia/shared'

function toIso(v: unknown): string | null {
  if (v == null) return null
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

export async function getAnalisisRows(db: Queryable): Promise<AnalisisRow[]> {
  const r = await db.query(
    `SELECT t.status, t.status_type, t.created_time, t.closed_time, t.fecha_finalizacion_st, t.dias_entrega, t.marca, t.tipo_servicio, t.classification,
            COALESCE(a.name, cl.name) AS cliente, g.name AS tecnico
     FROM tickets t
     LEFT JOIN accounts a ON t.account_id=a.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     LEFT JOIN agents g ON t.assignee_id=g.id`,
  )
  return (r.rows as any[]).map((x) => ({
    status: x.status, statusType: x.status_type ?? null,
    createdAt: toIso(x.created_time),
    finalizadoAt: toIso(x.fecha_finalizacion_st ?? x.closed_time),
    diasEntrega: x.dias_entrega != null && x.dias_entrega !== '' ? Number(x.dias_entrega) : null,
    marca: x.marca ?? null,
    tipoServicio: x.tipo_servicio ?? null, clasificaciones: x.classification ?? null,
    cliente: x.cliente ?? null, tecnico: x.tecnico ?? null,
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
