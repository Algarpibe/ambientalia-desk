import { describe, it, expect } from 'vitest'
import {
  CLAVE_CODIGO_SERVICIO, CLAVE_CODIGO_SERVICIO_ANTERIOR, MENSAJE_CODIGO_BLOQUEADO,
  puedeCambiarCodigoServicio, cambiaCodigoSinPermiso, propuestaCodigoServicio, valoresConCodigoPrevio,
} from './codigoServicio'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, transitionById } from './transitions'

/**
 * El código de servicio se fija una vez (`tickets-core` RQ-TC-81, RQ-TC-82; `transitions-st` RQ-TS-65, RQ-TS-66).
 * Dominio puro: el servidor y el cliente CONSUMEN estas funciones (regla invariable 13, punto 1).
 */
const CON_CAMPO = transitionById('ingreso_a_servicio')!
const SIN_CAMPO = transitionById('escalado_a_revision')!
const NO_ADMIN = { isAdmin: false }
const ADMIN = { isAdmin: true }
const cambia = (valor: unknown, actual: string | null, s: { isAdmin: boolean } = NO_ADMIN, t = CON_CAMPO) =>
  cambiaCodigoSinPermiso(t, { [CLAVE_CODIGO_SERVICIO]: valor }, actual, s)

describe('claves y mensaje', () => {
  it('la clave es la etiqueta del campo, y la anterior es la misma con el sufijo', () => {
    expect(CLAVE_CODIGO_SERVICIO).toBe('Código Servicio')
    expect(CLAVE_CODIGO_SERVICIO_ANTERIOR).toBe('Código Servicio anterior')
    expect(MENSAJE_CODIGO_BLOQUEADO).toBe('El código de servicio de este ticket ya está fijado: sólo un administrador puede cambiarlo')
  })
  it('sólo el administrador puede cambiarlo, y un cargo de dirección no exime', () => {
    expect(puedeCambiarCodigoServicio({ isAdmin: true })).toBe(true)
    expect(puedeCambiarCodigoServicio({ isAdmin: false })).toBe(false)
    expect(cambiaCodigoSinPermiso(CON_CAMPO, { [CLAVE_CODIGO_SERVICIO]: 'B' }, 'A', { isAdmin: false, cargoPermiso: 'Director Técnico' } as never)).toBe(true)
    expect(cambiaCodigoSinPermiso(CON_CAMPO, { [CLAVE_CODIGO_SERVICIO]: 'B' }, 'A', { isAdmin: false, cargoPermiso: 'Director Comercial' } as never)).toBe(true)
  })
})

describe('cambiaCodigoSinPermiso (RQ-TC-81): tabla del predicado', () => {
  it('una transición sin el campo nunca dispara, aunque el cuerpo traiga la clave', () => {
    expect(cambia('B', 'A', NO_ADMIN, SIN_CAMPO)).toBe(false)
  })
  it.each([[null], [''], ['   '], [' \t ']])('previo %j: el ticket no lo tiene y cualquier valor pasa', (previo) => {
    expect(cambia('B', previo)).toBe(false)
  })
  it.each([[undefined], [null], ['']])('pedido %j: vacío (definición de transitionExec.ts:44) no dispara la guarda', (pedido) => {
    expect(cambia(pedido, 'A')).toBe(false)
  })
  it('sin la clave en el cuerpo, o con un cuerpo que no es objeto, no dispara', () => {
    expect(cambiaCodigoSinPermiso(CON_CAMPO, {}, 'A', NO_ADMIN)).toBe(false)
    expect(cambiaCodigoSinPermiso(CON_CAMPO, null, 'A', NO_ADMIN)).toBe(false)
    expect(cambiaCodigoSinPermiso(CON_CAMPO, undefined, 'A', NO_ADMIN)).toBe(false)
  })
  it('mismo valor, también con espacios alrededor: pasa', () => {
    expect(cambia('A', 'A')).toBe(false)
    expect(cambia('  A  ', 'A')).toBe(false)
    expect(cambia('A', '  A ')).toBe(false)
  })
  it('valor distinto: dispara sin administrador y no con administrador', () => {
    expect(cambia('B', 'A')).toBe(true)
    expect(cambia('B', 'A', ADMIN)).toBe(false)
  })
  it('un valor de sólo espacios con previo es un CAMBIO (se escribiría tal cual): dispara', () => {
    expect(cambia('   ', 'A')).toBe(true)
    expect(cambia('   ', 'A', ADMIN)).toBe(false)
  })
})

describe('catálogo (S-7, D5): qué transiciones llevan el campo', () => {
  const todas = [...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO]
  it('son exactamente ingreso_a_servicio y calibracion_directa', () => {
    const ids = [...new Set(todas.filter((t) => t.fields.some((f) => f.key === CLAVE_CODIGO_SERVICIO)).map((t) => t.id))].sort()
    expect(ids).toEqual(['calibracion_directa', 'ingreso_a_servicio'])
  })
  it('ninguna lleva a la vez priority y el código: el orden frente a la prioridad no es observable', () => {
    const ambas = todas.filter((t) => t.fields.some((f) => f.key === CLAVE_CODIGO_SERVICIO) && t.fields.some((f) => f.target === 'priority'))
    expect(ambas.map((t) => t.id)).toEqual([])
  })
  it('ninguna lleva el código junto a un campo de orden de venta: el orden frente a la unicidad no es observable', () => {
    const ambas = todas.filter((t) => t.fields.some((f) => f.key === CLAVE_CODIGO_SERVICIO)
      && t.fields.some((f) => f.kind === 'ordenVenta' || f.target === 'ovAdicional'))
    expect(ambas.map((t) => t.id)).toEqual([])
  })
})

describe('propuestaCodigoServicio (RQ-TC-82)', () => {
  const base = { clasificacion: 'Equipo para servicio de mantenimiento', tipoServicio: 'Reparación', serie: '18A18102', modelo: 'EDM180C', creadoEn: '2026-10-26T20:00:00Z' }
  it('el prefijo sale de la clasificación y del tipo', () => {
    const prefijo = (clasificacion: string, tipoServicio: string) => propuestaCodigoServicio({ ...base, clasificacion, tipoServicio }).split('_')[0]
    expect(prefijo('Equipo nuevo', 'Reparación')).toBe('HV')
    expect(prefijo('Soporte remoto', 'Reparación')).toBe('SR')
    expect(prefijo('Equipo para servicio de mantenimiento', 'Calibración')).toBe('CG')
    expect(prefijo('Equipo para servicio de mantenimiento', 'Protocolo')).toBe('PRO')
    expect(prefijo('Equipo para servicio de mantenimiento', 'Reparación')).toBe('MT')
  })
  it('serie y modelo se componen en orden, con el día de created_time', () => {
    expect(propuestaCodigoServicio(base)).toBe('MT_18A18102_EDM180C_261026')
  })
  it('las partes ausentes se omiten sin lanzar', () => {
    expect(propuestaCodigoServicio({ ...base, modelo: null })).toBe('MT_18A18102_261026')
    expect(propuestaCodigoServicio({ ...base, serie: null, modelo: undefined })).toBe('MT_261026')
    expect(propuestaCodigoServicio({ ...base, serie: '', modelo: '' })).toBe('MT_261026')
  })
  it('el día es el civil de Bogotá: ISO con Z reduce al día anterior si pasa de medianoche UTC', () => {
    expect(propuestaCodigoServicio({ ...base, creadoEn: '2026-10-27T03:00:00Z' }).endsWith('_261026')).toBe(true)
    expect(propuestaCodigoServicio({ ...base, creadoEn: '2026-10-27T12:00:00Z' }).endsWith('_261027')).toBe(true)
  })
  it('una YYYY-MM-DD pasa directa, y un Date se reduce a su día de Bogotá', () => {
    expect(propuestaCodigoServicio({ ...base, creadoEn: '2026-10-27' }).endsWith('_261027')).toBe(true)
    expect(propuestaCodigoServicio({ ...base, creadoEn: new Date('2026-10-27T03:00:00Z') as never }).endsWith('_261026')).toBe(true)
  })
  it('sin created_time válido la fecha se omite y no lanza', () => {
    for (const creadoEn of [null, undefined, '', 'no es una fecha', '2026-10-27T03:00:00']) {
      expect(propuestaCodigoServicio({ ...base, creadoEn: creadoEn as never })).toBe('MT_18A18102_EDM180C')
    }
  })
  it('clasificación y tipo ausentes no lanzan', () => {
    expect(propuestaCodigoServicio({ ...base, clasificacion: null, tipoServicio: null })).toBe('MT_18A18102_EDM180C_261026')
  })
})

describe('valoresConCodigoPrevio (RQ-TS-66)', () => {
  const v = (extra: Record<string, unknown> = {}) => ({ comment: 'x', [CLAVE_CODIGO_SERVICIO]: 'B', ...extra })
  it('con previo y un valor distinto añade el previo recortado', () => {
    expect(valoresConCodigoPrevio(v(), CON_CAMPO, '  A ')).toEqual(v({ [CLAVE_CODIGO_SERVICIO_ANTERIOR]: 'A' }))
  })
  it('primer código (previo null, vacío o espacios): no hay previo', () => {
    for (const previo of [null, '', '   ']) expect(valoresConCodigoPrevio(v(), CON_CAMPO, previo)).toEqual(v())
  })
  it('el mismo valor, también con espacios: no hay previo', () => {
    expect(valoresConCodigoPrevio(v({ [CLAVE_CODIGO_SERVICIO]: ' B ' }), CON_CAMPO, 'B')).toEqual(v({ [CLAVE_CODIGO_SERVICIO]: ' B ' }))
  })
  it('una transición sin el campo no lo añade', () => {
    expect(valoresConCodigoPrevio(v(), SIN_CAMPO, 'A')).toEqual(v())
  })
  it('una clave inyectada se borra siempre, haya o no cambio', () => {
    const inyectado = { [CLAVE_CODIGO_SERVICIO_ANTERIOR]: 'FALSO' }
    expect(valoresConCodigoPrevio(v(inyectado), CON_CAMPO, null)).toEqual(v())
    expect(valoresConCodigoPrevio(v(inyectado), CON_CAMPO, 'A')[CLAVE_CODIGO_SERVICIO_ANTERIOR]).toBe('A')
    expect(valoresConCodigoPrevio(v(inyectado), SIN_CAMPO, 'A')).toEqual(v())
  })
  it('sin la clave en los valores no añade previo, y no muta la entrada', () => {
    const entrada = { comment: 'x' }
    expect(valoresConCodigoPrevio(entrada, CON_CAMPO, 'A')).toEqual({ comment: 'x' })
    const con = v()
    valoresConCodigoPrevio(con, CON_CAMPO, 'A')
    expect(con).toEqual(v())
  })
})
