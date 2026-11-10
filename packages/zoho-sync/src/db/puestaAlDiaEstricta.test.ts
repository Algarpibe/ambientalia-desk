import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate, reorgToDesk, reorgToDeskStatements, reseedTicketNumber, schemaStatements, type Queryable } from './migrate'
import {
  LIMITE_ESPERA_BLOQUEO_MS,
  ErrorLimiteEspera,
  ErrorPuestaAlDia,
  abrirPuestaAlDiaEstricta,
  recortarSentencia,
  type FuenteDeConexiones,
} from './puestaAlDiaEstricta'

/**
 * `arranque-migracion-estricta` (RQ-ZS-52 a RQ-ZS-56), U-1 a U-12 de `design.md` §5. La fuente de conexiones es falsa y
 * registra en UN solo arreglo, por orden, cada texto recibido y cada `release` con su argumento: así las pruebas de
 * POSICIÓN (regla de mutación 1) comparan el orden real, no dos listas por separado.
 */
type Evento = { tipo: 'query'; texto: string } | { tipo: 'release'; destruir: unknown }

function crearFuente(falla?: (texto: string, indice: number) => Error | undefined) {
  const registro: Evento[] = []
  let indice = 0
  const fuente: FuenteDeConexiones = {
    async connect() {
      return {
        async query(texto: string) {
          registro.push({ tipo: 'query', texto })
          const error = falla?.(texto, indice++)
          if (error) throw error
          return { rows: [] }
        },
        release(destruir: true) { registro.push({ tipo: 'release', destruir }) },
      }
    },
  }
  return { fuente, registro, textos: () => registro.filter((e) => e.tipo === 'query').map((e) => (e as { texto: string }).texto) }
}

const SET_ESPERADO = `SET lock_timeout = '${LIMITE_ESPERA_BLOQUEO_MS}ms'`
const conCodigo = (mensaje: string, code?: string) => Object.assign(new Error(mensaje), code ? { code } : {})
const SENTENCIA_DEL_INCIDENTE = 'ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS sku text'

function grabador() {
  const textos: string[] = []
  const db: Queryable = { async query(texto: string) { textos.push(texto); return { rows: [] } } }
  return { db, textos }
}

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('puestaAlDiaEstricta · posición (RQ-ZS-52.1, RQ-ZS-55.1-2)', () => {
  it('U-1 · el SET es lo primero; después, exactamente la reorganización y la migración; al final release(true) y nada más', async () => {
    const { fuente, registro } = crearFuente()
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    await sesion.aplicar(reorgToDesk)
    await sesion.aplicar(migrate)
    sesion.cerrar()
    expect(registro[0]).toEqual({ tipo: 'query', texto: SET_ESPERADO })
    const ultimo = registro[registro.length - 1]
    expect(ultimo).toEqual({ tipo: 'release', destruir: true })
    expect(registro.slice(1, -1)).toEqual([...reorgToDeskStatements(), ...schemaStatements()].map((texto) => ({ tipo: 'query', texto })))
    expect(registro.filter((e) => e.tipo === 'release')).toHaveLength(1)
  })

  it('U-2 · sin reorganización (sólo aplicar(migrate)): el SET y luego sólo schemaStatements()', async () => {
    const { fuente, registro } = crearFuente()
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    await sesion.aplicar(migrate)
    sesion.cerrar()
    expect(registro[0]).toEqual({ tipo: 'query', texto: SET_ESPERADO })
    expect(registro.slice(1, -1)).toEqual(schemaStatements().map((texto) => ({ tipo: 'query', texto })))
  })

  it('U-7 · guarda de orden: aplicar(migrate) y luego aplicar(reorgToDesk) rechaza sin enviar la reorganización', async () => {
    const { fuente, registro, textos } = crearFuente()
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    await sesion.aplicar(migrate)
    await expect(sesion.aplicar(reorgToDesk)).rejects.toBeInstanceOf(ErrorPuestaAlDia)
    expect(textos()).toEqual([SET_ESPERADO, ...schemaStatements()])
    expect(registro[registro.length - 1]).toEqual({ tipo: 'release', destruir: true })
  })
})

describe('puestaAlDiaEstricta · equivalencia con los pasos tolerantes (RQ-ZS-56, H5)', () => {
  it('U-3 · migrate(grabador) y reorgToDesk(grabador) envían exactamente las listas puras, en orden', async () => {
    const m = grabador()
    await migrate(m.db)
    expect(m.textos).toEqual(schemaStatements())
    const r = grabador()
    await reorgToDesk(r.db)
    expect(r.textos).toEqual(reorgToDeskStatements())
  })
})

describe('puestaAlDiaEstricta · la primera que falla corta (RQ-ZS-54)', () => {
  it('U-4 · falla la 3.ª de la migración con 42P01: ErrorPuestaAlDia (no de límite), el registro termina ahí y un aplicar posterior no envía', async () => {
    const tercera = schemaStatements()[2]
    const { fuente, registro, textos } = crearFuente((_t, i) => (i === 3 ? conCodigo('relation does not exist', '42P01') : undefined))
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    const error = await sesion.aplicar(migrate).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorPuestaAlDia)
    expect(error).not.toBeInstanceOf(ErrorLimiteEspera)
    expect((error as ErrorPuestaAlDia).codigo).toBe('42P01')
    expect((error as ErrorPuestaAlDia).message).toContain('relation does not exist')
    expect((error as ErrorPuestaAlDia).message).not.toContain('límite de espera')
    expect(textos()).toEqual([SET_ESPERADO, ...schemaStatements().slice(0, 3)])
    expect(textos()[3]).toBe(tercera)
    expect(registro[registro.length - 1]).toEqual({ tipo: 'release', destruir: true })
    const antes = registro.length
    await expect(sesion.aplicar(migrate)).rejects.toBeInstanceOf(Error)
    expect(registro).toHaveLength(antes)
  })

  it('U-5 · falla una de la reorganización: ninguna de schemaStatements() se envía', async () => {
    const { fuente, textos } = crearFuente((_t, i) => (i === 2 ? conCodigo('permission denied', '42501') : undefined))
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    await expect(sesion.aplicar(reorgToDesk)).rejects.toBeInstanceOf(ErrorPuestaAlDia)
    await expect(sesion.aplicar(migrate)).rejects.toBeInstanceOf(Error)
    const migracion = new Set(schemaStatements())
    expect(textos().some((t) => migracion.has(t))).toBe(false)
    expect(textos()).toEqual([SET_ESPERADO, ...reorgToDeskStatements().slice(0, 2)])
  })
})

describe('puestaAlDiaEstricta · el límite agotado (RQ-ZS-53)', () => {
  it('U-6 · 55P03 en la sentencia del incidente: ErrorLimiteEspera con «límite de espera», la sentencia, 10000 y el código', async () => {
    const del_incidente = schemaStatements().find((s) => s.includes(SENTENCIA_DEL_INCIDENTE))
    expect(del_incidente, 'la sentencia del incidente tiene que seguir en schema.sql').toBeDefined()
    const { fuente } = crearFuente((t) => (t === del_incidente ? conCodigo('canceling statement due to lock timeout', '55P03') : undefined))
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    const error = await sesion.aplicar(migrate).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorLimiteEspera)
    const e = error as ErrorLimiteEspera
    expect(e.codigo).toBe('55P03')
    expect(e.limiteMs).toBe(10000)
    expect(e.sentencia).toBe(SENTENCIA_DEL_INCIDENTE)
    expect(e.message).toBe(
      `Puesta al día de la base detenida: se agotó el límite de espera de bloqueo (lock_timeout 10000 ms) en la sentencia «${SENTENCIA_DEL_INCIDENTE}» [55P03] canceling statement due to lock timeout`,
    )
  })

  it('U-6b · otro fallo no se presenta como límite, ni siquiera con el texto del mensaje', async () => {
    const { fuente } = crearFuente((_t, i) => (i === 1 ? conCodigo('canceling statement due to lock timeout', '57014') : undefined))
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    const error = await sesion.aplicar(migrate).catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(ErrorLimiteEspera)
    expect((error as Error).message).toContain('falló la sentencia «')
    expect((error as Error).message).toContain('[57014]')
    expect((error as Error).message).not.toContain('límite de espera')
  })

  it('U-6c · un error sin código dice «sin código»', async () => {
    const { fuente } = crearFuente((_t, i) => (i === 1 ? new Error('boom') : undefined))
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    const error = await sesion.aplicar(migrate).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorPuestaAlDia)
    expect((error as ErrorPuestaAlDia).codigo).toBeUndefined()
    expect((error as Error).message).toContain('[sin código] boom')
  })
})

describe('puestaAlDiaEstricta · el valor es una constante (RQ-ZS-52.2)', () => {
  it('U-8 · con variables de nombre plausible puestas, el SET es idéntico; el módulo no lee process.env; .env.example no lo menciona', async () => {
    const a = crearFuente()
    await (await abrirPuestaAlDiaEstricta(a.fuente)).aplicar(reorgToDesk)
    vi.stubEnv('LOCK_TIMEOUT', '1')
    vi.stubEnv('LIMITE_ESPERA_BLOQUEO_MS', '1')
    vi.stubEnv('PG_LOCK_TIMEOUT', '1')
    const b = crearFuente()
    await (await abrirPuestaAlDiaEstricta(b.fuente)).aplicar(reorgToDesk)
    expect(a.textos()[0]).toBe(SET_ESPERADO)
    expect(b.textos()[0]).toBe(SET_ESPERADO)
    const aqui = path.dirname(fileURLToPath(import.meta.url))
    const fuenteModulo = readFileSync(path.join(aqui, 'puestaAlDiaEstricta.ts'), 'utf8')
    expect(fuenteModulo).not.toContain('process.env')
    const envEjemplo = readFileSync(path.resolve(aqui, '../../../../.env.example'), 'utf8')
    expect(envEjemplo).not.toContain('lock_timeout')
    expect(envEjemplo).not.toContain('LIMITE_ESPERA')
  })
})

describe('puestaAlDiaEstricta · ciclo de vida (RQ-ZS-52.3)', () => {
  it('U-9 · si el SET falla, abrir rechaza y la conexión se destruye', async () => {
    const { fuente, registro } = crearFuente(() => conCodigo('syntax error', '42601'))
    await expect(abrirPuestaAlDiaEstricta(fuente)).rejects.toBeInstanceOf(ErrorPuestaAlDia)
    expect(registro).toEqual([{ tipo: 'query', texto: SET_ESPERADO }, { tipo: 'release', destruir: true }])
  })

  it('U-10 · un paso que lee de la base (reseedTicketNumber) rechaza «paso no capturable» y no envía nada más', async () => {
    const { fuente, registro } = crearFuente()
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    await expect(sesion.aplicar(reseedTicketNumber)).rejects.toThrow(/paso no capturable/)
    expect(registro).toEqual([{ tipo: 'query', texto: SET_ESPERADO }, { tipo: 'release', destruir: true }])
  })

  it('cerrar() es idempotente: un solo release', async () => {
    const { fuente, registro } = crearFuente()
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    sesion.cerrar()
    sesion.cerrar()
    expect(registro.filter((e) => e.tipo === 'release')).toHaveLength(1)
  })
})

describe('puestaAlDiaEstricta · lo tolerante sigue igual (RQ-ZS-56)', () => {
  it('U-11 · migrate(falso) con la 2.ª sentencia fallando registra «sentencia omitida», envía todas y resuelve; no recibe lock_timeout', async () => {
    const espia = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { fuente, textos } = crearFuente((_t, i) => (i === 1 ? new Error('fallo') : undefined))
    const conexion = await fuente.connect()
    const db: Queryable = { query: async (t: string) => (await conexion.query(t)) as Awaited<ReturnType<Queryable["query"]>> }
    await expect(migrate(db)).resolves.toBeUndefined()
    expect(espia).toHaveBeenCalledTimes(1)
    expect(String(espia.mock.calls[0][0])).toContain('migrate: sentencia omitida')
    expect(textos()).toEqual(schemaStatements())
    expect(textos().some((t) => t.includes('lock_timeout'))).toBe(false)
  })
})

describe('puestaAlDiaEstricta · recortarSentencia', () => {
  it('U-12 · quita los comentarios iniciales, colapsa espacios y corta a 160 con «…»', () => {
    expect(recortarSentencia('-- nota\n-- otra\nALTER   TABLE\n  public.x   ADD COLUMN y text')).toBe('ALTER TABLE public.x ADD COLUMN y text')
    expect(recortarSentencia('-- sólo comentario\r\nSELECT 1')).toBe('SELECT 1')
    const larga = 'A'.repeat(200)
    expect(recortarSentencia(larga)).toBe('A'.repeat(160) + '…')
    expect(recortarSentencia('B'.repeat(160))).toBe('B'.repeat(160))
  })
})
