import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import { countTickets, getTicketRow } from './db/repo'
import type { AppConfig } from './config'

const config = { departmentId: 'DEP' } as AppConfig
function page(t: unknown[]) { return new Response(JSON.stringify({ data: t }), { status: 200 }) }
function z(id: string, n: number) {
  return { id, ticketNumber: String(n), subject: 's', status: 'Ingresado', statusType: 'Open', accountId: 'a1', customFields: { Serial: 'SR' + id } }
}

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('sync (tipado)', () => {
  it('backfill parsea tickets a columnas tipadas', async () => {
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(page([z('1', 1), z('2', 2)]))
      .mockResolvedValue(page([])) // páginas siguientes + contactos/cuentas/agentes ausentes
    const sync = createSync({ zohoFetch, db, config })
    await sync.backfillTickets()
    expect(await countTickets(db)).toBe(2)
    const r = await getTicketRow(db, '1')
    expect(r!.serial).toBe('SR1')
    expect(r!.number).toBe(1)
  })

  it('syncRecent aísla un ticket que colisiona y persiste el resto', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('pre',5,'p','Ingresado')")
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(page([z('A', 5), z('B', 6)])) // A choca (number 5 ya existe), B ok
      .mockResolvedValue(page([]))
    const sync = createSync({ zohoFetch, db, config })
    await expect(sync.syncRecent()).resolves.toBeDefined() // NO lanza
    expect(await getTicketRow(db, 'B')).not.toBeNull()     // el otro persistió
    expect(await getTicketRow(db, 'A')).toBeNull()         // el que colisiona, no
  })
})
