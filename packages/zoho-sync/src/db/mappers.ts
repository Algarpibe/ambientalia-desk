import { PROMOTED_COLUMNS, type TicketRow, type AccountRow, type ContactRow, type AgentRow, type ConversationRow, type AttachmentRow, type ActivityRow } from './rows'
import { extractServiceCode } from '@ambientalia/shared'

function toBool(v: unknown): boolean | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v === 'boolean') return v
  // Zoho mezcla "true"/"false" y "Sí"/"No" (a veces sin tilde). Normalizamos.
  const s = String(v).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (['true', 'si', 'yes', 'y', '1'].includes(s)) return true
  if (['false', 'no', 'n', '0'].includes(s)) return false
  return null
}
function toInt(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v); return Number.isNaN(n) ? null : n
}
function dateOnly(v: unknown): string | null {
  if (!v) return null
  return String(v).slice(0, 10) // "2026-05-19" o ISO → YYYY-MM-DD
}
function str(v: unknown): string | null {
  return v === undefined || v === null ? null : String(v)
}

export function ticketRowFromZoho(raw: Record<string, unknown>): TicketRow {
  const customFields = (raw.customFields ?? {}) as Record<string, unknown>
  const cf: Record<string, string | null> = { ...(customFields as Record<string, string | null>) }
  const row: Partial<TicketRow> = {
    id: raw.id as string, number: Number(raw.ticketNumber), subject: (raw.subject as string) ?? null,
    status: raw.status as string, status_type: (raw.statusType as string) ?? null, priority: (raw.priority as string) ?? null,
    classification: (raw.classification as string) ?? null, channel: (raw.channel as string) ?? null,
    description: (raw.description as string) ?? null,
    contact_id: (raw.contactId as string) ?? null, account_id: (raw.accountId as string) ?? null, assignee_id: (raw.assigneeId as string) ?? null,
    created_time: (raw.createdTime as string) ?? null, modified_time: (raw.modifiedTime as string) ?? null,
    closed_time: (raw.closedTime as string) ?? null, onhold_time: (raw.onholdTime as string) ?? null, due_date: (raw.dueDate as string) ?? null,
    custom_fields: {}, managed_by_app: false, source: 'zoho', raw,
  }
  for (const { col, label, kind } of PROMOTED_COLUMNS) {
    const v = customFields[label]
    ;(row as Record<string, unknown>)[col] = kind === 'bool' ? toBool(v) : kind === 'int' ? toInt(v) : kind === 'date' ? dateOnly(v) : str(v)
    delete cf[label] // no duplicar en custom_fields
  }
  row.custom_fields = cf
  // Históricos de Zoho: si el serial/código no vienen en customFields, extraerlos del asunto.
  const ext = extractServiceCode(row.subject)
  if (ext) {
    if (!row.serial) row.serial = ext.serial
    if (!row.codigo_servicio) row.codigo_servicio = ext.codigo
  }
  return row as TicketRow
}

export function accountRowFromZoho(raw: Record<string, unknown>): AccountRow {
  const cfNested = raw.cf as Record<string, unknown> | undefined
  const customFields = raw.customFields as Record<string, unknown> | undefined
  return {
    id: raw.id as string, name: (raw.accountName as string) ?? '', nit: (cfNested?.cf_nit as string) ?? (customFields?.NIT as string) ?? null,
    email: (raw.email as string) ?? null, phone: (raw.phone as string) ?? null, website: (raw.website as string) ?? null,
    city: (raw.city as string) ?? null, address: (raw.street as string) ?? null, industry: (raw.industry as string) ?? null,
    source: 'zoho', managed_by_app: false, raw,
  }
}

export function contactRowFromZoho(raw: Record<string, unknown>): ContactRow {
  return {
    id: raw.id as string, first_name: (raw.firstName as string) ?? null, last_name: (raw.lastName as string) ?? null,
    email: (raw.email as string) ?? null, phone: (raw.phone as string) ?? null, mobile: (raw.mobile as string) ?? null,
    account_id: (raw.accountId as string) ?? null, modified_time: (raw.modifiedTime as string) ?? null, source: 'zoho', managed_by_app: false, raw,
  }
}

export function agentRowFromZoho(raw: Record<string, unknown>): AgentRow {
  const name = [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() || ((raw.name as string) ?? null)
  return { id: raw.id as string, name, email: (raw.email as string) ?? null, role: (raw.roleName as string) ?? null, source: 'zoho', raw }
}

export function conversationRowFromZoho(raw: Record<string, unknown>, ticketId: string): ConversationRow {
  const commenter = raw.commenter as Record<string, unknown> | undefined
  const author = raw.author as Record<string, unknown> | undefined
  const authorName = (commenter?.name as string) ?? (author?.name as string) ?? null
  const authorType = (commenter?.type ?? author?.type) === 'AGENT' ? 'agent' : commenter || author ? 'end_user' : null
  const isPublic = raw.visibility === 'public' || raw.isPublic === true || raw.isPublic === 'true'
  return {
    id: raw.id as string, ticket_id: ticketId, kind: (raw.type as string) ?? 'comment', author_name: authorName,
    author_type: authorType, is_public: isPublic, content: ((raw.content as string) ?? (raw.summary as string) ?? null),
    content_type: (raw.contentType as string) ?? null, commented_time: (raw.commentedTime as string) ?? (raw.createdTime as string) ?? null,
    source: 'zoho', raw,
  }
}

function attachmentPath(href?: string | null): string | null {
  if (!href) return null
  try { return new URL(href).pathname.replace(/^\/api\/v1/, '') } catch { return null }
}

export function attachmentRowsFrom(conv: Record<string, unknown>, ticketId: string): AttachmentRow[] {
  const atts = Array.isArray(conv.attachments) ? (conv.attachments as Record<string, unknown>[]) : []
  return atts.filter((a) => a?.id).map((a) => ({
    id: a.id as string, conversation_id: (conv.id as string) ?? null, ticket_id: ticketId, name: (a.name as string) ?? null,
    size: a.size ? Number(a.size) : null, content_type: (a.contentType as string) ?? null,
    zoho_href: attachmentPath(a.href as string | null | undefined), storage_path: null, raw: a,
  }))
}

import type { Ticket, TicketDetail, Message, Attachment, Activity } from '@ambientalia/shared'

export function activityRowFromZoho(raw: Record<string, unknown>): ActivityRow {
  const owner = (raw.assignee ?? raw.owner ?? null) as Record<string, unknown> | null
  const ownerName = owner ? ([owner.firstName, owner.lastName].filter(Boolean).join(' ').trim() || null) : null
  const ticket = raw.ticket as Record<string, unknown> | undefined
  return {
    id: raw.id as string, ticket_id: (raw.ticketId as string) ?? (ticket?.id as string) ?? null,
    subject: (raw.subject as string) ?? null, status: (raw.status as string) ?? null, status_type: (raw.statusType as string) ?? null,
    priority: (raw.priority as string) ?? null, due_date: (raw.dueDate as string) ?? null, created_time: (raw.createdTime as string) ?? null,
    modified_time: (raw.modifiedTime as string) ?? null, completed_time: (raw.completedTime as string) ?? null,
    owner_id: (raw.ownerId as string) ?? null, owner_name: ownerName, raw,
  }
}

/** Fila de actividad tal como la devuelve el JOIN de Postgres (puede traer agent_name). */
type ActivityQueryRow = Pick<
  ActivityRow,
  'id' | 'ticket_id' | 'subject' | 'status' | 'status_type' | 'priority' | 'due_date' | 'created_time' | 'completed_time' | 'owner_name'
> & { agent_name?: string | null }

export function rowToActivity(row: ActivityQueryRow): Activity {
  return {
    id: row.id, ticketId: row.ticket_id ?? null, subject: row.subject ?? '',
    status: row.status ?? '', statusType: row.status_type ?? null, priority: row.priority ?? null,
    dueDate: row.due_date ?? null, createdAt: row.created_time ?? null, completedAt: row.completed_time ?? null,
    owner: row.owner_name ?? row.agent_name ?? null,
  }
}

function initialsOf(name: string): string {
  const p = name.split(/\s+/).filter(Boolean)
  if (p.length === 0) return '?'
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
/**
 * Zona horaria en la que se muestran las fechas. Se fija de forma explícita porque este formateo
 * ocurre en el SERVIDOR, y el contenedor corre en UTC: sin ella, un ticket creado a las 14:11 de
 * Colombia se mostraba como las 07:11 p. m. (El resto de fechas se formatean en el navegador, que
 * ya usa la zona del usuario.)
 */
const TZ_VISUALIZACION = 'America/Bogota'

/** Hora de un mensaje, en la zona de visualización. Exportada porque el hilo generado tiene que
 *  formatear igual que las conversaciones de Zoho, o se notaría cuál es cuál. */
export function fmtTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: TZ_VISUALIZACION,
  }).format(d)
}
function fmtSize(n?: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

export interface TicketRefs { accountName?: string | null; agentName?: string | null; contactName?: string | null; read?: boolean }
export interface DetailRefs extends TicketRefs { contactPhone?: string | null; email?: string | null }

export function rowToTicket(row: TicketRow, refs: TicketRefs = {}): Ticket {
  const assigneeName = refs.agentName || 'Sin asignar'
  return {
    id: row.id, number: `#${row.number}`, title: row.subject ?? '', company: refs.accountName ?? '',
    time: fmtTime(row.created_time), status: row.status,
    assignee: { name: assigneeName, initials: initialsOf(assigneeName) },
    urgent: row.priority === 'High' || row.priority === 'Urgent',
    priority: row.priority ?? null,
    statusType: row.status_type ?? null,
    dueDate: row.due_date ?? null,
    createdAt: row.created_time ?? null,
    channel: row.channel ?? null,
    diasEntrega: row.dias_entrega == null ? null : String(row.dias_entrega),
    contactName: refs.contactName ?? null,
    contactId: row.contact_id ?? null,
    accountId: row.account_id ?? null,
    read: refs.read ?? false,
  }
}

/** Reconstruye el objeto customFields (etiqueta→valor) que la UI espera, desde columnas + jsonb. */
function customFieldsFromRow(row: TicketRow): Record<string, string | null> {
  const out: Record<string, string | null> = { ...(row.custom_fields ?? {}) }
  for (const { col, label } of PROMOTED_COLUMNS) {
    const v = (row as unknown as Record<string, unknown>)[col]
    out[label] = v === null || v === undefined ? null : String(v)
  }
  return out
}

export function rowToTicketDetail(row: TicketRow, refs: DetailRefs = {}): TicketDetail {
  return {
    ...rowToTicket(row, refs),
    contactName: refs.contactName ?? undefined,
    email: refs.email ?? undefined,
    phone: refs.contactPhone ?? undefined,
    ownerName: refs.agentName ?? undefined,
    onholdSince: row.onhold_time ? fmtTime(row.onhold_time) : undefined,
    classification: row.classification ?? undefined,
    priority: row.priority ?? undefined,
    channel: row.channel ?? undefined,
    equipoId: row.equipo_id ?? undefined,
    clientId: row.client_id ?? undefined,
    customFields: customFieldsFromRow(row),
  }
}

export function rowToMessage(row: ConversationRow, attachments: AttachmentRow[]): Message {
  const atts: Attachment[] = attachments
    .filter((a) => a.zoho_href)
    .map((a) => ({ name: a.name ?? 'adjunto', size: fmtSize(a.size), path: a.zoho_href! }))
  return {
    id: row.id, author: row.author_name ?? 'Desconocido',
    type: row.is_public ? 'Público' : 'Privado', time: fmtTime(row.commented_time),
    content: row.content ?? '', isHtml: row.content_type === 'html' || row.content_type === 'text/html',
    attachments: atts.length ? atts : undefined,
  }
}
