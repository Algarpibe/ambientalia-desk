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
 * `incluirModeloId` añade un modelo desactivado —y su marca, esté activa o no— para que editar un
 * equipo cuyo modelo se retiró no deje el campo en blanco y obligue a cambiárselo. Es el mismo
 * apaño que hacía `withCurrent` en la pantalla, resuelto aquí porque es el servidor quien sabe.
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
  // Las marcas se piden DESPUÉS de los modelos porque la marca del modelo incluido tiene que entrar
  // aunque esté desactivada: sin ella, el desplegable de marca no podría enseñar la suya.
  const marcasNecesarias = (modelos.rows as Fila[]).map((r) => r.marca_id)
  const marcas = await db.query('SELECT id,nombre,activo FROM catalogo_marcas ORDER BY nombre')
  const visibles = (marcas.rows as Fila[]).filter((r) => r.activo === true || marcasNecesarias.includes(r.id))
  return {
    tipos: (tipos.rows as Fila[]).map(filaTipo),
    marcas: visibles.map(filaMarca),
    modelos: (modelos.rows as Fila[]).map(filaModelo),
  }
}

/** Un modelo por id, con su marca y su tipo ya resueltos a texto. Lo usa el alta de equipos. */
export async function getModelo(db: Queryable, id: string): Promise<{ id: string; nombre: string; marca: string; tipo: string | null } | null> {
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
