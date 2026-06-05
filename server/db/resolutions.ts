import { randomUUID } from 'node:crypto'
import sanitizeHtml from 'sanitize-html'
import type { Queryable } from './migrate'
import type { Resolution, ResolutionAttachment } from '../../shared/types'

export async function saveResolution(db: Queryable, ticketId: string, html: string, by: string | null): Promise<void> {
  const clean = sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  })
  await db.query('UPDATE tickets SET resolution_html=$1, resolution_at=now(), resolution_by=$2 WHERE id=$3', [clean, by, ticketId])
}

export async function listResolutionAttachments(db: Queryable, ticketId: string): Promise<ResolutionAttachment[]> {
  const r = await db.query('SELECT id, filename, content_type, size FROM resolution_attachments WHERE ticket_id=$1 ORDER BY created_at ASC', [ticketId])
  return (r.rows as any[]).map((x) => ({ id: x.id, filename: x.filename ?? '', contentType: x.content_type ?? 'application/octet-stream', size: x.size ?? 0 }))
}

export async function getResolution(db: Queryable, ticketId: string): Promise<Resolution> {
  const r = await db.query('SELECT resolution_html, resolution_at, resolution_by FROM tickets WHERE id=$1', [ticketId])
  const row = (r.rows as any[])[0]
  const attachments = await listResolutionAttachments(db, ticketId)
  return { html: row?.resolution_html ?? null, updatedAt: row?.resolution_at ?? null, updatedBy: row?.resolution_by ?? null, attachments }
}

export async function addResolutionAttachment(
  db: Queryable,
  a: { ticketId: string; filename: string; contentType: string; contentB64: string; size: number; by: string | null },
): Promise<ResolutionAttachment> {
  const id = 'res-' + randomUUID()
  await db.query(
    'INSERT INTO resolution_attachments (id,ticket_id,filename,content_type,content_b64,size,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, a.ticketId, a.filename, a.contentType, a.contentB64, a.size, a.by],
  )
  return { id, filename: a.filename, contentType: a.contentType, size: a.size }
}

export async function getResolutionAttachmentContent(db: Queryable, ticketId: string, attId: string): Promise<{ filename: string; contentType: string; contentB64: string } | null> {
  const r = await db.query('SELECT filename, content_type, content_b64 FROM resolution_attachments WHERE id=$1 AND ticket_id=$2', [attId, ticketId])
  const row = (r.rows as any[])[0]
  if (!row) return null
  return { filename: row.filename ?? '', contentType: row.content_type ?? 'application/octet-stream', contentB64: row.content_b64 }
}

export async function deleteResolutionAttachment(db: Queryable, ticketId: string, attId: string): Promise<void> {
  await db.query('DELETE FROM resolution_attachments WHERE id=$1 AND ticket_id=$2', [attId, ticketId])
}
