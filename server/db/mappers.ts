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
