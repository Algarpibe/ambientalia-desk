import { describe, it, expect } from 'vitest'
import { TRANSITIONS, transitionById, CLAVE_DERIVACION } from './transitions'
import { tipoEventoDeTransicion } from './tipoEvento'
import { IDS_CALIBRACION_DIRECTA } from './calibracionDirecta'
import {
  ID_COBRO_DIAGNOSTICO, ID_SIN_PIEZA, IDS_SALIDAS_NUEVAS, motivoQuitadaPorSalidasEsperas, visibleConSalidasEsperas,
} from './salidasEsperas'

/**
 * salidas-esperas (F1C-03, RQ-TS-60, RQ-TS-61 pura): el catálogo de las dos salidas nuevas y el interruptor como regla pura
 * que leen igual el servidor (que impone) y el cliente (que sólo pinta, regla invariable 13).
 */
describe('RQ-TS-60 · catálogo de las dos salidas nuevas', () => {
  it('cobro_diagnostico_espera: Comercial, Decisional, desde las dos esperas externas a Por Facturar, sólo comentario', () => {
    const t = transitionById(ID_COBRO_DIAGNOSTICO)!
    expect(t).toMatchObject({ name: 'Cobro de diagnóstico', from: ['En Espera de Repuestos', 'Servicio externo'], to: 'Por Facturar', area: 'Comercial', tipoEvento: 'Decisional' })
    expect(t.fields.filter((f) => f.key !== CLAVE_DERIVACION).map((f) => f.key)).toEqual(['comment'])
    expect(t.fields.some((f) => f.required)).toBe(false)
    expect(tipoEventoDeTransicion(ID_COBRO_DIAGNOSTICO)).toBe('Decisional')
  })

  it('sin_pieza_en_almacen: Servicio Técnico, Compras / Logístico, de Solicitado a En Espera de Repuestos, sólo comentario', () => {
    const t = transitionById(ID_SIN_PIEZA)!
    expect(t).toMatchObject({ name: 'Sin pieza en almacén', from: ['Solicitado'], to: 'En Espera de Repuestos', area: 'Servicio Técnico', tipoEvento: 'Compras / Logístico' })
    expect(t.fields.filter((f) => f.key !== CLAVE_DERIVACION).map((f) => f.key)).toEqual(['comment'])
    expect(t.fields.some((f) => f.required)).toBe(false)
    expect(tipoEventoDeTransicion(ID_SIN_PIEZA)).toBe('Compras / Logístico')
  })

  it('ninguna de las dos propone derivado: heredan', () => {
    for (const id of [ID_COBRO_DIAGNOSTICO, ID_SIN_PIEZA]) {
      const t = transitionById(id)!
      expect(t.fields.some((f) => f.key === CLAVE_DERIVACION && f.porDefecto), `${id} propone derivado`).toBe(false)
    }
  })

  it('CARACTERIZACIÓN · las salidas de hoy no cambian', () => {
    expect(transitionById('anulacion')!.from).toEqual(['En Espera de Repuestos', 'Servicio externo', 'Rev./Diagnostico', 'Notificación Comercial', 'Notificación cliente'])
    expect(transitionById('entrega_repuestos')).toMatchObject({ from: ['Solicitado'], to: 'En Proceso' })
    expect(transitionById('notif_cliente_sku')!.from).toEqual(['En espera de SKU inventario'])
  })
})

describe('RQ-TS-61 · el interruptor, regla pura', () => {
  it('IDS_SALIDAS_NUEVAS son exactamente las dos, y existen en el catálogo', () => {
    expect([...IDS_SALIDAS_NUEVAS].sort()).toEqual([ID_COBRO_DIAGNOSTICO, ID_SIN_PIEZA].sort())
    for (const id of IDS_SALIDAS_NUEVAS) expect(TRANSITIONS.some((t) => t.id === id), id).toBe(true)
  })

  it('apagado, las dos dan el motivo (nombra el interruptor) y no se ven; encendido, ninguna', () => {
    for (const id of IDS_SALIDAS_NUEVAS) {
      expect(motivoQuitadaPorSalidasEsperas(id, false)).toBe('Las salidas de las esperas están apagadas (SALIDAS_ESPERAS)')
      expect(visibleConSalidasEsperas(id, false)).toBe(false)
      expect(motivoQuitadaPorSalidasEsperas(id, true)).toBeNull()
      expect(visibleConSalidasEsperas(id, true)).toBe(true)
    }
  })

  it('una id ajena siempre se ve, con el interruptor en cualquier valor (incluida anulacion)', () => {
    for (const id of ['anulacion', 'entrega_repuestos', 'finalizacion_servicio', 'inexistente']) {
      expect(motivoQuitadaPorSalidasEsperas(id, false), id).toBeNull()
      expect(visibleConSalidasEsperas(id, false), id).toBe(true)
      expect(visibleConSalidasEsperas(id, true), id).toBe(true)
    }
  })

  it('disjunción: IDS_SALIDAS_NUEVAS no toca las cláusulas de Control de calidad ni de calibración directa', () => {
    const ajenas = new Set([...IDS_CALIBRACION_DIRECTA, 'envio_control_calidad', 'finalizacion_servicio'])
    expect([...IDS_SALIDAS_NUEVAS].filter((id) => ajenas.has(id))).toEqual([])
  })
})
