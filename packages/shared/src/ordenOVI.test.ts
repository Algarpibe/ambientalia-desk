import { describe, it, expect } from 'vitest'
import {
  TIPO_SERVICIO_GARANTIA, ordenesDeTransicion, ordenesQueEntran, motivoCargoOVI,
  erroresGarantiaSinOVI, motivoGarantiaSinOVI, type OrdenesDelTicket,
} from './ordenOVI'
import { CARGOS, EXCEPCIONES_POR_CARGO } from './cargos'
import { TIPOS_SERVICIO } from './ticketCreate'
import { TRANSITIONS } from './transitions'

/**
 * Regla pura de «asociar una orden OVI» (F1B-03; `permissions` RQ-PM-24 y RQ-PM-25). Sin base ni HTTP: las pruebas del
 * servidor enfrentan esto con el plan de la transición (EQ-1) y con cada entrada de una orden.
 */
const VACIO: OrdenesDelTicket = { numeros: [], salesorderIds: [] }
const trans = (id: string) => TRANSITIONS.find((t) => t.id === id)!
const claveOrden = (id: string) => trans(id).fields.filter((f) => f.kind === 'ordenVenta').map((f) => f.key)

describe('ordenesQueEntran · lo que el ticket ya tiene no entra (RQ-PM-25)', () => {
  it('número igual: no entra', () => {
    expect(ordenesQueEntran([{ numero: 'OVI-2026-001' }], { numeros: ['OVI-2026-001'], salesorderIds: [] })).toEqual([])
  })
  it('número igual tras recortar: no entra', () => {
    expect(ordenesQueEntran([{ numero: '  OVI-2026-001 ' }], { numeros: ['OVI-2026-001'], salesorderIds: [] })).toEqual([])
  })
  it('otra caja: entra (falla cerrado)', () => {
    expect(ordenesQueEntran([{ numero: 'ovi-2026-001' }], { numeros: ['OVI-2026-001'], salesorderIds: [] })).toEqual(['ovi-2026-001'])
  })
  it('mismo salesorderId con número distinto: no entra (id igual)', () => {
    expect(ordenesQueEntran([{ numero: 'OVI-2026-009', salesorderId: 'SO-1' }], { numeros: [], salesorderIds: ['SO-1'] })).toEqual([])
  })
  it('otro número y otro id: entra', () => {
    expect(ordenesQueEntran([{ numero: 'OVI-2026-002', salesorderId: 'SO-2' }], { numeros: ['OVI-2026-001'], salesorderIds: ['SO-1'] })).toEqual(['OVI-2026-002'])
  })
  it('vacíos y no-texto no entran; los repetidos se devuelven una vez', () => {
    expect(ordenesQueEntran([{}, { numero: '' }, { numero: '   ' }, { numero: null }, { numero: 42 }], VACIO)).toEqual([])
    expect(ordenesQueEntran([{ numero: 'OV-1' }, { numero: ' OV-1' }, { numero: 'OV-2' }], VACIO)).toEqual(['OV-1', 'OV-2'])
  })
  it('un salesorderId vacío no cuenta como «id igual»', () => {
    expect(ordenesQueEntran([{ numero: 'OVI-2026-003', salesorderId: '' }], { numeros: [], salesorderIds: [''] })).toEqual(['OVI-2026-003'])
  })
})

describe('motivoCargoOVI · el cargo de la OVI que entra (RQ-PM-24)', () => {
  const sujeto = (cargoPermiso: unknown, isAdmin = false) => ({ isAdmin, cargoPermiso: cargoPermiso as never })
  it.each(CARGOS.map((c) => [c]))('%s', (c) => {
    const m = motivoCargoOVI(['OVI-2026-001'], sujeto(c))
    if (c === 'Director Técnico') expect(m).toBeNull()
    else expect(m).toBe(`La orden de venta OVI-2026-001 es una OVI: asociarla a un ticket sólo lo hace el cargo ${EXCEPCIONES_POR_CARGO.crearOVIGarantia}`)
  })
  it('administrador sin cargo pasa; sin cargo y cargo raro, no', () => {
    expect(motivoCargoOVI(['OVI-2026-001'], sujeto(null, true))).toBeNull()
    expect(motivoCargoOVI(['OVI-2026-001'], sujeto(null))).not.toBeNull()
    expect(motivoCargoOVI(['OVI-2026-001'], sujeto('Gerente comercial'))).not.toBeNull()
  })
  it('sujeto ausente = sin cargo (S-10)', () => {
    expect(motivoCargoOVI(['OVI-2026-001'], undefined)).not.toBeNull()
    expect(motivoCargoOVI(['OVI-2026-001'], null)).not.toBeNull()
  })
  it('una orden OV- no pide cargo; una OVI mal formada y en minúsculas sí; nombra la primera OVI', () => {
    expect(motivoCargoOVI(['OV-2026-001'], undefined)).toBeNull()
    expect(motivoCargoOVI([], undefined)).toBeNull()
    expect(motivoCargoOVI(['OVI-26-1'], undefined)).toContain('OVI-26-1')
    expect(motivoCargoOVI(['ovi-2026-001'], undefined)).toContain('ovi-2026-001')
    expect(motivoCargoOVI(['OV-2026-001', 'OVI-2026-002', 'OVI-2026-003'], undefined)).toContain('OVI-2026-002')
  })
})

describe('garantía sólo con OVI (RQ-TC-43)', () => {
  it('el literal es uno de TIPOS_SERVICIO', () => {
    expect(TIPO_SERVICIO_GARANTIA).toBe('Garantía')
    expect(TIPOS_SERVICIO as readonly string[]).toContain(TIPO_SERVICIO_GARANTIA)
  })
  it('Garantía + orden que no es OVI: un texto por orden, con su número', () => {
    const e = erroresGarantiaSinOVI('Garantía', ['OV-2026-001', 'OVI-2026-002', 'OV-2026-003'])
    expect(e).toEqual([
      'El ticket es de tipo de servicio Garantía y sólo admite una orden OVI: la orden de venta OV-2026-001 no lo es',
      'El ticket es de tipo de servicio Garantía y sólo admite una orden OVI: la orden de venta OV-2026-003 no lo es',
    ])
    expect(motivoGarantiaSinOVI('Garantía', ['OV-2026-001'])).toBe(e[0])
  })
  it('Garantía + OVI, o sin entrantes: nada', () => {
    expect(erroresGarantiaSinOVI('Garantía', ['OVI-2026-001'])).toEqual([])
    expect(erroresGarantiaSinOVI('Garantía', [])).toEqual([])
    expect(motivoGarantiaSinOVI('Garantía', [])).toBeNull()
  })
  it('otro tipo de servicio, `garantía` en minúsculas o no-texto: no activa', () => {
    for (const t of ['Mantenimiento', 'garantía', 'Garantia', '', null, undefined, 7]) {
      expect(erroresGarantiaSinOVI(t, ['OV-2026-001'])).toEqual([])
      expect(motivoGarantiaSinOVI(t, ['OV-2026-001'])).toBeNull()
    }
  })
})

describe('ordenesDeTransicion · lo que el plan guarda como orden', () => {
  it('habilitar_servicio: el campo de orden de venta', () => {
    const [k] = claveOrden('habilitar_servicio')
    expect(k).toBeDefined()
    expect(ordenesDeTransicion(trans('habilitar_servicio'), { [k]: 'OVI-2026-001' })).toEqual(['OVI-2026-001'])
  })
  it.each(['aprobacion', 'aprobacion_y_repuestos'])('%s: la «OV adicional»', (id) => {
    expect(claveOrden(id)).toContain('OV adicional')
    expect(ordenesDeTransicion(trans(id), { 'OV adicional': 'OV-2026-007' })).toEqual(['OV-2026-007'])
  })
  it('sin valor, null o vacío: nada; una transición sin campo de orden: nada', () => {
    expect(ordenesDeTransicion(trans('aprobacion'), {})).toEqual([])
    expect(ordenesDeTransicion(trans('aprobacion'), { 'OV adicional': null })).toEqual([])
    expect(ordenesDeTransicion(trans('aprobacion'), { 'OV adicional': '' })).toEqual([])
    expect(ordenesDeTransicion(trans('liberacion_sin_factura'), { 'OV adicional': 'OVI-2026-001' })).toEqual([])
    expect(ordenesDeTransicion(trans('aprobacion'), undefined)).toEqual([])
  })
})
