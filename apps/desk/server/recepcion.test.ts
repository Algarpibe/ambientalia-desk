import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { db, instalarArnes, equipoRow, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`recepcion-rotulacion-foto-entrada`) · recepción con rotulado, novedades y foto por categoría.
 * Lote 1: lectura de la lista de novedades (RQ-RE-22). Lote 2: alta (RQ-RE-23, 24, 27, 17). Lote 3: fotos por categoría, puertas de enviar y payload a n8n (RQ-RE-25, 26, 08, 13).
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

/**
 * Lote 3 · foto por categoría (RQ-RE-25) y puertas de `/enviar` (RQ-RE-26, RQ-RE-08). Manda la SPEC (C3-C5): sin
 * categoría → 201 con NULL en cualquier remisión; categoría inválida, o `novedad` no marcada (también en legado) → 422.
 */
type App = import('express').Express
const PNG = Buffer.from('89504e470d0a1a0a', 'hex')
const subir = (app: App, cookie: string, id: string, campos: Record<string, string> = {}, tipo = 'image/png') => {
  let r = request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie)
  for (const [k, v] of Object.entries(campos)) r = r.field(k, v)
  return r.attach('file', PNG, { filename: 'f.png', contentType: tipo })
}
const nueva = async (app: App, cookie: string, novedades: string[] = ['rayon_estetico', 'golpe_carcasa']) =>
  (await crear(app, cookie, { novedades, rotulado: true, permitirSegunda: true })).body.id as string
const legado = async (app: App, cookie: string) =>
  (await crear(app, cookie, { hayNovedad: true, permitirSegunda: true })).body.id as string
const fotosEnBase = async () => Number((await db.query('SELECT count(*)::int AS n FROM remision_fotos')).rows[0].n)
const MINIMAS_TXT = [{ categoria: 'equipo' }, { categoria: 'accesorios' }, { categoria: 'embalaje' }]
const subirTodas = async (app: App, cookie: string, id: string, extra: Array<Record<string, string>> = []) => {
  for (const c of [...MINIMAS_TXT, ...extra]) expect((await subir(app, cookie, id, c)).status).toBe(201)
}

describe('RQ-RE-25 · la subida valida la categoría', () => {
  it.each([
    ['categoría fuera de las cuatro (nuevo)', nueva, { categoria: 'otra' }],
    ['categoría fuera de las cuatro (legado)', legado, { categoria: 'otra' }],
    ['`novedad` sin clave (nuevo)', nueva, { categoria: 'novedad' }],
    ['`novedad` con clave NO marcada (nuevo)', nueva, { categoria: 'novedad', novedad: 'sello_roto' }],
    ['`novedad` con clave en una remisión de legado', legado, { categoria: 'novedad', novedad: 'rayon_estetico' }],
  ])('%s → 422 y no se guarda la foto', async (_n, alta, campos) => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith()
    const r = await subir(app, cookie, await alta(app, cookie), campos)
    expect(r.status).toBe(422)
    expect(await fotosEnBase()).toBe(0)
  })

  it.each([['nuevo', nueva], ['legado', legado]])('sin categoría → 201 y NULL (%s)', async (_n, alta) => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith()
    const r = await subir(app, cookie, await alta(app, cookie))
    expect(r.status).toBe(201)
    expect((await db.query('SELECT categoria, novedad FROM remision_fotos')).rows).toEqual([{ categoria: null, novedad: null }])
  })

  it('categoría válida se guarda; `novedad` sólo con `novedad`; el GET la trae sin base64 (hipótesis 4: multer deja los campos en req.body)', async () => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith()
    const id = await nueva(app, cookie)
    expect((await subir(app, cookie, id, { categoria: 'embalaje', novedad: 'rayon_estetico' })).status).toBe(201)
    expect((await subir(app, cookie, id, { categoria: 'novedad', novedad: 'rayon_estetico' })).status).toBe(201)
    const get = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
    expect(get.body.fotos).toMatchObject([{ categoria: 'embalaje', novedad: null }, { categoria: 'novedad', novedad: 'rayon_estetico' }])
    expect(JSON.stringify(get.body.fotos)).not.toMatch(/contentB64|content_b64|iVBOR/)
  })

  it('PS-1 · SVG y categoría inválida a la vez → 415, no 422 (nace verde; la detecta M-P7)', async () => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith()
    const r = await subir(app, cookie, await nueva(app, cookie), { categoria: 'otra' }, 'image/svg+xml')
    expect(r.status).toBe(415)
  })
})

describe('RQ-RE-26 · /enviar del formulario nuevo', () => {
  const conN8n = async (prueba: (fetchMock: ReturnType<typeof vi.fn>) => Promise<void>) => {
    const fetchMock = vi.fn(async (...args: [string, RequestInit]) => { void args; return new Response('{}', { status: 202 }) })
    vi.stubGlobal('fetch', fetchMock)
    try { await prueba(fetchMock) } finally { vi.unstubAllGlobals() }
  }
  const enviar = (app: App, cookie: string, id: string) => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)
  const enviadoAt = async (id: string) => (await db.query('SELECT enviado_at FROM remisiones WHERE id = $1', [id])).rows[0].enviado_at
  const URL_N8N = { remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' }

  it('PE-1 · anulada o ya enviada con el formulario nuevo SIN fotos → 409, no el 422 (nace verde; la detecta M-P3)', async () => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const a = await nueva(app, cookie); const b = await nueva(app, cookie)
    await db.query('UPDATE remisiones SET anulada_at = now() WHERE id = $1', [a])
    await db.query("UPDATE remisiones SET estado = 'ok' WHERE id = $1", [b])
    expect((await enviar(app, cookie, a)).status).toBe(409)
    expect((await enviar(app, cookie, b)).status).toBe(409)
  })

  it('PE-2 · «Sin novedad» y sin fotos mínimas → 422 sin n8n y sin reclamar; se suben y se reenvía DE INMEDIATO → 200', () => conN8n(async (n8n) => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, cookie, ['sin_novedad'])
    expect((await enviar(app, cookie, id)).status).toBe(422)
    expect(n8n).not.toHaveBeenCalled(); expect(await enviadoAt(id)).toBeNull()
    await subirTodas(app, cookie, id)
    expect((await enviar(app, cookie, id)).status).toBe(200)
    expect(n8n).toHaveBeenCalledTimes(1)
  }))

  it('rotulado_at anulado por SQL con todas las fotos → 422 de rotulado, sin n8n', () => conN8n(async (n8n) => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, cookie, ['sin_novedad']); await subirTodas(app, cookie, id)
    await db.query('UPDATE remisiones SET rotulado_at = NULL WHERE id = $1', [id])
    const r = await enviar(app, cookie, id)
    expect(r.status).toBe(422); expect(r.body.error).toMatch(/rotulado y guardado/); expect(n8n).not.toHaveBeenCalled()
  }))

  it.each([
    ['faltan mínimas: nombra las categorías', ['rayon_estetico'], [{ categoria: 'equipo' }], /Faltan fotos obligatorias: .*accesorios.*embalaje/],
    ['falta la foto de una de dos novedades: la nombra', ['golpe_carcasa', 'rayon_estetico'],
      [...MINIMAS_TXT, { categoria: 'novedad', novedad: 'golpe_carcasa' }], /cada novedad marcada: Rayón o daño estético/],
    ['una foto SIN categoría no cuenta para la novedad', ['rayon_estetico'], [...MINIMAS_TXT, {}], /cada novedad marcada: Rayón/],
  ])('%s → 422', (_n, novedades, fotos, texto) => conN8n(async () => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, cookie, novedades)
    for (const c of fotos) expect((await subir(app, cookie, id, c)).status).toBe(201)
    const r = await enviar(app, cookie, id)
    expect(r.status).toBe(422); expect(r.body.error).toMatch(texto); expect(await enviadoAt(id)).toBeNull()
  }))

  it('una novedad retirada del catálogo DESPUÉS sigue exigiendo su foto', () => conN8n(async () => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, cookie, ['rayon_estetico']); await subirTodas(app, cookie, id)
    await db.query("UPDATE public.catalogo_novedades SET activo = false WHERE clave = 'rayon_estetico'")
    const r = await enviar(app, cookie, id)
    expect(r.status).toBe(422); expect(r.body.error).toMatch(/Rayón o daño estético/)
  }))

  it.each([
    ['«Sin novedad» con las tres mínimas', ['sin_novedad'], [] as Array<Record<string, string>>],
    ['completo, con la foto de cada novedad', ['golpe_carcasa', 'rayon_estetico'],
      [{ categoria: 'novedad', novedad: 'golpe_carcasa' }, { categoria: 'novedad', novedad: 'rayon_estetico' }]],
  ])('%s → 200', (_n, novedades, extra) => conN8n(async () => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, cookie, novedades); await subirTodas(app, cookie, id, extra)
    expect((await enviar(app, cookie, id)).status).toBe(200)
  }))

  it('legado con hay_novedad y cero fotos → 422 con el texto literal de siempre; con una foto sin categoría → 200', () => conN8n(async () => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await legado(app, cookie)
    const r = await enviar(app, cookie, id)
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('El equipo llegó con novedad y la remisión no tiene fotos: sube al menos una antes de enviarla.')
    expect((await subir(app, cookie, id)).status).toBe(201)
    expect((await enviar(app, cookie, id)).status).toBe(200)
  }))

  it('el payload a n8n NO cambia: las diez claves de siempre, sin categoría ni novedades (nace verde; la detecta M-N1)', () => conN8n(async (n8n) => {
    const cookie = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, cookie, ['rayon_estetico']); await subirTodas(app, cookie, id, [{ categoria: 'novedad', novedad: 'rayon_estetico' }])
    expect((await enviar(app, cookie, id)).status).toBe(200)
    const cuerpo = JSON.parse(String(n8n.mock.calls[0][1].body))
    expect(Object.keys(cuerpo).sort()).toEqual(['cliente', 'equipo', 'fecha', 'fotos', 'incluye', 'observaciones', 'remisionId', 'tecnico', 'ticketNumero', 'tipoServicio'])
    expect(Object.keys(cuerpo.fotos[0]).sort()).toEqual(['data', 'fileName', 'mimeType'])
    expect(cuerpo.observaciones).toBe('Rayón o daño estético')
  }))
})
