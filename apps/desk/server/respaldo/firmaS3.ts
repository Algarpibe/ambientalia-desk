import { createHash, createHmac } from 'node:crypto'

/**
 * Firma SigV4 de una petición a un almacenamiento S3 compatible (F1F-02, RQ-ZS-20).
 *
 * Es propia y no del SDK de AWS a propósito: el SDK reescribiría `package-lock.json` con miles de líneas para hacer
 * una sola cosa, un `PUT` firmado. Los tres proveedores candidatos de `decision/p55b-destino-copia` (Backblaze B2,
 * Cloudflare R2, Amazon S3) aceptan esta firma. La prueba la fija contra los ejemplos publicados por AWS.
 */
export interface CredencialesS3 { accessKeyId: string; secretAccessKey: string; region: string }

export interface PeticionAFirmar {
  metodo: string
  url: URL
  /** Cabeceras propias que también se firman (p. ej. `Content-MD5`). `host`, `x-amz-date` y `x-amz-content-sha256` se añaden aquí. */
  cabeceras: Record<string, string>
  /** SHA-256 hexadecimal del cuerpo, o `UNSIGNED-PAYLOAD`. */
  hashCuerpo: string
  fecha: Date
}

export const hashHex = (datos: string | Buffer): string => createHash('sha256').update(datos).digest('hex')
const hmac = (clave: string | Buffer, datos: string): Buffer => createHmac('sha256', clave).update(datos).digest()

/** S3 codifica cada segmento de la ruta una sola vez y conserva las barras; `encodeURIComponent` deja sin codificar `!'()*`. */
const codificarSegmento = (s: string): string => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
const rutaCanonica = (url: URL): string => url.pathname.split('/').map((s) => codificarSegmento(decodeURIComponent(s))).join('/')

/** Devuelve TODAS las cabeceras que hay que mandar: las propias, `host`, `x-amz-date`, `x-amz-content-sha256` y `Authorization`. */
export function firmarPeticion(p: PeticionAFirmar, cred: CredencialesS3): Record<string, string> {
  const amzFecha = p.fecha.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const dia = amzFecha.slice(0, 8)
  const cabeceras: Record<string, string> = { ...p.cabeceras, host: p.url.host, 'x-amz-date': amzFecha, 'x-amz-content-sha256': p.hashCuerpo }
  const nombres = Object.keys(cabeceras).map((k) => k.toLowerCase()).sort()
  const valor = (n: string) => String(Object.entries(cabeceras).find(([k]) => k.toLowerCase() === n)?.[1] ?? '').trim().replace(/\s+/g, ' ')
  const firmadas = nombres.join(';')
  const consulta = [...p.url.searchParams.entries()].map(([k, v]) => `${codificarSegmento(k)}=${codificarSegmento(v)}`).sort().join('&')
  const canonica = [p.metodo, rutaCanonica(p.url), consulta, nombres.map((n) => `${n}:${valor(n)}\n`).join(''), firmadas, p.hashCuerpo].join('\n')
  const ambito = `${dia}/${cred.region}/s3/aws4_request`
  const aFirmar = ['AWS4-HMAC-SHA256', amzFecha, ambito, hashHex(canonica)].join('\n')
  const claveFirma = hmac(hmac(hmac(hmac(`AWS4${cred.secretAccessKey}`, dia), cred.region), 's3'), 'aws4_request')
  const firma = createHmac('sha256', claveFirma).update(aFirmar).digest('hex')
  return { ...cabeceras, Authorization: `AWS4-HMAC-SHA256 Credential=${cred.accessKeyId}/${ambito},SignedHeaders=${firmadas},Signature=${firma}` }
}
