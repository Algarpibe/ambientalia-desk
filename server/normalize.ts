import type { Ticket, Message, ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

function fullName(p?: { firstName?: string | null; lastName?: string | null } | null): string {
  if (!p) return ''
  return [p.firstName, p.lastName].filter(Boolean).join(' ').trim()
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function normalizeTicket(raw: ZohoTicketRaw): Ticket {
  const assigneeName = fullName(raw.assignee) || 'Sin asignar'
  const company = raw.contact?.accountName || fullName(raw.contact) || ''
  return {
    id: raw.id,
    number: `#${raw.ticketNumber}`,
    title: raw.subject,
    company,
    time: formatTime(raw.createdTime),
    status: raw.status,
    assignee: {
      name: assigneeName,
      avatar: raw.assignee?.photoURL ?? undefined,
      initials: initialsOf(assigneeName),
    },
    urgent: raw.priority === 'High' || raw.priority === 'Urgent',
    messages: raw.commentCount ? Number(raw.commentCount) : undefined,
  }
}

export function normalizeConversation(raw: ZohoConversationRaw): Message {
  const author =
    raw.commenterName || raw.authorName || raw.author?.name || 'Desconocido'
  const isPublic =
    raw.visibility === 'public' || raw.isPublic === true || raw.isPublic === 'true'
  const time = formatTime(raw.commentedTime || raw.createdTime || '')
  return {
    id: raw.id,
    author,
    type: isPublic ? 'Público' : 'Privado',
    time,
    content: (raw.content || raw.summary || '').toString(),
  }
}
