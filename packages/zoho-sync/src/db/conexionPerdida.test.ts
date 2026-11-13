import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { createPool, createPoolFromUrl } from './pool'
import { escucharConexionPerdida, lineaConexionPerdida, TEXTO_CONEXION_PERDIDA } from './conexionPerdida'
import type { AppConfig } from '../config'

const URL_PRUEBA = 'postgres://u:p@h:5432/db'
const MENSAJE_57P01 = 'terminating connection due to administrator command'

afterEach(() => {
  vi.restoreAllMocks()
})

function errorConCodigo(mensaje: string, code?: string): Error {
  const err = new Error(mensaje)
  if (code !== undefined) Object.assign(err, { code })
  return err
}

describe('U-1 · los pools de pool.ts escuchan su evento error (RQ-ZS-58.1-3)', () => {
  const casos: Array<[string, () => ReturnType<typeof createPoolFromUrl>]> = [
    ['createPool desk', () => createPool({ databaseUrl: URL_PRUEBA, dbSchema: 'desk' } as AppConfig)],
    ['createPool public', () => createPool({ databaseUrl: URL_PRUEBA, dbSchema: 'public' } as AppConfig)],
    ['createPoolFromUrl', () => createPoolFromUrl(URL_PRUEBA)],
  ]
  for (const [nombre, crear] of casos) {
    it(`${nombre}: un oyente de error y emit('error') no lanza`, async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const pool = crear()
      try {
        expect(() => pool.emit('error', new Error('x'))).not.toThrow()
        expect(pool.listenerCount('error')).toBe(1)
      } finally {
        await pool.end()
      }
    })
  }
})

describe('U-2 · una línea por evento, un solo argumento (RQ-ZS-59.1, .2)', () => {
  it('sin code: una llamada, un argumento cadena, una línea física, texto fijo y mensaje, sin corchetes', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    const pool = escucharConexionPerdida(new EventEmitter())
    pool.emit('error', errorConCodigo('Connection terminated unexpectedly'))
    expect(espia).toHaveBeenCalledTimes(1)
    const args = espia.mock.calls[0]
    expect(args).toHaveLength(1)
    const linea = args[0]
    expect(typeof linea).toBe('string')
    expect(linea).not.toContain('\n')
    expect(linea).toContain(TEXTO_CONEXION_PERDIDA)
    expect(linea).toContain('Connection terminated unexpectedly')
    expect(linea).not.toContain('[')
  })
})

describe('U-3 · el código entra entre corchetes (RQ-ZS-59.2)', () => {
  it('con code 57P01 la línea termina en [57P01]', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    escucharConexionPerdida(new EventEmitter()).emit('error', errorConCodigo(MENSAJE_57P01, '57P01'))
    expect(espia.mock.calls[0][0]).toBe(`${TEXTO_CONEXION_PERDIDA} — ${MENSAJE_57P01} [57P01]`)
  })
  it('un code que no es SQLSTATE ni código de Node se omite', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    escucharConexionPerdida(new EventEmitter()).emit('error', errorConCodigo('m', 'no es codigo; ' + 'x'.repeat(40)))
    expect(espia.mock.calls[0][0]).toBe(`${TEXTO_CONEXION_PERDIDA} — m`)
  })
})

describe('U-4 · nunca el objeto de error ni su cliente (RQ-ZS-59.3)', () => {
  it('con err.client falso la línea no filtra contraseña, usuario, host ni esquema de URL', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    const client = {
      connectionString: 'postgres://usuario-testigo:TESTIGO-7Q@host-testigo:5432/db',
      connectionParameters: { password: 'TESTIGO-7Q', user: 'usuario-testigo', host: 'host-testigo' },
    }
    const err = Object.assign(errorConCodigo(MENSAJE_57P01, '57P01'), { client })
    escucharConexionPerdida(new EventEmitter()).emit('error', err, client)
    expect(espia).toHaveBeenCalledTimes(1)
    expect(espia.mock.calls[0]).toHaveLength(1)
    const linea = String(espia.mock.calls[0][0])
    expect(linea).toContain(MENSAJE_57P01)
    for (const testigo of ['TESTIGO-7Q', 'host-testigo', 'usuario-testigo', 'postgres://']) {
      expect(linea).not.toContain(testigo)
    }
  })
})

describe('U-5 · una línea por evento (RQ-ZS-59.4)', () => {
  it('tres errores seguidos sobre el mismo pool dan tres llamadas', () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    const pool = escucharConexionPerdida(new EventEmitter())
    pool.emit('error', errorConCodigo('uno', '57P01'))
    pool.emit('error', errorConCodigo('dos'))
    pool.emit('error', errorConCodigo('tres', 'ECONNRESET'))
    expect(espia).toHaveBeenCalledTimes(3)
    expect(espia.mock.calls.map((c) => String(c[0]).slice(TEXTO_CONEXION_PERDIDA.length))).toEqual([
      ' — uno [57P01]',
      ' — dos',
      ' — tres [ECONNRESET]',
    ])
  })
})

describe('U-6 · saneado del mensaje (D-3)', () => {
  it('colapsa saltos de línea y sustituye URL con contraseña por <url omitida>', () => {
    const linea = lineaConexionPerdida(
      errorConCodigo('fallo al conectar\ncon postgres://usuario-testigo:TESTIGO-7Q@host-testigo:5432/db\r\n  y reintento'),
    )
    expect(linea).not.toMatch(/[\r\n]/)
    expect(linea).toContain('<url omitida>')
    expect(linea).toBe(`${TEXTO_CONEXION_PERDIDA} — fallo al conectar con <url omitida> y reintento`)
    for (const testigo of ['TESTIGO-7Q', 'host-testigo', 'usuario-testigo', 'postgres://']) {
      expect(linea).not.toContain(testigo)
    }
  })
})

describe('U-7 · entradas que no son un Error (D-5)', () => {
  const testigo = 'TESTIGO-OBJETO-9'
  const conGetterQueLanza = Object.defineProperty(new Error('x'), 'message', {
    get() {
      throw new Error(testigo)
    },
  })
  const casos: Array<[string, unknown, string]> = [
    ['cadena', 'conexión cortada', ' — conexión cortada'],
    ['undefined', undefined, ' — valor no Error (undefined)'],
    ['null', null, ' — valor no Error (object)'],
    ['objeto con toString que filtra', { toString: () => testigo, secreto: testigo }, ' — valor no Error (object)'],
    ['Error con getter de message que lanza', conGetterQueLanza, ' — (sin detalle)'],
  ]
  for (const [nombre, entrada, resto] of casos) {
    it(`${nombre}: no lanza y no filtra`, () => {
      let linea = ''
      expect(() => {
        linea = lineaConexionPerdida(entrada)
      }).not.toThrow()
      expect(linea).toBe(`${TEXTO_CONEXION_PERDIDA}${resto}`)
      expect(linea).not.toContain(testigo)
    })
  }
})

describe('U-8 · un registrar que lanza no tumba el emit', () => {
  it('emit(error) no lanza aunque el registrar lance', () => {
    const registrar = vi.fn(() => {
      throw new Error('el registro falló')
    })
    const pool = escucharConexionPerdida(new EventEmitter(), registrar)
    expect(() => pool.emit('error', errorConCodigo('x'))).not.toThrow()
    expect(registrar).toHaveBeenCalledTimes(1)
  })
})

describe('U-9 · tiempos y límites intactos (RQ-ZS-58.5)', () => {
  const claves = ['max', 'min', 'idleTimeoutMillis', 'statement_timeout', 'connectionTimeoutMillis']
  const recortar = (p: Pool) => {
    const o = (p as unknown as { options: Record<string, unknown> }).options
    return Object.fromEntries(claves.map((k) => [k, o[k]]))
  }
  it('createPool desk, createPool public y createPoolFromUrl igualan a un new Pool con las opciones de 96cba5ab', async () => {
    const desk = createPool({ databaseUrl: URL_PRUEBA, dbSchema: 'desk' } as AppConfig)
    const pub = createPool({ databaseUrl: URL_PRUEBA, dbSchema: 'public' } as AppConfig)
    const url = createPoolFromUrl(URL_PRUEBA)
    const refDesk = new Pool({ connectionString: URL_PRUEBA, options: '-c search_path=desk,public' })
    const refPub = new Pool({ connectionString: URL_PRUEBA })
    refDesk.on('error', () => {})
    refPub.on('error', () => {})
    try {
      expect(recortar(desk)).toEqual(recortar(refDesk))
      expect(recortar(pub)).toEqual(recortar(refPub))
      expect(recortar(url)).toEqual(recortar(refPub))
      expect(recortar(desk).max).toBe(10)
    } finally {
      await Promise.all([desk.end(), pub.end(), url.end(), refDesk.end(), refPub.end()])
    }
  })
})

describe('U-10 · forma de pool.ts (RQ-ZS-61.1, CA-5)', () => {
  const crudo = readFileSync(fileURLToPath(new URL('./pool.ts', import.meta.url)), 'utf8')
  const lineas = crudo.replace(/\r?\n$/, '').split(/\r?\n/)
  const L = (n: number) => lineas[n - 1]
  it('tiene 11 líneas y todos los finales son iguales', () => {
    expect(lineas).toHaveLength(11)
    const crlf = (crudo.match(/\r\n/g) ?? []).length
    const lf = (crudo.match(/\n/g) ?? []).length
    expect(crlf === 0 || crlf === lf).toBe(true)
  })
  it('las líneas 2-5, 7-9 y 11 son las de 96cba5ab', () => {
    expect(L(2)).toBe("import type { AppConfig } from '../config'")
    expect(L(3)).toBe('')
    expect(L(4)).toBe('export function createPool(config: AppConfig): Pool {')
    expect(L(5)).toBe("  const opts = config.dbSchema === 'desk' ? { options: '-c search_path=desk,public' } : {}")
    expect(L(7)).toBe('}')
    expect(L(8)).toBe('')
    expect(L(9)).toBe('export function createPoolFromUrl(connectionString: string): Pool {')
    expect(L(11)).toBe('}')
  })
  it('sólo la 1 importa el módulo y sólo la 6 y la 10 envuelven el new Pool', () => {
    expect(L(1).startsWith("import { Pool } from 'pg'")).toBe(true)
    expect(L(1)).toContain("from './conexionPerdida'")
    const envueltas = lineas.map((l, i) => (l.includes('escucharConexionPerdida(new Pool(') ? i + 1 : 0)).filter(Boolean)
    expect(envueltas).toEqual([6, 10])
  })
})
