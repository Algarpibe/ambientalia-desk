import { describe, it, expect } from 'vitest'
import { TRANSITIONS, transitionById, CLAVE_DERIVACION, type Transition } from './transitions'
import { TIPOS_SERVICIO } from './ticketCreate'
import { motivoQuitadaPorInterruptor, visibleConControlCalidad } from './controlCalidad'
import {
  CLAVE_DESCRIPCION_FALLA, ID_CALIBRACION_DIRECTA, ID_FALLA_CALIBRACION, IDS_CALIBRACION_DIRECTA,
  erroresDescripcionFalla, motivoNoCalibracionDirecta, visibleCalibracionDirecta,
} from './calibracionDirecta'

/**
 * calibracion-directa (F1C-08, RQ-TS-52, RQ-TS-55 grafo, RQ-PM-39 pura): el catálogo de las dos transiciones y la regla
 * pura que consumen el servidor (que impone) y el cliente (que sólo pinta, regla invariable 13).
 */
const sinDerivacion = (t: Transition) => t.fields.filter((f) => f.key !== CLAVE_DERIVACION).map(({ key, label, kind, required, target }) => ({ key, label, kind, required, target }))
const tk = (tipoServicio: string | null, tieneOrdenVenta: boolean) => ({ tipoServicio, tieneOrdenVenta })

// Alcance por transiciones visibles con el interruptor encendido (el escape y el atajo sólo existen con él).
function alcanzables(desde: string, ts: readonly Transition[] = TRANSITIONS): Set<string> {
  const visto = new Set<string>([desde])
  const cola = [desde]
  while (cola.length) {
    const e = cola.shift()!
    for (const t of ts) {
      if (!visibleConControlCalidad(t.id, true) || !t.from.includes(e) || visto.has(t.to)) continue
      visto.add(t.to)
      cola.push(t.to)
    }
  }
  return visto
}

describe('RQ-TS-52 · catálogo de las dos transiciones', () => {
  it('tipos, áreas, from/to y la descripción como único obligatorio de la falla', () => {
    const atajo = transitionById(ID_CALIBRACION_DIRECTA)!
    const falla = transitionById(ID_FALLA_CALIBRACION)!
    expect(atajo).toMatchObject({ name: 'Calibración directa', from: ['Ingresado'], to: 'En Proceso', area: 'Servicio Técnico', tipoEvento: 'Operativo' })
    expect(falla).toMatchObject({ name: 'Falla en calibración', from: ['En Proceso'], to: 'Rev./Diagnostico', area: 'Servicio Técnico', tipoEvento: 'Operativo' })
    expect(sinDerivacion(falla).filter((f) => f.required).map((f) => f.key)).toEqual([CLAVE_DESCRIPCION_FALLA])
    expect(sinDerivacion(falla).find((f) => f.key === CLAVE_DESCRIPCION_FALLA)).toMatchObject({ kind: 'text', target: 'customField' })
  })
  it('molde H5 · los campos del atajo son los de ingreso_a_servicio, con las mismas fechas obligatorias', () => {
    const ingreso = sinDerivacion(transitionById('ingreso_a_servicio')!)
    expect(sinDerivacion(transitionById(ID_CALIBRACION_DIRECTA)!)).toEqual(ingreso)
    expect(ingreso.filter((f) => f.kind === 'date' && f.required).map((f) => f.key)).toEqual(['Fecha creación ticket', 'Fecha Remisión Entrada'])
  })
  it('ingreso_a_servicio no cambia (caracterización)', () => {
    expect(transitionById('ingreso_a_servicio')).toMatchObject({ from: ['Ingresado'], to: 'Rev./Diagnostico', area: 'Servicio Técnico', tipoEvento: 'Operativo' })
    expect(sinDerivacion(transitionById('ingreso_a_servicio')!).map((f) => f.key)).toEqual(['comment', 'Código Servicio', 'Fecha creación ticket', 'Fecha Remisión Entrada'])
  })
  it('ninguna de las dos propone derivación por defecto: heredan (S-6)', () => {
    for (const id of IDS_CALIBRACION_DIRECTA) {
      const d = transitionById(id)!.fields.find((f) => f.key === CLAVE_DERIVACION)
      expect(d, `${id} no ofrece la derivación`).toBeDefined()
      expect(d!.porDefecto, `${id} propone derivación`).toBeUndefined()
    }
  })
  it('CLAVE_DESCRIPCION_FALLA es la key del catálogo, no un literal paralelo', () => {
    expect(transitionById(ID_FALLA_CALIBRACION)!.fields.map((f) => f.key)).toContain(CLAVE_DESCRIPCION_FALLA)
    expect([...IDS_CALIBRACION_DIRECTA].sort()).toEqual(['calibracion_directa', 'falla_calibracion'])
  })
})

describe('RQ-TS-55 grafo · el escape existe y su destino cotiza', () => {
  it('el grafo ofrece el escape y su destino cotiza: de Rev./Diagnostico se llega a notif_cliente_comercial', () => {
    const falla = transitionById(ID_FALLA_CALIBRACION)!
    expect(falla.from).toEqual(['En Proceso'])
    const desdeDestino = alcanzables(falla.to)
    const cotiza = TRANSITIONS.find((t) => t.id === 'notif_cliente_comercial')!
    expect(desdeDestino.has(cotiza.from[0])).toBe(true)
    expect(cotiza.fields.some((f) => f.key === 'Fecha de Cotización' && f.required)).toBe(true)
    // el camino de los tres pasos de RQ-TS-55 existe tal cual
    expect(transitionById('escalado_a_revision')).toMatchObject({ from: [falla.to], to: 'Notificado' })
    expect(transitionById('escalado_a_comercial')).toMatchObject({ from: ['Notificado'], to: 'Notificación Comercial' })
    expect(cotiza.from).toEqual(['Notificación Comercial'])
  })
})

describe('motivoNoCalibracionDirecta · la regla pura (D2)', () => {
  it('atajo: Calibración con OV pasa', () => {
    expect(motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Calibración', true))).toBeNull()
  })
  it('sin OV el atajo no pasa (M1)', () => {
    expect(motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Calibración', false))).toMatch(/orden de venta/i)
  })
  it('otro tipo no pasa: Mantenimiento, Garantía, sin tipo y `calibración` en minúscula (M5, S-11)', () => {
    for (const tipo of ['Mantenimiento', 'Garantía', null, 'calibración', 'Calibracion', ' Calibración'])
      expect(motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk(tipo, true)), String(tipo)).toMatch(/tipo de servicio Calibración/)
  })
  it('todos los tipos del catálogo salvo Calibración quedan fuera', () => {
    for (const tipo of TIPOS_SERVICIO) expect(motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk(tipo, true)) === null, tipo).toBe(tipo === 'Calibración')
  })
  it('los dos motivos del atajo y el del escape son tres textos distintos', () => {
    const tipo = motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Mantenimiento', true))
    const ov = motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Calibración', false))
    const escape = motivoNoCalibracionDirecta(ID_FALLA_CALIBRACION, tk('Mantenimiento', false))
    expect(new Set([tipo, ov, escape]).size).toBe(3)
    expect([tipo, ov, escape].every((m) => typeof m === 'string' && m.length > 0)).toBe(true)
  })
  it('el tipo gana a la OV cuando faltan las dos', () => {
    expect(motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Mantenimiento', false))).toBe(motivoNoCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Mantenimiento', true)))
  })
  it('escape: sólo Calibración, y la OV no cuenta (S-4)', () => {
    expect(motivoNoCalibracionDirecta(ID_FALLA_CALIBRACION, tk('Calibración', false))).toBeNull()
    expect(motivoNoCalibracionDirecta(ID_FALLA_CALIBRACION, tk('Calibración', true))).toBeNull()
    for (const tipo of ['Mantenimiento', 'Garantía', null, 'calibración']) expect(motivoNoCalibracionDirecta(ID_FALLA_CALIBRACION, tk(tipo, true)), String(tipo)).toMatch(/Falla en calibración/)
  })
  it('cualquier otra id → null, con cualquier ticket', () => {
    for (const t of TRANSITIONS.filter((x) => !IDS_CALIBRACION_DIRECTA.has(x.id))) expect(motivoNoCalibracionDirecta(t.id, tk(null, false)), t.id).toBeNull()
    expect(motivoNoCalibracionDirecta('no_existe', tk(null, false))).toBeNull()
  })
  it('visibleCalibracionDirecta es (motivo === null) para todas las combinaciones', () => {
    for (const id of [...IDS_CALIBRACION_DIRECTA, 'ingreso_a_servicio']) for (const tipo of ['Calibración', 'Mantenimiento', null]) for (const ov of [true, false])
      expect(visibleCalibracionDirecta(id, tk(tipo, ov))).toBe(motivoNoCalibracionDirecta(id, tk(tipo, ov)) === null)
    expect(visibleCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Calibración', true))).toBe(true)
    expect(visibleCalibracionDirecta(ID_CALIBRACION_DIRECTA, tk('Calibración', false))).toBe(false)
    expect(visibleCalibracionDirecta(ID_FALLA_CALIBRACION, tk('Calibración', false))).toBe(true)
    expect(visibleCalibracionDirecta('ingreso_a_servicio', tk(null, false))).toBe(true)
  })
})

describe('erroresDescripcionFalla · sólo el texto en blanco (D2)', () => {
  it('sólo espacios en el escape → un error que nombra el campo', () => {
    for (const v of ['   ', '\t', ' \n ']) expect(erroresDescripcionFalla(ID_FALLA_CALIBRACION, { [CLAVE_DESCRIPCION_FALLA]: v })).toEqual([`"${CLAVE_DESCRIPCION_FALLA}" no puede estar en blanco`])
  })
  it('ausente, vacía o con texto → sin error propio (la ausencia la da transitionExec)', () => {
    expect(erroresDescripcionFalla(ID_FALLA_CALIBRACION, {})).toEqual([])
    expect(erroresDescripcionFalla(ID_FALLA_CALIBRACION, { [CLAVE_DESCRIPCION_FALLA]: '' })).toEqual([])
    expect(erroresDescripcionFalla(ID_FALLA_CALIBRACION, { [CLAVE_DESCRIPCION_FALLA]: 'se descalibró' })).toEqual([])
    expect(erroresDescripcionFalla(ID_FALLA_CALIBRACION, { [CLAVE_DESCRIPCION_FALLA]: 12 })).toEqual([])
  })
  it('otra transición con el mismo valor en blanco → sin error', () => {
    for (const id of [ID_CALIBRACION_DIRECTA, 'ingreso_a_servicio', 'finalizacion_servicio']) expect(erroresDescripcionFalla(id, { [CLAVE_DESCRIPCION_FALLA]: '   ' }), id).toEqual([])
  })
})

describe('RQ-TS-53 / RQ-PM-39 · el interruptor quita las dos (cláusula en motivoQuitadaPorInterruptor)', () => {
  it('apagado, las dos dan motivo y no se ven; encendido, null y se ven', () => {
    for (const id of IDS_CALIBRACION_DIRECTA) {
      expect(motivoQuitadaPorInterruptor(id, false), `${id} apagado`).toMatch(/control de calidad/)
      expect(visibleConControlCalidad(id, false), `${id} apagado`).toBe(false)
      expect(motivoQuitadaPorInterruptor(id, true), `${id} encendido`).toBeNull()
      expect(visibleConControlCalidad(id, true), `${id} encendido`).toBe(true)
    }
  })
  it('lo que ya hacía el interruptor no cambia', () => {
    expect(visibleConControlCalidad('ingreso_a_servicio', false)).toBe(true)
    expect(visibleConControlCalidad('finalizacion_servicio', true)).toBe(false)
  })
})
