import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, reseedTicketNumber, reorgToDeskStatements, schemaStatements, DESK_TABLES, PUBLIC_TABLES, BOOKS_TABLES, APP_TICKET_NUMBER_BASE, nombresAmbiguos, altersAmbiguas, type Queryable } from './migrate'
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

  /**
   * IV-6 · LA MITAD DEL ESQUEMA QUE EL GUARDIÁN NO VEÍA.
   *
   * El extractor de arriba ancla en `^CREATE TABLE` (`:245`), así que NINGUNA `ALTER TABLE` entraba
   * en su red. No es un olvido de alcance: es que la regla dura de `CLAUDE.md` habla de «sentencia
   * de creación de tabla», y una `ALTER` no lo es. Pero **hereda su modo de fallo**: `ALTER TABLE
   * users ADD COLUMN role_id` resuelve hoy a `public.users` porque el nombre no existe en `desk`, y
   * basta una homónima en `desk` para que cambie de destino en silencio. Es exactamente la mecánica
   * de `catalogo_articulos`, con una sentencia de otra clase.
   *
   * ⚠️ Y NO ES TEÓRICO: el hueco dejó entrar una hace tres días. `schema.sql:448`
   * —`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_aviso_cliente`, de F1A-04 (`e8c5e90`)—
   * pasó sin que nada la mirase. Está BIEN sin calificar, porque `tickets` es de `DESK_TABLES`; el
   * problema es que nadie lo comprobó.
   *
   * LA REGLA TIENE DOS MITADES Y NO SE PUEDEN TRATAR IGUAL:
   *
   * - Sobre una tabla de `DESK_TABLES`, la `ALTER` va **SIN calificar**, igual que su `CREATE`, y
   *   calificarla la ROMPE: `migrate` es tolerante por sentencia y el esquema `desk` sólo existe
   *   tras `reorgToDesk`, que no corre en los tests.
   * - Sobre cualquier otra, va **CALIFICADA**, por la misma razón que su `CREATE`.
   *
   * Se reutiliza `clasificadas()` a propósito: si el guardián de `CREATE` y el de `ALTER` no leyeran
   * de la MISMA lista, podrían discrepar sobre dónde vive una tabla, que es justo el error a cazar.
   */
  function altersDelEsquema(): { identidad: string; calificada: boolean; tabla: string }[] {
    const alters: { identidad: string; calificada: boolean; tabla: string }[] = []
    for (const stmt of schemaStatements()) {
      const sql = stmt.replace(/^(?:\s*--[^\n]*\n)+/, '').trim()
      const m = /^ALTER TABLE(?:\s+IF EXISTS)?\s+(?:([a-z_][a-z0-9_]*)\.)?([a-z_][a-z0-9_]*)/i.exec(sql)
      if (m) alters.push({ identidad: m[1] ? `${m[1]}.${m[2]}` : m[2], calificada: !!m[1], tabla: m[2] })
    }
    return alters
  }

  it('toda ALTER TABLE apunta a una tabla clasificada, y con el esquema que su lista declara', () => {
    const declaradas = clasificadas()
    const huerfanas = altersDelEsquema().filter((a) => !declaradas.includes(a.identidad))
    expect(
      huerfanas.map((a) => a.identidad),
      'ALTER TABLE cuya identidad calificada no está en DESK_TABLES, public.* ni books.*',
    ).toEqual([])
  })

  /**
   * La mitad que va SIN calificar, y por qué es correcta. Se afirma en positivo —«éstas y no otras»—
   * para que añadir una `ALTER` sin calificar sobre una tabla que NO es de Desk se ponga roja aquí.
   */
  it('las ALTER sin calificar son exactamente las de DESK_TABLES, y calificarlas las rompería', () => {
    const sinCalificar = altersDelEsquema().filter((a) => !a.calificada)
    const fuera = sinCalificar.filter((a) => !(DESK_TABLES as readonly string[]).includes(a.tabla))
    expect(
      fuera.map((a) => a.tabla),
      'ALTER TABLE sin calificar sobre una tabla que no es de Desk: resuelve por search_path, no por declaración',
    ).toEqual([])
  })
  /**
   * EL RECUENTO, que es lo que delata el crecimiento silencioso.
   *
   * Las cifras de la spec `tickets-core` §5.3 —28 totales, 5 calificadas, 23 sin calificar, 10 de
   * ellas sobre Desk— quedaron CADUCAS con `e8c5e90`: al llegar aquí eran 29, 5 y 24, con 11 sobre
   * Desk. **Que se pudieran mover sin que nada lo notase es el hallazgo, no la cifra.**
   *
   * Tras F1B-01: las 13 sobre tablas de `public` van calificadas —eran el hueco de verdad— y las 11
   * de `DESK_TABLES` siguen sin calificar, que es lo correcto. Las cinco de `books.contacts` ya lo
   * estaban. Con `history_synced_at` sobre `tickets`, las sin calificar pasan a 12.
   */
  it('son 30 ALTER: 18 calificadas (13 de public + 5 de books) y 12 sin calificar, todas de Desk', () => {
    const alters = altersDelEsquema()
    expect(alters.length, 'ALTER TABLE en schema.sql').toBe(30)
    expect(alters.filter((a) => a.calificada).length, 'ALTER calificadas').toBe(18)
    expect(alters.filter((a) => !a.calificada).length, 'ALTER sin calificar').toBe(12)
    // Las tablas que reciben ALTER sin calificar, y ninguna más. En positivo: si mañana alguien mete
    // una sobre otra tabla de Desk, esta prueba lo dice; si la mete sobre una de public, lo dicen las
    // dos de arriba.
    expect(new Set(alters.filter((a) => !a.calificada).map((a) => a.tabla)), 'tablas con ALTER sin calificar')
      .toEqual(new Set(['tickets', 'equipos', 'contacts']))
    expect(new Set(alters.filter((a) => a.calificada).map((a) => a.identidad)), 'identidades calificadas')
      .toEqual(new Set(['books.contacts', 'public.users', 'public.roles', 'public.avisos', 'public.remisiones', 'public.catalogo_modelos']))
  })
})

/**
 * cerrar-hallazgos-revision-f1b-01 · P3 — el guardián de arriba (`altersDelEsquema()`, local a este
 * fichero) filtra por el nombre PELADO (`a.tabla`, `:319`), así que una `ALTER TABLE contacts` sin
 * calificar cuya intención sea `books.contacts` pasa como si fuera de `desk.contacts` — `contacts` es
 * el ÚNICO nombre que existe en las dos listas (`DESK_TABLES` y `BOOKS_TABLES`).
 *
 * Blindaje de intención, no corrección de un bug vivo: `pool.ts:5` nunca mete `books` en el
 * `search_path`, así que una `ALTER` sin calificar no puede aterrizar de verdad en `books.contacts`.
 * Lo que esto impide es que una `ALTER TABLE contacts` NUEVA entre en `schema.sql` sin que nadie decida
 * a qué esquema pertenece de verdad.
 */
describe('nombresAmbiguos / altersAmbiguas — el guardián distingue intención cuando el nombre pelado colisiona', () => {
  it('«contacts» es el único nombre ambiguo entre DESK_TABLES y BOOKS_TABLES', () => {
    expect(nombresAmbiguos()).toEqual(['contacts'])
  })

  // RED · fixture sintético, independiente de schema.sql. El clasificador señala por NOMBRE ambiguo,
  // no por las columnas: `contacts` es el único que está a la vez en `DESK_TABLES` (`migrate.ts:63`) y
  // en `BOOKS_TABLES` (`:80`). Las columnas no discriminan y no se miran — `schema.sql:11` muestra que
  // la `contacts` de Desk ya declara `raw jsonb`, igual que la de Books (`:149-152`).
  it('una ALTER TABLE contacts sin calificar, con intención de Books, queda señalada', () => {
    const fixture = 'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS raw jsonb'
    expect(altersAmbiguas([fixture])).toContain(fixture.trim())
  })

  // RED · censo real: hoy es EXACTAMENTE la de `schema.sql:256` (`modified_time`). Cualquier otra
  // `ALTER TABLE contacts` sin calificar que entre después mueve esta cifra, y es la señal de que hay
  // que decidir su esquema antes de dejarla pasar.
  it('el censo real de schema.sql es exactamente una: la de modified_time', () => {
    const ambiguas = altersAmbiguas(schemaStatements())
    expect(ambiguas).toHaveLength(1)
    expect(ambiguas[0]).toContain('modified_time')
  })
})
