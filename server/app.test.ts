import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { upsertTicket, upsertAccount, getTicketRow } from './db/repo'
import { ticketRowFromZoho, accountRowFromZoho } from './db/mappers'
import { createApp } from './app'
import type { AppConfig } from './config'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'

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

async function authCookie(isAdmin = false): Promise<string> {
  const u = await createUser(db, { email: 'tester@x.co', name: 'Tester', passwordHash: await hashPassword('password123'), isAdmin })
  return `sid=${await createSession(db, u.id)}`
}

describe('GET /api/tickets', () => {
  it('devuelve tickets activos normalizados desde Postgres', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'AGQ' } as any))
    await upsertTicket(db, { ...ticketRowFromZoho({ id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado', statusType: 'Open', customFields: {} } as any), account_id: 'a1' })
    const cookie = await authCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
  })

  it('GET /api/tickets sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(401)
  })
})

describe('escrituras', () => {
  it('POST reply → 403 si enableWrites=false', async () => {
    const cookie = await authCookie()
    const { app, zohoFetch } = appWith({ enableWrites: false })
    const res = await request(app).post('/api/tickets/1/reply').set('Cookie', cookie).send({ content: 'hola' })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('POST /api/tickets/:id/transition (Postgres)', () => {
  it('400 si la transición es desconocida', async () => {
    const cookie = await authCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'no-existe', values: {} })
    expect(res.status).toBe(400)
  })

  it('409 si la transición no aplica desde el estado actual', async () => {
    const cookie = await authCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    // 'aprobacion' exige estar en 'Notificación cliente', no en 'Ingresado'.
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'x' } })
    expect(res.status).toBe(409)
  })

  it('422 si faltan campos obligatorios', async () => {
    const cookie = await authCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Ingresado', statusType: 'Open', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'ingreso_a_servicio', values: {} })
    expect(res.status).toBe(422)
    expect(res.body.errors.length).toBeGreaterThan(0)
  })

  it('aplica la transición en Postgres y registra al usuario como actor', async () => {
    const cookie = await authCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'aprobado' } })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('En Proceso')
    const r = await getTicketRow(db, '1')
    expect(r!.managed_by_app).toBe(true)
    const hist = await db.query('SELECT performed_by FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(hist.rows[0].performed_by).toBe('Tester')
  })
})
