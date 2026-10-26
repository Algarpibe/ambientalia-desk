import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertTicket, getTicketRow, getActiveTickets, getAllTickets, getClosedTickets, getTicketWithRefs } from './repo'
import { ticketRowFromZoho } from './mappers'

// RQ-ZS-24 (filas 1, 2, 3 y 5 de la tabla de design.md): la sincronización guarda el estado normalizado y los lectores
// de repo.ts lo devuelven normalizado aunque la columna guarde dos espacios. `getTicketRow` queda crudo a propósito.
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

const DOS = 'Notificación  Comercial'
const UNO = 'Notificación Comercial'
const crudo = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status

function zoho(id: string, number: number, status: string, statusType = 'On Hold') {
  return ticketRowFromZoho({ id, ticketNumber: String(number), status, statusType, customFields: {} })
}

// Siembra a mano, sin pasar por el mapeador: así la columna conserva los dos espacios.
async function sembrarCrudo(id: string, number: number, status: string, statusType = 'On Hold') {
  await upsertTicket(db, { ...zoho(id, number, UNO, statusType), status })
}

describe('la sincronización guarda el nombre normalizado (fila 1)', () => {
  it('dos espacios de Zoho se guardan con uno', async () => {
    await upsertTicket(db, zoho('1', 1004, DOS))
    expect(await crudo('1')).toBe(UNO)
  })

  it('espacios en los extremos y repetidos se guardan limpios; un nombre limpio no cambia', async () => {
    await upsertTicket(db, zoho('2', 2, '  En   Proceso '))
    await upsertTicket(db, zoho('3', 3, 'Ingresado'))
    expect(await crudo('2')).toBe('En Proceso')
    expect(await crudo('3')).toBe('Ingresado')
  })
})

describe('los lectores de repo.ts devuelven el estado normalizado (filas 2 y 3)', () => {
  it('la precondición: la siembra a mano guarda los dos espacios', async () => {
    await sembrarCrudo('1', 1004, DOS)
    expect(await crudo('1')).toBe(DOS)
  })

  it('getActiveTickets', async () => {
    await sembrarCrudo('1', 1004, DOS)
    const r = await getActiveTickets(db)
    expect(r).toHaveLength(1)
    expect(r[0].row.status).toBe(UNO)
  })

  it('getAllTickets', async () => {
    await sembrarCrudo('1', 1004, DOS)
    const r = await getAllTickets(db)
    expect(r).toHaveLength(1)
    expect(r[0].row.status).toBe(UNO)
  })

  it('getClosedTickets', async () => {
    await sembrarCrudo('1', 1004, ' Anulado', 'Closed')
    const r = await getClosedTickets(db)
    expect(r).toHaveLength(1)
    expect(r[0].row.status).toBe('Anulado')
  })

  it('getTicketWithRefs', async () => {
    await sembrarCrudo('1', 1004, DOS)
    const r = await getTicketWithRefs(db, '1')
    expect(r!.row.status).toBe(UNO)
  })

  it('un gemelo limpio sale igual', async () => {
    await sembrarCrudo('2', 1005, UNO)
    expect((await getTicketWithRefs(db, '2'))!.row.status).toBe(UNO)
  })

  it('las lecturas no escriben: la columna sigue con dos espacios', async () => {
    await sembrarCrudo('1', 1004, DOS)
    await getActiveTickets(db); await getAllTickets(db); await getTicketWithRefs(db, '1')
    expect(await crudo('1')).toBe(DOS)
  })
})

describe('getTicketRow queda crudo a propósito (fila 5)', () => {
  it('devuelve lo que hay en la columna', async () => {
    await sembrarCrudo('1', 1004, DOS)
    expect((await getTicketRow(db, '1'))!.status).toBe(DOS)
  })
})
