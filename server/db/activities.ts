import type { Queryable } from './migrate'
import type { ActivityRow } from './rows'
import type { Activity } from '../../shared/types'
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
