import { randomUUID } from 'node:crypto'
import { FROM_STATUS_CREACION, STATUS_TICKET_CREADO, PREFIJO_TICKET_APP } from '@ambientalia/shared'
import { APP_TICKET_NUMBER_BASE, type Queryable } from './migrate'
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
  const existing = await db.query('SELECT managed_by_app FROM contacts WHERE id=$1', [r.id])
  if (existing.rows[0]?.managed_by_app === true) return
  await db.query(
    `INSERT INTO contacts (id,first_name,last_name,email,phone,mobile,account_id,modified_time,source,managed_by_app,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now())
     ON CONFLICT (id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,email=EXCLUDED.email,
       phone=EXCLUDED.phone,mobile=EXCLUDED.mobile,account_id=EXCLUDED.account_id,modified_time=EXCLUDED.modified_time,
       raw=EXCLUDED.raw,synced_at=now(),updated_at=now()`,
    [r.id, r.first_name, r.last_name, r.email, r.phone, r.mobile, r.account_id, r.modified_time, r.source, r.managed_by_app, J(r.raw)],
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

// ⚠️ `derivado_a` NO está aquí a propósito, y no es un olvido: es un concepto de la app que Zoho no
// conoce y nunca manda. Incluirla haría que cada pasada del sync la reescribiera a NULL y el ticket
// perdiera a su responsable solo. Hay un test que lo fija («el sync de Zoho NO pisa la derivación»).
export const TICKET_COLS = [
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

export async function setTicketRead(db: Queryable, userId: string, ticketId: string, read: boolean): Promise<void> {
  await db.query('DELETE FROM ticket_reads WHERE user_id=$1 AND ticket_id=$2', [userId, ticketId])
  if (read) await db.query('INSERT INTO ticket_reads (user_id, ticket_id, read_at) VALUES ($1,$2,now())', [userId, ticketId])
}

function mapTicketRowWithRefs(row: any): TicketWithRefs {
  return { row: row as TicketRow, refs: { accountName: row.account_name, agentName: row.agent_name, contactName: [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null, read: row.read_at != null && (row.modified_time == null || new Date(row.read_at) >= new Date(row.modified_time)), derivadoNombre: row.derivado_nombre, derivadoCargo: row.derivado_cargo } }
}

export async function getActiveTickets(db: Queryable, userId = ''): Promise<TicketWithRefs[]> {
  const r = await db.query(
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name, c.first_name AS c_first, c.last_name AS c_last, tr.read_at,
            du.name AS derivado_nombre, du.cargo AS derivado_cargo
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     LEFT JOIN contacts c ON t.contact_id=c.id
     LEFT JOIN users du ON t.derivado_a=du.id
     LEFT JOIN ticket_reads tr ON tr.ticket_id=t.id AND tr.user_id=$1
     WHERE (t.status_type <> 'Closed' OR t.status_type IS NULL) ORDER BY t.created_time DESC NULLS LAST`,
    [userId],
  )
  return r.rows.map(mapTicketRowWithRefs)
}

export async function getClosedTickets(db: Queryable, userId = '', limit = 50, offset = 0): Promise<TicketWithRefs[]> {
  const r = await db.query(
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name, c.first_name AS c_first, c.last_name AS c_last, tr.read_at,
            du.name AS derivado_nombre, du.cargo AS derivado_cargo
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     LEFT JOIN contacts c ON t.contact_id=c.id
     LEFT JOIN users du ON t.derivado_a=du.id
     LEFT JOIN ticket_reads tr ON tr.ticket_id=t.id AND tr.user_id=$1
     WHERE t.status_type = 'Closed' ORDER BY t.created_time DESC NULLS LAST LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  )
  return r.rows.map(mapTicketRowWithRefs)
}

export async function countClosedTickets(db: Queryable): Promise<number> {
  const r = await db.query(`SELECT count(*)::int AS n FROM tickets WHERE status_type = 'Closed'`)
  return r.rows[0]?.n ?? 0
}

export async function getAllTickets(db: Queryable, userId = ''): Promise<TicketWithRefs[]> {
  const r = await db.query(
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name, c.first_name AS c_first, c.last_name AS c_last, tr.read_at,
            du.name AS derivado_nombre, du.cargo AS derivado_cargo
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     LEFT JOIN contacts c ON t.contact_id=c.id
     LEFT JOIN users du ON t.derivado_a=du.id
     LEFT JOIN ticket_reads tr ON tr.ticket_id=t.id AND tr.user_id=$1
     ORDER BY t.created_time DESC NULLS LAST`,
    [userId],
  )
  return r.rows.map(mapTicketRowWithRefs)
}

export async function getTicketWithRefs(db: Queryable, id: string): Promise<{ row: TicketRow; refs: DetailRefs } | null> {
  const r = await db.query(
    // `du` es la persona DERIVADA (usuario de la app); `g` es el propietario en Zoho. Son dos
    // conceptos distintos que conviven, y por eso hacen falta los dos joins.
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name,
            c.first_name AS c_first, c.last_name AS c_last, c.phone AS c_phone, c.email AS c_email,
            du.name AS derivado_nombre, du.cargo AS derivado_cargo
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN contacts c ON t.contact_id=c.id
     LEFT JOIN users du ON t.derivado_a=du.id
     LEFT JOIN clients cl ON t.client_id=cl.id WHERE t.id=$1`,
    [id],
  )
  const row = r.rows[0]
  if (!row) return null
  const contactName = [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null
  return {
    row: row as TicketRow,
    refs: {
      accountName: row.account_name, agentName: row.agent_name, contactName,
      contactPhone: row.c_phone, email: row.c_email ?? ((row.raw as any)?.email ?? null),
      derivadoNombre: row.derivado_nombre, derivadoCargo: row.derivado_cargo,
    },
  }
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

/**
 * Número que se asignaría al próximo ticket de la app, SIN consumir la secuencia (para mostrarlo
 * en el formulario antes de crear).
 *
 * Replica el cálculo de `reseedTicketNumber` en vez de leer la secuencia porque pg-mem no permite
 * `SELECT ... FROM <secuencia>` (verificado), y así el camino queda cubierto por tests. Es una
 * PREVISIÓN, no una reserva: el número real lo asigna `nextval` de forma atómica al crear, así que
 * puede diferir si otro usuario crea un ticket entremedias o si algún número se quemó en un
 * rollback (ver M-6 en debt.md).
 */
export async function previewTicketNumber(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COALESCE(MAX(number),0) AS m FROM tickets WHERE managed_by_app = true')
  return Math.max(Number(r.rows[0].m), APP_TICKET_NUMBER_BASE - 1) + 1
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

type Transitionish = { id: string; name: string; area: string }
interface PoolLike extends Queryable {
  connect?: () => Promise<{ query: Queryable['query']; release: () => void }>
}

// Las 3 escrituras de una transición sobre el mismo `q` (pool o cliente de transacción).
async function writeTransition(
  q: Queryable,
  ticketId: string,
  fromStatus: string,
  transition: Transitionish,
  plan: TransitionApply,
  actor: string,
  values: unknown,
): Promise<void> {
  // 1) Comentario (si lo hay) → conversations
  let commentId: string | null = null
  if (plan.comment) {
    commentId = `app-${randomUUID()}`
    await q.query(
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
  await q.query(`UPDATE tickets SET ${sets.join(',')} WHERE id=$1`, params)

  // 3) Historial
  await q.query(
    `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [ticketId, transition.id, transition.name, fromStatus, plan.status, transition.area, actor, JSON.stringify(values), commentId],
  )
}

/** Aplica una transición (comentario + update + historial) de forma atómica (transacción si el pool lo permite). */
export async function applyTransition(
  db: Queryable,
  ticketId: string,
  fromStatus: string,
  transition: Transitionish,
  plan: TransitionApply,
  actor: string,
  values: unknown,
): Promise<void> {
  const pool = db as PoolLike
  if (typeof pool.connect !== 'function') {
    await writeTransition(db, ticketId, fromStatus, transition, plan, actor, values)
    return
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await writeTransition(client, ticketId, fromStatus, transition, plan, actor, values)
    await client.query('COMMIT')
  } catch (e) {
    try { await client.query('ROLLBACK') } catch { /* ignora fallo de rollback */ }
    throw e
  } finally {
    client.release()
  }
}

/**
 * El ticket que YA usa esa orden de venta, o null si está libre. Una OV pertenece a un solo
 * servicio: la misma orden en dos tickets deja el trabajo facturado dos veces contra el mismo
 * pedido, y nadie sabe cuál de los dos es el bueno.
 *
 * Mira las DOS vías por lo mismo que `searchSalesOrders(soloLibres)`: no siempre hay
 * `salesorder_id` —solo lo deja quien eligió la OV en un buscador—, y los tickets venidos de Zoho o
 * creados tecleando el número únicamente tienen `orden_venta`.
 *
 * `excluirTicketId` deja fuera al propio ticket: reconfirmar la OV que uno ya tiene no es
 * duplicarla, y sin esta salvedad Habilitar Servicio se bloquearía justo para los tickets que
 * llegan de Zoho con su orden ya puesta.
 */
export async function ticketConOrdenVenta(
  db: Queryable,
  ov: { salesorderId?: string | null; numero?: string | null },
  excluirTicketId?: string | null,
): Promise<{ id: string; number: number } | null> {
  const params: unknown[] = []
  const vias: string[] = []
  if (ov.salesorderId) { params.push(ov.salesorderId); vias.push(`salesorder_id = $${params.length}`) }
  if (ov.numero) { params.push(ov.numero); vias.push(`(COALESCE(orden_venta,'') <> '' AND orden_venta = $${params.length})`) }
  if (!vias.length) return null
  let exclusion = ''
  if (excluirTicketId) { params.push(excluirTicketId); exclusion = `AND id <> $${params.length}` }
  const r = await db.query(
    `SELECT id, number FROM tickets WHERE (${vias.join(' OR ')}) ${exclusion} ORDER BY number LIMIT 1`,
    params,
  )
  return r.rows[0] ? { id: String(r.rows[0].id), number: Number(r.rows[0].number) } : null
}

export interface CreateTicketInput {
  subject: string
  codigoServicio: string | null
  classification: string | null
  tipoServicio: string | null
  equipo: string | null
  marca: string | null
  modelo: string | null
  serial: string | null
  ordenVenta: string | null
  /**
   * La fecha de esa orden, tal como la trae Books. Va junto al número y no se deduce después:
   * «Habilitar Servicio» enseña el campo de la orden BLOQUEADO cuando el ticket ya la trae, y con él
   * bloqueado no se pinta el buscador de órdenes, que es lo único que rellena esta fecha. Sin
   * guardarla aquí, el campo se queda vacío y sin forma de llenarlo.
   */
  fechaOrdenVenta?: string | null
  priority: string | null
  clientId: string
  salesorderId: string | null
  equipoId: string | null
  actor: string
}

/**
 * Crea un ticket gestionado por la app en "Ticket creado" + su transición #1, de forma atómica.
 *
 * El estado NO es el 'OV asignada' de Zoho: esa es la misma fase con el nombre que le da el Blueprint
 * de allí, y se conserva para lo que sigue llegando por el sync (ver `STATUS_OV_ASIGNADA`). Lo que
 * nace aquí usa el nombre que la fase tiene de verdad para el servicio técnico.
 */
export async function createTicket(db: Queryable, input: CreateTicketInput, opts: { transaccionAbierta?: boolean } = {}): Promise<string> {
  const id = `${PREFIJO_TICKET_APP}${randomUUID()}`
  const number = await nextTicketNumber(db)
  const run = async (q: Queryable): Promise<void> => {
    await q.query(
      `INSERT INTO tickets (id,number,subject,status,status_type,priority,classification,tipo_servicio,equipo,marca,modelo,serial,codigo_servicio,orden_venta,fecha_orden_venta,client_id,salesorder_id,equipo_id,managed_by_app,source,created_time,modified_time,updated_at)
       VALUES ($1,$2,$3,$16,'Open',$4,$5,$6,$7,$8,$9,$10,$11,$12,$17,$13,$14,$15,true,'app',now(),now(),now())`,
      [id, number, input.subject, input.priority, input.classification, input.tipoServicio, input.equipo, input.marca, input.modelo, input.serial, input.codigoServicio, input.ordenVenta, input.clientId, input.salesorderId, input.equipoId, STATUS_TICKET_CREADO, input.fechaOrdenVenta ?? null],
    )
    // La foto de con qué nació el ticket. Las columnas de `tickets` son estado ACTUAL, así que la
    // historia no puede apoyarse en ellas para contar la creación: aquí queda congelado. Los tickets
    // anteriores a este cambio no la tienen y no hay forma de reconstruirla — la historia cae a la
    // fila del ticket para esos.
    await q.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
       VALUES ($1,'enviar','Enviar',$2,$5,'Comercial',$3,$4,null)`,
      [id, FROM_STATUS_CREACION, input.actor, JSON.stringify({
        orden_venta: input.ordenVenta, marca: input.marca, modelo: input.modelo, serial: input.serial,
        equipo: input.equipo, tipo_servicio: input.tipoServicio, clasificacion: input.classification,
        prioridad: input.priority, codigo_servicio: input.codigoServicio, client_id: input.clientId,
      }), STATUS_TICKET_CREADO],
    )
  }
  const pool = db as PoolLike
  if (opts.transaccionAbierta || typeof pool.connect !== 'function') { await run(db); return id }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await run(client)
    await client.query('COMMIT')
  } catch (e) {
    try { await client.query('ROLLBACK') } catch { /* ignora fallo de rollback */ }
    throw e
  } finally {
    client.release()
  }
  return id
}
