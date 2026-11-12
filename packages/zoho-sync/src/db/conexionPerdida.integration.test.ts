import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Pool } from 'pg'
import { spawn, type ChildProcess } from 'node:child_process'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { TEXTO_CONEXION_PERDIDA } from './conexionPerdida'

/**
 * `pool-conexion-cortada` (E-285, RQ-ZS-60) · evidencia contra PostgreSQL REAL de lo que pg-mem no puede probar: que, cuando el
 * servidor corta una conexión INACTIVA del pool, el proceso NO muere, deja UNA línea con el SQLSTATE y sigue sirviendo (I-1, I-2).
 * I-3 e I-4 son caracterización (D-7): fijan lo observado cuando el corte pilla una consulta en curso y un cliente prestado.
 *
 * El pool vive en un proceso HIJO (`testing/hijoConexionCortada.ts`, node + CLI de tsx): un `uncaughtException` dentro de vitest no
 * demuestra la salida del proceso. Aislamiento: base propia en el servidor de `TEST_DATABASE_URL`, borrada al terminar (molde de
 * `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:17-35`). Se salta sin la variable. Toda espera va acotada.
 */
const url = process.env.TEST_DATABASE_URL
const d = url ? describe : describe.skip

const raiz = resolve(__dirname, '../../../..')
const CLI_TSX = resolve(raiz, 'node_modules/tsx/dist/cli.mjs')
const HIJO = resolve(__dirname, 'testing/hijoConexionCortada.ts')
const PLAZO_PRUEBA_MS = 60_000
const PLAZO_ARRANQUE_MS = 30_000
const VENTANA_REPOSO_MS = 8_000 // dentro de los 10 s de `idleTimeoutMillis` por defecto de pg-pool, que pool.ts no cambia

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

type Paso = { paso: string } & Record<string, unknown>
interface Hijo {
  pasos: Paso[]
  stderr: () => string
  salida: Promise<number | null>
  esperarPaso: (nombre: string, plazoMs: number) => Promise<Paso>
  cortado: () => void
  proc: ChildProcess
}

/** Lanza el hijo con la base propia. stdout: una línea JSON por paso; stderr: entero, para leer la línea del registro. */
function lanzar(modo: string, urlPropia: string): Hijo {
  const env = { ...process.env, TEST_DATABASE_URL: urlPropia }
  delete env.NODE_OPTIONS
  const proc = spawn(process.execPath, [CLI_TSX, HIJO, modo], { cwd: raiz, stdio: 'pipe', env })
  const pasos: Paso[] = []
  let err = ''
  proc.stderr!.setEncoding('utf8')
  proc.stderr!.on('data', (c: string) => { err += c })
  proc.stdin!.on('error', () => { /* el hijo pudo morir antes de leer «cortado» */ })
  createInterface({ input: proc.stdout! }).on('line', (l) => {
    try { pasos.push(JSON.parse(l) as Paso) } catch { /* línea que no es de protocolo */ }
  })
  const salida = new Promise<number | null>((res) => { proc.on('close', (code) => res(code)) })
  return {
    pasos, proc, salida,
    stderr: () => err,
    esperarPaso: async (nombre, plazoMs) => {
      await hasta(() => pasos.some((p) => p.paso === nombre) || proc.exitCode !== null, plazoMs, `el hijo no dio el paso «${nombre}» a tiempo; stderr: ${err.slice(0, 400)}`)
      const p = pasos.find((x) => x.paso === nombre)
      if (!p) throw new Error(`el hijo salió (${proc.exitCode}) sin dar el paso «${nombre}»; stderr: ${err.slice(0, 400)}`)
      return p
    },
    cortado: () => { proc.stdin!.write('cortado\n') },
  }
}

d('conexión cortada por el servidor · PostgreSQL real (RQ-ZS-60)', () => {
  let admin: Pool
  let propia: string
  const base = `pcc_it_${process.pid}_${Date.now()}`
  const vivos: Hijo[] = []

  const lanzarHijo = (modo: string): Hijo => { const h = lanzar(modo, propia); vivos.push(h); return h }
  const sesion = async (pid: number) =>
    (await admin.query('SELECT state, application_name FROM pg_stat_activity WHERE pid = $1', [pid])).rows[0] as { state: string; application_name: string } | undefined
  const terminar = async (pid: number): Promise<boolean> =>
    (await admin.query('SELECT pg_terminate_backend($1) AS ok', [pid])).rows[0].ok as boolean
  const lineasDelRegistro = (h: Hijo) => h.stderr().split(/\r?\n/).filter((l) => l.includes(TEXTO_CONEXION_PERDIDA))

  /** Corte de un pool en REPOSO: «listo», anti falso verde (idle + true + ventana), corte, y el cierre del hijo. */
  async function cortarEnReposo(modo: 'reposo-desk' | 'reposo-url') {
    const h = lanzarHijo(modo)
    const listo = await h.esperarPaso('listo', PLAZO_ARRANQUE_MS)
    const t0 = Date.now()
    const pid = listo.pid as number
    const antes = await sesion(pid)
    expect(antes?.state).toBe('idle') // anti falso verde: la conexión está inactiva EN el pool, no en una consulta
    expect([listo.total, listo.reposo]).toEqual([1, 1])
    expect(await terminar(pid)).toBe(true) // sobre un pid ya cerrado por inactividad daría false
    await hasta(async () => (await sesion(pid)) === undefined, 10_000, `el backend ${pid} no desapareció tras el corte`)
    expect(Date.now() - t0).toBeLessThan(VENTANA_REPOSO_MS)
    h.cortado()
    const codigo = await conPlazo(h.salida, 30_000, `el hijo no salió; stderr: ${h.stderr().slice(0, 400)}`)
    return { h, codigo, pid, antes }
  }

  beforeAll(async () => {
    admin = new Pool({ connectionString: url, max: 2 })
    console.info(`pool-conexion-cortada · SHOW server_version = ${(await admin.query('SHOW server_version')).rows[0].server_version}`)
    await admin.query(`CREATE DATABASE ${base}`)
    const u = new URL(url!)
    u.pathname = `/${base}`
    propia = u.toString()
  }, PLAZO_PRUEBA_MS)

  afterEach(async () => {
    for (const h of vivos.splice(0)) {
      h.proc.stdin!.end() // el hijo sale con 3 si no recibió «cortado»
      await Promise.race([h.salida, dormir(5_000)])
      if (h.proc.exitCode === null) h.proc.kill()
    }
  })

  afterAll(async () => {
    try { await admin?.query(`DROP DATABASE IF EXISTS ${base} WITH (FORCE)`) } finally { await admin?.end() }
  }, PLAZO_PRUEBA_MS)

  it('I-1 · createPool (desk): el corte de una conexión inactiva deja UNA línea con el SQLSTATE y el proceso sigue y sirve (RQ-ZS-60.1)', async () => {
    const { h, codigo, pid } = await cortarEnReposo('reposo-desk')
    const despues = h.pasos.find((p) => p.paso === 'despues')
    expect(codigo).toBe(0)
    expect(lineasDelRegistro(h)).toEqual([`${TEXTO_CONEXION_PERDIDA} — terminating connection due to administrator command [57P01]`])
    expect(despues?.pid).not.toBe(pid)
    expect(typeof despues?.pid).toBe('number')
  }, PLAZO_PRUEBA_MS)

  it('I-2 · createPoolFromUrl: lo mismo (RQ-ZS-60.2)', async () => {
    const { h, codigo, pid } = await cortarEnReposo('reposo-url')
    const despues = h.pasos.find((p) => p.paso === 'despues')
    expect(codigo).toBe(0)
    expect(lineasDelRegistro(h)).toEqual([`${TEXTO_CONEXION_PERDIDA} — terminating connection due to administrator command [57P01]`])
    expect(despues?.pid).not.toBe(pid)
    expect(typeof despues?.pid).toBe('number')
  }, PLAZO_PRUEBA_MS)

  /** Corte de un pool con la conexión OCUPADA (consulta en curso o cliente prestado): espera el estado, corta y espera la salida. */
  async function cortarOcupado(modo: 'en-curso' | 'prestado', estado: string) {
    const h = lanzarHijo(modo)
    const listo = await h.esperarPaso('listo', PLAZO_ARRANQUE_MS)
    const pid = listo.pid as number
    await hasta(async () => (await sesion(pid))?.state === estado, 5_000, `el backend ${pid} no llegó al estado «${estado}»`)
    expect(await terminar(pid)).toBe(true)
    h.cortado()
    const codigo = await conPlazo(h.salida, 30_000, `el hijo no salió; stderr: ${h.stderr().slice(0, 400)}`)
    return { h, codigo, pid }
  }

  // D-7: caracterización. Medido el 2026-11-12 contra PostgreSQL 17.10: el corte pilla la consulta en curso, ésta RECHAZA con 57P01
  // y el proceso sigue y sirve; la línea del registro NO sale (el error llega a la consulta, no al evento `error` del pool).
  it('I-3 · CARACTERIZACIÓN · consulta en curso: la consulta rechaza con 57P01, el proceso sigue y NO sale la línea del registro', async () => {
    const { h, codigo, pid } = await cortarOcupado('en-curso', 'active')
    const consulta = h.pasos.find((p) => p.paso === 'consulta')
    const despues = h.pasos.find((p) => p.paso === 'despues')
    expect(consulta).toMatchObject({ rechazada: true, codigo: '57P01', mensaje: 'terminating connection due to administrator command' })
    expect(codigo).toBe(0)
    expect(lineasDelRegistro(h)).toHaveLength(0) // la línea de I-1 sí sale por el evento `error`; aquí no hay ninguna que contar
    expect(h.stderr()).not.toContain("Unhandled 'error' event")
    expect(typeof despues?.pid).toBe('number')
    expect(despues?.pid).not.toBe(pid)
  }, PLAZO_PRUEBA_MS)

  // D-7: LÍMITE medido. Un cliente prestado con la transacción abierta (el caso de `apps/desk/server/db/transaccion.ts:16-26`) NO está
  // cubierto: el cliente prestado no pertenece al oyente del pool y su evento `error` sin oyente tumba el proceso. Es el límite que
  // dice la §27 de DEPLOY.md; esta prueba lo fija para que, si una versión de pg lo cambia, se note.
  it('I-4 · LÍMITE · cliente prestado con transacción abierta: el proceso MUERE (salida 1, 57P01 sin controlar) y no sale la línea', async () => {
    const { h, codigo } = await cortarOcupado('prestado', 'idle in transaction')
    expect(codigo).toBe(1)
    expect(h.stderr()).toContain("Unhandled 'error' event")
    expect(h.stderr()).toContain("code: '57P01'")
    expect(lineasDelRegistro(h)).toHaveLength(0)
    expect(h.pasos.map((p) => p.paso)).toEqual(['listo']) // murió antes de dar «baja» y «despues»
  }, PLAZO_PRUEBA_MS)
})
