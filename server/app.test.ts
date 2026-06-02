import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { upsertTicket } from './db/repo'
import { ticketRowFromZoho } from './db/mappers'
import { createApp } from './app'
import type { AppConfig } from './config'

function zTicket(id: string, statusType = 'Open') {
  return { id, ticketNumber: id, subject: 'Test', status: 'Ingresado', statusType,
    createdTime: '2026-01-25T20:44:00.000Z', commentCount: '2',
    contact: { accountName: 'AGQ' }, assignee: { firstName: 'David', lastName: 'León' } }
}

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function appWith(overrides: Partial<{ enableWrites: boolean }> = {}) {
  const config = { enableWrites: false, ...overrides } as AppConfig
  const sync = { backfillTickets: vi.fn(), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn() }
  const zohoFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  const app = createApp({ db, zohoFetch, sync, config })
  return { app, sync, zohoFetch }
}

describe('GET /api/tickets', () => {
  it('devuelve tickets normalizados desde Postgres', async () => {
    await upsertTicket(db, ticketRowFromZoho(zTicket('864') as any))
    const { app } = appWith()
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
  })
})

describe('escrituras', () => {
  it('PATCH status → 403 si enableWrites=false', async () => {
    const { app, zohoFetch } = appWith({ enableWrites: false })
    const res = await request(app).patch('/api/tickets/1/status').send({ status: 'En Proceso' })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('PATCH status → llama Zoho y re-sincroniza si enableWrites=true', async () => {
    const { app, zohoFetch, sync } = appWith({ enableWrites: true })
    const res = await request(app).patch('/api/tickets/1/status').send({ status: 'En Proceso' })
    expect(res.status).toBe(200)
    expect(zohoFetch).toHaveBeenCalledWith('/tickets/1', expect.objectContaining({ method: 'PATCH' }))
    expect(sync.syncTicket).toHaveBeenCalledWith('1')
  })
})
