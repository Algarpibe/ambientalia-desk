import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import * as fsReal from 'node:fs/promises'
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { PAUSA_429_MS, REINTENTOS_429, PAUSA_ENTRE_TICKETS_MS } from '@ambientalia/zoho-sync/conversaciones'
import { crearRellenoAdjuntos, type EstadoRellenoAdjuntos } from './rellenoAdjuntos'
import { logger } from '../util/logger'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-32), lote L3: el motor del relleno (D4 y D8). pg-mem + `fs.mkdtemp` + `zohoFetch` falsa.
 * La pasada corre en segundo plano: se espera su fin por estado, nunca con una pausa fija. Las esperas de 2.000 y 150 ms se
 * prueban con `setTimeout` falso (sólo ése) y sus valores se leen del `setTimeout` que pide el módulo.
 */
const HREF = (id: string) => `/tickets/10/comments/20/attachments/${id}/content`

let db: Queryable
let base: string
let dir: string
beforeEach(async () => {
  tamanos.clear()
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  base = await mkdtemp(join(tmpdir(), 'relleno-adjuntos-'))
  dir = join(base, 'volumen'); await mkdir(dir)
})
afterEach(async () => {
  vi.useRealTimers(); vi.restoreAllMocks()
  await rm(base, { recursive: true, force: true })
})

const bytes = (n: number) => Buffer.alloc(n, 7)
const respuesta = (cuerpo: Buffer, status = 200) => new Response(new Uint8Array(cuerpo), { status })
const idDe = (path: string) => /attachments\/(\d+)\//.exec(path)?.[1] ?? '?'
function zoho(responder: (id: string, intento: number) => Response | Promise<Response>) {
  const peticiones: string[] = []
  const intentos = new Map<string, number>()
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    const id = idDe(path); const n = (intentos.get(id) ?? 0) + 1; intentos.set(id, n)
    return responder(id, n)
  })
  return { zohoFetch, peticiones, ids: () => peticiones.map(idDe) }
}
/** Responde con tantos bytes como `size` de cada adjunto (los pone `adj`). */
const tamanos = new Map<string, number>()
const siempreBien = () => zoho((id) => respuesta(bytes(tamanos.get(id) ?? 1)))

const ticket = (id: string, numero: number, extra: { subject?: string; encargado?: string; correo?: string; cuenta?: string } = {}) =>
  db.query('INSERT INTO tickets (id, number, subject, status, encargado, correo_encargado, account_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [id, numero, extra.subject ?? 'Asunto', 'Ingresado', extra.encargado ?? null, extra.correo ?? null, extra.cuenta ?? null])
async function adj(id: string, tk: string, size: number | null, o: { name?: string; href?: string | null; storage?: string | null } = {}) {
  if (size !== null) tamanos.set(id, size)
  await db.query('INSERT INTO attachments (id, ticket_id, name, size, zoho_href, storage_path) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, tk, o.name ?? 'foto.png', size, o.href === undefined ? HREF(id) : o.href, o.storage ?? null])
}
const storagePath = async (id: string) =>
  ((await db.query('SELECT storage_path FROM attachments WHERE id=$1', [id])).rows[0] as { storage_path: string | null }).storage_path
const contenido = () => readdir(dir)

/** Espera el fin de la pasada con el reloj real (las pausas se inyectan a 0). */
async function fin(r: { estado(): EstadoRellenoAdjuntos }) {
  for (let i = 0; i < 5000 && !r.estado().terminado; i++) await new Promise<void>((res) => setImmediate(res))
  expect(r.estado().terminado).toBe(true)
  return r.estado()
}
const sinPausas = { pausaMs: 0, pausa429Ms: 0 }

/** Con `setTimeout` falso: registra cada espera pedida y avanza el reloj hasta que la pasada termina. */
function relojFalso() {
  vi.useFakeTimers({ toFake: ['setTimeout'] })
  const esperas: number[] = []
  const falso = globalThis.setTimeout
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number) => { esperas.push(Number(ms)); return falso(fn, ms) }) as typeof setTimeout)
  return {
    // Sólo se cuentan las esperas del módulo (>= 100 ms); pg-mem o el disco no piden otras.
    esperas: () => esperas.filter((ms) => ms >= 100),
    async fin(r: { estado(): EstadoRellenoAdjuntos }) {
      for (let i = 0; i < 3000 && !r.estado().terminado; i++) {
        await vi.advanceTimersByTimeAsync(3000)
        await new Promise<void>((res) => setImmediate(res))
      }
      expect(r.estado().terminado).toBe(true)
      return r.estado()
    },
  }
}

describe('constantes de espera (S-8): las del relleno de conversaciones', () => {
  it('2.000 ms, 3 repeticiones y 150 ms entre adjuntos', () => {
    expect([PAUSA_429_MS, REINTENTOS_429, PAUSA_ENTRE_TICKETS_MS]).toEqual([2000, 3, 150])
  })
})

describe('relleno de adjuntos · orden, desde y limite (RQ-ZS-32)', () => {
  it('pide por número de ticket y luego por id, aunque se insertaran desordenados', async () => {
    await ticket('T20', 20); await ticket('T10', 10); await ticket('T30', 30)
    await adj('4004', 'T30', 4); await adj('4003', 'T20', 3); await adj('4002', 'T10', 2); await adj('4001', 'T10', 1)
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    expect(r.lanzar().lanzada).toBe(true)
    const e = await fin(r)
    expect(z.ids()).toEqual(['4001', '4002', '4003', '4004'])
    expect(e).toMatchObject({ aRecorrer: 4, pedidos: 4, peticiones: 4, bytes: 10, cortadoEn: null, enMarcha: false })
    expect(e.cuentas.guardados).toBe(4)
    expect((await contenido()).sort()).toEqual(['4001', '4002', '4003', '4004'])
    expect(await storagePath('4003')).toBe('4003')
  })
  it('reanudable e idempotente: con el del 10 guardado, desde=20 pide 20 y 30 en ese orden y luego no pide ninguno', async () => {
    await ticket('T10', 10); await ticket('T20', 20); await ticket('T30', 30)
    await adj('4001', 'T10', 1); await adj('4002', 'T20', 2); await adj('4003', 'T30', 3)
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    r.lanzar({ limite: 1 }); await fin(r)
    expect(z.ids()).toEqual(['4001'])
    r.lanzar({ desde: 20 }); const e2 = await fin(r)
    expect(z.ids()).toEqual(['4001', '4002', '4003'])
    expect(e2).toMatchObject({ desde: 20, aRecorrer: 2, pedidos: 2 })
    r.lanzar(); const e3 = await fin(r)
    expect(z.ids()).toEqual(['4001', '4002', '4003'])
    expect(e3).toMatchObject({ aRecorrer: 3, pedidos: 0, peticiones: 0 })
    expect(e3.cuentas).toMatchObject({ yaPresentes: 3, guardados: 0 })
  })
  it('limite cuenta adjuntos PEDIDOS: los ya presentes no gastan el tope', async () => {
    await ticket('T10', 10); await ticket('T20', 20)
    await adj('4001', 'T10', 1); await adj('4002', 'T10', 2); await adj('4003', 'T20', 3); await adj('4004', 'T20', 4)
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    r.lanzar({ limite: 2 }); const e1 = await fin(r)
    expect(z.ids()).toEqual(['4001', '4002'])
    expect(e1).toMatchObject({ limite: 2, pedidos: 2 })
    r.lanzar({ limite: 1 }); const e2 = await fin(r)
    expect(z.ids()).toEqual(['4001', '4002', '4003'])
    expect(e2).toMatchObject({ pedidos: 1 })
    expect(e2.cuentas.yaPresentes).toBe(2)
  })
  it('clasifica antes de pedir: id no numérico fallido:id, sin ruta, y otro tamaño se vuelve a pedir', async () => {
    await ticket('T10', 10)
    await adj('4001', 'T10', 10, { storage: '4001' }); await writeFile(join(dir, '4001'), bytes(5))
    await adj('4002', 'T10', 2, { href: null })
    await adj('4003', 'T10', 3, { href: '/tickets/1/x' })
    await adj('abc1', 'T10', 4, { href: HREF('1') })
    await adj('4004', 'T10', 4)
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(z.ids()).toEqual(['4001', '4004'])
    expect(e.cuentas.sinRuta).toBe(2)
    expect(e.cuentas.fallidos).toEqual({ id: 1, tamano: 0, http: 0, red: 0, base: 0 })
    expect(e.fallidos).toEqual([{ adjunto: 'abc1', numero: 10, motivo: 'id' }])
    expect(e.cuentas.guardados).toBe(2)
    expect((await readFile(join(dir, '4001'))).length).toBe(10)
  })
  it('lo guardado entretanto por otra vía cuenta yaPresentes: el stat va justo antes de pedir', async () => {
    await ticket('T10', 10); await ticket('T20', 20)
    await adj('4001', 'T10', 1); await adj('4002', 'T20', 2)
    const z = zoho(async (id) => {
      if (id === '4001') { await writeFile(join(dir, '4002'), bytes(2)); await db.query("UPDATE attachments SET storage_path='4002' WHERE id='4002'") }
      return respuesta(bytes(Number(tamanos.get(id))))
    })
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(z.ids()).toEqual(['4001'])
    expect(e.cuentas).toMatchObject({ guardados: 1, yaPresentes: 1 })
  })
  it('un adjunto sin tamaño ni Content-Length se guarda y cuenta sinTamanoComprobable', async () => {
    await ticket('T10', 10)
    await adj('4001', 'T10', null); await adj('4002', 'T10', 2)
    const z = zoho((id) => respuesta(bytes(id === '4001' ? 6 : 2)))
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(e.cuentas).toMatchObject({ guardados: 2, sinTamanoComprobable: 1 })
    expect(e.bytes).toBe(8)
  })
})

describe('relleno de adjuntos · recuento (limite=0) y dir nulo', () => {
  it('limite=0 cuenta pendientes (número y MB por size), sin ruta y presentes, sin llamar a Zoho ni escribir', async () => {
    const MB = 1048576
    await ticket('T10', 10); await ticket('T20', 20)
    await adj('4001', 'T10', MB); await adj('4002', 'T10', MB); await adj('4003', 'T20', MB)
    await adj('4004', 'T20', MB, { href: null })
    await adj('4005', 'T20', 7, { storage: '4005' }); await writeFile(join(dir, '4005'), bytes(7))
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    const antes = await contenido()
    expect(await r.recuento()).toEqual({ pendientes: 3, bytes: 3 * MB, mb: 3, sinTamano: 0, sinRuta: 1, yaPresentes: 1 })
    expect(z.zohoFetch).not.toHaveBeenCalled()
    expect(await contenido()).toEqual(antes)
    expect(await storagePath('4001')).toBeNull()
    expect(r.estado().enMarcha).toBe(false)
  })
  it('recuento: un adjunto sin size es sinTamano y no suma bytes; desde filtra por número de ticket; mb es bytes / 1.048.576', async () => {
    await ticket('T10', 10); await ticket('T20', 20)
    await adj('4001', 'T10', 524288); await adj('4002', 'T20', null); await adj('4003', 'T20', 524288)
    const r = crearRellenoAdjuntos({ zohoFetch: siempreBien().zohoFetch, db, dir, ...sinPausas })
    expect(await r.recuento()).toMatchObject({ pendientes: 3, bytes: 1048576, mb: 1, sinTamano: 1 })
    expect(await r.recuento({ desde: 20 })).toMatchObject({ pendientes: 2, bytes: 524288, mb: 0.5, sinTamano: 1 })
  })
  it('dir nulo: no lanza, deja error que nombra ADJUNTOS_DIR, no llama a Zoho y no escribe', async () => {
    await ticket('T10', 10); await adj('4001', 'T10', 1)
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir: null, ...sinPausas })
    const l = r.lanzar()
    expect(l.lanzada).toBe(false)
    expect(l.estado.error).toContain('ADJUNTOS_DIR')
    expect(r.estado().error).toContain('ADJUNTOS_DIR')
    expect(r.estado().enMarcha).toBe(false)
    await new Promise<void>((res) => setImmediate(res))
    expect(z.zohoFetch).not.toHaveBeenCalled()
    expect(await readdir(base)).toEqual(['volumen'])
    expect(await contenido()).toEqual([])
  })
})

describe('relleno de adjuntos · 404, 429, otros fallos y disco (D4, S-7, S-8)', () => {
  it('404 es ausente: se lista con id y ticket, no se guarda y la pasada sigue con el otro', async () => {
    await ticket('T12', 12); await ticket('T13', 13)
    await adj('4006', 'T12', 6); await adj('4007', 'T13', 7)
    const z = zoho((id) => (id === '4006' ? respuesta(Buffer.alloc(0), 404) : respuesta(bytes(7))))
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(e.ausentes).toEqual([{ adjunto: '4006', numero: 12 }])
    expect(e.cuentas).toMatchObject({ ausentes: 1, guardados: 1 })
    expect(e.cuentas.fallidos.http).toBe(0)
    expect(e.fallidos).toEqual([])
    expect(await contenido()).toEqual(['4007'])
    expect(await storagePath('4006')).toBeNull()
  })
  it('429 dos veces y luego 200: se guarda tras esperas de 2.000 ms, repitiendo la misma petición', async () => {
    await ticket('T10', 10); await adj('4001', 'T10', 5)
    const z = zoho((_id, n) => (n <= 2 ? respuesta(Buffer.alloc(0), 429) : respuesta(bytes(5))))
    const reloj = relojFalso()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir })
    r.lanzar(); const e = await reloj.fin(r)
    expect(reloj.esperas()).toEqual([2000, 2000])
    expect(z.peticiones).toEqual([HREF('4001'), HREF('4001'), HREF('4001')])
    expect(e).toMatchObject({ pedidos: 1, peticiones: 3, vistos429: 2, cortadoEn: null })
    expect(e.cuentas.guardados).toBe(1)
    expect(await contenido()).toEqual(['4001'])
  })
  it('429 agotado corta con cortadoEn tras 3 reintentos y NO pide el siguiente', async () => {
    await ticket('T10', 10); await ticket('T20', 20)
    await adj('4001', 'T10', 1); await adj('4002', 'T20', 2)
    const z = zoho(() => respuesta(Buffer.alloc(0), 429))
    const reloj = relojFalso()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir })
    r.lanzar(); const e = await reloj.fin(r)
    expect(reloj.esperas()).toEqual([2000, 2000, 2000])
    expect(z.ids()).toEqual(['4001', '4001', '4001', '4001'])
    expect(e).toMatchObject({ cortadoEn: 10, motivoCorte: '429', peticiones: 4, vistos429: 4, pedidos: 1, enMarcha: false })
    expect(e.cuentas.guardados).toBe(0)
    expect(await contenido()).toEqual([])
  })
  it('500 cuenta fallido:http con id y ticket y la pasada sigue; zohoFetch que lanza es fallido:red', async () => {
    await ticket('T10', 10); await ticket('T20', 20); await ticket('T30', 30)
    await adj('4001', 'T10', 1); await adj('4002', 'T20', 2); await adj('4003', 'T30', 3)
    const z = zoho((id) => {
      if (id === '4001') return respuesta(Buffer.alloc(0), 500)
      if (id === '4002') throw new Error('socket colgado')
      return respuesta(bytes(3))
    })
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(e.fallidos).toEqual([{ adjunto: '4001', numero: 10, motivo: 'http' }, { adjunto: '4002', numero: 20, motivo: 'red' }])
    expect(e.cuentas.fallidos).toEqual({ id: 0, tamano: 0, http: 1, red: 1, base: 0 })
    expect(e.cuentas.guardados).toBe(1)
    expect(e.cortadoEn).toBeNull()
    expect(e.motivoPrimerFallo).toBe(`Zoho ${HREF('4001')} 500`)
    expect(await contenido()).toEqual(['4003'])
  })
  it('bytes de menos es fallido:tamano y no deja fichero', async () => {
    await ticket('T10', 10); await adj('4001', 'T10', 100)
    const r = crearRellenoAdjuntos({ zohoFetch: zoho(() => respuesta(bytes(40))).zohoFetch, db, dir, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(e.fallidos).toEqual([{ adjunto: '4001', numero: 10, motivo: 'tamano' }])
    expect(await contenido()).toEqual([])
  })
  it('disco lleno corta con motivoCorte disco y el tercero no se pide; el motivo es el code de Node, no la ruta', async () => {
    await ticket('T10', 10); await ticket('T20', 20); await ticket('T30', 30)
    await adj('4001', 'T10', 1); await adj('4002', 'T20', 2); await adj('4003', 'T30', 3)
    const z = siempreBien()
    let escrituras = 0
    const fs = {
      writeFile: (async (...a: Parameters<typeof fsReal.writeFile>) => {
        if (++escrituras === 2) throw Object.assign(new Error(`ENOSPC en ${dir}`), { code: 'ENOSPC' })
        return fsReal.writeFile(...a)
      }) as typeof fsReal.writeFile,
      rename: fsReal.rename, unlink: fsReal.unlink, stat: fsReal.stat,
    }
    const reloj = relojFalso()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, fs })
    r.lanzar(); const e = await reloj.fin(r)
    expect(z.ids()).toEqual(['4001', '4002'])
    expect(e).toMatchObject({ cortadoEn: 20, motivoCorte: 'disco', motivoPrimerFallo: 'ENOSPC', pedidos: 2 })
    expect(e.cuentas.guardados).toBe(1)
    expect(JSON.stringify(e)).not.toContain(base)
    expect(await contenido()).toEqual(['4001'])
  })
  it('directorio inexistente: corta antes de llamar a Zoho', async () => {
    await ticket('T10', 10); await adj('4001', 'T10', 1)
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir: join(base, 'noexiste'), ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(z.zohoFetch).not.toHaveBeenCalled()
    expect(e).toMatchObject({ cortadoEn: 10, motivoCorte: 'disco', motivoPrimerFallo: 'ENOENT', pedidos: 0 })
    expect(JSON.stringify(e)).not.toContain(base)
  })
  it('espera pausaMs (150 ms) antes de cada petición salvo la primera', async () => {
    await ticket('T10', 10)
    await adj('4001', 'T10', 1); await adj('4002', 'T10', 2); await adj('4003', 'T10', 3)
    const reloj = relojFalso()
    const r = crearRellenoAdjuntos({ zohoFetch: siempreBien().zohoFetch, db, dir })
    r.lanzar(); const e = await reloj.fin(r)
    expect(reloj.esperas()).toEqual([150, 150])
    expect(e.cuentas.guardados).toBe(3)
  })
})

describe('relleno de adjuntos · un solo lanzamiento, resumen y log sin datos de cliente (S-2, S-12)', () => {
  it('dos lanzar seguidos lanzan UNO; terminada la pasada, se puede lanzar otra', async () => {
    await ticket('T10', 10); await adj('4001', 'T10', 1); await adj('4002', 'T10', 2)
    const z = siempreBien()
    const r = crearRellenoAdjuntos({ zohoFetch: z.zohoFetch, db, dir, ...sinPausas })
    const a = r.lanzar(); const b = r.lanzar()
    expect(a.lanzada).toBe(true)
    expect(a.estado.enMarcha).toBe(true)
    expect(b.lanzada).toBe(false)
    expect(b.estado.enMarcha).toBe(true)
    await fin(r)
    expect(z.ids()).toEqual(['4001', '4002'])
    expect(r.lanzar().lanzada).toBe(true)
    await fin(r)
  })
  const fixture = async () => {
    await ticket('T12', 12, { subject: 'Fuga de lodos en planta Sur', encargado: 'Maria Gomez', correo: 'maria.gomez@empresax.com', cuenta: 'EmpresaX SAS' })
    await adj('4008', 'T12', 8, { name: 'contrato_empresaX.pdf' }); await adj('4009', 'T12', 9, { name: 'contrato_empresaX_v2.pdf' })
  }
  const PROHIBIDOS = ['contrato_empresaX', 'Fuga de lodos', 'Maria Gomez', 'maria.gomez', 'EmpresaX']
  const fallaElNueve = () => zoho((id) => (id === '4009' ? respuesta(Buffer.alloc(0), 500) : respuesta(bytes(8))))

  it('el resumen (estado y registrar) lleva el id y el número del fallido y ni name, asunto, contacto ni empresa', async () => {
    await fixture()
    const registrar = vi.fn()
    const r = crearRellenoAdjuntos({ zohoFetch: fallaElNueve().zohoFetch, db, dir, registrar, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    const estadoJson = JSON.stringify(e); const registrado = JSON.stringify(registrar.mock.calls)
    expect(registrar).toHaveBeenCalledTimes(1)
    expect(registrar.mock.calls[0][0]).toMatchObject({ terminado: true, enMarcha: false })
    for (const json of [estadoJson, registrado]) {
      expect(json).toContain('"adjunto":"4009","numero":12,"motivo":"http"')
      for (const p of PROHIBIDOS) expect(json).not.toContain(p)
    }
    expect(e.cuentas.guardados).toBe(1)
  })
  it('el registrar por defecto escribe UNA línea al logger con el mismo contenido', async () => {
    await fixture()
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined)
    const r = crearRellenoAdjuntos({ zohoFetch: fallaElNueve().zohoFetch, db, dir, ...sinPausas })
    r.lanzar(); await fin(r)
    expect(info).toHaveBeenCalledTimes(1)
    const linea = JSON.stringify(info.mock.calls)
    expect(linea).toContain('"adjunto":"4009","numero":12')
    for (const p of PROHIBIDOS) expect(linea).not.toContain(p)
    expect(linea).not.toContain(base)
  })
  it('un registrar que lanza no tumba la pasada', async () => {
    await ticket('T10', 10); await adj('4001', 'T10', 1)
    const r = crearRellenoAdjuntos({ zohoFetch: siempreBien().zohoFetch, db, dir, registrar: () => { throw new Error('log caído') }, ...sinPausas })
    r.lanzar(); const e = await fin(r)
    expect(e.cuentas.guardados).toBe(1)
    expect(e.error).toBeUndefined()
  })
  it('el estado durante y después: inicio y fin fijados, enMarcha cae', async () => {
    await ticket('T10', 10); await adj('4001', 'T10', 1)
    const r = crearRellenoAdjuntos({ zohoFetch: siempreBien().zohoFetch, db, dir, ...sinPausas })
    expect(r.estado()).toMatchObject({ enMarcha: false, terminado: false })
    r.lanzar({ desde: 5, limite: 3 })
    expect(r.estado()).toMatchObject({ enMarcha: true, terminado: false, desde: 5, limite: 3 })
    const e = await fin(r)
    expect(e.enMarcha).toBe(false)
    expect(typeof e.inicio).toBe('string')
    expect(typeof e.fin).toBe('string')
  })
})
