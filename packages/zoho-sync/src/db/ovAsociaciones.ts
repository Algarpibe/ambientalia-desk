import type { Queryable } from './migrate'

/**
 * Acceso a datos de `public.ov_asociaciones` (asociacion-ov-ticket, F1B-11 cambio 2 de 3).
 *
 * Modelo `1 ticket : N OV` en tabla propia: cada fila es una asociacion, nunca se borra (`RQ-TC-17`).
 * Un indice unico parcial por `numero` y otro por `salesorder_id` (los dos con `WHERE liberada_at IS
 * NULL`, `schema.sql`, al final del fichero) imponen que una OV tenga como maximo una asociacion
 * VIGENTE a la vez; liberar es un `UPDATE` de la misma fila, nunca un `DELETE`.
 */

export type OrigenAsociacion = 'alta' | 'habilitar_servicio' | 'remision' | 'aprobacion' | 'aprobacion_y_repuestos'

export interface AsociarOVInput {
  ticketId: string
  numero: string
  salesorderId: string | null
  origen: OrigenAsociacion
  actor: string | null
  fechaOrdenCompra: string | null
}

export interface OvAsociacionRow {
  id: number
  ticket_id: string
  numero: string
  salesorder_id: string | null
  origen: string
  asociada_at: string
  asociada_por: string | null
  fecha_orden_compra: string | null
  liberada_at: string | null
  liberada_por: string | null
  motivo_liberacion: string | null
}

/**
 * Crea la fila de asociacion. Idempotente: si ya hay una fila VIGENTE con el mismo `ticketId` y
 * `numero`, no inserta una segunda (no-op, devuelve la existente). Sin esta comprobacion, repetir la
 * misma llamada (p. ej. un reenvio de transicion) chocaria con el propio indice unico de `numero` —el
 * indice no distingue "el mismo ticket otra vez" de "otro ticket duplicando la OV".
 *
 * Una segunda asociacion VIGENTE de la misma OV para OTRO ticket SI debe fallar: eso lo impone el
 * indice unico parcial de la base con el codigo `23505` (`RQ-TC-17`), y esta funcion no lo atrapa —
 * la traduccion a la respuesta HTTP de cada puerta es responsabilidad de quien llama (lote 2).
 */
export async function asociarOV(q: Queryable, input: AsociarOVInput): Promise<OvAsociacionRow> {
  const existente = await q.query(
    'SELECT * FROM ov_asociaciones WHERE ticket_id = $1 AND numero = $2 AND liberada_at IS NULL',
    [input.ticketId, input.numero],
  )
  if (existente.rows[0]) return existente.rows[0] as OvAsociacionRow

  const r = await q.query(
    `INSERT INTO ov_asociaciones (ticket_id, numero, salesorder_id, origen, asociada_por, fecha_orden_compra)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.ticketId, input.numero, input.salesorderId ?? null, input.origen, input.actor ?? null, input.fechaOrdenCompra ?? null],
  )
  return r.rows[0] as OvAsociacionRow
}

/** Todas las asociaciones de un ticket (vigentes y liberadas), de la mas antigua a la mas reciente. */
export async function listarAsociaciones(db: Queryable, ticketId: string): Promise<OvAsociacionRow[]> {
  const r = await db.query('SELECT * FROM ov_asociaciones WHERE ticket_id = $1 ORDER BY asociada_at', [ticketId])
  return r.rows as OvAsociacionRow[]
}

/**
 * Libera una asociacion VIGENTE: conserva la fila y pone fecha, persona y motivo de liberacion
 * (`RQ-TC-19`). `MUST NOT` borrar la fila. Devuelve `null` si el `id` no existe o ya estaba
 * liberada (nada que actualizar) — la traduccion a `404`/`409` es responsabilidad de la ruta (lote 5).
 */
export async function liberarAsociacion(
  q: Queryable,
  id: number,
  actor: string,
  motivo: string,
): Promise<OvAsociacionRow | null> {
  const r = await q.query(
    `UPDATE ov_asociaciones SET liberada_at = now(), liberada_por = $2, motivo_liberacion = $3
     WHERE id = $1 AND liberada_at IS NULL
     RETURNING *`,
    [id, actor, motivo],
  )
  return (r.rows[0] as OvAsociacionRow | undefined) ?? null
}

/**
 * Libera TODAS las asociaciones vigentes de un ticket con el mismo motivo (usado al eliminar un
 * ticket, `eliminarTicket.ts`, lote 2): sin esto, una asociacion vigente de un ticket borrado
 * bloquearia la OV en el indice para siempre, y ninguna de las tres puertas la veria libre (las tres
 * leen `tickets`, que ya no existiria).
 */
export async function liberarAsociacionesDeTicket(q: Queryable, ticketId: string, motivo: string): Promise<void> {
  await q.query(
    `UPDATE ov_asociaciones SET liberada_at = now(), motivo_liberacion = $2
     WHERE ticket_id = $1 AND liberada_at IS NULL`,
    [ticketId, motivo],
  )
}
