import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import path from 'node:path'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-32, L5) · las dos rutas `/api/admin/relleno-adjuntos` y su guarda.
 * Orden total de F1B-10: sesión (401) < rol (403) < interruptor (403) < contenido (400) < ejecución. El rol, los dos interruptores
 * (la variable y el directorio) y el contenido los impone el servidor (regla invariable 13): aquí se prueban contra el servidor real
 * de `createApp`, con la `zohoFetch` falsa del arnés y un directorio propio de `fs.mkdtemp` (ruta absoluta, fuera de `dist/`).
 * Molde: `rellenoConversacionesRutas.test.ts` (1G-01).
 */
const RUTA = '/api/admin/relleno-adjuntos'
const MB = 1048576
const HREF = (id: string) => `/tickets/10/comments/20/attachments/${id}/content`

let dir: string
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'relleno-adjuntos-rutas-')) })
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

const ticket = (id: string, numero: number) => db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,$2,'A','Ingresado')", [id, numero])
const adjunto = (id: string, tk: string, size: number | null, href: string | null = HREF(id)) =>
  db.query('INSERT INTO attachments (id, ticket_id, name, size, zoho_href) VALUES ($1,$2,$3,$4,$5)', [id, tk, 'foto.png', size, href])
/** Tickets 10, 20 y 30: tres adjuntos pendientes de 1 MB (uno por ticket) y uno sin `zoho_href` en el 30. */
const siembra = async () => {
  for (const n of [10, 20, 30]) await ticket(`T${n}`, n)
  await adjunto('4001', 'T10', MB); await adjunto('4002', 'T20', MB); await adjunto('4003', 'T30', MB)
  await adjunto('4004', 'T30', MB, null)
}
const storagePath = async (id: string) => ((await db.query('SELECT storage_path FROM attachments WHERE id=$1', [id])).rows[0] as { storage_path: string | null }).storage_path
/** Una `zohoFetch` que nunca responde: la pasada queda EN MARCHA mientras dura la prueba. */
const colgada = (z: { mockImplementation: (f: () => Promise<Response>) => unknown }) => z.mockImplementation(() => new Promise<Response>(() => {}))
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const abierta = () => appWith({ rellenoAdjuntosHabilitado: true, adjuntosDir: dir })

describe('relleno-adjuntos · sesión y rol (escalones A y B)', () => {
  it('sin sesión, 401 en POST y en GET', async () => {
    const { app, zohoFetch } = abierta()
    expect((await request(app).post(RUTA)).status).toBe(401)
    expect((await request(app).get(RUTA)).status).toBe(401)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('un usuario que no es superadministrador recibe 403 en POST y en GET, con el interruptor abierto, y no se lanza nada', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    const op = await userCookie([])
    expect((await request(app).post(RUTA).set('Cookie', op)).status).toBe(403)
    expect((await request(app).get(RUTA).set('Cookie', op)).status).toBe(403)
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', await adminCookie())).body.enMarcha).toBe(false)
  })

  it('con el interruptor cerrado, el rol va ANTES: el que no es superadministrador no oye hablar de la variable ni del directorio', async () => {
    const { app } = appWith()
    const r = await request(app).post(RUTA).set('Cookie', await userCookie([]))
    expect(r.status).toBe(403)
    expect(JSON.stringify(r.body)).not.toContain('RELLENO_ADJUNTOS_HABILITADO')
    expect(JSON.stringify(r.body)).not.toContain('ADJUNTOS_DIR')
  })
})

describe('relleno-adjuntos · interruptor cerrado (escalón B antes que el contenido C)', () => {
  it('POST cerrado: 403 que nombra la variable y ofrece limite=0, sin llamar a Zoho', async () => {
    await siembra()
    const { app, zohoFetch } = appWith({ adjuntosDir: dir })
    const r = await request(app).post(RUTA).set('Cookie', await adminCookie())
    expect(r.status).toBe(403)
    expect(r.body.error).toContain('RELLENO_ADJUNTOS_HABILITADO')
    expect(r.body.error).toContain('limite=0')
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('cerrado y limite=abc: 403 y no 400 (la guarda va antes de validar)', async () => {
    const { app, zohoFetch } = appWith({ adjuntosDir: dir })
    const r = await request(app).post(RUTA).query({ limite: 'abc' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(403)
    expect(r.body.error).toContain('RELLENO_ADJUNTOS_HABILITADO')
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('cerrado y desde=abc&limite=5: 403 y no 400 (P2: el interruptor va antes de validar)', async () => {
    const { app } = appWith({ adjuntosDir: dir })
    const r = await request(app).post(RUTA).query({ desde: 'abc', limite: '5' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(403)
    expect(r.body.error).toContain('RELLENO_ADJUNTOS_HABILITADO')
  })

  it('el GET no lo gobierna el interruptor: cerrado, devuelve el estado', async () => {
    const { app } = appWith()
    const r = await request(app).get(RUTA).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ enMarcha: false, terminado: false, aRecorrer: 0, pedidos: 0 })
  })
})

describe('relleno-adjuntos · interruptor abierto sin directorio válido (escalón B antes que el contenido C)', () => {
  const sinDirectorio: [string, string][] = [
    ['vacío', ''],
    ['relativo', path.join('volumen', 'adjuntos')],
    ['dentro de dist/', path.resolve(process.cwd(), 'dist', 'adjuntos')],
  ]
  it.each(sinDirectorio)('abierto con ADJUNTOS_DIR %s y limite=abc: 403 que nombra ADJUNTOS_DIR, no 400, y no se llama a Zoho', async (_n, valor) => {
    await siembra()
    const { app, zohoFetch } = appWith({ rellenoAdjuntosHabilitado: true, adjuntosDir: valor })
    const cookie = await adminCookie()
    const r = await request(app).post(RUTA).query({ limite: 'abc' }).set('Cookie', cookie)
    expect(r.status).toBe(403)
    expect(r.body.error).toContain('ADJUNTOS_DIR')
    expect(r.body.error).not.toContain('RELLENO_ADJUNTOS_HABILITADO')
    expect((await request(app).post(RUTA).set('Cookie', cookie)).status).toBe(403)
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('abierto sin directorio, limite=0 sigue contando (todo es pendiente) y el rol manda igual', async () => {
    await siembra()
    const { app, zohoFetch } = appWith({ rellenoAdjuntosHabilitado: true, adjuntosDir: '' })
    const r = await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ pendientes: 3, sinRuta: 1, yaPresentes: 0 })
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', await userCookie([]))).status).toBe(403)
  })
})

describe('relleno-adjuntos · validación (escalón C), con todo abierto', () => {
  it('limite no numérico, negativo, decimal o vacío: 400', async () => {
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    for (const limite of ['abc', '-1', '1.5', '']) {
      expect((await request(app).post(RUTA).query({ limite }).set('Cookie', cookie)).status, `limite=${limite}`).toBe(400)
    }
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('desde no numérico: 400, y no se lanza nada', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    expect((await request(app).post(RUTA).query({ desde: 'abc' }).set('Cookie', cookie)).status).toBe(400)
    expect((await request(app).post(RUTA).query({ desde: '1.5', limite: '5' }).set('Cookie', cookie)).status).toBe(400)
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })
})

describe('relleno-adjuntos · limite=0 sólo cuenta (S-3)', () => {
  it.each([[false], [true]])('con el interruptor abierto=%s: 3 pendientes (3 MB) y 1 sin ruta, sin Zoho y sin escribir', async (abierto) => {
    await siembra()
    const { app, zohoFetch } = appWith({ rellenoAdjuntosHabilitado: abierto, adjuntosDir: dir })
    const cookie = await adminCookie()
    const r = await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ pendientes: 3, bytes: 3 * MB, mb: 3, sinTamano: 0, sinRuta: 1, yaPresentes: 0 })
    await esperar(20)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect(await readdir(dir)).toEqual([])
    expect(await storagePath('4001')).toBeNull()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('con desde=20 cuenta sólo del ticket 20 en adelante (triangula el recuento)', async () => {
    await siembra()
    const { app } = appWith({ adjuntosDir: dir })
    const r = await request(app).post(RUTA).query({ limite: '0', desde: '20' }).set('Cookie', await adminCookie())
    expect(r.body).toEqual({ pendientes: 2, bytes: 2 * MB, mb: 2, sinTamano: 0, sinRuta: 1, yaPresentes: 0 })
  })

  it('limite=0 de un no superadministrador sigue siendo 403 (el rol manda aunque no escriba)', async () => {
    const { app } = appWith({ adjuntosDir: dir })
    expect((await request(app).post(RUTA).query({ limite: '0' }).set('Cookie', await userCookie([]))).status).toBe(403)
  })
})

describe('relleno-adjuntos · POST en segundo plano, GET nunca lanza, POST en marcha', () => {
  it('el GET sin pasada devuelve «sin pasada» y NO lanza: ni Zoho ni estado en marcha, ni ahora ni después', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    const cookie = await adminCookie()
    const r = await request(app).get(RUTA).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ enMarcha: false, terminado: false, aRecorrer: 0 })
    await esperar(30)
    expect(zohoFetch).not.toHaveBeenCalled()
    expect((await request(app).get(RUTA).set('Cookie', cookie)).body.enMarcha).toBe(false)
  })

  it('el POST responde SIN esperar la pasada (la zohoFetch nunca responde) y la pasada arranca por el primer adjunto', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    colgada(zohoFetch)
    const cookie = await adminCookie()
    const r = await request(app).post(RUTA).set('Cookie', cookie)
    expect(r.status).toBe(200)
    expect(r.body.lanzada).toBe(true)
    expect(r.body.estado.enMarcha).toBe(true)
    const t0 = Date.now()
    while (zohoFetch.mock.calls.length === 0 && Date.now() - t0 < 3000) await esperar(10)
    expect(zohoFetch.mock.calls.length).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toBe(HREF('4001'))
    const g = await request(app).get(RUTA).set('Cookie', cookie)
    expect(g.body).toMatchObject({ enMarcha: true, aRecorrer: 4 })
  })

  it('el POST pasa desde y limite a la pasada', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    colgada(zohoFetch)
    const r = await request(app).post(RUTA).query({ desde: '20', limite: '1' }).set('Cookie', await adminCookie())
    expect(r.status).toBe(200)
    expect(r.body.estado).toMatchObject({ desde: 20, limite: 1 })
  })

  it('un segundo POST con la pasada en marcha devuelve su estado y NO lanza otra', async () => {
    await siembra()
    const { app, zohoFetch } = abierta()
    colgada(zohoFetch)
    const cookie = await adminCookie()
    const primero = await request(app).post(RUTA).set('Cookie', cookie)
    expect(primero.body.lanzada).toBe(true)
    const segundo = await request(app).post(RUTA).query({ desde: '30' }).set('Cookie', cookie)
    expect(segundo.status).toBe(200)
    expect(segundo.body.lanzada).toBe(false)
    expect(segundo.body.estado).toMatchObject({ enMarcha: true, desde: null })
    await esperar(30)
    expect(zohoFetch.mock.calls.length).toBe(1)
  })

  it('con todo abierto la pasada guarda el adjunto en el directorio del servidor y fija storage_path (el cableado llega al motor)', async () => {
    await ticket('T10', 10)
    await adjunto('4001', 'T10', 5)
    const { app, zohoFetch } = abierta()
    zohoFetch.mockImplementation(async () => new Response(new Uint8Array(5).fill(7), { status: 200 }))
    const cookie = await adminCookie()
    expect((await request(app).post(RUTA).set('Cookie', cookie)).body.lanzada).toBe(true)
    let estado: { terminado: boolean; cuentas: { guardados: number }; bytes: number } = (await request(app).get(RUTA).set('Cookie', cookie)).body
    for (let i = 0; i < 300 && !estado.terminado; i++) { await esperar(10); estado = (await request(app).get(RUTA).set('Cookie', cookie)).body }
    expect(estado).toMatchObject({ terminado: true, bytes: 5, cuentas: { guardados: 1 } })
    expect(await readdir(dir)).toEqual(['4001'])
    expect(await storagePath('4001')).toBe('4001')
  })
})
