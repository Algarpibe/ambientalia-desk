import type { ZohoTicketRaw, ZohoConversationRaw } from '../../shared/types'

export interface TicketRow {
  id: string
  ticket_number: string
  status: string
  status_type: string
  created_time: string | null
  modified_time: string | null
  raw: ZohoTicketRaw
}

export interface ConversationRow {
  id: string
  ticket_id: string
  commented_time: string | null
  raw: ZohoConversationRaw
}

export function ticketRowFromZoho(raw: ZohoTicketRaw & { modifiedTime?: string }): TicketRow {
  return {
    id: raw.id,
    ticket_number: raw.ticketNumber,
    status: raw.status,
    status_type: raw.statusType,
    created_time: raw.createdTime ?? null,
    modified_time: raw.modifiedTime ?? null,
    raw,
  }
}

export function conversationRowFromZoho(raw: ZohoConversationRaw, ticketId: string): ConversationRow {
  return {
    id: raw.id,
    ticket_id: ticketId,
    commented_time: raw.commentedTime ?? raw.createdTime ?? null,
    raw,
  }
}
