import type { HistoryEvent, HistoryDetail } from './types'

function findProp(info: any[], name: string): any {
  return (info ?? []).find((p) => p.propertyName === name)?.propertyValue
}
function renderValue(v: any): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(renderValue).join(', ')
  if (typeof v === 'object') {
    if ('previousValue' in v || 'updatedValue' in v) return `${v.previousValue ?? '—'} → ${v.updatedValue ?? '—'}`
    if ('name' in v) return String(v.name).trim()
    return JSON.stringify(v)
  }
  return String(v)
}

const COMMENT_TYPE: Record<string, string> = { Private: 'Privado', Public: 'Público' }
const FIELD_LABEL: Record<string, string> = { Status: 'Estado' }
const EVENT_LABEL: Record<string, string> = { TicketArchived: 'Ticket archivado', TicketRestored: 'Ticket restaurado', AttachmentAdded: 'Adjunto agregado' }

export function mapHistoryEvent(raw: any): HistoryEvent {
  const info: any[] = raw.eventInfo ?? []
  const actorInfo: any[] = raw.actorInfo ?? []
  const actor = (raw.actor?.name ?? 'Sistema').trim() || 'Sistema'
  const time: string | null = raw.eventTime ?? null
  const ev: string = raw.eventName ?? ''
  const details: HistoryDetail[] = []
  let title = ''

  switch (ev) {
    case 'CommentAdded': {
      title = `${actor} ha publicado un comentario`
      const t = findProp(info, 'CommentType')
      if (t) details.push({ label: 'Tipo de comentario', value: COMMENT_TYPE[String(t)] ?? String(t) })
      const c = findProp(info, 'Content')
      if (c) details.push({ label: 'Contenido', value: String(c), html: true })
      break
    }
    case 'TicketUpdated': {
      title = `${actor} ha actualizado el ticket`
      for (const p of info) {
        const v = p.propertyValue
        if (v && typeof v === 'object' && ('previousValue' in v || 'updatedValue' in v)) {
          details.push({ label: FIELD_LABEL[p.propertyName] ?? p.propertyName, value: `cambiado desde ${v.previousValue ?? '—'} a ${v.updatedValue ?? '—'}` })
        } else {
          details.push({ label: p.propertyName, value: renderValue(v) })
        }
      }
      break
    }
    case 'BlueprintApplied': {
      title = 'Blueprint aplicado'
      const b = findProp(info, 'Blueprint')
      if (b) details.push({ label: 'Nombre de blueprint', value: renderValue(b) })
      break
    }
    case 'BlueprintRevoked': {
      title = `Blueprint revocado por ${actor}`
      const b = findProp(info, 'Blueprint')
      if (b) details.push({ label: 'Nombre de blueprint', value: renderValue(b) })
      const f = findProp(info, 'FromState')
      if (f) details.push({ label: 'Desde el estado', value: renderValue(f) })
      break
    }
    case 'BlueprintTransitionPerformed': {
      title = `Transición de blueprint realizada por ${actor}`
      const b = findProp(info, 'Blueprint')
      if (b) details.push({ label: 'Nombre de blueprint', value: renderValue(b) })
      const t = findProp(info, 'Transition')
      if (t) details.push({ label: 'Nombre de transición', value: renderValue(t) })
      break
    }
    case 'NotificationSent': {
      title = 'Notificación de regla aplicada'
      const t = findProp(info, 'NotificationType')
      if (t) details.push({ label: 'Tipo de notificación', value: renderValue(t) })
      const r = findProp(info, 'Recipients')
      if (r) details.push({ label: 'Destinatario', value: renderValue(r) })
      break
    }
    case 'TaskAdded': {
      title = 'Se agregó una tarea'
      for (const p of info) details.push({ label: p.propertyName, value: renderValue(p.propertyValue) })
      break
    }
    default: {
      title = EVENT_LABEL[ev] ?? ev
      for (const p of info) details.push({ label: p.propertyName, value: renderValue(p.propertyValue) })
    }
  }

  const tr = (actorInfo ?? []).find((p) => p.propertyName === 'Transition')?.propertyValue
  if (tr && ev !== 'BlueprintTransitionPerformed') details.push({ label: 'Nombre de transición', value: renderValue(tr) })

  return { eventName: ev, time, actor, title, details }
}
