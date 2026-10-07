import { describe, it, expect, vi } from 'vitest'
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
  it('son 44 tablas: 10 de Desk, 31 de la app en public (contrato_ampliaciones, F1B-11; reasignaciones, F1B-05; garantia_proveedor, F1B-13; catalogo_novedades, F1B-04; clientes_provisionales, F1B-15; alarmas_avisadas y alarmas_corte, F1B-08; cliente_prioridad y prioridad_ajustes, F1B-07; gases_patron y certificados_fabrica, F1A-03) y 3 de books', () => {
    expect([DESK_TABLES.length, PUBLIC_TABLES.length, BOOKS_TABLES.length]).toEqual([10, 31, 3])
    expect(clasificadas().length, 'nombres clasificados, contando repetidos').toBe(44)
    expect(new Set(clasificadas()).size, 'nombres clasificados distintos').toBe(44)
    expect(tablasDelEsquema().length, 'CREATE TABLE en schema.sql').toBe(44)
  })

  // F1B-14 · RQ-HV-10: la tabla de registro de cambios de la hoja de vida existe tras `migrate`, con
  // su índice (regla de mutación 2 se aplica aparte, mutando `schema.sql`, en `apply-progress.md`).
  it('equipos_cambios existe tras migrate, con su índice (pg-mem no expone pg_indexes: basta con que el CREATE INDEX de schema.sql no reviente migrate)', async () => {
    const db = await freshDb()
    expect((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='equipos_cambios'")).rows).toHaveLength(1)
    expect((await db.query('SELECT * FROM public.equipos_cambios')).rows).toEqual([])
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
   *
   * F1B-02 (`hojas-vida`) sumó SEIS `ALTER TABLE equipos` sin calificar (`schema.sql`, al final),
   * correctas por el mismo motivo que las otras dos de `equipos` (`:208`, `:354`): `equipos` está en
   * `DESK_TABLES`. Sube de 30 a 36 (sin calificar 12→18, conjunto sin cambios). F1B-04 lo sube de 36
   * a 37 (calificadas 18→19, "14 de public"); conjunto sin calificar intacto (`remisiones` ya estaba).
   *
   * `parche-iv11-orden-venta` (F1B-11, parche 1 de 3) suma DOS `ALTER TABLE tickets` sin calificar
   * (`schema.sql`, al final): `ov_elegida_en_app_at` y `ov_zoho_avisada`, la marca de fila que protege
   * la orden de venta del sincronizador y su anti-ruido de aviso. Sube de 37 a 39 (sin calificar
   * 18→20, conjunto sin cambios: `tickets` ya estaba).
   */
  it('son 59 ALTER: 33 calificadas (28 de public + 5 de books) y 26 sin calificar, todas de Desk (de la 56.ª a la 59.ª, F1B-05: cuatro columnas de public.remisiones, calificadas; la 54.ª y la 55.ª, liberacion_motivo y fecha_prevista_facturacion de F1C-05: ALTER tickets sin calificar; la 52.ª y la 53.ª, origen y DROP NOT NULL de public.prioridad_ajustes de F1B-07 L2a, calificadas; la 51.ª, prioridad_en_app_at de F1B-07: ALTER tickets sin calificar; de la 45.ª a la 50.ª, F1B-04: seis calificadas, cuatro sobre public.remisiones y dos sobre public.remision_fotos; la 44.ª, pendiente_validar de F1B-15, es equipos sin calificar; la 40.ª, modalidad, es de blueprint-soporte-remoto: ALTER tickets sin calificar; la 41.ª, cargo_permiso de permisos-por-cargo, es public.users calificada; la 42.ª y la 43.ª son de F1A-03: compuesto sobre equipos sin calificar y sobre public.catalogo_modelos calificada)', () => {
    const alters = altersDelEsquema()
    expect(alters.length, 'ALTER TABLE en schema.sql').toBe(59)
    expect(alters.filter((a) => a.calificada).length, 'ALTER calificadas').toBe(33)
    expect(alters.filter((a) => !a.calificada).length, 'ALTER sin calificar').toBe(26)
    // Las tablas que reciben ALTER sin calificar, y ninguna más. En positivo: si mañana alguien mete
    // una sobre otra tabla de Desk, esta prueba lo dice; si la mete sobre una de public, lo dicen las
    // dos de arriba.
    expect(new Set(alters.filter((a) => !a.calificada).map((a) => a.tabla)), 'tablas con ALTER sin calificar')
      .toEqual(new Set(['tickets', 'equipos', 'contacts']))
    expect(new Set(alters.filter((a) => a.calificada).map((a) => a.identidad)), 'identidades calificadas')
      .toEqual(new Set(['books.contacts', 'public.users', 'public.roles', 'public.avisos', 'public.remisiones', 'public.catalogo_modelos', 'public.remision_fotos', 'public.prioridad_ajustes']))
  })
})

/**
 * cerrar-hallazgos-revision-f1b-01 · P3 — el guardián de arriba (`altersDelEsquema()`, local a este
 * fichero) filtra por el nombre PELADO (`a.tabla`, `:327`), así que una `ALTER TABLE contacts` sin
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

/**
 * parche-iv11-orden-venta (D1) · una fila que YA EXISTÍA con `orden_venta` puesta ANTES de correr esta
 * `ALTER` no recibe la marca por relleno automático (verify-report WARNING 2, remediación). Ejercita
 * TODAS las sentencias REALES de `schema.sql` que tocan la columna (extraídas con `schemaStatements()`,
 * no copiadas a mano) contra una tabla sintética con una fila previa: hoy es sólo la `ALTER`, y si
 * alguien añadiera un `UPDATE` de relleno junto a ella (regla de mutación 2, se ensucia el FICHERO
 * VIGILADO), el recuento de sentencias relacionadas cambia y esta prueba se pone en rojo.
 */
describe('parche-iv11-orden-venta · la ALTER de ov_elegida_en_app_at no rellena filas previas (D1, sin backfill)', () => {
  it('sólo hay UNA sentencia relacionada (la ALTER), y una fila con orden_venta previa queda con la marca en NULL', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await db.query('CREATE TABLE tickets (id text PRIMARY KEY, orden_venta text)')
    await db.query("INSERT INTO tickets (id, orden_venta) VALUES ('legacy-1', 'OV-PREVIA')")
    const relacionadas = schemaStatements().filter((s) => /ov_elegida_en_app_at/i.test(s))
    expect(relacionadas, 'sentencias de schema.sql que mencionan ov_elegida_en_app_at').toHaveLength(1)
    for (const s of relacionadas) await db.query(s)
    const r = await db.query('SELECT ov_elegida_en_app_at FROM tickets WHERE id=$1', ['legacy-1'])
    expect(r.rows[0].ov_elegida_en_app_at).toBeNull()
  })
})

/**
 * blueprint-soporte-remoto (F1B-06, cambio 2 · D5, S-9) · la columna `modalidad` nace SIN relleno ni
 * `CHECK`: las filas previas quedan con NULL y la lista blanca vive en `shared`. Regla de mutación 2:
 * se ejercitan las sentencias REALES de `schema.sql` que mencionan la columna; un `UPDATE` de relleno
 * junto a la `ALTER` cambia el recuento y esta prueba se pone roja.
 */
describe('blueprint-soporte-remoto · la ALTER de modalidad no rellena filas previas (S-9, sin backfill)', () => {
  it('sólo hay UNA sentencia relacionada (la ALTER), y una fila previa queda con modalidad en NULL', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await db.query('CREATE TABLE tickets (id text PRIMARY KEY, classification text)')
    await db.query("INSERT INTO tickets (id, classification) VALUES ('legacy-sr', 'Soporte remoto')")
    const relacionadas = schemaStatements().filter((s) => /modalidad/i.test(s))
    expect(relacionadas, 'sentencias de schema.sql que mencionan modalidad').toHaveLength(1)
    for (const s of relacionadas) await db.query(s)
    const r = await db.query('SELECT modalidad FROM tickets WHERE id=$1', ['legacy-sr'])
    expect(r.rows[0].modalidad).toBeNull()
  })
})

/**
 * alarmas-horas-habiles (F1B-08, lote 2) · LA UNICIDAD VIVE EN LA BASE, no sólo en el código.
 *
 * `public.alarmas_avisadas` no admite dos filas con la misma terna (ticket, estado, instante de
 * entrada): es lo que impide avisar dos veces la misma entrada aunque dos pasadas corran a la vez.
 * `public.alarmas_corte` tiene UNA fila (id = 1): el corte de la primera pasada (S-13) no se reescribe.
 * Se ejercita el `schema.sql` real vía `migrate`: quitar la `PRIMARY KEY` del fichero pone esto rojo
 * (regla de mutación 2).
 *
 * Hipótesis H1 de `design.md`, comprobada por ejecución el 2026-09-29: pg-mem NO cumple
 * `ON CONFLICT … DO NOTHING RETURNING` —devuelve la fila también en el conflicto—, aunque sí deja
 * de insertar. Por eso la prueba cuenta filas y no confía en el `RETURNING`; el servicio (lote 3)
 * usa `INSERT` sin `ON CONFLICT` como primera sentencia y trata el `23505` como «ya avisado» (`alarmasSla.ts`).
 */
describe('alarmas-horas-habiles · la clave de no duplicado es de la base', () => {
  const entrada = new Date('2026-09-14T13:00:00.000Z')
  const conBase = async () => { const pg = newDb().adapters.createPg(); const db = new pg.Pool(); await migrate(db); return db }
  const marcar = (db: Queryable, estado: string, at: Date, avisos: number) =>
    db.query('INSERT INTO public.alarmas_avisadas (ticket_id, estado, entrada_at, avisos_creados) VALUES ($1,$2,$3,$4)', ['t1', estado, at, avisos])
  const filas = async (db: Queryable) => Number((await db.query('SELECT count(*) AS n FROM public.alarmas_avisadas')).rows[0].n)

  it('un segundo INSERT con la misma terna falla, y con ON CONFLICT DO NOTHING no añade nada', async () => {
    const db = await conBase()
    await marcar(db, 'Notificado', entrada, 2)
    await expect(marcar(db, 'Notificado', entrada, 2)).rejects.toThrow(/duplicate key|unique/i)
    await db.query(
      `INSERT INTO public.alarmas_avisadas (ticket_id, estado, entrada_at, avisos_creados) VALUES ('t1','Notificado',$1,2)
       ON CONFLICT (ticket_id, estado, entrada_at) DO NOTHING`, [entrada])
    expect(await filas(db)).toBe(1)
  })

  it('otra entrada u otro estado del mismo ticket sí entran, con 0 o más avisos', async () => {
    const db = await conBase()
    await marcar(db, 'Notificado', entrada, 2)
    await marcar(db, 'Notificado', new Date(entrada.getTime() + 1), 0)
    await marcar(db, 'Remisión creada', entrada, 0)
    expect(await filas(db)).toBe(3)
  })

  it('alarmas_corte guarda un solo corte: un segundo id = 1 falla y ON CONFLICT conserva el primero', async () => {
    const db = await conBase()
    await db.query('INSERT INTO public.alarmas_corte (id, corte_at) VALUES (1, $1)', [entrada])
    await expect(db.query('INSERT INTO public.alarmas_corte (id, corte_at) VALUES (1, $1)', [new Date()])).rejects.toThrow(/duplicate key|unique/i)
    await db.query('INSERT INTO public.alarmas_corte (id, corte_at) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [new Date()])
    const r = await db.query('SELECT corte_at FROM public.alarmas_corte')
    expect(r.rows.map((x: { corte_at: Date }) => new Date(x.corte_at).getTime())).toEqual([entrada.getTime()])
  })
})

describe('permisos-por-cargo · la columna cargo_permiso cierra el esquema', () => {
  // RQ-PM-13 (modificado por prioridad-top5-cliente, C-1): la ALTER de cargo_permiso sigue siendo UNA, calificada y sin
  // CHECK (D-4), y ocupa la posición N-1 = 116 de las 117 sentencias que había en 29f65d1: nada se insertó por delante.
  // Las tablas de F1B-07 van DETRÁS (regla de mutación 1: la posición se prueba, no se declara).
  it('la ALTER de cargo_permiso es una sola, calificada, sin CHECK, y está en la posición 116 (nada insertado delante)', () => {
    const limpias = schemaStatements().map((s) => s.replace(/^(?:\s*--[^\n]*\n)+/, '').trim())
    const idx = limpias.map((s, i) => (/cargo_permiso/.test(s) ? i : -1)).filter((i) => i >= 0)
    expect(idx, 'sentencias que mencionan cargo_permiso').toEqual([116])
    expect(limpias[116]).toMatch(/^ALTER TABLE public\.users ADD COLUMN IF NOT EXISTS cargo_permiso text$/); expect(limpias[116]).not.toMatch(/CHECK/i)
  })
})

describe('prioridad-top5-cliente · cliente_prioridad y prioridad_ajustes cierran el esquema (F1B-07, RQ-TC-26, RQ-TC-29)', () => {
  const limpias = () => schemaStatements().map((s) => s.replace(/^(?:\s*--[^\n]*\n)+/, '').trim())
  const posicion = (re: RegExp) => limpias().findIndex((s) => re.test(s))

  it('las dos tablas existen tras migrate, en public (TC26-1, TC29-14)', async () => {
    const db = await freshDb()
    const r = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('cliente_prioridad','prioridad_ajustes')")
    expect(r.rows.map((x: { table_name: string }) => x.table_name).sort()).toEqual(['cliente_prioridad', 'prioridad_ajustes'])
  })

  it('ambas CREATE TABLE van calificadas con public., DETRÁS de la ALTER de cargo_permiso, en ese orden, y prioridad_ajustes es la 37.ª (nada insertado delante)', () => {
    const alter = posicion(/cargo_permiso/)
    const cliente = posicion(/^CREATE TABLE IF NOT EXISTS public\.cliente_prioridad\b/)
    const ajustes = posicion(/^CREATE TABLE IF NOT EXISTS public\.prioridad_ajustes\b/)
    expect(alter).toBeGreaterThan(0)
    expect(cliente, 'cliente_prioridad calificada').toBeGreaterThan(alter)
    expect(ajustes, 'prioridad_ajustes calificada').toBeGreaterThan(cliente)
    const creates = limpias().filter((s) => /^CREATE TABLE/i.test(s))
    expect(creates[36]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.prioridad_ajustes\b/)
  })

  it('el comentario que precede a las tablas no lleva punto y coma (el troceo es por ;): ninguna sentencia queda partida', () => {
    expect(limpias().filter((s) => /idx_prioridad_ajustes_ticket/.test(s))).toHaveLength(1)
    expect(limpias()[posicion(/idx_prioridad_ajustes_ticket/)]).toMatch(/^CREATE INDEX IF NOT EXISTS idx_prioridad_ajustes_ticket ON public\.prioridad_ajustes \(ticket_id\)$/)
  })

  it('el CHECK rechaza un motivo vacío con un INSERT directo (D-7) y acepta uno con texto', async () => {
    const db = await freshDb()
    await expect(db.query("INSERT INTO public.prioridad_ajustes (ticket_id, a, motivo, ajustado_por) VALUES ('t1','High','','ana')")).rejects.toThrow()
    await db.query("INSERT INTO public.prioridad_ajustes (ticket_id, a, motivo, ajustado_por) VALUES ('t1','High','cliente crítico','ana')")
    expect((await db.query('SELECT * FROM public.prioridad_ajustes')).rows).toHaveLength(1)
  })

  it('un INSERT ... ON CONFLICT (client_id) DO UPDATE repetido deja UNA fila con el último valor', async () => {
    const db = await freshDb()
    const upsert = 'INSERT INTO public.cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ($1,$2,$3,$4) ON CONFLICT (client_id) DO UPDATE SET top5=EXCLUDED.top5, prioridad=EXCLUDED.prioridad, actualizado_por=EXCLUDED.actualizado_por, actualizado_at=now()'
    await db.query(upsert, ['c1', true, 'Low', 'ana'])
    await db.query(upsert, ['c1', true, 'High', 'luis'])
    const r = await db.query('SELECT client_id, top5, prioridad, actualizado_por FROM public.cliente_prioridad')
    expect(r.rows).toEqual([{ client_id: 'c1', top5: true, prioridad: 'High', actualizado_por: 'luis' }])
  })
})

/**
 * verificacion-gas-patron-certificado (F1A-03, lote 1 · `gases-patron` RQ-GP-02, RQ-GP-06; EN12-2) · el
 * esquema aditivo cierra `schema.sql`: dos `ALTER` de `compuesto` y dos tablas CALIFICADAS en `public`,
 * sin relleno. Regla de mutación 2: lo vigilado es `schema.sql`, y las sentencias se leen de él.
 */
describe('verificacion-gas-patron-certificado · gases_patron y certificados_fabrica (F1A-03)', () => {
  const crudas = () => schemaStatements()
  const sinComentario = (s: string) => s.replace(/^(?:\s*--[^\n]*\n)+/, '').trim()
  const limpias = () => crudas().map(sinComentario)
  const posicion = (re: RegExp) => limpias().findIndex((s) => re.test(s))
  // Un segundo `migrate` sobre pg-mem salta las sentencias que ya existen con un `console.error`: se silencia aquí.
  const migrarOtraVez = async (db: Queryable) => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try { await migrate(db) } finally { aviso.mockRestore() }
  }
  const tablaEn = async (db: Queryable, esquema: string, tabla: string) =>
    (await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2', [esquema, tabla])).rows

  it('GP02-1 · tras migrar existe public.gases_patron y no existe desk.gases_patron', async () => {
    const db = await freshDb()
    expect(await tablaEn(db, 'public', 'gases_patron')).toHaveLength(1)
    expect(await tablaEn(db, 'desk', 'gases_patron')).toHaveLength(0)
    expect(await tablaEn(db, 'public', 'certificados_fabrica')).toHaveLength(1)
  })

  it('GP02-2 · migrar dos veces con una fila en gases_patron deja una sola', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO public.gases_patron (cilindro, compuesto, vence, registrado_por) VALUES ('CIL-1','SO₂','2027-01-31','ana')")
    await migrarOtraVez(db)
    const r = await db.query('SELECT cilindro, compuesto, disponible FROM public.gases_patron')
    expect(r.rows).toEqual([{ cilindro: 'CIL-1', compuesto: 'SO₂', disponible: true }])
  })

  it('GP02-3 · sin vence, sin compuesto o con disponible nulo, la fila no entra', async () => {
    const db = await freshDb()
    await expect(db.query("INSERT INTO public.gases_patron (cilindro, compuesto, registrado_por) VALUES ('C1','CO','ana')")).rejects.toThrow()
    await expect(db.query("INSERT INTO public.gases_patron (cilindro, vence, registrado_por) VALUES ('C2','2027-01-31','ana')")).rejects.toThrow()
    await expect(db.query("INSERT INTO public.gases_patron (cilindro, compuesto, disponible, vence, registrado_por) VALUES ('C3','CO',NULL,'2027-01-31','ana')")).rejects.toThrow()
    expect((await db.query('SELECT * FROM public.gases_patron')).rows).toEqual([])
    await db.query("INSERT INTO public.gases_patron (cilindro, compuesto, vence, registrado_por) VALUES ('C4','CO','2027-01-31','ana')")
    expect((await db.query('SELECT * FROM public.gases_patron')).rows).toHaveLength(1)
  })

  it('GP02-4 · PUBLIC_TABLES incluye las dos tablas nuevas', () => {
    expect(PUBLIC_TABLES).toContain('gases_patron')
    expect(PUBLIC_TABLES).toContain('certificados_fabrica')
  })

  it('GP06-1 · la columna compuesto existe en equipos y en catalogo_modelos, nula en las filas previas', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await db.query('CREATE TABLE equipos (id text PRIMARY KEY, serial text)')
    await db.query('CREATE TABLE public.catalogo_modelos (id text PRIMARY KEY, nombre text)')
    await db.query("INSERT INTO equipos (id, serial) VALUES ('e1','S1')")
    await db.query("INSERT INTO public.catalogo_modelos (id, nombre) VALUES ('m1','APSA-370')")
    const altas = crudas().filter((s) => /^ALTER TABLE[^\n]*compuesto/i.test(sinComentario(s)))
    expect(altas, 'las ALTER de compuesto en schema.sql').toHaveLength(2)
    for (const s of altas) await db.query(s)
    expect((await db.query('SELECT compuesto FROM equipos')).rows).toEqual([{ compuesto: null }])
    expect((await db.query('SELECT compuesto FROM public.catalogo_modelos')).rows).toEqual([{ compuesto: null }])
  })

  it('GP06-2 · un compuesto ya escrito en un equipo sobrevive a un segundo migrate', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO equipos (id, serial, compuesto) VALUES ('e1','S1','CO')")
    await migrarOtraVez(db)
    expect((await db.query('SELECT compuesto FROM equipos')).rows).toEqual([{ compuesto: 'CO' }])
  })

  it('sin relleno: las sentencias que mencionan compuesto son exactamente tres, las dos ALTER y el CREATE de gases_patron', () => {
    const q = crudas().filter((s) => /compuesto/i.test(s))
    expect(q, 'sentencias de schema.sql que mencionan compuesto').toHaveLength(3)
    const sql = q.map(sinComentario)
    expect(sql[0]).toMatch(/^ALTER TABLE equipos ADD COLUMN IF NOT EXISTS compuesto text$/)
    expect(sql[1]).toMatch(/^ALTER TABLE public\.catalogo_modelos ADD COLUMN IF NOT EXISTS compuesto text$/)
    expect(sql[2]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.gases_patron \(/)
  })

  it('las seis sentencias nuevas van DETRÁS de prioridad_ajustes, y son las últimas salvo las dos de F1B-15 que las siguen, en el orden del diseño', () => {
    const l = limpias()
    const ultima = posicion(/idx_prioridad_ajustes_ticket/)
    expect(ultima).toBeGreaterThan(0)
    expect(l.length, 'seis sentencias después de la de prioridad_ajustes, más las dos de clientes_provisionales y pendiente_validar (F1B-15), más las 17 de F1B-04: un CREATE, diez INSERT y seis ALTER, más la de prioridad_en_app_at (F1B-07, L1), las dos ALTER de prioridad_ajustes (F1B-07, L2a) y las dos ALTER de tickets de la liberación sin factura (F1C-05: liberacion_motivo y fecha_prevista_facturacion) y las cuatro ALTER de public.remisiones de la restauración con rastro (F1B-05) y las tres de public.garantia_proveedor (F1B-13) y las dos de public.reasignaciones (F1B-05) y la siembra de accesorio_fuera_de_lista (F1B-04, accesorios-lista-por-modelo) y las dos de public.contrato_ampliaciones (F1B-11, ampliacion-contrato)').toBe(ultima + 1 + 6 + 2 + 17 + 1 + 2 + 2 + 4 + 3 + 2 + 1 + 2)
    expect(l[ultima + 1]).toMatch(/^ALTER TABLE equipos ADD COLUMN IF NOT EXISTS compuesto\b/)
    expect(l[ultima + 2]).toMatch(/^ALTER TABLE public\.catalogo_modelos ADD COLUMN IF NOT EXISTS compuesto\b/)
    expect(l[ultima + 3]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.gases_patron\b/)
    expect(l[ultima + 4]).toMatch(/^CREATE UNIQUE INDEX IF NOT EXISTS idx_gases_patron_cilindro\b/)
    expect(l[ultima + 5]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.certificados_fabrica\b/)
    expect(l[ultima + 6]).toMatch(/^CREATE INDEX IF NOT EXISTS idx_certificados_fabrica_ticket\b/)
  })

  it('el índice único rechaza un cilindro repetido y ON CONFLICT (cilindro) DO NOTHING deja una fila', async () => {
    const db = await freshDb()
    const alta = "INSERT INTO public.gases_patron (cilindro, compuesto, vence, registrado_por) VALUES ('CIL-9',$1,'2027-01-31','ana')"
    await db.query(alta, ['CO'])
    await expect(db.query(alta, ['SO₂'])).rejects.toThrow(/duplicate key|unique/i)
    await db.query(`${alta} ON CONFLICT (cilindro) DO NOTHING`, ['H₂S'])
    expect((await db.query('SELECT cilindro, compuesto FROM public.gases_patron')).rows).toEqual([{ cilindro: 'CIL-9', compuesto: 'CO' }])
  })

  it('ninguna sentencia nueva queda partida: cada índice es una sola, tal cual', () => {
    expect(limpias().filter((s) => /idx_gases_patron_cilindro/.test(s))).toHaveLength(1)
    expect(limpias()[posicion(/idx_gases_patron_cilindro/)]).toMatch(/^CREATE UNIQUE INDEX IF NOT EXISTS idx_gases_patron_cilindro ON public\.gases_patron \(cilindro\)$/)
    expect(limpias().filter((s) => /idx_certificados_fabrica_ticket/.test(s))).toHaveLength(1)
    expect(limpias()[posicion(/idx_certificados_fabrica_ticket/)]).toMatch(/^CREATE INDEX IF NOT EXISTS idx_certificados_fabrica_ticket ON public\.certificados_fabrica \(ticket_id\)$/)
  })

  it('EN12-2 · un ticket Finalizado con su fila de liberacion queda idéntico tras un segundo migrate', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO tickets (id, number, status) VALUES ('t1','1','Finalizado')")
    await db.query("INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_by, values) VALUES ('t1','liberacion','En Proceso','Finalizado','ana',$1)", [JSON.stringify({ comment: 'ok' })])
    const antes = [(await db.query('SELECT * FROM tickets')).rows, (await db.query('SELECT * FROM ticket_transitions')).rows]
    await migrarOtraVez(db)
    const despues = [(await db.query('SELECT * FROM tickets')).rows, (await db.query('SELECT * FROM ticket_transitions')).rows]
    expect(antes[0]).toHaveLength(1)
    expect(antes[1]).toHaveLength(1)
    expect(despues).toEqual(antes)
  })
})

/**
 * alta-manual-equipo-cliente (F1B-15, RQ-ZS-16) · la tabla de clientes provisionales es de la App y
 * la vista `public.clients` NO cambia (`decision/f1b15-clientes-provisionales-sin-tocar-la-vista`).
 * La vista se compara con su texto de `132d25f`: ensuciarla (regla de mutación 2) pone rojo este guardián.
 */
describe('alta-manual-equipo-cliente · clientes_provisionales y la vista intacta (F1B-15, RQ-ZS-16)', () => {
  const limpias = () => schemaStatements().map((s) => s.replace(/\r\n/g, '\n').replace(/^(?:\s*--[^\n]*\n)+/, '').trim())
  const VISTA_CLIENTS_132D25F = `CREATE OR REPLACE VIEW public.clients AS
  SELECT contact_id AS id, contact_name AS name, company_name, nit, email,
         raw->>'contact_type' AS contact_type,
         direccion, ciudad, departamento, telefono, persona_contacto
  FROM books.contacts`

  it('la tabla existe en public, calificada, y no en desk', async () => {
    const db = await freshDb()
    const en = async (esquema: string) => (await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2', [esquema, 'clientes_provisionales'])).rows
    expect(await en('public')).toHaveLength(1)
    expect(await en('desk')).toHaveLength(0)
    expect(PUBLIC_TABLES).toContain('clientes_provisionales')
    expect(DESK_TABLES).not.toContain('clientes_provisionales')
  })

  it('guarda los cinco datos, el motivo, la traza de alta y la del enlace (D1)', async () => {
    const db = await freshDb()
    await db.query(
      `INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo, creado_por_id, creado_por_nombre)
       VALUES ('prov-1','Acme Provisional','900123456','Ana','3000000','a@acme.co','no está en Books','u1','Ana')`)
    const r = await db.query('SELECT razon_social, nit, enlazado_a, created_at IS NOT NULL AS con_fecha FROM public.clientes_provisionales')
    expect(r.rows).toEqual([{ razon_social: 'Acme Provisional', nit: '900123456', enlazado_a: null, con_fecha: true }])
    await db.query("UPDATE public.clientes_provisionales SET enlazado_a='123', enlazado_por_id='u2', enlazado_por_nombre='Luis', enlazado_at=now() WHERE id='prov-1'")
    expect((await db.query('SELECT enlazado_a FROM public.clientes_provisionales')).rows).toEqual([{ enlazado_a: '123' }])
  })

  it('equipos gana pendiente_validar, sin relleno: las filas previas quedan en NULL (D5)', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO equipos (id, serial) VALUES ('e1','S-1')")
    expect((await db.query('SELECT pendiente_validar FROM equipos')).rows).toEqual([{ pendiente_validar: null }])
    await db.query("UPDATE equipos SET pendiente_validar = true WHERE id='e1'")
    expect((await db.query('SELECT pendiente_validar FROM equipos')).rows).toEqual([{ pendiente_validar: true }])
  })

  it('la ALTER de equipos va sin calificar y el CREATE de la tabla nueva, calificado', () => {
    const alter = limpias().filter((s) => /pendiente_validar/.test(s))
    expect(alter).toHaveLength(1)
    expect(alter[0]).toMatch(/^ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean$/)
    const create = limpias().filter((s) => /clientes_provisionales/.test(s) && /^CREATE TABLE/.test(s))
    expect(create).toHaveLength(1)
    expect(create[0]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.clientes_provisionales \(/)
  })

  it('la vista public.clients es idéntica a la de 132d25f y no menciona provisionales (RQ-ZS-16)', () => {
    const vista = limpias().filter((s) => /^CREATE OR REPLACE VIEW public\.clients AS/.test(s))
    expect(vista).toHaveLength(1)
    expect(vista[0]).toBe(VISTA_CLIENTS_132D25F)
    expect(vista[0]).not.toMatch(/clientes_provisionales|provisional/i)
  })
})

/**
 * propagar-top5-lista-remision-creada (F1B-07, L1) · la ALTER de prioridad_en_app_at no rellena filas
 * previas. Regla de mutación 2: se ejercitan las sentencias REALES de `schema.sql` que mencionan la
 * columna; un `UPDATE` de relleno junto a la `ALTER` cambia el recuento y pone esto en rojo.
 */
describe('propagar-top5 (L1) · la ALTER de prioridad_en_app_at no rellena filas previas (sin backfill)', () => {
  it('sólo hay UNA sentencia relacionada (la ALTER), y una fila con priority previa queda con la marca en NULL', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await db.query('CREATE TABLE tickets (id text PRIMARY KEY, priority text)')
    await db.query("INSERT INTO tickets (id, priority) VALUES ('legacy-1', 'High')")
    const relacionadas = schemaStatements().filter((s) => /prioridad_en_app_at/i.test(s))
    expect(relacionadas, 'sentencias de schema.sql que mencionan prioridad_en_app_at').toHaveLength(1)
    for (const s of relacionadas) await db.query(s)
    const r = await db.query('SELECT prioridad_en_app_at FROM tickets WHERE id=$1', ['legacy-1'])
    expect(r.rows[0].prioridad_en_app_at).toBeNull()
  })
})

/**
 * ficha-garantia-proveedor (F1B-13, RQ-TC-45) · `public.garantia_proveedor` existe tras `migrate` y su índice único
 * por `asociacion_id` rechaza una segunda respuesta (23505). Regla de mutación 2: se ensucia `schema.sql`, no esta prueba.
 */
describe('ficha-garantia-proveedor · public.garantia_proveedor', () => {
  it('la tabla existe tras migrate y un segundo INSERT con el mismo asociacion_id da 23505', async () => {
    const db = await freshDb()
    expect((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='garantia_proveedor'")).rows).toHaveLength(1)
    const insertar = () => db.query("INSERT INTO public.garantia_proveedor (asociacion_id, ticket_id, ovi_numero, reclama, motivo_no_reclama, respondida_por) VALUES (7, 'T-1', 'OVI-1', false, 'mal_uso', 'x')")
    await insertar()
    await expect(insertar()).rejects.toMatchObject({ code: '23505' })
  })
})

/**
 * reasignacion-con-motivo (F1B-05, RQ-TZ-20) · `public.reasignaciones` y su índice (ya no cierran el esquema: siguen la siembra de F1B-04 y contrato_ampliaciones). Regla de mutación 2:
 * se ensucia `schema.sql` (sin `public.`, sin el CHECK), no esta prueba.
 */
describe('reasignacion-con-motivo · public.reasignaciones (F1B-05, RQ-TZ-20)', () => {
  const limpias = () => schemaStatements().map((s) => s.replace(/^(?:\s*--[^\n]*\n)+/, '').trim())

  it('la tabla existe tras migrate, en public, y está vacía', async () => {
    const db = await freshDb()
    expect((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='reasignaciones'")).rows).toHaveLength(1)
    expect((await db.query('SELECT * FROM public.reasignaciones')).rows).toEqual([])
  })

  it('el CREATE va calificado con public. y es la QUINTA por el final; el índice, en una sola sentencia, la cuarta; la tercera es la siembra de accesorio_fuera_de_lista (F1B-04); las dos últimas son las de contrato_ampliaciones (F1B-11)', () => {
    const l = limpias()
    expect(l[l.length - 5]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.reasignaciones \(/)
    expect(l.filter((s) => /idx_reasignaciones_ticket/.test(s))).toHaveLength(1)
    expect(l[l.length - 4]).toMatch(/^CREATE INDEX IF NOT EXISTS idx_reasignaciones_ticket ON public\.reasignaciones \(ticket_id\)$/); expect(l[l.length - 3]).toMatch(/^INSERT INTO public\.catalogo_novedades .*'accesorio_fuera_de_lista'.* ON CONFLICT \(clave\) DO NOTHING$/)
    expect(l.filter((s) => /reasignaciones/.test(s)), 'sentencias que mencionan reasignaciones').toHaveLength(2)
  })

  it('el CHECK rechaza un motivo vacío con un INSERT directo y acepta uno con texto; el origen puede ser nulo', async () => {
    const db = await freshDb()
    await expect(db.query("INSERT INTO public.reasignaciones (ticket_id, de, a, motivo, reasignado_por) VALUES ('t1','u1','u2','','ana')")).rejects.toThrow()
    await db.query("INSERT INTO public.reasignaciones (ticket_id, a, motivo, reasignado_por) VALUES ('t1','u2','vacaciones','ana')")
    const r = await db.query('SELECT de, a, motivo, reasignado_por, reasignado_at FROM public.reasignaciones')
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].de).toBeNull()
    expect(r.rows[0].reasignado_at).toBeInstanceOf(Date)
  })

  // W-2 del verify (regla de mutación 2: se muta el fichero vigilado). RQ-TZ-20: destino y actor son obligatorios.
  it('la base rechaza un INSERT directo sin destino (`a` nulo) y otro sin actor (`reasignado_por` nulo)', async () => {
    const db = await freshDb()
    await expect(db.query("INSERT INTO public.reasignaciones (ticket_id, de, a, motivo, reasignado_por) VALUES ('t1','u1',NULL,'vacaciones','ana')")).rejects.toThrow()
    await expect(db.query("INSERT INTO public.reasignaciones (ticket_id, de, a, motivo, reasignado_por) VALUES ('t1','u1','u2','vacaciones',NULL)")).rejects.toThrow()
    expect((await db.query('SELECT * FROM public.reasignaciones')).rows).toEqual([])
  })
})

/**
 * ampliacion-contrato (F1B-11, RQ-TC-54) · `public.contrato_ampliaciones` y su índice cierran el esquema. Regla de mutación 2:
 * se ensucia `schema.sql` (sin `public.`, sin un `NOT NULL`), no esta prueba.
 */
describe('ampliacion-contrato · public.contrato_ampliaciones cierra el esquema (F1B-11, RQ-TC-54)', () => {
  const limpias = () => schemaStatements().map((s) => s.replace(/^(?:\s*--[^\n]*\n)+/, '').trim())
  const insertar = (db: Queryable, c: { contrato?: string; anterior?: string; nueva?: string; motivo?: string; por?: string }) =>
    db.query('INSERT INTO public.contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, motivo, ampliado_por) VALUES ($1, $2, $3, $4, $5)',
      [c.contrato ?? '1', c.anterior ?? '2031-06-30', c.nueva ?? '2031-09-30', c.motivo ?? null, c.por ?? 'ana'])

  it('la tabla existe tras migrate, en public, y está vacía', async () => {
    const db = await freshDb()
    expect((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='contrato_ampliaciones'")).rows).toHaveLength(1)
    expect((await db.query('SELECT * FROM public.contrato_ampliaciones')).rows).toEqual([])
  })

  it('el CREATE va calificado con public. y es la PENÚLTIMA sentencia; el índice, la última; dos sentencias la mencionan', () => {
    const l = limpias()
    expect(l[l.length - 2]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.contrato_ampliaciones \(/)
    expect(l[l.length - 1]).toMatch(/^CREATE INDEX IF NOT EXISTS idx_contrato_ampliaciones_contrato ON public\.contrato_ampliaciones \(contrato_id\)$/)
    expect(l.filter((s) => /contrato_ampliaciones/.test(s)), 'sentencias que mencionan contrato_ampliaciones').toHaveLength(2)
  })

  it('la base rechaza fecha_anterior, fecha_nueva, contrato_id y ampliado_por nulos y acepta un motivo nulo', async () => {
    const db = await freshDb()
    await expect(db.query("INSERT INTO public.contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, ampliado_por) VALUES (1, NULL, '2031-09-30', 'ana')")).rejects.toThrow()
    await expect(db.query("INSERT INTO public.contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, ampliado_por) VALUES (1, '2031-06-30', NULL, 'ana')")).rejects.toThrow()
    await expect(db.query("INSERT INTO public.contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, ampliado_por) VALUES (NULL, '2031-06-30', '2031-09-30', 'ana')")).rejects.toThrow()
    await expect(db.query("INSERT INTO public.contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, ampliado_por) VALUES (1, '2031-06-30', '2031-09-30', NULL)")).rejects.toThrow()
    expect((await db.query('SELECT * FROM public.contrato_ampliaciones')).rows).toEqual([])
    await insertar(db, { motivo: undefined })
    expect((await db.query('SELECT motivo, ampliado_at FROM public.contrato_ampliaciones')).rows[0].motivo).toBeNull()
  })

  it('PUBLIC_TABLES la contiene', () => {
    expect(PUBLIC_TABLES).toContain('contrato_ampliaciones')
  })
})
