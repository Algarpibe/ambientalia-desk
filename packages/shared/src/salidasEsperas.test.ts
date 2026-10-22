import { describe, it, expect } from 'vitest'
import { TRANSITIONS, transitionById, CLAVE_DERIVACION } from './transitions'
import { tipoEventoDeTransicion } from './tipoEvento'
import { IDS_CALIBRACION_DIRECTA } from './calibracionDirecta'
import * as modulo from './salidasEsperas'
import {
  ID_COBRO_DIAGNOSTICO, ID_SIN_PIEZA, IDS_SALIDAS_NUEVAS, motivoQuitadaPorSalidasEsperas, visibleConSalidasEsperas,
  CLAVE_MOTIVO_COBRO, CARGOS_EJECUTORES_SALIDA, SALIDAS_ESPERAS_APAGADO, ORIGENES_ANULACION_EN_ESPERA,
  esSalidaDeEspera, ejecutorDeSalida, erroresMotivoCobro, puedeEjecutarConSalidasEsperas, type ContextoSalidasEsperas,
} from './salidasEsperas'
import { CLAVE_MOTIVO_ANULACION, CLAVE_DETALLE_ANULACION, MOTIVOS_ANULACION } from './anulacion'
import { puedeEjecutarTransicionConDecisionales, DECISIONALES_APAGADO } from './decisionales'
import type { SujetoDePermiso } from './cargos'

/**
 * salidas-esperas (F1C-03, RQ-TS-60, RQ-TS-61 pura): el catálogo de las dos salidas nuevas y el interruptor como regla pura
 * que leen igual el servidor (que impone) y el cliente (que sólo pinta, regla invariable 13).
 */
describe('RQ-TS-60 · catálogo de las dos salidas nuevas', () => {
  it('cobro_diagnostico_espera: Comercial, Decisional, de las dos esperas externas a Por Facturar; comentario y motivo del cobro obligatorio', () => {
    const t = transitionById(ID_COBRO_DIAGNOSTICO)!
    expect(t).toMatchObject({ name: 'Cobro de diagnóstico', from: ['En Espera de Repuestos', 'Servicio externo'], to: 'Por Facturar', area: 'Comercial', tipoEvento: 'Decisional' })
    expect(t.fields.filter((f) => f.key !== CLAVE_DERIVACION).map((f) => f.key)).toEqual(['comment', CLAVE_MOTIVO_COBRO])
    expect(t.fields.find((f) => f.key === CLAVE_MOTIVO_COBRO)).toMatchObject({ kind: 'text', required: true, target: 'customField' })
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

/**
 * La regla del ejecutor (pura), corregida por `decision/f1c03-quien-ejecuta-salidas`: con el interruptor encendido, el cobro del diagnóstico
 * y la anulación desde las dos esperas externas los ejecutan sólo el Director Comercial o la Coordinadora Comercial (y el administrador).
 * `derivado_a` ya no decide nada, no hay motivo del respaldo y `sin_pieza_en_almacen` queda fuera de la regla.
 */
const ENCENDIDO: ContextoSalidasEsperas = { activo: true }
const anulacion = transitionById('anulacion')!
const cobro = transitionById(ID_COBRO_DIAGNOSTICO)!
const sinPieza = transitionById(ID_SIN_PIEZA)!
const sujeto = (id: string, areas: string[], extra: Partial<SujetoDePermiso> = {}): SujetoDePermiso & { id: string } => ({ id, areas, isAdmin: false, cargoPermiso: null, ...extra })
const comercial = sujeto('u-com', ['Comercial'])
const dirCom = sujeto('u-dir', ['Comercial'], { cargoPermiso: 'Director Comercial' })
const coordCom = sujeto('u-coo', ['Comercial'], { cargoPermiso: 'Coordinador Comercial' })
const admin = sujeto('u-adm', [], { isAdmin: true })
const EXTERNAS = ['En Espera de Repuestos', 'Servicio externo']
const OTROS_ORIGENES_ANULACION = ['Rev./Diagnostico', 'Notificación Comercial', 'Notificación cliente']

describe('ejecutorDeSalida (regla pura): sólo el cargo comercial en las esperas externas', () => {
  it('los dos cargos son exactamente Director Comercial y Coordinador Comercial', () => {
    expect([...CARGOS_EJECUTORES_SALIDA]).toEqual(['Director Comercial', 'Coordinador Comercial'])
  })

  it('esSalidaDeEspera: el cobro y la anulación desde ER/SE; la anulación desde los otros tres orígenes y sin_pieza_en_almacen NO', () => {
    expect([...ORIGENES_ANULACION_EN_ESPERA].sort()).toEqual(EXTERNAS)
    for (const o of EXTERNAS) {
      expect(esSalidaDeEspera('anulacion', o), o).toBe(true)
      expect(esSalidaDeEspera(ID_COBRO_DIAGNOSTICO, o), o).toBe(true)
    }
    for (const o of OTROS_ORIGENES_ANULACION) expect(esSalidaDeEspera('anulacion', o), o).toBe(false)
    expect(esSalidaDeEspera(ID_SIN_PIEZA, 'Solicitado')).toBe(false)
    expect(esSalidaDeEspera('entrega_repuestos', 'Solicitado')).toBe(false)
  })

  it('apagado o fuera de alcance: null (no opina), también sin_pieza_en_almacen encendido', () => {
    expect(ejecutorDeSalida(cobro, { status: 'Servicio externo' }, comercial, SALIDAS_ESPERAS_APAGADO)).toBeNull()
    expect(ejecutorDeSalida(anulacion, { status: 'En Espera de Repuestos' }, comercial, SALIDAS_ESPERAS_APAGADO)).toBeNull()
    for (const o of OTROS_ORIGENES_ANULACION) expect(ejecutorDeSalida(anulacion, { status: o }, comercial, ENCENDIDO), o).toBeNull()
    expect(ejecutorDeSalida(sinPieza, { status: 'Solicitado' }, sujeto('u-tec', ['Servicio Técnico']), ENCENDIDO)).toBeNull()
  })

  it('Director Comercial, Coordinador Comercial y administrador: permitido en el cobro y en la anulación desde las dos externas', () => {
    for (const s of [dirCom, coordCom, admin]) for (const t of [cobro, anulacion]) for (const o of EXTERNAS) {
      expect(ejecutorDeSalida(t, { status: o }, s, ENCENDIDO), `${s.id} ${t.id} ${o}`).toEqual({ via: 'permitido' })
    }
  })

  it('cualquier otro cargo, o ninguno, queda denegado con el mensaje que nombra los dos cargos', () => {
    const otros = [comercial, ...(['Asistente Comercial', 'Director Técnico', 'Coordinador Técnico', 'Técnico', 'Especialista técnico'] as const).map((c) => sujeto(`u-${c}`, ['Comercial'], { cargoPermiso: c }))]
    for (const s of otros) expect(ejecutorDeSalida(cobro, { status: 'Servicio externo' }, s, ENCENDIDO), s.id).toMatchObject({ via: 'denegado' })
    expect(ejecutorDeSalida(anulacion, { status: 'En Espera de Repuestos' }, comercial, ENCENDIDO)).toEqual({
      via: 'denegado', mensaje: '"Anulación" desde «En Espera de Repuestos» la ejecutan sólo el Director Comercial o la Coordinadora Comercial',
    })
  })

  it('derivado_a YA NO decide: el derivado sin cargo queda denegado', () => {
    const tk = { status: 'Servicio externo', derivadoA: comercial.id }
    expect(ejecutorDeSalida(cobro, tk, comercial, ENCENDIDO)).toMatchObject({ via: 'denegado' })
    expect(ejecutorDeSalida(anulacion, tk, comercial, ENCENDIDO)).toMatchObject({ via: 'denegado' })
  })

  it('el contexto es sólo el interruptor: sin vacante del Coordinador Técnico ni nada que consultar', () => {
    expect(SALIDAS_ESPERAS_APAGADO).toEqual({ activo: false })
  })
})

describe('el motivo del cobro y el de la anulación', () => {
  it('erroresMotivoCobro: sólo espacios → mensaje; con texto, vacío o ausente → [] (la presencia la dice el plan); otra transición → []', () => {
    expect(CLAVE_MOTIVO_COBRO).toBe('Motivo del cobro de diagnóstico')
    expect(erroresMotivoCobro(ID_COBRO_DIAGNOSTICO, { [CLAVE_MOTIVO_COBRO]: '   ' })).toEqual(['"Motivo del cobro de diagnóstico" no puede estar en blanco'])
    expect(erroresMotivoCobro(ID_COBRO_DIAGNOSTICO, { [CLAVE_MOTIVO_COBRO]: 'El cliente no aprueba la reparación' })).toEqual([])
    expect(erroresMotivoCobro(ID_COBRO_DIAGNOSTICO, {})).toEqual([])
    expect(erroresMotivoCobro('anulacion', { [CLAVE_MOTIVO_COBRO]: '   ' })).toEqual([])
  })

  it('la anulación conserva sus campos de F1C-01: motivo de lista cerrada obligatorio y detalle', () => {
    expect(anulacion.fields.filter((f) => f.key !== CLAVE_DERIVACION).map((f) => f.key)).toEqual(['comment', CLAVE_MOTIVO_ANULACION, CLAVE_DETALLE_ANULACION])
    expect(anulacion.fields.find((f) => f.key === CLAVE_MOTIVO_ANULACION)).toMatchObject({ kind: 'select', required: true, options: [...MOTIVOS_ANULACION] })
  })

  it('no queda rastro del motivo del respaldo: ni en el módulo ni en ningún campo del catálogo', () => {
    expect(Object.keys(modulo).filter((k) => /respaldo/i.test(k))).toEqual([])
    expect(TRANSITIONS.some((t) => t.fields.some((f) => /respaldo/i.test(f.key)))).toBe(false)
  })
})

describe('puedeEjecutarConSalidasEsperas frente a la compuesta de Decisionales', () => {
  const dpc = { activo: true, coordinadorTecnicoVacante: false }
  it('rige aunque DPC esté apagado: el Comercial sin cargo no ejecuta el cobro ni la anulación desde las externas; los dos cargos sí', () => {
    for (const t of [cobro, anulacion]) {
      expect(puedeEjecutarTransicionConDecisionales(comercial, t, DECISIONALES_APAGADO), t.id).toBe(true)
      expect(puedeEjecutarConSalidasEsperas(comercial, t, { status: 'Servicio externo' }, DECISIONALES_APAGADO, ENCENDIDO), t.id).toBe(false)
      for (const s of [dirCom, coordCom, admin]) expect(puedeEjecutarConSalidasEsperas(s, t, { status: 'Servicio externo' }, dpc, ENCENDIDO), `${s.id} ${t.id}`).toBe(true)
    }
  })

  it('el área sigue mandando: el Director Comercial sin el área Comercial no pasa', () => {
    const fuera = sujeto('u-x', ['Servicio Técnico'], { cargoPermiso: 'Director Comercial' })
    expect(puedeEjecutarConSalidasEsperas(fuera, cobro, { status: 'Servicio externo' }, DECISIONALES_APAGADO, ENCENDIDO)).toBe(false)
  })

  it('apagado, la anulación desde los otros orígenes, sin_pieza_en_almacen o una ajena: idéntica a la compuesta de Decisionales', () => {
    const tecnico = sujeto('u-tec', ['Servicio Técnico'])
    const casos = [
      [anulacion, 'Servicio externo', SALIDAS_ESPERAS_APAGADO], [cobro, 'En Espera de Repuestos', SALIDAS_ESPERAS_APAGADO], [sinPieza, 'Solicitado', ENCENDIDO],
      [transitionById('rechazo_comercial')!, 'Notificación Comercial', ENCENDIDO], ...OTROS_ORIGENES_ANULACION.map((o) => [anulacion, o, ENCENDIDO] as const),
    ] as const
    for (const s of [comercial, tecnico, dirCom]) for (const ctxDec of [dpc, DECISIONALES_APAGADO]) for (const [t, status, sal] of casos) {
      expect(puedeEjecutarConSalidasEsperas(s, t, { status }, ctxDec, sal), `${s.id} ${t.id} ${status}`).toBe(puedeEjecutarTransicionConDecisionales(s, t, ctxDec))
    }
  })
})
