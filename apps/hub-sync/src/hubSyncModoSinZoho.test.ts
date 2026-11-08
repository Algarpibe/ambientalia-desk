import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { newDb } from 'pg-mem'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import type { BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'
import type { CrmSync } from '@ambientalia/zoho-sync/crmHub/sync'
import { hubBootstrap, scheduleHubSync } from './hubSync'

/**
 * 1G-04 (RQ-ZS-45) · el worker con el modo sin Zoho Desk abierto no programa ni lanza lo de Desk, y Books y CRM
 * siguen como hoy. Cerrado, o sin el campo, las tres pasadas. Más el fichero vigilado `hub-sync.ts`.
 */
let db: Queryable
beforeEach(() => { const pg = newDb().adapters.createPg(); db = new pg.Pool() })
afterEach(() => { vi.useRealTimers() })

function mockSync(): Sync {
  return {
    backfillTickets: vi.fn().mockResolvedValue(0),
    backfillArchivedTickets: vi.fn().mockResolvedValue(0),
    backfillTicketHistory: vi.fn().mockResolvedValue({ intentados: 0, poblados: 0, fallidos: 0, restantes: 0 }),
    syncRecent: vi.fn().mockResolvedValue(0),
    syncTicket: vi.fn().mockResolvedValue(undefined),
    syncConversations: vi.fn().mockResolvedValue(undefined),
    syncTicketHistory: vi.fn().mockResolvedValue(undefined),
    syncActivities: vi.fn().mockResolvedValue(0),
    syncContacts: vi.fn().mockResolvedValue(0),
    syncPendingHistory: vi.fn().mockResolvedValue({ intentados: 0, poblados: 0, fallidos: 0 }),
  }
}

function booksFalso() {
  const backfillItems = vi.fn(async () => 0)
  const syncRecent = vi.fn(async () => ({ contacts: 0, items: 0, salesOrders: 0, invoices: 0, payments: 0, purchaseOrders: 0, retainerInvoices: 0 }))
  const books: BooksHubSync = {
    backfillContacts: async () => 0, backfillItems, backfillSalesOrders: async () => 0, backfillInvoices: async () => 0,
    backfillPayments: async () => 0, backfillPurchaseOrders: async () => 0, backfillRetainerInvoices: async () => 0,
    syncRecent, sweep: async () => [],
  }
  return { books, backfillItems, syncRecent }
}

function crmFalso() {
  const backfillIfEmpty = vi.fn(async () => ({}))
  const syncRecent = vi.fn(async () => ({}))
  const crm: CrmSync = { backfillAll: async () => ({}), syncRecent, backfillIfEmpty, sweep: async () => [], syncPendingWonStages: async () => ({ intentados: 0, poblados: 0, fallidos: 0 }) }
  return { crm, backfillIfEmpty, syncRecent }
}

describe('hubBootstrap · modo sin Zoho Desk', () => {
  it('abierto y con el hub vacío: no lanza nada de Desk, migra, y Books y CRM arrancan', async () => {
    const sync = mockSync()
    const { books, backfillItems } = booksFalso()
    const { crm, backfillIfEmpty } = crmFalso()
    await hubBootstrap({ db, sync, booksHubSync: books, crmSync: crm, modoSinZohoDesk: true })
    expect(sync.backfillTickets).not.toHaveBeenCalled()
    expect(sync.backfillArchivedTickets).not.toHaveBeenCalled()
    expect(sync.syncActivities).not.toHaveBeenCalled()
    expect(sync.syncContacts).not.toHaveBeenCalled()
    expect((await db.query('SELECT count(*)::int AS n FROM tickets')).rows[0].n).toBe(0) // migrate corrió
    expect(backfillItems).toHaveBeenCalledTimes(1)
    expect(backfillIfEmpty).toHaveBeenCalledTimes(1)
  })

  it('cerrado y con el hub vacío: las pasadas de siempre', async () => {
    const sync = mockSync()
    await hubBootstrap({ db, sync, modoSinZohoDesk: false })
    expect(sync.backfillTickets).toHaveBeenCalledTimes(1)
    expect(sync.backfillArchivedTickets).toHaveBeenCalledTimes(1)
    expect(sync.syncActivities).toHaveBeenCalledTimes(1)
    expect(sync.syncContacts).toHaveBeenCalledTimes(1)
  })

  it('sin el campo: igual que cerrado', async () => {
    const sync = mockSync()
    await hubBootstrap({ db, sync })
    expect(sync.backfillTickets).toHaveBeenCalledTimes(1)
    expect(sync.syncContacts).toHaveBeenCalledTimes(1)
  })
})

describe('scheduleHubSync · modo sin Zoho Desk', () => {
  it('abierto: no programa la pasada de Desk, y Books y CRM corren con su periodo', async () => {
    vi.useFakeTimers()
    const sync = mockSync()
    const { books, syncRecent: booksRecent } = booksFalso()
    const { crm, syncRecent: crmRecent } = crmFalso()
    const stop = scheduleHubSync({ sync, booksHubSync: books, crmSync: crm, intervalMs: 1000, modoSinZohoDesk: true })
    await vi.advanceTimersByTimeAsync(3000)
    expect(sync.syncRecent).not.toHaveBeenCalled()
    expect(sync.syncPendingHistory).not.toHaveBeenCalled()
    expect(sync.syncActivities).not.toHaveBeenCalled()
    expect(sync.syncContacts).not.toHaveBeenCalled()
    expect(booksRecent).toHaveBeenCalledTimes(3)
    expect(crmRecent).toHaveBeenCalledTimes(3)
    stop()
  })

  it.each([['cerrado', false], ['sin el campo', undefined]])('%s: las tres pasadas como hoy', async (_nombre, modoSinZohoDesk) => {
    vi.useFakeTimers()
    const sync = mockSync()
    const { books, syncRecent: booksRecent } = booksFalso()
    const { crm, syncRecent: crmRecent } = crmFalso()
    const stop = scheduleHubSync({ sync, booksHubSync: books, crmSync: crm, intervalMs: 1000, ...(modoSinZohoDesk === undefined ? {} : { modoSinZohoDesk }) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(sync.syncRecent).toHaveBeenCalledTimes(1)
    expect(sync.syncPendingHistory).toHaveBeenCalledTimes(1)
    expect(sync.syncActivities).toHaveBeenCalledTimes(1)
    expect(sync.syncContacts).toHaveBeenCalledTimes(1)
    expect(booksRecent).toHaveBeenCalledTimes(1)
    expect(crmRecent).toHaveBeenCalledTimes(1)
    stop()
  })
})

describe('hub-sync.ts · cableado (fichero vigilado)', () => {
  const lineas = readFileSync(fileURLToPath(new URL('./hub-sync.ts', import.meta.url)), 'utf8').split(/\r?\n/)
  const la = (marca: string): string | undefined => lineas.find((l) => l.includes(marca))

  it('la llamada a hubBootstrap lleva el modo de la configuración', () => {
    expect(la('hubBootstrap(')).toContain('modoSinZohoDesk: config.modoSinZohoDesk')
  })

  it('la llamada a scheduleHubSync lleva el modo de la configuración', () => {
    expect(la('scheduleHubSync(')).toContain('modoSinZohoDesk: config.modoSinZohoDesk')
  })

  it('createZohoClient recibe el registro y el aviso por origen nuevo', () => {
    const llamada = la('createZohoClient(')
    expect(llamada).toContain('registro:')
    expect(llamada).toContain('avisar:')
  })
})
