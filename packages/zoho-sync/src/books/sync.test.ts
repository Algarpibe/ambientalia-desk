import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { createBooksSync } from './sync'
import { searchClients, searchSalesOrders, upsertClient } from './repo'
import { clientFromBooks } from './mappers'
import type { AppConfig } from '../config'

const config = { booksOrgId: 'o' } as AppConfig
const page = (key: 'contacts' | 'salesorders', items: unknown[]) => new Response(JSON.stringify({ [key]: items }), { status: 200 })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('books sync', () => {
  it('backfillClients pagina y hace upsert', async () => {
    const booksFetch = vi.fn()
      .mockResolvedValueOnce(page('contacts', [{ contact_id: 'c1', contact_name: 'Camposol', last_modified_time: '2024-01-01T00:00:00Z' }]))
      .mockResolvedValue(page('contacts', []))
    const sync = createBooksSync({ booksFetch: booksFetch as any, db, config })
    expect(await sync.backfillClients()).toBe(1)
    expect((await searchClients(db, 'camp')).length).toBe(1)
  })

  it('backfillSalesOrders pagina y hace upsert', async () => {
    const booksFetch = vi.fn()
      .mockResolvedValueOnce(page('salesorders', [{ salesorder_id: 's1', salesorder_number: 'OV-1', last_modified_time: '2026-01-01T00:00:00Z' }]))
      .mockResolvedValue(page('salesorders', []))
    const sync = createBooksSync({ booksFetch: booksFetch as any, db, config })
    expect(await sync.backfillSalesOrders()).toBe(1)
    expect((await searchSalesOrders(db, 'OV-1')).length).toBe(1)
  })

  it('syncRecent (incremental) solo trae lo más nuevo que la marca de agua', async () => {
    await upsertClient(db, clientFromBooks({ contact_id: 'old', contact_name: 'Viejo', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.includes('/contacts')) {
        return Promise.resolve(page('contacts', [
          { contact_id: 'new', contact_name: 'Nuevo', last_modified_time: '2024-06-01T00:00:00Z' },
          { contact_id: 'old', contact_name: 'Viejo', last_modified_time: '2024-01-01T00:00:00Z' },
        ]))
      }
      return Promise.resolve(page('salesorders', []))
    })
    const sync = createBooksSync({ booksFetch: booksFetch as any, db, config })
    const r = await sync.syncRecent()
    expect(r.clients).toBe(1)
    expect((await searchClients(db, 'nuevo')).length).toBe(1)
  })
})
