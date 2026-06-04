import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { upsertTicket, upsertAccount } from './db/repo'
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

describe('POST /api/tickets/:id/transition', () => {
  it('403 si enableWrites=false', async () => {
    const { app, zohoFetch } = appWith({ enableWrites: false })
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'aprobacion', values: { comment: 'ok' } })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('422 si faltan campos obligatorios', async () => {
    const { app } = appWith({ enableWrites: true })
    const res = await request(app).post('/api/tickets/1/transition').send({ transitionId: 'ingreso_a_servicio', values: {} })
    expect(res.status).toBe(422)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('ejecuta: PATCH status+cf, comentario y re-sync', async () => {
    const { app, zohoFetch, sync } = appWith({ enableWrites: true })
    const res = await request(app).post('/api/tickets/1/transition').send({
      transitionId: 'escalado_a_revision',
      values: { comment: 'a revisión', priority: 'High', 'Días de entrega': 20 },
    })
    expect(res.status).toBe(200)
    const patch = zohoFetch.mock.calls.find((c: any[]) => c[0] === '/tickets/1' && c[1]?.method === 'PATCH')
    expect(patch).toBeTruthy()
    const body = JSON.parse(patch![1].body)
    expect(body.status).toBe('Notificado')
    expect(body.priority).toBe('High')
    expect(body.cf.cf_dias_de_entrega).toBe(20)
    expect(zohoFetch).toHaveBeenCalledWith('/tickets/1/comments', expect.objectContaining({ method: 'POST' }))
    expect(sync.syncTicket).toHaveBeenCalledWith('1')
  })
})
