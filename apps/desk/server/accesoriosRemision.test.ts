import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { crearArticulo, asignarCategoria } from './db/catalogoArticulos'
import { db, instalarArnes, equipoRow, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`accesorios-lista-por-modelo`) · lote 2 · `remisiones` RQ-RE-32 (detalle con SKU), RQ-RE-34 (novedad sembrada) y
 * RQ-RE-36 (compatibilidad). El detalle sale de la MISMA lectura que `incluye` y es aditivo: `incluye`, el alta y el payload a n8n no cambian.
 *
 * Nacen verdes, por ser CARACTERIZACIÓN de lo que ya funciona, y cada una lleva una mutación que la pone roja (apply-progress):
 * `incluye` conserva nombres y orden; RQ-RE-36 (1) y (4); y, de (2), el alta que acepta la fila `item_id NULL`.
 */
const URL_N8N = { remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' }
type App = import('express').Express
type Detalle = { nombre: string; sku: string | null }
const PNG = Buffer.from('89504e470d0a1a0a', 'hex')

beforeEach(async () => {
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
  await upsertEquipo(db, equipoRow('eq-rc1', '18A20070'))
  await db.query("UPDATE equipos SET modelo_id = 'cmod-1' WHERE id = 'eq-rc1'")
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-rc1', 'Grimm', 'EDM180C', '18A1')`)
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('tz', 1234, 'Ticket creado', false, 'cli1', 'Mantenimiento', NULL, 'Grimm', 'EDM180C', NULL)`)
  await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1','Cable USB','CB-100','Accesorios','active')")
})

/** Invariante entre los dos filtros de «accesorio» (`checklistRemision.ts` para `items`, `detalleDeAccesorios` para el detalle). */
const invariante = (b: { incluye: string[]; incluyeDetalle: Detalle[] }) =>
  expect(b.incluyeDetalle.map((d) => d.nombre), 'los nombres de incluyeDetalle son los de incluye, sin repetidos y en el mismo orden').toEqual([...new Set(b.incluye)])
const leer = async (ticketId = 't1', cookie?: string) => {
  const r = await request(appWith().app).get(`/api/remisiones/nueva?ticketId=${ticketId}`).set('Cookie', cookie ?? await adminCookie())
  expect(r.status).toBe(200)
  invariante(r.body)
  return r.body as { incluye: string[]; incluyeDetalle: Detalle[]; origenChecklist: string }
}
const legado = (id: string, nombre: string) =>
  db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ($1,'cmod-1','accesorio',NULL,NULL,$2,5)", [id, nombre])

describe('RQ-RE-32 · GET /api/remisiones/nueva trae incluyeDetalle', () => {
  it('accesorio con SKU: incluye el nombre e incluyeDetalle nombre y SKU («Cable USB» / «CB-100»)', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', itemId: 'i1', sku: 'CB-100', nombre: 'Cable USB' })
    const b = await leer()
    expect(b.incluye).toEqual(['Cable USB'])
    expect(b.incluyeDetalle).toEqual([{ nombre: 'Cable USB', sku: 'CB-100' }])
  })

  it('artículo sin SKU y fila sin artículo de Books salen con sku null; incluye conserva los mismos nombres y el mismo orden (nace verde: caracterización)', async () => {
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', itemId: 'i9', nombre: 'Estuche' })
    await legado('leg-1', 'Manuales')
    const b = await leer()
    expect(b.incluye).toEqual(['Estuche', 'Manuales'])
    expect(b.incluyeDetalle).toEqual([{ nombre: 'Estuche', sku: null }, { nombre: 'Manuales', sku: null }])
  })

  it('origen perfil (ticket sin equipo): todas las entradas sin SKU', async () => {
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Del perfil viejo',0), ('grimm_edm180','Otro del perfil',1)")
    const b = await leer('tz')
    expect(b.origenChecklist).toBe('perfil')
    expect(b.incluye).toEqual(['Del perfil viejo', 'Otro del perfil'])
    expect(b.incluyeDetalle).toEqual([{ nombre: 'Del perfil viejo', sku: null }, { nombre: 'Otro del perfil', sku: null }])
  })

  it('dos artículos con el mismo nombre dan una sola entrada en incluyeDetalle', async () => {
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i2','Cable USB','CB-200','Accesorios','active')")
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Accesorios')
    const b = await leer()
    expect(b.incluyeDetalle).toHaveLength(1)
    expect(b.incluyeDetalle[0].nombre).toBe('Cable USB')
  })

  it('INVARIANTE items↔detalle: con derivados repetidos, manual, legado, consumible y desactivado, los nombres coinciden sin repetidos y en el mismo orden', async () => {
    await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i2','Cable USB','CB-200','Accesorios','active'), ('i3','Bateria','BA-1','Accesorios','active')")
    await asignarCategoria(db, 'cmod-1', 'accesorio', 'Accesorios')
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', itemId: 'i7', sku: 'ES-1', nombre: 'Estuche' })
    await legado('leg-1', 'Manuales')
    await legado('leg-2', 'Retirado'); await db.query("UPDATE catalogo_articulos SET activo = false WHERE id = 'leg-2'")
    await crearArticulo(db, 'cmod-1', { clase: 'consumible_repuesto', itemId: 'i8', nombre: 'Filtro' })
    const b = await leer()
    expect(b.incluye).toContain('Estuche'); expect(b.incluye).not.toContain('Filtro'); expect(b.incluye).not.toContain('Retirado')
    expect(b.incluye.filter((n) => n === 'Cable USB'), 'incluye no se deduplica (no cambia)').toHaveLength(2)
    expect(b.incluyeDetalle.map((d) => d.nombre)).toEqual(['Bateria', 'Cable USB', 'Estuche', 'Manuales'])
  })
})

// RQ-RE-23, 26 y 34: la novedad sembrada pasa por la validación de recepción que ya existe, sin guarda nueva.
const crear = (app: App, cookie: string, extra: object) =>
  request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], ...extra })
const etiquetaFuera = async () => String((await db.query("SELECT etiqueta FROM public.catalogo_novedades WHERE clave = 'accesorio_fuera_de_lista'")).rows[0]?.etiqueta)
const subir = (app: App, cookie: string, id: string, campos: Record<string, string>) => {
  let r = request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie)
  for (const [k, v] of Object.entries(campos)) r = r.field(k, v)
  return r.attach('file', PNG, { filename: 'f.png', contentType: 'image/png' })
}
const CON_TEXTO = { novedades: ['accesorio_fuera_de_lista'], novedadOtro: ' Cable de red ', rotulado: true }
const conN8n = async (prueba: (fetchMock: ReturnType<typeof vi.fn>) => Promise<void>) => {
  const fetchMock = vi.fn(async (...args: [string, RequestInit]) => { void args; return new Response('{}', { status: 202 }) })
  vi.stubGlobal('fetch', fetchMock)
  try { await prueba(fetchMock) } finally { vi.unstubAllGlobals() }
}

describe('RQ-RE-34 · «Accesorio fuera de lista» es una novedad sembrada que exige texto', () => {
  it('marcada sin texto → 422 con el mensaje «exige describir la novedad» tomado de la etiqueta, y sin remisión', async () => {
    const cookie = await adminCookie()
    const etiqueta = await etiquetaFuera()
    const r = await crear(appWith().app, cookie, { novedades: ['accesorio_fuera_de_lista'], rotulado: true })
    expect(etiqueta).toBe('Accesorio fuera de lista')
    expect(r.status).toBe(422)
    expect(r.body.error).toBe(`«${etiqueta}» exige describir la novedad.`)
    expect(Number((await db.query('SELECT count(*)::int AS n FROM remisiones')).rows[0].n)).toBe(0)
  })

  it('marcada con texto «Cable de red» → 201, hay_novedad en verdad y el texto entra en las observaciones', async () => {
    const cookie = await adminCookie()
    const r = await crear(appWith().app, cookie, CON_TEXTO)
    expect(r.status).toBe(201)
    expect(r.body.hayNovedad).toBe(true)
    expect(r.body.novedadOtro).toBe('Cable de red')
    expect(r.body.observaciones).toBe('Accesorio fuera de lista: Cable de red')
  })

  it('marcada junto con «Otro» comparten un solo texto (S-10)', async () => {
    const cookie = await adminCookie()
    const sin = await crear(appWith().app, cookie, { novedades: ['accesorio_fuera_de_lista', 'otro'], rotulado: true })
    expect(sin.status).toBe(422)
    const r = await crear(appWith().app, cookie, { novedades: ['accesorio_fuera_de_lista', 'otro'], novedadOtro: 'Cable de red', rotulado: true })
    expect(r.status).toBe(201)
    expect(r.body.novedadOtro).toBe('Cable de red')
    expect(r.body.observaciones).toBe('Accesorio fuera de lista: Cable de red; Otro: Cable de red')
  })

  it('una remisión guardada con esa novedad y sin su foto → 422 en /enviar, sin n8n (RQ-RE-26); con la foto → 200', () => conN8n(async (n8n) => {
    const cookie = await adminCookie(); const { app } = appWith(URL_N8N)
    const id = (await crear(app, cookie, CON_TEXTO)).body.id as string
    for (const categoria of ['equipo', 'accesorios', 'embalaje']) expect((await subir(app, cookie, id, { categoria })).status).toBe(201)
    const sinFoto = await request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)
    expect(sinFoto.status).toBe(422)
    expect(sinFoto.body.error).toMatch(/Falta la foto de cada novedad marcada: Accesorio fuera de lista/)
    expect(n8n).not.toHaveBeenCalled()
    expect((await subir(app, cookie, id, { categoria: 'novedad', novedad: 'accesorio_fuera_de_lista' })).status).toBe(201)
    expect((await request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)).status).toBe(200)
  }))
})

describe('RQ-RE-36 · lo ya guardado y lo ya sembrado se sigue leyendo y aceptando igual', () => {
  const guardada = (incluye: string) => db.query(
    `INSERT INTO remisiones (id, ticket_id, tipo, fecha, tipo_servicio, perfil, equipo_id, serial, incluye, creado_por, estado, origen, hay_novedad)
     VALUES ('rem-g1', 't1', 'entrada', '2026-07-01', 'Mantenimiento', 'grimm_edm180', 'eq-rc1', '18A1', $1::jsonb, 'Ana Pérez', 'pendiente', 'app', false)`, [incluye])
  const enviar = (app: App, cookie: string, id: string) => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

  it('(1) remisión con un ítem de texto libre que ninguna lista tiene: se lee y se envía sin error, con ese ítem tal cual (nace verde: la mata revalidar en /enviar)', () => conN8n(async (n8n) => {
    const cookie = await adminCookie(); const { app } = appWith(URL_N8N)
    await guardada('["Maletín de lujo"]')
    const g = await request(app).get('/api/remisiones/rem-g1').set('Cookie', cookie)
    expect(g.status).toBe(200)
    expect(g.body.incluye).toEqual(['Maletín de lujo'])
    expect((await enviar(app, cookie, 'rem-g1')).status).toBe(200)
    expect(JSON.parse(String(n8n.mock.calls[0][1].body)).incluye).toEqual(['Maletín de lujo'])
  }))

  it('(2) fila item_id NULL de clase accesorio: sale en incluye y en incluyeDetalle con sku null, y el alta que la marca responde 201 (el 201 nace verde: lo mata filtrar item_id en el checklist)', async () => {
    await legado('leg-1', 'Manuales')
    const cookie = await adminCookie()
    const b = await leer('t1', cookie)
    expect(b.incluye).toEqual(['Manuales'])
    expect(b.incluyeDetalle).toEqual([{ nombre: 'Manuales', sku: null }])
    const r = await crear(appWith().app, cookie, { incluye: ['Manuales'], novedades: ['sin_novedad'], rotulado: true })
    expect(r.status).toBe(201)
    expect(r.body.incluye).toEqual(['Manuales'])
  })

  it('(3) ticket sin equipo recibe la lista del perfil con origen perfil y detalle sin SKU', async () => {
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Del perfil viejo',0)")
    const b = await leer('tz')
    expect(b).toMatchObject({ origenChecklist: 'perfil', incluye: ['Del perfil viejo'], incluyeDetalle: [{ nombre: 'Del perfil viejo', sku: null }] })
  })

  it('(4) el payload a n8n conserva sus diez claves y no lleva incluyeDetalle ni SKU (nace verde: lo mata añadir la clave)', () => conN8n(async (n8n) => {
    const cookie = await adminCookie(); const { app } = appWith(URL_N8N)
    await crearArticulo(db, 'cmod-1', { clase: 'accesorio', itemId: 'i1', sku: 'CB-100', nombre: 'Cable USB' })
    const id = (await crear(app, cookie, { incluye: ['Cable USB'], novedades: ['sin_novedad'], rotulado: true })).body.id as string
    for (const categoria of ['equipo', 'accesorios', 'embalaje']) expect((await subir(app, cookie, id, { categoria })).status).toBe(201)
    expect((await enviar(app, cookie, id)).status).toBe(200)
    const texto = String(n8n.mock.calls[0][1].body)
    expect(Object.keys(JSON.parse(texto)).sort()).toEqual(['cliente', 'equipo', 'fecha', 'fotos', 'incluye', 'observaciones', 'remisionId', 'tecnico', 'ticketNumero', 'tipoServicio'])
    expect(JSON.parse(texto).incluye).toEqual(['Cable USB'])
    expect(texto).not.toMatch(/incluyeDetalle|CB-100|"sku"/)
  }))
})
