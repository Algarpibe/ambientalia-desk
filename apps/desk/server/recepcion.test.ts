import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`recepcion-rotulacion-foto-entrada`) · recepción con rotulado, novedades y foto por categoría.
 * Lote 1: lectura de la lista de novedades (RQ-RE-22). Los bloques de alta y de fotos entran en los lotes 2 y 3.
 */
const ETIQUETAS = [
  'Sin novedad', 'Golpe o abolladura en la carcasa', 'Rayón o daño estético', 'Pantalla o display dañado',
  'Conector o puerto dañado', 'Falta un accesorio', 'Embalaje inadecuado o dañado',
  'Humedad, suciedad o contaminación visible', 'Sello o precinto roto', 'Otro',
]

describe('RQ-RE-22 · GET /api/novedades-remision', () => {
  it('sin sesión responde 401', async () => {
    const { app } = appWith()
    const r = await request(app).get('/api/novedades-remision')
    expect(r.status).toBe(401)
  })

  it('con sesión devuelve las diez en orden, con clave, etiqueta y las dos marcas en camelCase', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const r = await request(app).get('/api/novedades-remision').set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body.map((n: { etiqueta: string }) => n.etiqueta)).toEqual(ETIQUETAS)
    expect(r.body[0]).toMatchObject({ clave: 'sin_novedad', etiqueta: 'Sin novedad', excluyeDemas: true, exigeTexto: false })
    expect(r.body[9]).toMatchObject({ clave: 'otro', etiqueta: 'Otro', excluyeDemas: false, exigeTexto: true })
    expect(r.body[0]).not.toHaveProperty('excluye_demas')
  })

  it('una novedad desactivada por SQL no se sirve: quedan nueve', async () => {
    const cookie = await adminCookie()
    await db.query("UPDATE public.catalogo_novedades SET activo = false WHERE clave = 'sello_roto'")
    const { app } = appWith()
    const r = await request(app).get('/api/novedades-remision').set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body).toHaveLength(9)
    expect(r.body.map((n: { clave: string }) => n.clave)).not.toContain('sello_roto')
  })
})
