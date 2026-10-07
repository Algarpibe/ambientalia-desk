import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { upsertTicket } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { createUser } from './auth/users'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * LA REASIGNACIÓN SOBREVIVE AL SINCRONIZADOR (F1B-05, lote 3; `tickets-core` RQ-TC-51, `design.md` §6).
 *
 * El ticket «venido de Zoho» lo fabrica el PROPIO sincronizador (`upsertTicket` con `ticketRowFromZoho`), no un `INSERT`
 * a mano. Completa, con la ruta real, lo que `packages/zoho-sync/src/db/repo.test.ts` fija con un `UPDATE` a mano:
 * `derivado_a` no está en `TICKET_COLS`, así que el sincronizador no lo reescribe, y la reasignación no fija `managed_by_app`,
 * así que el estado de Zoho sigue entrando.
 */
const filaZoho = (status: string) => ticketRowFromZoho({ id: 'z1', ticketNumber: '9701', subject: 'Venido de Zoho', status, statusType: 'Open', customFields: {} })
const fila = async () => (await db.query('SELECT status, derivado_a, managed_by_app FROM tickets WHERE id = $1', ['z1'])).rows[0] as { status: string; derivado_a: string | null; managed_by_app: boolean }

describe('reasignación y sincronizador, de extremo a extremo (RQ-TC-51)', () => {
  it('tras reasignar, un nuevo upsertTicket conserva derivado_a, deja entrar el estado de Zoho y managed_by_app sigue en false', async () => {
    await upsertTicket(db, filaZoho('Ingresado'))
    expect((await fila()).managed_by_app).toBe(false)   // precondición: ningún escritor de la app lo ha tocado
    const beto = await createUser(db, { email: 'beto@x.co', name: 'Beto', passwordHash: 'h' })
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/z1/reasignar').set('Cookie', await adminCookie()).send({ destino: beto.id, motivo: 'cobertura' })
    expect(res.status).toBe(200)
    expect(await fila()).toMatchObject({ derivado_a: beto.id, status: 'Ingresado', managed_by_app: false })

    await upsertTicket(db, filaZoho('En Proceso'))
    expect(await fila()).toEqual({ status: 'En Proceso', derivado_a: beto.id, managed_by_app: false })
  })
})
