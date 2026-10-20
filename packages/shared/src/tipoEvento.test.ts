import { describe, it, expect } from 'vitest'
import { TIPOS_EVENTO, tipoEventoDeTransicion, type TipoEvento } from './tipoEvento'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA } from './transitions'

// F1C-04 (RQ-TS-44, RQ-TS-45): la tabla normativa de 47 filas, ESCRITA A MANO desde la delta
// de `transitions-st`, nunca calculada desde el catálogo (un valor calculado se valida a sí mismo).
const O: TipoEvento = 'Operativo'
const D: TipoEvento = 'Decisional'
const C: TipoEvento = 'Compras / Logístico'
const A: TipoEvento = 'Administrativo'

const SERVICIO: Record<string, TipoEvento> = {
  habilitar_servicio: O, ingreso_a_servicio: O, escalado_a_revision: D, devolucion_a_correccion: D,
  llegada_repuestos: C, aprobacion_y_repuestos: C, solicitud_repuestos: C, aprobacion: D,
  entrega_repuestos: C, notif_por_garantia: O, notif_cliente_comercial: O, notif_cliente_sku: C,
  rechazo_garantia: D, solicitud_sku: C, reporte_por_garantia: O, escalado_a_comercial: O,
  finalizacion_servicio: O, cal_sensores_proceso: C, cal_sensores_revision: C, retorno_servicio_externo: C,
  rechazo_comercial: D, rechazo_cliente: D, rechazo_revision: D, facturado: A,
  facturado_cierre: A, diagnostico_complementario: O, liberacion_sin_factura: D, entrega_sin_factura: C,
  entrega_al_cliente: C, habilitado_para_entrega: A, notif_recotizacion: O, anulacion: D,
  facturar: A, envio_control_calidad: O, aprobacion_control_calidad: D, rechazo_control_calidad: D, calibracion_directa: O, falla_calibracion: O,
}
const EQUIPO_NUEVO: Record<string, TipoEvento> = {
  ingreso_equipo_nuevo: O, analisis_y_acciones: O, verificacion: O, producto_no_conforme: D,
  liberacion: D, rechazo_verificacion: D, anulacion_equipo_nuevo: D,
}
const SOPORTE_REMOTO: Record<string, TipoEvento> = {
  asignacion_soporte: O, ejecutar_soporte: O, soporte_pendiente: O, continuacion_soporte: O, anulacion_soporte: D,
}
const PASOS: Record<string, TipoEvento> = { remision_confirmada: C, remision_retirada: C }
const TABLA: Record<string, TipoEvento> = { ...SERVICIO, ...EQUIPO_NUEVO, ...SOPORTE_REMOTO, ...PASOS }

const TODAS = [...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA]
const cuenta = (xs: readonly { tipoEvento: TipoEvento }[], t: TipoEvento) => xs.filter((x) => x.tipoEvento === t).length

describe('RQ-TS-44 · cada transición lleva un tipo de evento de la lista cerrada', () => {
  it('catálogo → tabla: el tipo de cada transición es el de la tabla normativa', () => {
    for (const t of TODAS) expect({ id: t.id, tipo: t.tipoEvento }).toEqual({ id: t.id, tipo: TABLA[t.id] })
  })
  it('tabla → resolutor: todo id de la tabla resuelve a su tipo', () => {
    for (const [id, tipo] of Object.entries(TABLA)) expect({ id, tipo: tipoEventoDeTransicion(id) }).toEqual({ id, tipo })
  })
  it('cardinalidad: 52 filas, 52 ids distintos, 38/7/5/2', () => {
    expect(Object.keys(TABLA)).toHaveLength(52)
    expect(new Set(TODAS.map((t) => t.id)).size).toBe(52)
    expect([Object.keys(SERVICIO).length, Object.keys(EQUIPO_NUEVO).length, Object.keys(SOPORTE_REMOTO).length, Object.keys(PASOS).length]).toEqual([38, 7, 5, 2])
    expect([TRANSITIONS.length, TRANSITIONS_EQUIPO_NUEVO.length, TRANSITIONS_SOPORTE_REMOTO.length]).toEqual([38, 7, 5])
  })
  it('recuentos 19 / 16 / 13 / 4 en total y por catálogo', () => {
    expect(TIPOS_EVENTO.map((t) => cuenta(TODAS, t))).toEqual([19, 16, 13, 4])
    expect(TIPOS_EVENTO.map((t) => cuenta(TRANSITIONS, t))).toEqual([12, 11, 11, 4])
    expect([cuenta(TRANSITIONS_EQUIPO_NUEVO, O), cuenta(TRANSITIONS_EQUIPO_NUEVO, D)]).toEqual([3, 4])
    expect([cuenta(TRANSITIONS_SOPORTE_REMOTO, O), cuenta(TRANSITIONS_SOPORTE_REMOTO, D)]).toEqual([4, 1])
    expect(cuenta([TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA], C)).toBe(2)
  })
  it('barrido en ejecución: todo tipo pertenece a la lista, y la lista es la tupla exacta', () => {
    for (const t of TODAS) expect(TIPOS_EVENTO as readonly string[]).toContain(t.tipoEvento)
    expect([...TIPOS_EVENTO]).toEqual(['Operativo', 'Decisional', 'Compras / Logístico', 'Administrativo'])
  })
  it('un ejemplo por tipo', () => {
    expect(['habilitar_servicio', 'aprobacion', 'solicitud_sku', 'facturar'].map((id) => tipoEventoDeTransicion(id)))
      .toEqual(['Operativo', 'Decisional', 'Compras / Logístico', 'Administrativo'])
  })
})

describe('RQ-TS-45 · tipoEventoDeTransicion', () => {
  it('resuelve servicio, equipo nuevo, soporte remoto y paso del servidor', () => {
    expect(['aprobacion', 'producto_no_conforme', 'ejecutar_soporte', 'remision_retirada'].map((id) => tipoEventoDeTransicion(id)))
      .toEqual(['Decisional', 'Decisional', 'Operativo', 'Compras / Logístico'])
  })
  it('creación, marcadores de migración e ids retirados no tienen tipo', () => {
    for (const id of ['enviar', 'migracion_f1f01_abiertos', 'migracion_f1c09_pendiente', 'marcar_pendiente']) expect(tipoEventoDeTransicion(id)).toBeNull()
  })
  it('la ausencia de id no lanza', () => {
    for (const id of [null, undefined, '']) expect(tipoEventoDeTransicion(id)).toBeNull()
  })
})
