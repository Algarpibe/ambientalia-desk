import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { enTransaccion } from './transaccion'

/** Lo que hace falta de un pool para abrir una transacción, igual que en `eliminarTicket.ts:166`. */
interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }

/**
 * T0 — sonda de atomicidad (design.md §2, `alta-equipo-nuevo-en-ticket`, Fase 0, bloqueante).
 *
 * Hipótesis comprobada: pg-mem revierte un `ROLLBACK` de verdad. `auth/users.ts:147` la daba por
 * imposible de probar («sin transacción que pg-mem pueda probar»), y ninguna prueba del repositorio
 * la ejercitaba hasta hoy.
 *
 * **RESULTADO: ROJO.** Ejecutada el 2026-09-24: tras `BEGIN` + `INSERT` + `ROLLBACK` sobre
 * `pool.connect()`, la fila SIGUE viva fuera de esa conexión (`COUNT(*) = 1`, no 0) — pg-mem no
 * revierte de verdad. **Plan elegido: Plan B** — rastreador de verbos (molde de
 * `salesRecords.test.ts:5-16`), usado más abajo y en las Fases 1 y 6, en vez de comprobar filas
 * reales tras un `ROLLBACK`. La aserción de abajo fija ese resultado como regresión: si una versión
 * futura de pg-mem empezara a revertir de verdad, este test se pondría en rojo y avisaría de que el
 * Plan B ya no hace falta.
 */
describe('T0 · sonda — ¿revierte pg-mem un ROLLBACK de verdad?', () => {
  it('BEGIN, INSERT y ROLLBACK sobre pool.connect() NO revierten en pg-mem (Plan B)', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool() as unknown as Queryable
    await migrate(db)
    const pool = db as unknown as ConPool
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN', [])
      await cliente.query(
        "INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-t0','SN-T0','Grimm','EDM180C','Monitor')",
        [],
      )
      await cliente.query('ROLLBACK', [])
    } finally {
      cliente.release()
    }
    const r = await db.query('SELECT COUNT(*)::int AS n FROM equipos', [])
    expect((r.rows[0] as { n: number }).n).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// Rastreador de verbos (Plan B) — 0.3
// ══════════════════════════════════════════════════════════════════════════════════════════════════

interface LlamadaTracker { verb: string; params?: unknown[] }

/**
 * Rastreador de verbos, Plan B de T0. Mismo molde que `salesRecords.test.ts:5-16`, adaptado a
 * `pool.connect()`: `enTransaccion` (Fase 1) y `crearTicketConEquipo` (Fase 6) abren la transacción
 * por esa vía, no por `db.query` directo. Registra el verbo SQL de cada llamada —de `connect()` y de
 * `db.query` directo, por si el código bajo prueba mezcla las dos— y, opcionalmente, lanza la primera
 * vez que aparece `failOn`. También cuenta cuántas veces se liberó el cliente.
 */
export function rastreadorDeVerbos(failOn?: string): { db: Queryable & ConPool; calls: LlamadaTracker[]; releases: () => number } {
  const calls: LlamadaTracker[] = []
  let released = 0
  const ejecutar = async (sql: string, params?: unknown[]) => {
    const verb = sql.trim().split(/\s+/)[0].toUpperCase()
    calls.push({ verb, params })
    if (failOn && verb === failOn) throw new Error('boom (rastreador)')
    return { rows: [] }
  }
  const db: Queryable & ConPool = {
    query: ejecutar,
    connect: async () => ({ query: ejecutar, release: () => { released += 1 } }),
  }
  return { db, calls, releases: () => released }
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// Fase 1 · enTransaccion<T> — RED → GREEN
// ══════════════════════════════════════════════════════════════════════════════════════════════════

describe('enTransaccion', () => {
  it('hace BEGIN, corre fn y COMMIT, y devuelve lo que fn devuelve', async () => {
    const { db, calls, releases } = rastreadorDeVerbos()
    const resultado = await enTransaccion(db, async (q) => {
      await q.query('INSERT INTO equipos (id) VALUES ($1)', ['eq-1'])
      return 'eq-1'
    })
    expect(resultado).toBe('eq-1')
    expect(calls.map((c) => c.verb)).toEqual(['BEGIN', 'INSERT', 'COMMIT'])
    expect(releases()).toBe(1)
  })

  it('si fn lanza, hace ROLLBACK, re-lanza el mismo error, y libera el cliente igual', async () => {
    const { db, calls, releases } = rastreadorDeVerbos('INSERT')
    await expect(enTransaccion(db, async (q) => {
      await q.query('INSERT INTO equipos (id) VALUES ($1)', ['eq-1'])
      return 'no llega'
    })).rejects.toThrow('boom (rastreador)')
    expect(calls.map((c) => c.verb)).toEqual(['BEGIN', 'INSERT', 'ROLLBACK'])
    expect(releases()).toBe(1)
  })
})
