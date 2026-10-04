import { describe, it, expect } from 'vitest'
import {
  CLAVE_MOTIVO_LIBERACION, CLAVE_FECHA_PREVISTA_FACTURACION, CLAVE_TEXTO_AUTORIZACION, MOTIVO_QUE_EXIGE_TEXTO,
  erroresLiberacionSinFactura, textoAutorizacionAGuardar, seVuelveAPedirEnCadaLiberacion,
} from './liberacionSinFactura'
import { esFechaCalendarioReal } from './fechasDerivadas'
import type { Transition } from './transitions'
import { transicionPorId } from './flujos'

/**
 * liberacion-sin-factura-motivo-fecha (F1C-05), lote 1 · la guarda de contenido, sobre una transición SINTÉTICA.
 *
 * El catálogo real todavía declaraba la casilla (`transitions.ts:247` en `0f3cafc`): la guarda se activa por el CAMPO y no por el id
 * (diseño D4), así que en este lote es inerte y se prueba con una transición fabricada aquí. Los mensajes son los
 * del diseño §4, en ese orden.
 */
const A = 'Fecha de corte de facturación del cliente'
const B = 'Servicio incluido en contrato con facturación periódica'
const C = 'Autorización excepcional de Dirección Comercial'

const sintetica: Pick<Transition, 'fields'> = {
  fields: [
    { key: 'comment', label: 'Comentario', kind: 'comment', required: false, target: 'comment' },
    { key: CLAVE_MOTIVO_LIBERACION, label: 'Motivo', kind: 'select', required: true, target: 'customField', options: [A, B, C] },
    { key: CLAVE_FECHA_PREVISTA_FACTURACION, label: CLAVE_FECHA_PREVISTA_FACTURACION, kind: 'date', required: true, target: 'customField' },
    { key: CLAVE_TEXTO_AUTORIZACION, label: CLAVE_TEXTO_AUTORIZACION, kind: 'text', required: false, target: 'customField' },
  ],
}
const sinCampo: Pick<Transition, 'fields'> = { fields: sintetica.fields.filter((f) => f.key === 'comment') }

const M_LISTA = `El motivo debe ser uno de: ${A} · ${B} · ${C}`
const M_FECHA = 'Fecha inválida en el campo: Fecha prevista de facturación'
const M_TEXTO = 'Falta el texto de la autorización: es obligatorio con el motivo «Autorización excepcional de Dirección Comercial»'
const v = (motivo: unknown, fecha: unknown = '2026-10-04', texto?: unknown) => ({
  [CLAVE_MOTIVO_LIBERACION]: motivo, [CLAVE_FECHA_PREVISTA_FACTURACION]: fecha, [CLAVE_TEXTO_AUTORIZACION]: texto,
})

describe('las cuatro constantes', () => {
  it('son las del diseño §4, letra por letra', () => {
    expect(CLAVE_MOTIVO_LIBERACION).toBe('Motivo de liberación sin factura')
    expect(CLAVE_FECHA_PREVISTA_FACTURACION).toBe('Fecha prevista de facturación')
    expect(CLAVE_TEXTO_AUTORIZACION).toBe('Texto de la autorización')
    expect(MOTIVO_QUE_EXIGE_TEXTO).toBe(C)
  })
  it('esFechaCalendarioReal se importa de fechasDerivadas', () => {
    expect(esFechaCalendarioReal('2026-10-04')).toBe(true)
    expect(esFechaCalendarioReal('2026-02-30')).toBe(false)
  })
})

describe('erroresLiberacionSinFactura · el motivo', () => {
  it('un motivo fuera de la lista da el error de lista, con las tres opciones unidas por « · »', () => {
    expect(erroresLiberacionSinFactura(sintetica, v('Otro motivo'))).toEqual([M_LISTA])
  })
  it('la igualdad es exacta: una diferencia de mayúsculas se rechaza', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(A.toLowerCase()))).toEqual([M_LISTA])
    expect(erroresLiberacionSinFactura(sintetica, v(A + ' '))).toEqual([M_LISTA])
  })
  it('un motivo que no es cadena se rechaza', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(5))).toEqual([M_LISTA])
  })
  it('los tres motivos válidos con fecha real, sin texto salvo el tercero, no dan error', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(A))).toEqual([])
    expect(erroresLiberacionSinFactura(sintetica, v(B))).toEqual([])
    expect(erroresLiberacionSinFactura(sintetica, v(C, '2026-10-04', 'Autoriza la Dirección'))).toEqual([])
  })
})

describe('erroresLiberacionSinFactura · la fecha', () => {
  it.each(['2026-02-30', '04/10/2026', '2026-10-04T10:00:00Z', '2026-10-04 ', '2026-1-4'])('%s se rechaza', (f) => {
    expect(erroresLiberacionSinFactura(sintetica, v(A, f))).toEqual([M_FECHA])
  })
  it('una fecha que no es cadena se rechaza', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(A, 20261004))).toEqual([M_FECHA])
  })
  it('una fecha pasada se acepta (SP-1)', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(A, '2020-01-01'))).toEqual([])
  })
})

describe('erroresLiberacionSinFactura · el texto de la autorización excepcional', () => {
  it('el tercer motivo sin texto, con texto de sólo espacios o con texto que no es cadena, da el error de texto', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(C))).toEqual([M_TEXTO])
    expect(erroresLiberacionSinFactura(sintetica, v(C, '2026-10-04', '   '))).toEqual([M_TEXTO])
    expect(erroresLiberacionSinFactura(sintetica, v(C, '2026-10-04', 7))).toEqual([M_TEXTO])
  })
  it('el primer y el segundo motivo no exigen texto, ni con texto de sólo espacios', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(A))).toEqual([])
    expect(erroresLiberacionSinFactura(sintetica, v(B, '2026-10-04', '   '))).toEqual([])
  })
})

describe('erroresLiberacionSinFactura · presencia, orden y activación', () => {
  it('los vacíos (undefined, null, cadena vacía) no son error de esta guarda: la presencia es del motor', () => {
    for (const vacio of [undefined, null, '']) {
      expect(erroresLiberacionSinFactura(sintetica, v(vacio, vacio))).toEqual([])
    }
    expect(erroresLiberacionSinFactura(sintetica, {})).toEqual([])
    expect(erroresLiberacionSinFactura(sintetica, null)).toEqual([])
  })
  it('con el tercer motivo y la fecha ausente sólo sale el de texto (la fecha vacía no es suya)', () => {
    expect(erroresLiberacionSinFactura(sintetica, v(C, undefined))).toEqual([M_TEXTO])
  })
  it('los tres errores a la vez salen en el orden lista, fecha, texto', () => {
    // La lista y el texto no pueden coincidir (el texto exige el tercer motivo), así que el orden completo se prueba
    // con dos a la vez en cada caso: lista + fecha y fecha + texto.
    expect(erroresLiberacionSinFactura(sintetica, v('Otro', '2026-02-30'))).toEqual([M_LISTA, M_FECHA])
    expect(erroresLiberacionSinFactura(sintetica, v(C, '2026-02-30'))).toEqual([M_FECHA, M_TEXTO])
  })
  it('una transición que no declara el campo del motivo da [] aunque los valores sean basura', () => {
    expect(erroresLiberacionSinFactura(sinCampo, v('Otro', '2026-02-30'))).toEqual([])
  })
})

describe('textoAutorizacionAGuardar', () => {
  it('undefined si la transición no declara el campo del motivo', () => {
    expect(textoAutorizacionAGuardar(sinCampo, v(C, '2026-10-04', 'x'))).toBeUndefined()
  })
  it('el texto recortado si lo hay', () => {
    expect(textoAutorizacionAGuardar(sintetica, v(C, '2026-10-04', '  Autoriza  '))).toBe('Autoriza')
  })
  it('null si no hay texto, es de sólo espacios o no es cadena (D7: siempre se escribe)', () => {
    expect(textoAutorizacionAGuardar(sintetica, v(A))).toBeNull()
    expect(textoAutorizacionAGuardar(sintetica, v(A, '2026-10-04', '   '))).toBeNull()
    expect(textoAutorizacionAGuardar(sintetica, v(A, '2026-10-04', 3))).toBeNull()
    expect(textoAutorizacionAGuardar(sintetica, null)).toBeNull()
  })
})

describe('seVuelveAPedirEnCadaLiberacion', () => {
  it('es verdadero para las tres claves y falso para cualquier otra', () => {
    expect(seVuelveAPedirEnCadaLiberacion(CLAVE_MOTIVO_LIBERACION)).toBe(true)
    expect(seVuelveAPedirEnCadaLiberacion(CLAVE_FECHA_PREVISTA_FACTURACION)).toBe(true)
    expect(seVuelveAPedirEnCadaLiberacion(CLAVE_TEXTO_AUTORIZACION)).toBe(true)
    expect(seVuelveAPedirEnCadaLiberacion('Serial')).toBe(false)
    expect(seVuelveAPedirEnCadaLiberacion('Motivo')).toBe(false)
  })
})

describe('el catálogo real declara los tres campos (lote 2)', () => {
  const real = transicionPorId('liberacion_sin_factura')!
  it('el motivo lleva exactamente las tres opciones, en orden, y ninguna casilla', () => {
    const motivo = real.fields.find((f) => f.key === CLAVE_MOTIVO_LIBERACION)!
    expect(motivo).toMatchObject({ label: 'Motivo', kind: 'select', required: true, target: 'customField' })
    expect(motivo.options).toEqual([
      'Fecha de corte de facturación del cliente',
      'Servicio incluido en contrato con facturación periódica',
      'Autorización excepcional de Dirección Comercial',
    ])
    expect(real.fields.some((f) => f.kind === 'checkbox')).toBe(false)
  })
  it('el motivo que exige texto es una de las opciones del catálogo', () => {
    expect(real.fields.find((f) => f.key === CLAVE_MOTIVO_LIBERACION)!.options).toContain(MOTIVO_QUE_EXIGE_TEXTO)
  })
  it('las tres claves de re-liberación son exactamente las de los campos customField de la transición', () => {
    const claves = real.fields.filter((f) => f.target === 'customField').map((f) => f.key)
    expect(claves).toEqual([CLAVE_MOTIVO_LIBERACION, CLAVE_FECHA_PREVISTA_FACTURACION, CLAVE_TEXTO_AUTORIZACION])
    expect(claves.every(seVuelveAPedirEnCadaLiberacion)).toBe(true)
  })
})
