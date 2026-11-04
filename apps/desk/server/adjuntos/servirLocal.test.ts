import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { logger } from '../util/logger'
import type { Response as RespuestaSuper } from 'superagent'
import { db, instalarArnes, appWith, userCookie } from '../testing/appHarness'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-31, D6): `GET /api/attachment` sirve la copia local si es válida, cae a Zoho si no y deja UNA línea de
 * log sin datos de cliente. Todas las decisiones (rol, cabeceras, copia válida) las toma el servidor: nada de esto vive en `apps/desk/src`.
 */
instalarArnes()

const HREF = (id: string) => `/tickets/10/comments/20/attachments/${id}/content`
const MENSAJE_ZOHO = (id: string) => `zoho:${id}`

let base: string
let dir: string
beforeEach(async () => {
  base = await mkdtemp(join(tmpdir(), 'servir-'))
  dir = join(base, 'volumen'); await mkdir(dir)
  await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ('T10', 10, 'Asunto', 'Ingresado')")
})
afterEach(async () => { await rm(base, { recursive: true, force: true }); vi.restoreAllMocks() })

interface Opciones { size?: number | null; tipo?: string | null; name?: string | null; href?: string | null; storage?: string | null }
async function fila(id: string, o: Opciones = {}): Promise<void> {
  const v = { size: null, tipo: 'image/png', name: 'foto.png', href: HREF(id), storage: id, ...o }
  await db.query('INSERT INTO attachments (id, ticket_id, name, size, content_type, zoho_href, storage_path) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, 'T10', v.name, v.size, v.tipo, v.href, v.storage])
}
const bytes = (n: number, v = 7) => Buffer.alloc(n, v)
const storagePath = async (id: string) =>
  ((await db.query('SELECT storage_path FROM attachments WHERE id=$1', [id])).rows[0] as { storage_path: string | null }).storage_path

/** Zoho falso: cada llamada devuelve una Response NUEVA (un cuerpo sólo se lee una vez). */
function montar(opciones: { dirAdj?: string; zoho?: (path: string) => Response | Promise<Response>; base?: Queryable } = {}) {
  const h = appWith({ adjuntosDir: opciones.dirAdj ?? dir }, opciones.base)
  h.zohoFetch.mockImplementation(async (path: string) => opciones.zoho ? opciones.zoho(path) : new Response(MENSAJE_ZOHO(path), { status: 200, headers: { 'content-type': 'text/plain' } }))
  return h
}
const binario = (res: RespuestaSuper, cb: (err: Error | null, body: Buffer) => void) => {
  const trozos: Buffer[] = []
  res.on('data', (t: Buffer) => trozos.push(t)); res.on('end', () => cb(null, Buffer.concat(trozos)))
}
const pedir = (app: ReturnType<typeof appWith>['app'], path: string, cookie?: string) => {
  const r = request(app).get('/api/attachment').query({ path }).buffer(true).parse(binario)
  return cookie ? r.set('Cookie', cookie) : r
}
/** Las líneas de caída del log: las `logger.warn` con `motivo` (pino-http escribe otras por su cuenta). */
const lineasDeCaida = (espia: ReturnType<typeof vi.spyOn>) =>
  espia.mock.calls.filter((c: unknown[]) => typeof c[0] === 'object' && c[0] !== null && 'motivo' in (c[0] as object))

describe('GET /api/attachment · copia local válida (RQ-ZS-31)', () => {
  it('sirve los bytes sin llamar a Zoho, con inline, nosniff y Content-Length', async () => {
    await fila('4001', { size: 1024, tipo: 'image/png' })
    await writeFile(join(dir, '4001'), bytes(1024))
    const cookie = await userCookie(['Servicio Técnico'])
    const { app, zohoFetch } = montar()
    const res = await pedir(app, HREF('4001'), cookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(bytes(1024))
    expect(res.headers['content-type']).toBe('image/png')
    expect(res.headers['content-disposition']).toMatch(/^inline;/)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['content-length']).toBe('1024')
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('una copia válida no deja línea de caída en el log', async () => {
    await fila('4001', { size: 8 }); await writeFile(join(dir, '4001'), bytes(8))
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    await pedir(montar().app, HREF('4001'), cookie)
    expect(lineasDeCaida(espia)).toHaveLength(0)
  })

  it('sin size en la fila (null) sirve la copia: no hay tamaño que contrastar', async () => {
    await fila('4002', { size: null }); await writeFile(join(dir, '4002'), bytes(5))
    const cookie = await userCookie(['Servicio Técnico'])
    const { app, zohoFetch } = montar()
    const res = await pedir(app, HREF('4002'), cookie)
    expect(res.body).toEqual(bytes(5))
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

describe('GET /api/attachment · Content-Type y Content-Disposition los decide el servidor (S-10)', () => {
  const casos: [string, string][] = [
    ['image/png', 'inline'], ['image/jpeg', 'inline'], ['image/gif', 'inline'], ['image/webp', 'inline'], ['image/bmp', 'inline'],
    ['application/pdf', 'inline'],
    ['text/html', 'attachment'], ['image/svg+xml', 'attachment'], ['application/octet-stream', 'attachment'],
    ['application/xhtml+xml', 'attachment'], ['image/tiff', 'attachment'], ['text/plain', 'attachment'],
  ]
  for (const [tipo, disposicion] of casos) {
    it(`${tipo} se sirve ${disposicion}`, async () => {
      await fila('4100', { size: 3, tipo }); await writeFile(join(dir, '4100'), bytes(3))
      const cookie = await userCookie(['Servicio Técnico'])
      const res = await pedir(montar().app, HREF('4100'), cookie)
      expect(res.status).toBe(200)
      expect(res.headers['content-disposition']).toMatch(new RegExp(`^${disposicion};`))
      expect(res.headers['content-type']).toBe(tipo)
    })
  }

  const tipos: [string, string | null, string][] = [
    ['en mayúsculas y con parámetros se normaliza al tipo base', 'IMAGE/PNG; charset=utf-8', 'image/png'],
    ['con salto de línea cae a octet-stream (setHeader lanzaría)', 'image/png\r\nX-Evil: 1', 'application/octet-stream'],
    ['sin barra cae a octet-stream', 'basura', 'application/octet-stream'],
    ['nulo cae a octet-stream', null, 'application/octet-stream'],
    ['HTML con parámetros sigue siendo attachment', 'text/html; charset=utf-8', 'text/html'],
  ]
  for (const [titulo, tipo, esperado] of tipos) {
    it(`content_type ${titulo}`, async () => {
      await fila('4101', { size: 3, tipo }); await writeFile(join(dir, '4101'), bytes(3))
      const cookie = await userCookie(['Servicio Técnico'])
      const res = await pedir(montar().app, HREF('4101'), cookie)
      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toBe(esperado)
      expect(res.headers['content-disposition']).toMatch(esperado === 'image/png' ? /^inline;/ : /^attachment;/)
    })
  }

  it('filename ASCII sustituye comillas, barras y no ASCII por _, y filename* codifica según RFC 5987', async () => {
    await fila('4102', { size: 3, name: 'in"fo\\rme/ñ.pdf' }); await writeFile(join(dir, '4102'), bytes(3))
    const cookie = await userCookie(['Servicio Técnico'])
    const res = await pedir(montar().app, HREF('4102'), cookie)
    expect(res.headers['content-disposition']).toBe(`inline; filename="in_fo_rme__.pdf"; filename*=UTF-8''in%22fo%5Crme%2F%C3%B1.pdf`)
  })

  it("filename* también codifica ' ( ) *, que encodeURIComponent deja pasar", async () => {
    await fila('4103', { size: 3, name: "a'b(c)*d.png" }); await writeFile(join(dir, '4103'), bytes(3))
    const cookie = await userCookie(['Servicio Técnico'])
    const res = await pedir(montar().app, HREF('4103'), cookie)
    expect(res.headers['content-disposition']).toBe(`inline; filename="a'b(c)*d.png"; filename*=UTF-8''a%27b%28c%29%2Ad.png`)
  })

  it('un nombre con salto de línea no inyecta cabeceras', async () => {
    await fila('4104', { size: 3, name: 'x\r\nSet-Cookie: a=b.png' }); await writeFile(join(dir, '4104'), bytes(3))
    const cookie = await userCookie(['Servicio Técnico'])
    const res = await pedir(montar().app, HREF('4104'), cookie)
    expect(res.status).toBe(200)
    expect(res.headers['set-cookie']).toBeUndefined()
    expect(res.headers['content-disposition']).toMatch(/^inline; filename="x__Set-Cookie: a=b\.png"; filename\*=UTF-8''x%0D%0ASet-Cookie%3A%20a%3Db\.png$/)
  })

  it('sin nombre usa el id como filename', async () => {
    await fila('4105', { size: 3, name: null }); await writeFile(join(dir, '4105'), bytes(3))
    const cookie = await userCookie(['Servicio Técnico'])
    const res = await pedir(montar().app, HREF('4105'), cookie)
    expect(res.headers['content-disposition']).toBe(`inline; filename="4105"; filename*=UTF-8''4105`)
  })
})

describe('GET /api/attachment · caída a Zoho con UNA línea de log (S-11)', () => {
  it('fichero ausente (4003): sirve lo de Zoho y deja una línea con id, ticket, motivo y estado, sin nombre', async () => {
    await fila('4003', { size: 10, name: 'contrato_empresaX.pdf' })
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const { app, zohoFetch } = montar()
    const res = await pedir(app, HREF('4003'), cookie)
    expect(res.status).toBe(200)
    expect(res.body.toString()).toBe(MENSAJE_ZOHO(HREF('4003')))
    expect(zohoFetch).toHaveBeenCalledTimes(1)
    const lineas = lineasDeCaida(espia)
    expect(lineas).toHaveLength(1)
    expect(lineas[0][0]).toEqual({ adjunto: '4003', ticket: 10, motivo: 'fichero ausente', estadoZoho: 200 })
    expect(JSON.stringify(lineas)).not.toContain('contrato_empresaX')
    expect(JSON.stringify(lineas)).not.toContain(HREF('4003'))
  })

  it('tamaño distinto (4004, 10 bytes con size 20): cae a Zoho con su línea', async () => {
    await fila('4004', { size: 20, name: 'contrato_empresaX.pdf' }); await writeFile(join(dir, '4004'), bytes(10))
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const { app, zohoFetch } = montar()
    const res = await pedir(app, HREF('4004'), cookie)
    expect(res.body.toString()).toBe(MENSAJE_ZOHO(HREF('4004')))
    expect(zohoFetch).toHaveBeenCalledTimes(1)
    const lineas = lineasDeCaida(espia)
    expect(lineas).toHaveLength(1)
    expect(lineas[0][0]).toEqual({ adjunto: '4004', ticket: 10, motivo: 'tamaño distinto', estadoZoho: 200 })
    expect(JSON.stringify(lineas)).not.toContain('contrato_empresaX')
  })

  it('sin copia (storage_path nulo)', async () => {
    await fila('4006', { size: 10, storage: null })
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    await pedir(montar().app, HREF('4006'), cookie)
    expect(lineasDeCaida(espia).map((l) => l[0])).toEqual([{ adjunto: '4006', ticket: 10, motivo: 'sin copia', estadoZoho: 200 }])
  })

  it('sin fila: el id es el último número del path y no hay ticket', async () => {
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const res = await pedir(montar().app, HREF('4007'), cookie)
    expect(res.status).toBe(200)
    expect(lineasDeCaida(espia).map((l) => l[0])).toEqual([{ adjunto: '4007', ticket: null, motivo: 'sin fila', estadoZoho: 200 }])
  })

  it('sin directorio (ADJUNTOS_DIR vacía): cae a Zoho aunque la fila tenga storage_path', async () => {
    await fila('4008', { size: 8 }); await writeFile(join(dir, '4008'), bytes(8))
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const { app, zohoFetch } = montar({ dirAdj: '' })
    const res = await pedir(app, HREF('4008'), cookie)
    expect(res.body.toString()).toBe(MENSAJE_ZOHO(HREF('4008')))
    expect(zohoFetch).toHaveBeenCalledTimes(1)
    expect(lineasDeCaida(espia).map((l) => l[0])).toEqual([{ adjunto: '4008', ticket: 10, motivo: 'sin directorio', estadoZoho: 200 }])
  })

  it('sin fila y sin directorio: gana sin fila (orden de los motivos)', async () => {
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    await pedir(montar({ dirAdj: '' }).app, HREF('4009'), cookie)
    expect(lineasDeCaida(espia).map((l) => (l[0] as { motivo: string }).motivo)).toEqual(['sin fila'])
  })

  it('Zoho responde 404: la respuesta es la de hoy y el log lleva estadoZoho 404', async () => {
    await fila('4010', { storage: null })
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const res = await pedir(montar({ zoho: () => new Response('no existe', { status: 404 }) }).app, HREF('4010'), cookie)
    expect(res.status).toBe(404)
    expect(JSON.parse(res.body.toString())).toEqual({ error: 'no existe' })
    expect(lineasDeCaida(espia).map((l) => l[0])).toEqual([{ adjunto: '4010', ticket: 10, motivo: 'sin copia', estadoZoho: 404 }])
  })

  it('Zoho no responde (lanza): una línea con estadoZoho "sin respuesta" y el error llega al manejador (500)', async () => {
    await fila('4011', { storage: null })
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const res = await pedir(montar({ zoho: () => { throw new Error('red caída') } }).app, HREF('4011'), cookie)
    expect(res.status).toBe(500)
    expect(lineasDeCaida(espia).map((l) => l[0])).toEqual([{ adjunto: '4011', ticket: 10, motivo: 'sin copia', estadoZoho: 'sin respuesta' }])
  })
})

describe('GET /api/attachment · P1: sesión y guarda antes de consultar `attachments`', () => {
  function espiaDeBase() {
    const consultas: string[] = []
    const espia: Queryable = { query: (texto, params) => { consultas.push(texto); return db.query(texto, params) } }
    return { consultas, espia, deAdjuntos: () => consultas.filter((c) => /attachments/i.test(c)) }
  }

  it('sin sesión: 401 y no se consulta attachments ni se llama a Zoho', async () => {
    await fila('4001', { size: 3 }); await writeFile(join(dir, '4001'), bytes(3))
    const b = espiaDeBase()
    const { app, zohoFetch } = montar({ base: b.espia })
    const res = await pedir(app, HREF('4001'))
    expect(res.status).toBe(401)
    expect(b.deAdjuntos()).toEqual([])
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('/tickets/1/x con sesión: 400 y no se consulta attachments', async () => {
    const cookie = await userCookie(['Servicio Técnico'])
    const b = espiaDeBase()
    const { app, zohoFetch } = montar({ base: b.espia })
    const res = await pedir(app, '/tickets/1/x', cookie)
    expect(res.status).toBe(400)
    expect(b.deAdjuntos()).toEqual([])
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('control: con sesión y un path válido SÍ se consulta attachments (el espía discrimina)', async () => {
    await fila('4001', { size: 3 }); await writeFile(join(dir, '4001'), bytes(3))
    const cookie = await userCookie(['Servicio Técnico'])
    const b = espiaDeBase()
    const res = await pedir(montar({ base: b.espia }).app, HREF('4001'), cookie)
    expect(res.status).toBe(200)
    expect(b.deAdjuntos()).toHaveLength(1)
  })
})

describe('GET /api/attachment · nada fuera del directorio, ningún temporal, ninguna escritura', () => {
  it('storage_path "../secreto" no lee fuera de ADJUNTOS_DIR: cae a Zoho con motivo sin copia', async () => {
    await writeFile(join(base, 'secreto'), 'contenido-secreto')
    await fila('4020', { size: 17, storage: '../secreto' })
    const cookie = await userCookie(['Servicio Técnico'])
    const espia = vi.spyOn(logger, 'warn')
    const res = await pedir(montar().app, HREF('4020'), cookie)
    expect(res.body.toString()).toBe(MENSAJE_ZOHO(HREF('4020')))
    expect(res.body.toString()).not.toContain('secreto')
    expect(lineasDeCaida(espia).map((l) => (l[0] as { motivo: string }).motivo)).toEqual(['sin copia'])
  })

  it('un temporal junto a 4005 no se sirve, ni como storage_path ni por estar al lado', async () => {
    const tmp = '.4005.123.abc.tmp'
    await writeFile(join(dir, tmp), 'a-medias')
    await fila('4005', { size: 8, storage: tmp })
    const cookie = await userCookie(['Servicio Técnico'])
    const res = await pedir(montar().app, HREF('4005'), cookie)
    expect(res.body.toString()).toBe(MENSAJE_ZOHO(HREF('4005')))
    expect(res.body.toString()).not.toContain('a-medias')
  })

  it('con un storage_path nulo y un temporal presente tampoco se sirve', async () => {
    await writeFile(join(dir, '.4012.1.x.tmp'), 'a-medias')
    await fila('4012', { size: 8, storage: null })
    const cookie = await userCookie(['Servicio Técnico'])
    const res = await pedir(montar().app, HREF('4012'), cookie)
    expect(res.body.toString()).toBe(MENSAJE_ZOHO(HREF('4012')))
  })

  it('una caída a Zoho que devuelve 200 no crea ficheros ni cambia storage_path', async () => {
    await fila('4013', { size: 10, storage: null })
    await fila('4014', { size: 20, storage: '4014' }); await writeFile(join(dir, '4014'), bytes(10))
    const antes = await readdir(dir)
    const cookie = await userCookie(['Servicio Técnico'])
    const { app } = montar({ zoho: () => new Response(bytes(10), { status: 200, headers: { 'content-type': 'image/png' } }) })
    expect((await pedir(app, HREF('4013'), cookie)).status).toBe(200)
    expect((await pedir(app, HREF('4014'), cookie)).status).toBe(200)
    expect((await readdir(dir)).sort()).toEqual(antes.sort())
    expect(antes).toEqual(['4014'])
    expect(await storagePath('4013')).toBeNull()
    expect(await storagePath('4014')).toBe('4014')
  })
})
