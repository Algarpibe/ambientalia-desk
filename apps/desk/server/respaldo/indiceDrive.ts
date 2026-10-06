import { cifrador, descifrarBuffer } from './cifrado'
import { indiceVacio, type IndiceDrive } from './incremental'
import { leerObjeto, subirMultiparte, type AlmacenS3 } from './multiparte'

/**
 * El índice de lo copiado, cifrado y entero en memoria (F1F-02, RQ-ZS-21). Sólo un `404` es «primera pasada». Cualquier
 * otro fallo lanza `IndiceIlegible`, que el orquestador convierte en aviso SIN copiar ni borrar: copiar a ciegas
 * escribiría un índice que olvida las versiones viejas, y nunca se retirarían.
 */
export const CLAVE_INDICE = 'drive/indice.json.enc'

export class IndiceIlegible extends Error {
  constructor(motivo: string) { super(`El índice de la copia de Drive no se puede leer: ${motivo}`); this.name = 'IndiceIlegible' }
}

export async function leerIndice(a: AlmacenS3, claveCifrado: Buffer, ahora: string): Promise<IndiceDrive> {
  let datos: Buffer | null
  try { datos = await leerObjeto(a, CLAVE_INDICE) } catch (e) { throw new IndiceIlegible(e instanceof Error ? e.message : String(e)) }
  if (!datos) return indiceVacio(ahora)
  try {
    const indice = JSON.parse(descifrarBuffer(datos, claveCifrado).toString('utf8')) as IndiceDrive
    if (indice?.formato !== 1 || !indice.documentos || typeof indice.documentos !== 'object' || Array.isArray(indice.documentos)) throw new Error('formato desconocido')
    return indice
  } catch (e) { throw new IndiceIlegible(e instanceof Error ? e.message : String(e)) }
}

/** Cifra con el mismo `cifrador` que los documentos y lo sube por la misma vía multiparte. Lanza si la subida falla. */
export async function escribirIndice(a: AlmacenS3, claveCifrado: Buffer, indice: IndiceDrive): Promise<{ versionId?: string }> {
  const c = cifrador(claveCifrado)
  c.end(Buffer.from(JSON.stringify(indice)))
  return subirMultiparte(a, CLAVE_INDICE, c)
}
