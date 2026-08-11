import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  listarArticulos, crearArticulo, actualizarArticulo, borrarArticulo, ArticuloRepetido,
  asignarCategoria, listarCategorias, quitarCategoria, listarArticulosDeModelo, CategoriaRepetida,
  ocultarArticulo, mostrarArticulo, copiarArticulos,
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

/**
 * Los consumibles se comparten entre variantes por la categoría de la serie, pero los accesorios
 * pasaron a elegirse pieza a pieza y perdieron esa vía. Copiar la lista de un modelo a sus hermanos la
 * devuelve sin recrear el bloque: es una COPIA, no un vínculo, así que cada modelo diverge después.
 */
describe('copiarArticulos', () => {
  beforeEach(async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-2','cmar-1','APNA-370')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-3','cmar-1','APOA-370')")
  })

  it('copia los artículos de una clase a varios destinos, conservando itemId y SKU', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', itemId: 'i1', sku: 'APOPC-008', nombre: 'Slides' })
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })

    const r = await copiarArticulos(db, 'cmod-1', ['cmod-2', 'cmod-3'], 'accesorio')

    expect(r).toMatchObject({ copiados: 4, omitidos: 0 })
    for (const destino of ['cmod-2', 'cmod-3']) {
      const l = await listarArticulos(db, destino)
      expect(l.map((a) => a.nombre).sort()).toEqual(['Manuales', 'Slides'])
      // El enlace a Books viaja con la copia: si no, el destino tendría texto libre y perdería el SKU.
      expect(l.find((a) => a.nombre === 'Slides')).toMatchObject({ itemId: 'i1', sku: 'APOPC-008' })
    }
  })

  // Desactivar es cómo se dice «este no aplica». Copiarlo lo reviviría en el destino sin que nadie lo pida.
  it('no copia los desactivados del origen', async () => {
    const id = await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'No aplica' })
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Sí aplica' })
    await actualizarArticulo(db, id, { activo: false })

    expect((await copiarArticulos(db, 'cmod-1', ['cmod-2'], 'accesorio')).copiados).toBe(1)
    expect((await listarArticulos(db, 'cmod-2')).map((a) => a.nombre)).toEqual(['Sí aplica'])
  })

  // El destino puede tener ya media lista: copiar dos veces no puede duplicar ni reventar a la mitad.
  it('omite lo que el destino ya tenía con ese nombre, y es idempotente', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })
    await crearArticulo(db, 'cmod-2', { clase: 'accesorio', nombre: 'MANUALES' })

    expect(await copiarArticulos(db, 'cmod-1', ['cmod-2'], 'accesorio')).toMatchObject({ copiados: 0, omitidos: 1 })
    expect((await listarArticulos(db, 'cmod-2'))).toHaveLength(1)
  })

  it('copia solo la clase pedida', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Accesorio' })
    await crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', nombre: 'Repuesto' })

    await copiarArticulos(db, 'cmod-1', ['cmod-2'], 'accesorio')
    expect((await listarArticulos(db, 'cmod-2')).map((a) => a.nombre)).toEqual(['Accesorio'])
  })

  /**
   * Elegir el propio origen como destino es fácil de hacer en un selector.
   *
   * ⚠️ `omitidos: 0` es la aserción que de verdad muerde, y no salió a la primera: sin la guarda, el
   * alta sobre el propio origen falla por nombre repetido y se cuenta como omitido, así que la lista
   * queda igual y el conteo de copiados también. Lo único que delata la diferencia es que el resumen
   * diría «1 ya estaba» sobre un modelo que el operador ni pretendía tocar.
   */
  it('ignora el propio origen si viene entre los destinos, sin contarlo como omitido', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', nombre: 'Manuales' })

    expect(await copiarArticulos(db, 'cmod-1', ['cmod-1', 'cmod-2'], 'accesorio'))
      .toMatchObject({ copiados: 1, omitidos: 0, porModelo: [{ modeloId: 'cmod-2', copiados: 1 }] })
    expect(await listarArticulos(db, 'cmod-1')).toHaveLength(1)
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

  /**
   * El caso que abre poder añadir artículos SUELTOS de Books: uno metido a mano puede acabar también
   * dentro de una categoría asignada. Y no solo por descuido — puede entrar después, el día que alguien
   * asigne esa categoría. Enseñarlo dos veces le haría contar al técnico dos piezas donde hay una,
   * exactamente el mismo error que ya se evita entre dos categorías.
   */
  it('no repite un artículo añadido a mano que además deriva de una categoría asignada', async () => {
    await item('i1', 'Slides', 'APOPC-008', 'Opcional AP Series')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional AP Series')
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', itemId: 'i1', sku: 'APOPC-008', nombre: 'Slides' })

    const l = await listarArticulosDeModelo(db, 'cmod-1')
    expect(l.filter((a) => a.sku === 'APOPC-008')).toHaveLength(1)
    // Gana el DERIVADO, y esa dirección importa: el día que se quite la categoría, el añadido a mano
    // reaparece solo. Al revés, quitar la categoría lo dejaría fuera de las dos vías.
    expect(l[0].origen).toBe('categoria')
  })

  // La otra mitad de la regla: la deduplicación es POR CLASE. El mismo artículo puede ser accesorio por
  // categoría y repuesto a mano, y ahí son dos cosas distintas que sí deben verse las dos.
  it('el añadido a mano se queda si la categoría que lo deriva es de otra clase', async () => {
    await item('i1', 'Slides', 'APOPC-008', 'Opcional AP Series')
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Opcional AP Series')
    await crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', itemId: 'i1', sku: 'APOPC-008', nombre: 'Slides' })

    expect((await listarArticulosDeModelo(db, 'cmod-1')).filter((a) => a.sku === 'APOPC-008')).toHaveLength(2)
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

  /**
   * Una categoría de serie trae decenas de artículos y no todos valen para todas sus variantes. Sin
   * esto, la única forma de quitar uno sería renunciar a la categoría entera y perder los otros 43.
   */
  it('un artículo oculto sale marcado en la gestión y desaparece de la lista real', async () => {
    await item('i1', 'Vale', 'V-1', 'C&R AP Series')
    await item('i2', 'No aplica', 'N-1', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')

    await ocultarArticulo(db, 'cmod-1', 'i2')

    // La gestión los ve todos, con el oculto marcado, para poder devolverlo. El orden es alfabético por
    // nombre («No aplica» antes que «Vale»), no el de inserción.
    const gestion = await listarArticulosDeModelo(db, 'cmod-1', { incluirInactivos: true })
    expect(gestion.map((a) => [a.sku, a.activo])).toEqual([['N-1', false], ['V-1', true]])
    // La lista real —la que acabará en la remisión— no lo incluye.
    expect((await listarArticulosDeModelo(db, 'cmod-1')).map((a) => a.sku)).toEqual(['V-1'])
  })

  // Es una lápida reversible: mostrarlo de nuevo lo devuelve tal cual, porque el artículo nunca dejó
  // de estar en Books ni en la categoría.
  it('mostrar de nuevo un artículo oculto lo devuelve a la lista', async () => {
    await item('i1', 'Uno', 'U-1', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    await ocultarArticulo(db, 'cmod-1', 'i1')
    expect(await listarArticulosDeModelo(db, 'cmod-1')).toEqual([])

    await mostrarArticulo(db, 'cmod-1', 'i1')
    expect((await listarArticulosDeModelo(db, 'cmod-1')).map((a) => a.sku)).toEqual(['U-1'])
  })

  // Ocultar es POR MODELO: el mismo artículo puede no aplicar a un APMA-370 y sí a un APNA-370.
  it('ocultar en un modelo no afecta a los demás', async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-2','cmar-1','APNA-370')")
    await item('i1', 'Compartido', 'C-1', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-2', 'consumible_repuesto', 'C&R AP Series')

    await ocultarArticulo(db, 'cmod-1', 'i1')
    expect(await listarArticulosDeModelo(db, 'cmod-1')).toEqual([])
    expect(await listarArticulosDeModelo(db, 'cmod-2')).toHaveLength(1)
  })

  // Ocultarlo dos veces no debe fallar: el botón se puede pulsar dos veces, o llegar dos peticiones.
  it('ocultar un artículo ya oculto es inocuo', async () => {
    await item('i1', 'Uno', 'U-1', 'C&R AP Series')
    await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    await ocultarArticulo(db, 'cmod-1', 'i1')
    await expect(ocultarArticulo(db, 'cmod-1', 'i1')).resolves.toBeUndefined()
  })

  it('quitar una categoría retira sus artículos de la lista', async () => {
    await item('i1', 'Filtro', 'F-1', 'C&R AP Series')
    const id = await asignarCategoria(db, 'cmod-1', 'consumible_repuesto', 'C&R AP Series')
    expect(await listarArticulosDeModelo(db, 'cmod-1')).toHaveLength(1)

    await quitarCategoria(db, id)
    expect(await listarArticulosDeModelo(db, 'cmod-1')).toEqual([])
  })
})
