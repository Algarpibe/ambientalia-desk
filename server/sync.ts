import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import { upsertTicket, upsertConversation, upsertAttachment, upsertAccount, upsertContact, upsertAgent } from './db/repo'
import { ticketRowFromZoho, conversationRowFromZoho, attachmentRowsFrom, accountRowFromZoho, contactRowFromZoho, agentRowFromZoho } from './db/mappers'

interface Deps {
  zohoFetch: (path: string, init?: RequestInit) => Promise<Response>
  db: Queryable
  config: AppConfig
}
export interface Sync {
  backfillTickets(): Promise<number>
  syncRecent(): Promise<number>
  syncTicket(id: string): Promise<void>
  syncConversations(id: string): Promise<void>
}
const PAGE_SIZE = 100
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createSync({ zohoFetch, db, config }: Deps): Sync {
  // Cachés por proceso para no re-pedir la misma cuenta/contacto en el backfill (menos riesgo de 429).
  const accountSeen = new Set<string>()
  const contactSeen = new Set<string>()

  async function ensureAccount(accountId: string | null | undefined): Promise<void> {
    if (!accountId || accountSeen.has(accountId)) return
    accountSeen.add(accountId)
    try {
      const res = await zohoFetch(`/accounts/${accountId}`)
      if (res.ok) await upsertAccount(db, accountRowFromZoho(await readData(res)))
    } catch { /* sin empresa si falla */ }
  }
  async function ensureContact(contactId: string | null | undefined): Promise<void> {
    if (!contactId || contactSeen.has(contactId)) return
    contactSeen.add(contactId)
    try {
      const res = await zohoFetch(`/contacts/${contactId}`)
      if (res.ok) {
        const c = await readData(res)
        await ensureAccount(c.accountId)
        await upsertContact(db, contactRowFromZoho(c))
      }
    } catch { /* */ }
  }

  async function persistTicket(t: any): Promise<void> {
    await ensureAccount(t.accountId)
    await ensureContact(t.contactId)
    if (t.assignee) await upsertAgent(db, agentRowFromZoho(t.assignee))
    await upsertTicket(db, ticketRowFromZoho(t))
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
  }
}
