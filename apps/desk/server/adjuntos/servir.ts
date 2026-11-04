import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { join } from 'node:path'
import type { Response } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { logger } from '../util/logger'
import { estadoCopia, type FilaAdjunto } from './almacen'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-31, D6). Lo que `GET /api/attachment` necesita para servir la copia local de un adjunto y, si no la
 * hay, dejar UNA línea de log de por qué cayó a Zoho. Esta ruta SOLO lee: nada de lo de aquí escribe un fichero ni `storage_path`.
 * Las cabeceras, el rol y la validez de la copia los decide el servidor (regla invariable 13): el cliente no interviene.
 */

export type MotivoCaida = 'sin fila' | 'sin directorio' | 'sin copia' | 'fichero ausente' | 'tamaño distinto'

export type Copia =
  | { tipo: 'local'; ruta: string; tamano: number; contentType: string | null; nombre: string | null; id: string }
  | { tipo: 'zoho'; adjunto: string; ticket: number | null; motivo: MotivoCaida }

interface FilaBuscada extends FilaAdjunto { content_type: string | null; numero: number | string | null }

/** El id del adjunto en un path de Zoho ya validado por la guarda de la ruta: el último número antes de `/content`. */
const idDelPath = (path: string): string => /\/attachments\/(\d+)\/content$/.exec(path)?.[1] ?? ''

/** Busca la fila cuyo `zoho_href` es el `path` y decide si su copia local se puede servir (D3). Sólo mira; no escribe. */
export async function buscarCopia(db: Queryable, dir: string | null, path: string): Promise<Copia> {
  const { rows } = await db.query(
    `SELECT a.id, a.name, a.size, a.content_type, a.storage_path, t.number AS numero
       FROM attachments a LEFT JOIN tickets t ON t.id = a.ticket_id
      WHERE a.zoho_href = $1 ORDER BY a.id LIMIT 1`, [path])
  const fila = rows[0] as FilaBuscada | undefined
  if (!fila) return { tipo: 'zoho', adjunto: idDelPath(path), ticket: null, motivo: 'sin fila' }
  const ticket = fila.numero === null || fila.numero === undefined ? null : Number(fila.numero)
  const cae = (motivo: MotivoCaida): Copia => ({ tipo: 'zoho', adjunto: fila.id, ticket, motivo })
  if (dir === null) return cae('sin directorio')

  let estado
  try { estado = await estadoCopia(dir, fila) } catch { return cae('fichero ausente') }   // un error de disco al leer no tumba la descarga: Zoho sigue ahí
  if (estado === 'sinCopia') return cae('sin copia')
  if (estado === 'ausente') return cae('fichero ausente')
  if (estado === 'otroTamano') return cae('tamaño distinto')

  const ruta = join(dir, fila.id)
  const st = await stat(ruta).catch(() => null)
  if (!st || !st.isFile()) return cae('fichero ausente')
  return { tipo: 'local', ruta, tamano: st.size, contentType: fila.content_type, nombre: fila.name ?? null, id: fila.id }
}

const TIPO_VALIDO = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/
/** Sólo lo que un navegador pinta sin ejecutar nada: imagen raster y PDF. HTML y SVG (que pueden llevar scripts) se descargan. */
const INLINE = /^(image\/(png|jpeg|gif|webp|bmp)|application\/pdf)$/

/** Tipo base en minúsculas; si no tiene forma de tipo (un salto de línea haría lanzar a `setHeader`), `application/octet-stream`. */
export function tipoBase(contentType: string | null): string {
  const base = (contentType ?? '').split(';')[0].trim().toLowerCase()
  return TIPO_VALIDO.test(base) ? base : 'application/octet-stream'
}

/** `Content-Disposition` con el nombre codificado según RFC 5987: `filename` ASCII de respaldo y `filename*` en UTF-8. */
export function disposicion(tipo: string, nombre: string | null, id: string): string {
  const real = nombre && nombre.length > 0 ? nombre : id
  const ascii = real.replace(/["\\/]|[^\x20-\x7e]/gu, '_')
  const codificado = encodeURIComponent(real).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
  return `${INLINE.test(tipo) ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${codificado}`
}

/** Sirve la copia local en streaming (sin cargar 35 MB en memoria). Sólo abre `ruta`, que `buscarCopia` armó con el id numérico. */
export async function servirCopia(res: Response, copia: Extract<Copia, { tipo: 'local' }>): Promise<void> {
  const tipo = tipoBase(copia.contentType)
  res.setHeader('Content-Type', tipo)
  res.setHeader('Content-Disposition', disposicion(tipo, copia.nombre, copia.id))
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Length', String(copia.tamano))
  await pipeline(createReadStream(copia.ruta), res)
}

/** UNA línea por petición que cae a Zoho (S-11): id, número de ticket, motivo y estado. Nunca `name`, `path` ni datos de cliente. */
export function registrarCaida(copia: Extract<Copia, { tipo: 'zoho' }>, estadoZoho: number | 'sin respuesta'): void {
  logger.warn({ adjunto: copia.adjunto, ticket: copia.ticket, motivo: copia.motivo, estadoZoho }, 'Adjunto servido desde Zoho: sin copia local válida')
}
