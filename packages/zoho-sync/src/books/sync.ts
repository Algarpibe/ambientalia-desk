import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { upsertClient, upsertSalesOrder, maxLastModified } from './repo'
import { clientFromBooks, salesOrderFromBooks } from './mappers'

interface Deps {
  booksFetch: (path: string, init?: RequestInit) => Promise<Response>
  db: Queryable
  config: AppConfig
}
export interface BooksSync {
  backfillClients(): Promise<number>
  backfillSalesOrders(): Promise<number>
  syncRecent(): Promise<{ clients: number; salesOrders: number }>
}
const PAGE_SIZE = 200
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createBooksSync({ booksFetch, db, config }: Deps): BooksSync {
  const org = config.booksOrgId

  async function pageContacts(page: number): Promise<any[]> {
    const p = new URLSearchParams({ organization_id: org, contact_type: 'customer', page: String(page), per_page: String(PAGE_SIZE), sort_column: 'last_modified_time', sort_order: 'D' })
    const res = await booksFetch(`/contacts?${p.toString()}`)
    if (!res.ok) throw new Error(`Books /contacts ${res.status}`)
    return (await readData(res)).contacts ?? []
  }
  async function pageSalesOrders(page: number): Promise<any[]> {
    const p = new URLSearchParams({ organization_id: org, page: String(page), per_page: String(PAGE_SIZE), sort_column: 'last_modified_time', sort_order: 'D' })
    const res = await booksFetch(`/salesorders?${p.toString()}`)
    if (!res.ok) throw new Error(`Books /salesorders ${res.status}`)
    return (await readData(res)).salesorders ?? []
  }

  async function backfillClients(): Promise<number> {
    let page = 1, total = 0
    for (;;) {
      const items = await pageContacts(page)
      if (!items.length) break
      for (const c of items) await upsertClient(db, clientFromBooks(c))
      total += items.length
      if (items.length < PAGE_SIZE) break
      page++
    }
    return total
  }
  async function backfillSalesOrders(): Promise<number> {
    let page = 1, total = 0
    for (;;) {
      const items = await pageSalesOrders(page)
      if (!items.length) break
      for (const s of items) await upsertSalesOrder(db, salesOrderFromBooks(s))
      total += items.length
      if (items.length < PAGE_SIZE) break
      page++
    }
    return total
  }

  // Incremental: descendente por last_modified; se detiene al alcanzar la marca de agua.
  async function incremental(entity: 'clients' | 'sales_orders'): Promise<number> {
    const watermark = await maxLastModified(db, entity)
    const wm = watermark ? new Date(watermark).getTime() : 0
    let page = 1, count = 0
    for (;;) {
      const items = entity === 'clients' ? await pageContacts(page) : await pageSalesOrders(page)
      if (!items.length) break
      let reachedOld = false
      for (const it of items) {
        const lmt = it.last_modified_time ? new Date(it.last_modified_time).getTime() : 0
        if (wm && lmt <= wm) { reachedOld = true; break }
        if (entity === 'clients') await upsertClient(db, clientFromBooks(it))
        else await upsertSalesOrder(db, salesOrderFromBooks(it))
        count++
      }
      if (reachedOld || items.length < PAGE_SIZE) break
      page++
    }
    return count
  }

  return {
    backfillClients,
    backfillSalesOrders,
    async syncRecent() {
      return { clients: await incremental('clients'), salesOrders: await incremental('sales_orders') }
    },
  }
}
