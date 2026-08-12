/**
 * Rellena `fecha_orden_venta` en los tickets que se crearon sin ella.
 *
 * El alta guardaba el número de la orden y su id, pero no su fecha. Como «Habilitar Servicio» enseña
 * el campo de la orden bloqueado cuando el ticket ya la trae —y con él bloqueado no se pinta el
 * buscador que arrastra la fecha—, esos tickets se quedaban sin poder rellenarla.
 *
 * El dato nunca se perdió: `salesorder_id` sí se guardaba, así que la fecha está en `books.sales_orders`
 * a un JOIN de distancia. Esto solo la trae.
 *
 * Solo toca los que la tienen VACÍA: una fecha ya puesta a mano manda sobre la de Books.
 */
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

export interface ResumenBackfillFecha {
  /** Tickets que se actualizan (o que se actualizarían, en simulacro). */
  actualizados: number
  /** Tickets con orden enlazada cuya orden tampoco tiene fecha en Books: no hay nada que traer. */
  sinFechaEnBooks: number
  /** El detalle, legible sin cruzar nada: es la copia que se guarda antes de escribir. */
  detalle: Array<{ numero: number; ordenVenta: string | null; fecha: string }>
}

const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/** `date`: pg lo entrega como `Date`; pg-mem puede darlo como texto. */
const dia = (v: unknown): string => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ''))

export async function backfillFechaOrdenVenta(
  db: Queryable,
  opts: { dryRun?: boolean } = {},
): Promise<ResumenBackfillFecha> {
  const r = await db.query(
    `SELECT t.id, t.number, t.orden_venta, so.date AS fecha
       FROM tickets t JOIN books.sales_orders so ON so.salesorder_id = t.salesorder_id
      WHERE t.fecha_orden_venta IS NULL
      ORDER BY t.number`,
  )
  const resumen: ResumenBackfillFecha = { actualizados: 0, sinFechaEnBooks: 0, detalle: [] }
  const aEscribir: Array<{ id: string; fecha: string }> = []
  for (const f of filas(r.rows)) {
    const fecha = dia(f.fecha)
    if (!fecha) { resumen.sinFechaEnBooks++; continue }
    aEscribir.push({ id: String(f.id), fecha })
    resumen.detalle.push({ numero: Number(f.number), ordenVenta: (f.orden_venta as string | null) ?? null, fecha })
  }
  resumen.actualizados = aEscribir.length
  if (!opts.dryRun) {
    // De uno en uno: son pocas decenas, y pg-mem no tipa los arrays enlazados.
    for (const { id, fecha } of aEscribir) {
      await db.query('UPDATE tickets SET fecha_orden_venta = $2, updated_at = now() WHERE id = $1', [id, fecha])
    }
  }
  return resumen
}
