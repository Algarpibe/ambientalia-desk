import { PROMOTED_COLUMNS, type TicketRow, type AccountRow, type ContactRow, type AgentRow, type ConversationRow, type AttachmentRow } from './rows'

function toBool(v: unknown): boolean | null {
  if (v === undefined || v === null || v === '') return null
  return v === true || v === 'true' || v === 'Sí' || v === 'si'
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

export function ticketRowFromZoho(raw: any): TicketRow {
  const cf: Record<string, string | null> = { ...(raw.customFields ?? {}) }
  const row: Partial<TicketRow> = {
    id: raw.id, number: Number(raw.ticketNumber), subject: raw.subject ?? null,
    status: raw.status, status_type: raw.statusType ?? null, priority: raw.priority ?? null,
    classification: raw.classification ?? null, channel: raw.channel ?? null,
    description: raw.description ?? null,
    contact_id: raw.contactId ?? null, account_id: raw.accountId ?? null, assignee_id: raw.assigneeId ?? null,
    created_time: raw.createdTime ?? null, modified_time: raw.modifiedTime ?? null,
    closed_time: raw.closedTime ?? null, onhold_time: raw.onholdTime ?? null, due_date: raw.dueDate ?? null,
    custom_fields: {}, managed_by_app: false, source: 'zoho', raw,
  }
  for (const { col, label, kind } of PROMOTED_COLUMNS) {
    const v = (raw.customFields ?? {})[label]
    ;(row as any)[col] = kind === 'bool' ? toBool(v) : kind === 'int' ? toInt(v) : kind === 'date' ? dateOnly(v) : str(v)
    delete cf[label] // no duplicar en custom_fields
  }
  row.custom_fields = cf
  return row as TicketRow
}

export function accountRowFromZoho(raw: any): AccountRow {
  return {
    id: raw.id, name: raw.accountName ?? '', nit: raw.cf?.cf_nit ?? raw.customFields?.NIT ?? null,
    email: raw.email ?? null, phone: raw.phone ?? null, website: raw.website ?? null,
    city: raw.city ?? null, address: raw.street ?? null, industry: raw.industry ?? null,
    source: 'zoho', managed_by_app: false, raw,
  }
}

export function contactRowFromZoho(raw: any): ContactRow {
  return {
    id: raw.id, first_name: raw.firstName ?? null, last_name: raw.lastName ?? null,
    email: raw.email ?? null, phone: raw.phone ?? null, mobile: raw.mobile ?? null,
    account_id: raw.accountId ?? null, source: 'zoho', managed_by_app: false, raw,
  }
}

export function agentRowFromZoho(raw: any): AgentRow {
  const name = [raw.firstName, raw.lastName].filter(Boolean).join(' ').trim() || (raw.name ?? null)
  return { id: raw.id, name, email: raw.email ?? null, role: raw.roleName ?? null, source: 'zoho', raw }
}

export function conversationRowFromZoho(raw: any, ticketId: string): ConversationRow {
  const authorName = raw.commenter?.name ?? raw.author?.name ?? null
  const authorType = (raw.commenter?.type ?? raw.author?.type) === 'AGENT' ? 'agent' : raw.commenter || raw.author ? 'end_user' : null
  const isPublic = raw.visibility === 'public' || raw.isPublic === true || raw.isPublic === 'true'
  return {
    id: raw.id, ticket_id: ticketId, kind: raw.type ?? 'comment', author_name: authorName,
    author_type: authorType, is_public: isPublic, content: (raw.content ?? raw.summary ?? null),
    content_type: raw.contentType ?? null, commented_time: raw.commentedTime ?? raw.createdTime ?? null,
    source: 'zoho', raw,
  }
}

function attachmentPath(href?: string | null): string | null {
  if (!href) return null
  try { return new URL(href).pathname.replace(/^\/api\/v1/, '') } catch { return null }
}

export function attachmentRowsFrom(conv: any, ticketId: string): AttachmentRow[] {
  return (conv.attachments ?? []).filter((a: any) => a?.id).map((a: any) => ({
    id: a.id, conversation_id: conv.id ?? null, ticket_id: ticketId, name: a.name ?? null,
    size: a.size ? Number(a.size) : null, content_type: a.contentType ?? null,
    zoho_href: attachmentPath(a.href), storage_path: null, raw: a,
  }))
}

import type { Ticket, TicketDetail, Message, Attachment } from '../../shared/types'

function initialsOf(name: string): string {
  const p = name.split(/\s+/).filter(Boolean)
  if (p.length === 0) return '?'
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase()
  return (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function fmtTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}
function fmtSize(n?: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

export interface TicketRefs { accountName?: string | null; agentName?: string | null }
export interface DetailRefs extends TicketRefs { contactName?: string | null; contactPhone?: string | null; email?: string | null }

export function rowToTicket(row: TicketRow, refs: TicketRefs = {}): Ticket {
  const assigneeName = refs.agentName || 'Sin asignar'
  return {
    id: row.id, number: `#${row.number}`, title: row.subject ?? '', company: refs.accountName ?? '',
    time: fmtTime(row.created_time), status: row.status,
    assignee: { name: assigneeName, initials: initialsOf(assigneeName) },
    urgent: row.priority === 'High' || row.priority === 'Urgent',
  }
}

/** Reconstruye el objeto customFields (etiqueta→valor) que la UI espera, desde columnas + jsonb. */
function customFieldsFromRow(row: TicketRow): Record<string, string | null> {
  const out: Record<string, string | null> = { ...(row.custom_fields ?? {}) }
  for (const { col, label } of PROMOTED_COLUMNS) {
    const v = (row as any)[col]
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
