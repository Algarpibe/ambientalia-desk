import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateBooks } from './migrate'
import { createBooksHubSync } from './sync'
import type { AppConfig } from '../config'

const config = { booksOrgId: 'o' } as AppConfig
const guard = { maxRows: 200, maxPct: 0.9 }

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await migrateBooks(db)
  // Réplica con A, B, C (C ya no existe en Zoho) + una línea por invoice.
  for (const id of ['A', 'B', 'C']) {
    await db.query('INSERT INTO books.invoices (invoice_id) VALUES ($1)', [id])
    await db.query('INSERT INTO books.invoice_line_items (line_item_id, invoice_id) VALUES ($1,$2)', [id + '-L', id])
  }
})

// Los demás recursos (salesorders, contacts, items) responden lista vacía → sin huérfanos (réplica vacía).
const emptyOthers = (path: string): Response | null => {
  if (path.startsWith('/salesorders')) return new Response(JSON.stringify({ salesorders: [] }), { status: 200 })
  if (path.startsWith('/contacts')) return new Response(JSON.stringify({ contacts: [] }), { status: 200 })
  if (path.startsWith('/items')) return new Response(JSON.stringify({ items: [] }), { status: 200 })
  return null
}

describe('booksHub sweep', () => {
  it('borra el huérfano confirmado ausente (code 1002) y sus líneas; deja los vivos', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      const other = emptyOthers(path)
      if (other) return Promise.resolve(other)
      if (path.startsWith('/invoices/C')) return Promise.resolve(new Response(JSON.stringify({ code: 1002, message: 'El recurso no existe.' }), { status: 404 })) // verify: ausente (señal real de Books)
      if (path.startsWith('/invoices')) return Promise.resolve(new Response(JSON.stringify({ invoices: [{ invoice_id: 'A' }, { invoice_id: 'B' }] }), { status: 200 })) // list: C ausente
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    const reports = await sync.sweep({ dryRun: false, guard })
    const inv = reports.find((r) => r.table === 'books.invoices')!
    expect(inv).toMatchObject({ live: 2, replica: 3, orphans: 1, confirmed: 1, liveGaps: 0, deleted: 1, dryRun: false })
    expect((await db.query('SELECT invoice_id FROM books.invoices ORDER BY 1')).rows.map((r: any) => r.invoice_id)).toEqual(['A', 'B'])
    expect((await db.query('SELECT line_item_id FROM books.invoice_line_items ORDER BY 1')).rows.map((r: any) => r.line_item_id)).toEqual(['A-L', 'B-L'])
  })

  it('candidato que la re-verificación dice VIVO (200) → NO se borra (liveGaps)', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      const other = emptyOthers(path)
      if (other) return Promise.resolve(other)
      if (path.startsWith('/invoices/C')) return Promise.resolve(new Response(JSON.stringify({ code: 0, invoice: { invoice_id: 'C' } }), { status: 200 })) // verify: sigue vivo (code 0)
      if (path.startsWith('/invoices')) return Promise.resolve(new Response(JSON.stringify({ invoices: [{ invoice_id: 'A' }, { invoice_id: 'B' }] }), { status: 200 }))
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    const reports = await sync.sweep({ dryRun: false, guard })
    const inv = reports.find((r) => r.table === 'books.invoices')!
    expect(inv).toMatchObject({ orphans: 1, confirmed: 0, liveGaps: 1, deleted: 0 })
    expect((await db.query('SELECT count(*)::int AS c FROM books.invoices')).rows[0].c).toBe(3) // C sigue ahí
  })

  it('una página del list que falla → entidad abortada (skipped), no borra', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      const other = emptyOthers(path)
      if (other) return Promise.resolve(other)
      if (path.startsWith('/invoices')) return Promise.resolve(new Response('boom', { status: 500 })) // list falla
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    const reports = await sync.sweep({ dryRun: false, guard })
    const inv = reports.find((r) => r.table === 'books.invoices')!
    expect(inv.skipped).toBeTruthy()
    expect(inv.deleted).toBe(0)
    expect((await db.query('SELECT count(*)::int AS c FROM books.invoices')).rows[0].c).toBe(3)
  })
})
