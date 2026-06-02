import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import {
  upsertTicket, getActiveTicketsRaw, getTicketRaw, countTickets,
  upsertConversation, getConversationsRaw,
} from './repo'
import type { TicketRow, ConversationRow } from './mappers'

function ticket(id: string, statusType = 'Open'): TicketRow {
  return {
    id, ticket_number: id, status: 'Ingresado', status_type: statusType,
    created_time: `2026-01-0${id}T00:00:00.000Z`, modified_time: null,
    raw: { id, ticketNumber: id, subject: `s${id}`, status: 'Ingresado', statusType, createdTime: `2026-01-0${id}T00:00:00.000Z` } as any,
  }
}

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('tickets repo', () => {
  it('upsert inserta y luego actualiza por id', async () => {
    await upsertTicket(db, ticket('1'))
    const updated = ticket('1')
    updated.status = 'En Proceso'
    updated.raw = { ...updated.raw, status: 'En Proceso' }
    await upsertTicket(db, updated)
    expect(await countTickets(db)).toBe(1)
    const raw = await getTicketRaw(db, '1')
    expect(raw).not.toBeNull()
    expect(raw!.status).toBe('En Proceso')
  })

  it('getActiveTicketsRaw excluye cerrados', async () => {
    await upsertTicket(db, ticket('1', 'Open'))
    await upsertTicket(db, ticket('2', 'Closed'))
    const raws = await getActiveTicketsRaw(db)
    expect(raws.map((r: any) => r.id)).toEqual(['1'])
  })
})

describe('conversations repo', () => {
  it('upsert y lectura por ticket', async () => {
    const c: ConversationRow = { id: 'c1', ticket_id: '1', commented_time: null, raw: { id: 'c1' } as any }
    await upsertConversation(db, c)
    const raws = await getConversationsRaw(db, '1')
    expect(raws.map((r: any) => r.id)).toEqual(['c1'])
  })
})
