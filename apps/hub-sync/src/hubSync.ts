import { migrate, reseedTicketNumber, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { countTickets } from '@ambientalia/zoho-sync/db/repo'
import { migrateBooks } from '@ambientalia/zoho-sync/booksHub/migrate'
import { maxZohoLastModified } from '@ambientalia/zoho-sync/booksHub/repo'
import { migrateCrm } from '@ambientalia/zoho-sync/crmHub/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import type { BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'
import type { CrmSync } from '@ambientalia/zoho-sync/crmHub/sync'

/** Migra el hub y hace el backfill inicial solo si está vacío. Idempotente entre reinicios. */
export async function hubBootstrap(deps: { db: Queryable; sync: Sync; booksHubSync?: BooksHubSync | null; crmSync?: CrmSync | null }): Promise<void> {
  const { db, sync, booksHubSync = null, crmSync = null } = deps
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
  if (booksHubSync) {
    await migrateBooks(db)
    if ((await maxZohoLastModified(db, 'items')) == null) {
      console.log('Books rico vacío: backfill…')
      await booksHubSync.backfillContacts()
      await booksHubSync.backfillItems()
      await booksHubSync.backfillSalesOrders()
      await booksHubSync.backfillInvoices()
    }
    // Guard aparte: los pagos pueden faltar aunque el resto de Books ya esté cargado.
    // Aislado en try/catch para que un fallo del backfill de pagos NUNCA tumbe el
    // worker (que también ingiere desk/sales/invoices). El incremental reintenta.
    if ((await maxZohoLastModified(db, 'customer_payments')) == null) {
      console.log('Books pagos vacío: backfill…')
      try {
        const n = await booksHubSync.backfillPayments()
        console.log(`Backfill de pagos: ${n} pagos`)
      } catch (e) {
        console.error('Backfill de pagos falló (se reintentará en el incremental):', e)
      }
    }
    // Guard aparte: las órdenes de compra pueden faltar aunque el resto ya esté cargado.
    if ((await maxZohoLastModified(db, 'purchase_orders')) == null) {
      console.log('Books órdenes de compra vacío: backfill…')
      try {
        const n = await booksHubSync.backfillPurchaseOrders()
        console.log(`Backfill de OC: ${n} órdenes`)
      } catch (e) {
        console.error('Backfill de OC falló (se reintentará en el incremental):', e)
      }
    }
  }
  if (crmSync) {
    await migrateCrm(db)
    await crmSync.backfillIfEmpty()
  }
}

/** Programa los ciclos incrementales. Devuelve un stop() que limpia los timers. */
export function scheduleHubSync(deps: { sync: Sync; booksHubSync?: BooksHubSync | null; crmSync?: CrmSync | null; intervalMs: number }): () => void {
  const { sync, booksHubSync = null, crmSync = null, intervalMs } = deps
  let syncing = false
  const timers: ReturnType<typeof setInterval>[] = []
  timers.push(setInterval(() => {
    if (syncing) return
    syncing = true
    sync.syncRecent().then(() => sync.syncActivities()).then(() => sync.syncContacts())
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, intervalMs))
  if (booksHubSync) {
    timers.push(setInterval(() => {
      booksHubSync.syncRecent().catch((e) => console.error('Books rico syncRecent falló:', e))
    }, intervalMs))
  }
  if (crmSync) {
    timers.push(setInterval(() => {
      crmSync.syncRecent().catch((e) => console.error('CRM syncRecent falló:', e))
    }, intervalMs))
  }
  return () => timers.forEach((t) => clearInterval(t))
}
