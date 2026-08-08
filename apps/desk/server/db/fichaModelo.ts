import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { DocumentoModelo, FichaModelo, TipoDocumento } from '@ambientalia/shared'

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/** Documento que no se puede guardar. Clase propia para que la ruta lo traduzca a 422 sin adivinar. */
export class DocumentoInvalido extends Error {
  constructor(motivo: string) {
    super(motivo)
    this.name = 'DocumentoInvalido'
  }
}

/** Sin `content_b64` NUNCA: el fichero se pide por el proxy, no viaja en la ficha. */
const SELECT_DOC = 'id, tipo, nombre, url, content_type, size'

const aDocumento = (r: Record<string, unknown>): DocumentoModelo => ({
  id: String(r.id),
  tipo: String(r.tipo) as TipoDocumento,
  nombre: String(r.nombre),
  url: (r.url as string) ?? null,
  contentType: (r.content_type as string) ?? null,
  size: r.size == null ? null : Number(r.size),
})

/**
 * La ficha de un modelo. `null` solo si el modelo no existe — un modelo **sin** documentos devuelve
 * una ficha vacía, que es un estado legítimo y distinto de «no hay tal modelo».
 *
 * La foto sale **aparte** de `documentos` aunque en la tabla sea una fila más con `tipo='foto'`: la
 * pantalla la trata distinto, y separarla aquí ahorra que cada consumidor la filtre por su cuenta.
 */
export async function leerFicha(db: Queryable, modeloId: string): Promise<FichaModelo | null> {
  const mo = await db.query('SELECT id, sku FROM catalogo_modelos WHERE id = $1', [modeloId])
  const fila = filas(mo.rows)[0]
  if (!fila) return null

  const docs = await db.query(
    `SELECT ${SELECT_DOC} FROM catalogo_documentos WHERE modelo_id = $1 ORDER BY tipo, nombre`,
    [modeloId],
  )
  const todos = filas(docs.rows).map(aDocumento)
  return {
    modeloId: String(fila.id),
    sku: (fila.sku as string) ?? null,
    foto: todos.find((d) => d.tipo === 'foto') ?? null,
    documentos: todos.filter((d) => d.tipo !== 'foto'),
  }
}

/** Alta de un documento que es un ENLACE: sin fichero, sin tamaño, sin tipo de contenido. */
export async function crearEnlace(
  db: Queryable,
  modeloId: string,
  input: { tipo: TipoDocumento; nombre: string; url: string; creadoPor: string },
): Promise<string> {
  const nombre = input.nombre.trim()
  const url = input.url.trim()
  if (!nombre) throw new DocumentoInvalido('El nombre es obligatorio')
  if (!url) throw new DocumentoInvalido('El enlace es obligatorio')
  const id = 'cdoc-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,url,created_by) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, modeloId, input.tipo, nombre, url, input.creadoPor],
  )
  return id
}

/**
 * Alta de un documento que es un FICHERO subido: sin url. Lo sirve después el proxy autenticado de
 * la aplicación, igual que las fotos de remisión — nada sale de la sesión.
 *
 * Si el tipo es `foto`, **sustituye la anterior del modelo** en vez de acumularse: la foto de
 * referencia es una por modelo, y sin esto la ficha acabaría con cinco sin que nadie supiera cuál es
 * la buena. El resto de tipos sí se acumulan: un modelo puede tener varios manuales.
 */
export async function crearFichero(
  db: Queryable,
  modeloId: string,
  input: { tipo: TipoDocumento; nombre: string; contentB64: string; contentType: string; size: number; creadoPor: string },
): Promise<string> {
  const nombre = input.nombre.trim()
  if (!nombre) throw new DocumentoInvalido('El nombre es obligatorio')
  if (input.tipo === 'foto') {
    await db.query("DELETE FROM catalogo_documentos WHERE modelo_id = $1 AND tipo = 'foto'", [modeloId])
  }
  const id = 'cdoc-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type,size,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, modeloId, input.tipo, nombre, input.contentB64, input.contentType, input.size, input.creadoPor],
  )
  return id
}

/**
 * El fichero de un documento, para servirlo por el proxy. `null` si no existe, si es de otro modelo
 * o si es un enlace — un enlace no tiene fichero que servir, y devolver su url por esta vía
 * confundiría dos cosas distintas.
 *
 * El `modelo_id` va en la consulta y no solo en la ruta: sin esa condición, saber un id bastaría
 * para leer el fichero de cualquier otro modelo.
 */
export async function contenidoDocumento(
  db: Queryable,
  modeloId: string,
  docId: string,
): Promise<{ contentType: string; contentB64: string } | null> {
  const r = await db.query(
    'SELECT content_type, content_b64 FROM catalogo_documentos WHERE id = $1 AND modelo_id = $2',
    [docId, modeloId],
  )
  const f = filas(r.rows)[0]
  if (!f || f.content_b64 == null) return null
  return { contentType: (f.content_type as string) ?? 'application/octet-stream', contentB64: String(f.content_b64) }
}

/** Baja. Devuelve si borró algo, para que la ruta distinga un 404 de un borrado real. */
export async function borrarDocumento(db: Queryable, modeloId: string, docId: string): Promise<boolean> {
  const antes = await db.query('SELECT 1 FROM catalogo_documentos WHERE id = $1 AND modelo_id = $2', [docId, modeloId])
  if (!antes.rows.length) return false
  await db.query('DELETE FROM catalogo_documentos WHERE id = $1 AND modelo_id = $2', [docId, modeloId])
  return true
}
