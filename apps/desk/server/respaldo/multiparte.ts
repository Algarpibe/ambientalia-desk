import { createHash } from 'node:crypto'
import type { ConfigRespaldo } from './config'
import { firmarPeticion, hashHex } from './firmaS3'

/**
 * Subida multiparte S3 EN MEMORIA (F1F-02, RQ-ZS-21): una parte de 8 MiB cada vez, sin disco ni temporales. Cada parte
 * se firma con su SHA-256 REAL y lleva `Content-MD5` (el bloqueo de borrado lo exige, hipótesis S-4). Todo lo de red
 * entra por `fetchImpl`. Una subida que falla se aborta de mejor esfuerzo y LANZA; el borrado de una versión no lanza.
 */
export interface AlmacenS3 { cfg: Pick<ConfigRespaldo, 'endpoint' | 'region' | 'bucket' | 'accessKeyId' | 'secretAccessKey'>; fetchImpl: typeof fetch; ahora: () => Date }

export const PARTE = 8 * 1024 * 1024
const ESPERA = 120_000
const VACIO = Buffer.alloc(0)

const urlDe = (a: AlmacenS3, clave: string, consulta: string): URL => {
  const u = new URL(`${a.cfg.endpoint.replace(/\/+$/, '')}/${a.cfg.bucket}/${clave}`)
  u.search = consulta
  return u
}
/** Todas las cabeceras firmadas; `host` se quita porque `fetch` lo pone solo. */
const firmadas = (a: AlmacenS3, metodo: string, url: URL, extra: Record<string, string>, cuerpo: Buffer): Record<string, string> => {
  const c = firmarPeticion({ metodo, url, cabeceras: extra, hashCuerpo: hashHex(cuerpo), fecha: a.ahora() }, a.cfg)
  delete c.host
  return c
}
const fallo = async (res: Response, que: string): Promise<Error> => new Error(`S3 ${que} ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)
const q = (par: string, valor: string): string => `${par}=${encodeURIComponent(valor)}`

// Un verbo por función y escrito como literal: así lo ve el barrido de `superficieSaliente.test.ts` (que ordena por nombre: DELETE, POST, PUT).
function borrar(a: AlmacenS3, clave: string, consulta: string): Promise<Response> {
  const url = urlDe(a, clave, consulta)
  return a.fetchImpl(url.toString(), { method: 'DELETE', headers: firmadas(a, 'DELETE', url, {}, VACIO), signal: AbortSignal.timeout(ESPERA) })
}

function post(a: AlmacenS3, clave: string, consulta: string, cuerpo: Buffer): Promise<Response> {
  const url = urlDe(a, clave, consulta)
  return a.fetchImpl(url.toString(), { method: 'POST', headers: firmadas(a, 'POST', url, {}, cuerpo), body: cuerpo as unknown as BodyInit, signal: AbortSignal.timeout(ESPERA) })
}
function put(a: AlmacenS3, clave: string, consulta: string, parte: Buffer): Promise<Response> {
  const url = urlDe(a, clave, consulta)
  const md5 = createHash('md5').update(parte).digest('base64')
  return a.fetchImpl(url.toString(), { method: 'PUT', headers: firmadas(a, 'PUT', url, { 'Content-Length': String(parte.length), 'Content-MD5': md5 }, parte), body: parte as unknown as BodyInit, signal: AbortSignal.timeout(ESPERA) })
}

/** Trozos de exactamente `tamano` bytes (el último, el resto). Una fuente que acaba justo en el límite no deja parte vacía. */
export async function* trocear(fuente: AsyncIterable<Buffer>, tamano = PARTE): AsyncGenerator<Buffer> {
  let pendiente: Buffer[] = []; let n = 0
  for await (const trozo of fuente) {
    pendiente.push(trozo); n += trozo.length
    if (n < tamano) continue
    let junto = Buffer.concat(pendiente, n)
    for (; junto.length >= tamano; junto = junto.subarray(tamano)) yield junto.subarray(0, tamano)
    pendiente = junto.length ? [junto] : []; n = junto.length
  }
  if (n) yield Buffer.concat(pendiente, n)
}

async function subirParte(a: AlmacenS3, clave: string, id: string, numero: number, parte: Buffer): Promise<string> {
  const res = await put(a, clave, `${q('partNumber', String(numero))}&${q('uploadId', id)}`, parte)
  const etag = res.headers.get('etag')
  if (!res.ok || !etag) throw await fallo(res, `UploadPart ${numero}`)
  return etag
}

/** Sube `fuente` como un objeto. Devuelve el `versionId` del almacenamiento (hace falta para borrar esa versión después). */
export async function subirMultiparte(a: AlmacenS3, clave: string, fuente: AsyncIterable<Buffer>): Promise<{ versionId?: string }> {
  const creada = await post(a, clave, 'uploads', VACIO)
  const texto = await creada.text().catch(() => '')
  const id = /<UploadId>([^<]+)<\/UploadId>/.exec(texto)?.[1]
  if (!creada.ok || !id) throw new Error(`S3 CreateMultipartUpload ${creada.status}: ${texto.slice(0, 300)}`)
  try {
    const etags: string[] = []
    for await (const parte of trocear(fuente)) etags.push(await subirParte(a, clave, id, etags.length + 1, parte))
    if (!etags.length) etags.push(await subirParte(a, clave, id, 1, VACIO)) // S3 no cierra una subida sin partes
    const xml = `<CompleteMultipartUpload>${etags.map((e, i) => `<Part><PartNumber>${i + 1}</PartNumber><ETag>${e}</ETag></Part>`).join('')}</CompleteMultipartUpload>`
    const fin = await post(a, clave, q('uploadId', id), Buffer.from(xml))
    const cuerpo = await fin.text().catch(() => '')
    // S3 puede contestar 200 y llevar el error en el cuerpo: eso NO es una subida completa.
    if (!fin.ok || /<Error>/.test(cuerpo)) throw new Error(`S3 CompleteMultipartUpload ${fin.status}: ${cuerpo.slice(0, 300)}`)
    return { versionId: fin.headers.get('x-amz-version-id') ?? undefined }
  } catch (e) {
    await borrar(a, clave, q('uploadId', id)).catch(() => undefined) // Abort de mejor esfuerzo; el error que sale es el original
    throw e
  }
}

/** Borra UNA versión (`?versionId=`: sin él, en un almacenamiento versionado sólo se crearía un marcador). Nunca lanza. */
export async function borrarVersion(a: AlmacenS3, clave: string, versionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await borrar(a, clave, q('versionId', versionId))
    return res.ok ? { ok: true } : { ok: false, error: (await fallo(res, 'DELETE')).message }
  } catch (e) { return { ok: false, error: `S3 DELETE: ${e instanceof Error ? e.message : String(e)}` } }
}

/** `GET` de un objeto entero en memoria (el índice). `404` = no existe (`null`); cualquier otro fallo lanza. */
export async function leerObjeto(a: AlmacenS3, clave: string): Promise<Buffer | null> {
  const url = urlDe(a, clave, '')
  const res = await a.fetchImpl(url.toString(), { headers: firmadas(a, 'GET', url, {}, VACIO), signal: AbortSignal.timeout(ESPERA) })
  if (res.status === 404) return null
  if (!res.ok) throw await fallo(res, 'GET')
  return Buffer.from(await res.arrayBuffer())
}
