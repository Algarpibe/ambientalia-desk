import { describe, it, expect } from 'vitest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { CreateTicketInput } from '@ambientalia/zoho-sync/db/repo'
import { crearTicketConEquipo, type EquipoAResolver } from './equipoNuevo'

/** Lo que hace falta de un pool para abrir una transacción, igual que en `eliminarTicket.ts:166`. */
interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }

/**
 * Rastreador de verbos, Plan B de T0 (`db/transaccion.test.ts`, T0 rojo: pg-mem no revierte un
 * `ROLLBACK` de verdad). Registra el verbo de cada llamada —de `connect()` y de `db.query`
 * directo— y, opcionalmente, lanza en la N-ésima vez que aparece `failOnNthOf`.
 */
function rastreador(failOnNthOf?: { verb: string; n: number }): { db: Queryable & ConPool; calls: string[]; releases: () => number } {
  const calls: string[] = []
  let released = 0
  let contador = 0
  const ejecutar = async (sql: string) => {
    const verb = sql.trim().split(/\s+/)[0].toUpperCase()
    calls.push(verb)
    if (failOnNthOf && verb === failOnNthOf.verb) {
      contador += 1
      if (contador === failOnNthOf.n) throw new Error(`boom (${verb} #${failOnNthOf.n})`)
    }
    // `nextTicketNumber` (`repo.ts:202-205`) lee `rows[0].n`: el rastreador no tiene BD real detrás,
    // así que le da un valor fijo para que `createTicket` pueda seguir su curso normal.
    if (sql.includes('nextval')) return { rows: [{ n: 1 }] }
    return { rows: [] }
  }
  const db: Queryable & ConPool = { query: ejecutar, connect: async () => ({ query: ejecutar, release: () => { released += 1 } }) }
  return { db, calls, releases: () => released }
}

const INPUT: CreateTicketInput = {
  subject: 'x', codigoServicio: null, classification: null, tipoServicio: null, equipo: null,
  marca: null, modelo: null, serial: 'SN-X', ordenVenta: null, priority: null,
  clientId: 'cli-1', salesorderId: null, equipoId: null, actor: 'Admin',
}

const NUEVO_PROVISIONAL: EquipoAResolver = {
  equipo: { id: '', serial: 'SN-X', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor' },
  datos: { serial: 'SN-X', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', modeloId: 'mo-1' },
}

/**
 * `crearTicketConEquipo` — atomicidad de RQ-TC-16 (Fase 6, Plan B de T0). Confirmado por T0
 * (`db/transaccion.test.ts`): pg-mem no revierte un `ROLLBACK` de verdad, así que la prueba mira la
 * SECUENCIA DE VERBOS —no filas reales tras el rollback— para confirmar que no queda a medias.
 */
describe('crearTicketConEquipo', () => {
  it('equipo registrado o reutilizado (id no vacío): createTicket idéntico a hoy, sin tocar `datos`', async () => {
    const { db, calls } = rastreador()
    const nuevo: EquipoAResolver = { equipo: { id: 'eq-existente', serial: 'SN-X' }, datos: null }
    const id = await crearTicketConEquipo(db, nuevo, 'Cliente', INPUT)
    expect(id).toMatch(/^app-/)
    // No hay ningún INSERT sobre `equipos`: sólo los dos de `createTicket` (ticket + transición).
    expect(calls.filter((v) => v === 'INSERT').length).toBe(2)
  })

  it('sin `nuevo` (equipoId directo): idéntico a hoy', async () => {
    const { db, calls } = rastreador()
    const id = await crearTicketConEquipo(db, null, 'Cliente', INPUT)
    expect(id).toMatch(/^app-/)
    expect(calls.filter((v) => v === 'INSERT').length).toBe(2)
  })

  it('equipo provisional, todo bien: crea el equipo Y el ticket en la misma transacción, y libera el cliente', async () => {
    const { db, calls, releases } = rastreador()
    const id = await crearTicketConEquipo(db, NUEVO_PROVISIONAL, 'Cliente', INPUT)
    expect(id).toMatch(/^app-/)
    // Los 3 INSERT (equipo, ticket, transición) quedan DENTRO de un único BEGIN…COMMIT.
    expect(calls[0]).toBe('BEGIN')
    expect(calls.at(-1)).toBe('COMMIT')
    expect(calls.filter((v) => v === 'INSERT').length).toBe(3)
    expect(calls).not.toContain('ROLLBACK')
    expect(releases()).toBe(1)
  })

  it('criterio 5 / RQ-TC-16 · si el INSERT del ticket falla, hace ROLLBACK y NO queda equipo confirmado', async () => {
    // El 2.º INSERT de la secuencia es el del ticket (el 1.º es el del equipo): fallarlo simula que
    // `createTicket` no pudo escribir aunque el equipo ya se había insertado dentro de la misma
    // transacción abierta.
    const { db, calls, releases } = rastreador({ verb: 'INSERT', n: 2 })
    await expect(crearTicketConEquipo(db, NUEVO_PROVISIONAL, 'Cliente', INPUT)).rejects.toThrow('boom (INSERT #2)')
    expect(calls[0]).toBe('BEGIN')
    expect(calls.at(-1)).toBe('ROLLBACK')
    expect(calls).not.toContain('COMMIT')
    // 2 INSERT emitidos (equipo, y el del ticket que falla); el `ROLLBACK` es lo que evita que el
    // primero quede confirmado — sin transacción, esa fila del equipo se habría quedado escrita.
    expect(calls.filter((v) => v === 'INSERT').length).toBe(2)
    expect(releases()).toBe(1)
  })
})
