/**
 * El enganche entre las remisiones y el estado del ticket.
 *
 * Antes, un ticket con remisión y otro sin ella estaban en el mismo sitio de la máquina de estados:
 * "Crear remisión" abría un formulario pero no movía el ticket. Ahora la remisión confirmada es una
 * fase, `Remisión creada`, y esto es lo único que la escribe.
 */
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  STATUS_REMISION_CREADA, STATUS_TICKET_CREADO,
  TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA,
} from '@ambientalia/shared'
import { applyTransition } from '@ambientalia/zoho-sync/db/repo'

/**
 * Deja el estado del ticket de acuerdo con las remisiones que tiene confirmadas, en el sentido que
 * haga falta. Es UNA función y no dos —una para avanzar y otra para retroceder— porque el destino se
 * deriva del recuento y no de quién llama: así el callback, la anulación y la restauración no pueden
 * discrepar sobre en qué estado debería estar el ticket.
 *
 * Tres reglas que el recuento codifica:
 *
 * - Cuenta solo las CONFIRMADAS (`ok` u `ok_con_avisos`). Un envío que falló no ha producido ningún
 *   documento, así que avanzar el ticket sería decir que existe una remisión que no existe.
 *   `ok_con_avisos` sí cuenta: el documento se generó y lo que falló fue un aviso.
 * - Y solo las VIGENTES. Anular la última confirmada devuelve el ticket, porque si no quedaría
 *   diciendo `Remisión creada` sin ninguna detrás.
 * - No toca un ticket que ya pasó de esta fase. Si alguien ya lo habilitó a `Ingresado`, anular una
 *   remisión no puede tirar de él hacia atrás: la fase temprana ya quedó atrás y el estado lo manda
 *   la transición que hizo una persona.
 *
 * Un ticket venido de Zoho no entra nunca: se queda en `OV asignada`, que es el nombre que esa misma
 * fase tiene allí. Moverlo lo marcaría `managed_by_app` —lo hace `writeTransition`— y lo sacaría del
 * sync de Zoho sin que nadie lo haya pedido.
 */
export async function sincronizarEstadoPorRemision(db: Queryable, ticketId: string | null, actor: string): Promise<void> {
  if (!ticketId) return

  const t = await db.query('SELECT status FROM tickets WHERE id = $1', [ticketId])
  const actual = (t.rows[0] as { status?: string } | undefined)?.status
  if (actual !== STATUS_TICKET_CREADO && actual !== STATUS_REMISION_CREADA) return

  const c = await db.query(
    `SELECT COUNT(*)::int AS n FROM remisiones
      WHERE ticket_id = $1 AND anulada_at IS NULL AND (estado = 'ok' OR estado = 'ok_con_avisos')`,
    [ticketId],
  )
  const confirmadas = (c.rows[0] as { n: number }).n
  const destino = confirmadas > 0 ? STATUS_REMISION_CREADA : STATUS_TICKET_CREADO
  if (destino === actual) return

  await applyTransition(
    db,
    ticketId,
    actual,
    confirmadas > 0 ? TRANSICION_REMISION_CONFIRMADA : TRANSICION_REMISION_RETIRADA,
    { status: destino, statusType: 'Open', columns: {}, customFields: {} },
    actor,
    {},
  )
}
