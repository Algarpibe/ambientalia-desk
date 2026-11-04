import * as fsReal from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join, relative, resolve, isAbsolute, sep } from 'node:path'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-30, D2 y D3). Guardado seguro de un adjunto de Zoho en el volumen de la App y lectura del
 * estado de su copia. El nombre en disco sale SÓLO del id (validado como numérico), nunca de `name` ni de la petición.
 * No crea el directorio: sin volumen, `ENOENT` corta en vez de escribir donde se pierde al redesplegar.
 */

/** Nombre en disco permitido: el id del adjunto, sólo dígitos (S-5; hipótesis: todos los ids de Zoho lo son). */
export const NOMBRE_ADJUNTO = /^\d+$/

/** Copia LITERAL de la guarda de `apps/desk/server/routes/attachment.ts:17`; `rutaAdjunto.test.ts` las enfrenta (H5). */
export const RUTA_ADJUNTO_ZOHO = /^\/tickets\/\d+\/(comments|threads)\/\d+\/attachments\/\d+\/content$/

type FsAlmacen = Pick<typeof fsReal, 'writeFile' | 'rename' | 'unlink' | 'stat'>
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>

/** Fallo de disco (ENOSPC, EACCES, ENOENT...): corta el recorrido entero (S-8). `code` es el de Node, nunca una ruta. */
export class ErrorDisco extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = 'ErrorDisco'
  }
}

export interface FilaAdjunto {
  id: string
  /** Sólo existe para que las pruebas demuestren que NO interviene: el nombre en disco sale del id. */
  name?: string | null
  size?: number | string | null
  zoho_href?: string | null
  storage_path?: string | null
}

export type ResultadoGuardado =
  | { estado: 'guardado'; comprobado: boolean; bytes: number }
  | { estado: 'sinRuta' }
  // Respuesta no ok de Zoho: el detalle de 429, 404 y otros es del motor del relleno (D4, lote L3).
  | { estado: 'respuesta'; status: number }
  | { estado: 'fallido'; motivo: 'id' | 'red' | 'tamano' | 'base' }

export type EstadoCopia = 'sinCopia' | 'ausente' | 'otroTamano' | 'presente'

export interface DepsAlmacen {
  zohoFetch: ZohoFetch
  db: Queryable
  dir: string
  /** Sólo para provocar fallos a mitad en las pruebas (M2, P4). */
  fs?: FsAlmacen
}

const codigoDe = (e: unknown): string => {
  const c = typeof e === 'object' && e !== null ? (e as { code?: unknown }).code : undefined
  return typeof c === 'string' ? c : 'DESCONOCIDO'
}

/** `size` es bigint en la base: llega como cadena o número; `null` si no hay. */
const tamanoDe = (size: number | string | null | undefined): number | null =>
  size === null || size === undefined || size === '' ? null : Number(size)

/** Tamaño anunciado por la cabecera, sólo si no hay `Content-Encoding` (hipótesis: Zoho no comprime este recurso). */
function tamanoDeCabecera(res: Response): number | null {
  const largo = res.headers.get('content-length')
  if (largo === null || res.headers.get('content-encoding')) return null
  const n = Number(largo)
  return Number.isFinite(n) ? n : null
}

export async function guardarAdjunto(d: DepsAlmacen, fila: FilaAdjunto): Promise<ResultadoGuardado> {
  const fs = d.fs ?? fsReal
  if (!NOMBRE_ADJUNTO.test(fila.id)) return { estado: 'fallido', motivo: 'id' }
  const href = fila.zoho_href
  if (typeof href !== 'string' || !RUTA_ADJUNTO_ZOHO.test(href)) return { estado: 'sinRuta' }

  let datos: Buffer
  let anunciado: number | null
  try {
    const res = await d.zohoFetch(href)
    if (!res.ok) return { estado: 'respuesta', status: res.status }
    datos = Buffer.from(await res.arrayBuffer())
    anunciado = tamanoDe(fila.size) ?? tamanoDeCabecera(res)
  } catch {
    return { estado: 'fallido', motivo: 'red' }
  }
  if (anunciado !== null && datos.length !== anunciado) return { estado: 'fallido', motivo: 'tamano' }

  const tmp = join(d.dir, `.${fila.id}.${process.pid}.${randomUUID()}.tmp`)
  try {
    await fs.writeFile(tmp, datos, { flag: 'wx' })
    await fs.rename(tmp, join(d.dir, fila.id))
  } catch (e) {
    await fs.unlink(tmp).catch(() => undefined)
    throw new ErrorDisco(codigoDe(e))
  }
  try {
    await d.db.query('UPDATE attachments SET storage_path=$1 WHERE id=$2', [fila.id, fila.id])
  } catch {
    return { estado: 'fallido', motivo: 'base' }
  }
  return { estado: 'guardado', comprobado: anunciado !== null, bytes: datos.length }
}

/** Estado de la copia local (D3). Sólo abre `join(dir, <id numérico>)`: nada fuera del directorio, nunca un temporal. */
export async function estadoCopia(dir: string, fila: FilaAdjunto, fs: Pick<typeof fsReal, 'stat'> = fsReal): Promise<EstadoCopia> {
  if (!NOMBRE_ADJUNTO.test(fila.id) || fila.storage_path !== fila.id) return 'sinCopia'
  let st
  try {
    st = await fs.stat(join(dir, fila.id))
  } catch (e) {
    if (codigoDe(e) === 'ENOENT') return 'ausente'
    throw new ErrorDisco(codigoDe(e))
  }
  if (!st.isFile()) return 'ausente'
  const esperado = tamanoDe(fila.size)
  return esperado !== null && st.size !== esperado ? 'otroTamano' : 'presente'
}

/**
 * Directorio de adjuntos (D7): la ruta resuelta, o `null` si está vacía, no es absoluta o cae dentro de `dist` (incluida ella misma),
 * que es lo que Express sirve como estático (`apps/desk/server/index.ts:52`).
 */
export function dirAdjuntos(valor: string | undefined, dist: string = resolve(process.cwd(), 'dist')): string | null {
  if (!valor || !isAbsolute(valor)) return null
  const ruta = resolve(valor)
  const rel = relative(dist, ruta)
  const dentro = rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel))
  return dentro ? null : ruta
}
