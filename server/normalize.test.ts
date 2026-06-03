import { describe, it, expect } from 'vitest'
import { normalizeTicket, normalizeTicketDetail, normalizeConversation } from './normalize'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

const raw: ZohoTicketRaw = {
  id: '495552000009514385',
  ticketNumber: '864',
  subject: 'Servicio Técnico AGQ Colombia',
  status: 'Ingresado',
  statusType: 'Open',
  priority: 'High',
  createdTime: '2026-01-25T20:44:00.000Z',
  commentCount: '3',
  threadCount: '1',
  contact: { firstName: 'Mauricio', lastName: 'Tovar', accountName: 'AGQ Colombia S.A.S.' },
  assignee: { firstName: 'David', lastName: 'León', photoURL: 'http://x/a.png' },
}

describe('normalizeTicket', () => {
  it('mapea campos básicos', () => {
    const t = normalizeTicket(raw)
    expect(t.id).toBe('495552000009514385')
    expect(t.number).toBe('#864')
    expect(t.title).toBe('Servicio Técnico AGQ Colombia')
    expect(t.status).toBe('Ingresado')
    expect(t.company).toBe('AGQ Colombia S.A.S.')
  })

  it('compone nombre, iniciales y avatar del asignado', () => {
    const t = normalizeTicket(raw)
    expect(t.assignee?.name).toBe('David León')
    expect(t.assignee?.initials).toBe('DL')
    expect(t.assignee?.avatar).toBe('http://x/a.png')
  })

  it('marca urgente por prioridad alta y cuenta mensajes', () => {
    const t = normalizeTicket(raw)
    expect(t.urgent).toBe(true)
    expect(t.messages).toBe(3)
  })

  it('usa "Sin asignar" cuando no hay assignee', () => {
    const t = normalizeTicket({ ...raw, assignee: null })
    expect(t.assignee?.name).toBe('Sin asignar')
    expect(t.assignee?.initials).toBe('SA')
  })

  it('prefiere accountName del ticket (inyectado por el sync) como empresa', () => {
    const t = normalizeTicket({ ...raw, accountName: 'Gecelca S.A. E.S.P.' })
    expect(t.company).toBe('Gecelca S.A. E.S.P.')
  })
})

describe('normalizeTicketDetail', () => {
  it('incluye contacto, clasificación y customFields', () => {
    const d = normalizeTicketDetail({
      ...raw,
      email: 'slaguna@gecelca.com.co',
      classification: 'Equipo Para Servicio',
      channel: 'Email',
      contact: { firstName: 'Sebastián', lastName: 'Laguna', phone: '301 5297268', accountName: 'Gecelca S.A. E.S.P.' },
      customFields: { 'Serial': '18A22053', 'Ciudad': 'Barranquilla' },
    } as any)
    expect(d.number).toBe('#864')
    expect(d.contactName).toBe('Sebastián Laguna')
    expect(d.email).toBe('slaguna@gecelca.com.co')
    expect(d.phone).toBe('301 5297268')
    expect(d.classification).toBe('Equipo Para Servicio')
    expect(d.channel).toBe('Email')
    expect(d.customFields.Serial).toBe('18A22053')
  })

  it('customFields siempre es un objeto aunque falte en el raw', () => {
    expect(normalizeTicketDetail(raw).customFields).toEqual({})
  })
})

describe('normalizeConversation', () => {
  it('mapea un comentario privado', () => {
    const c: ZohoConversationRaw = {
      id: '1', type: 'comment', content: 'Crédito',
      visibility: 'private', commenterName: 'Alfonso Garcia',
      commentedTime: '2026-06-01T13:57:00.000Z',
    }
    const m = normalizeConversation(c)
    expect(m.author).toBe('Alfonso Garcia')
    expect(m.type).toBe('Privado')
    expect(m.content).toBe('Crédito')
  })

  it('resuelve autor desde commenter.name, marca HTML y mapea adjuntos', () => {
    const c: ZohoConversationRaw = {
      id: '2', type: 'comment', content: '<div>Informe</div>', contentType: 'html', isPublic: false,
      commenter: { name: 'Equipo Técnico' }, commentedTime: '2026-05-28T20:40:59.000Z',
      attachments: [{
        name: 'MT_18A22053.pdf', size: '718521',
        href: 'https://desk.zoho.com/api/v1/tickets/9/comments/8/attachments/7/content',
      }],
    } as ZohoConversationRaw
    const m = normalizeConversation(c)
    expect(m.author).toBe('Equipo Técnico')
    expect(m.isHtml).toBe(true)
    expect(m.attachments).toHaveLength(1)
    expect(m.attachments![0]).toEqual({
      name: 'MT_18A22053.pdf', size: '701.7 KB',
      path: '/tickets/9/comments/8/attachments/7/content',
    })
  })
})
