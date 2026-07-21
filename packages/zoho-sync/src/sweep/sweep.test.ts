import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { orphanIds, guardOk, sweepEntity, type SweepEntity } from './sweep'

describe('orphanIds', () => {
  it('devuelve los de la réplica que no están vivos', () => {
    expect(orphanIds(new Set(['a', 'b']), ['a', 'b', 'c', 'd'])).toEqual(['c', 'd'])
    expect(orphanIds(new Set(['a']), ['a'])).toEqual([])
  })
})

describe('guardOk', () => {
  const g = { maxRows: 200, maxPct: 0.1 }
  it('false si supera el tope absoluto', () => expect(guardOk(201, 10000, g)).toBe(false))
  it('false si supera el %', () => expect(guardOk(50, 100, g)).toBe(false)) // 50% > 10%
  it('true si dentro de límites', () => expect(guardOk(5, 1000, g)).toBe(true))
})

describe('sweepEntity (pg-mem)', () => {
  async function db() {
    const pg = newDb().adapters.createPg()
    const pool = new pg.Pool()
    await pool.query('CREATE SCHEMA books')
    await pool.query('CREATE TABLE books.invoices (invoice_id text primary key, n text)')
    await pool.query('CREATE TABLE books.invoice_line_items (line_item_id text primary key, invoice_id text)')
    for (const id of ['A', 'B', 'C']) {
      await pool.query('INSERT INTO books.invoices VALUES ($1,$2)', [id, 'x'])
      await pool.query('INSERT INTO books.invoice_line_items VALUES ($1,$2)', [id + '-L', id])
    }
    return pool
  }
  // confirmGone(id) simula la re-verificación en Zoho: true = ausente (borrar); false = sigue vivo.
  const ent = (live: string[], confirmGone: (id: string) => boolean = () => true): SweepEntity => ({
    schema: 'books', table: 'invoices', pk: 'invoice_id',
    childTable: 'invoice_line_items', childFk: 'invoice_id',
    collectLive: async () => new Set(live),
    confirmDeleted: async (id) => confirmGone(id),
  })
  const guard = { maxRows: 200, maxPct: 0.9 }

  it('borra el huérfano (C) confirmado ausente y sus líneas; deja los vivos', async () => {
    const pool = await db()
    const rep = await sweepEntity(pool, ent(['A', 'B']), { dryRun: false, guard })
    expect(rep).toMatchObject({ table: 'books.invoices', live: 2, replica: 3, orphans: 1, confirmed: 1, liveGaps: 0, deleted: 1, dryRun: false })
    const inv = await pool.query('SELECT invoice_id FROM books.invoices ORDER BY 1')
    expect(inv.rows.map((r: any) => r.invoice_id)).toEqual(['A', 'B'])
    const lines = await pool.query('SELECT line_item_id FROM books.invoice_line_items ORDER BY 1')
    expect(lines.rows.map((r: any) => r.line_item_id)).toEqual(['A-L', 'B-L'])
  })

  it('candidato que la re-verificación dice VIVO (hueco de lista) → NO se borra (liveGaps)', async () => {
    const pool = await db()
    // C falta en la lista (orphan candidato) pero confirmDeleted('C')=false → sigue vivo en Zoho
    const rep = await sweepEntity(pool, ent(['A', 'B'], (id) => id !== 'C'), { dryRun: false, guard })
    expect(rep).toMatchObject({ orphans: 1, confirmed: 0, liveGaps: 1, deleted: 0 })
    const inv = await pool.query('SELECT count(*)::int AS c FROM books.invoices')
    expect(inv.rows[0].c).toBe(3) // C sigue ahí
  })

  it('dry-run NO borra pero reporta confirmed (lo que borraría)', async () => {
    const pool = await db()
    const rep = await sweepEntity(pool, ent(['A', 'B']), { dryRun: true, guard })
    expect(rep).toMatchObject({ orphans: 1, confirmed: 1, deleted: 0, dryRun: true })
    const inv = await pool.query('SELECT count(*)::int AS c FROM books.invoices')
    expect(inv.rows[0].c).toBe(3)
  })

  it('tope excedido → NO borra ni re-verifica, marca skipped', async () => {
    const pool = await db()
    const rep = await sweepEntity(pool, ent([]), { dryRun: false, guard: { maxRows: 200, maxPct: 0.1 } })
    expect(rep.deleted).toBe(0)
    expect(rep.skipped).toBeTruthy()
    const inv = await pool.query('SELECT count(*)::int AS c FROM books.invoices')
    expect(inv.rows[0].c).toBe(3)
  })
})
