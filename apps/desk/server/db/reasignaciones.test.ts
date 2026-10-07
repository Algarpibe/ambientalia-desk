// reasignacion-con-motivo (F1B-05), lote 1: la capa de datos de `public.reasignaciones` y el `UPDATE` condicionado de
// `tickets.derivado_a`. Molde de `garantiaProveedor.test.ts` (pg-mem con `migrate`) y, para la atomicidad, del rastreador
// de verbos de `prioridadTop5.test.ts` (pg-mem no revierte un ROLLBACK: `transaccion.test.ts`).
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ticketParaReasignar, reasignar, reasignacionesDelTicket, usosEnReasignaciones, type Reasignar } from './reasignaciones'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

async function ticket(id = 't1', derivadoA: string | null = 'ana', status = 'Ingresado', numero = 9301): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, subject, status, derivado_a, classification) VALUES ($1, $2, $3, $4, $5, $6)', [id, numero, 's', status, derivadoA, 'Servicio'])
}
const pedido = (extra: Partial<Reasignar> = {}): Reasignar => ({ ticketId: 't1', de: 'ana', a: 'beto', motivo: 'vacaciones', por: 'Gerencia', ...extra })
const derivadoDe = async (id = 't1') => (await db.query('SELECT derivado_a FROM tickets WHERE id = $1', [id])).rows[0].derivado_a as string | null
const trazas = async () => (await db.query('SELECT * FROM public.reasignaciones ORDER BY id')).rows as Array<Record<string, unknown>>

describe('ticketParaReasignar (RQ-TC-50: lo mínimo del ticket)', () => {
  it('devuelve id, número, estado, clasificación y persona a cargo; null si no existe', async () => {
    await ticket('t1', 'ana', 'En Proceso', 9301)
    expect(await ticketParaReasignar(db, 't1')).toEqual({ id: 't1', numero: 9301, status: 'En Proceso', classification: 'Servicio', derivadoA: 'ana' })
    expect(await ticketParaReasignar(db, 'no-existe')).toBeNull()
  })

  it('un ticket sin persona a cargo trae derivadoA nulo', async () => {
    await ticket('t1', null)
    expect((await ticketParaReasignar(db, 't1'))!.derivadoA).toBeNull()
  })
})

describe('reasignar · la actualización y la traza van juntas (RQ-TC-51, RQ-TZ-20)', () => {
  it('cambia derivado_a y deja UNA fila con origen, destino, motivo, actor y fecha', async () => {
    await ticket()
    expect(await reasignar(db, pedido())).toBe(true)
    expect(await derivadoDe()).toBe('beto')
    const t = await trazas()
    expect(t).toHaveLength(1)
    expect(t[0]).toMatchObject({ ticket_id: 't1', de: 'ana', a: 'beto', motivo: 'vacaciones', reasignado_por: 'Gerencia' })
    expect(t[0].reasignado_at).toBeInstanceOf(Date)
  })

  it('origen nulo: el ticket sin persona a cargo se reasigna y la traza lleva de nulo', async () => {
    await ticket('t1', null)
    expect(await reasignar(db, pedido({ de: null }))).toBe(true)
    expect(await derivadoDe()).toBe('beto')
    expect((await trazas())[0].de).toBeNull()
  })

  it('el UPDATE sólo toca derivado_a: status y managed_by_app quedan como estaban (DD-2)', async () => {
    await ticket('t1', 'ana', 'En Proceso')
    const leer = async () => (await db.query('SELECT status, managed_by_app, source, modified_time, updated_at FROM tickets WHERE id = $1', ['t1'])).rows[0]
    const antes = await leer()
    expect(antes.managed_by_app).toBe(false)
    await reasignar(db, pedido())
    expect(await leer()).toEqual(antes)
  })

  it('dato viejo: con `de` equivocado devuelve false, derivado_a no cambia y no hay traza', async () => {
    await ticket('t1', 'beto')
    expect(await reasignar(db, pedido({ de: 'ana', a: 'carla' }))).toBe(false)
    expect(await derivadoDe()).toBe('beto')
    expect(await trazas()).toEqual([])
  })

  it('dato viejo con `de: null` sobre un ticket que ya tiene persona a cargo: false, nada cambia', async () => {
    await ticket('t1', 'beto')
    expect(await reasignar(db, pedido({ de: null, a: 'carla' }))).toBe(false)
    expect(await derivadoDe()).toBe('beto')
    expect(await trazas()).toEqual([])
  })

  it('ticket inexistente: false y sin traza', async () => {
    expect(await reasignar(db, pedido({ ticketId: 'no-existe' }))).toBe(false)
    expect(await trazas()).toEqual([])
  })

  it('encadenadas A a B y B a C: dos filas, con `de` ana y `de` beto', async () => {
    await ticket('t1', 'ana')
    expect(await reasignar(db, pedido({ de: 'ana', a: 'beto' }))).toBe(true)
    expect(await reasignar(db, pedido({ de: 'beto', a: 'carla', motivo: 'carga' }))).toBe(true)
    expect(await derivadoDe()).toBe('carla')
    expect((await trazas()).map((f) => [f.de, f.a])).toEqual([['ana', 'beto'], ['beto', 'carla']])
  })

  it('la base rechaza un motivo vacío con el CHECK y no deja traza', async () => {
    await ticket()
    await expect(reasignar(db, pedido({ motivo: '' }))).rejects.toThrow()
    expect(await trazas()).toEqual([])
  })

  it('atómico: si el INSERT de la traza falla, la secuencia por la conexión de la transacción es BEGIN, UPDATE, INSERT, ROLLBACK, sin COMMIT', async () => {
    const calls: string[] = []
    const ejecutar = (origen: string) => async (sql: string) => {
      const verbo = sql.trim().split(/\s+/)[0].toUpperCase()
      calls.push(`${origen}:${verbo}`)
      if (verbo === 'INSERT') throw new Error('boom (rastreador)')
      return { rows: verbo === 'UPDATE' ? [{ id: 't1' }] : [] }
    }
    // Se distingue el pool de la conexión de la transacción: un INSERT por el pool quedaría FUERA de ella.
    const falso = { query: ejecutar('pool'), connect: async () => ({ query: ejecutar('tx'), release: () => {} }) } as unknown as Queryable
    await expect(reasignar(falso, pedido())).rejects.toThrow('boom (rastreador)')
    expect(calls).toEqual(['tx:BEGIN', 'tx:UPDATE', 'tx:INSERT', 'tx:ROLLBACK'])
  })

  it('con el UPDATE sin fila no se inserta traza: BEGIN, UPDATE, COMMIT', async () => {
    const calls: string[] = []
    const cliente = { query: async (sql: string) => { calls.push(sql.trim().split(/\s+/)[0].toUpperCase()); return { rows: [] } }, release: () => {} }
    const falso = { query: async () => ({ rows: [] }), connect: async () => cliente } as unknown as Queryable
    expect(await reasignar(falso, pedido())).toBe(false)
    expect(calls).toEqual(['BEGIN', 'UPDATE', 'COMMIT'])
  })

  // W-3 del verify: la misma comprobación de DD-2 que la de arriba, por la rama `IS NULL` del UPDATE (otro SQL, otra mutación).
  it('el UPDATE de origen nulo también sólo toca derivado_a: status, managed_by_app y updated_at quedan como estaban (DD-2)', async () => {
    await ticket('t1', null, 'En Proceso')
    const leer = async () => (await db.query('SELECT status, managed_by_app, source, modified_time, updated_at FROM tickets WHERE id = $1', ['t1'])).rows[0]
    const antes = await leer()
    expect(antes.managed_by_app).toBe(false)
    expect(await reasignar(db, pedido({ de: null }))).toBe(true)
    expect(await derivadoDe()).toBe('beto')
    expect(await leer()).toEqual(antes)
  })
})

describe('reasignacionesDelTicket · lectura ordenada por id', () => {
  it('devuelve las reasignaciones del ticket, de la más antigua a la más reciente, y no las de otro', async () => {
    await ticket('t1', 'ana'); await ticket('t2', 'ana', 'Ingresado', 9302)
    await reasignar(db, pedido({ de: 'ana', a: 'beto' }))
    await reasignar(db, pedido({ ticketId: 't2', de: 'ana', a: 'zoe' }))
    await reasignar(db, pedido({ de: 'beto', a: 'carla', motivo: 'carga' }))
    const r = await reasignacionesDelTicket(db, 't1')
    expect(r.map((x) => [x.de, x.a, x.motivo])).toEqual([['ana', 'beto', 'vacaciones'], ['beto', 'carla', 'carga']])
    expect(r[0]).toMatchObject({ reasignadoPor: 'Gerencia' })
    expect(r[0].reasignadoAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(await reasignacionesDelTicket(db, 'sin-nada')).toEqual([])
  })

  it('el origen nulo sale como null', async () => {
    await ticket('t1', null)
    await reasignar(db, pedido({ de: null }))
    expect((await reasignacionesDelTicket(db, 't1'))[0].de).toBeNull()
  })
})

describe('usosEnReasignaciones · cuenta `de` y `a`, no `reasignado_por` (RQ-PM-11)', () => {
  it('cuenta las filas donde la persona figura como origen o como destino', async () => {
    await ticket('t1', 'ana')
    await reasignar(db, pedido({ de: 'ana', a: 'beto' }))
    await reasignar(db, pedido({ de: 'beto', a: 'carla' }))
    expect(await usosEnReasignaciones(db, 'ana')).toBe(1)
    expect(await usosEnReasignaciones(db, 'beto')).toBe(2)
    expect(await usosEnReasignaciones(db, 'carla')).toBe(1)
    expect(await usosEnReasignaciones(db, 'nadie')).toBe(0)
  })

  it('una fila donde la misma persona es origen y destino cuenta UNA vez', async () => {
    await ticket('t1', 'ana')
    await reasignar(db, pedido({ de: 'ana', a: 'ana' }))
    expect(await usosEnReasignaciones(db, 'ana')).toBe(1)
  })

  it('reasignado_por NO cuenta: quien sólo reasignó (por nombre) no queda en uso', async () => {
    await ticket('t1', 'ana')
    await reasignar(db, pedido({ de: 'ana', a: 'beto', por: 'Gerencia' }))
    expect(await usosEnReasignaciones(db, 'Gerencia')).toBe(0)
  })
})
