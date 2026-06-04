import { describe, it, expect } from 'vitest'
import { COLUMNS, columnForStatus } from './columns'

describe('columns', () => {
  it('define las columnas del Blueprint en orden de flujo + Otros al final', () => {
    expect(COLUMNS.map((c) => c.id)).toEqual([
      'ov_asignada', 'ingresado', 'revision', 'notificado', 'proceso', 'solicitado',
      'espera_repuestos', 'espera_sku', 'notif_compras', 'continuacion', 'servicio_externo',
      'pendiente', 'notif_cliente', 'notif_comercial', 'comercial', 'por_facturar',
      'entregar_sin_facturar', 'por_entregar', 'otros',
    ])
  })

  it('mapea estados del Blueprint a su columna', () => {
    expect(columnForStatus('Ingresado')).toBe('ingresado')
    expect(columnForStatus('Rev./Diagnostico')).toBe('revision')
    expect(columnForStatus('Solicitado')).toBe('solicitado')
    expect(columnForStatus('Servicio externo')).toBe('servicio_externo')
    expect(columnForStatus('Notificación cliente')).toBe('notif_cliente')
    expect(columnForStatus('En Espera de Repuestos')).toBe('espera_repuestos')
  })

  it('distingue Notificación Comercial de Liberación Comercial', () => {
    expect(columnForStatus('Notificación Comercial')).not.toBe(columnForStatus('Liberación Comercial'))
  })

  it('lleva estados sin columna propia (cierre/desconocidos) a "otros"', () => {
    expect(columnForStatus('Finalizado')).toBe('otros')
    expect(columnForStatus('Cualquier Cosa')).toBe('otros')
  })
})
