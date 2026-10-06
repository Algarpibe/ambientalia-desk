import { faltantes, type ConfigRespaldo } from './config'

/**
 * Configuración de la copia semanal de Drive (F1F-02, RQ-ZS-21), sólo por variables de entorno.
 *
 * Fichero propio y no campos en `ConfigRespaldo`: ampliar `config.ts` desplazaría líneas que otros ficheros citan
 * (regla de mutación 4). El destino S3 y la clave de cifrado son los de la nocturna y se validan con su `faltantes`.
 */
export interface ConfigDrive {
  /** `RESPALDO_DRIVE_HABILITADO`: nace cerrado. Apagado no se pide token a Google ni se lista nada. */
  habilitado: boolean
  /** `RESPALDO_DRIVE_DIA`: día de la semana (0 = domingo), por defecto 0. */
  dia: number
  /** `RESPALDO_DRIVE_HORA`: hora local de la pasada, por defecto 5 (después de la nocturna). */
  hora: number
  /** `RESPALDO_DRIVE_CREDENCIAL`: JSON de la cuenta de servicio en base64. El valor vive sólo en el gestor de secretos. */
  credencial: string
  /** `RESPALDO_DRIVE_CARPETA_ID`: se interpola en la `q` de Drive, por eso se valida su forma. */
  carpetaId: string
}

type Env = Record<string, string | undefined>

const entero = (v: string | undefined, min: number, max: number, defecto: number): number => {
  const n = Number(v)
  return v && Number.isInteger(n) && n >= min && n <= max ? n : defecto
}

export function cargarConfigDrive(env: Env = process.env): ConfigDrive {
  return {
    habilitado: env.RESPALDO_DRIVE_HABILITADO === 'true',   // default OFF
    dia: entero(env.RESPALDO_DRIVE_DIA, 0, 6, 0),
    hora: entero(env.RESPALDO_DRIVE_HORA, 0, 23, 5),
    credencial: env.RESPALDO_DRIVE_CREDENCIAL || '',
    carpetaId: env.RESPALDO_DRIVE_CARPETA_ID || '',
  }
}

const credencialValida = (b64: string): boolean => {
  try {
    const j = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
    return typeof j?.client_email === 'string' && !!j.client_email && typeof j?.private_key === 'string' && !!j.private_key
  } catch { return false }
}

/** Lo que impide la pasada, nombrado como la variable. Nunca incluye el valor de la credencial. Vacío = se puede copiar. */
export function faltantesDrive(d: ConfigDrive, base: ConfigRespaldo): string[] {
  const f: string[] = []
  if (!d.credencial) f.push('RESPALDO_DRIVE_CREDENCIAL')
  else if (!credencialValida(d.credencial)) f.push('RESPALDO_DRIVE_CREDENCIAL (no es JSON base64 con client_email y private_key)')
  if (!d.carpetaId) f.push('RESPALDO_DRIVE_CARPETA_ID')
  else if (!/^[\w-]+$/.test(d.carpetaId)) f.push('RESPALDO_DRIVE_CARPETA_ID (formato no válido)')
  // `DATABASE_URL` no la usa esta copia: se filtra de las que pide la nocturna.
  return [...f, ...faltantes(base).filter((x) => x !== 'DATABASE_URL')]
}

/** `getDay()` local, porque `scheduleDailyAt` programa en hora local. */
export const tocaHoy = (dia: number, fecha: Date): boolean => fecha.getDay() === dia
