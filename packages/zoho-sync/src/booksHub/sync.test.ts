import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateBooks } from './migrate'
import { createBooksHubSync } from './sync'
import type { AppConfig } from '../config'

const config = { booksOrgId: 'o' } as AppConfig
const page = (key: string, items: unknown[]) => new Response(JSON.stringify({ [key]: items }), { status: 200 })
const detail = (key: string, obj: unknown) => new Response(JSON.stringify({ [key]: obj }), { status: 200 })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateBooks(db) })

describe('booksHub sync', () => {
  it('backfillSalesOrders trae cabecera por lista y líneas por detalle', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/salesorders?')) return Promise.resolve(page('salesorders', [{ salesorder_id: 's1', salesorder_number: 'OV-1', date: '2026-06-01', last_modified_time: '2026-06-01T00:00:00Z' }]))
      if (path.startsWith('/salesorders/s1')) return Promise.resolve(detail('salesorder', { salesorder_id: 's1', salesorder_number: 'OV-1', date: '2026-06-01', bcy_sub_total: 100, last_modified_time: '2026-06-01T00:00:00Z', line_items: [{ line_item_id: 'l1', item_id: 'i1', bcy_rate: 10, quantity: 2 }] }))
      return Promise.resolve(page('salesorders', []))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    expect(await sync.backfillSalesOrders()).toBe(1)
    expect((await db.query("SELECT bcy_sub_total FROM books.sales_orders WHERE salesorder_id='s1'")).rows[0].bcy_sub_total).toBe(100)
    expect((await db.query("SELECT count(*)::int n FROM books.salesorder_line_items WHERE salesorder_id='s1'")).rows[0].n).toBe(1)
  })

  it('un documento que falla en detalle no aborta el lote (resiliencia)', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/salesorders?')) return Promise.resolve(page('salesorders', [{ salesorder_id: 'bad', last_modified_time: '2026-06-02T00:00:00Z' }, { salesorder_id: 'ok', last_modified_time: '2026-06-01T00:00:00Z' }]))
      if (path.startsWith('/salesorders/bad')) return Promise.resolve(new Response('boom', { status: 500 }))
      if (path.startsWith('/salesorders/ok')) return Promise.resolve(detail('salesorder', { salesorder_id: 'ok', line_items: [] }))
      return Promise.resolve(page('salesorders', []))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    await expect(sync.backfillSalesOrders()).resolves.toBeDefined()
    expect((await db.query("SELECT 1 FROM books.sales_orders WHERE salesorder_id='ok'")).rows.length).toBe(1)
    expect((await db.query("SELECT 1 FROM books.sales_orders WHERE salesorder_id='bad'")).rows.length).toBe(0)
  })

  it('backfillPayments trae cabecera por lista y facturas aplicadas por detalle', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/customerpayments?')) return Promise.resolve(page('customerpayments', [{ payment_id: 'p1', payment_number: 'PC-1', last_modified_time: '2026-07-01T00:00:00Z' }]))
      if (path.startsWith('/customerpayments/p1')) return Promise.resolve(detail('payment', { payment_id: 'p1', payment_number: 'PC-1', amount: 600, exchange_rate: 0.5, currency_code: 'COP', updated_time: '2026-07-01T00:00:00Z', invoices: [{ invoice_payment_id: 'ip1', invoice_id: 'i1', invoice_number: 'AM1', amount_applied: 600, balance: 0 }] }))
      return Promise.resolve(page('customerpayments', []))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    expect(await sync.backfillPayments()).toBe(1)
    expect((await db.query("SELECT bcy_amount FROM books.customer_payments WHERE payment_id='p1'")).rows[0].bcy_amount).toBe(300)
    expect((await db.query("SELECT count(*)::int n FROM books.customer_payment_invoices WHERE payment_id='p1'")).rows[0].n).toBe(1)
    expect((await db.query("SELECT invoice_number FROM books.customer_payment_invoices WHERE invoice_payment_id='ip1'")).rows[0].invoice_number).toBe('AM1')
  })

  it('syncRecent (incremental) solo trae items más nuevos que la marca de agua', async () => {
    await db.query("INSERT INTO books.items (item_id, zoho_last_modified) VALUES ('old','2024-01-01T00:00:00Z')")
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/items')) return Promise.resolve(page('items', [
        { item_id: 'new', name: 'N', last_modified_time: '2024-06-01T00:00:00Z' },
        { item_id: 'old', name: 'O', last_modified_time: '2024-01-01T00:00:00Z' },
      ]))
      return Promise.resolve(page(path.startsWith('/contacts') ? 'contacts' : path.startsWith('/salesorders') ? 'salesorders' : 'invoices', []))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    const r = await sync.syncRecent()
    expect(r.items).toBe(1)
    expect((await db.query("SELECT name FROM books.items WHERE item_id='new'")).rows.length).toBe(1)
  })
})
