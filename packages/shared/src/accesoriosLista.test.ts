import { describe, it, expect } from 'vitest'
import {
  CLASE_ACCESORIO, CLASES_TEXTO_LIBRE, MENSAJES_ACCESORIOS, accesorioSinBooks, motivoAltaAccesorio, motivoCambioAAccesorio,
  puedeAnadirAccesorios, accesorioDelCuerpo, detalleDeAccesorios, detalleSinSku,
} from './accesoriosLista'
import { puedeMantenerNovedades } from './mantenimientoNovedades'
import { CLASES_ARTICULO, type ClaseArticulo } from './types'

/**
 * Accesorios de la remisión de entrada (F1B-04, RQ-RE-32, RQ-RE-33, RQ-RE-35). Todo es puro: node, sin base ni HTTP.
 * Los esperados salen de las tablas de casos de aquí, no de la implementación; los textos se comparan contra
 * `MENSAJES_ACCESORIOS`, no contra literales.
 */
const ST = ['Servicio Técnico']
const VACIOS: (string | null | undefined)[] = ['', null, undefined]

describe('clases', () => {
  it('CLASES_TEXTO_LIBRE es CLASES_ARTICULO sin accesorio, en el mismo orden', () => {
    expect(CLASE_ACCESORIO).toBe('accesorio')
    expect([...CLASES_TEXTO_LIBRE]).toEqual(CLASES_ARTICULO.filter((c) => c !== 'accesorio'))
    expect(CLASES_TEXTO_LIBRE).not.toContain('accesorio')
  })
})

describe('accesorioSinBooks (clase × itemId)', () => {
  it.each(CLASES_ARTICULO.flatMap((c) => [
    [c, 'IT-1', false],
    ...VACIOS.map((v) => [c, v, c === 'accesorio'] as const),
  ] as [ClaseArticulo, string | null | undefined, boolean][]))('%s con itemId %j: %s', (clase, itemId, esperado) => {
    expect(accesorioSinBooks(clase, itemId)).toBe(esperado)
  })
})

describe('motivoAltaAccesorio', () => {
  it.each(CLASES_ARTICULO.flatMap((c) => [
    [c, 'IT-1', null],
    ...VACIOS.map((v) => [c, v, c === 'accesorio' ? MENSAJES_ACCESORIOS.exigeBooks : null] as const),
  ] as [ClaseArticulo, string | null | undefined, string | null][]))('%s con itemId %j', (clase, itemId, esperado) => {
    expect(motivoAltaAccesorio(clase, itemId)).toBe(esperado)
  })
})

describe('motivoCambioAAccesorio', () => {
  it('consumible sin itemId hacia accesorio: cambioSinBooks', () => {
    for (const v of VACIOS) {
      expect(motivoCambioAAccesorio({ clase: 'consumible_repuesto', itemId: v }, 'accesorio')).toBe(MENSAJES_ACCESORIOS.cambioSinBooks)
    }
    expect(motivoCambioAAccesorio({ clase: 'mano_obra' }, 'accesorio')).toBe(MENSAJES_ACCESORIOS.cambioSinBooks)
  })
  it('con itemId hacia accesorio: null', () => {
    expect(motivoCambioAAccesorio({ clase: 'consumible_repuesto', itemId: 'IT-1' }, 'accesorio')).toBeNull()
  })
  it('la fila que YA es accesorio da null aunque no tenga itemId (el legado se puede desactivar repitiendo la clase)', () => {
    for (const v of VACIOS) expect(motivoCambioAAccesorio({ clase: 'accesorio', itemId: v }, 'accesorio')).toBeNull()
    expect(motivoCambioAAccesorio({ clase: 'accesorio' }, 'accesorio')).toBeNull()
  })
  it('hacia una clase que no es accesorio: null siempre', () => {
    for (const actual of CLASES_ARTICULO) {
      for (const nueva of CLASES_TEXTO_LIBRE) {
        for (const v of [...VACIOS, 'IT-1']) expect(motivoCambioAAccesorio({ clase: actual, itemId: v }, nueva)).toBeNull()
      }
    }
  })
})

describe('puedeAnadirAccesorios', () => {
  const sujetos: [string, Parameters<typeof puedeAnadirAccesorios>[0], boolean][] = [
    ['administrador', { areas: [], isAdmin: true, cargoPermiso: null }, true],
    ['Director Técnico de Servicio Técnico', { areas: ST, isAdmin: false, cargoPermiso: 'Director Técnico' }, true],
    ['técnico sin el cargo', { areas: ST, isAdmin: false, cargoPermiso: 'Técnico' }, false],
    ['técnico sin cargo alguno', { areas: ST, isAdmin: false, cargoPermiso: null }, false],
    ['Director Técnico de otra área', { areas: ['Comercial'], isAdmin: false, cargoPermiso: 'Director Técnico' }, false],
  ]
  it.each(sujetos)('%s', (_n, s, esperado) => {
    expect(puedeAnadirAccesorios(s)).toBe(esperado)
    expect(puedeAnadirAccesorios(s)).toBe(puedeMantenerNovedades(s))
  })
  it('sujeto ausente: se comporta como puedeMantenerNovedades (lanza igual, no abre el permiso)', () => {
    const ausente = undefined as never
    expect(() => puedeMantenerNovedades(ausente)).toThrow()
    expect(() => puedeAnadirAccesorios(ausente)).toThrow()
  })
})

describe('accesorioDelCuerpo', () => {
  it.each([[null], [undefined], ['texto'], [42], [[]], [{}], [{ itemId: 5 }], [{ itemId: '' }], [{ itemId: '   ' }], [{ itemId: null }], [{ nombre: 'Cable' }]])(
    '%j: faltaArticulo', (cuerpo) => {
      expect(accesorioDelCuerpo(cuerpo)).toEqual({ ok: false, error: MENSAJES_ACCESORIOS.faltaArticulo })
    })
  it('recorta el itemId', () => {
    expect(accesorioDelCuerpo({ itemId: '  IT-9 ' })).toEqual({ ok: true, itemId: 'IT-9' })
  })
  it('ignora clase, nombre y sku del cuerpo sin rechazarlos', () => {
    expect(accesorioDelCuerpo({ itemId: 'IT-9', clase: 'consumible_repuesto', nombre: 'Inventado', sku: 'X' })).toEqual({ ok: true, itemId: 'IT-9' })
  })
})

describe('detalleDeAccesorios', () => {
  const art = (clase: ClaseArticulo, nombre: string, sku?: string | null) => ({ clase, nombre, sku })
  it('sólo la clase accesorio, con nombre y SKU, en el orden de entrada', () => {
    expect(detalleDeAccesorios([art('accesorio', 'Cable USB', 'CB-100'), art('consumible_repuesto', 'Filtro', 'F-1'), art('accesorio', 'Maleta', 'M-2'), art('mano_obra', 'Hora')]))
      .toEqual([{ nombre: 'Cable USB', sku: 'CB-100' }, { nombre: 'Maleta', sku: 'M-2' }])
  })
  it('sku ausente, nulo o vacío sale null', () => {
    expect(detalleDeAccesorios([art('accesorio', 'A'), art('accesorio', 'B', null), art('accesorio', 'C', '')]))
      .toEqual([{ nombre: 'A', sku: null }, { nombre: 'B', sku: null }, { nombre: 'C', sku: null }])
  })
  it('deduplica por nombre exacto y gana la primera aparición (con su SKU)', () => {
    expect(detalleDeAccesorios([art('accesorio', 'Cable', 'PRIMERO'), art('accesorio', 'Otro', 'O'), art('accesorio', 'Cable', 'SEGUNDO')]))
      .toEqual([{ nombre: 'Cable', sku: 'PRIMERO' }, { nombre: 'Otro', sku: 'O' }])
  })
  it('un duplicado de otra clase no le quita el sitio al accesorio', () => {
    expect(detalleDeAccesorios([art('consumible_repuesto', 'Cable', 'C'), art('accesorio', 'Cable', 'A')])).toEqual([{ nombre: 'Cable', sku: 'A' }])
  })
  it('el nombre exacto distingue mayúsculas', () => {
    expect(detalleDeAccesorios([art('accesorio', 'Cable'), art('accesorio', 'cable')])).toHaveLength(2)
  })
  it('lista vacía: vacío', () => {
    expect(detalleDeAccesorios([])).toEqual([])
  })
})

describe('detalleSinSku', () => {
  it('todo sale con sku null, deduplicado, conservando el orden', () => {
    expect(detalleSinSku(['Cable', 'Maleta', 'Cable', 'Cargador'])).toEqual([
      { nombre: 'Cable', sku: null }, { nombre: 'Maleta', sku: null }, { nombre: 'Cargador', sku: null },
    ])
  })
  it('lista vacía: vacío', () => {
    expect(detalleSinSku([])).toEqual([])
  })
})
