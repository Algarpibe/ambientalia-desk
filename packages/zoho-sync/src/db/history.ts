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

export async function getTicketHistory(db: Queryable, ticketId: string): Promise<HistoryEvent[]> {
  const r = await db.query('SELECT raw FROM ticket_history WHERE ticket_id=$1 ORDER BY event_time DESC NULLS LAST', [ticketId])
  const rows = r.rows as any[]
  if (rows.length > 0) return rows.map((x) => mapHistoryEvent(typeof x.raw === 'string' ? JSON.parse(x.raw) : x.raw))
  const tr = await db.query('SELECT transition_name, from_status, to_status, area, performed_by, performed_at FROM ticket_transitions WHERE ticket_id=$1 ORDER BY performed_at DESC', [ticketId])
  return (tr.rows as any[]).map((t) => ({
    eventName: 'AppTransition',
    time: t.performed_at ?? null,
    actor: t.performed_by ?? 'App',
    title: `Transición: ${t.transition_name ?? ''}`.trim(),
    details: [
      { label: 'Estado', value: `${t.from_status ?? '—'} → ${t.to_status ?? '—'}` },
      ...(t.area ? [{ label: 'Área', value: String(t.area) }] : []),
    ],
  }))
}
