import type { Queryable } from './migrate'
import type { TicketRow, ConversationRow } from './mappers'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../../shared/types'

export async function upsertTicket(db: Queryable, row: TicketRow): Promise<void> {
  await db.query(
    `INSERT INTO tickets (id, ticket_number, status, status_type, created_time, modified_time, raw, synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, now())
     ON CONFLICT (id) DO UPDATE SET
       ticket_number = EXCLUDED.ticket_number,
       status = EXCLUDED.status,
       status_type = EXCLUDED.status_type,
       created_time = EXCLUDED.created_time,
       modified_time = EXCLUDED.modified_time,
       raw = EXCLUDED.raw,
       synced_at = now()`,
    [row.id, row.ticket_number, row.status, row.status_type, row.created_time, row.modified_time, JSON.stringify(row.raw)],
  )
}

export async function getActiveTicketsRaw(db: Queryable): Promise<ZohoTicketRaw[]> {
  const res = await db.query(
    `SELECT raw FROM tickets WHERE status_type <> 'Closed' ORDER BY created_time DESC NULLS LAST`,
  )
  return res.rows.map((r) => r.raw as ZohoTicketRaw)
}

export async function getTicketRaw(db: Queryable, id: string): Promise<ZohoTicketRaw | null> {
  const res = await db.query(`SELECT raw FROM tickets WHERE id = $1`, [id])
  return res.rows[0] ? (res.rows[0].raw as ZohoTicketRaw) : null
}

export async function countTickets(db: Queryable): Promise<number> {
  const res = await db.query(`SELECT COUNT(*)::int AS n FROM tickets`)
  return res.rows[0].n as number
}

export async function upsertConversation(db: Queryable, row: ConversationRow): Promise<void> {
  await db.query(
    `INSERT INTO conversations (id, ticket_id, commented_time, raw, synced_at)
     VALUES ($1,$2,$3,$4, now())
     ON CONFLICT (id) DO UPDATE SET
       ticket_id = EXCLUDED.ticket_id,
       commented_time = EXCLUDED.commented_time,
       raw = EXCLUDED.raw,
       synced_at = now()`,
    [row.id, row.ticket_id, row.commented_time, JSON.stringify(row.raw)],
  )
}

export async function getConversationsRaw(db: Queryable, ticketId: string): Promise<ZohoConversationRaw[]> {
  const res = await db.query(
    `SELECT raw FROM conversations WHERE ticket_id = $1 ORDER BY commented_time ASC NULLS LAST`,
    [ticketId],
  )
  return res.rows.map((r) => r.raw as ZohoConversationRaw)
}
