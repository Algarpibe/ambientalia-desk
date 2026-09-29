import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ALARMAS_SLA, SLA_HORAS_POR_ESTADO, flujoDelTicket, slaVencido, type AlarmaSla, type Estado } from '@ambientalia/shared'; import { listarCierres } from './calendarioCierres'

export interface TicketConSlaVencido {
  id: string
  number: number
  estado: Estado
  /** El instante en que el ticket entró en ese estado por ÚLTIMA vez. */
  desde: Date
  horas: number // el umbral en horas HÁBILES que se pasó (`SLA_HORAS_POR_ESTADO`)
  alarma: AlarmaSla; vencidoEnCorte?: boolean // qué hacer al vencer (`ALARMAS_SLA`, S-8); y si ya vencía en el corte de S-13
}

/**
 * Los tickets que llevan en su estado más horas HÁBILES de las que su alarma permite — C11 y F1B-08.
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
 * ⚠️ ESTO NO DISPARA NADA: es la consulta que llamará la pasada de alarmas (lote 3 de F1B-08). Aquí
 * se ponen dos cosas de la base: los cierres de `public.calendario_cierres`, leídos en CADA llamada, y
 * la orden de venta de `Remisión creada` por las tres vías (`tieneOrdenVenta`, al final). SIN N+1:
 * cuatro consultas fijas —tickets, cierres, historial y asociaciones— repartidas en TS, como hace
 * `informeContrato.ts`. Los filtros por estado van con marcadores generados, nunca interpolados.
 */
export async function ticketsConSlaVencido(db: Queryable, ahora: Date, corte?: Date): Promise<TicketConSlaVencido[]> {
  const conSla = Object.keys(SLA_HORAS_POR_ESTADO)
  if (conSla.length === 0) return []

  const marcadores = conSla.map((_, i) => `$${i + 1}`).join(', ')
  const r = await db.query(`SELECT id, number, status, classification, orden_venta, salesorder_id FROM tickets WHERE status IN (${marcadores})`, conSla)
  const cierres = new Set(await listarCierres(db)) // en cada llamada: un cierre dado de alta hoy cuenta en la pasada siguiente
  const vencidos: TicketConSlaVencido[] = []
  const candidatos = (r.rows as FilaTicket[]).filter((fila) =>
    flujoDelTicket({ classification: fila.classification, status: fila.status }) === 'servicio')
  const entradas = await entradasActuales(db, candidatos, conSla)
  const conAsociacion = await conAsociacionVigente(db, candidatos.filter((f) => ALARMAS_SLA[f.status as Estado]?.soloSinOrdenVenta))
  for (const fila of candidatos) {
    const estado = fila.status as Estado
    const alarma = ALARMAS_SLA[estado], horas = SLA_HORAS_POR_ESTADO[estado]
    const desde = entradas.get(String(fila.id))
    if (!desde || !alarma || horas === undefined) continue // sin foto de entrada no se mide (ver arriba)
    if (alarma.soloSinOrdenVenta && tieneOrdenVenta(fila, conAsociacion.has(String(fila.id)))) continue
    if (slaVencido(estado, desde, ahora, cierres)) {
      vencidos.push({ id: fila.id, number: Number(fila.number), estado, desde, horas, alarma, ...(corte && { vencidoEnCorte: slaVencido(estado, desde, corte, cierres) }) })
    }
  }
  return vencidos
}

interface FilaTicket {
  id: string; number: number; status: string; classification: string | null
  orden_venta: string | null; salesorder_id: string | null
}

/**
 * La ÚLTIMA entrada de cada ticket a su estado ACTUAL, en UNA consulta al historial para todos.
 *
 * Se piden las entradas a cualquiera de `estados` de los tickets que están en uno de ellos, y en TS se
 * queda, por ticket, la de mayor `(performed_at, id)` cuyo `to_status` es su estado actual: una entrada
 * más reciente a OTRO estado con alarma no cuenta. `id` es `bigserial` y `node-postgres` lo devuelve
 * como texto, por eso se compara como número. La agregación va en TS y no en `GROUP BY` (pg-mem).
 */
export async function entradasActuales(
  db: Queryable,
  tickets: ReadonlyArray<{ id: string; status: string }>,
  estados: string[],
): Promise<Map<string, Date>> {
  const salida = new Map<string, Date>()
  if (tickets.length === 0 || estados.length === 0) return salida
  const estadoDe = new Map(tickets.map((t) => [String(t.id), t.status]))
  const m = estados.map((_, i) => `$${i + 1}`).join(', ')
  const r = await db.query(
    `SELECT id, ticket_id, to_status, performed_at FROM ticket_transitions
      WHERE to_status IN (${m}) AND ticket_id IN (SELECT id FROM tickets WHERE status IN (${m}))`,
    estados,
  )
  const mejor = new Map<string, { at: number; id: number }>()
  for (const f of r.rows as Array<{ id: unknown; ticket_id: string; to_status: string; performed_at: unknown }>) {
    const ticketId = String(f.ticket_id)
    if (estadoDe.get(ticketId) !== f.to_status) continue
    const at = new Date(f.performed_at as string | Date).getTime(), id = Number(f.id)
    const antes = mejor.get(ticketId)
    if (!antes || at > antes.at || (at === antes.at && id > antes.id)) mejor.set(ticketId, { at, id })
  }
  for (const [ticketId, { at }] of mejor) salida.set(ticketId, new Date(at))
  return salida
}

/** Los tickets de `tickets` con una asociación VIGENTE en `ov_asociaciones`, en una sola consulta. */
async function conAsociacionVigente(db: Queryable, tickets: ReadonlyArray<{ id: string }>): Promise<Set<string>> {
  if (tickets.length === 0) return new Set()
  const m = tickets.map((_, i) => `$${i + 1}`).join(', ')
  const r = await db.query(`SELECT ticket_id FROM ov_asociaciones WHERE liberada_at IS NULL AND ticket_id IN (${m})`, tickets.map((t) => t.id))
  return new Set((r.rows as Array<{ ticket_id: string }>).map((x) => String(x.ticket_id)))
}

/**
 * ¿Tiene el ticket orden de venta por ALGUNA de las tres vías? La MISMA definición que las puertas de
 * «una OV, un ticket» (`ticketConOrdenVenta`, `packages/zoho-sync/src/db/repo.ts:362-379`): la columna
 * `orden_venta` no vacía (`COALESCE(orden_venta,'') <> ''`), `salesorder_id`, o una asociación con
 * `liberada_at IS NULL`. Aquella contesta la pregunta inversa —dada una OV, qué ticket la usa— y no se
 * puede reutilizar sin conocer la OV, así que ésta es una tercera implementación de la misma noción:
 * molde H5. `db/sla.test.ts` las enfrenta sobre los mismos cinco casos y exige que coincidan.
 */
export function tieneOrdenVenta(
  fila: { orden_venta: string | null; salesorder_id: string | null },
  asociacionVigente: boolean,
): boolean {
  return (fila.orden_venta ?? '') !== '' || (fila.salesorder_id ?? '') !== '' || asociacionVigente
}
