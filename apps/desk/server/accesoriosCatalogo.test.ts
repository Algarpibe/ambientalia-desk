import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { MENSAJES_ACCESORIOS } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`remisiones` RQ-RE-33): un accesorio de la lista de un modelo tiene que ser un artículo de Zoho Books. El cierre vive
 * en las rutas del catálogo (alta, `PATCH` de clase y copia entre modelos) y la regla en `@ambientalia/shared`; los textos de
 * error se comparan contra `MENSAJES_ACCESORIOS`, no contra literales.
 *
 * Orden de guardas del alta (F1B-10): existencia del modelo (A) → permiso (B) → clase desconocida → accesorio sin Books →
 * «El nombre es obligatorio» → `409`. Pares que NO se pueden activar a la vez, y se declaran en vez de fingir la prueba:
 * «Clase desconocida» con la guarda de accesorio (la clase no puede ser desconocida y `accesorio` a la vez); su orden lo fija
 * la dependencia de datos y no una convención.
 */
beforeEach(async () => {
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-2','cmar-1','APNA-370')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-3','cmar-1','APOA-370')")
  await db.query("INSERT INTO books.items (item_id,name,sku,category_name,status) VALUES ('i1','Cable USB','CB-100','Accesorios','active')")
})

const ALTA = '/api/catalogo/modelos/cmod-1/articulos'
const filasDe = async (modeloId = 'cmod-1') =>
  (await db.query('SELECT id, clase, item_id, sku, nombre, activo FROM catalogo_articulos WHERE modelo_id = $1 ORDER BY nombre', [modeloId])).rows as Array<Record<string, unknown>>
/** Una fila de legado: accesorio de texto libre sembrada por SQL, como las que ya hay en producción. */
const legado = (id: string, nombre: string, modeloId = 'cmod-1') =>
  db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ($1,$2,'accesorio',NULL,NULL,$3,0)", [id, modeloId, nombre])

describe('alta de artículo del catálogo (RQ-RE-33)', () => {
  it('accesorio sin itemId da 422 con exigeBooks y no crea fila', async () => {
    const cookie = await adminCookie()
    const res = await request(appWith().app).post(ALTA).set('Cookie', cookie).send({ clase: 'accesorio', nombre: 'Manuales' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.exigeBooks)
    expect(await filasDe()).toEqual([])
  })

  it('accesorio con itemId de Books da 201 con nombre y SKU de Books', async () => {
    const cookie = await adminCookie()
    const res = await request(appWith().app).post(ALTA).set('Cookie', cookie).send({ clase: 'accesorio', itemId: 'i1', nombre: 'Inventado' })
    expect(res.status).toBe(201)
    expect(await filasDe()).toMatchObject([{ clase: 'accesorio', item_id: 'i1', sku: 'CB-100', nombre: 'Cable USB' }])
  })

  it('consumible_repuesto sigue admitiendo texto libre', async () => {
    const cookie = await adminCookie()
    const res = await request(appWith().app).post(ALTA).set('Cookie', cookie).send({ clase: 'consumible_repuesto', nombre: 'Filtro suelto' })
    expect(res.status).toBe(201)
    expect(await filasDe()).toMatchObject([{ clase: 'consumible_repuesto', item_id: null, nombre: 'Filtro suelto' }])
  })

  it('clase desconocida da su propio 422', async () => {
    const cookie = await adminCookie()
    const res = await request(appWith().app).post(ALTA).set('Cookie', cookie).send({ clase: 'inventada', nombre: 'X' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Clase de artículo desconocida')
  })

  describe('posición: cada par con las dos guardas activas a la vez', () => {
    it('A frente a C nueva: modelo inexistente y accesorio sin itemId da 404', async () => {
      const cookie = await adminCookie()
      const res = await request(appWith().app).post('/api/catalogo/modelos/no-existe/articulos').set('Cookie', cookie).send({ clase: 'accesorio', nombre: 'X' })
      expect(res.status).toBe(404)
      expect(res.body.error).toBe(MENSAJES_ACCESORIOS.modelo)
    })

    it('permiso frente a C nueva: sujeto no administrador y accesorio sin itemId da 403', async () => {
      const op = await userCookie([])
      const res = await request(appWith().app).post(ALTA).set('Cookie', op).send({ clase: 'accesorio', nombre: 'X' })
      expect(res.status).toBe(403)
      expect(await filasDe()).toEqual([])
    })

    it('C nueva frente a «El nombre es obligatorio»: accesorio sin itemId y nombre en blanco da 422 con exigeBooks', async () => {
      const cookie = await adminCookie()
      const res = await request(appWith().app).post(ALTA).set('Cookie', cookie).send({ clase: 'accesorio', nombre: '   ' })
      expect(res.status).toBe(422)
      expect(res.body.error).toBe(MENSAJES_ACCESORIOS.exigeBooks)
    })

    it('C nueva frente al 409: accesorio sin itemId cuyo nombre ya existe como legado da 422 y no 409', async () => {
      const cookie = await adminCookie()
      await legado('art-leg', 'Manuales')
      const res = await request(appWith().app).post(ALTA).set('Cookie', cookie).send({ clase: 'accesorio', nombre: 'Manuales' })
      expect(res.status).toBe(422)
      expect(res.body.error).toBe(MENSAJES_ACCESORIOS.exigeBooks)
      expect(await filasDe()).toHaveLength(1)
    })
  })
})

describe('PATCH de clase (RQ-RE-33)', () => {
  const patch = (cookie: string, id: string, body: Record<string, unknown>) =>
    request(appWith().app).patch(`/api/catalogo/articulos/${id}`).set('Cookie', cookie).send(body)
  const sembrarConsumible = (id: string, itemId: string | null) =>
    db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ($1,'cmod-1','consumible_repuesto',$2,NULL,'Pieza',0)", [id, itemId])

  it('consumible sin itemId hacia accesorio da 422 y la fila conserva su clase', async () => {
    const cookie = await adminCookie()
    await sembrarConsumible('art-1', null)
    const res = await patch(cookie, 'art-1', { clase: 'accesorio' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe(MENSAJES_ACCESORIOS.cambioSinBooks)
    expect(await filasDe()).toMatchObject([{ clase: 'consumible_repuesto' }])
  })

  it('consumible con itemId hacia accesorio da 200 y pasa a accesorio', async () => {
    const cookie = await adminCookie()
    await sembrarConsumible('art-1', 'i1')
    expect((await patch(cookie, 'art-1', { clase: 'accesorio' })).status).toBe(200)
    expect(await filasDe()).toMatchObject([{ clase: 'accesorio' }])
  })

  // Nace verde: lo caza la mutación M3 de la regla pura. Una fila de legado se puede desactivar repitiendo su clase.
  it('legado accesorio que repite la clase y pone activo false da 200 y queda desactivado', async () => {
    const cookie = await adminCookie()
    await legado('art-leg', 'Manuales')
    expect((await patch(cookie, 'art-leg', { clase: 'accesorio', activo: false })).status).toBe(200)
    expect(await filasDe()).toMatchObject([{ clase: 'accesorio', activo: false }])
  })

  // Nace verde: caracteriza DD-7. Un id inexistente sigue respondiendo 200, como antes de F1B-04.
  it('id inexistente da 200 sin escribir', async () => {
    const cookie = await adminCookie()
    expect((await patch(cookie, 'no-existe', { clase: 'accesorio' })).status).toBe(200)
    expect(await filasDe()).toEqual([])
  })

  it('posición: C nueva frente a la escritura — { clase: accesorio, activo: false } sobre un consumible sin itemId da 422 y conserva clase y activo', async () => {
    const cookie = await adminCookie()
    await sembrarConsumible('art-1', null)
    const res = await patch(cookie, 'art-1', { clase: 'accesorio', activo: false })
    expect(res.status).toBe(422)
    expect(await filasDe()).toMatchObject([{ clase: 'consumible_repuesto', activo: true }])
  })
})

describe('copia entre modelos (RQ-RE-33)', () => {
  const copiar = (destinos: string[], clase = 'accesorio') =>
    request(appWith().app).post('/api/catalogo/modelos/cmod-1/copiar-articulos').set('Cookie', cookieAdmin).send({ clase, destinos })
  let cookieAdmin = ''

  beforeEach(async () => {
    cookieAdmin = await adminCookie()
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ('art-b','cmod-1','accesorio','i1','CB-100','Cable USB',1)")
    await legado('art-leg', 'Manuales')
  })

  it('copia el accesorio con itemId, deja el legado y lo cuenta en sinBooks', async () => {
    const res = await copiar(['cmod-2'])
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ copiados: 1, sinBooks: 1, omitidos: 0 })
    expect(await filasDe('cmod-2')).toMatchObject([{ nombre: 'Cable USB', item_id: 'i1' }])
  })

  it('con dos destinos, sinBooks sigue en 1: cuenta el origen una vez', async () => {
    const res = await copiar(['cmod-2', 'cmod-3'])
    expect(res.body).toMatchObject({ copiados: 2, sinBooks: 1, omitidos: 0 })
    for (const d of ['cmod-2', 'cmod-3']) expect((await filasDe(d)).every((f) => f.item_id !== null)).toBe(true)
  })

  it('un choque de nombre en el destino suma a omitidos y no a sinBooks', async () => {
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ('art-d','cmod-2','accesorio','i1','CB-100','Cable USB',0)")
    const res = await copiar(['cmod-2'])
    expect(res.body).toMatchObject({ copiados: 0, omitidos: 1, sinBooks: 1 })
  })

  it('con consumible_repuesto sinBooks vale 0 y la copia no cambia', async () => {
    await db.query("INSERT INTO catalogo_articulos (id,modelo_id,clase,item_id,sku,nombre,orden) VALUES ('art-c','cmod-1','consumible_repuesto',NULL,NULL,'Filtro suelto',0)")
    const res = await copiar(['cmod-2'], 'consumible_repuesto')
    expect(res.body).toMatchObject({ copiados: 1, sinBooks: 0, omitidos: 0 })
    expect(await filasDe('cmod-2')).toMatchObject([{ clase: 'consumible_repuesto', nombre: 'Filtro suelto' }])
  })
})
