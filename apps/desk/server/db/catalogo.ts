import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Catalogo, CatalogoMarca, CatalogoModelo, CatalogoTipo } from '@ambientalia/shared'

/** Fila cruda de cualquiera de las tablas del catálogo, sin comprometerse a sus columnas exactas. */
type Fila = Record<string, unknown>

const filaTipo = (r: Fila): CatalogoTipo => ({ id: r.id as string, nombre: r.nombre as string, activo: r.activo === true })
const filaMarca = (r: Fila): CatalogoMarca => ({ id: r.id as string, nombre: r.nombre as string, activo: r.activo === true })
const filaModelo = (r: Fila): CatalogoModelo => ({
  id: r.id as string, marcaId: r.marca_id as string, nombre: r.nombre as string,
  tipoId: (r.tipo_id as string) ?? null, tipoNombre: (r.tipo_nombre as string) ?? null,
  revisar: r.revisar === true, activo: r.activo === true,
})

/**
 * El catálogo tal como lo consumen los formularios: solo lo activo.
 *
 * `incluirModeloId` añade un modelo desactivado para que editar un equipo cuyo modelo se retiró no
 * deje el campo en blanco y obligue a cambiárselo. Es el mismo apaño que hacía `withCurrent` en la
 * pantalla, resuelto aquí porque es el servidor quien sabe.
 */
export async function leerCatalogo(db: Queryable, incluirModeloId?: string | null): Promise<Catalogo> {
  const extra = incluirModeloId ?? ''
  const tipos = await db.query('SELECT id,nombre,activo FROM catalogo_tipos WHERE activo = true ORDER BY nombre')
  const modelos = await db.query(
    `SELECT mo.id, mo.marca_id, mo.nombre, mo.tipo_id, mo.revisar, mo.activo, ti.nombre AS tipo_nombre
       FROM catalogo_modelos mo LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.activo = true OR mo.id = $1
      ORDER BY mo.nombre`,
    [extra],
  )
  // Invariante real (no solo la del modelo de `incluirModeloId`): NINGUNA marca con un modelo
  // visible se queda fuera, esté esa marca activa o no. Un modelo elegible sin su marca en el
  // desplegable es un modelo inalcanzable — y eso vale igual para el modelo activo de una marca
  // desactivada (dato heredado del inventario, nadie lo pidió así) que para el que se pide por
  // `incluirModeloId`. Por eso se calcula sobre TODAS las filas de `modelos`, no solo la incluida.
  const marcasNecesarias = (modelos.rows as Fila[]).map((r) => r.marca_id)
  const marcas = await db.query('SELECT id,nombre,activo FROM catalogo_marcas ORDER BY nombre')
  const visibles = (marcas.rows as Fila[]).filter((r) => r.activo === true || marcasNecesarias.includes(r.id))
  return {
    tipos: (tipos.rows as Fila[]).map(filaTipo),
    marcas: visibles.map(filaMarca),
    modelos: (modelos.rows as Fila[]).map(filaModelo),
  }
}

/** Un modelo con su marca y su tipo ya resueltos a texto, la forma que consume el alta de equipos. */
export interface ModeloResuelto { id: string; nombre: string; marca: string; tipo: string | null }

/** Un modelo por id, con su marca y su tipo ya resueltos a texto. Lo usa el alta de equipos. */
export async function getModelo(db: Queryable, id: string): Promise<ModeloResuelto | null> {
  const r = await db.query(
    `SELECT mo.id, mo.nombre, ma.nombre AS marca, ti.nombre AS tipo
       FROM catalogo_modelos mo
       JOIN catalogo_marcas ma ON ma.id = mo.marca_id
       LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.id = $1`,
    [id],
  )
  const f = r.rows[0] as Fila | undefined
  return f ? { id: f.id as string, nombre: f.nombre as string, marca: f.marca as string, tipo: (f.tipo as string) ?? null } : null
}

/** Nombre ya usado. Existe como clase propia para que la ruta lo traduzca a 409 sin adivinar. */
export class NombreRepetido extends Error {
  constructor(public readonly nombre: string) {
    super(`Ya existe «${nombre}»`)
    this.name = 'NombreRepetido'
  }
}

/**
 * La unicidad se comprueba con un SELECT previo y no con `ON CONFLICT`, por lo mismo que en
 * `seedChecklist`: es el patrón seguro en pg-mem, que no infiere el tipo de un `INSERT … SELECT $n`,
 * y deja el conflicto como un error nuestro con su mensaje en vez de como uno del driver.
 *
 * No sustituye a la restricción de la tabla, que sigue ahí: esto da el mensaje, aquella da la
 * garantía cuando dos administradores dan de alta lo mismo a la vez.
 */
export async function crearTipo(db: Queryable, nombre: string): Promise<string> {
  const n = nombre.trim()
  const ya = await db.query('SELECT 1 FROM catalogo_tipos WHERE LOWER(nombre) = $1', [n.toLowerCase()])
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = 'ctip-' + randomUUID()
  await db.query('INSERT INTO catalogo_tipos (id,nombre) VALUES ($1,$2)', [id, n])
  return id
}

export async function crearMarca(db: Queryable, nombre: string): Promise<string> {
  const n = nombre.trim()
  const ya = await db.query('SELECT 1 FROM catalogo_marcas WHERE LOWER(nombre) = $1', [n.toLowerCase()])
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = 'cmar-' + randomUUID()
  await db.query('INSERT INTO catalogo_marcas (id,nombre) VALUES ($1,$2)', [id, n])
  return id
}

/** El modelo es único dentro de su marca: un "6103" de Environics y otro de Horiba coexisten. */
export async function crearModelo(
  db: Queryable,
  input: { marcaId: string; nombre: string; tipoId: string | null; revisar?: boolean },
): Promise<string> {
  const n = input.nombre.trim()
  const ya = await db.query(
    'SELECT 1 FROM catalogo_modelos WHERE marca_id = $1 AND LOWER(nombre) = $2',
    [input.marcaId, n.toLowerCase()],
  )
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = 'cmod-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id,revisar) VALUES ($1,$2,$3,$4,$5)',
    [id, input.marcaId, n, input.tipoId, input.revisar === true],
  )
  return id
}
