import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { prioridadTop5, type PrioridadAsignable } from '@ambientalia/shared'

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
