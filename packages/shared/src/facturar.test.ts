import { describe, it, expect } from 'vitest'
import { CLAVE_NUMERO_FACTURA, CLAVE_FECHA_FACTURA, erroresFacturar, seRegistraEnCadaFactura } from './facturar'
import type { Transition } from './transitions'

/**
 * facturar-dos-ramas (F1C-02), lote 1 · la guarda de CONTENIDO de «Facturar» (escalón C, `design.md` D3), sobre una
 * transición sintética: se activa por el campo del número, no por el id. La presencia no es suya
 * (`apps/desk/server/transitionExec.ts:77`): un valor ausente o vacío no da error aquí.
 */
const sintetica: Pick<Transition, 'fields'> = {
  fields: [
    { key: 'comment', label: 'Comentario', kind: 'comment', required: false, target: 'comment' },
    { key: CLAVE_NUMERO_FACTURA, label: CLAVE_NUMERO_FACTURA, kind: 'text', required: true, target: 'customField' },
    { key: CLAVE_FECHA_FACTURA, label: CLAVE_FECHA_FACTURA, kind: 'date', required: true, target: 'customField' },
  ],
}
const sinCampo: Pick<Transition, 'fields'> = { fields: sintetica.fields.filter((f) => f.key !== CLAVE_NUMERO_FACTURA) }
const M_NUMERO = 'Falta el número de factura: no puede quedar en blanco'
const M_FECHA = 'Fecha inválida en el campo: Fecha De Factura'
const v = (numero: unknown, fecha: unknown = '2027-01-20') => ({ [CLAVE_NUMERO_FACTURA]: numero, [CLAVE_FECHA_FACTURA]: fecha })

describe('las claves de «Facturar»', () => {
  it('son «Número de factura» y «Fecha De Factura» (que la fecha va a `fecha_factura` lo fija la prueba del servidor)', () => {
    expect(CLAVE_NUMERO_FACTURA).toBe('Número de factura')
    expect(CLAVE_FECHA_FACTURA).toBe('Fecha De Factura')
  })
})

describe('erroresFacturar', () => {
  it('valores válidos no dan error', () => {
    expect(erroresFacturar(sintetica, v('FV-1234'))).toEqual([])
  })
  it('un número de sólo espacios da el error del número', () => {
    expect(erroresFacturar(sintetica, v('   '))).toEqual([M_NUMERO])
  })
  it('un número que no es cadena da el error del número', () => {
    expect(erroresFacturar(sintetica, v(7))).toEqual([M_NUMERO])
  })
  it('una fecha imposible o que no es fecha da el error de la fecha', () => {
    expect(erroresFacturar(sintetica, v('FV-1', '2027-02-30'))).toEqual([M_FECHA])
    expect(erroresFacturar(sintetica, v('FV-1', 'mañana'))).toEqual([M_FECHA])
  })
  it('los dos errores salen juntos, número antes que fecha', () => {
    expect(erroresFacturar(sintetica, v(' ', '2027-13-01'))).toEqual([M_NUMERO, M_FECHA])
  })
  it('la ausencia no es suya: número o fecha ausentes o vacíos no dan error aquí', () => {
    expect(erroresFacturar(sintetica, v(undefined, undefined))).toEqual([])
    expect(erroresFacturar(sintetica, v('', ''))).toEqual([])
    expect(erroresFacturar(sintetica, v(null, null))).toEqual([])
    expect(erroresFacturar(sintetica, undefined)).toEqual([])
  })
  it('una transición sin el campo del número no se mira', () => {
    expect(erroresFacturar(sinCampo, v('  ', 'x'))).toEqual([])
  })
})

describe('seRegistraEnCadaFactura (S-12)', () => {
  it('es cierto para el número y la fecha de factura, y falso para el resto', () => {
    expect(seRegistraEnCadaFactura(CLAVE_NUMERO_FACTURA)).toBe(true)
    expect(seRegistraEnCadaFactura(CLAVE_FECHA_FACTURA)).toBe(true)
    expect(seRegistraEnCadaFactura('Fecha Remisión de Salida')).toBe(false)
    expect(seRegistraEnCadaFactura('fecha de factura')).toBe(false)
  })
})
