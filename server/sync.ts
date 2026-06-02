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
  async function fetchTicketPage(from: number): Promise<ZohoTicketRaw[]> {
    const params = new URLSearchParams({
      departmentId: config.departmentId,
      from: String(from),
      limit: String(PAGE_SIZE),
      sortBy: 'createdTime',
    })
    const res = await zohoFetch(`/tickets?${params.toString()}`)
    if (!res.ok) throw new Error(`Zoho /tickets ${res.status}: ${await res.text()}`)
    return ((await readData(res)).data ?? []) as ZohoTicketRaw[]
  }

  async function upsertTickets(tickets: ZohoTicketRaw[]): Promise<void> {
    for (const t of tickets) await upsertTicket(db, ticketRowFromZoho(t))
  }

  return {
    async backfillTickets(): Promise<number> {
      let from = 0
      let total = 0
      for (;;) {
        const page = await fetchTicketPage(from === 0 ? 1 : from)
        if (page.length === 0) break
        await upsertTickets(page)
        total += page.length
        if (page.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },

    async syncRecent(): Promise<number> {
      const page = await fetchTicketPage(1)
      await upsertTickets(page)
      return page.length
    },

    async syncTicket(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}?include=contacts,assignee`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      await upsertTicket(db, ticketRowFromZoho((await readData(res)) as ZohoTicketRaw))
    },

    async syncConversations(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}/conversations`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id}/conversations ${res.status}`)
      const items = ((await readData(res)).data ?? []) as ZohoConversationRaw[]
      for (const c of items) await upsertConversation(db, conversationRowFromZoho(c, id))
    },
  }
}
