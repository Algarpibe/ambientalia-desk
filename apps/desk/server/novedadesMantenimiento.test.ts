import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`remisiones` RQ-RE-29): la lista de novedades se mantiene desde la aplicación, y la regla la impone el servidor.
 * Orden de guardas de F1B-10: existencia (404) → permiso (403) → contenido (422) → unicidad (409).
 */
const BASE = '/api/novedades-remision'
const dt = () => userCookie(['Servicio Técnico'], 'Director Técnico')
const tecnico = () => userCookie(['Servicio Técnico'], 'Técnico')
const fila = async (clave: string) => (await db.query('SELECT clave, etiqueta, orden, activo, excluye_demas, exige_texto FROM public.catalogo_novedades WHERE clave = $1', [clave])).rows[0]
const cuantas = async () => Number((await db.query('SELECT count(*)::int AS n FROM public.catalogo_novedades')).rows[0].n)

describe('GET /api/novedades-remision/todas', () => {
  it('el Director Técnico ve también las retiradas', async () => {
    await db.query("UPDATE public.catalogo_novedades SET activo = false WHERE clave = 'sello_roto'")
    const res = await request(appWith().app).get(`${BASE}/todas`).set('Cookie', await dt())
    expect(res.status).toBe(200)
    expect(res.body.find((n: { clave: string }) => n.clave === 'sello_roto')).toMatchObject({ activo: false })
  })
  it('sin sesión 401; otro cargo 403', async () => {
    expect((await request(appWith().app).get(`${BASE}/todas`)).status).toBe(401)
    expect((await request(appWith().app).get(`${BASE}/todas`).set('Cookie', await tecnico())).status).toBe(403)
  })
})

describe('POST /api/novedades-remision', () => {
  const alta = async (cookie: string, cuerpo: object) => request(appWith().app).post(BASE).set('Cookie', cookie).send(cuerpo)

  it('el Director Técnico da de alta: 201, y el formulario la sirve activa', async () => {
    const res = await alta(await dt(), { clave: 'tapa_suelta', etiqueta: 'Tapa suelta', orden: 95 })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ clave: 'tapa_suelta', etiqueta: 'Tapa suelta', orden: 95, activo: true, excluyeDemas: false })
    const activas = (await request(appWith().app).get(BASE).set('Cookie', await adminCookie())).body as { clave: string }[]
    expect(activas.map((n) => n.clave)).toContain('tapa_suelta')
  })
  it('el administrador también puede', async () => {
    expect((await alta(await adminCookie(), { clave: 'tapa_suelta', etiqueta: 'Tapa suelta' })).status).toBe(201)
  })
  it('otro cargo: 403 y no escribe', async () => {
    const antes = await cuantas()
    expect((await alta(await tecnico(), { clave: 'tapa_suelta', etiqueta: 'Tapa suelta' })).status).toBe(403)
    expect(await cuantas()).toBe(antes)
  })
  it('posición: otro cargo con un cuerpo inválido ve 403, no 422 (permiso antes que contenido)', async () => {
    expect((await alta(await tecnico(), { clave: 'X', etiqueta: '' })).status).toBe(403)
  })
  it('contenido inválido: 422 y no escribe', async () => {
    const antes = await cuantas()
    const res = await alta(await dt(), { clave: 'Tapa Suelta', etiqueta: 'Tapa suelta' })
    expect(res.status).toBe(422)
    expect(res.body.error).toMatch(/clave/)
    expect(await cuantas()).toBe(antes)
  })
  it('etiqueta repetida: 409 y no escribe', async () => {
    const antes = await cuantas()
    expect((await alta(await dt(), { clave: 'otra_mas', etiqueta: '  otro ' })).status).toBe(409)
    expect(await cuantas()).toBe(antes)
  })
  it('posición: inválida y repetida a la vez ve 422, no 409 (contenido antes que unicidad)', async () => {
    expect((await alta(await dt(), { clave: 'otro', etiqueta: '' })).status).toBe(422)
  })
})

describe('PATCH /api/novedades-remision/:clave', () => {
  const cambiar = async (cookie: string, clave: string, cuerpo: object) => request(appWith().app).patch(`${BASE}/${clave}`).set('Cookie', cookie).send(cuerpo)

  it('retirar: 200, el formulario deja de servirla y la fila sigue en la tabla', async () => {
    const res = await cambiar(await dt(), 'sello_roto', { activo: false })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ clave: 'sello_roto', activo: false })
    const activas = (await request(appWith().app).get(BASE).set('Cookie', await adminCookie())).body as { clave: string }[]
    expect(activas.map((n) => n.clave)).not.toContain('sello_roto')
    expect(await fila('sello_roto')).toMatchObject({ activo: false })
  })
  it('cambia etiqueta y orden y nada más', async () => {
    await cambiar(await dt(), 'sello_roto', { etiqueta: 'Precinto roto', orden: 85 })
    expect(await fila('sello_roto')).toEqual({ clave: 'sello_roto', etiqueta: 'Precinto roto', orden: 85, activo: true, excluye_demas: false, exige_texto: false })
  })
  it('una clave que no existe: 404', async () => {
    expect((await cambiar(await dt(), 'no_existe', { activo: false })).status).toBe(404)
  })
  it('posición: quien no tiene permiso también ve 404 con una clave que no existe (existencia antes que permiso)', async () => {
    expect((await cambiar(await tecnico(), 'no_existe', { activo: false })).status).toBe(404)
  })
  it('otro cargo sobre una que existe: 403 y no cambia', async () => {
    expect((await cambiar(await tecnico(), 'sello_roto', { activo: false })).status).toBe(403)
    expect(await fila('sello_roto')).toMatchObject({ activo: true })
  })
  it('«Sin novedad» no se retira: 422 y sigue activa', async () => {
    expect((await cambiar(await dt(), 'sin_novedad', { activo: false })).status).toBe(422)
    expect(await fila('sin_novedad')).toMatchObject({ activo: true, excluye_demas: true })
  })
  it('la clave no se cambia: 422', async () => {
    expect((await cambiar(await dt(), 'sello_roto', { clave: 'precinto' })).status).toBe(422)
    expect(await fila('sello_roto')).toBeDefined()
  })
  it('etiqueta de otra: 409 y no cambia', async () => {
    expect((await cambiar(await dt(), 'sello_roto', { etiqueta: 'Otro' })).status).toBe(409)
    expect(await fila('sello_roto')).toMatchObject({ etiqueta: 'Sello o precinto roto' })
  })
})

describe('nada se borra', () => {
  it('no hay DELETE', async () => {
    const res = await request(appWith().app).delete(`${BASE}/sello_roto`).set('Cookie', await adminCookie())
    expect(res.status).toBe(404)
    expect(await fila('sello_roto')).toBeDefined()
  })
})
