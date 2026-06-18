import { migrate, reseedTicketNumber, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { countTickets } from '@ambientalia/zoho-sync/db/repo'
import { maxLastModified } from '@ambientalia/zoho-sync/books/repo'
import { migrateBooks } from '@ambientalia/zoho-sync/booksHub/migrate'
import { maxZohoLastModified } from '@ambientalia/zoho-sync/booksHub/repo'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import type { BooksSync } from '@ambientalia/zoho-sync/books/sync'
import type { BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'

/** Migra el hub y hace el backfill inicial solo si está vacío. Idempotente entre reinicios. */
export async function hubBootstrap(deps: { db: Queryable; sync: Sync; booksSync: BooksSync | null; booksHubSync?: BooksHubSync | null }): Promise<void> {
  const { db, sync, booksSync, booksHubSync = null } = deps
  await migrate(db)
  try { await reseedTicketNumber(db) } catch (e) { console.error('reseed inicial omitido:', e) }
  if ((await countTickets(db)) === 0) {
    console.log('Hub vacío: backfill de tickets…')
    await sync.backfillTickets()
    await sync.backfillArchivedTickets()
    try { await reseedTicketNumber(db) } catch (e) { console.error('reseed tras backfill omitido:', e) }
  }
  await sync.syncActivities().catch((e) => console.error('Sync actividades inicial falló:', e))
  await sync.syncContacts().catch((e) => console.error('Sync contactos inicial falló:', e))
  if (booksSync && (await maxLastModified(db, 'clients')) == null) {
    console.log('Books vacío: backfill…')
    await booksSync.backfillClients()
    await booksSync.backfillSalesOrders()
  }
  if (booksHubSync) {
    await migrateBooks(db)
    if ((await maxZohoLastModified(db, 'items')) == null) {
      console.log('Books rico vacío: backfill…')
      await booksHubSync.backfillContacts()
      await booksHubSync.backfillItems()
      await booksHubSync.backfillSalesOrders()
      await booksHubSync.backfillInvoices()
    }
  }
}

/** Programa los ciclos incrementales. Devuelve un stop() que limpia los timers. */
export function scheduleHubSync(deps: { sync: Sync; booksSync: BooksSync | null; booksHubSync?: BooksHubSync | null; intervalMs: number }): () => void {
  const { sync, booksSync, booksHubSync = null, intervalMs } = deps
  let syncing = false
  const timers: ReturnType<typeof setInterval>[] = []
  timers.push(setInterval(() => {
    if (syncing) return
    syncing = true
    sync.syncRecent().then(() => sync.syncActivities()).then(() => sync.syncContacts())
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, intervalMs))
  if (booksSync) {
    timers.push(setInterval(() => {
      booksSync.syncRecent().catch((e) => console.error('Books syncRecent falló:', e))
    }, intervalMs))
  }
  if (booksHubSync) {
    timers.push(setInterval(() => {
      booksHubSync.syncRecent().catch((e) => console.error('Books rico syncRecent falló:', e))
    }, intervalMs))
  }
  return () => timers.forEach((t) => clearInterval(t))
}
