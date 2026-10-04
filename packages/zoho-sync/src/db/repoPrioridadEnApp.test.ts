import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertTicket, getTicketRow, TICKET_COLS } from './repo'
import { ticketRowFromZoho } from './mappers'

/**
 * propagar-top5-lista-remision-creada (F1B-07, L1) · marca por fila `prioridad_en_app_at`.
 * Molde: `repo.test.ts` (marca `ov_elegida_en_app_at`). Con la marca puesta, `upsertTicket` deja de
 * sobrescribir `priority` aunque `managed_by_app` sea `false`; el resto de columnas sigue mandando Zoho.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function zTicket(id: string, number: number, status = 'Ingresado') {
  return ticketRowFromZoho({ id, ticketNumber: String(number), status, statusType: 'Open', customFields: {} } as unknown as Parameters<typeof ticketRowFromZoho>[0])
}

describe('upsertTicket · marca prioridad_en_app_at protege priority', () => {
  it('con la marca, una prioridad distinta de Zoho no la cambia; subject sí; managed_by_app sigue false', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'High', subject: 'viejo' })
    await db.query("UPDATE tickets SET prioridad_en_app_at = now() WHERE id='1'")
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'Low', subject: 'nuevo' })
    const r = await getTicketRow(db, '1')
    expect(r!.priority).toBe('High')
    expect(r!.subject).toBe('nuevo')
    expect(r!.managed_by_app).toBe(false)
  })

  it('las dos marcas a la vez protegen la orden de venta y la prioridad; subject cambia', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'High', orden_venta: 'OV-APP', subject: 'viejo' })
    await db.query("UPDATE tickets SET prioridad_en_app_at = now(), ov_elegida_en_app_at = now() WHERE id='1'")
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'Low', orden_venta: 'OV-ZOHO', subject: 'nuevo' })
    const r = await getTicketRow(db, '1')
    expect(r!.priority).toBe('High')
    expect(r!.orden_venta).toBe('OV-APP')
    expect(r!.subject).toBe('nuevo')
  })

  it('una fila sólo con la marca de prioridad SÍ actualiza orden_venta', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'High', orden_venta: 'OV-APP' })
    await db.query("UPDATE tickets SET prioridad_en_app_at = now() WHERE id='1'")
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'Low', orden_venta: 'OV-ZOHO' })
    const r = await getTicketRow(db, '1')
    expect(r!.orden_venta).toBe('OV-ZOHO')
    expect(r!.priority).toBe('High')
  })
})

// Caracterización: nacen verdes, fijan lo que L1 no debe romper.
describe('upsertTicket · prioridad_en_app_at, caracterización', () => {
  it('sin la marca, Zoho sigue mandando sobre priority', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'High' })
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'Low' })
    expect((await getTicketRow(db, '1'))!.priority).toBe('Low')
  })

  it('managed_by_app=true gana aunque la marca esté puesta: el salto de la fila entera sigue PRIMERO', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), managed_by_app: true, priority: 'High' })
    await db.query("UPDATE tickets SET prioridad_en_app_at = now() WHERE id='1'")
    await upsertTicket(db, { ...zTicket('1', 941, 'En Proceso'), priority: 'Low' })
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('Ingresado') // ni el status se toca
    expect(r!.priority).toBe('High')
  })

  it('upsertTicket nunca escribe la marca: la fila nueva y la actualizada la dejan en NULL', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'High' })
    await upsertTicket(db, { ...zTicket('1', 941), priority: 'Low' })
    const r = await db.query('SELECT prioridad_en_app_at FROM tickets WHERE id=$1', ['1'])
    expect(r.rows[0].prioridad_en_app_at).toBeNull()
  })

  it('la marca no está en TICKET_COLS', () => {
    expect((TICKET_COLS as readonly string[]).includes('prioridad_en_app_at')).toBe(false)
  })
})
