import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { ArticuloModelo, CategoriaModelo, ClaseArticulo } from '@ambientalia/shared'

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/** Ese artículo ya está en esa lista. Clase propia para que la ruta lo traduzca a 409 sin adivinar. */
export class ArticuloRepetido extends Error {
  constructor(public readonly nombre: string) {
    super(`«${nombre}» ya está en esa lista`)
    this.name = 'ArticuloRepetido'
  }
}

export interface ArticuloNuevo {
  clase: ClaseArticulo
  /** Ausente en los ítems de texto libre. */
  itemId?: string | null
  sku?: string | null
  nombre: string
}

function aArticulo(r: Record<string, unknown>): ArticuloModelo {
  return {
    id: String(r.id),
    clase: String(r.clase) as ClaseArticulo,
    origen: 'manual', // esta tabla SOLO guarda manuales; los derivados no pasan por aquí

    itemId: (r.item_id as string | null) ?? undefined,
    sku: (r.sku as string | null) ?? undefined,
    nombre: String(r.nombre),
    orden: Number(r.orden),
    activo: r.activo === true,
  }
}

/**
 * Los artículos de un modelo, ordenados por clase y por su orden dentro de ella.
 *
 * Por defecto devuelve **también los desactivados**, porque la pantalla de gestión tiene que poder
 * reactivarlos. Quien consuma la lista de verdad —el checklist de una remisión— pide `soloActivos`.
 */
export async function listarArticulos(
  db: Queryable,
  modeloId: string,
  opts: { soloActivos?: boolean } = {},
): Promise<ArticuloModelo[]> {
  const r = await db.query(
    `SELECT id, clase, item_id, sku, nombre, orden, activo FROM catalogo_articulos
     WHERE modelo_id = $1 ${opts.soloActivos ? 'AND activo = true' : ''}
     ORDER BY clase, orden, nombre`,
    [modeloId],
  )
  return filas(r.rows).map(aArticulo)
}

/**
 * Alta de un artículo en la lista de un modelo.
 *
 * El `orden` se asigna aquí, al final de SU clase: el orden es dentro de la lista, no global, así que
 * añadir un repuesto no debe empujar a los accesorios.
 *
 * La unicidad se comprueba con un SELECT previo y **sin distinguir mayúsculas**, aunque el índice de la
 * BD sí las distinga: «Manuales» y «MANUALES» serían dos filas que el técnico lee como una sola. El
 * índice queda como red de seguridad ante dos altas simultáneas.
 */
export async function crearArticulo(db: Queryable, modeloId: string, input: ArticuloNuevo): Promise<string> {
  const nombre = input.nombre.trim()
  const ya = await db.query(
    'SELECT 1 FROM catalogo_articulos WHERE modelo_id = $1 AND clase = $2 AND LOWER(nombre) = $3',
    [modeloId, input.clase, nombre.toLowerCase()],
  )
  if (ya.rows.length) throw new ArticuloRepetido(nombre)

  // El siguiente orden se calcula en JavaScript y no con un MAX(...)+1 en el INSERT porque pg-mem no
  // tipa `INSERT ... SELECT $n`, que es la trampa ya pagada en `seedChecklist`.
  const max = await db.query(
    'SELECT orden FROM catalogo_articulos WHERE modelo_id = $1 AND clase = $2 ORDER BY orden DESC LIMIT 1',
    [modeloId, input.clase],
  )
  const orden = max.rows.length ? Number(filas(max.rows)[0].orden) + 1 : 0

  const id = 'art-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, modeloId, input.clase, input.itemId ?? null, input.sku ?? null, nombre, orden],
  )
  return id
}

/** Cambia lo editable de un artículo ya dado de alta. Lo que no venga en el patch no se toca. */
export async function actualizarArticulo(
  db: Queryable,
  id: string,
  patch: { clase?: ClaseArticulo; orden?: number; activo?: boolean },
): Promise<void> {
  const sets: string[] = []
  const params: unknown[] = [id]
  const add = (col: string, val: unknown) => { params.push(val); sets.push(`${col}=$${params.length}`) }
  if (patch.clase !== undefined) add('clase', patch.clase)
  if (patch.orden !== undefined) add('orden', patch.orden)
  if (patch.activo !== undefined) add('activo', patch.activo)
  if (!sets.length) return
  await db.query(`UPDATE catalogo_articulos SET ${sets.join(',')} WHERE id=$1`, params)
}

/** Borrado físico. La vía normal para retirar un artículo es DESACTIVARLO, no esto. */
export async function borrarArticulo(db: Queryable, id: string): Promise<void> {
  await db.query('DELETE FROM catalogo_articulos WHERE id=$1', [id])
}

/**
 * Copia los artículos ACTIVOS de una clase de un modelo a otros modelos.
 *
 * **Por qué hace falta.** Los consumibles se comparten entre variantes de una serie por la categoría
 * (`C&R AP Series` vale para todas), pero los accesorios pasaron a elegirse pieza a pieza y perdieron
 * esa vía. Un APSA-370 y un APNA-370 llevan los mismos accesorios, y rehacer la lista a mano por cada
 * variante es el trabajo que esto ahorra.
 *
 * **Es una COPIA, no un vínculo, y a propósito.** Un vínculo vivo devolvería el problema que hizo
 * retirar las categorías de accesorios: cambiar el origen movería a todos, incluidas las variantes a
 * las que ese artículo no aplica. Copiado, cada modelo diverge después sin arrastrar a nadie.
 *
 * Los desactivados del origen NO viajan: desactivar es cómo se dice «este no aplica», y copiarlo lo
 * reviviría en el destino sin que nadie lo pida. El enlace a Books (`item_id`, `sku`) sí viaja, o el
 * destino acabaría con texto libre y sin SKU.
 */
export async function copiarArticulos(
  db: Queryable,
  origenId: string,
  destinos: string[],
  clase: ClaseArticulo,
): Promise<{ copiados: number; omitidos: number; porModelo: Array<{ modeloId: string; copiados: number }> }> {
  const fuente = (await listarArticulos(db, origenId, { soloActivos: true })).filter((a) => a.clase === clase)

  let copiados = 0
  let omitidos = 0
  const porModelo: Array<{ modeloId: string; copiados: number }> = []

  for (const destino of destinos) {
    // El propio origen entre los destinos es fácil de marcar en un selector, y duplicaría su lista
    // entera (`crearArticulo` la rechazaría por nombre repetido, pero contarlo como «omitido» mentiría).
    if (destino === origenId) continue
    let aqui = 0
    for (const a of fuente) {
      try {
        await crearArticulo(db, destino, { clase, itemId: a.itemId ?? null, sku: a.sku ?? null, nombre: a.nombre })
        copiados++
        aqui++
      } catch (e) {
        // El destino puede tener ya media lista. Un choque de nombre no puede tumbar la copia entera.
        if (e instanceof ArticuloRepetido) { omitidos++; continue }
        throw e
      }
    }
    porModelo.push({ modeloId: destino, copiados: aqui })
  }
  return { copiados, omitidos, porModelo }
}

// ── Categorías de Books asignadas al modelo ────────────────────────────────────────────────────────

/** Esa categoría ya está en esa clase del modelo. Clase propia para que la ruta responda 409. */
export class CategoriaRepetida extends Error {
  constructor(public readonly categoria: string) {
    super(`«${categoria}» ya está asignada`)
    this.name = 'CategoriaRepetida'
  }
}

/**
 * Asigna una categoría de Books a una clase del modelo.
 *
 * Es la REGLA de la que se deriva la lista, no una copia de artículos: por eso un artículo nuevo en esa
 * categoría aparece solo. Varias por clase es lo normal — la de la serie (`C&R AP Series`) más la del
 * modelo (`C&R APMA-370`).
 */
export async function asignarCategoria(
  db: Queryable, modeloId: string, clase: ClaseArticulo, categoria: string,
): Promise<string> {
  const c = categoria.trim()
  const ya = await db.query(
    'SELECT 1 FROM catalogo_modelo_categorias WHERE modelo_id=$1 AND clase=$2 AND categoria=$3',
    [modeloId, clase, c],
  )
  if (ya.rows.length) throw new CategoriaRepetida(c)
  const id = 'mcat-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_modelo_categorias (id,modelo_id,clase,categoria) VALUES ($1,$2,$3,$4)',
    [id, modeloId, clase, c],
  )
  return id
}

export async function quitarCategoria(db: Queryable, id: string): Promise<void> {
  await db.query('DELETE FROM catalogo_modelo_categorias WHERE id=$1', [id])
}

/**
 * Las categorías del modelo, con cuántos artículos ACTIVOS aporta hoy cada una.
 *
 * El conteo va aparte y no en un JOIN agregado porque pg-mem no resuelve las subconsultas
 * correlacionadas que eso pediría — la misma razón por la que se agrega en JavaScript en el resto del
 * repo. Son pocas filas por modelo, así que la consulta por categoría no cuesta nada.
 */
export async function listarCategorias(db: Queryable, modeloId: string): Promise<CategoriaModelo[]> {
  const r = await db.query(
    'SELECT id, clase, categoria FROM catalogo_modelo_categorias WHERE modelo_id=$1 ORDER BY clase, categoria',
    [modeloId],
  )
  const out: CategoriaModelo[] = []
  for (const fila of filas(r.rows)) {
    const categoria = String(fila.categoria)
    const n = await db.query(
      "SELECT COUNT(*)::int AS n FROM books.items WHERE category_name = $1 AND COALESCE(status,'active') = 'active'",
      [categoria],
    )
    out.push({
      id: String(fila.id),
      clase: String(fila.clase) as ClaseArticulo,
      categoria,
      articulos: Number(filas(n.rows)[0].n),
    })
  }
  return out
}

/**
 * Marca un artículo derivado como «no aplica a este modelo».
 *
 * Hace falta porque una categoría de serie trae decenas de artículos y no todos valen para todas sus
 * variantes: sin esto, quitar uno obligaría a renunciar a la categoría entera y perder los demás.
 *
 * Es una **lápida por modelo**, no un borrado: el artículo sigue en Books y en su categoría, y otro
 * modelo que comparta esa categoría lo sigue viendo. `mostrarArticulo` lo devuelve.
 *
 * Es idempotente: el botón se puede pulsar dos veces, o llegar dos peticiones a la vez.
 */
export async function ocultarArticulo(db: Queryable, modeloId: string, itemId: string): Promise<void> {
  const ya = await db.query(
    'SELECT 1 FROM catalogo_articulos_ocultos WHERE modelo_id=$1 AND item_id=$2',
    [modeloId, itemId],
  )
  if (ya.rows.length) return
  await db.query(
    'INSERT INTO catalogo_articulos_ocultos (id,modelo_id,item_id) VALUES ($1,$2,$3)',
    ['aoc-' + randomUUID(), modeloId, itemId],
  )
}

/** Levanta la lápida: el artículo vuelve a la lista de ese modelo. */
export async function mostrarArticulo(db: Queryable, modeloId: string, itemId: string): Promise<void> {
  await db.query('DELETE FROM catalogo_articulos_ocultos WHERE modelo_id=$1 AND item_id=$2', [modeloId, itemId])
}

/**
 * La lista completa de artículos de un modelo: los **derivados** de sus categorías más los **manuales**.
 *
 * Los derivados salen de `books.items` en vivo, así que reflejan Books sin intervención: un artículo
 * retirado allí desaparece de aquí, y uno nuevo en la categoría aparece.
 *
 * **Se deduplica por SKU dentro de cada clase.** Dos categorías de la misma clase pueden compartir un
 * artículo, y enseñarlo dos veces le haría contar al técnico dos piezas donde hay una. La regla vale
 * también entre un **añadido a mano** y un derivado: un artículo suelto de Books puede caer después
 * dentro de una categoría que alguien asigne más tarde, y ahí nadie se daría cuenta.
 *
 * En ese empate gana el **derivado**, y la dirección importa: quitar la categoría devuelve el añadido a
 * mano a la lista. Al revés, quitarla lo dejaría fuera por las dos vías.
 */
export async function listarArticulosDeModelo(
  db: Queryable,
  modeloId: string,
  opts: { incluirInactivos?: boolean } = {},
): Promise<ArticuloModelo[]> {
  const derivados = await db.query(
    `SELECT c.clase, c.categoria, i.item_id, i.name, i.sku
       FROM catalogo_modelo_categorias c
       JOIN books.items i ON i.category_name = c.categoria
      WHERE c.modelo_id = $1 AND COALESCE(i.status,'active') = 'active'
      ORDER BY c.clase, i.name`,
    [modeloId],
  )

  const ocultosQ = await db.query('SELECT item_id FROM catalogo_articulos_ocultos WHERE modelo_id=$1', [modeloId])
  const ocultos = new Set(filas(ocultosQ.rows).map((r) => String(r.item_id)))

  const out: ArticuloModelo[] = []
  const vistos = new Set<string>()
  for (const f of filas(derivados.rows)) {
    const clase = String(f.clase) as ClaseArticulo
    const sku = (f.sku as string | null) ?? ''
    const oculto = ocultos.has(String(f.item_id))
    // Los ocultos solo aparecen en la gestión, y marcados: es la única forma de volver a activarlos.
    if (oculto && !opts.incluirInactivos) continue
    // La llave de dedup es clase+SKU y no el item_id: el MISMO artículo puede estar en Books como dos
    // filas (una por categoría) con item_id distinto, que es justo el caso de las series.
    const llave = `${clase}|${sku || String(f.item_id)}`
    if (vistos.has(llave)) continue
    vistos.add(llave)
    out.push({
      id: String(f.item_id),
      clase,
      origen: 'categoria',
      itemId: String(f.item_id),
      sku: sku || undefined,
      nombre: String(f.name ?? ''),
      categoria: String(f.categoria),
      orden: 0,
      activo: !oculto,
    })
  }

  // Los desactivados solo salen si se piden: la pantalla de gestión los necesita para reactivarlos, y
  // el consumo real —el checklist de una remisión— no debe verlos. Los derivados no tienen este caso:
  // un artículo se retira desactivándolo en Books, y entonces deja de derivarse solo.
  for (const m of await listarArticulos(db, modeloId, { soloActivos: !opts.incluirInactivos })) {
    // Misma llave que arriba, para que el empate con un derivado se resuelva igual que entre dos
    // categorías. Los de texto libre («Manuales») no tienen SKU y caen por su id, que es único: nunca
    // chocan con nada.
    const llave = `${m.clase}|${m.sku || m.itemId || m.id}`
    if (vistos.has(llave)) continue
    vistos.add(llave)
    out.push(m)
  }
  return out
}
