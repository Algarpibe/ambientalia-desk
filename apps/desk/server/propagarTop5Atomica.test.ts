import { describe, it, expect } from 'vitest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { fijarYPropagarPrioridadCliente } from './db/prioridadCliente'

/**
 * PROPAGAR EL TOP 5 · ATOMICIDAD Y RECUENTO DE LECTURAS (F1B-07, L2a-bis; `tickets-core` RQ-TC-35).
 * Caracterización: el código ya es transaccional desde L2a, así que estas pruebas NACEN VERDES. Que discriminan lo
 * demuestra la mutación M4 (sacar `fijarPrioridadCliente` de la transacción), registrada en `apply-progress.md`.
 * pg-mem no revierte (`db/transaccion.test.ts`, Plan B del molde de `prioridadTop5.test.ts`): se observa la secuencia de
 * sentencias de un pool falso, distinguiendo el pool de la conexión de la transacción.
 */
interface Rastro { calls: string[] }

/** Un pool falso. `fallaEnTraza` hace caer el `INSERT` de `prioridad_ajustes`. Cada sentencia se anota con su origen (`pool` o `tx`). */
function poolFalso(tickets: number, fallaEnTraza: boolean): { db: Queryable } & Rastro {
  const calls: string[] = []
  const ejecutar = (origen: string) => async (sql: string) => {
    const verbo = sql.trim().split(/\s+/)[0].toUpperCase()
    calls.push(`${origen}:${verbo}`)
    if (verbo === 'INSERT' && sql.includes('prioridad_ajustes') && fallaEnTraza) throw new Error('boom (rastreador)')
    if (verbo === 'INSERT' && sql.includes('cliente_prioridad')) {
      return { rows: [{ client_id: 'cli-1', top5: true, prioridad: 'High', actualizado_por: 'Ana', actualizado_at: new Date('2026-10-04T10:00:00Z') }] }
    }
    if (verbo === 'SELECT' && sql.includes('FROM tickets WHERE client_id')) {
      return { rows: Array.from({ length: tickets }, (_, i) => ({ id: `t${i + 1}`, priority: 'Low' })) }
    }
    return { rows: [] }
  }
  const db = { query: ejecutar('pool'), connect: async () => ({ query: ejecutar('tx'), release: () => {} }) } as unknown as Queryable
  return { db, calls }
}

const A = { clientId: 'cli-1', top5: true, prioridad: 'High' as const, por: 'Ana' }
const lecturas = (calls: string[]) => calls.filter((c) => c.endsWith(':SELECT')).length

describe('fijarYPropagarPrioridadCliente · atómica (RQ-TC-35)', () => {
  it('si falla el INSERT de la traza: BEGIN, INSERT, SELECT, SELECT, SELECT, UPDATE, INSERT, ROLLBACK, todo por la transacción y sin COMMIT', async () => {
    const { db, calls } = poolFalso(1, true)
    await expect(fijarYPropagarPrioridadCliente(db, A)).rejects.toThrow('boom (rastreador)')
    expect(calls).toEqual(['tx:BEGIN', 'tx:INSERT', 'tx:SELECT', 'tx:SELECT', 'tx:SELECT', 'tx:UPDATE', 'tx:INSERT', 'tx:ROLLBACK'])
  })

  it('tras el fallo no queda escritura fuera de la transacción: ni la fila del cliente, ni ningún ticket, ni ninguna traza llegan a un COMMIT', async () => {
    const { db, calls } = poolFalso(3, true)
    await expect(fijarYPropagarPrioridadCliente(db, A)).rejects.toThrow()
    expect(calls.filter((c) => c.startsWith('pool:'))).toEqual([])
    expect(calls).not.toContain('tx:COMMIT')
    expect(calls[calls.length - 1]).toBe('tx:ROLLBACK')
  })

  it('sin fallo la secuencia cierra con COMMIT', async () => {
    const { db, calls } = poolFalso(1, false)
    await fijarYPropagarPrioridadCliente(db, A)
    expect(calls[0]).toBe('tx:BEGIN')
    expect(calls[calls.length - 1]).toBe('tx:COMMIT')
  })
})

describe('fijarYPropagarPrioridadCliente · lecturas fijas, sin N+1 (D10)', () => {
  it('con 1 ticket y con 5 las lecturas son las mismas; sólo crecen las escrituras', async () => {
    const uno = poolFalso(1, false); const cinco = poolFalso(5, false)
    expect((await fijarYPropagarPrioridadCliente(uno.db, A)).ticketsCambiados).toBe(1)
    expect((await fijarYPropagarPrioridadCliente(cinco.db, A)).ticketsCambiados).toBe(5)
    expect(lecturas(uno.calls)).toBe(3)
    expect(lecturas(cinco.calls)).toBe(lecturas(uno.calls))
    expect(cinco.calls.filter((c) => c === 'tx:UPDATE')).toHaveLength(5)
    expect(cinco.calls.filter((c) => c === 'tx:INSERT')).toHaveLength(6) // la fila del cliente y una traza por ticket
  })
})
