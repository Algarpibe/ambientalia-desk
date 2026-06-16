import { migrate, reseedTicketNumber, type Queryable } from './db/migrate'
import { countTickets } from './db/repo'
import { maxLastModified } from './books/repo'
import type { Sync } from './sync'
import type { BooksSync } from './books/sync'

/** Migra el hub y hace el backfill inicial solo si está vacío. Idempotente entre reinicios. */
export async function hubBootstrap(deps: { db: Queryable; sync: Sync; booksSync: BooksSync | null }): Promise<void> {
  const { db, sync, booksSync } = deps
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
}

/** Programa los ciclos incrementales. Devuelve un stop() que limpia los timers. */
export function scheduleHubSync(deps: { sync: Sync; booksSync: BooksSync | null; intervalMs: number }): () => void {
  const { sync, booksSync, intervalMs } = deps
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
  return () => timers.forEach((t) => clearInterval(t))
}
