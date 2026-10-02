import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import * as repo from '@ambientalia/zoho-sync/db/repo'
import type { TicketWithRefs } from '@ambientalia/zoho-sync/db/repo'
import type { DetailRefs, TicketRefs } from '@ambientalia/zoho-sync/db/mappers'
import type { TicketRow } from '@ambientalia/zoho-sync/db/rows'
import { esIdProvisional } from '@ambientalia/shared'
import { nombresProvisionales } from './clientesProvisionales'

/**
 * Nombre del cliente en los listados y la ficha de tickets (F1B-15, RQ-TC-34, D2). Los cuatro
 * `LEFT JOIN clients` de `zoho-sync/db/repo.ts` no se tocan: ven la vista de Books y no los provisionales.
 * Este envoltorio tiene las MISMAS firmas; si el cliente no salió del join y el `client_id` lleva el prefijo
 * provisional, una segunda consulta rellena `accountName` y marca `clienteProvisional`.
 */
async function conProvisionales<T extends { row: TicketRow; refs: TicketRefs }>(db: Queryable, items: T[]): Promise<T[]> {
  const pendientes = items.filter((i) => !i.refs.accountName && esIdProvisional(i.row.client_id))
  if (pendientes.length === 0) return items
  const nombres = await nombresProvisionales(db, pendientes.map((i) => i.row.client_id as string))
  for (const i of pendientes) {
    const nombre = nombres.get(i.row.client_id as string)
    if (nombre) { i.refs.accountName = nombre; i.refs.clienteProvisional = true }
  }
  return items
}

export async function getActiveTickets(db: Queryable, userId = ''): Promise<TicketWithRefs[]> {
  return conProvisionales(db, await repo.getActiveTickets(db, userId))
}
export async function getClosedTickets(db: Queryable, userId = '', limit = 50, offset = 0): Promise<TicketWithRefs[]> {
  return conProvisionales(db, await repo.getClosedTickets(db, userId, limit, offset))
}
export async function getAllTickets(db: Queryable, userId = ''): Promise<TicketWithRefs[]> {
  return conProvisionales(db, await repo.getAllTickets(db, userId))
}
export async function getTicketWithRefs(db: Queryable, id: string): Promise<{ row: TicketRow; refs: DetailRefs } | null> {
  const found = await repo.getTicketWithRefs(db, id)
  if (!found) return null
  await conProvisionales(db, [found])
  return found
}
