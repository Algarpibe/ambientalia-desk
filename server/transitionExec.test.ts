import { describe, it, expect } from 'vitest'
import { buildTransitionUpdate } from './transitionExec'
import { transitionById } from '../shared/transitions'

describe('buildTransitionUpdate', () => {
  it('arma status, cf y comentario para "Habilitar Servicio"', () => {
    const t = transitionById('habilitar_servicio')!
    const built = buildTransitionUpdate(t, {
      comment: 'condiciones ok',
      'Orden de Venta': 'OV-2026-081',
      'Fecha Orden De Venta': '2026-05-19',
      'Fecha de Cotización': '2026-05-19',
      'Fecha Orden de Compra': '2026-05-19',
      'Cumple condiciones comerciales': true,
    })
    expect(built.errors).toEqual([])
    expect(built.status).toBe('Ingresado')
    expect(built.comment).toBe('condiciones ok')
    expect(built.cf['cf_orden_de_venta']).toBe('OV-2026-081')
    expect(built.cf['cf_fecha_orden_de_venta']).toBe('2026-05-19')
    expect(built.cf['cf_cumple_condiciones_comerciales']).toBe(true)
  })

  it('reporta campos obligatorios faltantes', () => {
    const t = transitionById('ingreso_a_servicio')!
    const built = buildTransitionUpdate(t, { comment: '' })
    expect(built.errors.length).toBeGreaterThan(0)
    expect(built.errors).toContain('Falta el comentario')
  })

  it('mapea prioridad (system) y número', () => {
    const t = transitionById('escalado_a_revision')!
    const built = buildTransitionUpdate(t, { comment: 'x', priority: 'High', 'Días de entrega': 20 })
    expect(built.errors).toEqual([])
    expect(built.priority).toBe('High')
    expect(built.cf['cf_dias_de_entrega']).toBe(20)
  })
})
