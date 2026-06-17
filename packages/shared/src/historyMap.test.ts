import { describe, it, expect } from 'vitest'
import { mapHistoryEvent } from './historyMap'

describe('mapHistoryEvent', () => {
  it('CommentAdded → comentario + tipo + contenido', () => {
    const e = mapHistoryEvent({ eventName: 'CommentAdded', eventTime: 't', actor: { name: 'Equipo Técnico' }, eventInfo: [{ propertyName: 'Content', propertyValue: '<div>Insumos</div>' }, { propertyName: 'CommentType', propertyValue: 'Private' }] })
    expect(e.title).toBe('Equipo Técnico ha publicado un comentario')
    expect(e.details).toEqual([
      { label: 'Tipo de comentario', value: 'Privado' },
      { label: 'Contenido', value: '<div>Insumos</div>', html: true },
    ])
  })
  it('TicketUpdated → estado cambiado', () => {
    const e = mapHistoryEvent({ eventName: 'TicketUpdated', actor: { name: 'Luz' }, eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: 'Ingresado', updatedValue: 'En Proceso' }, propertyType: 'ValueTransition' }] })
    expect(e.title).toBe('Luz ha actualizado el ticket')
    expect(e.details[0]).toEqual({ label: 'Estado', value: 'cambiado desde Ingresado a En Proceso' })
  })
  it('BlueprintTransitionPerformed → transición', () => {
    const e = mapHistoryEvent({ eventName: 'BlueprintTransitionPerformed', actor: { name: 'Luz' }, eventInfo: [{ propertyName: 'Blueprint', propertyValue: { name: 'BP' } }, { propertyName: 'Transition', propertyValue: { name: 'Aprobación y S. repuestos' } }] })
    expect(e.title).toBe('Transición de blueprint realizada por Luz')
    expect(e.details).toContainEqual({ label: 'Nombre de transición', value: 'Aprobación y S. repuestos' })
  })
  it('NotificationSent → regla', () => {
    const e = mapHistoryEvent({ eventName: 'NotificationSent', actor: { name: 'Regla' }, eventInfo: [{ propertyName: 'NotificationType', propertyValue: 'EmailNotification' }, { propertyName: 'Recipients', propertyValue: 'a@b.co' }] })
    expect(e.title).toBe('Notificación de regla aplicada')
    expect(e.details).toContainEqual({ label: 'Destinatario', value: 'a@b.co' })
  })
  it('fallback evento desconocido', () => {
    const e = mapHistoryEvent({ eventName: 'TicketArchived', actor: { name: 'Desk System' }, eventInfo: [] })
    expect(e.title).toBe('Ticket archivado')
    expect(e.details).toEqual([])
  })
})
