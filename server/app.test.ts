import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { upsertTicket, upsertAccount, getTicketRow } from './db/repo'
import { ticketRowFromZoho, accountRowFromZoho } from './db/mappers'
import { createApp } from './app'
import type { AppConfig } from './config'

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
  it('devuelve tickets activos normalizados desde Postgres', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'AGQ' } as any))
    await upsertTicket(db, { ...ticketRowFromZoho({ id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado', statusType: 'Open', customFields: {} } as any), account_id: 'a1' })
    const { app } = appWith()
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
  })
})

describe('escrituras', () => {
  it('POST reply → 403 si enableWrites=false', async () => {
    const { app, zohoFetch } = appWith({ enableWrites: false })
    const res = await request(app).post('/api/tickets/1/reply').send({ content: 'hola' })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('POST /api/tickets/:id/transition (Postgres)', () => {
  it('400 si la transición es desconocida', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'no-existe', values: {} })
    expect(res.status).toBe(400)
  })

  it('409 si la transición no aplica desde el estado actual', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    // 'aprobacion' exige estar en 'Notificación cliente', no en 'Ingresado'.
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'aprobacion', values: { comment: 'x' } })
    expect(res.status).toBe(409)
  })

  it('422 si faltan campos obligatorios', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'ingreso_a_servicio', values: {} })
    expect(res.status).toBe(422)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('aplica la transición en Postgres y devuelve el detalle', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'aprobacion', values: { comment: 'aprobado' } })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('En Proceso')
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso')
    expect(r!.managed_by_app).toBe(true)
  })
})
