import { describe, it, expect } from 'vitest'
import { TRANSITIONS, transitionsForStatus, transitionById } from './transitions'

describe('transitions', () => {
  it('transitionsForStatus filtra por estado de origen real', () => {
    const t = transitionsForStatus('Notificación cliente')
    const ids = t.map((x) => x.id)
    expect(ids).toContain('aprobacion')
    expect(ids).toContain('aprobacion_y_repuestos')
    expect(ids).toContain('rechazo_cliente')
    // todas deben tener ese origen
    expect(t.every((x) => x.from.includes('Notificación cliente'))).toBe(true)
  })

  it('Ingresado solo habilita "Ingreso a Servicio" hacia Rev./Diagnostico', () => {
    const t = transitionsForStatus('Ingresado')
    expect(t).toHaveLength(1)
    expect(t[0].id).toBe('ingreso_a_servicio')
    expect(t[0].to).toBe('Rev./Diagnostico')
  })

  it('estado desconocido no habilita transiciones', () => {
    expect(transitionsForStatus('Finalizado')).toEqual([])
  })

  it('cada transición tiene un comentario y al menos un campo', () => {
    for (const t of TRANSITIONS) {
      expect(t.fields.length).toBeGreaterThan(0)
      expect(t.fields.some((f) => f.target === 'comment')).toBe(true)
    }
  })

  it('transitionById resuelve y trae sus campos obligatorios', () => {
    const t = transitionById('habilitar_servicio')!
    expect(t.to).toBe('Ingresado')
    const required = t.fields.filter((f) => f.required).map((f) => f.key)
    expect(required).toContain('Orden de Venta')
    expect(required).toContain('Cumple condiciones comerciales')
  })
})
