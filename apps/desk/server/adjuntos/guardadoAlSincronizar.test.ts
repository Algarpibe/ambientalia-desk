import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { loadConfig } from '@ambientalia/zoho-sync/config'
import { createSync } from '@ambientalia/zoho-sync/sync'
import { opcionesConversaciones } from '../opcionesConversaciones'
import { conGuardadoDeAdjuntos, TOPE_ADJUNTOS_POR_CICLO } from './guardadoAlSincronizar'
import { logger } from '../util/logger'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-33, D5), lote L4: el guardado al sincronizar, con `createSync` REAL. La pasada periódica
 * guarda las conversaciones de un ticket y, al final, `trasGuardar` trae los adjuntos pendientes de esos tickets hasta el tope.
 * pg-mem + `fs.mkdtemp` + `zohoFetch` falsa y enrutada. Las pausas se pasan a 0 por la opción, como las de conversaciones.
 */
const HREF = (id: string) => `/tickets/10/comments/20/attachments/${id}/content`
const hora = (n: number) => `2026-10-03T10:0${n}:00.000Z`
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const entorno = {
  ZOHO_CLIENT_ID: 'cid', ZOHO_CLIENT_SECRET: 'sec', ZOHO_REFRESH_TOKEN: 'ref', ZOHO_ORG_ID: '713448415',
  ZOHO_DEPARTMENT_ID: '495552000000006907', DATABASE_URL: 'postgres://u:p@localhost:5432/desk',
}

let db: Queryable
let base: string
let dir: string
const tamanos = new Map<string, number>()
const respuestas = new Map<string, () => Response | Promise<Response>>()
const modificado: Record<string, string> = {}
beforeEach(async () => {
  tamanos.clear(); respuestas.clear(); for (const k of Object.keys(modificado)) delete modificado[k]
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  base = await mkdtemp(join(tmpdir(), 'guardado-al-sincronizar-'))
  dir = join(base, 'volumen'); await mkdir(dir)
  await db.query("INSERT INTO tickets (id, number, status, modified_time) VALUES ('Z1', 1, 'Ingresado', '2026-10-02T10:00:00.000Z')")
})
afterEach(async () => { await rm(base, { recursive: true, force: true }) })

/** Un solo `zohoFetch` enrutado: búsqueda con el 101, su detalle, su lista de conversaciones y los adjuntos. */
const peticiones: string[] = []
function crearZoho() {
  peticiones.length = 0
  return vi.fn(async (path: string) => {
    peticiones.push(path)
    const adjunto = /attachments\/(\d+)\/content$/.exec(path)
    if (adjunto) {
      const otra = respuestas.get(adjunto[1])
      if (otra) return otra()
      return new Response(new Uint8Array(Buffer.alloc(tamanos.get(adjunto[1]) ?? 1, 7)), { status: 200 })
    }
    if (path.startsWith('/tickets/101/conversations?')) return json({ data: [{ id: 'c101', type: 'comment', content: 'x', commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' }] })
    if (path.startsWith('/tickets/search?')) return json({ data: [{ id: '101', modifiedTime: modificado['101'] ?? hora(1) }] })
    if (path.startsWith('/tickets/101?')) return json({ id: '101', ticketNumber: '101', subject: 's', status: 'Ingresado', statusType: 'Open', customFields: {}, modifiedTime: modificado['101'] ?? hora(1), commentCount: 1, threadCount: 0 })
    return new Response(null, { status: 404 })
  })
}
const descargas = () => peticiones.filter((p) => p.includes('/attachments/')).map((p) => /attachments\/(\d+)\//.exec(p)?.[1] ?? '?')
const listasPedidas = () => peticiones.filter((p) => p.includes('/conversations?')).length

async function adj(id: string, ticket: string, size: number | null, o: { name?: string; href?: string | null; storage?: string | null } = {}) {
  if (size !== null) tamanos.set(id, size)
  await db.query('INSERT INTO attachments (id, ticket_id, name, size, zoho_href, storage_path) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, ticket, o.name ?? 'foto.png', size, o.href === undefined ? HREF(id) : o.href, o.storage ?? null])
}
const storagePath = async (id: string) =>
  ((await db.query('SELECT storage_path FROM attachments WHERE id=$1', [id])).rows[0] as { storage_path: string | null }).storage_path
const ids = (desde: number, hasta: number) => Array.from({ length: hasta - desde }, (_, i) => String(desde + i))

/** El cableado de `index.ts` con las pausas a 0: la lectura de interruptores es de `loadConfig`, el gancho lo pone `conGuardadoDeAdjuntos`. */
function montar(extra: Record<string, string> = {}, zohoFetch = crearZoho()) {
  const config = loadConfig({ ...entorno, SYNC_CONVERSACIONES_PERIODICA: 'true', GUARDAR_ADJUNTOS_AL_SINCRONIZAR: 'true', ADJUNTOS_DIR: dir, ...extra })
  const op = conGuardadoDeAdjuntos({ ...opcionesConversaciones(config), pausaMs: 0, pausa429Ms: 0 }, config, { zohoFetch, db })
  return { sync: createSync({ zohoFetch, db, config, conversaciones: op }), op, config, zohoFetch }
}

describe('guardado al sincronizar · la pasada trae los pendientes, hasta el tope (RQ-ZS-33)', () => {
  it('el tope es de 20 peticiones por ciclo', () => {
    expect(TOPE_ADJUNTOS_POR_CICLO).toBe(20)
  })

  it('un ticket recién guardado con 25 pendientes y otro no tocado con uno: se guardan 20 del primero y ninguno del otro; el ciclo siguiente trae los 5', async () => {
    for (const id of ids(5001, 5026)) await adj(id, '101', 4)
    await adj('9001', 'Z1', 4)
    const { sync } = montar()
    expect(await sync.syncRecent()).toBe(1)
    expect(descargas()).toEqual(ids(5001, 5021))
    expect((await readdir(dir)).sort()).toEqual(ids(5001, 5021))
    expect(await storagePath('5020')).toBe('5020')
    expect(await storagePath('5021')).toBeNull()
    expect(await storagePath('9001')).toBeNull()
    modificado['101'] = hora(2)
    peticiones.length = 0
    await sync.syncRecent()
    expect(descargas()).toEqual(ids(5021, 5026))
    expect((await readdir(dir)).sort()).toEqual(ids(5001, 5026))
    expect(await storagePath('9001')).toBeNull()
  })

  it('el tope cuenta peticiones, no pendientes: tres ya presentes y una sin ruta no gastan peticiones y quedan 20 de 21', async () => {
    for (const id of ids(5001, 5004)) { await adj(id, '101', 4, { storage: id }); await writeFile(join(dir, id), Buffer.alloc(4, 7)) }
    await adj('5004', '101', 4, { href: null })
    for (const id of ids(5005, 5026)) await adj(id, '101', 4)
    await montar().sync.syncRecent()
    expect(descargas()).toEqual(ids(5005, 5025))
    expect(await storagePath('5004')).toBeNull()
  })

  it('un adjunto que falla con 500 cuenta para el tope y el siguiente se pide igual', async () => {
    for (const id of ids(5001, 5024)) await adj(id, '101', 4)
    respuestas.set('5001', () => new Response(null, { status: 500 }))
    await montar().sync.syncRecent()
    expect(descargas()).toEqual(ids(5001, 5021))
    expect(await storagePath('5001')).toBeNull()
    expect(await storagePath('5002')).toBe('5002')
  })
})

describe('guardado al sincronizar · interruptor cerrado o sin periódica (RQ-ZS-33)', () => {
  it.each(['TRUE', '1', ''])('GUARDAR_ADJUNTOS_AL_SINCRONIZAR=%j: la pasada guarda las conversaciones y no se descarga nada', async (valor) => {
    await adj('5001', '101', 4)
    const { sync, op } = montar({ GUARDAR_ADJUNTOS_AL_SINCRONIZAR: valor })
    expect(op.trasGuardar).toBeUndefined()
    await sync.syncRecent()
    expect(listasPedidas()).toBe(1)
    expect(descargas()).toEqual([])
    expect(await readdir(dir)).toEqual([])
  })

  it('con el interruptor abierto pero SYNC_CONVERSACIONES_PERIODICA cerrado no hay pasada y no se descarga nada', async () => {
    await adj('5001', '101', 4)
    const { sync } = montar({ SYNC_CONVERSACIONES_PERIODICA: 'false' })
    expect(await sync.syncRecent()).toBe(1)
    expect(listasPedidas()).toBe(0)
    expect(descargas()).toEqual([])
  })

  it('con ambos abiertos el mismo escenario sí descarga (el control de las dos pruebas anteriores)', async () => {
    await adj('5001', '101', 4)
    const { sync, op } = montar()
    expect(op.trasGuardar).toBeTypeOf('function')
    await sync.syncRecent()
    expect(descargas()).toEqual(['5001'])
  })

  it('el gancho conserva las demás opciones y no toca el objeto que recibe', () => {
    const { op } = montar()
    expect(op).toMatchObject({ periodica: true, marcarAusentes: false, pausaMs: 0, pausa429Ms: 0 })
    const original = { periodica: true }
    const config = loadConfig({ ...entorno, GUARDAR_ADJUNTOS_AL_SINCRONIZAR: 'true', ADJUNTOS_DIR: dir })
    conGuardadoDeAdjuntos(original, config, { zohoFetch: crearZoho(), db })
    expect(original).toEqual({ periodica: true })
  })
})

describe('guardado al sincronizar · sin directorio válido no se escribe nada (RQ-ZS-30, pasada)', () => {
  it.each([
    ['ausente', ''],
    ['relativa', 'adjuntos'],
    ['dentro de dist/', resolve(process.cwd(), 'dist', 'adjuntos')],
  ])('ADJUNTOS_DIR %s: sin gancho, sin descargas y sin storage_path', async (_caso, valor) => {
    await adj('5001', '101', 4)
    const { sync, op } = montar({ ADJUNTOS_DIR: valor })
    expect(op.trasGuardar).toBeUndefined()
    await sync.syncRecent()
    expect(listasPedidas()).toBe(1)
    expect(descargas()).toEqual([])
    expect(await storagePath('5001')).toBeNull()
    expect(await readdir(dir)).toEqual([])
  })
})

describe('guardado al sincronizar · un 404 o un tamaño distinto no se repite en el proceso (S-7)', () => {
  it('el 4007 (404) y el 4008 (tamaño) se piden una vez; el 4006 (500) se repite; el ciclo siguiente solo pide lo nuevo', async () => {
    await adj('4006', '101', 4); await adj('4007', '101', 4); await adj('4008', '101', 10); await adj('4009', '101', 4)
    respuestas.set('4006', () => new Response(null, { status: 500 }))
    respuestas.set('4007', () => new Response(null, { status: 404 }))
    respuestas.set('4008', () => new Response(new Uint8Array(Buffer.alloc(5, 7)), { status: 200 }))
    const { sync } = montar()
    await sync.syncRecent()
    expect(descargas()).toEqual(['4006', '4007', '4008', '4009'])
    expect(await storagePath('4009')).toBe('4009')
    expect(await storagePath('4008')).toBeNull()
    await adj('4010', '101', 4)
    modificado['101'] = hora(2)
    peticiones.length = 0
    await sync.syncRecent()
    expect(descargas()).toEqual(['4006', '4010'])
  })

  it('la memoria vive en el gancho de ese proceso: otro gancho vuelve a pedir el 404', async () => {
    await adj('4007', '101', 4)
    respuestas.set('4007', () => new Response(null, { status: 404 }))
    await montar().sync.syncRecent()
    expect(descargas()).toEqual(['4007'])
    modificado['101'] = hora(2)
    await montar().sync.syncRecent()
    expect(descargas()).toEqual(['4007'])
  })
})

describe('guardado al sincronizar · cortes que no rompen el ciclo (S-8)', () => {
  it('un 429 en el adjunto corta sólo ese guardado, no se recuerda y el ciclo siguiente lo reintenta', async () => {
    await adj('5001', '101', 4); await adj('5002', '101', 4); await adj('5003', '101', 4)
    respuestas.set('5002', () => new Response(null, { status: 429 }))
    const { sync } = montar()
    expect(await sync.syncRecent()).toBe(1)
    expect(descargas()).toEqual(['5001', '5002'])
    expect(await storagePath('5001')).toBe('5001')
    expect(await storagePath('5003')).toBeNull()
    respuestas.delete('5002')
    modificado['101'] = hora(2)
    peticiones.length = 0
    await sync.syncRecent()
    expect(descargas()).toEqual(['5002', '5003'])
  })

  it('un disco que falla corta el guardado tras la primera petición y el ciclo sigue', async () => {
    await adj('5001', '101', 4); await adj('5002', '101', 4)
    const { sync } = montar({ ADJUNTOS_DIR: join(base, 'noexiste') })
    expect(await sync.syncRecent()).toBe(1)
    expect(descargas()).toEqual(['5001'])
    expect(await storagePath('5001')).toBeNull()
    expect(await readdir(base)).toEqual(['volumen'])
  })

  it('trasGuardar no rechaza ni con la base caída ni con Zoho que lanza', async () => {
    await db.query("INSERT INTO tickets (id, number, status) VALUES ('101', 101, 'Ingresado')")
    await adj('5001', '101', 4)
    const { op } = montar()
    const dbCaida = { query: () => Promise.reject(new Error('base caída')) } as unknown as Queryable
    const config = loadConfig({ ...entorno, GUARDAR_ADJUNTOS_AL_SINCRONIZAR: 'true', ADJUNTOS_DIR: dir })
    const conBaseCaida = conGuardadoDeAdjuntos({ pausaMs: 0 }, config, { zohoFetch: crearZoho(), db: dbCaida })
    await expect(conBaseCaida.trasGuardar!(['101'])).resolves.toBeUndefined()
    const zohoQueLanza = vi.fn(async () => { throw new Error('sin red') })
    const conZohoCaido = conGuardadoDeAdjuntos({ pausaMs: 0 }, config, { zohoFetch: zohoQueLanza, db })
    await expect(conZohoCaido.trasGuardar!(['101'])).resolves.toBeUndefined()
    expect(zohoQueLanza).toHaveBeenCalledTimes(1)
    expect(await storagePath('5001')).toBeNull()
    expect(op.trasGuardar).toBeTypeOf('function')
  })

  it('la línea de log lleva cuentas e ids y nunca el nombre del fichero ni el asunto', async () => {
    await adj('5001', '101', 4, { name: 'Informe cliente ACME confidencial.pdf' })
    await adj('5002', '101', 4, { name: 'Otro de ACME.pdf' })
    respuestas.set('5002', () => new Response(null, { status: 500 }))
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const aviso = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    await montar().sync.syncRecent()
    expect(info).toHaveBeenCalledTimes(1)
    const texto = JSON.stringify([info.mock.calls, aviso.mock.calls])
    expect(texto).toContain('5002')
    expect(texto).not.toMatch(/ACME|Informe|\.pdf|foto\.png/)
  })
})

describe('guardado al sincronizar · el worker y la apertura no descargan (RQ-ZS-33)', () => {
  it('un createSync construido como el del worker (sin conversaciones) no pide ningún adjunto, con los interruptores abiertos', async () => {
    await adj('5001', '101', 4)
    const zohoFetch = crearZoho()
    const config = loadConfig({ ...entorno, SYNC_CONVERSACIONES_PERIODICA: 'true', GUARDAR_ADJUNTOS_AL_SINCRONIZAR: 'true', ADJUNTOS_DIR: dir })
    expect(await createSync({ zohoFetch, db, config }).syncRecent()).toBe(1)
    expect(listasPedidas()).toBe(0)
    expect(descargas()).toEqual([])
    expect(await readdir(dir)).toEqual([])
  })

  it('abrir el ticket (syncConversations) guarda la lista y no pide ningún adjunto aunque haya pendientes y gancho', async () => {
    await db.query("INSERT INTO tickets (id, number, status) VALUES ('101', 101, 'Ingresado')")
    await adj('5001', '101', 4)
    const { sync, op } = montar()
    expect(op.trasGuardar).toBeTypeOf('function')
    await sync.syncConversations('101')
    expect(listasPedidas()).toBe(1)
    expect(descargas()).toEqual([])
    expect(await storagePath('5001')).toBeNull()
  })
})
