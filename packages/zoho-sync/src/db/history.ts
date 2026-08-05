import { createHash } from 'node:crypto'
import type { Queryable } from './migrate'
import type { HistoryEvent } from '@ambientalia/shared'
import { mapHistoryEvent } from '@ambientalia/shared'

const J = (v: unknown) => JSON.stringify(v ?? null)

function eventId(ticketId: string, raw: any): string {
  const key = `${ticketId}|${raw.eventTime ?? ''}|${raw.eventName ?? ''}|${JSON.stringify(raw.eventInfo ?? [])}`
  return 'h-' + createHash('sha1').update(key).digest('hex').slice(0, 24)
}

export async function upsertHistoryEvent(db: Queryable, ticketId: string, raw: any): Promise<void> {
  await db.query(
    `INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,actor_type,raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
    [eventId(ticketId, raw), ticketId, raw.eventName ?? null, raw.eventTime ?? null, raw.actor?.name ?? null, raw.actor?.type ?? null, J(raw)],
  )
}

/**
 * Solo los eventos que vinieron de Zoho. NO cae a `ticket_transitions`: componer la historia
 * completa es trabajo de `apps/desk/server/db/historial.ts`, porque mezcla tablas de la app Desk
 * —`remisiones`— que este paquete, que es el motor de sync de Zoho, no tiene por qué conocer.
 *
 * El `else` que había aquí ocultaba datos: un ticket que vino de Zoho y luego se movió en la app
 * enseñaba las transiciones de Zoho y NINGUNA de la app.
 */
export async function getZohoHistoryEvents(db: Queryable, ticketId: string): Promise<HistoryEvent[]> {
  const r = await db.query('SELECT raw FROM ticket_history WHERE ticket_id=$1 ORDER BY event_time DESC NULLS LAST', [ticketId])
  return (r.rows as any[]).map((x) => mapHistoryEvent(typeof x.raw === 'string' ? JSON.parse(x.raw) : x.raw))
}
