import type { Queryable } from './migrate'
import type { ActivityRow } from './rows'
import type { Activity, ActivityListItem } from '../../shared/types'
import { rowToActivity } from './mappers'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertActivity(db: Queryable, r: ActivityRow): Promise<void> {
  await db.query(
    `INSERT INTO activities (id,ticket_id,subject,status,status_type,priority,due_date,created_time,modified_time,completed_time,owner_id,owner_name,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
     ON CONFLICT (id) DO UPDATE SET ticket_id=EXCLUDED.ticket_id,subject=EXCLUDED.subject,status=EXCLUDED.status,
       status_type=EXCLUDED.status_type,priority=EXCLUDED.priority,due_date=EXCLUDED.due_date,created_time=EXCLUDED.created_time,
       modified_time=EXCLUDED.modified_time,completed_time=EXCLUDED.completed_time,owner_id=EXCLUDED.owner_id,
       owner_name=EXCLUDED.owner_name,raw=EXCLUDED.raw,synced_at=now()`,
    [r.id, r.ticket_id, r.subject, r.status, r.status_type, r.priority, r.due_date, r.created_time, r.modified_time, r.completed_time, r.owner_id, r.owner_name, J(r.raw)],
  )
}

export async function getActivities(db: Queryable, ticketId: string): Promise<Activity[]> {
  const res = await db.query(
    `SELECT a.*, g.name AS agent_name FROM activities a
     LEFT JOIN agents g ON a.owner_id=g.id
     WHERE a.ticket_id=$1 ORDER BY COALESCE(a.due_date, a.created_time) ASC NULLS LAST`,
    [ticketId],
  )
  return (res.rows as any[]).map(rowToActivity)
}

export async function getAllActivities(db: Queryable, opts: { filter: string; search: string; limit: number }): Promise<ActivityListItem[]> {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.filter === 'abiertas') where.push("a.status_type <> 'Closed'")
  else if (opts.filter === 'vencidas') where.push("a.status_type <> 'Closed' AND a.due_date < now()")
  if (opts.search) { params.push(`%${opts.search}%`); where.push(`LOWER(a.subject) LIKE LOWER($${params.length})`) }
  params.push(opts.limit)
  const sql =
    `SELECT a.id, a.subject, a.status, a.status_type, a.priority, a.due_date, a.owner_name, a.ticket_id,
            t.number AS ticket_number, g.name AS agent_name
     FROM activities a
     LEFT JOIN tickets t ON a.ticket_id=t.id
     LEFT JOIN agents g ON a.owner_id=g.id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY COALESCE(a.due_date, a.created_time) DESC NULLS LAST
     LIMIT $${params.length}`
  const r = await db.query(sql, params)
  return (r.rows as any[]).map((x) => ({
    id: x.id, subject: x.subject ?? '', status: x.status ?? '', statusType: x.status_type ?? null,
    priority: x.priority ?? null, dueDate: x.due_date ?? null,
    owner: x.owner_name ?? x.agent_name ?? null,
    ticketId: x.ticket_id ?? null, ticketNumber: x.ticket_number != null ? `#${x.ticket_number}` : null,
  }))
}
