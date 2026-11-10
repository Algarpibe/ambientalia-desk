import type { Queryable } from './migrate'

/**
 * Puesta al día ESTRICTA de la base en el arranque de la App (`arranque-migracion-estricta`, RQ-ZS-52 a RQ-ZS-56,
 * `decision/arranque-bloqueado-por-consola` (2)). `migrate()` y `reorgToDesk()` siguen siendo tolerantes por sentencia
 * (los usa el worker y las pruebas sobre pg-mem); este módulo ejecuta LAS MISMAS sentencias una a una, con un límite de
 * espera de bloqueo y parándose en la primera que falla.
 *
 * Cómo: abre un cliente propio del pool, le fija `lock_timeout` de sesión ANTES de nada, captura la lista de sentencias de
 * cada paso tolerante llamándolo contra un grabador que no toca la base, y la manda por el cliente en autocommit. El cliente
 * se destruye siempre (`release(true)`), porque un `SET` de sesión no se puede devolver al pool.
 */

/** Límite de espera de bloqueo por sentencia (S-3). Constante del código: ninguna variable de entorno (S-2). */
export const LIMITE_ESPERA_BLOQUEO_MS = 10_000

/** SQLSTATE `lock_not_available`: el que PostgreSQL señala al agotarse `lock_timeout`. */
const SQLSTATE_LIMITE_AGOTADO = '55P03'
const LARGO_MAXIMO_SENTENCIA = 160
/** Primera sentencia de la reorganización (`reorgToDeskStatements`): identifica el paso para la guarda de orden. */
const PRIMERA_DE_LA_REORGANIZACION = 'CREATE SCHEMA IF NOT EXISTS desk'

export interface ConexionDedicada { query(texto: string): Promise<unknown>; release(destruir: true): void }
export interface FuenteDeConexiones { connect(): Promise<ConexionDedicada> }
export type PasoTolerante = (db: Queryable) => Promise<void>

export class ErrorPuestaAlDia extends Error {
  readonly sentencia: string
  readonly codigo: string | undefined
  constructor(mensaje: string, sentencia: string, codigo: string | undefined, causa?: unknown) {
    super(mensaje, causa === undefined ? undefined : { cause: causa })
    this.name = 'ErrorPuestaAlDia'
    this.sentencia = sentencia
    this.codigo = codigo
  }
}

export class ErrorLimiteEspera extends ErrorPuestaAlDia {
  readonly limiteMs: number
  constructor(mensaje: string, sentencia: string, codigo: string | undefined, limiteMs: number, causa?: unknown) {
    super(mensaje, sentencia, codigo, causa)
    this.name = 'ErrorLimiteEspera'
    this.limiteMs = limiteMs
  }
}

export interface PuestaAlDiaEstricta { aplicar(paso: PasoTolerante): Promise<void>; cerrar(): void }

/** Quita los comentarios `--` iniciales, colapsa los espacios y corta a 160 caracteres con «…». Pura. */
export function recortarSentencia(sql: string): string {
  const limpia = sql.replace(/^(?:\s*--[^\n]*(?:\n|$))+/, '').replace(/\s+/g, ' ').trim()
  return limpia.length > LARGO_MAXIMO_SENTENCIA ? limpia.slice(0, LARGO_MAXIMO_SENTENCIA) + '…' : limpia
}

function codigoDe(e: unknown): string | undefined {
  const c = (e as { code?: unknown } | null | undefined)?.code
  return typeof c === 'string' ? c : undefined
}

function mensajeDe(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function clasificar(e: unknown, sentencia: string): ErrorPuestaAlDia {
  const codigo = codigoDe(e)
  const recorte = recortarSentencia(sentencia)
  if (codigo === SQLSTATE_LIMITE_AGOTADO) {
    return new ErrorLimiteEspera(
      `Puesta al día de la base detenida: se agotó el límite de espera de bloqueo (lock_timeout ${LIMITE_ESPERA_BLOQUEO_MS} ms) en la sentencia «${recorte}» [${codigo}] ${mensajeDe(e)}`,
      recorte, codigo, LIMITE_ESPERA_BLOQUEO_MS, e,
    )
  }
  return new ErrorPuestaAlDia(
    `Puesta al día de la base detenida: falló la sentencia «${recorte}» [${codigo ?? 'sin código'}] ${mensajeDe(e)}`,
    recorte, codigo, e,
  )
}

export async function abrirPuestaAlDiaEstricta(pool: FuenteDeConexiones): Promise<PuestaAlDiaEstricta> {
  const cliente = await pool.connect()
  let cerrado = false
  let migracionAplicada = false
  const cerrar = () => {
    if (cerrado) return
    cerrado = true
    cliente.release(true)
  }

  // El límite va ANTES de cualquier otra cosa: si no se puede fijar, no se sigue.
  const sentenciaLimite = `SET lock_timeout = '${LIMITE_ESPERA_BLOQUEO_MS}ms'`
  try {
    await cliente.query(sentenciaLimite)
  } catch (e) {
    cerrar()
    throw clasificar(e, sentenciaLimite)
  }

  async function aplicar(paso: PasoTolerante): Promise<void> {
    if (cerrado) throw new ErrorPuestaAlDia('Puesta al día de la base detenida: la sesión ya está cerrada', '', undefined)

    const capturadas: string[] = []
    const grabador: Queryable = {
      async query(texto: string) { capturadas.push(texto); return { rows: [] } },
    }
    try {
      await paso(grabador)
    } catch (e) {
      cerrar()
      throw new ErrorPuestaAlDia(
        `Puesta al día de la base detenida: paso no capturable (no envía sólo sentencias fijas): ${mensajeDe(e)}`,
        '', undefined, e,
      )
    }

    const esReorganizacion = capturadas[0] === PRIMERA_DE_LA_REORGANIZACION
    if (esReorganizacion && migracionAplicada) {
      cerrar()
      throw new ErrorPuestaAlDia('Puesta al día de la base detenida: la reorganización no puede ir después de la migración', '', undefined)
    }

    for (const sentencia of capturadas) {
      try {
        await cliente.query(sentencia)
      } catch (e) {
        cerrar()
        throw clasificar(e, sentencia)
      }
    }
    if (!esReorganizacion) migracionAplicada = true
  }

  return { aplicar, cerrar }
}
