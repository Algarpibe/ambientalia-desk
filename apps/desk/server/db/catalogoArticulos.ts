import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { ArticuloModelo, ClaseArticulo } from '@ambientalia/shared'

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
