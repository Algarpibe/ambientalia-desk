import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { hubBootstrap, scheduleHubSync } from './hubSync'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import type { BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'

let db: Queryable
beforeEach(() => { const pg = newDb().adapters.createPg(); db = new pg.Pool() })

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
describe('hubBootstrap', () => {
  it('migra y hace backfill cuando el hub está vacío', async () => {
    const sync = mockSync()
    await hubBootstrap({ db, sync })
    const r = await db.query('SELECT count(*)::int AS n FROM tickets')
    expect(r.rows[0].n).toBe(0)
    expect(sync.backfillTickets).toHaveBeenCalledTimes(1)
    expect(sync.backfillArchivedTickets).toHaveBeenCalledTimes(1)
    expect(sync.syncActivities).toHaveBeenCalled()
    expect(sync.syncContacts).toHaveBeenCalled()
  })

  it('NO backfillea tickets si ya hay datos', async () => {
    await migrate(db)
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const sync = mockSync()
    await hubBootstrap({ db, sync })
    expect(sync.backfillTickets).not.toHaveBeenCalled()
    expect(sync.syncActivities).toHaveBeenCalled()
  })

  it('migra books.* y backfillea si está vacío', async () => {
    const calls: string[] = []
    const booksHubSync: BooksHubSync = {
      backfillContacts: async () => { calls.push('c'); return 0 },
      backfillItems: async () => { calls.push('i'); return 0 },
      backfillSalesOrders: async () => { calls.push('so'); return 0 },
      backfillInvoices: async () => { calls.push('inv'); return 0 },
      backfillPayments: async () => { calls.push('pay'); return 0 },
      backfillPurchaseOrders: async () => { calls.push('po'); return 0 },
      backfillRetainerInvoices: async () => { calls.push('ant'); return 0 },
      syncRecent: async () => ({ contacts: 0, items: 0, salesOrders: 0, invoices: 0, payments: 0, purchaseOrders: 0, retainerInvoices: 0 }),
      sweep: async () => [],
    }
    await hubBootstrap({ db, sync: mockSync(), booksHubSync })
    // pg-mem no soporta information_schema.schemata: una consulta calificada exitosa
    // prueba que el esquema books + la tabla existen (lanza si no).
    expect((await db.query('SELECT count(*)::int AS n FROM books.contacts')).rows[0].n).toBe(0)
    expect(calls).toEqual(['c', 'i', 'so', 'inv', 'pay', 'po', 'ant'])
  })

  // BACKFILL_CONTACTS existe porque el guard normal mira `books.items`: sin él, repoblar contactos
  // obligaría a vaciar los artículos y arrastrar órdenes y facturas. Es puntual y peligroso de dejar
  // encendido (~615 GET a Books en cada arranque), así que su comportamiento se fija con test.
  const mockBooks = (calls: string[]): BooksHubSync => ({
    backfillContacts: async () => { calls.push('c'); return 0 },
    backfillItems: async () => { calls.push('i'); return 0 },
    backfillSalesOrders: async () => { calls.push('so'); return 0 },
    backfillInvoices: async () => { calls.push('inv'); return 0 },
    backfillPayments: async () => { calls.push('pay'); return 0 },
    backfillPurchaseOrders: async () => { calls.push('po'); return 0 },
    backfillRetainerInvoices: async () => { calls.push('ant'); return 0 },
    syncRecent: async () => ({ contacts: 0, items: 0, salesOrders: 0, invoices: 0, payments: 0, purchaseOrders: 0, retainerInvoices: 0 }),
    sweep: async () => [],
  })
  /**
   * Books ya cargado: `books.items` con datos desactiva el backfill inicial.
   *
   * La tabla NO se crea aquí: la crea `migrate` desde que desk-db la necesita para recibirla replicada
   * del hub. Volver a declararla a mano rompería, y no por redundante — ⚠️ **pg-mem revienta con un
   * `CREATE TABLE IF NOT EXISTS` que lleve `PRIMARY KEY` cuando la tabla YA existe** («AST parts have
   * not been read»), mientras que Postgres real lo ignora en silencio.
   */
  const booksYaCargado = async () => {
    await migrate(db)
    await db.query("INSERT INTO books.items (item_id, zoho_last_modified) VALUES ('i1', now())")
  }

  it('con BACKFILL_CONTACTS repuebla SOLO contactos, no artículos ni facturas', async () => {
    await booksYaCargado()
    const calls: string[] = []
    await hubBootstrap({ db, sync: mockSync(), booksHubSync: mockBooks(calls), backfillContacts: true })
    expect(calls).toContain('c')
    expect(calls).not.toContain('i')
    expect(calls).not.toContain('so')
    expect(calls).not.toContain('inv')
  })

  it('sin el flag no repuebla contactos si Books ya tiene datos', async () => {
    await booksYaCargado()
    const calls: string[] = []
    await hubBootstrap({ db, sync: mockSync(), booksHubSync: mockBooks(calls) })
    expect(calls).not.toContain('c')
  })

  it('un fallo del backfill de contactos no tumba el arranque', async () => {
    await booksYaCargado()
    const calls: string[] = []
    const books = { ...mockBooks(calls), backfillContacts: async () => { throw new Error('Zoho 429') } }
    await expect(hubBootstrap({ db, sync: mockSync(), booksHubSync: books, backfillContacts: true })).resolves.toBeUndefined()
  })

  it('migra crm.* y backfillea si está vacío', async () => {
    const crmSync = { backfillAll: async () => ({}), syncRecent: async () => ({}), backfillIfEmpty: vi.fn(async () => ({})), sweep: async () => [] }
    await hubBootstrap({ db, sync: mockSync(), booksHubSync: null, crmSync })
    expect((await db.query('SELECT count(*)::int AS n FROM crm.deals')).rows[0].n).toBe(0) // crm.* creado
    expect(crmSync.backfillIfEmpty).toHaveBeenCalledTimes(1)
  })
})

describe('scheduleHubSync', () => {
  afterEach(() => { vi.useRealTimers() })
  it('agenda el ciclo y stop() lo detiene', async () => {
    vi.useFakeTimers()
    const sync = mockSync()
    const stop = scheduleHubSync({ sync, intervalMs: 1000 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(sync.syncRecent).toHaveBeenCalledTimes(1)
    stop()
    await vi.advanceTimersByTimeAsync(3000)
    expect(sync.syncRecent).toHaveBeenCalledTimes(1)
  })

  /** Un sync que apunta el orden en que se le llama. `fallaHistoria` hace que la historia rechace. */
  function syncQueApunta(orden: string[], fallaHistoria = false): Sync {
    const s = mockSync()
    s.syncRecent = vi.fn(async () => { orden.push('tickets'); return 0 })
    s.syncPendingHistory = vi.fn(async () => {
      orden.push('historia')
      if (fallaHistoria) throw new Error('Zoho 429')
      return { intentados: 0, poblados: 0, fallidos: 0 }
    })
    s.syncActivities = vi.fn(async () => { orden.push('actividades'); return 0 })
    s.syncContacts = vi.fn(async () => { orden.push('contactos'); return 0 })
    return s
  }

  /**
   * La historia va DESPUÉS de los tickets, porque `syncRecent` es quien avanza el `modified_time`
   * que decide qué historias faltan, y ANTES de actividades y contactos, que no dependen de ella.
   */
  it('trae la historia pendiente entre los tickets y las actividades, con límite de 50', async () => {
    vi.useFakeTimers()
    const orden: string[] = []
    const sync = syncQueApunta(orden)
    const stop = scheduleHubSync({ sync, intervalMs: 1000 })
    await vi.advanceTimersByTimeAsync(1000)
    stop()
    expect(orden).toEqual(['tickets', 'historia', 'actividades', 'contactos'])
    expect(sync.syncPendingHistory).toHaveBeenCalledWith({ limite: 50 })
  })

  it('un fallo de la historia no corta actividades ni contactos', async () => {
    vi.useFakeTimers()
    const errores = vi.spyOn(console, 'error').mockImplementation(() => {})
    const orden: string[] = []
    const stop = scheduleHubSync({ sync: syncQueApunta(orden, true), intervalMs: 1000 })
    await vi.advanceTimersByTimeAsync(1000)
    stop()
    expect(orden).toEqual(['tickets', 'historia', 'actividades', 'contactos'])
    // Lo recoge el catch propio de la historia, no el general del ciclo.
    expect(errores).toHaveBeenCalledWith('Historia pendiente falló:', expect.any(Error))
    errores.mockRestore()
  })
})
