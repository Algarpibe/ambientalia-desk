import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import type { Cargo } from '@ambientalia/shared'
import { MENSAJES_ACCESORIOS } from '@ambientalia/shared'
import { upsertEquipo } from './db/equipos'
import { createRole } from './auth/roles'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { db, instalarArnes, equipoRow, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`accesorios-lista-por-modelo`, lote 3) · `remisiones` RQ-RE-35: el Director Técnico (área Servicio Técnico y cargo
 * Director Técnico; el administrador pasa) AÑADE un accesorio a la lista de un modelo. La clase la fija el servidor; nombre y
 * SKU salen de Books. Los textos de error se comparan contra `MENSAJES_ACCESORIOS`.
 *
 * Orden de guardas de F1B-10: existencia (A, 404) → permiso (B, 403) → contenido (C, 422 falta el artículo; 422 no está en
 * Books) → unicidad (D, 409). Cinco pares se prueban con las DOS guardas activas a la vez (regla de mutación 1): A↔B, A↔C,
 * B↔C-falta, B↔C-no-en-Books y B↔D.
 *
 * Pares que NO se pueden activar a la vez, y se declaran en vez de fingir la prueba: C-falta con C-no-en-Books (un cuerpo no
 * puede carecer de `itemId` y tener un `itemId` que Books no conoce) y C con D (el `409` necesita el nombre que da Books, que
 * sólo se conoce si el artículo SÍ está en Books). Su orden lo fija la dependencia de datos y no una convención; cada guarda
 * se prueba por separado más abajo.
 */
const modelo = 'cmod-1'
const URL_ALTA = (id = modelo) => `/api/catalogo/modelos/${id}/accesorios`
let n = 0
/** Cookie de un usuario con las áreas y el cargo dados; email propio, para tener varios sujetos no administradores. */
async function usuario(areas: string[], cargo: Cargo | null = null): Promise<string> {
  n += 1
  const role = await createRole(db, { name: `Rol-am-${n}`, areas })
  const u = await createUser(db, { email: `am${n}@x.co`, name: `U${n}`, passwordHash: 'h', roleId: role.id, cargoPermiso: cargo })
  return `sid=${await createSession(db, u.id)}`
}
const directorTecnico = () => usuario(['Servicio Técnico'], 'Director Técnico')
const tecnicoSinCargo = () => usuario(['Servicio Técnico'], 'Técnico')
const cargoSinArea = () => usuario(['Comercial'], 'Director Técnico')
const sinSesion = () => request(appWith().app)
const post = (cookie: string, cuerpo: unknown, id = modelo) => request(appWith().app).post(URL_ALTA(id)).set('Cookie', cookie).send(cuerpo as object)
const filas = async () =>
  (await db.query('SELECT clase, item_id, sku, nombre, activo FROM catalogo_articulos WHERE modelo_id = $1 ORDER BY nombre', [modelo])).rows as Array<Record<string, unknown>>
const lista = async (cookie: string) => (await request(appWith().app).get(`/api/catalogo/modelos/${modelo}/articulos`).set('Cookie', cookie)).body as Array<Record<string, unknown>>

beforeEach(async () => {
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
  await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1','Cable USB','CB-100','Accesorios','active')")
  await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i2','Estuche rígido',NULL,'Accesorios','active')")
})

describe('POST /api/catalogo/modelos/:id/accesorios · éxito y permiso (RQ-RE-35)', () => {
  it('el Director Técnico añade un artículo de Books: 201 { id }, accesorio activo con nombre y SKU de Books, visible en la lista del modelo', async () => {
    const res = await post(await directorTecnico(), { itemId: 'i1' })
    expect(res.status).toBe(201)
    expect(typeof res.body.id).toBe('string')
    expect(await filas()).toEqual([{ clase: 'accesorio', item_id: 'i1', sku: 'CB-100', nombre: 'Cable USB', activo: true }])
    const visibles = await lista(await adminCookie())
    expect(visibles).toContainEqual(expect.objectContaining({ id: res.body.id, clase: 'accesorio', nombre: 'Cable USB' }))
  })

  it('un artículo de Books sin SKU entra con sku null', async () => {
    expect((await post(await directorTecnico(), { itemId: 'i2' })).status).toBe(201)
    expect(await filas()).toMatchObject([{ clase: 'accesorio', item_id: 'i2', sku: null, nombre: 'Estuche rígido' }])
  })

  it('el administrador pasa', async () => {
    expect((await post(await adminCookie(), { itemId: 'i1' })).status).toBe(201)
    expect(await filas()).toHaveLength(1)
  })

  it('sin sesión 401, y no se crea nada', async () => {
    expect((await sinSesion().post(URL_ALTA()).send({ itemId: 'i1' })).status).toBe(401)
    expect(await filas()).toEqual([])
  })

  it('un técnico de Servicio Técnico SIN el cargo recibe 403 con el mensaje de permiso y la lista no cambia', async () => {
    const res = await post(await tecnicoSinCargo(), { itemId: 'i1' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.permiso)
    expect(await filas()).toEqual([])
  })

  it('el cargo Director Técnico SIN el área Servicio Técnico recibe 403 y la lista no cambia', async () => {
    const res = await post(await cargoSinArea(), { itemId: 'i1' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.permiso)
    expect(await filas()).toEqual([])
  })
})

describe('POST …/accesorios · posición de las guardas, con las dos activas a la vez (regla de mutación 1)', () => {
  it('A↔B: modelo inexistente y técnico sin cargo da 404, no 403', async () => {
    const res = await post(await tecnicoSinCargo(), { itemId: 'i1' }, 'no-existe')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.modelo)
  })

  it('A↔C: modelo inexistente y cuerpo vacío da 404, no 422', async () => {
    const res = await post(await directorTecnico(), {}, 'no-existe')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.modelo)
  })

  it('B↔C-falta: técnico sin cargo y cuerpo vacío da 403, no 422', async () => {
    const res = await post(await tecnicoSinCargo(), {})
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.permiso)
  })

  it('B↔C-no-en-Books: técnico sin cargo e itemId inexistente da 403, no 422', async () => {
    const res = await post(await tecnicoSinCargo(), { itemId: 'no-esta-en-books' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.permiso)
  })

  it('B↔D: técnico sin cargo y artículo ya en la lista da 403, no 409, y sin fila nueva', async () => {
    expect((await post(await adminCookie(), { itemId: 'i1' })).status).toBe(201)
    const res = await post(await tecnicoSinCargo(), { itemId: 'i1' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.permiso)
    expect(await filas()).toHaveLength(1)
  })
})

describe('POST …/accesorios · contenido, unicidad y límites', () => {
  it('cuerpo sin itemId: 422 faltaArticulo y sin fila (también con itemId vacío o sólo espacios)', async () => {
    const cookie = await directorTecnico()
    for (const cuerpo of [{}, { itemId: '' }, { itemId: '   ' }, { itemId: 7 }]) {
      const res = await post(cookie, cuerpo)
      expect(res.status, JSON.stringify(cuerpo)).toBe(422)
      expect(res.body.error).toBe(MENSAJES_ACCESORIOS.faltaArticulo)
    }
    expect(await filas()).toEqual([])
  })

  it('itemId que no está en Books: 422 noEnBooks y sin fila', async () => {
    const res = await post(await directorTecnico(), { itemId: 'no-esta-en-books' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.noEnBooks)
    expect(await filas()).toEqual([])
  })

  it('artículo repetido: 409 y sin fila nueva', async () => {
    const cookie = await directorTecnico()
    expect((await post(cookie, { itemId: 'i1' })).status).toBe(201)
    const res = await post(cookie, { itemId: 'i1' })
    expect(res.status).toBe(409)
    expect(await filas()).toHaveLength(1)
  })

  it('un cuerpo con clase y nombre inventados no los manda: la fila queda accesorio con el nombre y el SKU de Books', async () => {
    const res = await post(await directorTecnico(), { itemId: 'i1', clase: 'consumible_repuesto', nombre: 'Inventado', sku: 'XX-1' })
    expect(res.status).toBe(201)
    expect(await filas()).toEqual([{ clase: 'accesorio', item_id: 'i1', sku: 'CB-100', nombre: 'Cable USB', activo: true }])
  })

  it('el Director Técnico no administrador sólo AÑADE: retirar, reordenar, copiar y borrar siguen en 403', async () => {
    const cookie = await directorTecnico()
    const id = (await post(cookie, { itemId: 'i1' })).body.id as string
    const app = appWith().app
    const respuestas = [
      await request(app).patch(`/api/catalogo/articulos/${id}`).set('Cookie', cookie).send({ activo: false }),
      await request(app).put(`/api/catalogo/modelos/${modelo}/articulos/orden`).set('Cookie', cookie).send({ clase: 'accesorio', ids: [id] }),
      await request(app).post(`/api/catalogo/modelos/${modelo}/copiar-articulos`).set('Cookie', cookie).send({ destinos: ['cmod-1'], clase: 'accesorio' }),
      await request(app).delete(`/api/catalogo/articulos/${id}`).set('Cookie', cookie),
    ]
    expect(respuestas.map((r) => r.status)).toEqual([403, 403, 403, 403])
    expect(await filas()).toMatchObject([{ item_id: 'i1', activo: true }])
  })
})

describe('POST …/accesorios · el artículo añadido llega a la remisión de entrada (RQ-RE-32)', () => {
  it('aparece en GET /api/remisiones/nueva, en incluye e incluyeDetalle con su SKU, para un ticket de ese modelo', async () => {
    await upsertEquipo(db, equipoRow('eq-am1', '18A20070'))
    await db.query("UPDATE equipos SET modelo_id = 'cmod-1' WHERE id = 'eq-am1'")
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                    VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-am1', 'Grimm', 'EDM180C', '18A1')`)
    expect((await post(await directorTecnico(), { itemId: 'i1' })).status).toBe(201)
    const r = await request(appWith().app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body.incluye).toEqual(['Cable USB'])
    expect(r.body.incluyeDetalle).toEqual([{ nombre: 'Cable USB', sku: 'CB-100' }])
  })
})
