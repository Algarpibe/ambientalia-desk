import { describe, it, expect } from 'vitest'
import { normalizeTicket, normalizeConversation } from './normalize'
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
})
