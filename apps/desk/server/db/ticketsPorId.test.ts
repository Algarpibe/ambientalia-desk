// F1F-05 (lote 2), RQ-KP-25 y DD-9: los números de los tickets de Desk por «ID», sólo lectura y por bloques. pg-mem con `migrate`.
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { numerosDeTickets } from './ticketsPorId'

let db: Queryable
let sentencias: Array<{ sql: string; params: unknown[] }>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); const pool = new pg.Pool(); await migrate(pool)
  sentencias = []
  db = { query: (sql: string, params?: unknown[]) => { sentencias.push({ sql, params: params ?? [] }); return pool.query(sql, params) } } as Queryable
})

async function ticket(id: string, numero: number): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1, $2, $3, $4, $5)', [id, numero, 's', 'Ingresado', 'Servicio'])
}
const lecturas = () => sentencias.filter((s) => !/INSERT/i.test(s.sql))

describe('numerosDeTickets · consulta por ID (DD-9)', () => {
  it('devuelve Map<id, número> sólo de los ID que existen; el número es numérico y la clave es texto', async () => {
    await ticket('100000000000000001', 1001); await ticket('100000000000000002', 1002)
    const m = await numerosDeTickets(db, ['100000000000000001', '100000000000000002', '100000000000000999'])
    expect(m).toEqual(new Map([['100000000000000001', 1001], ['100000000000000002', 1002]]))
    expect(typeof m.get('100000000000000001')).toBe('number')
  })

  it('hipótesis 5: IN ($1,…) sobre la clave de texto funciona en pg-mem con ID de 18 dígitos (no se pierde precisión)', async () => {
    await ticket('123456789012345678', 7); await ticket('123456789012345679', 8)
    const m = await numerosDeTickets(db, ['123456789012345678'])
    expect([...m]).toEqual([['123456789012345678', 7]])
  })

  it('con trozo = 2 parte en bloques: 5 ID, 3 consultas, y el resultado es el mismo', async () => {
    for (let i = 1; i <= 5; i++) await ticket(`id${i}`, i)
    sentencias.length = 0
    const m = await numerosDeTickets(db, ['id1', 'id2', 'id3', 'id4', 'id5'], 2)
    expect(lecturas()).toHaveLength(3)
    expect(lecturas().map((s) => s.params)).toEqual([['id1', 'id2'], ['id3', 'id4'], ['id5']])
    expect([...m].sort()).toEqual([['id1', 1], ['id2', 2], ['id3', 3], ['id4', 4], ['id5', 5]])
  })

  it('los ID repetidos en la lista no repiten parámetros', async () => {
    await ticket('id1', 1)
    sentencias.length = 0
    await numerosDeTickets(db, ['id1', 'id1', 'id1'])
    expect(lecturas()).toHaveLength(1)
    expect(lecturas()[0].params).toEqual(['id1'])
  })

  it('lista vacía: mapa vacío y NINGUNA sentencia', async () => {
    sentencias.length = 0
    expect(await numerosDeTickets(db, [])).toEqual(new Map())
    expect(sentencias).toEqual([])
  })

  it('es de sólo lectura, con parámetros ligados (ningún ID en el texto de la sentencia)', async () => {
    await ticket('id1', 1)
    sentencias.length = 0
    await numerosDeTickets(db, ['id1'])
    expect(sentencias).toHaveLength(1)
    expect(sentencias[0].sql).toMatch(/^\s*SELECT\b/i)
    expect(sentencias[0].sql).not.toContain('id1')
    expect(sentencias[0].sql).not.toMatch(/\b(INSERT|UPDATE|DELETE)\b/i)
  })
})
