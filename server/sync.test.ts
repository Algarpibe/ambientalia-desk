import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import { countTickets, getConversationsRaw } from './db/repo'
import type { AppConfig } from './config'

const config = { departmentId: 'DEP' } as AppConfig

function page(tickets: unknown[]) {
  return new Response(JSON.stringify({ data: tickets }), { status: 200 })
}
function z(id: string) {
  return { id, ticketNumber: id, subject: 's', status: 'Ingresado', statusType: 'Open', createdTime: '2026-01-01T00:00:00.000Z' }
}

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('sync', () => {
  it('backfill pagina hasta vaciar y hace upsert', async () => {
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(page([z('1'), z('2')]))
      .mockResolvedValueOnce(page([])) // página vacía corta el bucle
    const sync = createSync({ zohoFetch, db, config })
    await sync.backfillTickets()
    expect(await countTickets(db)).toBe(2)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('departmentId=DEP')
  })

  it('syncConversations trae y guarda las conversaciones del ticket', async () => {
    const zohoFetch = vi.fn().mockResolvedValue(page([{ id: 'c1' }, { id: 'c2' }]))
    const sync = createSync({ zohoFetch, db, config })
    await sync.syncConversations('1')
    const raws = await getConversationsRaw(db, '1')
    expect(raws.map((r: any) => r.id)).toEqual(['c1', 'c2'])
  })

  it('syncTicket trae un ticket y lo upserta', async () => {
    const zohoFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(z('9')), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config })
    await sync.syncTicket('9')
    expect(await countTickets(db)).toBe(1)
  })
})
