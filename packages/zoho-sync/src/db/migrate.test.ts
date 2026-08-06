import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, reseedTicketNumber, reorgToDeskStatements, APP_TICKET_NUMBER_BASE, type Queryable } from './migrate'
import { nextTicketNumber } from './repo'

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
    for (const t of ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments', 'ticket_transitions', 'users', 'sessions', 'roles']) {
      expect(names).toContain(t)
    }
    // clients/sales_orders ahora son VISTAS sobre books.* (no tablas base): consultables.
    expect((await db.query('SELECT id, name, nit FROM clients')).rows).toEqual([])
    expect((await db.query('SELECT id, number, ticket_number FROM sales_orders')).rows).toEqual([])
  })

  it('reseedTicketNumber numera la app desde la base alta e ignora números de Zoho', async () => {
    const db = await freshDb()
    // un ticket de Zoho con número alto NO debe arrastrar la secuencia de la app
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('z', 958, 'Ingresado', false)")
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE) // 1.000.000, no 959
    // con un ticket de app existente, continúa desde su número
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('app1', 1000005, 'Ingresado', true)")
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(1000006)
  })

  it('tickets tiene columnas client_id y salesorder_id (Subsistema C)', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    const r = await db.query('SELECT client_id, salesorder_id FROM tickets')
    expect(r.rows).toEqual([])
  })

  it('existe equipos y tickets.equipo_id (Subsistema E)', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    expect((await db.query('SELECT id, serial, marca, modelo, tipo, cliente_nombre, active FROM equipos')).rows).toEqual([])
    expect((await db.query('SELECT equipo_id FROM tickets')).rows).toEqual([])
  })

  it('equipos tiene client_id (Subsistema F)', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    expect((await db.query('SELECT client_id FROM equipos')).rows).toEqual([])
  })

  it('crea las tablas del catálogo maestro y equipos.modelo_id', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('ctip-1','Calibrador Multigas')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('cmod-1','cmar-1','APSA-370','ctip-1')")
    const m = await db.query('SELECT id, marca_id, nombre, tipo_id, revisar, activo FROM catalogo_modelos')
    expect(m.rows[0]).toMatchObject({ id: 'cmod-1', marca_id: 'cmar-1', nombre: 'APSA-370', tipo_id: 'ctip-1', revisar: false, activo: true })
    // La columna que ata el equipo a su modelo del catálogo.
    const e = await db.query('SELECT modelo_id FROM equipos')
    expect(e.rows).toEqual([])
  })
})

describe('reorgToDeskStatements', () => {
  it('genera CREATE SCHEMA + SET SCHEMA de las 10 tablas Desk + la secuencia', () => {
    const sql = reorgToDeskStatements()
    expect(sql[0]).toBe('CREATE SCHEMA IF NOT EXISTS desk')
    for (const t of ['accounts','contacts','agents','tickets','conversations','attachments','ticket_transitions','ticket_history','activities','equipos']) {
      expect(sql).toContain(`ALTER TABLE IF EXISTS public.${t} SET SCHEMA desk`)
    }
    expect(sql).toContain('ALTER SEQUENCE IF EXISTS public.ticket_number_seq SET SCHEMA desk')
    // NO mueve app-native ni lite
    for (const t of ['users','sessions','roles','ticket_reads','resolution_attachments','clients','sales_orders']) {
      expect(sql.some((s) => s.includes(`public.${t} SET SCHEMA`))).toBe(false)
    }
  })
})
