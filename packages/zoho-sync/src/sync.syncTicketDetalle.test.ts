import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

/**
 * relleno-completo-conversaciones (1G-01, RQ-ZS-28, D2). `syncTicket(id, detalle?)`: con el detalle ya pedido por quien llama
 * persiste ESE detalle por la vía de hoy y no pide nada del ticket; sin él hace lo de siempre (una petición de detalle).
 */
const config = { departmentId: 'DEP' } as AppConfig
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const detalle = (extra: Record<string, unknown> = {}) => ({ id: 'T1', ticketNumber: '101', subject: 'Del detalle fresco', status: 'Ingresado', commentCount: '2', threadCount: '1', ...extra })

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
})
const peticionesDeDetalle = (f: ReturnType<typeof vi.fn>) => f.mock.calls.map((c) => String(c[0])).filter((p) => p.startsWith('/tickets/'))

describe('syncTicket(id, detalle?)', () => {
  it('con detalle no pide el detalle del ticket y deja la fila persistida', async () => {
    const zohoFetch = vi.fn(async () => json({}, 500))
    await createSync({ zohoFetch, db, config }).syncTicket('T1', detalle())
    expect(peticionesDeDetalle(zohoFetch)).toEqual([])
    const f = (await db.query('SELECT number, subject FROM tickets WHERE id=$1', ['T1'])).rows[0] as { number: number; subject: string }
    expect(f).toEqual({ number: 101, subject: 'Del detalle fresco' })
  })

  it('sin detalle hace lo de hoy: una petición de detalle con include y la persiste', async () => {
    const zohoFetch = vi.fn(async () => json(detalle()))
    await createSync({ zohoFetch, db, config }).syncTicket('T1')
    expect(peticionesDeDetalle(zohoFetch)).toEqual(['/tickets/T1?include=contacts,assignee'])
    expect(Number(((await db.query('SELECT count(*) AS n FROM tickets WHERE id=$1', ['T1'])).rows[0] as { n: unknown }).n)).toBe(1)
  })

  it('sin detalle y con respuesta no ok sigue lanzando el error de hoy', async () => {
    const zohoFetch = vi.fn(async () => json({}, 404))
    await expect(createSync({ zohoFetch, db, config }).syncTicket('T1')).rejects.toThrow('Zoho /tickets/T1 404')
  })

  it('con detalle, una fila managed_by_app conserva su fila', async () => {
    await db.query("INSERT INTO tickets (id, number, subject, status, managed_by_app) VALUES ('T1', 101, 'De la app', 'Ingresado', true)")
    const zohoFetch = vi.fn(async () => json({}, 500))
    await createSync({ zohoFetch, db, config }).syncTicket('T1', detalle())
    const f = (await db.query('SELECT subject, managed_by_app FROM tickets WHERE id=$1', ['T1'])).rows[0] as { subject: string; managed_by_app: boolean }
    expect(f).toEqual({ subject: 'De la app', managed_by_app: true })
  })
})
