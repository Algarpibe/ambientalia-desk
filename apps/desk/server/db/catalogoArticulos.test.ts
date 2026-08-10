import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  listarArticulos, crearArticulo, actualizarArticulo, borrarArticulo, ArticuloRepetido,
  asignarCategoria, listarCategorias, quitarCategoria, listarArticulosDeModelo, CategoriaRepetida,
} from './catalogoArticulos'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
})

describe('catalogoArticulos', () => {
  it('da de alta artículos de Books y de texto libre, y los lista por clase y orden', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', itemId: 'i1', sku: 'F-001', nombre: 'Filtro PM10' })
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })

    const todos = await listarArticulos(db, 'cmod-1')
    expect(todos).toHaveLength(2)
    expect(todos.find((a) => a.nombre === 'Filtro PM10')).toMatchObject({ clase: 'consumible_repuesto', itemId: 'i1', sku: 'F-001', activo: true })
    // El de texto libre NO inventa un itemId vacío: la ausencia es lo que lo identifica.
    expect(todos.find((a) => a.nombre === 'Manuales')).toMatchObject({ clase: 'accesorio', itemId: undefined, sku: undefined })
  })

  // El mismo artículo puede ser consumible de un modelo y accesorio de otro; lo que no puede es estar
  // dos veces en la misma lista. La comprobación NO distingue mayúsculas: «Manuales» y «MANUALES»
  // serían dos filas que el técnico lee como una sola.
  it('rechaza repetir el mismo nombre en la misma clase, y lo admite en otra', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })

    await expect(crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'MANUALES' })).rejects.toThrow(ArticuloRepetido)
    await expect(crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', nombre: 'Manuales' })).resolves.toBeTruthy()
  })

  it('el orden lo asigna el alta: cada artículo entra al final de su clase', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Primero' })
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Segundo' })
    // Otra clase empieza a contar de cero: el orden es dentro de la lista, no global.
    await crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', nombre: 'Bomba' })

    const l = await listarArticulos(db, 'cmod-1')
    expect(l.filter((a) => a.clase === 'accesorio').map((a) => [a.nombre, a.orden])).toEqual([['Primero', 0], ['Segundo', 1]])
    expect(l.find((a) => a.clase === 'consumible_repuesto')?.orden).toBe(0)
  })

  /**
   * Desactivar es la vía normal para retirar un artículo: lo saca de las listas futuras sin tocar las
   * remisiones ya emitidas. Por eso `listarArticulos` los sigue devolviendo —la pantalla de gestión
   * tiene que poder reactivarlos— y quien consuma la lista de verdad pedirá `soloActivos`.
   */
  it('desactivar lo mantiene en la gestión pero lo saca de la lista de solo activos', async () => {
    const id = await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Cargador' })
    await actualizarArticulo(db, id, { activo: false })

    expect((await listarArticulos(db, 'cmod-1')).map((a) => a.activo)).toEqual([false])
    expect(await listarArticulos(db, 'cmod-1', { soloActivos: true })).toEqual([])
  })

  it('permite mover un artículo de clase sin volver a darlo de alta', async () => {
    const id = await crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', itemId: 'i1', sku: 'F-001', nombre: 'Filtro PM10' })
    await actualizarArticulo(db, id, { clase: 'accesorio' })

    expect((await listarArticulos(db, 'cmod-1'))[0]).toMatchObject({ clase: 'accesorio', nombre: 'Filtro PM10' })
  })

  it('borrar lo quita del todo, y solo afecta al modelo indicado', async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-2','cmar-1','EDM180D')")
    const id = await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })
    await crearArticulo(db, 'cmod-2', { clase: 'accesorio', nombre: 'Manuales' })

    await borrarArticulo(db, id)
    expect(await listarArticulos(db, 'cmod-1')).toEqual([])
    expect(await listarArticulos(db, 'cmod-2')).toHaveLength(1)
  })
})

describe('categorías por modelo', () => {
  const item = (id: string, nombre: string, sku: string, categoria: string, status = 'active') =>
    db.query('INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ($1,$2,$3,$4,$5)', [id, nombre, sku, categoria, status])

  /**
   * El caso real que motivó todo el rediseño: un APMA-370 lleva de accesorios los de `Opcional AP
   * Series`, y de consumibles/repuestos los de `C&R AP Series` (comunes a la serie) MÁS los de
   * `C&R APMA-370` (propios del modelo).
   */
  it('deriva la lista de las categorías asignadas, sumando serie y modelo', async () => {
    await item('i1', 'Maletín', 'M-1', 'Opcional AP Series')
    await item('i2', 'Filtro de serie', 'F-1', 'C&R AP Series')
    await item('i3', 'Sensor propio', 'S-1', 'C&R APMA-370')
    await item('i4', 'De otro equipo', 'O-1', 'C&R EDM 180') // categoría no asignada → fuera

    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R APMA-370')

    const l = await listarArticulosDeModelo(db, 'cmod-1')
    expect(l.filter((a) => a.clase === 'accesorio').map((a) => a.sku)).toEqual(['M-1'])
    expect(l.filter((a) => a.clase === 'consumible_repuesto').map((a) => a.sku).sort()).toEqual(['F-1', 'S-1'])
    expect(l.every((a) => a.origen === 'categoria')).toBe(true)
    // Cada derivado dice de qué categoría vino: sin eso, quitar una categoría es a ciegas.
    expect(l.find((a) => a.sku === 'S-1')?.categoria).toBe('C&R APMA-370')
  })

  // Un artículo retirado en Books deja de ofrecerse solo, sin que nadie toque Desk. Es justo lo que se
  // gana derivando en vez de copiar.
  it('no deriva los artículos inactivos de Books', async () => {
    await item('i1', 'Vigente', 'V-1', 'C&R AP Series')
    await item('i2', 'Descatalogado', 'D-1', 'C&R AP Series', 'inactive')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')

    expect((await listarArticulosDeModelo(db, 'cmod-1')).map((a) => a.sku)).toEqual(['V-1'])
  })

  // Los manuales conviven con los derivados: son lo que Books no vende («Repuestos reemplazados» es
  // una casilla de verificación, no un artículo).
  it('suma los añadidos a mano a los derivados de las categorías', async () => {
    await item('i1', 'Filtro', 'F-1', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Repuestos reemplazados' })

    const l = await listarArticulosDeModelo(db, 'cmod-1')
    expect(l.find((a) => a.nombre === 'Repuestos reemplazados')?.origen).toBe('manual')
    expect(l.find((a) => a.sku === 'F-1')?.origen).toBe('categoria')
    expect(l).toHaveLength(2)
  })

  // Dos categorías de la misma clase pueden compartir un artículo; enseñarlo dos veces sería un error
  // de lectura para el técnico, que contaría dos piezas donde hay una.
  it('no repite un artículo que está en dos categorías asignadas de la misma clase', async () => {
    await item('i1', 'Compartido', 'C-1', 'C&R AP Series')
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1b','Compartido','C-1','C&R APMA-370','active')")
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R APMA-370')

    expect((await listarArticulosDeModelo(db, 'cmod-1')).filter((a) => a.sku === 'C-1')).toHaveLength(1)
  })

  it('lista las categorías del modelo con cuántos artículos aporta cada una', async () => {
    await item('i1', 'Uno', 'U-1', 'C&R AP Series')
    await item('i2', 'Dos', 'U-2', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')

    expect(await listarCategorias(db, 'cmod-1')).toEqual([
      { id: expect.any(String), clase: 'consumible_repuesto', categoria: 'C&R AP Series', articulos: 2 },
    ])
  })

  it('rechaza asignar dos veces la misma categoría en la misma clase, y la admite en otra', async () => {
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Accesorios')
    await expect(asignarCategoria(db, 'cmod-1', 'accesorio', 'Accesorios')).rejects.toThrow(CategoriaRepetida)
    await expect(asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'Accesorios')).resolves.toBeTruthy()
  })

  it('quitar una categoría retira sus artículos de la lista', async () => {
    await item('i1', 'Filtro', 'F-1', 'C&R AP Series')
    const id = await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    expect(await listarArticulosDeModelo(db, 'cmod-1')).toHaveLength(1)

    await quitarCategoria(db, id)
    expect(await listarArticulosDeModelo(db, 'cmod-1')).toEqual([])
  })
})
