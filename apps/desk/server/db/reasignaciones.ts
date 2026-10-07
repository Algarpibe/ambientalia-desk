import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { enTransaccion } from './transaccion'

/**
 * Acceso a `public.reasignaciones` y al cambio de `tickets.derivado_a` (reasignacion-con-motivo, F1B-05; `tickets-core`
 * RQ-TC-50, RQ-TC-51). Consultas sin calificar, como `db/prioridadCliente.ts`: la app conecta con `search_path=desk,public`
 * y la tabla sólo existe en `public`.
 */

const comoIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v))

export interface TicketParaReasignar { id: string; numero: number; status: string; classification: string | null; derivadoA: string | null }

/** Lo mínimo del ticket para decidir una reasignación; `null` si no existe. */
export async function ticketParaReasignar(db: Queryable, ticketId: string): Promise<TicketParaReasignar | null> {
  const r = await db.query('SELECT id, number, status, classification, derivado_a FROM tickets WHERE id = $1', [ticketId])
  const f = r.rows[0] as Record<string, unknown> | undefined
  return f ? { id: String(f.id), numero: Number(f.number), status: String(f.status), classification: f.classification == null ? null : String(f.classification), derivadoA: f.derivado_a == null ? null : String(f.derivado_a) } : null
}

export interface Reasignar { ticketId: string; de: string | null; a: string; motivo: string; por: string }

/**
 * Cambia la persona a cargo de UN ticket y deja la traza, en una sola transacción. El `UPDATE` va CONDICIONADO al valor
 * que la ruta leyó (`derivado_a = de`, o `IS NULL` si no había): si otra reasignación se coló entre la lectura y la
 * escritura no acierta fila y NO se escribe traza (DD-1) — el `de` de la traza es siempre el valor vigente al aplicarse.
 * Toca SÓLO `derivado_a` (DD-2): ni `managed_by_app`, que cortaría el sincronizador, ni el estado, ni `updated_at`.
 * Devuelve `false` si el ticket ya no estaba a cargo de `de`; no se escribió nada.
 */
export async function reasignar(db: Queryable, r: Reasignar): Promise<boolean> {
  return enTransaccion(db, async (q) => {
    const actualizado = r.de === null
      ? await q.query('UPDATE tickets SET derivado_a = $2 WHERE id = $1 AND derivado_a IS NULL RETURNING id', [r.ticketId, r.a])
      : await q.query('UPDATE tickets SET derivado_a = $2 WHERE id = $1 AND derivado_a = $3 RETURNING id', [r.ticketId, r.a, r.de])
    if (actualizado.rows.length === 0) return false
    await q.query('INSERT INTO reasignaciones (ticket_id, de, a, motivo, reasignado_por) VALUES ($1, $2, $3, $4, $5)', [r.ticketId, r.de, r.a, r.motivo, r.por])
    return true
  })
}

export interface Reasignacion { de: string | null; a: string; motivo: string; reasignadoPor: string; reasignadoAt: string }

/** Las reasignaciones de un ticket, de la más antigua a la más reciente. */
export async function reasignacionesDelTicket(db: Queryable, ticketId: string): Promise<Reasignacion[]> {
  const r = await db.query('SELECT de, a, motivo, reasignado_por, reasignado_at FROM reasignaciones WHERE ticket_id = $1 ORDER BY id', [ticketId])
  return (r.rows as Array<Record<string, unknown>>).map((f) => ({ de: f.de == null ? null : String(f.de), a: String(f.a), motivo: String(f.motivo), reasignadoPor: String(f.reasignado_por), reasignadoAt: comoIso(f.reasignado_at) }))
}

/** Cuántas reasignaciones nombran a esta persona como origen o como destino; `reasignado_por` (un nombre) no cuenta. */
export async function usosEnReasignaciones(db: Queryable, userId: string): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM reasignaciones WHERE de = $1 OR a = $1', [userId])
  return Number((r.rows[0] as { n: unknown }).n)
}
