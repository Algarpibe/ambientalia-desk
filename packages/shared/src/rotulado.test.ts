import { describe, it, expect } from 'vitest'
import { pendienteDeRotular, puedeConfirmarRotulado, etiquetaNoGenerada } from './rotulado'

/**
 * F1B-04 (`rotulado-tras-enviar`) · lote 1b. RQ-RE-41 (R41-a) y el permiso de la acción (PR-1).
 * Cada fila es una fila de la tabla de RQ-RE-41; `novedades` no nulo = formulario nuevo.
 */
const NOV = [{ codigo: 'sin_novedad' }]
const base = { novedades: NOV as unknown, estado: 'ok', anuladaAt: null as string | null, rotuladoAt: null as string | null }

describe('R41-a · pendienteDeRotular: una prueba por fila de la tabla de RQ-RE-41', () => {
  it('`pendiente` o `error`, sin rotulado_at → falso', () => {
    expect(pendienteDeRotular({ ...base, estado: 'pendiente' })).toBe(false)
    expect(pendienteDeRotular({ ...base, estado: 'error' })).toBe(false)
  })
  it('`ok`, sin rotulado_at → verdadero', () => { expect(pendienteDeRotular(base)).toBe(true) })
  it('`ok_con_avisos`, sin rotulado_at → verdadero', () => { expect(pendienteDeRotular({ ...base, estado: 'ok_con_avisos' })).toBe(true) })
  it('`ok` u `ok_con_avisos`, con rotulado_at → falso', () => {
    expect(pendienteDeRotular({ ...base, rotuladoAt: '2026-10-12T10:00:00.000Z' })).toBe(false)
    expect(pendienteDeRotular({ ...base, estado: 'ok_con_avisos', rotuladoAt: '2026-10-12T10:00:00.000Z' })).toBe(false)
  })
  it('`ok` anulada, sin rotulado_at → falso', () => { expect(pendienteDeRotular({ ...base, anuladaAt: '2026-10-12T09:00:00.000Z' })).toBe(false) })
  it('`ok` de legado (novedades NULL) → falso', () => { expect(pendienteDeRotular({ ...base, novedades: null })).toBe(false) })
  it('creada antes del despliegue (ya trae rotulado_at), enviada después → falso', () => {
    expect(pendienteDeRotular({ ...base, estado: 'ok', rotuladoAt: '2026-10-01T10:00:00.000Z' })).toBe(false)
  })
})

describe('PR-1 · puedeConfirmarRotulado: Servicio Técnico o administrador (S1)', () => {
  it('el área Servicio Técnico puede', () => { expect(puedeConfirmarRotulado({ areas: ['Servicio Técnico'], isAdmin: false })).toBe(true) })
  it('un administrador sin el área puede', () => { expect(puedeConfirmarRotulado({ areas: [], isAdmin: true })).toBe(true) })
  it('otra área no puede', () => { expect(puedeConfirmarRotulado({ areas: ['Comercial'], isAdmin: false })).toBe(false) })
  it('sin áreas ni administrador no puede', () => { expect(puedeConfirmarRotulado({ areas: [], isAdmin: false })).toBe(false) })
})

/**
 * F1B-04 · lote 2 · RQ-AV-22 (AV22-a…d): `etiquetaNoGenerada`. Regla de G1 (datos del analista leídos en el flujo de n8n el
 * 2026-10-12, segunda mano, hipótesis): estado `ok`/`ok_con_avisos` Y `dymoId` vacío. Nunca por el texto de `avisos[].paso`.
 */
describe('AV22-a · etiquetaNoGenerada: las formas de vacío avisan', () => {
  it.each<[string, unknown]>([
    ['dymoId ausente', { pdfId: 'p' }], ['dymoId null', { dymoId: null }], ['dymoId cadena vacía', { dymoId: '' }],
    ['dymoId sólo espacios', { dymoId: '   ' }], ['resultado null', null], ['resultado ausente', undefined],
    ['resultado que no es objeto', 'texto'], ['dymoId que no es texto', { dymoId: 7 }],
  ])('ok_con_avisos · %s → verdadero', (_t, resultado) => { expect(etiquetaNoGenerada('ok_con_avisos', resultado)).toBe(true) })
  it('estado ok · sin resultado → verdadero', () => { expect(etiquetaNoGenerada('ok', undefined)).toBe(true) })
})
describe('AV22-b · un dymoId presente no avisa', () => {
  it('ok y ok_con_avisos con id de Drive → falso', () => {
    expect(etiquetaNoGenerada('ok', { dymoId: 'drive-1' })).toBe(false)
    expect(etiquetaNoGenerada('ok_con_avisos', { dymoId: 'drive-1' })).toBe(false)
  })
})
describe('AV22-c · el estado error y el pendiente no avisan', () => {
  it('error sin dymoId → falso; pendiente → falso', () => {
    expect(etiquetaNoGenerada('error', { dymoId: null })).toBe(false)
    expect(etiquetaNoGenerada('error', undefined)).toBe(false)
    expect(etiquetaNoGenerada('pendiente', undefined)).toBe(false)
  })
})
describe('AV22-d · la condición no depende del texto del paso', () => {
  it('con dymoId vacío avisa sea cual sea el paso; con dymoId presente no avisa aunque el paso hable de la etiqueta', () => {
    expect(etiquetaNoGenerada('ok_con_avisos', { dymoId: null, avisos: [{ paso: 'un nombre cualquiera' }] })).toBe(true)
    expect(etiquetaNoGenerada('ok_con_avisos', { dymoId: null, avisos: [{ paso: 'la etiqueta .dymo' }] })).toBe(true)
    expect(etiquetaNoGenerada('ok_con_avisos', { dymoId: 'drive-1', avisos: [{ paso: 'la etiqueta .dymo' }] })).toBe(false)
  })
})
