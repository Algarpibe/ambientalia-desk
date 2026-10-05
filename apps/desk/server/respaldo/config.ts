import { claveDesdeBase64 } from './cifrado'

/**
 * Configuración del respaldo (F1F-02, RQ-ZS-20), sólo por variables de entorno.
 *
 * Tiene su propio cargador y no vive en `packages/zoho-sync/src/config.ts` a propósito: añadir campos a `AppConfig`
 * desplazaría su cargador, que está citado línea a línea en medio repositorio (regla de mutación 4).
 */
export interface ConfigRespaldo {
  /** `RESPALDO_HABILITADO`: nace cerrado. Apagado no se vuelca ni se sube nada. */
  habilitado: boolean
  /** `RESPALDO_HORA`: hora de la copia nocturna, en la hora del contenedor (hipótesis H-2: UTC). */
  hora: number
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  /** `RESPALDO_CLAVE_CIFRADO`, base64 de 32 bytes. Se valida en `faltantes`, no aquí, para poder avisar de ella. */
  claveCifrado: string
  /** `RESPALDO_AVISO_EMAIL`: el responsable que recibe el correo si una copia falla (`decision/p55-backup`). */
  avisoEmail: string
  databaseUrl: string
}

type Env = Record<string, string | undefined>

export function cargarConfigRespaldo(env: Env = process.env): ConfigRespaldo {
  const hora = Number(env.RESPALDO_HORA)
  return {
    habilitado: env.RESPALDO_HABILITADO === 'true',   // default OFF
    hora: env.RESPALDO_HORA && Number.isInteger(hora) && hora >= 0 && hora <= 23 ? hora : 3,
    endpoint: env.RESPALDO_S3_ENDPOINT || '',
    region: env.RESPALDO_S3_REGION || '',
    bucket: env.RESPALDO_S3_BUCKET || '',
    accessKeyId: env.RESPALDO_S3_ACCESS_KEY_ID || '',
    secretAccessKey: env.RESPALDO_S3_SECRET_ACCESS_KEY || '',
    claveCifrado: env.RESPALDO_CLAVE_CIFRADO || '',
    avisoEmail: env.RESPALDO_AVISO_EMAIL || '',
    databaseUrl: env.DATABASE_URL || '',
  }
}

/** Lo que impide hacer una copia, nombrado como la variable que hay que poner. Vacío = se puede copiar. */
export function faltantes(c: ConfigRespaldo): string[] {
  const f: string[] = []
  if (!c.endpoint) f.push('RESPALDO_S3_ENDPOINT')
  else if (!/^https?:\/\/[^/\s]+/.test(c.endpoint)) f.push('RESPALDO_S3_ENDPOINT (no es una URL http/https)')
  if (!c.region) f.push('RESPALDO_S3_REGION')
  if (!c.bucket) f.push('RESPALDO_S3_BUCKET')
  if (!c.accessKeyId) f.push('RESPALDO_S3_ACCESS_KEY_ID')
  if (!c.secretAccessKey) f.push('RESPALDO_S3_SECRET_ACCESS_KEY')
  if (!c.claveCifrado) f.push('RESPALDO_CLAVE_CIFRADO')
  else { try { claveDesdeBase64(c.claveCifrado) } catch { f.push('RESPALDO_CLAVE_CIFRADO (no es base64 de 32 bytes)') } }
  if (!c.databaseUrl) f.push('DATABASE_URL')
  return f
}
