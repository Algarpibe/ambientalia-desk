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

describe('ticketRowFromZoho (serial/codigo desde el asunto)', () => {
  it('rellena serial/codigo_servicio del asunto cuando Zoho viene vacío', () => {
    const row = ticketRowFromZoho({ id: 't1', ticketNumber: '190', subject: 'Servicio Técnico CHEMILAB MT_18A19042_EDM180C_260305', status: 'Finalizado', customFields: {} } as any)
    expect(row.serial).toBe('18A19042')
    expect(row.codigo_servicio).toBe('MT_18A19042_EDM180C_260305')
  })
  it('no sobreescribe lo que Zoho sí trae', () => {
    const row = ticketRowFromZoho({ id: 't2', ticketNumber: '191', subject: 'X MT_AAA_BBB_260101', status: 'X', customFields: { Serial: 'ZHO-SER', 'Código Servicio': 'ZHO-COD' } } as any)
    expect(row.serial).toBe('ZHO-SER')
    expect(row.codigo_servicio).toBe('ZHO-COD')
  })
})

import { accountRowFromZoho, contactRowFromZoho, agentRowFromZoho, conversationRowFromZoho, attachmentRowsFrom } from './mappers'

describe('account/contact/agent mappers', () => {
  it('accountRowFromZoho', () => {
    const r = accountRowFromZoho({ id: 'a1', accountName: 'Gecelca S.A. E.S.P.', customFields: { NIT: '900082143' }, city: 'Barranquilla', phone: '330300' } as any)
    expect(r.id).toBe('a1'); expect(r.name).toBe('Gecelca S.A. E.S.P.'); expect(r.nit).toBe('900082143'); expect(r.city).toBe('Barranquilla')
  })
  it('contactRowFromZoho', () => {
    const r = contactRowFromZoho({ id: 'c1', firstName: 'Sebastián', lastName: 'Laguna', email: 's@g.co', phone: '301', accountId: 'a1' } as any)
    expect(r.first_name).toBe('Sebastián'); expect(r.account_id).toBe('a1')
  })
  it('agentRowFromZoho', () => {
    const r = agentRowFromZoho({ id: 'g1', firstName: 'Equipo', lastName: 'Técnico', email: 'info@a.co', roleName: 'CEO' } as any)
    expect(r.name).toBe('Equipo Técnico'); expect(r.role).toBe('CEO')
  })
})

describe('conversation/attachment mappers', () => {
  const conv = {
    id: 'k1', type: 'comment', isPublic: false, content: '<div>x</div>', contentType: 'html',
    commentedTime: '2026-05-28T20:40:59.000Z', commenter: { name: 'Equipo Técnico', type: 'AGENT' },
    attachments: [{ id: 'at1', name: 'r.pdf', size: '718521', href: 'https://desk.zoho.com/api/v1/tickets/9/comments/8/attachments/7/content' }],
  }
  it('conversationRowFromZoho', () => {
    const r = conversationRowFromZoho(conv as any, 't1')
    expect(r.ticket_id).toBe('t1'); expect(r.kind).toBe('comment'); expect(r.author_name).toBe('Equipo Técnico')
    expect(r.author_type).toBe('agent'); expect(r.is_public).toBe(false); expect(r.content_type).toBe('html')
  })
  it('attachmentRowsFrom', () => {
    const rows = attachmentRowsFrom(conv as any, 't1')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: 'at1', ticket_id: 't1', conversation_id: 'k1', name: 'r.pdf', size: 718521 })
  })
})

import { rowToTicket, rowToTicketDetail, rowToMessage, activityRowFromZoho, rowToActivity } from './mappers'
import type { TicketRow, ConversationRow } from './rows'

function baseTicketRow(): TicketRow {
  return {
    id: '1', number: 941, subject: 'Servicio X', status: 'Notificación cliente', status_type: 'On Hold',
    priority: 'High', classification: 'Equipo Para Servicio', channel: 'Email', description: null,
    contact_id: 'c1', account_id: 'a1', assignee_id: 'g1',
    created_time: '2026-05-07T19:39:36.000Z', modified_time: null, closed_time: null,
    onhold_time: '2026-05-28T20:40:59.000Z', due_date: null,
    codigo_servicio: 'MT_X', tipo_servicio: 'calibración', equipo: 'Monitor', marca: 'GRIMM',
    modelo: 'EDM180C', serial: '18A22053', codigo_interno: 'MP-1', encargado: 'Miguel',
    correo_encargado: 't@a.co', nit: '900082143', ciudad: 'Barranquilla', direccion: 'Cra 55',
    telefono: '330300', orden_venta: 'OV-1', conformidad: 'Conforme', dias_entrega: 20,
    cumple_condiciones_comerciales: true,
    fecha_creacion_ticket: '2026-05-21', fecha_remision_entrada: null, fecha_revision_informe: null,
    fecha_cotizacion: '2026-05-19', fecha_orden_compra: null, fecha_orden_venta: null,
    fecha_recepcion_repuestos: null, fecha_finalizacion_st: null, fecha_factura: null,
    fecha_remision_salida: null, fecha_salida_servicio_externo: null, fecha_entrada_servicio_externo: null,
    fecha_notificacion_garantia: null, fecha_solicitud_sku: null, fecha_orden_compra_final: null,
    fecha_orden_venta_final: null,
    equipo_partes_listas: null, archivo_trazabilidad_actualizado: null, doc_almacenada_drive: null,
    hv_actualizada: null, liberacion_sin_facturar: null, servicio_in_situ: false,
    custom_fields: { 'Otro Campo': 'v' }, managed_by_app: false, source: 'zoho', raw: {},
  }
}

describe('rowToTicket / rowToTicketDetail', () => {
  it('rowToTicket arma la tarjeta', () => {
    const t = rowToTicket(baseTicketRow(), { accountName: 'Gecelca S.A. E.S.P.', agentName: 'Equipo Técnico', contactName: 'Sebastián Laguna' })
    expect(t.number).toBe('#941')
    expect(t.title).toBe('Servicio X')
    expect(t.company).toBe('Gecelca S.A. E.S.P.')
    expect(t.status).toBe('Notificación cliente')
    expect(t.assignee?.name).toBe('Equipo Técnico')
    expect(t.contactName).toBe('Sebastián Laguna')
    expect(t.contactId).toBe('c1')
    expect(t.accountId).toBe('a1')
  })

  it('rowToTicketDetail reconstruye customFields desde columnas + jsonb', () => {
    const d = rowToTicketDetail(baseTicketRow(), { accountName: 'Gecelca', agentName: 'ET', contactName: 'Sebastián Laguna', contactPhone: '301', email: 's@g.co' })
    expect(d.contactName).toBe('Sebastián Laguna')
    expect(d.customFields['Serial']).toBe('18A22053')
    expect(d.customFields['Fecha de Cotización']).toBe('2026-05-19')
    expect(d.customFields['Cumple condiciones comerciales']).toBe('true')
    expect(d.customFields['Otro Campo']).toBe('v')
  })
})

describe('rowToTicket (campos enriquecidos)', () => {
  it('expone priority/statusType/dueDate/createdAt/channel/diasEntrega', () => {
    const row = {
      id: 't1', number: 5, subject: 'S', status: 'Ingresado', status_type: 'Open',
      priority: 'High', due_date: '2026-06-10', created_time: '2026-06-01T10:00:00Z',
      channel: 'Email', dias_entrega: '5',
    } as any
    const t = rowToTicket(row, { accountName: 'ACME', agentName: 'Ana' })
    expect(t).toMatchObject({
      priority: 'High', statusType: 'Open', dueDate: '2026-06-10',
      createdAt: '2026-06-01T10:00:00Z', channel: 'Email', diasEntrega: '5',
    })
  })
})

describe('rowToTicketDetail (equipoId)', () => {
  it('expone equipoId desde la columna equipo_id', () => {
    const row = { id: 't1', number: 5, subject: 'S', status: 'Ingresado', equipo_id: 'eq-9' } as any
    expect(rowToTicketDetail(row, {}).equipoId).toBe('eq-9')
  })
})

describe('activityRowFromZoho / rowToActivity', () => {
  it('mapea una tarea de Zoho a ActivityRow (ticket_id, owner_name)', () => {
    const row = activityRowFromZoho({ id: 'a1', ticketId: 't1', subject: 'Informe', priority: 'High', status: 'In Progress', statusType: 'Open', dueDate: '2026-03-24T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', modifiedTime: '2026-03-21T00:00:00Z', ownerId: 'g1', assignee: { firstName: 'Ana', lastName: 'P' } } as any)
    expect(row).toMatchObject({ id: 'a1', ticket_id: 't1', subject: 'Informe', priority: 'High', status: 'In Progress', owner_id: 'g1', owner_name: 'Ana P' })
  })
  it('rowToActivity normaliza al tipo compartido (owner por owner_name o agent_name)', () => {
    expect(rowToActivity({ id: 'a1', ticket_id: 't1', subject: 'X', status: 'Completed', status_type: 'Closed', priority: 'Normal', due_date: null, created_time: null, completed_time: null, owner_name: null, agent_name: 'Beto' }))
      .toMatchObject({ id: 'a1', ticketId: 't1', subject: 'X', statusType: 'Closed', owner: 'Beto' })
  })
})

describe('rowToMessage', () => {
  it('arma el mensaje de UI', () => {
    const row: ConversationRow = {
      id: 'k1', ticket_id: 't1', kind: 'comment', author_name: 'Equipo Técnico', author_type: 'agent',
      is_public: false, content: '<div>x</div>', content_type: 'html', commented_time: '2026-05-28T20:40:59.000Z',
      source: 'zoho', raw: {},
    }
    const m = rowToMessage(row, [])
    expect(m.author).toBe('Equipo Técnico')
    expect(m.type).toBe('Privado')
    expect(m.isHtml).toBe(true)
  })
})
