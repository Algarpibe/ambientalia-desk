import { describe, it, expect } from 'vitest'
import { ticketRowFromZoho } from './mappers'

const raw = {
  id: '1', ticketNumber: '941', subject: 'Servicio X', status: 'Notificación cliente',
  statusType: 'On Hold', priority: 'High', classification: 'Equipo Para Servicio', channel: 'Email',
  createdTime: '2026-05-07T19:39:36.000Z', modifiedTime: '2026-05-29T17:43:58.000Z',
  onholdTime: '2026-05-28T20:40:59.000Z', contactId: 'c1', accountId: 'a1', assigneeId: 'g1',
  email: 'x@y.com',
  customFields: {
    'Serial': '18A22053', 'Ciudad': 'Barranquilla', 'NIT.': '900082143',
    'Días de entrega': '20', 'Cumple condiciones comerciales': 'true',
    'Fecha de Cotización': '2026-05-19', 'Servicio ejecutado in Situ!': 'false',
    'Campo Raro Que No Existe': 'algo',
  },
}

describe('ticketRowFromZoho', () => {
  it('mapea identidad, relaciones y promueve columnas', () => {
    const row = ticketRowFromZoho(raw as any)
    expect(row.id).toBe('1')
    expect(row.number).toBe(941)
    expect(row.status).toBe('Notificación cliente')
    expect(row.contact_id).toBe('c1')
    expect(row.account_id).toBe('a1')
    expect(row.assignee_id).toBe('g1')
    expect(row.serial).toBe('18A22053')
    expect(row.ciudad).toBe('Barranquilla')
    expect(row.nit).toBe('900082143')
    expect(row.dias_entrega).toBe(20)
    expect(row.cumple_condiciones_comerciales).toBe(true)
    expect(row.servicio_in_situ).toBe(false)
    expect(row.fecha_cotizacion).toBe('2026-05-19')
  })

  it('los campos no promovidos van a custom_fields', () => {
    const row = ticketRowFromZoho(raw as any)
    expect(row.custom_fields['Campo Raro Que No Existe']).toBe('algo')
    expect(row.custom_fields['Serial']).toBeUndefined() // promovido, no duplicado
  })

  it('conserva el raw', () => {
    const row = ticketRowFromZoho(raw as any)
    expect(row.raw).toEqual(raw)
    expect(row.source).toBe('zoho')
  })
})
