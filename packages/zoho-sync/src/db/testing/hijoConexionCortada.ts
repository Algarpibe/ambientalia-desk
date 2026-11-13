import { createInterface } from 'node:readline'
import type { Pool, PoolClient } from 'pg'
import { createPool, createPoolFromUrl } from '../pool'
import type { AppConfig } from '../../config'

/**
 * Hijo de `conexionPerdida.integration.test.ts` (E-285, RQ-ZS-60). NO es una prueba: lo lanza el padre con `node` + el CLI de tsx.
 * Crea el pool con la función REAL de `pool.ts` y SIN oyente propio: lo único que escucha el evento `error` es el módulo
 * `conexionPerdida`. Protocolo: una línea JSON por paso en stdout; el padre corta la sesión con `pg_terminate_backend` y escribe
 * «cortado» por stdin. Sale con 3 si se cierra stdin sin «cortado» y con 4 por su temporizador de 40 s (no queda huérfano).
 */
type Modo = 'reposo-desk' | 'reposo-url' | 'en-curso' | 'prestado' | 'prestado-en-curso' | 'prestado-url'

const MODOS: readonly Modo[] = ['reposo-desk', 'reposo-url', 'en-curso', 'prestado', 'prestado-en-curso', 'prestado-url']
const LIMITE_VIDA_MS = 40_000
const ESPERA_BAJA_MS = 10_000

const emitir = (paso: Record<string, unknown>): void => { process.stdout.write(`${JSON.stringify(paso)}\n`) }
const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const detalleDe = (e: unknown): { codigo: string | null; mensaje: string } => ({
  codigo: typeof (e as { code?: unknown })?.code === 'string' ? (e as { code: string }).code : null,
  mensaje: e instanceof Error ? e.message : String(e),
})

function crearPool(modo: Modo, url: string): Pool {
  if (modo === 'reposo-url' || modo === 'prestado-url') return createPoolFromUrl(url)
  return createPool({ databaseUrl: url, dbSchema: modo === 'reposo-desk' ? 'desk' : 'public' } as AppConfig)
}

async function pidYNombre(q: Pick<Pool, 'query'>): Promise<{ pid: number; app: string }> {
  const r = await q.query('SELECT pg_backend_pid() AS pid, current_setting(\'application_name\') AS app')
  return { pid: Number(r.rows[0].pid), app: String(r.rows[0].app) }
}

async function principal(): Promise<void> {
  const modo = process.argv[2] as Modo
  const url = process.env.TEST_DATABASE_URL
  if (!MODOS.includes(modo) || !url) { emitir({ paso: 'error-uso' }); process.exit(2) }

  setTimeout(() => process.exit(4), LIMITE_VIDA_MS).unref()
  const pool = crearPool(modo, url)

  let recibido = false
  const cortado = new Promise<void>((resolve) => {
    const rl = createInterface({ input: process.stdin })
    rl.on('line', (l) => { if (l.trim() === 'cortado') { recibido = true; resolve() } })
    rl.on('close', () => { if (!recibido) process.exit(3) })
  })

  let primero: { pid: number; app: string }, tras: Promise<void> = Promise.resolve()
  if (modo === 'prestado' || modo === 'prestado-en-curso' || modo === 'prestado-url') {
    const cliente = await pool.connect()
    await cliente.query('BEGIN')
    primero = await pidYNombre(cliente); tras = comoEnTransaccion(modo, cliente, cortado)
  } else {
    primero = await pidYNombre(pool)
  }
  emitir({ paso: 'listo', pid: primero.pid, app: primero.app, total: pool.totalCount, reposo: pool.idleCount })

  if (modo === 'en-curso') {
    pool.query('SELECT pg_sleep(30)').then(
      () => emitir({ paso: 'consulta', rechazada: false }),
      (e: unknown) => emitir({ paso: 'consulta', rechazada: true, ...detalleDe(e) }),
    )
  }

  await cortado; await tras
  const fin = Date.now() + ESPERA_BAJA_MS
  while (pool.totalCount > 0 && Date.now() < fin) await dormir(50)
  emitir({ paso: 'baja', total: pool.totalCount })

  const despues = await pidYNombre(pool)
  emitir({ paso: 'despues', pid: despues.pid })
  await pool.end()
  process.exit(0)
}

principal().catch((e: unknown) => { emitir({ paso: 'fallo', ...detalleDe(e) }); process.exit(5) })

// E-290: imita `apps/desk/server/db/transaccion.ts:16-27` tras el corte: la siguiente consulta, el ROLLBACK y la liberación del cliente prestado.
async function comoEnTransaccion(modo: Modo, cliente: PoolClient, cortado: Promise<void>): Promise<void> {
  const terminado = new Promise<void>((resolve) => { cliente.once('end', () => resolve()) })
  const paso = (nombre: string) => ({
    ok: () => emitir({ paso: nombre, rechazada: false }),
    ko: (e: unknown) => emitir({ paso: nombre, rechazada: true, ...detalleDe(e) }),
  })
  if (modo === 'prestado-en-curso') void cliente.query('SELECT pg_sleep(30)').then(paso('consulta').ok, paso('consulta').ko)
  await cortado
  await Promise.race([terminado, dormir(ESPERA_BAJA_MS)])
  if (modo !== 'prestado-en-curso') await cliente.query('SELECT 1').then(paso('siguiente').ok, paso('siguiente').ko)
  await cliente.query('ROLLBACK').then(paso('rollback').ok, paso('rollback').ko)
  cliente.release()
}
