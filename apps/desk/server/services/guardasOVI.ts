import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { listarAsociaciones } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { motivoCargoOVI, motivoGarantiaSinOVI, ordenesDeTransicion, ordenesQueEntran, type SujetoOVI, type Transition } from '@ambientalia/shared'
import { HttpError } from '../util/httpError'

export type { SujetoOVI }

/**
 * Guardas de OVI y Garantía del alta y de las transiciones (F1B-03, `decision/e157-ovi-garantia-por-cargo`). La regla es
 * de `packages/shared` (`ordenOVI.ts`); aquí sólo se traducen sus motivos a HTTP y se lee lo que el ticket YA tiene.
 * Vive en un módulo propio y no en `ticketService.ts` para no desplazar las citas vivas a ese fichero (regla de mutación 4).
 */

/** Escalón B: el `403` de la primera OVI que entra sin que el sujeto tenga el cargo; sujeto ausente = sin cargo (S-10). */
export function exigirCargoOVI(entrantes: readonly string[], sujeto: SujetoOVI | null | undefined): void {
  const motivo = motivoCargoOVI(entrantes, sujeto)
  if (motivo) throw new HttpError(403, { error: motivo })
}

/** Escalón C: el `422` de un ticket de Garantía al que entra una orden que no es OVI. */
export function exigirGarantiaOVI(tipoServicio: unknown, entrantes: readonly string[]): void {
  const motivo = motivoGarantiaSinOVI(tipoServicio, entrantes)
  if (motivo) throw new HttpError(422, { error: motivo })
}

/** En el alta el ticket nace: todo entra, el número tecleado y el que Books da a `salesOrderId` (se juzgan los dos). */
export function entrantesDeAlta(ordenVenta: string | null, numeroBooks: string | null): string[] {
  return ordenesQueEntran([{ numero: ordenVenta }, { numero: numeroBooks }], { numeros: [], salesorderIds: [] })
}

type FilaConOrden = { orden_venta?: string | null; salesorder_id?: string | null }

/** Lo que el ticket YA tiene: `orden_venta`, `salesorder_id` y las asociaciones VIGENTES (`liberada_at` nulo). Una sola noción de «ya la traía». */
async function yaLoTiene(db: Queryable, ticketId: string, row: FilaConOrden) {
  const vigentes = (await listarAsociaciones(db, ticketId)).filter((a) => !a.liberada_at)
  return { numeros: [row.orden_venta, ...vigentes.map((a) => a.numero)], salesorderIds: [row.salesorder_id, ...vigentes.map((a) => a.salesorder_id)] }
}

/**
 * En una transición entra la orden que el ticket NO traía: ni en `orden_venta`, ni en `salesorder_id`, ni en una asociación
 * VIGENTE (`ov_asociaciones`, `liberada_at` nulo). Reconfirmar la que ya tenía no es asociar (E-157, pto. 3), tampoco en un
 * ticket venido de Zoho. Sale `[]` SIN consultar nada si la transición no lleva campo de orden.
 */
export async function entrantesDeTransicion(db: Queryable, t: Transition, valores: unknown, ticketId: string, row: FilaConOrden): Promise<string[]> {
  const recibidas = ordenesDeTransicion(t, valores)
  if (!recibidas.length) return []
  return ordenesQueEntran(recibidas.map((numero) => ({ numero })), await yaLoTiene(db, ticketId, row))
}

/** En la remisión la orden llega por `salesOrderId` y el número sale de Books (`ov`): entra si el ticket no la traía por número ni por id. */
export async function entrantesDeRemision(db: Queryable, ov: { id: string; number?: string | null }, ticketId: string, row: FilaConOrden): Promise<string[]> {
  return ordenesQueEntran([{ numero: ov.number, salesorderId: ov.id }], await yaLoTiene(db, ticketId, row))
}
