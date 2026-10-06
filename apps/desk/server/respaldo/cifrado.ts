import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { open, stat } from 'node:fs/promises'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

/**
 * Cifrado del volcado antes de que salga del servidor (F1F-02, RQ-ZS-20): «guardados cifrados», `decision/p55-backup`.
 * AES-256-GCM en flujo. Formato del fichero: `MAGIA` (6 bytes) · IV (12) · texto cifrado · etiqueta GCM (16).
 * Se cifra aquí y no sólo en el proveedor para que la propiedad no dependa del proveedor que se elija.
 */
export const MAGIA = Buffer.from('DESKR1')
const IV = 12
const ETIQUETA = 16

/** La clave vive en `RESPALDO_CLAVE_CIFRADO` como base64 de 32 bytes; cualquier otra cosa se rechaza, nunca se rellena. */
export function claveDesdeBase64(texto: string): Buffer {
  const clave = Buffer.from(texto, 'base64')
  if (clave.length !== 32 || clave.toString('base64') !== texto) throw new Error('La clave de cifrado tiene que ser exactamente 32 bytes en base64')
  return clave
}

export function cifrador(clave: Buffer): Transform {
  const iv = randomBytes(IV)
  const c = createCipheriv('aes-256-gcm', clave, iv)
  let cabecera = false
  return new Transform({
    transform(trozo: Buffer, _cod, listo) {
      if (!cabecera) { this.push(Buffer.concat([MAGIA, iv])); cabecera = true }
      listo(null, c.update(trozo))
    },
    flush(listo) {
      if (!cabecera) this.push(Buffer.concat([MAGIA, iv]))
      this.push(c.final()); listo(null, c.getAuthTag())
    },
  })
}

/** Para la prueba de restauración: descifra `entrada` en `salida`. Lanza si la clave no es la buena o el fichero se alteró. */
export async function descifrarFichero(entrada: string, salida: string, clave: Buffer): Promise<void> {
  const { size } = await stat(entrada)
  const fd = await open(entrada, 'r')
  const cab = Buffer.alloc(MAGIA.length + IV); const etiqueta = Buffer.alloc(ETIQUETA)
  try {
    await fd.read(cab, 0, cab.length, 0)
    if (size < cab.length + ETIQUETA || !cab.subarray(0, MAGIA.length).equals(MAGIA)) throw new Error(`${entrada} no es un respaldo de Desk (cabecera)`)
    await fd.read(etiqueta, 0, ETIQUETA, size - ETIQUETA)
  } finally { await fd.close() }
  const d = createDecipheriv('aes-256-gcm', clave, cab.subarray(MAGIA.length))
  d.setAuthTag(etiqueta)
  await pipeline(createReadStream(entrada, { start: cab.length, end: size - ETIQUETA - 1 }), d, createWriteStream(salida))
}
