import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { motivoSinRemisionVigente } from '@ambientalia/shared'
import { motivoNoHabilitar, avisoRemisionSinConfirmar } from './habilitarServicio'

/**
 * RQ-TS-33 (F1B-03, parte L), lado cliente. Todo es COMODIDAD o PRESENTACIÓN: la guarda es la del servidor
 * (`exigirRemisionVigente`). Aquí se prueba que el cliente no redefine «vigente» ni «confirmada».
 */
const R = (estado: string, over: Partial<{ tipo: string; anuladaAt: string | null }> = {}) =>
  ({ tipo: 'entrada', anuladaAt: null, estado, ...over })

const MOTIVO_ALTA = 'Falta validar el alta del cliente y del equipo.'
const MOTIVO_REMISION = motivoSinRemisionVigente([]) as string
const AVISO = 'Remisión de entrada sin confirmar: el servicio se puede habilitar, pero el documento de la remisión todavía no está generado.'

describe('motivoNoHabilitar (bloquea; el orden es el de la línea de la guarda del servidor)', () => {
  it('con alta pendiente y sin remisión devuelve el de alta primero', () => {
    expect(motivoNoHabilitar(MOTIVO_ALTA, [])).toBe(MOTIVO_ALTA)
  })

  it('sin alta pendiente y sin remisión devuelve el texto único de remisión', () => {
    expect(motivoNoHabilitar(null, [])).toBe(MOTIVO_REMISION)
  })

  it('con las remisiones sin cargar (null o undefined) no bloquea: decide el servidor', () => {
    expect(motivoNoHabilitar(null, null)).toBeNull()
    expect(motivoNoHabilitar(null, undefined)).toBeNull()
  })

  it('con las remisiones sin cargar, el de alta sigue mandando', () => {
    expect(motivoNoHabilitar(MOTIVO_ALTA, null)).toBe(MOTIVO_ALTA)
  })

  it('sólo anuladas o sólo de otro tipo: el texto único', () => {
    expect(motivoNoHabilitar(null, [R('ok', { anuladaAt: '2026-10-01' })])).toBe(MOTIVO_REMISION)
    expect(motivoNoHabilitar(null, [R('ok', { tipo: 'salida' })])).toBe(MOTIVO_REMISION)
  })

  it('con una vigente en CUALQUIER estado no bloquea, también pendiente, error o desconocido', () => {
    for (const estado of ['ok', 'ok_con_avisos', 'pendiente', 'error', 'raro']) {
      expect(motivoNoHabilitar(null, [R(estado)])).toBeNull()
    }
  })
})

describe('avisoRemisionSinConfirmar (NO bloquea: sólo presentación)', () => {
  it('única vigente pendiente o en error: el aviso', () => {
    expect(avisoRemisionSinConfirmar([R('pendiente')])).toBe(AVISO)
    expect(avisoRemisionSinConfirmar([R('error')])).toBe(AVISO)
  })

  it('una pendiente y otra ok vigentes: sin aviso', () => {
    expect(avisoRemisionSinConfirmar([R('pendiente'), R('ok')])).toBeNull()
  })

  it('vigente en ok_con_avisos: sin aviso', () => {
    expect(avisoRemisionSinConfirmar([R('ok_con_avisos')])).toBeNull()
  })

  it('sin vigentes (vacía, sólo anuladas, tipo distinto): sin aviso, manda el motivo de bloqueo', () => {
    expect(avisoRemisionSinConfirmar([])).toBeNull()
    expect(avisoRemisionSinConfirmar([R('pendiente', { anuladaAt: '2026-10-01' })])).toBeNull()
    expect(avisoRemisionSinConfirmar([R('pendiente', { tipo: 'salida' })])).toBeNull()
  })

  it('una pendiente anulada junto a una ok vigente: sin aviso', () => {
    expect(avisoRemisionSinConfirmar([R('pendiente', { anuladaAt: '2026-10-01' }), R('ok')])).toBeNull()
  })

  it('con las remisiones sin cargar: sin aviso', () => {
    expect(avisoRemisionSinConfirmar(null)).toBeNull()
    expect(avisoRemisionSinConfirmar(undefined)).toBeNull()
  })
})

// RQ-RE-20 · «El cliente no redefine "vigente"»: regla invariable 13, punto 1. Una prueba de texto, a propósito:
// lo que vigila es que ninguna copia de la definición vuelva a vivir en el cliente.
describe('el cliente no redefine «vigente» ni «confirmada»', () => {
  const leer = (f: string) => readFileSync(path.resolve(__dirname, f), 'utf8')
  for (const f of ['habilitarServicio.ts', 'botonRemision.ts']) {
    it(`${f} consume los predicados compartidos y no copia sus condiciones`, () => {
      const src = leer(f)
      expect(src).toMatch(/esRemisionEntradaVigente|motivoSinRemisionVigente/)
      expect(src).not.toContain('anuladaAt')
      expect(src).not.toContain("'ok_con_avisos'")
    })
  }
})
