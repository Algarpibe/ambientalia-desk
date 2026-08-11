import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { asignarCategoria, crearArticulo, listarArticulosDeModelo, listarCategorias, ocultarArticulo } from './catalogoArticulos'
import { materializarAccesorios } from './materializarAccesorios'

let db: Queryable
const item = (id: string, nombre: string, sku: string, categoria: string, status = 'active') =>
  db.query('INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ($1,$2,$3,$4,$5)', [id, nombre, sku, categoria, status])

beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
})

describe('materializarAccesorios', () => {
  /**
   * El corazón de la migración: el modelo tiene que seguir viendo LO MISMO después. Los derivados no
   * están guardados en ninguna parte —se calculan en vivo desde la categoría—, así que retirarla sin
   * copiarlos antes los borraría sin dejar rastro.
   */
  it('copia los accesorios derivados a la lista del modelo y retira la categoría', async () => {
    await item('i1', 'Roof flange', '1200010', 'Opcional EDM180')
    await item('i2', 'Cable RJ45', '1141DL', 'Opcional EDM180')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional EDM180')

    const r = await materializarAccesorios(db)

    expect(r).toMatchObject({ copiados: 2, omitidos: 0, categorias: 1 })
    expect(await listarCategorias(db, 'cmod-1')).toEqual([])

    const l = await listarArticulosDeModelo(db, 'cmod-1')
    expect(l).toHaveLength(2)
    // Enlazados a Books, no texto libre: conservan itemId y SKU, así que siguen siendo el mismo artículo.
    expect(l.map((a) => a.sku).sort()).toEqual(['1141DL', '1200010'])
    expect(l.every((a) => a.origen === 'manual' && a.itemId && a.activo)).toBe(true)
  })

  // Un derivado oculto es el técnico diciendo «este no aplica a este modelo». Copiarlo revertiría esa
  // decisión justo cuando ya no hay categoría que lo vuelva a esconder.
  it('no copia los que estaban ocultos para ese modelo', async () => {
    await item('i1', 'Sí aplica', 'A-1', 'Opcional EDM180')
    await item('i2', 'No aplica', 'B-1', 'Opcional EDM180')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional EDM180')
    await ocultarArticulo(db, 'cmod-1', 'i2')

    const r = await materializarAccesorios(db)

    expect(r.copiados).toBe(1)
    expect((await listarArticulosDeModelo(db, 'cmod-1')).map((a) => a.sku)).toEqual(['A-1'])
  })

  // Un artículo retirado en Books no vuelve por la puerta de atrás: si no se deriva hoy, no se copia.
  it('no copia los artículos inactivos de Books', async () => {
    await item('i1', 'Vigente', 'V-1', 'Opcional EDM180')
    await item('i2', 'Descatalogado', 'D-1', 'Opcional EDM180', 'inactive')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional EDM180')

    expect((await materializarAccesorios(db)).copiados).toBe(1)
    expect((await listarArticulosDeModelo(db, 'cmod-1')).map((a) => a.sku)).toEqual(['V-1'])
  })

  /**
   * La mitad que hace que esto siga siendo reversible por el lado que importa: solo se van las
   * categorías de ACCESORIOS. Consumibles y repuestos siguen derivándose de sus categorías, que es
   * donde la vía de bloque sigue teniendo sentido.
   */
  it('no toca las categorías de consumibles y repuestos', async () => {
    await item('i1', 'Accesorio', 'A-1', 'Opcional EDM180')
    await item('i2', 'Filtro', 'F-1', 'C&R EDM 180')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional EDM180')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R EDM 180')

    const r = await materializarAccesorios(db)

    expect(r.categorias).toBe(1)
    expect(await listarCategorias(db, 'cmod-1')).toMatchObject([{ clase: 'consumible_repuesto', categoria: 'C&R EDM 180' }])
    // El filtro sigue derivándose, no se ha copiado a la lista.
    expect((await listarArticulosDeModelo(db, 'cmod-1')).find((a) => a.sku === 'F-1')?.origen).toBe('categoria')
  })

  // Ya hay modelos con artículos añadidos a mano. Un choque de nombre no puede reventar la migración
  // entera ni duplicar la fila: se omite y se cuenta.
  it('omite los que ya estaban en la lista con ese nombre, sin duplicar ni fallar', async () => {
    await item('i1', 'Manuales', 'M-1', 'Opcional EDM180')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional EDM180')
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })

    const r = await materializarAccesorios(db)

    expect(r).toMatchObject({ copiados: 0, omitidos: 1 })
    expect((await listarArticulosDeModelo(db, 'cmod-1')).filter((a) => a.nombre === 'Manuales')).toHaveLength(1)
  })

  // Es destructiva y sin vuelta atrás, así que el simulacro tiene que devolver el detalle completo sin
  // escribir nada: ese detalle ES la copia de seguridad.
  it('en simulacro no escribe nada y devuelve el detalle por modelo', async () => {
    await item('i1', 'Roof flange', '1200010', 'Opcional EDM180')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional EDM180')

    const r = await materializarAccesorios(db, { dryRun: true })

    expect(r).toMatchObject({ copiados: 1, categorias: 1 })
    expect(r.detalle).toEqual([{ modelo: 'Grimm EDM180C', categoria: 'Opcional EDM180', articulos: ['1200010 · Roof flange'] }])
    // Nada se ha tocado: la categoría sigue puesta y el artículo sigue siendo derivado.
    expect(await listarCategorias(db, 'cmod-1')).toHaveLength(1)
    expect((await listarArticulosDeModelo(db, 'cmod-1'))[0].origen).toBe('categoria')
  })
})
