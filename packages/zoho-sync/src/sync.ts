import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import { upsertTicket, upsertConversation, upsertAttachment, upsertAccount, upsertContact, upsertAgent } from './db/repo'
import { upsertActivity } from './db/activities'
import { upsertHistoryEvent } from './db/history'
import { ticketRowFromZoho, conversationRowFromZoho, attachmentRowsFrom, accountRowFromZoho, contactRowFromZoho, agentRowFromZoho, activityRowFromZoho } from './db/mappers'

interface Deps {
  zohoFetch: (path: string, init?: RequestInit) => Promise<Response>
  db: Queryable
  config: AppConfig
}
export interface Sync {
  backfillTickets(): Promise<number>
  backfillArchivedTickets(): Promise<number>
  syncRecent(): Promise<number>
  syncTicket(id: string): Promise<void>
  syncConversations(id: string): Promise<void>
  syncTicketHistory(id: string): Promise<void>
  syncActivities(): Promise<number>
  syncContacts(): Promise<number>
}
const PAGE_SIZE = 100
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createSync({ zohoFetch, db, config }: Deps): Sync {
  // Cachés por proceso para no re-pedir la misma cuenta/contacto en el backfill (menos riesgo de 429).
  const accountSeen = new Set<string>()
  // contactId → accountId del contacto (el endpoint de LISTA de tickets no trae accountId).
  const contactAccount = new Map<string, string | null>()

  async function ensureAccount(accountId: string | null | undefined): Promise<void> {
    if (!accountId || accountSeen.has(accountId)) return
    accountSeen.add(accountId)
    try {
      const res = await zohoFetch(`/accounts/${accountId}`)
      if (res.ok) await upsertAccount(db, accountRowFromZoho(await readData(res)))
    } catch { /* sin empresa si falla */ }
  }
  /** Asegura el contacto y devuelve su accountId (para propagarlo al ticket). */
  async function ensureContact(contactId: string | null | undefined): Promise<string | null> {
    if (!contactId) return null
    if (contactAccount.has(contactId)) return contactAccount.get(contactId)!
    let accountId: string | null = null
    try {
      const res = await zohoFetch(`/contacts/${contactId}`)
      if (res.ok) {
        const c = await readData(res)
        accountId = c.accountId ?? null
        await ensureAccount(accountId)
        await upsertContact(db, contactRowFromZoho(c))
      }
    } catch { /* */ }
    contactAccount.set(contactId, accountId)
    return accountId
  }

  async function persistTicket(t: any): Promise<void> {
    await ensureAccount(t.accountId)
    const contactAccountId = await ensureContact(t.contactId)
    if (t.assignee) await upsertAgent(db, agentRowFromZoho(t.assignee))
    const row = ticketRowFromZoho(t)
    // El endpoint de LISTA omite accountId; recuperarlo del contacto para que el JOIN dé la empresa.
    if (!row.account_id) row.account_id = contactAccountId
    await upsertTicket(db, row)
  }

  async function fetchTicketPage(from: number, sortBy = 'createdTime'): Promise<any[]> {
    const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), sortBy, include: 'contacts,assignee' })
    const res = await zohoFetch(`/tickets?${params.toString()}`)
    if (!res.ok) throw new Error(`Zoho /tickets ${res.status}`)
    return ((await readData(res)).data ?? [])
  }

  return {
    async backfillTickets(): Promise<number> {
      let from = 1, total = 0
      for (;;) {
        const pageItems = await fetchTicketPage(from)
        if (pageItems.length === 0) break
        for (const t of pageItems) await persistTicket(t)
        total += pageItems.length
        if (pageItems.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
    async backfillArchivedTickets(): Promise<number> {
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), include: 'contacts,assignee' })
        const res = await zohoFetch(`/tickets/archivedTickets?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /tickets/archivedTickets ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        for (const t of items) await persistTicket(t)
        total += items.length
        if (items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
    async syncRecent(): Promise<number> {
      const pageItems = await fetchTicketPage(1, '-recentThread')
      for (const t of pageItems) await persistTicket(t)
      return pageItems.length
    },
    async syncTicket(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}?include=contacts,assignee`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      await persistTicket(await readData(res))
    },
    async syncConversations(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}/conversations`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id}/conversations ${res.status}`)
      const items = ((await readData(res)).data ?? []) as any[]
      for (const c of items) {
        await upsertConversation(db, conversationRowFromZoho(c, id))
        for (const a of attachmentRowsFrom(c, id)) await upsertAttachment(db, a)
      }
    },
    async syncTicketHistory(id: string): Promise<void> {
      let from = 1
      for (;;) {
        const res = await zohoFetch(`/tickets/${id}/History?from=${from}&limit=${PAGE_SIZE}`)
        if (!res.ok) throw new Error(`Zoho /tickets/${id}/History ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        for (const e of items) await upsertHistoryEvent(db, id, e)
        if (items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
    },
    async syncActivities(): Promise<number> {
      const wmRow = (await db.query('SELECT max(modified_time) AS m FROM activities')).rows[0]
      const watermark = wmRow?.m ? new Date(wmRow.m).getTime() : 0
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), include: 'tickets,assignee', sortBy: '-modifiedTime' })
        const res = await zohoFetch(`/tasks?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /tasks ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        let reachedOld = false
        for (const t of items) {
          await upsertActivity(db, activityRowFromZoho(t))
          total++
          const mt = t.modifiedTime ? new Date(t.modifiedTime).getTime() : 0
          if (watermark && mt <= watermark) reachedOld = true
        }
        if (reachedOld || items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
    async syncContacts(): Promise<number> {
      const wmRow = (await db.query('SELECT max(modified_time) AS m FROM contacts')).rows[0]
      const watermark = wmRow?.m ? new Date(wmRow.m).getTime() : 0
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ from: String(from), limit: String(PAGE_SIZE), sortBy: '-modifiedTime' })
        const res = await zohoFetch(`/contacts?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /contacts ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        let reachedOld = false
        for (const c of items) {
          await ensureAccount(c.accountId)
          await upsertContact(db, contactRowFromZoho(c))
          total++
          const mt = c.modifiedTime ? new Date(c.modifiedTime).getTime() : 0
          if (watermark && mt <= watermark) reachedOld = true
        }
        if (reachedOld || items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
  }
}
