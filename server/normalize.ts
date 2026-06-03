import type { Ticket, TicketDetail, Message, ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

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
  const company = raw.accountName || raw.contact?.accountName || fullName(raw.contact) || ''
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

/** Detalle completo para el panel de propiedades (incluye customFields tal cual). */
export function normalizeTicketDetail(raw: ZohoTicketRaw): TicketDetail {
  return {
    ...normalizeTicket(raw),
    contactName: fullName(raw.contact) || undefined,
    email: raw.email ?? raw.contact?.email ?? undefined,
    phone: raw.phone ?? raw.contact?.phone ?? undefined,
    ownerName: fullName(raw.assignee) || undefined,
    onholdSince: raw.onholdTime ? formatTime(raw.onholdTime) : undefined,
    classification: raw.classification ?? undefined,
    priority: raw.priority ?? undefined,
    channel: raw.channel ?? undefined,
    customFields: raw.customFields ?? {},
  }
}

function formatSize(bytes?: string | number | null): string {
  const n = Number(bytes)
  if (!n || Number.isNaN(n)) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** Extrae la ruta para el proxy /api/attachment desde el href absoluto de Zoho. */
function attachmentPath(href?: string | null): string {
  if (!href) return ''
  try {
    return new URL(href).pathname.replace(/^\/api\/v1/, '')
  } catch {
    return ''
  }
}

export function normalizeConversation(raw: ZohoConversationRaw): Message {
  // El feed real trae commenter.name (comentarios) o author.name (hilos).
  const author =
    raw.commenter?.name || raw.author?.name || raw.commenterName || raw.authorName || 'Desconocido'
  const isPublic =
    raw.visibility === 'public' || raw.isPublic === true || raw.isPublic === 'true'
  const time = formatTime(raw.commentedTime || raw.createdTime || '')
  const attachments = (raw.attachments ?? [])
    .filter((a) => a?.href)
    .map((a) => ({ name: a.name ?? 'adjunto', size: formatSize(a.size), path: attachmentPath(a.href) }))
    .filter((a) => a.path)
  return {
    id: raw.id,
    author,
    type: isPublic ? 'Público' : 'Privado',
    time,
    content: (raw.content || raw.summary || '').toString(),
    isHtml: raw.contentType === 'html' || raw.contentType === 'text/html',
    attachments: attachments.length ? attachments : undefined,
  }
}
