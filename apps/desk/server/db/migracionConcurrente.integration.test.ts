import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Pool } from 'pg'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { reorgToDesk, migrate } from '@ambientalia/zoho-sync/db/migrate'
import { ID_TRANSICION_MIGRACION } from '@ambientalia/shared'
import { migrarTicketsAbiertos, MigracionAdelantadaError, type InformeMigracion } from './migracionTicketsAbiertos'

/**
 * migracion-una-sola-ejecucion (F1F-01), `zoho-sync` RQ-ZS-23 · dos ejecuciones simultáneas de la migración de tickets
 * abiertos contra PostgreSQL REAL: a lo sumo una confirma y la otra se rechaza sin dejar nada.
 *
 * Por qué existe: pg-mem no revierte de verdad (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:13-15`), así que que la
 * perdedora no deja ningún marcador sólo se prueba con dos conexiones reales. El solape se FUERZA envolviendo la conexión
 * desde la prueba (sin tocar el ejecutor): A se detiene tras su primer `UPDATE tickets`, con el bloqueo de fila tomado, y B
 * arranca entonces. La carrera libre se prueba aparte, con una aserción tolerante, porque no puede exigir el rechazo.
 *
 * Aislamiento: crea SU base en el servidor de `TEST_DATABASE_URL` y la borra al terminar (molde de
 * `packages/zoho-sync/src/db/liberacion.integration.test.ts:22-71`). Se salta sin la variable.
 */
const url = process.env.TEST_DATABASE_URL
const d = url ? describe : describe.skip

const CORTE = new Date('2026-12-01T05:00:00Z')
const ANTES = '2026-10-01T10:00:00Z'
const TEXTO_RECHAZO = 'pasó a estar gobernado'

type Ganchos = { antes?: (sql: string) => Promise<void> | void; despues?: (sql: string) => Promise<void> | void }
type Consulta = (s: string, p?: unknown[]) => Promise<{ rows: unknown[] }>

/** Envuelve un `Pool` real con ganchos en las DOS vías (`query` y `connect`): bajo una mutación que quite la transacción, el ejecutor ya no llama a `connect` y la prueba debe fallar con texto, no colgarse. */
function envolver(pool: Pool, g: Ganchos): Queryable {
  const con = (q: Consulta): Consulta => async (s, p) => { await g.antes?.(s); const r = await q(s, p); await g.despues?.(s); return r }
  return {
    query: con((s, p) => pool.query(s, p)),
    connect: async () => { const c = await pool.connect(); return { query: con((s, p) => c.query(s, p)), release: () => c.release() } },
  } as unknown as Queryable
}

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

/** Una compuerta: `abrir()` suelta a quien espera en `pasar`. */
function compuerta() {
  let abrir!: () => void
  const pasar = new Promise<void>((r) => { abrir = r })
  return { pasar, abrir }
}

type Resultado<T> = { ok: true; valor: T } | { ok: false; error: Error }

/** Tras un fallo a mitad de caso, deja terminar a las ejecuciones lanzadas: ninguna sigue escribiendo en segundo plano sobre el caso siguiente. */
const quietas = (...ps: Array<Promise<unknown> | undefined>) =>
  conPlazo(Promise.allSettled(ps.filter(Boolean)), 20_000, 'una ejecución no terminó tras soltar a A').catch(() => undefined)

/** Convierte la promesa en resultado nada más lanzarla, para que su rechazo nunca quede sin manejar. */
const resultado = <T>(p: Promise<T>): Promise<Resultado<T>> =>
  p.then((valor) => ({ ok: true as const, valor }), (e: unknown) => ({ ok: false as const, error: e as Error }))

const esUpdateDeTicket = (sql: string) => /^UPDATE tickets SET status/i.test(sql.trim())
const limpio = (sql: string) => sql.replace(/\s+/g, ' ').trim()
const esEscritura = (sql: string) => /^(INSERT|UPDATE|DELETE)/i.test(sql)

d('migración de tickets abiertos · dos ejecuciones simultáneas en PostgreSQL real (RQ-ZS-23)', () => {
  let admin: Pool
  let pool: Pool
  const base = `migracion_it_${process.pid}_${Date.now()}`
  const bd = () => pool as unknown as Queryable

  beforeAll(async () => {
    admin = new Pool({ connectionString: url })
    await admin.query(`CREATE DATABASE ${base}`)
    const propia = new URL(url!)
    propia.pathname = `/${base}`
    pool = new Pool({ connectionString: propia.toString(), options: '-c search_path=desk,public' })
    await pool.query('CREATE SCHEMA IF NOT EXISTS books') // schema.sql referencia books.* (calificado)
    await reorgToDesk(pool)
    await migrate(pool)
  }, 120_000)

  afterAll(async () => {
    await pool?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${base} WITH (FORCE)`)
    await admin?.end()
  }, 60_000)

  // Cada caso parte de una base sin tickets: la migración elige TODOS los migrables, así que un resto de otro caso la contaminaría.
  const vaciar = async () => {
    await pool.query('DELETE FROM ticket_transitions')
    await pool.query('DELETE FROM tickets')
  }
  beforeEach(vaciar)

  async function insertar(ids: string[], primerNumero: number): Promise<void> {
    for (const [i, id] of ids.entries()) {
      await pool.query(
        `INSERT INTO tickets (id, number, subject, status, status_type, managed_by_app, created_time, modified_time, updated_at)
         VALUES ($1,$2,'Asunto','Entregado','Open',false,$3,'2026-09-01T00:00:00Z','2026-01-01T00:00:00Z')`,
        [id, primerNumero + i, ANTES],
      )
    }
  }
  async function marcadores(ids: string[]) {
    const r = await pool.query(
      'SELECT ticket_id, values FROM ticket_transitions WHERE transition_id = $1 AND ticket_id = ANY($2) ORDER BY ticket_id',
      [ID_TRANSICION_MIGRACION, ids],
    )
    return r.rows as Array<{ ticket_id: string; values: { ejecutado_por: string } }>
  }
  async function gobernados(ids: string[]): Promise<boolean[]> {
    const r = await pool.query('SELECT managed_by_app FROM tickets WHERE id = ANY($1) ORDER BY id', [ids])
    return r.rows.map((f: { managed_by_app: boolean }) => f.managed_by_app)
  }
  const esperandoBloqueo = async () =>
    Number((await pool.query("SELECT count(*) AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'")).rows[0].n)

  it('solape forzado: A confirma, B espera el bloqueo de fila y se rechaza sin dejar ningún marcador', async () => {
    const ids = ['s1', 's2', 's3']
    await insertar(ids, 4100)
    const tomadoA = compuerta()
    const soltarA = compuerta()
    const llegaB = compuerta()
    let primeroA = true
    let primeroB = true
    const a = envolver(pool, {
      despues: async (sql) => { if (primeroA && esUpdateDeTicket(sql)) { primeroA = false; tomadoA.abrir(); await soltarA.pasar } },
    })
    const b = envolver(pool, {
      antes: (sql) => { if (primeroB && esUpdateDeTicket(sql)) { primeroB = false; llegaB.abrir() } },
    })
    let ejecA: Promise<Resultado<InformeMigracion>> | undefined
    let ejecB: Promise<Resultado<InformeMigracion>> | undefined
    try {
      ejecA = resultado(migrarTicketsAbiertos(a, { corte: CORTE, aplicar: true, actor: 'Actor A' }))
      await conPlazo(tomadoA.pasar, 10_000, 'A no llegó a su primer UPDATE de tickets')
      ejecB = resultado(migrarTicketsAbiertos(b, { corte: CORTE, aplicar: true, actor: 'Actor B' }))
      await conPlazo(llegaB.pasar, 10_000, 'B no llegó a su primer UPDATE de tickets')
      await hasta(async () => (await esperandoBloqueo()) >= 1, 10_000, 'ninguna sesión quedó esperando un bloqueo')
    } finally {
      soltarA.abrir()
      await quietas(ejecA, ejecB)
    }
    const ra = await conPlazo(ejecA!, 20_000, 'A no terminó tras soltarla')
    const rb = await conPlazo(ejecB!, 20_000, 'B no terminó tras soltar a A')

    expect(ra.ok).toBe(true)
    if (ra.ok) expect(ra.valor).toMatchObject({ aplicado: true, migrables: 3 })
    expect(rb.ok).toBe(false)
    if (!rb.ok) { expect(rb.error).toBeInstanceOf(MigracionAdelantadaError); expect(rb.error.message).toContain(TEXTO_RECHAZO) }

    const ms = await marcadores(ids)
    expect(ms.map((m) => m.ticket_id)).toEqual(ids) // exactamente uno por ticket
    expect(ms.every((m) => m.values.ejecutado_por === 'Actor A')).toBe(true)
    expect(ms.some((m) => m.values.ejecutado_por === 'Actor B')).toBe(false)
    expect(await gobernados(ids)).toEqual([true, true, true])
  }, 60_000)

  it('carrera libre, 10 rondas: nunca dos confirmaciones que escriban, y un marcador por ticket', async () => {
    for (let ronda = 0; ronda < 10; ronda++) {
      const ids = [0, 1, 2, 3].map((i) => `c${ronda}_${i}`)
      await vaciar()
      await insertar(ids, 5000 + ronda * 10)
      const [ra, rb] = await conPlazo(
        Promise.allSettled([
          migrarTicketsAbiertos(bd(), { corte: CORTE, aplicar: true, actor: `Ronda ${ronda} A` }),
          migrarTicketsAbiertos(bd(), { corte: CORTE, aplicar: true, actor: `Ronda ${ronda} B` }),
        ]),
        60_000, `la ronda ${ronda} no terminó`,
      )
      const rechazadas = [ra, rb].filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      const cumplidas = [ra, rb].filter((r): r is PromiseFulfilledResult<InformeMigracion> => r.status === 'fulfilled')
      // Un rechazo sólo vale con el texto de `MigracionAdelantadaError`; cualquier otro error es rojo.
      for (const r of rechazadas) expect(String((r.reason as Error).message)).toContain(TEXTO_RECHAZO)
      // O una cumple y la otra se rechaza, o las dos cumplen y la segunda llegó cuando ya no había nada que migrar.
      expect(cumplidas.map((r) => r.value.migrables).sort()).toEqual(rechazadas.length === 1 ? [4] : [0, 4])
      const ms = await marcadores(ids)
      expect(ms.map((m) => m.ticket_id)).toEqual(ids)
      expect(new Set(ms.map((m) => m.values.ejecutado_por)).size).toBe(1)
      expect(await gobernados(ids)).toEqual([true, true, true, true])
    }
  }, 120_000)

  it('ejecución posterior: no se rechaza, no encuentra nada que migrar y no escribe', async () => {
    const ids = ['p1', 'p2']
    await insertar(ids, 6100)
    const primera = await migrarTicketsAbiertos(bd(), { corte: CORTE, aplicar: true, actor: 'Actor 1' })
    expect(primera).toMatchObject({ aplicado: true, migrables: 2 })
    const sqls: string[] = []
    const espia = envolver(pool, { antes: (s) => { sqls.push(limpio(s)) } })
    const segunda = await migrarTicketsAbiertos(espia, { corte: CORTE, aplicar: true, actor: 'Actor 2' })
    // El informe sale con `aplicado: true` aunque no escriba (`migracionTicketsAbiertos.ts:92`): es el comportamiento de hoy.
    expect(segunda).toMatchObject({ aplicado: true, migrables: 0 })
    expect(sqls.filter(esEscritura)).toEqual([])
    const ms = await marcadores(ids)
    expect(ms.map((m) => m.ticket_id)).toEqual(ids)
    expect(ms.some((m) => m.values.ejecutado_por === 'Actor 2')).toBe(false)
  }, 30_000)

  it('pasada en seco con una ejecución en curso: no abre transacción, no escribe y no altera a la ejecución', async () => {
    const ids = ['d1', 'd2', 'd3']
    await insertar(ids, 7100)
    const tomadoA = compuerta()
    const soltarA = compuerta()
    let primeroA = true
    const a = envolver(pool, {
      despues: async (sql) => { if (primeroA && esUpdateDeTicket(sql)) { primeroA = false; tomadoA.abrir(); await soltarA.pasar } },
    })
    const vistas: string[] = []
    const seca = envolver(pool, { antes: (s) => { vistas.push(limpio(s)) } })
    let ejecA: Promise<Resultado<InformeMigracion>> | undefined
    let informeSeco: InformeMigracion | undefined
    try {
      ejecA = resultado(migrarTicketsAbiertos(a, { corte: CORTE, aplicar: true, actor: 'Actor A' }))
      await conPlazo(tomadoA.pasar, 10_000, 'A no llegó a su primer UPDATE de tickets')
      informeSeco = await conPlazo(migrarTicketsAbiertos(seca, { corte: CORTE, actor: 'Actor seco' }), 10_000, 'la pasada en seco quedó esperando')
    } finally {
      soltarA.abrir()
      await quietas(ejecA)
    }
    expect(vistas.length).toBeGreaterThan(0)
    expect(vistas.map((s) => s.split(' ')[0].toUpperCase())).not.toContain('BEGIN')
    expect(vistas.filter(esEscritura)).toEqual([])
    expect(informeSeco).toMatchObject({ aplicar: false, aplicado: false, migrables: 3 })
    const ra = await conPlazo(ejecA!, 20_000, 'A no terminó tras soltarla')
    expect(ra.ok).toBe(true)
    if (ra.ok) expect(ra.valor).toMatchObject({ aplicado: true, migrables: 3 })
    expect((await marcadores(ids)).map((m) => m.ticket_id)).toEqual(ids)
    expect(await gobernados(ids)).toEqual([true, true, true])
  }, 60_000)
})
