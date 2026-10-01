import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { prioridadTop5, type PrioridadAsignable } from '@ambientalia/shared'
import { enTransaccion } from './transaccion'

/**
 * Acceso a `public.cliente_prioridad` (prioridad-top5-cliente, F1B-07; `tickets-core` RQ-TC-24, RQ-TC-27).
 * Consultas sin calificar, como `db/contratos.ts`: la app conecta con `search_path=desk,public` y la tabla sólo
 * existe en `public`. Lo que se lee de la base NO se confía: `prioridadTop5` de `shared` falla cerrado (D-6).
 */

export interface FilaPrioridadCliente {
  clientId: string
  top5: boolean
  prioridad: string | null
  actualizadoPor: string
  actualizadoAt: string
}

export interface ClienteTop5 extends FilaPrioridadCliente { name: string }

const COLUMNAS = 'client_id, top5, prioridad, actualizado_por, actualizado_at'
const comoIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v))

function aFila(f: Record<string, unknown>): FilaPrioridadCliente {
  return {
    clientId: String(f.client_id),
    top5: f.top5 === true,
    prioridad: f.prioridad == null ? null : String(f.prioridad),
    actualizadoPor: String(f.actualizado_por),
    actualizadoAt: comoIso(f.actualizado_at),
  }
}

export async function filaPrioridadCliente(db: Queryable, clientId: string): Promise<FilaPrioridadCliente | null> {
  const r = await db.query(`SELECT ${COLUMNAS} FROM cliente_prioridad WHERE client_id = $1`, [clientId])
  return r.rows[0] ? aFila(r.rows[0] as Record<string, unknown>) : null
}

/** La prioridad que impone el Top 5 del cliente del ticket, o `null` (sin cliente, sin fila, no Top 5 o dato sucio). */
export async function prioridadTop5DelCliente(db: Queryable, clientId: string | null): Promise<PrioridadAsignable | null> {
  if (!clientId) return null
  return prioridadTop5(await filaPrioridadCliente(db, clientId))
}

/** Los Top 5 vigentes, con el nombre del cliente. Sin tope: el recuento es lo que hay (S-7). */
export async function listarTop5(db: Queryable): Promise<ClienteTop5[]> {
  const r = await db.query(
    `SELECT p.client_id, p.top5, p.prioridad, p.actualizado_por, p.actualizado_at, c.name
       FROM cliente_prioridad p LEFT JOIN clients c ON c.id = p.client_id
      WHERE p.top5 = true ORDER BY c.name, p.client_id`)
  return (r.rows as Array<Record<string, unknown>>).map((f) => ({ ...aFila(f), name: f.name == null ? String(f.client_id) : String(f.name) }))
}

export interface FijarPrioridadCliente { clientId: string; top5: boolean; prioridad: PrioridadAsignable | null; por: string }

/** Alta o cambio en un solo paso (`ON CONFLICT`): una fila por cliente. */
export async function fijarPrioridadCliente(db: Queryable, a: FijarPrioridadCliente): Promise<FilaPrioridadCliente> {
  const r = await db.query(
    `INSERT INTO cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ($1, $2, $3, $4)
     ON CONFLICT (client_id) DO UPDATE SET top5 = EXCLUDED.top5, prioridad = EXCLUDED.prioridad,
       actualizado_por = EXCLUDED.actualizado_por, actualizado_at = now()
     RETURNING ${COLUMNAS}`,
    [a.clientId, a.top5, a.prioridad, a.por])
  return aFila(r.rows[0] as Record<string, unknown>)
}

export interface TicketParaAjuste { id: string; clientId: string | null; prioridad: string | null }

/** Lo mínimo del ticket para decidir un ajuste de prioridad; `null` si no existe. */
export async function ticketParaAjuste(db: Queryable, ticketId: string): Promise<TicketParaAjuste | null> {
  const r = await db.query('SELECT id, client_id, priority FROM tickets WHERE id = $1', [ticketId])
  const f = r.rows[0] as Record<string, unknown> | undefined
  return f ? { id: String(f.id), clientId: f.client_id == null ? null : String(f.client_id), prioridad: f.priority == null ? null : String(f.priority) } : null
}

export interface AjustePrioridad { de: string | null; a: string; motivo: string; ajustadoPor: string; ajustadoAt: string }

/** Los ajustes a mano de un ticket, del más antiguo al más reciente. */
export async function ajustesDelTicket(db: Queryable, ticketId: string): Promise<AjustePrioridad[]> {
  const r = await db.query('SELECT de, a, motivo, ajustado_por, ajustado_at FROM prioridad_ajustes WHERE ticket_id = $1 ORDER BY id', [ticketId])
  return (r.rows as Array<Record<string, unknown>>).map((f) => ({ de: f.de == null ? null : String(f.de), a: String(f.a), motivo: String(f.motivo), ajustadoPor: String(f.ajustado_por), ajustadoAt: comoIso(f.ajustado_at) }))
}

export interface AjustarPrioridad { ticketId: string; de: string | null; prioridad: PrioridadAsignable; motivo: string; por: string }

/**
 * Cambia la prioridad de UN ticket y deja la traza, en una sola transacción (S-6): `managed_by_app=true` para que el
 * sincronizador no la pise (`upsertTicket` sale en esa guarda). NO escribe en `ticket_transitions`: el reloj del SLA
 * (`db/sla.ts`) lee de ahí y un ajuste no es una etapa. No toca `upsertTicket` ni `TICKET_COLS` (IV-11).
 */
export async function ajustarPrioridad(db: Queryable, a: AjustarPrioridad): Promise<void> {
  await enTransaccion(db, async (q) => {
    await q.query("UPDATE tickets SET priority = $2, managed_by_app = true, source = 'app', modified_time = now(), updated_at = now() WHERE id = $1", [a.ticketId, a.prioridad])
    await q.query('INSERT INTO prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por) VALUES ($1, $2, $3, $4, $5)', [a.ticketId, a.de, a.prioridad, a.motivo, a.por])
  })
}
