import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { listarArticulos, crearArticulo, actualizarArticulo, borrarArticulo, ArticuloRepetido } from './catalogoArticulos'

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
    await crearArticulo(db, 'cmod-1', { clase: 'consumible', itemId: 'i1', sku: 'F-001', nombre: 'Filtro PM10' })
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })

    const todos = await listarArticulos(db, 'cmod-1')
    expect(todos).toHaveLength(2)
    expect(todos.find((a) => a.nombre === 'Filtro PM10')).toMatchObject({ clase: 'consumible', itemId: 'i1', sku: 'F-001', activo: true })
    // El de texto libre NO inventa un itemId vacío: la ausencia es lo que lo identifica.
    expect(todos.find((a) => a.nombre === 'Manuales')).toMatchObject({ clase: 'accesorio', itemId: undefined, sku: undefined })
  })

  // El mismo artículo puede ser consumible de un modelo y accesorio de otro; lo que no puede es estar
  // dos veces en la misma lista. La comprobación NO distingue mayúsculas: «Manuales» y «MANUALES»
  // serían dos filas que el técnico lee como una sola.
  it('rechaza repetir el mismo nombre en la misma clase, y lo admite en otra', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })

    await expect(crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'MANUALES' })).rejects.toThrow(ArticuloRepetido)
    await expect(crearArticulo(db, 'cmod-1', { clase: 'consumible', nombre: 'Manuales' })).resolves.toBeTruthy()
  })

  it('el orden lo asigna el alta: cada artículo entra al final de su clase', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Primero' })
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Segundo' })
    // Otra clase empieza a contar de cero: el orden es dentro de la lista, no global.
    await crearArticulo(db, 'cmod-1', { clase: 'repuesto', nombre: 'Bomba' })

    const l = await listarArticulos(db, 'cmod-1')
    expect(l.filter((a) => a.clase === 'accesorio').map((a) => [a.nombre, a.orden])).toEqual([['Primero', 0], ['Segundo', 1]])
    expect(l.find((a) => a.clase === 'repuesto')?.orden).toBe(0)
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
    const id = await crearArticulo(db, 'cmod-1', { clase: 'consumible', itemId: 'i1', sku: 'F-001', nombre: 'Filtro PM10' })
    await actualizarArticulo(db, id, { clase: 'repuesto' })

    expect((await listarArticulos(db, 'cmod-1'))[0]).toMatchObject({ clase: 'repuesto', nombre: 'Filtro PM10' })
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
