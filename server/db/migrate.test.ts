import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, reseedTicketNumber, type Queryable } from './migrate'

async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg()
  const db = new pg.Pool()
  await migrate(db)
  return db
}

describe('migrate', () => {
  it('crea las tablas del esquema híbrido', async () => {
    const db = await freshDb()
    const res = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
    )
    const names = res.rows.map((r: { table_name: string }) => r.table_name)
    for (const t of ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments', 'ticket_transitions', 'users', 'sessions']) {
      expect(names).toContain(t)
    }
  })

  it('reseedTicketNumber deja la secuencia en el máximo number', async () => {
    const db = await freshDb()
    await db.query(
      "INSERT INTO tickets (id, number, status) VALUES ('a', 953, 'Ingresado')",
    )
    await reseedTicketNumber(db)
    const res = await db.query("SELECT nextval('ticket_number_seq') AS n")
    expect(Number(res.rows[0].n)).toBe(954)
  })
})
