import { describe, it, expect } from 'vitest'
import { COLUMNS, columnForStatus } from './columns'

describe('columns', () => {
  it('define las 9 columnas reales en orden', () => {
    expect(COLUMNS.map((c) => c.id)).toEqual([
      'ingresado', 'revision', 'comercial', 'proceso', 'notif_cliente',
      'por_facturar', 'entregar_sin_facturar', 'por_entregar', 'espera_repuestos',
    ])
  })

  it('mapea estados reales de Zoho a su columna', () => {
    expect(columnForStatus('Notificación cliente')).toBe('notif_cliente')
    expect(columnForStatus('En Proceso')).toBe('proceso')
    expect(columnForStatus('Por Facturar')).toBe('por_facturar')
    expect(columnForStatus('Rev./Diagnostico')).toBe('revision')
    expect(columnForStatus('Liberación Comercial')).toBe('comercial')
  })

  it('devuelve null para estados de cierre o desconocidos', () => {
    expect(columnForStatus('Finalizado')).toBeNull()
    expect(columnForStatus('Cualquier Cosa')).toBeNull()
  })
})
