import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import { upsertTicket, upsertConversation } from './db/repo'
import { ticketRowFromZoho, conversationRowFromZoho } from './db/mappers'
import type { ZohoTicketRaw, ZohoConversationRaw } from '../shared/types'

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

async function readData(res: Response): Promise<any> {
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export function createSync({ zohoFetch, db, config }: Deps): Sync {
  // Cachés por proceso (cuentas/contactos cambian rara vez) para no repetir llamadas
  // en el backfill. El endpoint de LISTA de Zoho no trae accountId, así que la empresa
  // se resuelve vía contactId → contacto.accountId → cuenta.accountName.
  const nameByAccountId = new Map<string, string>()
  const accountIdByContactId = new Map<string, string>()

  async function accountNameFromId(accountId: string): Promise<string> {
    const cached = nameByAccountId.get(accountId)
    if (cached !== undefined) return cached
    let name = ''
    try {
      const res = await zohoFetch(`/accounts/${accountId}`)
      if (res.ok) name = ((await readData(res)).accountName ?? '') as string
    } catch {
      /* empresa vacía si falla; no es crítico */
    }
    nameByAccountId.set(accountId, name)
    return name
  }

  async function accountIdFromContact(contactId: string): Promise<string> {
    const cached = accountIdByContactId.get(contactId)
    if (cached !== undefined) return cached
    let accountId = ''
    try {
      const res = await zohoFetch(`/contacts/${contactId}`)
      if (res.ok) accountId = ((await readData(res)).accountId ?? '') as string
    } catch {
      /* sin cuenta si falla */
    }
    accountIdByContactId.set(contactId, accountId)
    return accountId
  }

  // Inyecta el nombre de la empresa (accountName) en el ticket crudo antes de guardarlo.
  async function withCompany(t: ZohoTicketRaw): Promise<ZohoTicketRaw> {
    if (t.accountName) return t
    let accountId = t.accountId ?? ''
    if (!accountId && t.contactId) accountId = await accountIdFromContact(t.contactId)
    if (accountId) t.accountName = await accountNameFromId(accountId)
    return t
  }

  // Zoho Desk usa `from` 1-based. sortBy admite createdTime/recentThread/dueDate;
  // el prefijo `-` ordena descendente (no expuesto en el enum del MCP, pero válido en la API REST).
  async function fetchTicketPage(from: number, sortBy = 'createdTime'): Promise<ZohoTicketRaw[]> {
    const params = new URLSearchParams({
      departmentId: config.departmentId,
      from: String(from),
      limit: String(PAGE_SIZE),
      sortBy,
    })
    const res = await zohoFetch(`/tickets?${params.toString()}`)
    if (!res.ok) throw new Error(`Zoho /tickets ${res.status}: ${await res.text()}`)
    return ((await readData(res)).data ?? []) as ZohoTicketRaw[]
  }

  async function upsertTickets(tickets: ZohoTicketRaw[]): Promise<void> {
    for (const t of tickets) await upsertTicket(db, ticketRowFromZoho(await withCompany(t)))
  }

  return {
    async backfillTickets(): Promise<number> {
      let from = 1 // Zoho `from` es 1-based; avanzar en pasos de PAGE_SIZE: 1, 101, 201…
      let total = 0
      for (;;) {
        const page = await fetchTicketPage(from)
        if (page.length === 0) break
        await upsertTickets(page)
        total += page.length
        if (page.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },

    async syncRecent(): Promise<number> {
      // Más recientemente activos primero, para captar cambios en tickets antiguos.
      const page = await fetchTicketPage(1, '-recentThread')
      await upsertTickets(page)
      return page.length
    },

    async syncTicket(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}?include=contacts,assignee`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      await upsertTicket(db, ticketRowFromZoho(await withCompany((await readData(res)) as ZohoTicketRaw)))
    },

    async syncConversations(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}/conversations`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id}/conversations ${res.status}`)
      const items = ((await readData(res)).data ?? []) as ZohoConversationRaw[]
      for (const c of items) await upsertConversation(db, conversationRowFromZoho(c, id))
    },
  }
}
