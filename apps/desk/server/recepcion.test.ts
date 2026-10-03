import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { db, instalarArnes, equipoRow, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`recepcion-rotulacion-foto-entrada`) · recepción con rotulado, novedades y foto por categoría.
 * Lote 1: lectura de la lista de novedades (RQ-RE-22). Lote 2: alta (RQ-RE-23, 24, 27, 17). El bloque de fotos entra en el lote 3.
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

/**
 * Lote 2 · el alta con `novedades` (formulario nuevo, RQ-RE-27). Ticket 't1' con equipo y serial, y 'tz' de Zoho sin serial.
 */
const preparar = async () => {
  await upsertEquipo(db, equipoRow('eq-rc1', '18A20070'))
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-rc1', 'Grimm', 'EDM180C', '18A1')`)
}
const ticketSinSerial = async () => {
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('tz', 1234, 'Ticket creado', false, 'cli1', 'Mantenimiento', NULL, 'Grimm', 'EDM180C', NULL)`)
}
const crear = (app: import('express').Express, cookie: string, extra: object, ticketId = 't1') =>
  request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId, fecha: '2026-08-03', incluye: [], ...extra })
const cuantas = async () => Number((await db.query('SELECT count(*)::int AS n FROM remisiones')).rows[0].n)

describe('RQ-RE-23 · el alta valida las novedades (los seis 422)', () => {
  const casos: Array<[string, object, RegExp]> = [
    ['lista vacía', { novedades: [], rotulado: true }, /Marca al menos una novedad/],
    ['novedades null explícito (presente, no ausente)', { novedades: null, rotulado: true }, /Marca al menos una novedad/],
    ['novedades que no es lista', { novedades: 'x', rotulado: true }, /Marca al menos una novedad/],
    ['clave desconocida', { novedades: ['zzz'], rotulado: true }, /fuera de la lista: zzz/],
    ['«Sin novedad» junto con otra', { novedades: ['sin_novedad', 'rayon_estetico'], rotulado: true }, /«Sin novedad» no se puede marcar junto con otra/],
    ['«Otro» sin texto', { novedades: ['otro'], rotulado: true }, /«Otro» exige describir/],
    ['sin rotulado', { novedades: ['rayon_estetico'] }, /rotulado y guardado/],
  ]
  for (const [nombre, cuerpo, texto] of casos) {
    it(`${nombre} → 422 con la causa y sin remisión`, async () => {
      const cookie = await adminCookie(); await preparar()
      const { app } = appWith()
      const r = await crear(app, cookie, cuerpo)
      expect(r.status).toBe(422)
      expect(r.body.error).toMatch(texto)
      expect(await cuantas()).toBe(0)
    })
  }

  it('rotulado que no es exactamente true (false, "true", 1) → 422', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    for (const rotulado of [false, 'true', 1]) {
      const r = await crear(app, cookie, { novedades: ['rayon_estetico'], rotulado })
      expect(r.status, `rotulado=${JSON.stringify(rotulado)}`).toBe(422)
    }
    expect(await cuantas()).toBe(0)
  })

  it('una clave desactivada por SQL → 422 (D2)', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE public.catalogo_novedades SET activo = false WHERE clave = 'sello_roto'")
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['sello_roto'], rotulado: true })
    expect(r.status).toBe(422)
    expect(r.body.error).toMatch(/fuera de la lista: sello_roto/)
    const buena = await crear(app, cookie, { novedades: ['golpe_carcasa'], rotulado: true })
    expect(buena.status, 'otra novedad activa sigue pasando').toBe(201)
  })

  it('catálogo vacío (DELETE) → 422 «no está cargada», y sin remisión (M-D4)', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query('DELETE FROM public.catalogo_novedades')
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['rayon_estetico'], rotulado: true })
    expect(r.status).toBe(422)
    expect(r.body.error).toMatch(/no está cargada/)
    expect(await cuantas()).toBe(0)
  })
})

describe('RQ-RE-23 · el alta guarda la instantánea y deriva los campos', () => {
  it('201: instantánea por orden, novedad_otro recortado, hay_novedad derivado y observaciones compuestas', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['otro', 'rayon_estetico'], novedadOtro: ' pantalla rota ', rotulado: true })
    expect(r.status).toBe(201)
    expect(r.body.novedades).toEqual([
      { clave: 'rayon_estetico', etiqueta: 'Rayón o daño estético' },
      { clave: 'otro', etiqueta: 'Otro' },
    ])
    expect(r.body.novedadOtro).toBe('pantalla rota')
    expect(r.body.hayNovedad).toBe(true)
    expect(r.body.observaciones).toBe('Rayón o daño estético; Otro: pantalla rota')
    const fila = (await db.query('SELECT hay_novedad, observaciones, novedad_otro FROM remisiones WHERE id = $1', [r.body.id])).rows[0]
    expect(fila).toMatchObject({ hay_novedad: true, observaciones: 'Rayón o daño estético; Otro: pantalla rota', novedad_otro: 'pantalla rota' })
  })

  it('sólo «Sin novedad»: hay_novedad false, observaciones «Sin novedad» y novedad_otro NULL', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['sin_novedad'], novedadOtro: 'texto suelto', rotulado: true })
    expect(r.status).toBe(201)
    const fila = (await db.query('SELECT hay_novedad, observaciones, novedad_otro FROM remisiones WHERE id = $1', [r.body.id])).rows[0]
    expect(fila).toEqual({ hay_novedad: false, observaciones: 'Sin novedad', novedad_otro: null })
  })

  it('el cuerpo no decide: observaciones, hayNovedad, rotuladoPor y rotuladoAt falsos se ignoran', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const antes = Date.now()
    const r = await crear(app, cookie, {
      novedades: ['rayon_estetico'], rotulado: true, observaciones: 'FALSA', hayNovedad: false,
      rotuladoPor: 'Otra Persona', rotuladoAt: '2020-01-01T00:00:00Z',
    })
    const despues = Date.now()
    expect(r.status).toBe(201)
    const fila = (await db.query('SELECT hay_novedad, observaciones, rotulado_por, rotulado_at FROM remisiones WHERE id = $1', [r.body.id])).rows[0]
    expect(fila.hay_novedad).toBe(true)
    expect(fila.observaciones).toBe('Rayón o daño estético')
    expect(fila.rotulado_por, 'la persona es la de la sesión').toBe('Admin')
    const t = new Date(fila.rotulado_at).getTime()
    expect(t, 'la hora es la del servidor, no la del cuerpo').toBeGreaterThanOrEqual(antes)
    expect(t).toBeLessThanOrEqual(despues)
    expect(r.body.rotuladoPor).toBe('Admin')
    expect(new Date(r.body.rotuladoAt).getTime()).toBe(t)
  })

  it('la instantánea no cambia cuando se corrige la etiqueta del catálogo', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['rayon_estetico'], rotulado: true })
    await db.query("UPDATE public.catalogo_novedades SET etiqueta = 'Etiqueta corregida' WHERE clave = 'rayon_estetico'")
    const g = await request(app).get(`/api/remisiones/${r.body.id}`).set('Cookie', cookie)
    expect(g.body.novedades).toEqual([{ clave: 'rayon_estetico', etiqueta: 'Rayón o daño estético' }])
    expect(g.body.observaciones).toBe('Rayón o daño estético')
  })
})

describe('RQ-RE-27 · legado: sin `novedades` el alta es la de siempre', () => {
  it('guarda hay_novedad y observaciones del cuerpo y deja novedades, novedad_otro, rotulado_por y rotulado_at en NULL de SQL', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const r = await crear(app, cookie, { hayNovedad: true, observaciones: 'golpe en la tapa' })
    expect(r.status).toBe(201)
    expect(r.body).toMatchObject({ hayNovedad: true, observaciones: 'golpe en la tapa', novedades: null, novedadOtro: null, rotuladoPor: null, rotuladoAt: null })
    const fila = (await db.query(
      `SELECT novedades IS NULL AS n_nulo, novedad_otro IS NULL AS o_nulo, rotulado_por IS NULL AS p_nulo, rotulado_at IS NULL AS a_nulo
         FROM remisiones WHERE id = $1`, [r.body.id])).rows[0]
    expect(fila, 'NULL de SQL, no el JSON null').toEqual({ n_nulo: true, o_nulo: true, p_nulo: true, a_nulo: true })
  })

  it('un cuerpo de legado con `rotulado` y `rotuladoPor` no los guarda', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const r = await crear(app, cookie, { rotulado: true, rotuladoPor: 'Otra Persona' })
    expect(r.status).toBe(201)
    expect(r.body).toMatchObject({ rotuladoPor: null, rotuladoAt: null })
  })
})

describe('D1-D3 · las reglas se deciden por las marcas del catálogo, no por la clave', () => {
  it('D1a · `exige_texto` apagada en «Otro» por SQL: «Otro» sin texto → 201', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE public.catalogo_novedades SET exige_texto = false WHERE clave = 'otro'")
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['otro'], rotulado: true })
    expect(r.status).toBe(201)
    expect(r.body.observaciones).toBe('Otro')
    expect(r.body.novedadOtro).toBeNull()
  })

  it('D1b · `exige_texto` encendida en otra fila: ésa lo exige', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE public.catalogo_novedades SET exige_texto = true WHERE clave = 'falta_accesorio'")
    const { app } = appWith()
    const sin = await crear(app, cookie, { novedades: ['falta_accesorio'], rotulado: true })
    expect(sin.status).toBe(422)
    expect(sin.body.error).toMatch(/«Falta un accesorio» exige describir/)
    const con = await crear(app, cookie, { novedades: ['falta_accesorio'], novedadOtro: 'el cable', rotulado: true })
    expect(con.status).toBe(201)
    expect(con.body.observaciones).toBe('Falta un accesorio: el cable')
  })

  it('D3a · `excluye_demas` apagada en «Sin novedad»: convive con otra → 201 con hay_novedad true', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE public.catalogo_novedades SET excluye_demas = false WHERE clave = 'sin_novedad'")
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['sin_novedad', 'rayon_estetico'], rotulado: true })
    expect(r.status).toBe(201)
    expect(r.body.hayNovedad).toBe(true)
  })

  it('D3b · `excluye_demas` encendida en otra fila: marcarla junto a otra → 422', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE public.catalogo_novedades SET excluye_demas = true WHERE clave = 'golpe_carcasa'")
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['golpe_carcasa', 'rayon_estetico'], rotulado: true })
    expect(r.status).toBe(422)
    expect(r.body.error).toMatch(/«Golpe o abolladura en la carcasa» no se puede marcar junto con otra/)
  })
})

/**
 * Regla de mutación 1 · POSICIÓN de la guarda del alta (línea 158 de `routes/remision.ts`), cada prueba con las
 * DOS guardas activas a la vez. A (serial) < C (novedades) < D (pendiente).
 */
describe('Posición · serial (A) < novedades (C) < remisión pendiente (D)', () => {
  it('PA-1 · sin serial y `novedades: []` → «Falta el serial», no el de las novedades (nace verde; la detecta M-P1)', async () => {
    const cookie = await adminCookie(); await ticketSinSerial()
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: [] }, 'tz')
    expect(r.status).toBe(422)
    expect(r.body.error).toMatch(/Falta el serial/)
    expect(await cuantas()).toBe(0)
  })

  it('PA-2 · remisión pendiente previa sin permitirSegunda y `novedades: []` → 422 de novedades, no 409', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const primera = await crear(app, cookie, { novedades: ['sin_novedad'], rotulado: true })
    expect(primera.status).toBe(201)
    const r = await crear(app, cookie, { novedades: [] })
    expect(r.status).toBe(422)
    expect(r.body.error).toMatch(/Marca al menos una novedad/)
    expect(await cuantas(), 'no se creó otra: sigue sólo la primera').toBe(1)
  })

  it('con la remisión pendiente y novedades VÁLIDAS el 409 sigue ganando (la guarda nueva no lo desplaza)', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    await crear(app, cookie, { novedades: ['sin_novedad'], rotulado: true })
    const r = await crear(app, cookie, { novedades: ['sin_novedad'], rotulado: true })
    expect(r.status).toBe(409)
  })

  it('las novedades corren antes que el rotulado: lista inválida y `rotulado` ausente → el 422 es el de las novedades', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const r = await crear(app, cookie, { novedades: ['zzz'] })
    expect(r.status).toBe(422)
    expect(r.body.error).toMatch(/fuera de la lista/)
  })
})
