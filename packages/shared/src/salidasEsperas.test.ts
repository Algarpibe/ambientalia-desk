import { describe, it, expect } from 'vitest'
import { TRANSITIONS, transitionById, CLAVE_DERIVACION } from './transitions'
import { tipoEventoDeTransicion } from './tipoEvento'
import { IDS_CALIBRACION_DIRECTA } from './calibracionDirecta'
import {
  ID_COBRO_DIAGNOSTICO, ID_SIN_PIEZA, IDS_SALIDAS_NUEVAS, motivoQuitadaPorSalidasEsperas, visibleConSalidasEsperas,
  CLAVE_MOTIVO_RESPALDO, CAMPO_MOTIVO_RESPALDO, SALIDAS_ESPERAS_APAGADO, ORIGENES_ANULACION_EN_ESPERA,
  esSalidaDeEspera, ejecutorDeSalida, erroresMotivoRespaldo, puedeEjecutarConSalidasEsperas, type ContextoSalidasEsperas,
} from './salidasEsperas'
import { areaDeDecision, puedeEjecutarTransicionConDecisionales, DECISIONALES_APAGADO } from './decisionales'
import type { SujetoDePermiso } from './cargos'

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

/**
 * RQ-PM-42/43/44 (pura): quién ejecuta una salida de las esperas. Persona a cargo = `derivadoA` con el área; respaldo = administrador o
 * cargo del área (`cargosDecisionales`, con la vacante); cualquier otro, denegado. «Activo» no se consulta (S-12): lo exige la sesión.
 */
const ENCENDIDO: ContextoSalidasEsperas = { activo: true, coordinadorTecnicoVacante: false }
const anulacion = transitionById('anulacion')!
const cobro = transitionById(ID_COBRO_DIAGNOSTICO)!
const sinPieza = transitionById(ID_SIN_PIEZA)!
const sujeto = (id: string, areas: string[], extra: Partial<SujetoDePermiso> = {}): SujetoDePermiso & { id: string } => ({ id, areas, isAdmin: false, cargoPermiso: null, ...extra })
const comercial = sujeto('u-com', ['Comercial'])
const tecnico = sujeto('u-tec', ['Servicio Técnico'])
const tkEr = { status: 'En Espera de Repuestos', derivadoA: 'u-com' }

describe('RQ-PM-42 · ejecutorDeSalida (regla pura)', () => {
  it('esSalidaDeEspera: anulacion sólo desde ER/SE; las dos nuevas siempre; anulacion desde Rev./Diagnostico NO', () => {
    expect([...ORIGENES_ANULACION_EN_ESPERA].sort()).toEqual(['En Espera de Repuestos', 'Servicio externo'])
    expect(esSalidaDeEspera('anulacion', 'En Espera de Repuestos')).toBe(true)
    expect(esSalidaDeEspera('anulacion', 'Servicio externo')).toBe(true)
    expect(esSalidaDeEspera('anulacion', 'Rev./Diagnostico')).toBe(false)
    expect(esSalidaDeEspera(ID_COBRO_DIAGNOSTICO, 'Servicio externo')).toBe(true)
    expect(esSalidaDeEspera(ID_SIN_PIEZA, 'Solicitado')).toBe(true)
    expect(esSalidaDeEspera('entrega_repuestos', 'Solicitado')).toBe(false)
  })

  it('areaDeDecision no es null para las tres', () => {
    for (const t of [anulacion, cobro, sinPieza]) expect(areaDeDecision(t), t.id).not.toBeNull()
  })

  it('apagado o fuera de alcance: null (no opina)', () => {
    expect(ejecutorDeSalida(cobro, tkEr, comercial, SALIDAS_ESPERAS_APAGADO)).toBeNull()
    expect(ejecutorDeSalida(anulacion, { status: 'Rev./Diagnostico', derivadoA: 'u-com' }, comercial, ENCENDIDO)).toBeNull()
    expect(ejecutorDeSalida(transitionById('entrega_repuestos')!, { status: 'Solicitado', derivadoA: 'u-com' }, comercial, ENCENDIDO)).toBeNull()
  })

  it('la persona a cargo (id = derivadoA y área) ejecuta como persona_a_cargo, aunque no tenga cargo', () => {
    expect(ejecutorDeSalida(cobro, tkEr, comercial, ENCENDIDO)).toEqual({ via: 'persona_a_cargo' })
    expect(ejecutorDeSalida(anulacion, { status: 'Servicio externo', derivadoA: 'u-com' }, comercial, ENCENDIDO)).toEqual({ via: 'persona_a_cargo' })
    expect(ejecutorDeSalida(sinPieza, { status: 'Solicitado', derivadoA: 'u-tec' }, tecnico, ENCENDIDO)).toEqual({ via: 'persona_a_cargo' })
  })

  it('el derivado de otra área no es persona a cargo: denegado, aunque tenga el cargo de OTRA área', () => {
    expect(ejecutorDeSalida(cobro, { ...tkEr, derivadoA: 'u-tec' }, tecnico, ENCENDIDO)).toMatchObject({ via: 'denegado' })
    const dirTec = sujeto('u-tec', ['Servicio Técnico'], { cargoPermiso: 'Director Técnico' })
    expect(ejecutorDeSalida(cobro, { ...tkEr, derivadoA: 'u-tec' }, dirTec, ENCENDIDO)).toMatchObject({ via: 'denegado' }) // el cargo es del área de la decisión, Comercial
  })

  it('el respaldo: administrador o cargo del área; con la vacante, el Especialista técnico en el área técnica', () => {
    const dirCom = sujeto('u-dir', ['Comercial'], { cargoPermiso: 'Director Comercial' })
    const coordCom = sujeto('u-coo', ['Comercial'], { cargoPermiso: 'Coordinador Comercial' })
    const admin = sujeto('u-adm', [], { isAdmin: true })
    for (const s of [dirCom, coordCom, admin]) expect(ejecutorDeSalida(cobro, tkEr, s, ENCENDIDO), s.id).toEqual({ via: 'respaldo' })
    const espec = sujeto('u-esp', ['Servicio Técnico'], { cargoPermiso: 'Especialista técnico' })
    const tkSol = { status: 'Solicitado', derivadoA: null }
    expect(ejecutorDeSalida(sinPieza, tkSol, espec, ENCENDIDO)).toMatchObject({ via: 'denegado' })
    expect(ejecutorDeSalida(sinPieza, tkSol, espec, { ...ENCENDIDO, coordinadorTecnicoVacante: true })).toEqual({ via: 'respaldo' })
  })

  it('denegado trae el mensaje de D2 con el nombre de la transición y el origen', () => {
    const v = ejecutorDeSalida(cobro, tkEr, sujeto('u-x', ['Comercial']), ENCENDIDO) as { via: 'denegado'; mensaje: string }
    expect(v.via).toBe('denegado')
    expect(v.mensaje).toBe('"Cobro de diagnóstico" desde «En Espera de Repuestos» la ejecuta la persona a cargo del ticket o, con motivo, el Director o el Coordinador del área')
  })

  it('S-2 · derivado nulo o ajeno: nadie cumple (a); sólo pasa (b)', () => {
    const dirCom = sujeto('u-dir', ['Comercial'], { cargoPermiso: 'Director Comercial' })
    for (const derivadoA of [null, 'u-otro-inactivo']) {
      expect(ejecutorDeSalida(cobro, { ...tkEr, derivadoA }, comercial, ENCENDIDO), String(derivadoA)).toMatchObject({ via: 'denegado' })
      expect(ejecutorDeSalida(cobro, { ...tkEr, derivadoA }, dirCom, ENCENDIDO), String(derivadoA)).toEqual({ via: 'respaldo' })
    }
  })

  it('una sesión sin id nunca es persona a cargo, ni con derivadoA nulo', () => {
    expect(ejecutorDeSalida(cobro, { ...tkEr, derivadoA: null }, { areas: ['Comercial'], isAdmin: false }, ENCENDIDO)).toMatchObject({ via: 'denegado' })
  })
})

describe('RQ-PM-44 · erroresMotivoRespaldo y CAMPO_MOTIVO_RESPALDO', () => {
  it('la clave es «Motivo del respaldo» y el campo (text, required) NO está en el catálogo', () => {
    expect(CLAVE_MOTIVO_RESPALDO).toBe('Motivo del respaldo')
    expect(CAMPO_MOTIVO_RESPALDO).toMatchObject({ key: CLAVE_MOTIVO_RESPALDO, label: CLAVE_MOTIVO_RESPALDO, kind: 'text', required: true })
    expect(TRANSITIONS.some((t) => t.fields.some((f) => f.key === CLAVE_MOTIVO_RESPALDO))).toBe(false)
  })

  it('respaldo: ausente o en blanco (también espacios) → mensaje; con texto → []', () => {
    const r = { via: 'respaldo' } as const
    const msg = '"Motivo del respaldo" es obligatorio: no eres la persona a cargo del ticket'
    expect(erroresMotivoRespaldo(r, {})).toEqual([msg])
    expect(erroresMotivoRespaldo(r, { [CLAVE_MOTIVO_RESPALDO]: '' })).toEqual([msg])
    expect(erroresMotivoRespaldo(r, { [CLAVE_MOTIVO_RESPALDO]: '   ' })).toEqual([msg])
    expect(erroresMotivoRespaldo(r, { [CLAVE_MOTIVO_RESPALDO]: 7 })).toEqual([msg])
    expect(erroresMotivoRespaldo(r, { [CLAVE_MOTIVO_RESPALDO]: 'Cubro la baja' })).toEqual([])
  })

  it('persona a cargo: sin texto → []; con texto → mensaje (no se descarta en silencio, S-14); en blanco → []', () => {
    const p = { via: 'persona_a_cargo' } as const
    expect(erroresMotivoRespaldo(p, {})).toEqual([])
    expect(erroresMotivoRespaldo(p, { [CLAVE_MOTIVO_RESPALDO]: '  ' })).toEqual([])
    expect(erroresMotivoRespaldo(p, { [CLAVE_MOTIVO_RESPALDO]: 'x' })).toEqual(['"Motivo del respaldo" sólo lo da el respaldo: eres la persona a cargo del ticket'])
  })

  it('null y denegado → [] (el 403 ya habló)', () => {
    expect(erroresMotivoRespaldo(null, {})).toEqual([])
    expect(erroresMotivoRespaldo({ via: 'denegado', mensaje: 'm' }, {})).toEqual([])
  })
})

describe('RQ-PM-43 · puedeEjecutarConSalidasEsperas frente a la compuesta de Decisionales', () => {
  const dpc = { activo: true, coordinadorTecnicoVacante: false }
  it('la persona a cargo sin cargo ejecuta el cobro (Decisional) con DPC encendido; la compuesta intacta lo niega', () => {
    expect(puedeEjecutarTransicionConDecisionales(comercial, cobro, dpc)).toBe(false)
    expect(puedeEjecutarConSalidasEsperas(comercial, cobro, tkEr, dpc, ENCENDIDO)).toBe(true)
  })

  it('rige aunque DPC esté apagado: el extraño de Comercial no ejecuta anulacion desde SE', () => {
    expect(puedeEjecutarTransicionConDecisionales(sujeto('u-x', ['Comercial']), anulacion, DECISIONALES_APAGADO)).toBe(true)
    expect(puedeEjecutarConSalidasEsperas(sujeto('u-x', ['Comercial']), anulacion, { status: 'Servicio externo', derivadoA: 'u-com' }, DECISIONALES_APAGADO, ENCENDIDO)).toBe(false)
  })

  it('el respaldo con cargo pasa; el área sigue mandando (la persona a cargo de otra área no pasa)', () => {
    const dirCom = sujeto('u-dir', ['Comercial'], { cargoPermiso: 'Director Comercial' })
    expect(puedeEjecutarConSalidasEsperas(dirCom, cobro, tkEr, dpc, ENCENDIDO)).toBe(true)
    expect(puedeEjecutarConSalidasEsperas(tecnico, cobro, { ...tkEr, derivadoA: 'u-tec' }, dpc, ENCENDIDO)).toBe(false)
  })

  it('apagado, o anulacion desde Rev./Diagnostico, o una ajena: idéntica a la compuesta de Decisionales', () => {
    const tkRev = { status: 'Rev./Diagnostico', derivadoA: 'u-com' }
    const dirCom = sujeto('u-dir', ['Comercial'], { cargoPermiso: 'Director Comercial' })
    for (const s of [comercial, tecnico, dirCom]) {
      for (const [t, tk, sal] of [[cobro, tkEr, SALIDAS_ESPERAS_APAGADO], [anulacion, tkRev, ENCENDIDO], [transitionById('rechazo_comercial')!, tkEr, ENCENDIDO]] as const) {
        expect(puedeEjecutarConSalidasEsperas(s, t, tk, dpc, sal), `${s.id} ${t.id}`).toBe(puedeEjecutarTransicionConDecisionales(s, t, dpc))
      }
    }
  })
})
