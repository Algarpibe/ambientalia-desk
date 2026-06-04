import { randomUUID } from 'node:crypto'
import type { Queryable } from './migrate'
import type { AccountRow, ContactRow, AgentRow, TicketRow, ConversationRow, AttachmentRow } from './rows'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertAccount(db: Queryable, r: AccountRow): Promise<void> {
  await db.query(
    `INSERT INTO accounts (id,name,nit,email,phone,website,city,address,industry,source,managed_by_app,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now())
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,nit=EXCLUDED.nit,email=EXCLUDED.email,phone=EXCLUDED.phone,
       website=EXCLUDED.website,city=EXCLUDED.city,address=EXCLUDED.address,industry=EXCLUDED.industry,raw=EXCLUDED.raw,
       synced_at=now(),updated_at=now() WHERE accounts.managed_by_app = false`,
    [r.id, r.name, r.nit, r.email, r.phone, r.website, r.city, r.address, r.industry, r.source, r.managed_by_app, J(r.raw)],
  )
}

export async function upsertContact(db: Queryable, r: ContactRow): Promise<void> {
  await db.query(
    `INSERT INTO contacts (id,first_name,last_name,email,phone,mobile,account_id,source,managed_by_app,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now())
     ON CONFLICT (id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,email=EXCLUDED.email,
       phone=EXCLUDED.phone,mobile=EXCLUDED.mobile,account_id=EXCLUDED.account_id,raw=EXCLUDED.raw,synced_at=now(),updated_at=now()
       WHERE contacts.managed_by_app = false`,
    [r.id, r.first_name, r.last_name, r.email, r.phone, r.mobile, r.account_id, r.source, r.managed_by_app, J(r.raw)],
  )
}

export async function upsertAgent(db: Queryable, r: AgentRow): Promise<void> {
  await db.query(
    `INSERT INTO agents (id,name,email,role,source,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,now(),now())
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,role=EXCLUDED.role,raw=EXCLUDED.raw,synced_at=now(),updated_at=now()`,
    [r.id, r.name, r.email, r.role, r.source, J(r.raw)],
  )
}

const TICKET_COLS = [
  'id','number','subject','status','status_type','priority','classification','channel','description',
  'contact_id','account_id','assignee_id','created_time','modified_time','closed_time','onhold_time','due_date',
  'codigo_servicio','tipo_servicio','equipo','marca','modelo','serial','codigo_interno','encargado','correo_encargado',
  'nit','ciudad','direccion','telefono','orden_venta','conformidad','dias_entrega','cumple_condiciones_comerciales',
  'fecha_creacion_ticket','fecha_remision_entrada','fecha_revision_informe','fecha_cotizacion','fecha_orden_compra',
  'fecha_orden_venta','fecha_recepcion_repuestos','fecha_finalizacion_st','fecha_factura','fecha_remision_salida',
  'fecha_salida_servicio_externo','fecha_entrada_servicio_externo','fecha_notificacion_garantia','fecha_solicitud_sku',
  'fecha_orden_compra_final','fecha_orden_venta_final','equipo_partes_listas','archivo_trazabilidad_actualizado',
  'doc_almacenada_drive','hv_actualizada','liberacion_sin_facturar','servicio_in_situ','custom_fields','managed_by_app','source','raw',
] as const

export async function upsertTicket(db: Queryable, r: TicketRow): Promise<void> {
  // pg-mem no soporta `WHERE` en `ON CONFLICT ... DO UPDATE`; usamos guarda con SELECT previo.
  const existing = await db.query('SELECT managed_by_app FROM tickets WHERE id=$1', [r.id])
  if (existing.rows[0]?.managed_by_app === true) return // no sobrescribir lo gestionado por la app
  const values = TICKET_COLS.map((c) => (c === 'custom_fields' || c === 'raw') ? J((r as any)[c]) : (r as any)[c])
  const placeholders = TICKET_COLS.map((_, i) => `$${i + 1}`).join(',')
  const updates = TICKET_COLS.filter((c) => c !== 'id' && c !== 'managed_by_app').map((c) => `${c}=EXCLUDED.${c}`).join(',')
  await db.query(
    `INSERT INTO tickets (${TICKET_COLS.join(',')}, synced_at, updated_at) VALUES (${placeholders}, now(), now())
     ON CONFLICT (id) DO UPDATE SET ${updates}, synced_at=now(), updated_at=now()`,
    values,
  )
}

export async function upsertConversation(db: Queryable, r: ConversationRow): Promise<void> {
  await db.query(
    `INSERT INTO conversations (id,ticket_id,kind,author_name,author_type,is_public,content,content_type,commented_time,source,raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET ticket_id=EXCLUDED.ticket_id,kind=EXCLUDED.kind,author_name=EXCLUDED.author_name,
       author_type=EXCLUDED.author_type,is_public=EXCLUDED.is_public,content=EXCLUDED.content,content_type=EXCLUDED.content_type,
       commented_time=EXCLUDED.commented_time,raw=EXCLUDED.raw`,
    [r.id, r.ticket_id, r.kind, r.author_name, r.author_type, r.is_public, r.content, r.content_type, r.commented_time, r.source, J(r.raw)],
  )
}

export async function upsertAttachment(db: Queryable, r: AttachmentRow): Promise<void> {
  await db.query(
    `INSERT INTO attachments (id,conversation_id,ticket_id,name,size,content_type,zoho_href,storage_path,raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO UPDATE SET conversation_id=EXCLUDED.conversation_id,ticket_id=EXCLUDED.ticket_id,name=EXCLUDED.name,
       size=EXCLUDED.size,content_type=EXCLUDED.content_type,zoho_href=EXCLUDED.zoho_href,raw=EXCLUDED.raw`,
    [r.id, r.conversation_id, r.ticket_id, r.name, r.size, r.content_type, r.zoho_href, r.storage_path, J(r.raw)],
  )
}

// Lecturas mínimas requeridas por los tests de upsert (las consultas completas llegan en Task 8).
export async function getTicketRow(db: Queryable, id: string): Promise<TicketRow | null> {
  const res = await db.query('SELECT * FROM tickets WHERE id=$1', [id])
  return res.rows[0] ? (res.rows[0] as TicketRow) : null
}

export async function countTickets(db: Queryable): Promise<number> {
  const res = await db.query('SELECT COUNT(*)::int AS n FROM tickets')
  return res.rows[0].n as number
}

import type { TicketRefs, DetailRefs } from './mappers'

export interface TicketWithRefs { row: TicketRow; refs: TicketRefs }

export async function getActiveTickets(db: Queryable): Promise<TicketWithRefs[]> {
  const r = await db.query(
    `SELECT t.*, a.name AS account_name, g.name AS agent_name
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     WHERE (t.status_type <> 'Closed' OR t.status_type IS NULL) ORDER BY t.created_time DESC NULLS LAST`,
  )
  return r.rows.map((row: any) => ({ row: row as TicketRow, refs: { accountName: row.account_name, agentName: row.agent_name } }))
}

export async function getTicketWithRefs(db: Queryable, id: string): Promise<{ row: TicketRow; refs: DetailRefs } | null> {
  const r = await db.query(
    `SELECT t.*, a.name AS account_name, g.name AS agent_name,
            c.first_name AS c_first, c.last_name AS c_last, c.phone AS c_phone, c.email AS c_email
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN contacts c ON t.contact_id=c.id WHERE t.id=$1`,
    [id],
  )
  const row = r.rows[0]
  if (!row) return null
  const contactName = [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null
  return { row: row as TicketRow, refs: { accountName: row.account_name, agentName: row.agent_name, contactName, contactPhone: row.c_phone, email: row.c_email ?? ((row.raw as any)?.email ?? null) } }
}

export async function getConversations(db: Queryable, ticketId: string): Promise<{ row: ConversationRow; attachments: AttachmentRow[] }[]> {
  const conv = await db.query('SELECT * FROM conversations WHERE ticket_id=$1 ORDER BY commented_time DESC NULLS LAST', [ticketId])
  const att = await db.query('SELECT * FROM attachments WHERE ticket_id=$1', [ticketId])
  const byConv = new Map<string, AttachmentRow[]>()
  for (const a of att.rows as AttachmentRow[]) {
    const k = a.conversation_id ?? ''
    byConv.set(k, [...(byConv.get(k) ?? []), a])
  }
  return (conv.rows as ConversationRow[]).map((row) => ({ row, attachments: byConv.get(row.id) ?? [] }))
}

export async function nextTicketNumber(db: Queryable): Promise<number> {
  const r = await db.query("SELECT nextval('ticket_number_seq') AS n")
  return Number(r.rows[0].n)
}

export interface TransitionRecord {
  ticketId: string; transitionId: string; transitionName: string; fromStatus: string; toStatus: string
  area: string; performedBy: string; values: unknown; commentId: string | null
}
export async function insertTransition(db: Queryable, t: TransitionRecord): Promise<void> {
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [t.ticketId, t.transitionId, t.transitionName, t.fromStatus, t.toStatus, t.area, t.performedBy, J(t.values), t.commentId],
  )
}

export interface TransitionApply {
  status: string
  statusType: string
  columns: Record<string, unknown>
  customFields: Record<string, string | null>
  priority?: string
  comment?: string
}

export async function applyTransition(
  db: Queryable,
  ticketId: string,
  fromStatus: string,
  transition: { id: string; name: string; area: string },
  plan: TransitionApply,
  actor: string,
  values: unknown,
): Promise<void> {
  // 1) Comentario (si lo hay) → conversations
  let commentId: string | null = null
  if (plan.comment) {
    commentId = `app-${randomUUID()}`
    await db.query(
      `INSERT INTO conversations (id,ticket_id,kind,author_name,author_type,is_public,content,content_type,commented_time,source)
       VALUES ($1,$2,'comment',$3,'agent',false,$4,'plainText',now(),'app')`,
      [commentId, ticketId, actor, plan.comment],
    )
  }

  // 2) Update del ticket: estado + columnas tipadas + custom_fields + managed_by_app. Los nombres de
  //    columna provienen de PROMOTED_COLUMNS (confiables, no input de usuario) → no hay inyección.
  const sets = ['status=$2', 'status_type=$3', 'managed_by_app=true', "source='app'", 'modified_time=now()', 'updated_at=now()']
  const params: unknown[] = [ticketId, plan.status, plan.statusType]
  if (plan.priority) { params.push(plan.priority); sets.push(`priority=$${params.length}`) }
  for (const [col, val] of Object.entries(plan.columns)) { params.push(val); sets.push(`${col}=$${params.length}`) }
  if (Object.keys(plan.customFields).length) {
    params.push(JSON.stringify(plan.customFields))
    sets.push(`custom_fields = custom_fields || $${params.length}::jsonb`)
  }
  await db.query(`UPDATE tickets SET ${sets.join(',')} WHERE id=$1`, params)

  // 3) Historial
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [ticketId, transition.id, transition.name, fromStatus, plan.status, transition.area, actor, JSON.stringify(values), commentId],
  )
}
