import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, reseedTicketNumber, reorgToDeskStatements, schemaStatements, DESK_TABLES, PUBLIC_TABLES, BOOKS_TABLES, APP_TICKET_NUMBER_BASE, type Queryable } from './migrate'
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

  /**
   * Los artículos de un modelo: accesorios, consumibles y repuestos en UNA tabla con `clase` como
   * discriminador. `item_id` NULL es lo que distingue un ítem de texto libre («Manuales») de uno
   * enlazado a `books.items` — no hace falta bandera aparte.
   */
  it('crea catalogo_articulos, con ítems enlazados y de texto libre', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    // Enlazado a un artículo real de Books.
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ('art-1','cmod-1','consumible','i1','F-001','Filtro PM10',0)")
    // De texto libre: sin item_id ni sku, porque «Manuales» no es un artículo vendible.
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre,orden) VALUES ('art-2','cmod-1','accesorio','Manuales',1)")

    const r = await db.query('SELECT id, modelo_id, clase, item_id, sku, nombre, orden, activo FROM catalogo_articulos ORDER BY id')
    expect(r.rows[0]).toMatchObject({ id: 'art-1', clase: 'consumible', item_id: 'i1', sku: 'F-001', nombre: 'Filtro PM10', activo: true })
    expect(r.rows[1]).toMatchObject({ id: 'art-2', clase: 'accesorio', item_id: null, sku: null, nombre: 'Manuales' })
  })

  // El único va sobre (modelo_id, clase, nombre) y NO sobre item_id: en los de texto libre item_id es
  // NULL, y en SQL dos NULL no colisionan, así que no impediría repetir «Manuales» diez veces.
  it('catalogo_articulos rechaza el mismo nombre repetido en la misma clase, pero lo admite en otra', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre) VALUES ('a1','cmod-1','accesorio','Manuales')")

    await expect(
      db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre) VALUES ('a2','cmod-1','accesorio','Manuales')"),
    ).rejects.toThrow()

    // El mismo artículo puede ser consumible en un modelo y accesorio en otro: eso SÍ debe poder existir.
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre) VALUES ('a3','cmod-1','consumible','Manuales')")
    expect((await db.query('SELECT count(*)::int AS n FROM catalogo_articulos')).rows[0].n).toBe(2)
  })

  /**
   * Las categorías de Books asignadas a un modelo. Son la REGLA de la que se deriva su lista de
   * artículos: un modelo AP lleva `Opcional AP Series` como accesorios y `C&R AP Series` + `C&R
   * APMA-370` como consumibles/repuestos. Guardar la regla en vez de copiar los artículos es lo que
   * hace que la lista se mantenga sola cuando Books cambia.
   */
  it('crea catalogo_modelo_categorias y admite varias categorías por clase', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','APMA-370')")
    await db.query("INSERT INTO catalogo_modelo_categorias (id,modelo_id,clase,categoria) VALUES ('cat-1','cmod-1','accesorio','Opcional AP Series')")
    // Dos de la misma clase: la de la serie y la del modelo concreto. Es el caso normal, no un borde.
    await db.query("INSERT INTO catalogo_modelo_categorias (id,modelo_id,clase,categoria) VALUES ('cat-2','cmod-1','consumible_repuesto','C&R AP Series')")
    await db.query("INSERT INTO catalogo_modelo_categorias (id,modelo_id,clase,categoria) VALUES ('cat-3','cmod-1','consumible_repuesto','C&R APMA-370')")

    const r = await db.query('SELECT clase, categoria FROM catalogo_modelo_categorias WHERE modelo_id=$1 ORDER BY id', ['cmod-1'])
    expect(r.rows.map((x: { categoria: string }) => x.categoria)).toEqual(['Opcional AP Series', 'C&R AP Series', 'C&R APMA-370'])

    // La misma categoría dos veces en la misma clase no aporta nada y duplicaría cada artículo.
    await expect(
      db.query("INSERT INTO catalogo_modelo_categorias (id,modelo_id,clase,categoria) VALUES ('cat-4','cmod-1','consumible_repuesto','C&R AP Series')"),
    ).rejects.toThrow()
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

/**
 * EL GUARDIÁN ANTI-DRIFT: TODA TABLA DE `schema.sql` ESTÁ CLASIFICADA (§9 del proposal F0-04).
 *
 * ⚠️ LA DIRECCIÓN IMPORTA, Y ES LA CONTRARIA A LA INTUITIVA. Comprobar «las 10 de `DESK_TABLES`
 * existen en `schema.sql`» es trivialmente verde y no caza nada: una tabla NUEVA no aparece en
 * `DESK_TABLES`, así que ese guardián la ignoraría justo el día en que hay algo que decidir. El que
 * sirve va al revés —TODA tabla del esquema tiene que estar en UNA de las listas—, y así una tabla
 * nueva rompe el test HASTA QUE ALGUIEN LA CLASIFIQUE.
 *
 * ES EL INCIDENTE REAL QUE FALTÓ. `catalogo_articulos` aterrizó en el esquema equivocado por un
 * `CREATE` sin calificar y hubo que moverla a mano con `ALTER TABLE … SET SCHEMA`; el comentario de
 * `schema.sql:390-391` lo deja escrito, y también por qué la suite no lo cazó: pg-mem no soporta
 * `search_path`, así que en los tests todo aterriza en `public` pase lo que pase. Este guardián lee
 * el TEXTO del fichero y no la base levantada, que es la única forma de verlo desde aquí.
 *
 * ⚠️ POR QUÉ TRES LISTAS Y NO DOS. El proposal habla de «`DESK_TABLES` (10) + `PUBLIC_TABLES` (19)»,
 * pero de esas 19 hay TRES que no están en `public`: `books.contacts`, `books.sales_orders` y
 * `books.items` viven en el esquema `books` y llegan REPLICADAS desde el hub (`schema.sql:377-386`).
 * Meterlas en una lista llamada `PUBLIC_TABLES` sería escribir en el guardián la misma clase de
 * error de esquema que el guardián existe para cazar — y además `contacts` existe en los DOS
 * esquemas, así que sin calificar las dos serían el mismo nombre. Son 10 + 16 + 3 = 29, y
 * 16 + 3 = 19: el número del proposal se conserva, partido por donde de verdad se parte.
 */
describe('el esquema no crece sin que alguien clasifique lo que añade', () => {
  /**
   * Las tablas que CREA `schema.sql`, cada una por su IDENTIDAD CALIFICADA: el esquema con el que
   * está escrita más su nombre.
   *
   * Sin prefijo se deja el nombre a secas, que es lo que la sentencia dice. En producción la app
   * conecta con `search_path=desk,public`, así que una tabla sin calificar aterriza en `desk` — que
   * es exactamente lo que se quiere de las de Zoho Desk y exactamente lo que NO se quiere del resto.
   *
   * Se lee de `schemaStatements()` y no del fichero por mi cuenta por lo mismo que la migración: si
   * algún día cambia cómo se trocea el esquema, el guardián se entera en vez de quedarse mirando un
   * fichero que ya nadie aplica igual.
   */
  function tablasDelEsquema(): string[] {
    const tablas: string[] = []
    for (const stmt of schemaStatements()) {
      // Las líneas de comentario que preceden a la sentencia viajan DENTRO de ella —`schemaStatements`
      // trocea por `;` y no por sentencia lógica—, así que hay que quitarlas antes de anclar en
      // `^CREATE TABLE`. Sin esto se colaban 11 tablas: todas las que llevan comentario encima.
      const sql = stmt.replace(/^(?:\s*--[^\n]*\n)+/, '').trim()
      const m = /^CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:([a-z_][a-z0-9_]*)\.)?([a-z_][a-z0-9_]*)/i.exec(sql)
      if (m) tablas.push(m[1] ? `${m[1]}.${m[2]}` : m[2])
    }
    return tablas
  }

  /** Las tres listas, expandidas a la misma identidad calificada con la que se leen del esquema. */
  function clasificadas(): string[] {
    return [
      ...DESK_TABLES,                              // sin calificar: se van a `desk` por el search_path
      ...PUBLIC_TABLES.map((t) => `public.${t}`),
      ...BOOKS_TABLES.map((t) => `books.${t}`),
    ]
  }

  /**
   * EL GUARDIÁN. Se compara la identidad CALIFICADA, no el nombre a secas, y por eso esta única
   * prueba caza los tres fallos: la tabla nueva sin clasificar, el nombre clasificado que ya no
   * existe, y —el incidente— la tabla que se crea en un esquema distinto del que su lista declara,
   * que aparece a la vez como huérfana con un prefijo y como fantasma con el otro.
   */
  it('toda tabla del esquema está clasificada, y en el esquema que su lista declara', () => {
    const enElEsquema = tablasDelEsquema()
    const declaradas = clasificadas()

    const sinClasificar = enElEsquema.filter((t) => !declaradas.includes(t))
    expect(sinClasificar, 'tablas de schema.sql que no están en DESK_TABLES, PUBLIC_TABLES ni BOOKS_TABLES (o que se crean en otro esquema)').toEqual([])

    const fantasmas = declaradas.filter((t) => !enElEsquema.includes(t))
    expect(fantasmas, 'nombres clasificados que ya no existen en schema.sql con ese esquema').toEqual([])
  })

  /**
   * EL RECUENTO, aparte. Los dos conjuntos de arriba se comparan por pertenencia, así que un nombre
   * declarado DOS veces —en dos listas, o repetido en la suya— pasaría las dos comprobaciones sin
   * que nadie lo notase. Aquí es donde se ve.
   */
  it('son 29 tablas: 10 de Desk, 16 de la app en public y 3 replicadas de books', () => {
    expect([DESK_TABLES.length, PUBLIC_TABLES.length, BOOKS_TABLES.length]).toEqual([10, 16, 3])
    expect(clasificadas().length, 'nombres clasificados, contando repetidos').toBe(29)
    expect(new Set(clasificadas()).size, 'nombres clasificados distintos').toBe(29)
    expect(tablasDelEsquema().length, 'CREATE TABLE en schema.sql').toBe(29)
  })
})
