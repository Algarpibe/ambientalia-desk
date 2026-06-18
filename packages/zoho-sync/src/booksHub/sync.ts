import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { upsertContact, upsertItem, upsertSalesOrder, upsertInvoice, replaceSoLines, replaceInvoiceLines, maxZohoLastModified } from './repo'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow } from './mappers'

interface Deps { booksFetch: (path: string, init?: RequestInit) => Promise<Response>; db: Queryable; config: AppConfig }
export interface BooksHubSync {
  backfillContacts(): Promise<number>
  backfillItems(): Promise<number>
  backfillSalesOrders(): Promise<number>
  backfillInvoices(): Promise<number>
  syncRecent(): Promise<{ contacts: number; items: number; salesOrders: number; invoices: number }>
}
const PAGE_SIZE = 200
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createBooksHubSync({ booksFetch, db, config }: Deps): BooksHubSync {
  const org = config.booksOrgId

  function listPath(resource: string, page: number, extra: Record<string, string> = {}): string {
    const p = new URLSearchParams({ organization_id: org, page: String(page), per_page: String(PAGE_SIZE), sort_column: 'last_modified_time', sort_order: 'D', ...extra })
    return `/${resource}?${p.toString()}`
  }
  async function listPage(resource: string, key: string, page: number, extra?: Record<string, string>): Promise<any[]> {
    const res = await booksFetch(listPath(resource, page, extra))
    if (!res.ok) throw new Error(`Books /${resource} ${res.status}`)
    return (await readData(res))[key] ?? []
  }
  async function fetchDetail(resource: string, key: string, id: string): Promise<any> {
    const res = await booksFetch(`/${resource}/${id}?organization_id=${org}`)
    if (!res.ok) throw new Error(`Books /${resource}/${id} ${res.status}`)
    return (await readData(res))[key] ?? {}
  }

  /** Aplica fn a cada item aislando fallos por-documento (un malo no aborta el lote). Devuelve OK count. */
  async function forEachSafe<T>(items: T[], fn: (t: T) => Promise<void>): Promise<number> {
    let ok = 0
    for (const it of items) {
      try { await fn(it); ok++ }
      catch (e: any) { console.error('booksHub item falló:', String(e?.message ?? e)) }
    }
    return ok
  }

  async function persistSalesOrder(header: any): Promise<void> {
    const d = await fetchDetail('salesorders', 'salesorder', header.salesorder_id)
    await upsertSalesOrder(db, salesOrderRow(d))
    await replaceSoLines(db, d.salesorder_id, (d.line_items ?? []).map((l: any) => soLineRow(d.salesorder_id, l)))
  }
  async function persistInvoice(header: any): Promise<void> {
    const d = await fetchDetail('invoices', 'invoice', header.invoice_id)
    await upsertInvoice(db, invoiceRow(d))
    await replaceInvoiceLines(db, d.invoice_id, (d.line_items ?? []).map((l: any) => invoiceLineRow(d.invoice_id, l)))
  }

  // ── Backfill (todas las páginas) ──
  async function backfillSimple(resource: string, key: string, extra: Record<string, string>, persist: (raw: any) => Promise<void>): Promise<number> {
    let page = 1, total = 0
    for (;;) {
      const items = await listPage(resource, key, page, extra)
      if (!items.length) break
      total += await forEachSafe(items, persist)
      if (items.length < PAGE_SIZE) break
      page++
    }
    return total
  }

  // ── Incremental (corta al alcanzar la marca de agua) ──
  async function incremental(resource: string, key: string, table: 'contacts' | 'items' | 'sales_orders' | 'invoices', extra: Record<string, string>, persist: (raw: any) => Promise<void>): Promise<number> {
    const watermark = await maxZohoLastModified(db, table)
    const wm = watermark ? new Date(watermark).getTime() : 0
    let page = 1, count = 0
    for (;;) {
      const items = await listPage(resource, key, page, extra)
      if (!items.length) break
      const fresh: any[] = []
      let reachedOld = false
      for (const it of items) {
        const lmt = it.last_modified_time ? new Date(it.last_modified_time).getTime() : 0
        if (wm && lmt <= wm) { reachedOld = true; break }
        fresh.push(it)
      }
      count += await forEachSafe(fresh, persist)
      if (reachedOld || items.length < PAGE_SIZE) break
      page++
    }
    return count
  }

  const persistContact = (raw: any) => upsertContact(db, contactRow(raw))
  const persistItem = (raw: any) => upsertItem(db, itemRow(raw))

  return {
    backfillContacts: () => backfillSimple('contacts', 'contacts', { contact_type: 'customer' }, persistContact),
    backfillItems: () => backfillSimple('items', 'items', {}, persistItem),
    backfillSalesOrders: () => backfillSimple('salesorders', 'salesorders', {}, persistSalesOrder),
    backfillInvoices: () => backfillSimple('invoices', 'invoices', {}, persistInvoice),
    async syncRecent() {
      return {
        contacts: await incremental('contacts', 'contacts', 'contacts', { contact_type: 'customer' }, persistContact),
        items: await incremental('items', 'items', 'items', {}, persistItem),
        salesOrders: await incremental('salesorders', 'salesorders', 'sales_orders', {}, persistSalesOrder),
        invoices: await incremental('invoices', 'invoices', 'invoices', {}, persistInvoice),
      }
    },
  }
}
