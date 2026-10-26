// valor-reclamado-usd (F1B-13), lote L1: la foto del valor reclamado, el origen al editar y su etiqueta (RQ-TC-78, RQ-TC-79).
import { describe, it, expect } from 'vitest'
import {
  lineasDeLaOVI, fotoValorReclamado, origenTrasEditar, etiquetaOrigenValor, SIN_FOTO, ETIQUETA_ORIGEN_VALOR,
} from './valorReclamado'
import { ORIGEN_VALOR_MANUAL, ORIGEN_VALOR_OVI, MONEDA_GARANTIA_PROVEEDOR } from './garantiaProveedor'

const linea = (itemId: string, cantidad: number) => ({ itemId, cantidad })
const costos = (...p: [string, number | null][]) => new Map<string, number | null>(p)

describe('constantes de la foto', () => {
  it('el origen de la OVI, el manual y la moneda USD', () => {
    expect(ORIGEN_VALOR_OVI).toBe('ovi')
    expect(ORIGEN_VALOR_MANUAL).toBe('manual')
    expect(MONEDA_GARANTIA_PROVEEDOR).toBe('USD')
  })
  it('SIN_FOTO es valor null con origen manual (S-3)', () => {
    expect(SIN_FOTO).toEqual({ valorReclamado: null, origenValorReclamado: 'manual' })
  })
})

describe('lineasDeLaOVI (S-4, mitad de la orden)', () => {
  const raw = { line_items: [{ item_id: 'A', quantity: 2 }, { item_id: 'B', quantity: 1 }] }

  it('lee el raw como objeto', () => {
    expect(lineasDeLaOVI(raw)).toEqual([linea('A', 2), linea('B', 1)])
  })
  it('lee el raw como texto JSON (D-8)', () => {
    expect(lineasDeLaOVI(JSON.stringify(raw))).toEqual([linea('A', 2), linea('B', 1)])
  })
  it('null si el raw no es objeto ni texto que parsee a objeto', () => {
    for (const r of [null, undefined, 5, 'no es json', '[]', '5', []]) expect(lineasDeLaOVI(r)).toBeNull()
  })
  it('null con line_items ausente, vacía o que no es lista', () => {
    expect(lineasDeLaOVI({})).toBeNull()
    expect(lineasDeLaOVI({ line_items: [] })).toBeNull()
    expect(lineasDeLaOVI({ line_items: 'x' })).toBeNull()
    expect(lineasDeLaOVI({ line_items: { item_id: 'A', quantity: 1 } })).toBeNull()
  })
  it('null si alguna línea no trae item_id de texto no vacío', () => {
    expect(lineasDeLaOVI({ line_items: [{ item_id: 'A', quantity: 1 }, { quantity: 1 }] })).toBeNull()
    expect(lineasDeLaOVI({ line_items: [{ item_id: '', quantity: 1 }] })).toBeNull()
    expect(lineasDeLaOVI({ line_items: [{ item_id: 7, quantity: 1 }] })).toBeNull()
  })
  it('null con cantidad 0, negativa, no finita o en texto', () => {
    for (const q of [0, -1, Infinity, NaN, '2']) {
      expect(lineasDeLaOVI({ line_items: [{ item_id: 'A', quantity: q }] })).toBeNull()
    }
  })
  it('la cantidad en texto dentro de un raw en texto sigue siendo hueco', () => {
    expect(lineasDeLaOVI(JSON.stringify({ line_items: [{ item_id: 'A', quantity: '2' }] }))).toBeNull()
  })
})

describe('fotoValorReclamado (RQ-TC-78, S-4 y S-6)', () => {
  it('2 × 150,54 + 1 × 10 = 311,08, origen ovi', () => {
    const f = fotoValorReclamado([linea('A', 2), linea('B', 1)], costos(['A', 150.54], ['B', 10]))
    expect(f).toEqual({ valorReclamado: 311.08, origenValorReclamado: 'ovi' })
  })
  it('un artículo repetido en dos líneas cuenta dos veces: 40', () => {
    const f = fotoValorReclamado([linea('A', 1), linea('A', 1)], costos(['A', 20]))
    expect(f.valorReclamado).toBe(40)
    expect(f.origenValorReclamado).toBe('ovi')
  })
  it('el redondeo es uno solo, al final: tres de 1 × 0,004 dan 0,01', () => {
    const f = fotoValorReclamado([linea('A', 1), linea('B', 1), linea('C', 1)], costos(['A', 0.004], ['B', 0.004], ['C', 0.004]))
    expect(f.valorReclamado).toBe(0.01)
  })
  it('sin líneas (null) no hay foto', () => {
    expect(fotoValorReclamado(null, costos(['A', 10]))).toEqual(SIN_FOTO)
  })
  it('un artículo ausente del mapa o con costo 0 da SIN_FOTO, nunca una suma parcial', () => {
    expect(fotoValorReclamado([linea('A', 1), linea('B', 1)], costos(['A', 100]))).toEqual(SIN_FOTO)
    expect(fotoValorReclamado([linea('A', 1), linea('B', 1)], costos(['A', 100], ['B', 0]))).toEqual(SIN_FOTO)
  })
  it('costo null, negativo o no finito da SIN_FOTO', () => {
    for (const c of [null, -5, Infinity, NaN]) {
      expect(fotoValorReclamado([linea('A', 1)], costos(['A', c]))).toEqual(SIN_FOTO)
    }
  })
})

describe('origenTrasEditar (RQ-TC-79, S-5)', () => {
  const ficha = (valorReclamado: number | null, origenValorReclamado: string | null) => ({ valorReclamado, origenValorReclamado })

  it('NULL→NULL conserva el origen', () => {
    expect(origenTrasEditar(ficha(null, 'manual'), null)).toBe('manual')
  })
  it('X→X conserva el origen ovi', () => {
    expect(origenTrasEditar(ficha(311.08, 'ovi'), 311.08)).toBe('ovi')
  })
  it('X→Y pasa a manual', () => {
    expect(origenTrasEditar(ficha(311.08, 'ovi'), 300)).toBe('manual')
  })
  it('NULL→X pasa a manual', () => {
    expect(origenTrasEditar(ficha(null, 'manual'), 50)).toBe('manual')
    expect(origenTrasEditar(ficha(null, 'ovi'), 50)).toBe('manual')
  })
  it('X→NULL pasa a manual', () => {
    expect(origenTrasEditar(ficha(311.08, 'ovi'), null)).toBe('manual')
  })
})

describe('etiquetaOrigenValor (S-7)', () => {
  it('las dos etiquetas', () => {
    expect(ETIQUETA_ORIGEN_VALOR).toEqual({ ovi: 'calculado de la OVI', manual: 'a mano' })
    expect(etiquetaOrigenValor(311.08, 'ovi')).toBe('calculado de la OVI')
    expect(etiquetaOrigenValor(50, 'manual')).toBe('a mano')
  })
  it('null si no hay valor o el origen no es de la lista', () => {
    expect(etiquetaOrigenValor(null, 'ovi')).toBeNull()
    expect(etiquetaOrigenValor(50, 'otro')).toBeNull()
    expect(etiquetaOrigenValor(50, null)).toBeNull()
    expect(etiquetaOrigenValor(50, undefined)).toBeNull()
  })
})
