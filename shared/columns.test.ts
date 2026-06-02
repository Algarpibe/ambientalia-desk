import { describe, it, expect } from 'vitest'
import { COLUMNS, columnForStatus } from './columns'

describe('columns', () => {
  it('define 8 columnas en orden', () => {
    expect(COLUMNS.map((c) => c.id)).toEqual([
      'ingresado', 'comercial', 'proceso', 'notif_cliente',
      'por_facturar', 'entregar_sin_facturar', 'por_entregar', 'espera_repuestos',
    ])
  })

  it('mapea un status conocido a su columna', () => {
    expect(columnForStatus('Notificación cliente')).toBe('notif_cliente')
    expect(columnForStatus('En Proceso')).toBe('proceso')
    expect(columnForStatus('Por Facturar')).toBe('por_facturar')
  })

  it('devuelve null para estados de cierre o desconocidos', () => {
    expect(columnForStatus('Finalizado')).toBeNull()
    expect(columnForStatus('Cualquier Cosa')).toBeNull()
  })
})
