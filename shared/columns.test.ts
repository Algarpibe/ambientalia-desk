import { describe, it, expect } from 'vitest'
import { COLUMNS, columnForStatus } from './columns'

describe('columns', () => {
  it('define las 12 columnas reales en el orden de Zoho', () => {
    expect(COLUMNS.map((c) => c.id)).toEqual([
      'ingresado', 'pendiente', 'revision', 'proceso', 'espera_repuestos', 'notificado',
      'notif_cliente', 'notif_comercial', 'comercial', 'por_facturar', 'entregar_sin_facturar', 'por_entregar',
    ])
  })

  it('mapea estados reales de Zoho a su columna', () => {
    expect(columnForStatus('Ingresado')).toBe('ingresado')
    expect(columnForStatus('Rev./Diagnostico')).toBe('revision')
    expect(columnForStatus('Notificación cliente')).toBe('notif_cliente')
    expect(columnForStatus('Notificación Comercial')).toBe('notif_comercial')
    expect(columnForStatus('Liberación Comercial')).toBe('comercial')
    expect(columnForStatus('En Espera de Repuestos')).toBe('espera_repuestos')
  })

  it('distingue Notificación Comercial de Liberación Comercial', () => {
    expect(columnForStatus('Notificación Comercial')).not.toBe(columnForStatus('Liberación Comercial'))
  })

  it('devuelve null para estados de cierre o desconocidos', () => {
    expect(columnForStatus('Finalizado')).toBeNull()
    expect(columnForStatus('Cualquier Cosa')).toBeNull()
  })
})
