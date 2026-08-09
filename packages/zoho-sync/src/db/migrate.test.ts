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

  it('catalogo_modelos rechaza el mismo modelo repetido en una marca, pero admite el mismo nombre en otra', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba'), ('cmar-2','Environics')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','6103')")
    // el mismo (marca_id, nombre) dos veces choca con el UNIQUE de la base, no solo con la comprobación del repo
    await expect(
      db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-2','cmar-1','6103')"),
    ).rejects.toThrow()
    // un 6103 de Environics y otro de Horiba son equipos distintos: el mismo nombre en OTRA marca sí debe poder existir
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-3','cmar-2','6103')")
    const r = await db.query('SELECT id, marca_id, nombre FROM catalogo_modelos ORDER BY id')
    expect(r.rows).toEqual([
      { id: 'cmod-1', marca_id: 'cmar-1', nombre: '6103' },
      { id: 'cmod-3', marca_id: 'cmar-2', nombre: '6103' },
    ])
  })

  /**
   * `books.items` tiene que existir en desk-db ANTES de suscribirla: la replicación lógica NO crea la
   * tabla en el suscriptor, solo copia filas a una que ya esté. Y el orden importa — el spike dejó
   * comprobado que el DDL primero en el hub atasca el apply del suscriptor.
   *
   * Las columnas se listan una a una a propósito: la replicación empareja por nombre, así que una que
   * falte aquí es una columna que dejará de llegar **en silencio**.
   */
  it('crea books.items con las mismas columnas que el hub, lista para replicar', async () => {
    const db = await freshDb()
    await db.query(
      `INSERT INTO books.items (item_id,name,category_id,category_name,status,rate,purchase_rate,sku,raw,zoho_last_modified)
       VALUES ('i1','Filtro PM10','cat-1','C&R EDM 180','active',150.5,100,'F-001','{"brand":"Grimm"}','2026-08-09T00:00:00Z')`,
    )
    const r = await db.query('SELECT item_id,name,category_id,category_name,status,rate,purchase_rate,sku,raw,zoho_last_modified,synced_at FROM books.items')
    expect(r.rows[0]).toMatchObject({ item_id: 'i1', name: 'Filtro PM10', category_name: 'C&R EDM 180', sku: 'F-001', status: 'active' })
    expect(r.rows[0].synced_at).toBeTruthy() // el default lo pone la BD, igual que en el hub
  })

  it('crea catalogo_documentos y catalogo_modelos.sku', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('cmod-1','cmar-1','APSA-370','SKU-123')")
    // Un documento que es ENLACE: sin fichero.
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,url) VALUES ('doc-1','cmod-1','manual','Manual de usuario','https://ejemplo/m.pdf')")
    // Y uno que es FICHERO: sin url.
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type,size) VALUES ('doc-2','cmod-1','foto','Foto','AAA','image/png',3)")

    const d = await db.query('SELECT id, modelo_id, tipo, nombre, url, content_b64 FROM catalogo_documentos ORDER BY id')
    expect(d.rows[0]).toMatchObject({ id: 'doc-1', tipo: 'manual', url: 'https://ejemplo/m.pdf', content_b64: null })
    expect(d.rows[1]).toMatchObject({ id: 'doc-2', tipo: 'foto', url: null, content_b64: 'AAA' })
    expect((await db.query('SELECT sku FROM catalogo_modelos')).rows[0].sku).toBe('SKU-123')
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
