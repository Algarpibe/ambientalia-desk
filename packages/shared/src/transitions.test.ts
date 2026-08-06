import { describe, it, expect } from 'vitest'
import {
  TRANSITIONS, transitionsForStatus, transitionById, puedeCrearRemisionDeEntrada,
  STATUS_OV_ASIGNADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA,
} from './transitions'

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

  // "Crear remisión" solo cabe mientras el equipo todavía no ha entrado. Se comprueba la lista de
  // estados y no solo un par: es una lista BLANCA a propósito, porque con una negra cada estado nuevo
  // del Blueprint aparecería con el botón por omisión.
  it('crear remisión solo se ofrece en la fase inicial, en ningún estado posterior', () => {
    expect(puedeCrearRemisionDeEntrada(STATUS_OV_ASIGNADA)).toBe(true)
    expect(puedeCrearRemisionDeEntrada(STATUS_TICKET_CREADO)).toBe(true)
    // Ya se creó: la etapa está hecha.
    expect(puedeCrearRemisionDeEntrada(STATUS_REMISION_CREADA)).toBe(false)
    // Y de aquí en adelante el equipo lleva tiempo dentro. Se recorre TODO el resto del Blueprint.
    const posteriores = [...new Set(TRANSITIONS.map((t) => t.to))]
      .filter((s) => s !== STATUS_OV_ASIGNADA && s !== STATUS_TICKET_CREADO)
    expect(posteriores).toContain('Ingresado')
    for (const s of posteriores) expect(puedeCrearRemisionDeEntrada(s)).toBe(false)
  })

  // Habilitar Servicio exige lo que la etapa tiene que dejar atado —el vínculo con la venta y con el
  // equipo— y nada más. La casilla dejó de ser obligatoria porque exigirla era una promesa
  // incumplible: un `checkbox` obligatorio se guarda como `false` sin error si nadie lo marca (M-2).
  it('transitionById resuelve, y solo la orden de venta y el serial son obligatorios', () => {
    const t = transitionById('habilitar_servicio')!
    expect(t.to).toBe('Ingresado')
    expect(t.fields.filter((f) => f.required).map((f) => f.key)).toEqual(['Orden de Venta', 'Serial'])
  })
})
