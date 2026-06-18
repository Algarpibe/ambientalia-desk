import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { hubBootstrap, scheduleHubSync } from './hubSync'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import type { BooksSync } from '@ambientalia/zoho-sync/books/sync'
import type { BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'

let db: Queryable
beforeEach(() => { const pg = newDb().adapters.createPg(); db = new pg.Pool() })

function mockSync(): Sync {
  return {
    backfillTickets: vi.fn().mockResolvedValue(0),
    backfillArchivedTickets: vi.fn().mockResolvedValue(0),
    syncRecent: vi.fn().mockResolvedValue(0),
    syncTicket: vi.fn().mockResolvedValue(undefined),
    syncConversations: vi.fn().mockResolvedValue(undefined),
    syncTicketHistory: vi.fn().mockResolvedValue(undefined),
    syncActivities: vi.fn().mockResolvedValue(0),
    syncContacts: vi.fn().mockResolvedValue(0),
  }
}
function mockBooks(): BooksSync {
  return {
    backfillClients: vi.fn().mockResolvedValue(0),
    backfillSalesOrders: vi.fn().mockResolvedValue(0),
    syncRecent: vi.fn().mockResolvedValue({ clients: 0, salesOrders: 0 }),
  }
}

describe('hubBootstrap', () => {
  it('migra y hace backfill cuando el hub está vacío', async () => {
    const sync = mockSync(); const booksSync = mockBooks()
    await hubBootstrap({ db, sync, booksSync })
    const r = await db.query('SELECT count(*)::int AS n FROM tickets')
    expect(r.rows[0].n).toBe(0)
    expect(sync.backfillTickets).toHaveBeenCalledTimes(1)
    expect(sync.backfillArchivedTickets).toHaveBeenCalledTimes(1)
    expect(sync.syncActivities).toHaveBeenCalled()
    expect(sync.syncContacts).toHaveBeenCalled()
    expect(booksSync.backfillClients).toHaveBeenCalledTimes(1)
    expect(booksSync.backfillSalesOrders).toHaveBeenCalledTimes(1)
  })

  it('NO backfillea tickets si ya hay datos', async () => {
    await migrate(db)
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const sync = mockSync()
    await hubBootstrap({ db, sync, booksSync: null })
    expect(sync.backfillTickets).not.toHaveBeenCalled()
    expect(sync.syncActivities).toHaveBeenCalled()
  })

  it('sin booksSync no falla', async () => {
    const sync = mockSync()
    await expect(hubBootstrap({ db, sync, booksSync: null })).resolves.toBeUndefined()
  })

  it('migra books.* y backfillea si está vacío', async () => {
    const calls: string[] = []
    const booksHubSync: BooksHubSync = {
      backfillContacts: async () => { calls.push('c'); return 0 },
      backfillItems: async () => { calls.push('i'); return 0 },
      backfillSalesOrders: async () => { calls.push('so'); return 0 },
      backfillInvoices: async () => { calls.push('inv'); return 0 },
      syncRecent: async () => ({ contacts: 0, items: 0, salesOrders: 0, invoices: 0 }),
    }
    await hubBootstrap({ db, sync: mockSync(), booksSync: null, booksHubSync })
    // pg-mem no soporta information_schema.schemata: una consulta calificada exitosa
    // prueba que el esquema books + la tabla existen (lanza si no).
    expect((await db.query('SELECT count(*)::int AS n FROM books.contacts')).rows[0].n).toBe(0)
    expect(calls).toEqual(['c', 'i', 'so', 'inv'])
  })
})

describe('scheduleHubSync', () => {
  afterEach(() => { vi.useRealTimers() })
  it('agenda el ciclo y stop() lo detiene', async () => {
    vi.useFakeTimers()
    const sync = mockSync(); const booksSync = mockBooks()
    const stop = scheduleHubSync({ sync, booksSync, intervalMs: 1000 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(sync.syncRecent).toHaveBeenCalledTimes(1)
    expect(booksSync.syncRecent).toHaveBeenCalledTimes(1)
    stop()
    await vi.advanceTimersByTimeAsync(3000)
    expect(sync.syncRecent).toHaveBeenCalledTimes(1)
  })
})
