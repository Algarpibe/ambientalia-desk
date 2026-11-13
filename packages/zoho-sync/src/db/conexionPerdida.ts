import type { EventEmitter } from 'node:events'

export const TEXTO_CONEXION_PERDIDA = 'Pool de la base: se perdió una conexión inactiva; el proceso sigue'
export type Registrar = (linea: string) => void

const CODIGO_VALIDO = /^[A-Za-z0-9_]{1,32}$/

// Una línea física y sin cadenas de conexión: el mensaje puede traer una URL con contraseña (regla de secretos).
function sanear(texto: string): string {
  const sinUrl = texto.replace(/[a-z][a-z0-9+.-]*:\/\/\S*/gi, '<url omitida>')
  return sinUrl.replace(/\s+/g, ' ').trim()
}

function mensajeDe(err: unknown): string {
  if (err instanceof Error) return sanear(err.message)
  if (typeof err === 'string') return sanear(err)
  return `valor no Error (${typeof err})`
}

function codigoDe(err: unknown): string {
  if (!(err instanceof Error)) return ''
  const code: unknown = (err as { code?: unknown }).code
  return typeof code === 'string' && CODIGO_VALIDO.test(code) ? ` [${code}]` : ''
}

// Pura y sin lanzar: lee sólo `message` y `code`; nunca vuelca el objeto de error (pg-pool le cuelga `client`).
export function lineaConexionPerdida(err: unknown): string {
  try {
    return `${TEXTO_CONEXION_PERDIDA} — ${mensajeDe(err)}${codigoDe(err)}`
  } catch {
    return `${TEXTO_CONEXION_PERDIDA} — (sin detalle)`
  }
}

export function escucharConexionPerdida<P extends EventEmitter>(pool: P, registrar: Registrar = (l) => console.error(l)): P {
  const oyente = (err: unknown): void => {
    try {
      registrar(lineaConexionPerdida(err))
    } catch {
      // un registro que lanzara dentro del emit volvería a tumbar el proceso
    }
  }
  pool.on('error', oyente)
  return pool
}
