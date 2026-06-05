import { describe, it, expect, vi } from 'vitest'
import { createDetailBackfiller } from './backfill'
import type { AppConfig } from './config'

const config = { departmentId: 'DEP' } as AppConfig

function json(obj: unknown) {
  return new Response(JSON.stringify(obj), { status: 200 })
}

describe('detail backfiller', () => {
  it('recorre todos los tickets y sincroniza detalle + conversaciones de cada uno', async () => {
    const zohoFetch = vi.fn(async (path: string) => {
      if (path.startsWith('/tickets?')) {
        const pageCalls = zohoFetch.mock.calls.filter((c) => String(c[0]).startsWith('/tickets?')).length
        return pageCalls === 1 ? json({ data: [{ id: '1' }, { id: '2' }] }) : json({ data: [] })
      }
      return json({ data: [] })
    })
    const sync = {
      backfillTickets: vi.fn(),
      syncRecent: vi.fn(),
      syncTicket: vi.fn(async () => {}),
      syncConversations: vi.fn(async () => {}),
      syncActivities: vi.fn(),
      syncTicketHistory: vi.fn(),
    }

    const b = createDetailBackfiller({ zohoFetch, sync, config, delayMs: 0 })
    b.start()
    for (let i = 0; i < 50 && !b.state().done; i++) await new Promise((r) => setTimeout(r, 5))

    const s = b.state()
    expect(s.done).toBe(true)
    expect(s.ticketsProcessed).toBe(2)
    expect(sync.syncTicket).toHaveBeenCalledWith('1')
    expect(sync.syncTicket).toHaveBeenCalledWith('2')
    expect(sync.syncConversations).toHaveBeenCalledTimes(2)
  })

  it('cuenta errores por ticket sin abortar el recorrido', async () => {
    const zohoFetch = vi.fn(async (path: string) => {
      if (path.startsWith('/tickets?')) {
        const pageCalls = zohoFetch.mock.calls.filter((c) => String(c[0]).startsWith('/tickets?')).length
        return pageCalls === 1 ? json({ data: [{ id: '1' }, { id: '2' }] }) : json({ data: [] })
      }
      return json({ data: [] })
    })
    const sync = {
      backfillTickets: vi.fn(),
      syncRecent: vi.fn(),
      syncTicket: vi.fn(async (id: string) => { if (id === '1') throw new Error('boom') }),
      syncConversations: vi.fn(async () => {}),
      syncActivities: vi.fn(),
      syncTicketHistory: vi.fn(),
    }

    const b = createDetailBackfiller({ zohoFetch, sync, config, delayMs: 0 })
    b.start()
    for (let i = 0; i < 50 && !b.state().done; i++) await new Promise((r) => setTimeout(r, 5))

    const s = b.state()
    expect(s.done).toBe(true)
    expect(s.ticketsProcessed).toBe(2)
    expect(s.errors).toBe(1)
  })
})
