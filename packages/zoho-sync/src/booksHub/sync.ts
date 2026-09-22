import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { upsertContact, upsertItem, upsertSalesOrder, upsertInvoice, replaceSoLines, replaceInvoiceLines, upsertCustomerPayment, replacePaymentInvoices, upsertPurchaseOrder, replacePoLines, upsertRetainerInvoice, maxZohoLastModified, type BooksTable } from './repo'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow, customerPaymentRow, paymentInvoiceRow, purchaseOrderRow, poLineRow, retainerInvoiceRow } from './mappers'
import { sweepEntity, type SweepOpts, type SweepReport, type SweepEntity } from '../sweep/sweep'

interface Deps { booksFetch: (path: string, init?: RequestInit) => Promise<Response>; db: Queryable; config: AppConfig }
export interface BooksHubSync {
  backfillContacts(): Promise<number>
  backfillItems(): Promise<number>
  backfillSalesOrders(): Promise<number>
  backfillInvoices(): Promise<number>
  backfillPayments(): Promise<number>
  backfillPurchaseOrders(): Promise<number>
  backfillRetainerInvoices(): Promise<number>
  syncRecent(): Promise<{ contacts: number; items: number; salesOrders: number; invoices: number; payments: number; purchaseOrders: number; retainerInvoices: number }>
  sweep(opts: SweepOpts): Promise<SweepReport[]>
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

  /** Todos los IDs vivos de un recurso Books (pagina hasta agotar). Lanza si una página falla → aborta el sweep de la entidad. */
  async function collectLiveIds(resource: string, key: string, idKey: string, extra: Record<string, string> = {}): Promise<Set<string>> {
    const ids = new Set<string>()
    let page = 1
    for (;;) {
      const items = await listPage(resource, key, page, extra)
      if (!items.length) break
      for (const it of items) { const id = it[idKey]; if (id != null) ids.add(String(id)) }
      if (items.length < PAGE_SIZE) break
      page++
    }
    return ids
  }

  /** Re-verifica por id en Books usando el `code` del body: Zoho Books señala "no existe" con
   *  code 1002 (no por el status HTTP). true = ausente (borrar); false = existe (code 0); lanza si
   *  es indeterminado (→ no se borra). Verificado contra ids borrados reales (2026-07-19). */
  async function verifyDeleted(resource: string, id: string): Promise<boolean> {
    const res = await booksFetch(`/${resource}/${id}?organization_id=${org}`)
    const body = await res.text()
    let code: number | undefined
    try { code = JSON.parse(body).code } catch { /* body no-JSON */ }
    if (code === 1002) return true                                  // "El recurso no existe" → ausente
    if (res.ok && (code === 0 || code === undefined)) return false  // existe
    throw new Error(`Books verify /${resource}/${id} status=${res.status} code=${code}`)
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
  async function persistPayment(header: any): Promise<void> {
    // La lista de pagos trae applied_invoices vacío → el detalle da el desglose por factura.
    const d = await fetchDetail('customerpayments', 'payment', header.payment_id)
    await upsertCustomerPayment(db, customerPaymentRow(d))
    await replacePaymentInvoices(db, d.payment_id, (d.invoices ?? []).map((inv: any) => paymentInvoiceRow(d.payment_id, inv)))
  }
  async function persistPurchaseOrder(header: any): Promise<void> {
    // El detalle trae line_items con quantity/quantity_received por artículo (para "por recibir").
    const d = await fetchDetail('purchaseorders', 'purchaseorder', header.purchaseorder_id)
    await upsertPurchaseOrder(db, purchaseOrderRow(d))
    await replacePoLines(db, d.purchaseorder_id, (d.line_items ?? []).map((l: any) => poLineRow(d.purchaseorder_id, l)))
  }
  async function persistRetainerInvoice(header: any): Promise<void> {
    // El listado no trae line_items, y la descripción de la línea («Anticipo OV-2026-167») es
    // el único enlace del anticipo con su OV: sin el detalle, hub-api no podría cruzarlo.
    const d = await fetchDetail('retainerinvoices', 'retainerinvoice', header.retainerinvoice_id)
    await upsertRetainerInvoice(db, retainerInvoiceRow(d))
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
  async function incremental(resource: string, key: string, table: BooksTable, extra: Record<string, string>, persist: (raw: any) => Promise<void>): Promise<number> {
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

  async function persistItem(header: any): Promise<void> {
    // El listado de artículos NO trae custom_fields; solo el detalle. Sin esto,
    // books.items.raw no tiene cf_centro_de_costos y la app WO-sales no puede
    // llenar las columnas de centro de costos del archivo de World Office.
    // Mismo patrón que persistSalesOrder/persistInvoice/persistPurchaseOrder.
    const d = await fetchDetail('items', 'item', header.item_id)
    await upsertItem(db, itemRow(d))
  }

  async function persistContact(header: any): Promise<void> {
    // El listado de contactos NO trae `billing_address`; solo el detalle. Sin esto, books.contacts
    // se queda sin dirección ni teléfono, y ambos se imprimen en el documento de remisión.
    // Mismo patrón que persistItem/persistSalesOrder.
    const d = await fetchDetail('contacts', 'contact', header.contact_id)
    await upsertContact(db, contactRow(d))
  }

  return {
    backfillContacts: () => backfillSimple('contacts', 'contacts', { contact_type: 'customer' }, persistContact),
    backfillItems: () => backfillSimple('items', 'items', {}, persistItem),
    backfillSalesOrders: () => backfillSimple('salesorders', 'salesorders', {}, persistSalesOrder),
    backfillInvoices: () => backfillSimple('invoices', 'invoices', {}, persistInvoice),
    backfillPayments: () => backfillSimple('customerpayments', 'customerpayments', {}, persistPayment),
    backfillPurchaseOrders: () => backfillSimple('purchaseorders', 'purchaseorders', {}, persistPurchaseOrder),
    backfillRetainerInvoices: () => backfillSimple('retainerinvoices', 'retainerinvoices', {}, persistRetainerInvoice),
    async syncRecent() {
      return {
        contacts: await incremental('contacts', 'contacts', 'contacts', { contact_type: 'customer' }, persistContact),
        items: await incremental('items', 'items', 'items', {}, persistItem),
        salesOrders: await incremental('salesorders', 'salesorders', 'sales_orders', {}, persistSalesOrder),
        invoices: await incremental('invoices', 'invoices', 'invoices', {}, persistInvoice),
        payments: await incremental('customerpayments', 'customerpayments', 'customer_payments', {}, persistPayment),
        purchaseOrders: await incremental('purchaseorders', 'purchaseorders', 'purchase_orders', {}, persistPurchaseOrder),
        retainerInvoices: await incremental('retainerinvoices', 'retainerinvoices', 'retainer_invoices', {}, persistRetainerInvoice),
      }
    },
    async sweep(opts: SweepOpts): Promise<SweepReport[]> {
      const entities: SweepEntity[] = [
        { schema: 'books', table: 'invoices', pk: 'invoice_id', childTable: 'invoice_line_items', childFk: 'invoice_id', collectLive: () => collectLiveIds('invoices', 'invoices', 'invoice_id'), confirmDeleted: (id) => verifyDeleted('invoices', id) },
        { schema: 'books', table: 'sales_orders', pk: 'salesorder_id', childTable: 'salesorder_line_items', childFk: 'salesorder_id', collectLive: () => collectLiveIds('salesorders', 'salesorders', 'salesorder_id'), confirmDeleted: (id) => verifyDeleted('salesorders', id) },
        // NOTA: el live-set de contactos NO filtra por contact_type (a diferencia del sync, que solo
        // trae customers). Si filtrara por 'customer', un contacto reclasificado en Zoho (que sigue
        // existiendo pero ya no es customer) saldría como huérfano FALSO. Enumerar TODOS los tipos
        // hace que solo se marquen los realmente borrados.
        { schema: 'books', table: 'contacts', pk: 'contact_id', collectLive: () => collectLiveIds('contacts', 'contacts', 'contact_id'), confirmDeleted: (id) => verifyDeleted('contacts', id) },
        { schema: 'books', table: 'items', pk: 'item_id', collectLive: () => collectLiveIds('items', 'items', 'item_id'), confirmDeleted: (id) => verifyDeleted('items', id) },
        // Anticipos: sin tabla hija, las líneas viven en raw. Un anticipo borrado en Zoho que
        // siguiera en la réplica dispararía en el portal un aviso falso de «sin aplicar».
        { schema: 'books', table: 'retainer_invoices', pk: 'retainerinvoice_id', collectLive: () => collectLiveIds('retainerinvoices', 'retainerinvoices', 'retainerinvoice_id'), confirmDeleted: (id) => verifyDeleted('retainerinvoices', id) },
      ]
      const reports: SweepReport[] = []
      for (const e of entities) {
        try { reports.push(await sweepEntity(db, e, opts)) }
        catch (err: any) { reports.push({ table: `books.${e.table}`, live: 0, replica: 0, orphans: 0, confirmed: 0, liveGaps: 0, uncertain: 0, deleted: 0, dryRun: opts.dryRun, skipped: `abortado: ${String(err?.message ?? err)}` }) }
      }
      return reports
    },
  }
}
