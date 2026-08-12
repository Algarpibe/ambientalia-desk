import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { iso } from './ticketFuentes'

/**
 * Cuándo se ejecutó por ÚLTIMA vez una etapa concreta sobre un ticket.
 *
 * Existe para poder proponer fechas que el sistema ya tiene anotadas en vez de pedirlas a mano: la
 * «Fecha Revisión Informe» que se pregunta al salir de «Notificado» es, por definición, el día en que
 * el ticket entró ahí — el escalado a revisión.
 *
 * La ÚLTIMA y no la primera, y esa es la parte que importa: un informe devuelto a corrección se
 * vuelve a escalar, así que la primera describe una revisión que quedó anulada.
 *
 * Devuelve el INSTANTE en ISO, no el día: `performed_at` es un `timestamptz` en UTC y el día hay que
 * calcularlo en la zona de quien mira. Recortarlo aquí daría un día de más a cualquier cosa hecha
 * después de las 19:00 en Colombia.
 *
 * Solo ve lo que pasó por Desk. Un ticket escalado en Zoho no tiene fila aquí y devuelve `null`, que
 * es lo correcto: cero filas significa «no consta», nunca «no ocurrió», y la pantalla deja el campo
 * vacío para teclearlo.
 */
export async function instanteUltimaTransicion(
  db: Queryable,
  ticketId: string,
  transitionId: string,
): Promise<string | null> {
  const r = await db.query(
    `SELECT performed_at FROM ticket_transitions
      WHERE ticket_id = $1 AND transition_id = $2
      ORDER BY performed_at DESC LIMIT 1`,
    [ticketId, transitionId],
  )
  const fila = r.rows[0] as Record<string, unknown> | undefined
  return fila ? iso(fila.performed_at) : null
}
