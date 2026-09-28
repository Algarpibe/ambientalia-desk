import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import { countTickets, getTicketRow } from './db/repo'
import type { AppConfig } from './config'

const config = { departmentId: 'DEP' } as AppConfig
function page(t: unknown[]) { return new Response(JSON.stringify({ data: t }), { status: 200 }) }
function z(id: string, n: number, ordenVenta?: string) {
  return {
    id, ticketNumber: String(n), subject: 's', status: 'Ingresado', statusType: 'Open', accountId: 'a1',
    customFields: { Serial: 'SR' + id, ...(ordenVenta ? { 'Orden de Venta': ordenVenta } : {}) },
  }
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

/**
 * parche-iv11-orden-venta (F1B-11, D5). `createSync` recibe una devolución OPCIONAL que sólo cablea
 * `apps/desk/server/index.ts` (el worker de `apps/hub-sync` no la pasa, RQ-AV-13): cuando
 * `upsertTicket` detecta una discrepancia de orden de venta, `persistTicket` se la entrega.
 */
describe('createSync · alDiscrepanciaOV (D5)', () => {
  const conMarca = () => db.query(
    "INSERT INTO tickets (id, number, status, orden_venta, ov_elegida_en_app_at) VALUES ('A', 5, 'Ingresado', 'OV-APP', now())",
  )

  it('la devolución opcional recibe el descriptor una vez cuando upsertTicket detecta discrepancia', async () => {
    await conMarca()
    const recibidos: unknown[] = []
    const zohoFetch = vi.fn().mockResolvedValueOnce(page([z('A', 5, 'OV-ZOHO')])).mockResolvedValue(page([]))
    const sync = createSync({ zohoFetch, db, config, alDiscrepanciaOV: async (d) => { recibidos.push(d) } })
    await sync.syncRecent()
    expect(recibidos).toEqual([{ ticketId: 'A', numero: 5, ovApp: 'OV-APP', ovZoho: 'OV-ZOHO' }])
  })

  it('sin devolución, persistTicket no falla', async () => {
    await conMarca()
    const zohoFetch = vi.fn().mockResolvedValueOnce(page([z('A', 5, 'OV-ZOHO')])).mockResolvedValue(page([]))
    const sync = createSync({ zohoFetch, db, config })
    await expect(sync.syncRecent()).resolves.toBeDefined()
  })

  it('si la devolución lanza, el ticket sigue contando como persistido', async () => {
    await conMarca()
    const zohoFetch = vi.fn().mockResolvedValueOnce(page([z('A', 5, 'OV-ZOHO')])).mockResolvedValue(page([]))
    const sync = createSync({ zohoFetch, db, config, alDiscrepanciaOV: async () => { throw new Error('boom') } })
    const n = await sync.syncRecent()
    expect(n).toBe(1)
    expect(await getTicketRow(db, 'A')).not.toBeNull()
  })
})
