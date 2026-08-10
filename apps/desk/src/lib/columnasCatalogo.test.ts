import { describe, it, expect } from 'vitest'
import {
  COLUMNAS_CATALOGO, PREF_POR_DEFECTO, normalizarPref, moverColumna, columnasVisibles,
  type ColumnaCatalogo,
} from './columnasCatalogo'

describe('columnasCatalogo', () => {
  it('por defecto se ven todas menos Estado, en el orden declarado', () => {
    // Estado se oculta de salida porque el catálogo solo lista modelos activos: la columna diría
    // «Activo» en todas las filas. Sigue disponible para quien la quiera.
    expect(columnasVisibles(PREF_POR_DEFECTO)).toEqual(['marca', 'modelo', 'tipo', 'articuloNombre', 'articuloCategoria', 'sku'])
  })

  /**
   * El caso que rompe una preferencia guardada: se añade una columna al código y el usuario tiene en
   * localStorage un orden de la versión anterior. Si no se saneara, la columna nueva no aparecería
   * jamás para quien ya hubiera tocado la tabla — un fallo invisible que solo sufren los veteranos.
   */
  it('añade al final las columnas que el guardado no conocía', () => {
    const antiguo = { orden: ['modelo', 'marca'], ocultas: [] }
    const p = normalizarPref(antiguo)
    expect(p.orden.slice(0, 2)).toEqual(['modelo', 'marca'])
    expect(p.orden).toHaveLength(COLUMNAS_CATALOGO.length)
    expect(p.orden).toContain('sku')
  })

  // Al revés: una columna retirada del código no debe quedarse en el orden guardado, o la tabla
  // intentaría pintar una cabecera que ya no existe.
  it('descarta del guardado las columnas que ya no existen', () => {
    const p = normalizarPref({ orden: ['marca', 'columna-fantasma', 'modelo'], ocultas: ['otra-fantasma'] })
    expect(p.orden).not.toContain('columna-fantasma')
    expect(p.ocultas).toEqual([])
  })

  it('un guardado corrupto o vacío cae en el valor por defecto sin romper', () => {
    expect(normalizarPref(null)).toEqual(PREF_POR_DEFECTO)
    expect(normalizarPref('no es un objeto')).toEqual(PREF_POR_DEFECTO)
    expect(normalizarPref({})).toEqual(PREF_POR_DEFECTO)
  })

  it('mover una columna la coloca en la posición de la otra, corriendo el resto', () => {
    const orden: ColumnaCatalogo[] = ['marca', 'modelo', 'tipo', 'sku']
    // Llevar `sku` al sitio de `modelo`: entra delante y el resto se desplaza.
    expect(moverColumna(orden, 'sku', 'modelo')).toEqual(['marca', 'sku', 'modelo', 'tipo'])
    // Y hacia la derecha: `marca` al sitio de `tipo`.
    expect(moverColumna(orden, 'marca', 'tipo')).toEqual(['modelo', 'tipo', 'marca', 'sku'])
  })

  it('soltar una columna sobre sí misma no cambia nada', () => {
    const orden: ColumnaCatalogo[] = ['marca', 'modelo', 'tipo']
    expect(moverColumna(orden, 'modelo', 'modelo')).toEqual(orden)
  })

  it('las ocultas no salen en las visibles, pero conservan su sitio si se reactivan', () => {
    const pref = { orden: ['marca', 'modelo', 'tipo'] as ColumnaCatalogo[], ocultas: ['modelo'] as ColumnaCatalogo[] }
    expect(columnasVisibles(pref)).toEqual(['marca', 'tipo'])
    expect(columnasVisibles({ ...pref, ocultas: [] })).toEqual(['marca', 'modelo', 'tipo'])
  })
})
