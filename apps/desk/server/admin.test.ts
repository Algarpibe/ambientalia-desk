import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { REMISIONES_HISTORICAS } from './db/remisionesHistoricasSeed'
import { createApp } from './app'
import { clearAnalisisCache } from './analisis'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { createUser } from './auth/users'
import { hashPassword } from './auth/passwords'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

describe('GET /api/personas', () => {
  it('sin sesión responde 401', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/personas')).status).toBe(401)
  })

  it('un usuario NO administrador puede pedirla', async () => {
    const cookie = await userCookie(['Servicio Técnico'])
    const { app } = appWith()
    const res = await request(app).get('/api/personas').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: expect.any(String), nombre: 'Op', cargo: null }])
  })

  // Derivar a alguien que ya no trabaja aquí es una vía muerta: el ticket queda con un responsable
  // que nunca lo va a abrir.
  it('no ofrece a los usuarios dados de baja', async () => {
    const cookie = await adminCookie()
    const baja = await createUser(db, { email: 'baja@x.co', name: 'Baja', passwordHash: await hashPassword('password123') })
    await db.query('UPDATE users SET active = false WHERE id = $1', [baja.id])
    const { app } = appWith()

    const res = await request(app).get('/api/personas').set('Cookie', cookie)
    expect(res.body.map((p: { nombre: string }) => p.nombre)).toEqual(['Admin'])
  })

  /**
   * La aserción que impide el atajo de reutilizar `listUsers`: sería una línea, funcionaría, y
   * publicaría a todo el mundo quién es administrador y qué áreas tiene cada rol.
   */
  it('no publica correo, áreas ni si es administrador', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app } = appWith()
    const res = await request(app).get('/api/personas').set('Cookie', cookie)
    expect(Object.keys(res.body[0]).sort()).toEqual(['cargo', 'id', 'nombre'])
  })
})

/**
 * Derivar el ticket a una persona en cualquier etapa. Es opcional, así que la etapa tiene que poder
 * ejecutarse sin ella; y es una FK de hecho contra `users`, así que el servidor la valida.
 */

describe('Seguridad: helmet + rate-limit', () => {
  it('helmet añade cabeceras de seguridad', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/auth/login').send()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
  it('rate-limit: bloquea login tras demasiados intentos', async () => {
    const { app } = appWith()
    let last: any
    for (let i = 0; i < 11; i++) last = await request(app).post('/api/auth/login').send({ email: 'no@x.co', password: 'mal' })
    expect(last.status).toBe(429)
  })
})

describe('Error-handler central', () => {
  it('error no manejado → 500 genérico (sin filtrar el mensaje)', async () => {
    const config = { enableWrites: false } as AppConfig
    const sync = { backfillTickets: vi.fn(), backfillArchivedTickets: vi.fn().mockResolvedValue(0), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn(), syncActivities: vi.fn(), syncTicketHistory: vi.fn(), backfillTicketHistory: vi.fn(), syncContacts: vi.fn() } as any
    const zohoFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const cookie = await adminCookie() // sesión válida en la BD real (requireAuth la valida antes de getContacts)
    const boomDb = { query: (sql: string, params?: unknown[]) => {
      if (/FROM sessions|FROM users/i.test(sql)) return db.query(sql, params) // deja pasar la autenticación
      throw new Error('detalle-interno-secreto')
    } } as unknown as Queryable
    const app = createApp({ db: boomDb, zohoFetch, sync, config })
    const res = await request(app).get('/api/contacts').set('Cookie', cookie)
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Error interno')
    expect(JSON.stringify(res.body)).not.toContain('detalle-interno-secreto')
  })
})

describe('Límite de subida', () => {
  // A propósito NO se deriva de la constante del servidor: si el test leyera el mismo número que el
  // código, cambiarlo nunca rompería nada. Aquí "11 MB" es el dato de entrada, y "10 MB" el contrato.
  const demasiadoGrande = () => Buffer.alloc(11 * 1024 * 1024)

  it('ficha técnica: por encima del límite responde 413 diciendo cuál es el límite', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/catalogo/modelos/m1/documentos').set('Cookie', cookie)
      .field('tipo', 'manual').field('nombre', 'Manual')
      .attach('archivo', demasiadoGrande(), { filename: 'manual.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(413)
    expect(res.body.error).toContain('10 MB')
  })

  // Las otras dos puertas comparten el mismo multer y el mismo manejador: si el arreglo fuera un parche
  // por ruta, estas dos seguirían en 500. Por eso se prueban las tres y no solo la que motivó el cambio.
  it('fotos de remisión: por encima del límite responde 413', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/remisiones/r1/fotos').set('Cookie', cookie)
      .attach('file', demasiadoGrande(), { filename: 'equipo.png', contentType: 'image/png' })
    expect(res.status).toBe(413)
    expect(res.body.error).toContain('10 MB')
  })

  it('adjuntos de resolución: por encima del límite responde 413', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie)
      .attach('file', demasiadoGrande(), { filename: 'a.png', contentType: 'image/png' })
    expect(res.status).toBe(413)
    expect(res.body.error).toContain('10 MB')
  })

  // El nombre del campo no es el mismo en las tres rutas ('archivo' en el catálogo, 'file' en las otras),
  // así que equivocarlo es un error real y frecuente. Es culpa del cliente: 400, no el 500 de antes.
  it('un campo de fichero inesperado responde 400, no 500', async () => {
    const { app } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/tickets/t1/resolution/attachments').set('Cookie', cookie)
      .attach('campo-que-no-espera', Buffer.from('hola'), { filename: 'a.png', contentType: 'image/png' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/clients y /api/sales-orders (Books)', () => {
  it('busca clientes (con sesión)', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,nit) VALUES ('c1','Camposol Colombia S.A.S.','901116362')")
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=campo').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'c1', nit: '901116362' })
  })

  it('busca órdenes de venta (con sesión)', async () => {
    const cookie = await adminCookie()
    // `order_status: open` = "Confirmado" en Zoho; el buscador solo ofrece esas (ver books/repo).
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ('s1','OV-2026-117','Corola','2026-06-01','open','{\"order_status\":\"open\"}')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ('s2','OV-2026-118','Corola','2026-06-02','invoiced','{\"order_status\":\"closed\"}')")
    const { app } = appWith()
    const res = await request(app).get('/api/sales-orders?search=OV-2026').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((s: { id: string }) => s.id)).toEqual(['s1']) // la facturada no se ofrece
    expect(res.body[0]).toMatchObject({ id: 's1', number: 'OV-2026-117' })
  })

  // `sales_orders.date` es una columna `date`: pg la entrega como Date y al serializar sale un ISO
  // completo. El `<input type="date">` que la recibe en el formulario de transición exige
  // `YYYY-MM-DD` EXACTO y ante cualquier otra cosa se queda en blanco, sin avisar de nada — que es
  // como se vio: orden de venta elegida y fecha vacía.
  it('la fecha de la orden de venta sale como YYYY-MM-DD, no como instante', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ('sf','OV-FECHA','Corola','2026-07-15','open','{\"order_status\":\"open\"}')")
    const { app } = appWith()
    const res = await request(app).get('/api/sales-orders?search=OV-FECHA').set('Cookie', cookie)
    expect(res.body[0].date).toBe('2026-07-15')
  })

  // Una OV ya usada por otro ticket no está libre. Se mira por las DOS vías porque no siempre hay
  // `salesorder_id`: los tickets de Zoho y los creados tecleando el número solo dejan `orden_venta`.
  it('soloLibres deja fuera las órdenes que ya usa otro ticket, por id o por número', async () => {
    const cookie = await adminCookie()
    const ov = (id: string, num: string) =>
      db.query('INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_name,date,status,raw) VALUES ($1,$2,\'Corola\',\'2026-06-01\',\'open\',\'{"order_status":"open"}\')', [id, num])
    await ov('libre', 'OV-LIBRE')
    await ov('porId', 'OV-POR-ID')
    await ov('porNumero', 'OV-POR-NUMERO')
    await db.query("INSERT INTO tickets (id,number,subject,status,salesorder_id) VALUES ('t-a',1,'A','Ingresado','porId')")
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta) VALUES ('t-b',2,'B','Ingresado','OV-POR-NUMERO')")

    const { app } = appWith()
    const todas = await request(app).get('/api/sales-orders?search=OV-').set('Cookie', cookie)
    expect(todas.body.map((s: { id: string }) => s.id).sort()).toEqual(['libre', 'porId', 'porNumero'])

    const libres = await request(app).get('/api/sales-orders?search=OV-&soloLibres=1').set('Cookie', cookie)
    expect(libres.body.map((s: { id: string }) => s.id)).toEqual(['libre'])
  })

  it('GET /api/clients sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=x')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/contacts y /api/accounts', () => {
  it('listan contactos y empresas (con sesión); 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,email,account_id) VALUES ('c1','Ana','P','a@b.co','a1')")
    const { app } = appWith()
    const c = await request(app).get('/api/contacts').set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.body[0]).toMatchObject({ name: 'Ana P', company: 'ACME', companyId: 'a1' })
    const e = await request(app).get('/api/accounts').set('Cookie', cookie)
    expect(e.body[0]).toMatchObject({ name: 'ACME' })
    expect((await request(app).get('/api/contacts')).status).toBe(401)
  })
})

describe('GET /api/contacts/:id y /api/accounts/:id', () => {
  it('detalle (con sesión); 404 inexistente; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,account_id) VALUES ('c1','Ana','P','a1')")
    const { app } = appWith()
    expect((await request(app).get('/api/contacts/c1').set('Cookie', cookie)).body).toMatchObject({ name: 'Ana P' })
    expect((await request(app).get('/api/accounts/a1').set('Cookie', cookie)).body).toMatchObject({ name: 'ACME' })
    expect((await request(app).get('/api/contacts/nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get('/api/contacts/c1')).status).toBe(401)
  })
})

describe('GET /api/analisis (admin)', () => {
  it('admin obtiene métricas; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    clearAnalisisCache() // caché a nivel de módulo: aislar de filas cacheadas por otros tests
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a1',1,'A','Ingresado','Open',now())")
    const { app } = appWith()
    const res = await request(app).get('/api/analisis?range=todo').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(typeof res.body.activos).toBe('number')
    expect(Array.isArray(res.body.porEstado)).toBe(true)
    const op = await userCookie([])
    expect((await request(app).get('/api/analisis').set('Cookie', op)).status).toBe(403)
    expect((await request(app).get('/api/analisis')).status).toBe(401)
  })
})

describe('POST /api/admin/backfill-serial (admin)', () => {
  it('admin → {updated}; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('b1',1,'Servicio MT_18A19042_EDM180C_260305','Finalizado',false)")
    const { app } = appWith()
    const res = await request(app).post('/api/admin/backfill-serial').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body.updated).toBe(1)
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-serial').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-serial')).status).toBe(401)
  })
})

// El paso que de verdad enciende la pestaña HOJA DE VIDA del histórico: el serial suelto no basta,
// hace falta el `equipo_id`. Los dos backfills se disparan en orden desde la misma consola.

describe('POST /api/admin/backfill-equipo-id (admin)', () => {
  it('enlaza lo inequívoco y reparte el resto por motivo; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO equipos (id,serial,marca) VALUES ('eq-x','18A19042','Grimm')")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app,serial) VALUES ('e1',1,'S','Finalizado',false,'18A19042')")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app,serial) VALUES ('e2',2,'S','Finalizado',false,'NO-EXISTE')")
    const { app } = appWith()

    const res = await request(app).post('/api/admin/backfill-equipo-id').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ enlazados: 1, sinEquipo: 1 })
    expect((await db.query("SELECT equipo_id FROM tickets WHERE id='e1'")).rows[0].equipo_id).toBe('eq-x')

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-equipo-id').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-equipo-id')).status).toBe(401)
  })
})

// Cierra el otro hueco de la carga inicial: los equipos traían el cliente como texto libre y sin
// `client_id`. `?dryRun=true` existe para mirar las cifras antes de tocar ~352 filas de producción.

describe('POST /api/admin/backfill-client-id (admin)', () => {
  it('enlaza lo inequívoco y devuelve los pendientes; dryRun no escribe; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO equipos (id,serial,marca,cliente_nombre) VALUES ('eq-1','S1','Grimm','GECELCA')")
    await db.query("INSERT INTO equipos (id,serial,marca,cliente_nombre) VALUES ('eq-2','S2','Grimm','Cliente Fantasma')")
    const { app } = appWith()

    const seco = await request(app).post('/api/admin/backfill-client-id?dryRun=true').set('Cookie', admin)
    expect(seco.status).toBe(200)
    expect(seco.body).toMatchObject({ enlazados: 1, sinCliente: 1 })
    expect((await db.query("SELECT client_id FROM equipos WHERE id='eq-1'")).rows[0].client_id).toBeNull()

    const res = await request(app).post('/api/admin/backfill-client-id').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ enlazados: 1, sinCliente: 1 })
    expect(res.body.pendientes).toEqual([
      { id: 'eq-2', serial: 'S2', clienteNombre: 'Cliente Fantasma', motivo: 'sin-cliente' },
    ])
    expect((await db.query("SELECT client_id FROM equipos WHERE id='eq-1'")).rows[0].client_id).toBe('cli1')

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-client-id').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-client-id')).status).toBe(401)
  })
})

// Convierte ~700 filas de tecleo en revisión: copia a cada modelo el checklist del perfil que hoy le
// aplica. Se dispara a mano una vez, como el resto de siembras.

describe('POST /api/admin/seed-articulos (admin)', () => {
  it('siembra los accesorios por modelo; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0)")
    const { app } = appWith()

    const res = await request(app).post('/api/admin/seed-articulos').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ modelos: 1, insertados: 1, existentes: 0 })

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/seed-articulos').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/seed-articulos')).status).toBe(401)
  })
})

// Retira las copias de texto libre que dejó la siembra, obsoletas desde que la lista se deriva de las
// categorías de Books. `?dryRun=true` devuelve el detalle completo, que es la copia de seguridad.

describe('POST /api/admin/limpiar-articulos-sembrados (admin)', () => {
  it('dryRun lista sin borrar; sin él borra; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Datalogger',0)")
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre) VALUES ('a1','cmod-1','accesorio','Datalogger')")
    const { app } = appWith()

    const seco = await request(app).post('/api/admin/limpiar-articulos-sembrados?dryRun=true').set('Cookie', admin)
    expect(seco.status).toBe(200)
    expect(seco.body).toMatchObject({ borrados: 1, detalle: [{ modelo: 'Grimm EDM180C', articulos: ['Datalogger'] }] })
    expect((await db.query('SELECT count(*)::int AS n FROM catalogo_articulos')).rows[0].n).toBe(1)

    expect((await request(app).post('/api/admin/limpiar-articulos-sembrados').set('Cookie', admin)).body).toMatchObject({ borrados: 1 })
    expect((await db.query('SELECT count(*)::int AS n FROM catalogo_articulos')).rows[0].n).toBe(0)

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/limpiar-articulos-sembrados').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/limpiar-articulos-sembrados')).status).toBe(401)
  })
})

describe('POST /api/admin/backfill-archived (admin)', () => {
  it('admin arranca; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    const { app, sync } = appWith()
    const res = await request(app).post('/api/admin/backfill-archived').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ started: true })
    expect(sync.backfillArchivedTickets).toHaveBeenCalled()
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-archived').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-archived')).status).toBe(401)
  })
})

describe('POST /api/admin/import-remisiones-historicas (admin)', () => {
  it('admin con dryRun=true no escribe y devuelve el resumen; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const res = await request(app).post('/api/admin/import-remisiones-historicas?dryRun=true').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(REMISIONES_HISTORICAS.length)
    expect((await db.query('SELECT COUNT(*)::int AS n FROM remisiones')).rows[0].n).toBe(0)
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/import-remisiones-historicas').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/import-remisiones-historicas')).status).toBe(401)
  })
})

describe('AuthZ admin con sesión+rol (F2-02)', () => {
  it('admin endpoint exige sesión admin (no query-token)', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/admin/measure-attachments')).status).toBe(401) // sin sesión
    const op = await userCookie([]) // operador no admin (helper existente)
    expect((await request(app).get('/api/admin/measure-attachments').set('Cookie', op)).status).toBe(403)
  })
  it('backfill-details exige sesión admin', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/admin/backfill-details')).status).toBe(401)
    const op = await userCookie([])
    expect((await request(app).get('/api/admin/backfill-details').set('Cookie', op)).status).toBe(403)
  })
})

describe('Borrado de resolución solo superadmin (F2-03)', () => {
  it('borrar resolución exige superadmin', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const { app } = appWith()
    const op = await userCookie([])
    expect((await request(app).delete('/api/tickets/t1/resolution').set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete('/api/tickets/t1/resolution/attachments/x').set('Cookie', op)).status).toBe(403)
  })
})

describe('GET /api/attachment (SSRF guard)', () => {
  it('SSRF: ruta de adjunto arbitraria → 400 (con sesión)', async () => {
    const { app, zohoFetch } = appWith()
    const op = await userCookie([])
    const res = await request(app).get('/api/attachment?path=/evil/arbitrary').set('Cookie', op)
    expect(res.status).toBe(400)
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('POST /api/admin/backfill-history (admin)', () => {
  it('con límite 0 responde el conteo esperando', async () => {
    const admin = await adminCookie()
    const { app, sync } = appWith()
    sync.backfillTicketHistory.mockResolvedValue({ intentados: 0, poblados: 0, fallidos: 0, restantes: 42 })

    const res = await request(app).post('/api/admin/backfill-history?limite=0').set('Cookie', admin)

    expect(res.status).toBe(200)
    expect(res.body.restantes).toBe(42)
    expect(sync.backfillTicketHistory).toHaveBeenCalledWith({ limite: 0 })
  })

  // Sin límite el barrido dura minutos: se lanza al fondo y la petición vuelve enseguida. Esperarlo
  // dejaría la petición colgada hasta que el proxy la cortara, y el trabajo a medias sin avisar.
  it('sin límite lo lanza en segundo plano y devuelve enseguida', async () => {
    const admin = await adminCookie()
    const { app, sync } = appWith()

    const res = await request(app).post('/api/admin/backfill-history?pausaMs=800').set('Cookie', admin)

    expect(res.body).toEqual({ started: true })
    expect(sync.backfillTicketHistory).toHaveBeenCalledWith({ limite: undefined, pausaMs: 800 })
  })

  it('403 no-admin; 401 sin sesión', async () => {
    const { app } = appWith()
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-history').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-history')).status).toBe(401)
  })
})

/**
 * Una ruta de API que no existe tiene que decirlo en JSON.
 *
 * En producción, detrás de `createApp`, hay un `app.use` que sirve `index.html` para que funcionen las
 * rutas del navegador. Sin este 404, ese comodín se tragaba también las de `/api`: pedir un endpoint
 * mal escrito —o uno que existe en el código pero todavía no en el servidor desplegado— devolvía la
 * página entera con un 200, y quien llamaba se encontraba con «Unexpected token '<'» en vez de con un
 * 404. El síntoma no se parecía en nada a la causa.
 */

describe('rutas de API inexistentes', () => {
  it('404 en JSON, sin tragárselo el comodín del SPA', async () => {
    const { app } = appWith()
    const res = await request(app).post('/api/admin/no-existe')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Ruta de API no encontrada' })
  })

  // Lo que NO cuelga de /api sigue de largo: es lo que deja pasar las rutas del navegador al SPA.
  it('no toca las rutas que no son de API', async () => {
    const { app } = appWith()
    expect((await request(app).get('/tickets/123')).body).toEqual({})
  })
})
