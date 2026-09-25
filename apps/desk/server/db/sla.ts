import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { SLA_HORAS_POR_ESTADO, destinatarioDelEscalado, flujoDelTicket, slaVencido, type DestinatarioEscalado, type Estado } from '@ambientalia/shared'

export interface TicketConSlaVencido {
  id: string
  number: number
  estado: Estado
  /** El instante en que el ticket entró en ese estado por ÚLTIMA vez. */
  desde: Date
  /** A quién se le sube el retraso. Sale de la tabla de derivación por cargo, no de una jerarquía aparte. */
  escalarA: DestinatarioEscalado
}

/**
 * Los tickets que llevan en su estado más de lo que su SLA permite — corrección C11.
 *
 * La regla es pura y vive en `packages/shared/src/sla.ts`; aquí sólo está lo que la base tiene que
 * aportar: DESDE CUÁNDO está el ticket en su estado actual. No hay columna que lo diga —
 * `tickets.modified_time` es «la última vez que cambió algo», no «cuándo entró aquí»—, así que sale
 * de `ticket_transitions`, que es donde M1.10 `[DECIDIDO — R08]` obliga a dejar traza de cada etapa
 * «sin excepciones».
 *
 * SE LEE LA ÚLTIMA ENTRADA, no la primera, y no es un detalle: `Notificado` está en un ciclo con
 * `Rev./Diagnostico` —`escalado_a_revision` entra y `devolucion_a_correccion` sale— así que un ticket
 * puede haber pasado por ahí varias veces. Con la primera, un ticket que acaba de volver saldría
 * vencido por una espera que ya terminó.
 *
 * ⚠️ LO QUE ESTA CONSULTA NO PUEDE VER. Un ticket sin ninguna fila en `ticket_transitions` —el
 * retrato del ticket replicado de Zoho, que el motor de la app nunca movió— NO SE PUEDE MEDIR: no se
 * sabe cuándo entró en su estado. Se omite antes que inventarle un origen; `created_time` diría
 * cuándo nació el ticket, que es otra cosa. La lista está acotada, por tanto, a los tickets que esta
 * aplicación ha movido, y quien la consuma tiene que saberlo.
 *
 * ⚠️ ESTO NO DISPARA NADA. Es la consulta que un planificador llamaría; el planificador no existe
 * (`R08.1.md:1588`, `[ABIERTO — AS-BUILT]`) y F1A-02 no lo inventa.
 *
 * El filtro por estado se arma con marcadores generados —nunca con los valores interpolados— porque
 * los estados con SLA son un dato del código, no de fuera, y así la consulta sigue parametrizada.
 */
export async function ticketsConSlaVencido(db: Queryable, ahora: Date): Promise<TicketConSlaVencido[]> {
  const conSla = Object.keys(SLA_HORAS_POR_ESTADO)
  if (conSla.length === 0) return []

  const marcadores = conSla.map((_, i) => `$${i + 1}`).join(', ')
  const r = await db.query(`SELECT id, number, status, classification FROM tickets WHERE status IN (${marcadores})`, conSla)

  const vencidos: TicketConSlaVencido[] = []
  for (const fila of r.rows as Array<{ id: string; number: number; status: string; classification: string | null }>) {
    if (flujoDelTicket({ classification: fila.classification, status: fila.status }) !== 'servicio') continue
    const estado = fila.status as Estado
    const t = await db.query(
      'SELECT performed_at FROM ticket_transitions WHERE ticket_id = $1 AND to_status = $2 ORDER BY performed_at DESC, id DESC LIMIT 1',
      [fila.id, estado],
    )
    const ultima = (t.rows[0] as { performed_at: Date } | undefined)?.performed_at
    if (!ultima) continue
    const desde = new Date(ultima)
    if (slaVencido(estado, desde, ahora)) {
      vencidos.push({ id: fila.id, number: Number(fila.number), estado, desde, escalarA: destinatarioDelEscalado(estado) })
    }
  }
  return vencidos
}
