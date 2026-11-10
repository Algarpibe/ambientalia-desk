import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool, Client } from 'pg'
import { reorgToDesk, migrate } from './migrate'
import {
  abrirPuestaAlDiaEstricta, ErrorLimiteEspera, LIMITE_ESPERA_BLOQUEO_MS,
  type FuenteDeConexiones, type ConexionDedicada,
} from './puestaAlDiaEstricta'

/**
 * `arranque-migracion-estricta` (RQ-ZS-52, RQ-ZS-53) · evidencia contra PostgreSQL REAL de lo que pg-mem no puede probar:
 * que el límite de espera de bloqueo se agota con el SQLSTATE esperado (I-2), que un `SET` por `pool.query` no garantiza la
 * conexión (I-3) y que la conexión con el límite no vuelve al pool (I-4).
 *
 * Aislamiento: crea SU base en el servidor de `TEST_DATABASE_URL` y la borra al terminar (molde de
 * `apps/desk/server/db/migracionConcurrente.integration.test.ts:17-21`). Se salta sin la variable. Toda espera va acotada.
 */
const url = process.env.TEST_DATABASE_URL
const d = url ? describe : describe.skip

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Espera ACOTADA: sondea cada 50 ms y, si se agota el plazo, falla con el texto propio. */
async function hasta(cond: () => Promise<boolean> | boolean, plazoMs: number, texto: string): Promise<void> {
  const fin = Date.now() + plazoMs
  while (!(await cond())) {
    if (Date.now() > fin) throw new Error(texto)
    await dormir(50)
  }
}

/** Una promesa con plazo: si no se resuelve a tiempo, falla con texto propio en vez de colgar la prueba. */
function conPlazo<T>(p: Promise<T>, ms: number, texto: string): Promise<T> {
  let t: NodeJS.Timeout | undefined
  return Promise.race([p, new Promise<never>((_, rej) => { t = setTimeout(() => rej(new Error(texto)), ms) })]).finally(() => clearTimeout(t))
}

d('puesta al día estricta · PostgreSQL real (RQ-ZS-52, RQ-ZS-53)', () => {
  let admin: Pool
  let propia: string
  const base = `ame_it_${process.pid}_${Date.now()}`
  const opciones = '-c search_path=desk,public'
  const nuevoPool = (max: number) => new Pool({ connectionString: propia, options: opciones, max })

  async function sinSesiones(): Promise<void> {
    await hasta(
      async () => Number((await admin.query('SELECT count(*) AS n FROM pg_stat_activity WHERE datname = $1', [base])).rows[0].n) === 0,
      10_000, `quedaron sesiones abiertas en ${base} tras cerrar los pools`,
    )
  }

  /** La puesta al día completa (reorganización + migración) por una fuente de conexiones. */
  async function ponerAlDia(fuente: FuenteDeConexiones): Promise<void> {
    const sesion = await abrirPuestaAlDiaEstricta(fuente)
    try {
      await sesion.aplicar(reorgToDesk)
      await sesion.aplicar(migrate)
    } finally {
      sesion.cerrar()
    }
  }

  beforeAll(async () => {
    admin = new Pool({ connectionString: url, max: 2 })
    await admin.query(`CREATE DATABASE ${base}`)
    const u = new URL(url!)
    u.pathname = `/${base}`
    propia = u.toString()
    const preparacion = nuevoPool(1)
    try {
      await preparacion.query('CREATE SCHEMA IF NOT EXISTS books') // schema.sql referencia books.* (calificado)
    } finally {
      await preparacion.end()
    }
  }, 60_000)

  afterAll(async () => {
    if (admin) await sinSesiones().catch(() => undefined).finally(() => admin.query(`DROP DATABASE IF EXISTS ${base} WITH (FORCE)`))
    await admin?.end()
  }, 60_000)

  it('I-1 · base vacía: la puesta al día estricta se aplica dos veces seguidas (idempotente)', async () => {
    const pool = nuevoPool(2)
    try {
      await conPlazo(ponerAlDia(pool), 60_000, 'la primera puesta al día no terminó')
      await conPlazo(ponerAlDia(pool), 60_000, 'la segunda puesta al día no terminó')
      const r = await pool.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'desk' AND table_name = 'tickets'")
      expect(r.rows[0].n).toBe(1)
    } finally {
      await pool.end()
    }
  }, 150_000)

  it('I-2 · una sesión con la tabla bloqueada agota el límite: SQLSTATE 55P03 y la sentencia exacta', async () => {
    const pool = nuevoPool(2)
    const bloqueadora = new Client({ connectionString: propia, options: opciones })
    let abierta = false
    try {
      await conPlazo(ponerAlDia(pool), 60_000, 'la puesta al día previa no terminó')
      await bloqueadora.connect()
      await bloqueadora.query('BEGIN')
      abierta = true
      await bloqueadora.query('LOCK TABLE public.catalogo_modelos IN ACCESS EXCLUSIVE MODE')
      const t0 = Date.now()
      const error = await conPlazo(ponerAlDia(pool).then(() => undefined, (e: unknown) => e), 25_000, 'la puesta al día no se cortó en 25 s')
      const ms = Date.now() - t0
      expect(error).toBeInstanceOf(ErrorLimiteEspera)
      const e = error as ErrorLimiteEspera
      expect(e.codigo).toBe('55P03')
      expect(e.limiteMs).toBe(LIMITE_ESPERA_BLOQUEO_MS)
      expect(e.message).toContain('límite de espera')
      expect(e.message).toContain('catalogo_modelos')
      expect(e.message).toContain('10000')
      expect(ms).toBeGreaterThanOrEqual(10_000)
      expect(ms).toBeLessThan(25_000)
      console.info(`I-2 · tras ${ms} ms · código ${e.codigo} · sentencia «${e.sentencia}»`)
    } finally {
      if (abierta) await bloqueadora.query('ROLLBACK').catch(() => undefined)
      await bloqueadora.end().catch(() => undefined)
      await pool.end()
    }
  }, 90_000)

  it('I-3 · hipótesis del brief: un SET por pool.query vive en UNA conexión y contamina al pool', async () => {
    const pool = nuevoPool(2)
    try {
      await pool.query("SET lock_timeout = '1234ms'")
      const [a, b] = await conPlazo(Promise.all([pool.connect(), pool.connect()]), 10_000, 'no hubo dos conexiones')
      try {
        const [ra, rb] = await Promise.all([a.query('SHOW lock_timeout'), b.query('SHOW lock_timeout')])
        const vistos = [ra.rows[0].lock_timeout, rb.rows[0].lock_timeout].sort()
        expect(vistos).toEqual(['0', '1234ms'])
      } finally {
        a.release(true)
        b.release(true)
      }
    } finally {
      await pool.end()
    }
  }, 30_000)

  it('I-4 · la conexión con el límite se destruye: el pool no la reutiliza (bien y tras un corte)', async () => {
    const pool = nuevoPool(1)
    const pids: number[] = []
    const fuente: FuenteDeConexiones = {
      connect: async (): Promise<ConexionDedicada> => {
        const c = await pool.connect()
        pids.push(Number((await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid))
        return c
      },
    }
    const bloqueadora = new Client({ connectionString: propia, options: opciones })
    let abierta = false
    try {
      // 1) terminar bien
      await conPlazo(ponerAlDia(fuente), 60_000, 'la puesta al día no terminó')
      const tras1 = await pool.query("SELECT pg_backend_pid() AS pid, current_setting('lock_timeout') AS lt")
      expect(String(tras1.rows[0].lt)).toBe('0')
      expect(Number(tras1.rows[0].pid)).not.toBe(pids[0])
      // 2) terminar con un corte por el límite
      await bloqueadora.connect()
      await bloqueadora.query('BEGIN')
      abierta = true
      await bloqueadora.query('LOCK TABLE public.catalogo_modelos IN ACCESS EXCLUSIVE MODE')
      const error = await conPlazo(ponerAlDia(fuente).then(() => undefined, (e: unknown) => e), 25_000, 'la puesta al día no se cortó en 25 s')
      expect(error).toBeInstanceOf(ErrorLimiteEspera)
      const tras2 = await pool.query("SELECT pg_backend_pid() AS pid, current_setting('lock_timeout') AS lt")
      expect(String(tras2.rows[0].lt)).toBe('0')
      expect(Number(tras2.rows[0].pid)).not.toBe(pids[1])
      // los pids anotados desaparecen de pg_stat_activity (espera acotada)
      await hasta(
        async () => Number((await admin.query('SELECT count(*) AS n FROM pg_stat_activity WHERE pid = ANY($1)', [pids])).rows[0].n) === 0,
        10_000, 'una conexión de la puesta al día sigue viva en pg_stat_activity',
      )
    } finally {
      if (abierta) await bloqueadora.query('ROLLBACK').catch(() => undefined)
      await bloqueadora.end().catch(() => undefined)
      await pool.end()
    }
  }, 120_000)
})
