import { describe, it, expect } from 'vitest'
import { TRANSITIONS, transitionById } from './transitions'
import { ESTADOS, ESTADOS_SERVICIO, CLASIFICACION_EN_ESPERA } from './estados'
import { FASE_POR_ESTADO } from './fasesBlueprint'
import { COLUMNS, columnForStatus } from './columns'
import { cargosQueFaltanParaDecisional } from './decisionales'
import {
  ESTADO_CONTROL_CALIDAD, IDS_FIRMA_CC, CHECKLIST_CC, CLAVE_GAS_CC, CLAVE_MOTIVO_FIRMA_ADMIN, CLAVE_MOTIVO_RECHAZO_CC,
  CLAVES_SOLO_TRAZA_CC, camposAprobacionCC, camposRechazoCC,
} from './camposControlCalidad'

/**
 * control-calidad-liberacion (F1C-07), lote 1a · RQ-TS-46 y RQ-TS-50: el estado, su fase, su columna y las tres
 * transiciones de Servicio Técnico. Sólo catálogo: la regla de quién firma es del lote 1b.
 */
const ENVIO = 'envio_control_calidad'
const APROBACION = 'aprobacion_control_calidad'
const RECHAZO = 'rechazo_control_calidad'
const t = (id: string) => transitionById(id)!
const requeridos = (id: string) => t(id).fields.filter((f) => f.required).map((f) => f.key)

describe('RQ-TS-46 · estado y tres transiciones', () => {
  it('tipos, áreas, recorridos y campos de la tabla', () => {
    expect(ESTADO_CONTROL_CALIDAD).toBe('Control de calidad')
    expect(t(ENVIO)).toMatchObject({ name: 'Envío a control de calidad', from: ['En Proceso'], to: 'Control de calidad', area: 'Servicio Técnico', tipoEvento: 'Operativo' })
    expect(t(APROBACION)).toMatchObject({ name: 'Control de calidad aprobado', from: ['Control de calidad'], to: 'Por Facturar', area: 'Servicio Técnico', tipoEvento: 'Decisional' })
    expect(t(RECHAZO)).toMatchObject({ name: 'Control de calidad rechazado', from: ['Control de calidad'], to: 'En Proceso', area: 'Servicio Técnico', tipoEvento: 'Decisional' })
    expect(requeridos(APROBACION)).toEqual([...CHECKLIST_CC])
    expect(requeridos(RECHAZO)).toEqual([CLAVE_MOTIVO_RECHAZO_CC])
    const gas = t(APROBACION).fields.find((f) => f.key === CLAVE_GAS_CC)
    const motivoAdmin = t(APROBACION).fields.find((f) => f.key === CLAVE_MOTIVO_FIRMA_ADMIN)
    expect(gas).toMatchObject({ kind: 'checkbox', required: false, target: 'customField' })
    expect(motivoAdmin).toMatchObject({ kind: 'text', required: false, target: 'customField' })
    expect(CHECKLIST_CC).toEqual(['Puntos que fallaron en el diagnóstico revisados', 'Funcionamiento verificado', 'Equipo completo, limpio y listo para embalar'])
  })

  it('el envío repite los campos de finalizacion_servicio (molde H5: los indicadores leen «Fecha Finalización ST»)', () => {
    expect(t(ENVIO).fields).toEqual(t('finalizacion_servicio').fields)
  })

  // `fields[0]` es el comentario y el último, «Derivado a», que `TRANSITIONS` añade a todas.
  it('los campos salen de camposControlCalidad y las claves de traza no son campos del ticket', () => {
    expect(t(APROBACION).fields.slice(1, -1)).toEqual(camposAprobacionCC())
    expect(t(RECHAZO).fields.slice(1, -1)).toEqual(camposRechazoCC())
    expect([...IDS_FIRMA_CC].sort()).toEqual([APROBACION, RECHAZO].sort())
    expect([...CLAVES_SOLO_TRAZA_CC].sort()).toEqual([...CHECKLIST_CC, CLAVE_GAS_CC, CLAVE_MOTIVO_FIRMA_ADMIN, CLAVE_MOTIVO_RECHAZO_CC].sort())
  })

  it('el estado no es de cierre, tiene espera ninguna, fase de diagnóstico, columna propia y dos salidas', () => {
    expect(ESTADOS).toContain('Control de calidad')
    expect(ESTADOS_SERVICIO).toContain('Control de calidad')
    expect(CLASIFICACION_EN_ESPERA['Control de calidad']).toBe('ninguna')
    expect(FASE_POR_ESTADO['Control de calidad']).toBe('diagnostico')
    expect(columnForStatus('Control de calidad')).toBe('control_calidad')
    const ids = COLUMNS.map((c) => c.id)
    expect(ids.indexOf('control_calidad')).toBe(ids.indexOf('comercial') + 1)
    expect(ids.indexOf('por_facturar')).toBe(ids.indexOf('control_calidad') + 1)
    expect(TRANSITIONS.filter((x) => x.from.includes('Control de calidad')).map((x) => x.id).sort()).toEqual([APROBACION, RECHAZO].sort())
  })

  it('«Anulado» sigue siendo el último de ESTADOS_SERVICIO antes de los de otros flujos y el estado va antes que él', () => {
    expect(ESTADOS.indexOf('Control de calidad')).toBe(ESTADOS.indexOf('Anulado') - 1)
  })

  it('caracterización: los tres «Rechazo» no cambian', () => {
    expect(t('rechazo_comercial')).toMatchObject({ from: ['Notificación Comercial'], to: 'Por Facturar', area: 'Comercial / Servicio Técnico', tipoEvento: 'Decisional' })
    expect(t('rechazo_cliente')).toMatchObject({ from: ['Notificación cliente'], to: 'Por Facturar', area: 'Comercial', tipoEvento: 'Decisional' })
    expect(t('rechazo_revision')).toMatchObject({ from: ['Rev./Diagnostico'], to: 'Por Facturar', area: 'Comercial / Servicio Técnico', tipoEvento: 'Decisional' })
  })

  it('finalizacion_servicio no cambia: sigue de En Proceso a Por Facturar', () => {
    expect(t('finalizacion_servicio')).toMatchObject({ from: ['En Proceso'], to: 'Por Facturar' })
  })
})

describe('RQ-PM-35 · las dos de firma quedan fuera de la regla de Decisionales por cargo', () => {
  it('con el contexto encendido devuelven null para un Especialista', () => {
    const ctx = { activo: true, coordinadorTecnicoVacante: false }
    const s = { areas: ['Servicio Técnico'], isAdmin: false, cargoPermiso: 'Especialista técnico' as never }
    expect(cargosQueFaltanParaDecisional(t(APROBACION), s, ctx)).toBeNull()
    expect(cargosQueFaltanParaDecisional(t(RECHAZO), s, ctx)).toBeNull()
    expect(cargosQueFaltanParaDecisional(t('escalado_a_revision'), s, ctx)).not.toBeNull()
  })
})
