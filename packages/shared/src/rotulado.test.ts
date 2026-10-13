import { describe, it, expect } from 'vitest'
import { pendienteDeRotular, puedeConfirmarRotulado } from './rotulado'

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
