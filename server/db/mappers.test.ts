import { describe, it, expect } from 'vitest'
import { ticketRowFromZoho, conversationRowFromZoho } from './mappers'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../../shared/types'

describe('ticketRowFromZoho', () => {
  it('extrae columnas indexadas y conserva el raw', () => {
    const raw: ZohoTicketRaw = {
      id: '1', ticketNumber: '864', subject: 'x', status: 'Ingresado',
      statusType: 'Open', createdTime: '2026-01-25T20:44:00.000Z',
    }
    const row = ticketRowFromZoho(raw as any)
    expect(row.id).toBe('1')
    expect(row.ticket_number).toBe('864')
    expect(row.status).toBe('Ingresado')
    expect(row.status_type).toBe('Open')
    expect(row.created_time).toBe('2026-01-25T20:44:00.000Z')
    expect(row.raw).toEqual(raw)
  })
})

describe('conversationRowFromZoho', () => {
  it('liga al ticket y conserva el raw', () => {
    const raw: ZohoConversationRaw = { id: 'c1', commentedTime: '2026-06-01T13:57:00.000Z' }
    const row = conversationRowFromZoho(raw as any, '1')
    expect(row.id).toBe('c1')
    expect(row.ticket_id).toBe('1')
    expect(row.commented_time).toBe('2026-06-01T13:57:00.000Z')
    expect(row.raw).toEqual(raw)
  })
})
