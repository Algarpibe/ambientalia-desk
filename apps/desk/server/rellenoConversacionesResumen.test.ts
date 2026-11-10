import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createSync } from '@ambientalia/zoho-sync/sync'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { crearRellenoConversaciones, type EstadoRelleno } from './rellenoConversaciones'
import { guardaEnBase, conResumenGuardado, LIMITE_PETICIONES, type GuardaResumen } from './rellenoConversacionesResumen'
import { logger } from './util/logger'

/**
 * calificaciones-cuadre-conversaciones (RQ-ZS-49, D-5, CA-7 y CA-9). El resumen de cada pasada del relleno se guarda en
 * `public.relleno_conversaciones_pasadas`: fila al lanzar y completada al terminar, sobrevive a un redespliegue (dos
 * instancias sobre la misma base pg-mem), un fallo de la base no corta la pasada ni deja un rechazo sin manejar, `limite=0` no
 * escribe y el resumen no lleva datos de cliente. pg-mem + `createSync` REAL con una `zohoFetch` falsa (molde
 * `apps/desk/server/rellenoConversaciones.test.ts:39-68`).
 */
const config = { departmentId: 'DEP' } as AppConfig
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = () => new Response(null, { status: 204 })
const TABLA = 'public.relleno_conversaciones_pasadas'

const conv = (id: string) => ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' })
const detalle = (id: string, numero: number, extra: Record<string, unknown> = {}) =>
  ({ id, ticketNumber: String(numero), subject: 'Asunto ' + id, status: 'Ingresado', commentCount: '0', threadCount: '1', ...extra })

/** Un servidor falso: cada ticket `Zn` tiene su detalle y UNA conversación. `puerta`, si viene, retiene la primera petición de detalle hasta soltarla. */
function servidor(numeros: number[], o: { puerta?: Promise<void>; extra?: (p: string) => Response | undefined; detalleExtra?: Record<string, unknown> } = {}) {
  const peticiones: string[] = []
  let primera = true
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    const m = /^\/tickets\/([^/?]+)(\/conversations)?\?(.*)$/.exec(path)
    if (m && !m[2]) {
      if (primera && o.puerta) { primera = false; await o.puerta }
      const n = Number(m[1].slice(1))
      return numeros.includes(n) ? json(detalle(m[1], n, o.detalleExtra)) : json({}, 404)
    }
    if (m && m[2]) {
      const q = new URLSearchParams(m[3])
      return Number(q.get('from')) === 0 ? json({ data: [conv(m[1] + '-c0')] }) : vacio()
    }
    const e = o.extra?.(path); if (e) return e
    if (path.startsWith('/contacts/') || path.startsWith('/accounts/')) return json({}, 404)
    throw new Error('petición inesperada ' + path)
  })
  return { zohoFetch, peticiones }
}

let db: Queryable
const filasTabla = async () =>
  (await db.query(`SELECT id, lanzada_at, terminada_at, resumen FROM ${TABLA} ORDER BY id`)).rows as { id: number; lanzada_at: unknown; terminada_at: unknown; resumen: unknown }[]
const comoObjeto = (v: unknown): Record<string, unknown> => (typeof v === 'string' ? JSON.parse(v) : v) as Record<string, unknown>
const ticket = (id: string, numero: number) =>
  db.query("INSERT INTO tickets (id, number, subject, status) VALUES ($1, $2, 'Viejo', 'Ingresado')", [id, numero])

/** Una base que rechaza TODA sentencia sobre la tabla del resumen y deja pasar el resto. */
const baseQueRechaza = (real: Queryable): Queryable => ({
  query: (text, params) => (text.includes('relleno_conversaciones_pasadas') ? Promise.reject(new Error('la base rechaza la tabla')) : real.query(text, params)),
})

function montar(s: ReturnType<typeof servidor>, d: { db?: Queryable; registrar?: (r: EstadoRelleno) => void } = {}) {
  const sync = createSync({ zohoFetch: s.zohoFetch, db, config })
  return crearRellenoConversaciones({ zohoFetch: s.zohoFetch, db: d.db ?? db, sync, marcar: false, pausaMs: 0, pausa429Ms: 0, registrar: d.registrar ?? (() => {}) })
}
const esperarFin = (r: { estado(): EstadoRelleno }) => vi.waitFor(() => expect(r.estado().terminado).toBe(true), { timeout: 5000 })
const asentar = async (veces = 20) => { for (let i = 0; i < veces; i++) await new Promise((r) => setImmediate(r)) }

beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('fila al lanzar y completada al terminar (RQ-ZS-49)', () => {
  it('fila al lanzar: existe con terminadaAt nulo mientras la primera petición espera', async () => {
    await ticket('Z1', 1); await ticket('Z2', 2)
    let soltar!: () => void
    const puerta = new Promise<void>((r) => { soltar = r })
    const s = servidor([1, 2], { puerta })
    const r = montar(s)
    r.lanzar({ desde: 1, limite: 2 })
    await vi.waitFor(() => expect(s.peticiones).toHaveLength(1), { timeout: 5000 })
    await vi.waitFor(async () => expect(await filasTabla()).toHaveLength(1), { timeout: 5000 })
    const abierta = (await filasTabla())[0]
    expect(abierta.terminada_at).toBeNull()
    expect(r.estado().terminado).toBe(false)
    soltar(); await esperarFin(r)
  })

  it('completa al terminar: la misma fila gana terminada_at y el resumen con peticiones, vistos429, inicio, fin, desde, limite y limitePeticiones', async () => {
    await ticket('Z1', 1); await ticket('Z2', 2)
    let soltar!: () => void
    const puerta = new Promise<void>((r) => { soltar = r })
    const s = servidor([1, 2], { puerta })
    const r = montar(s)
    r.lanzar({ desde: 1, limite: 2 })
    await vi.waitFor(async () => expect(await filasTabla()).toHaveLength(1), { timeout: 5000 })
    const idAbierta = (await filasTabla())[0].id
    soltar(); await esperarFin(r)
    await vi.waitFor(async () => expect((await filasTabla())[0].terminada_at).not.toBeNull(), { timeout: 5000 })
    const filas = await filasTabla()
    expect(filas).toHaveLength(1)
    expect(filas[0].id).toBe(idAbierta)
    const resumen = comoObjeto(filas[0].resumen)
    expect(resumen).toMatchObject({ desde: 1, limite: 2, peticiones: 4, vistos429: 0, terminado: true, enMarcha: false, recorridos: 2, limitePeticiones: LIMITE_PETICIONES })
    expect(typeof resumen.inicio).toBe('string')
    expect(typeof resumen.fin).toBe('string')
  })

  it('sin desde ni limite el resumen guarda null en los dos', async () => {
    await ticket('Z7', 7)
    const r = montar(servidor([7]))
    r.lanzar(); await esperarFin(r)
    await vi.waitFor(async () => expect((await filasTabla())[0]?.terminada_at).not.toBeNull(), { timeout: 5000 })
    expect(comoObjeto((await filasTabla())[0].resumen)).toMatchObject({ desde: null, limite: null, recorridos: 1 })
  })

  it('cada pasada deja su fila: dos pasadas seguidas, dos filas y ultimaGuardada es la segunda', async () => {
    await ticket('Z1', 1)
    const r = montar(servidor([1]))
    r.lanzar(); await esperarFin(r)
    await vi.waitFor(async () => expect((await filasTabla())[0]?.terminada_at).not.toBeNull(), { timeout: 5000 })
    r.lanzar({ limite: 1 })
    await vi.waitFor(async () => expect((await filasTabla())).toHaveLength(2), { timeout: 5000 })
    await vi.waitFor(async () => expect((await filasTabla())[1].terminada_at).not.toBeNull(), { timeout: 5000 })
    const ultima = await r.ultimaGuardada()
    expect(ultima?.id).toBe((await filasTabla())[1].id)
    expect(ultima?.resumen).toMatchObject({ limite: 1 })
  })
})

describe('sobrevive a un redespliegue (RQ-ZS-49)', () => {
  it('una instancia nueva sobre la misma base devuelve por ultimaGuardada la pasada de la primera sin llamar a Zoho', async () => {
    await ticket('Z1', 1); await ticket('Z2', 2)
    const a = montar(servidor([1, 2]))
    expect(await a.ultimaGuardada()).toBeNull()
    a.lanzar({ desde: 1 }); await esperarFin(a)
    await vi.waitFor(async () => expect((await filasTabla())[0]?.terminada_at).not.toBeNull(), { timeout: 5000 })
    const sB = servidor([1, 2])
    const b = montar(sB)
    expect(b.estado().terminado).toBe(false)
    const ultima = await b.ultimaGuardada()
    expect(ultima).not.toBeNull()
    expect(ultima!.id).toBe((await filasTabla())[0].id)
    expect(ultima!.terminadaAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(ultima!.lanzadaAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(ultima!.resumen).toMatchObject({ desde: 1, recorridos: 2, terminado: true })
    expect(sB.zohoFetch).not.toHaveBeenCalled()
  })
})

describe('un fallo al escribir no corta la pasada ni deja rechazos sin manejar (RQ-ZS-49)', () => {
  const sinManejar: unknown[] = []
  const oyente = (e: unknown) => { sinManejar.push(e) }
  beforeEach(() => { sinManejar.length = 0; process.on('unhandledRejection', oyente) })
  afterEach(() => { process.off('unhandledRejection', oyente) })

  it('con una base que rechaza la tabla los tres tickets se procesan, registrar recibe UNA llamada, logger.error una línea por operación y ningún rechazo sin manejar', async () => {
    for (const n of [1, 2, 3]) await ticket('Z' + n, n)
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const registrar = vi.fn()
    const r = montar(servidor([1, 2, 3]), { db: baseQueRechaza(db), registrar })
    r.lanzar(); await esperarFin(r)
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(2), { timeout: 5000 })
    await asentar()
    expect(r.estado()).toMatchObject({ recorridos: 3, aRecorrer: 3, cuentas: { completo: 3 } })
    expect(registrar).toHaveBeenCalledTimes(1)
    const lineas = error.mock.calls.map((c) => String(c[c.length - 1]))
    expect(lineas[0]).toMatch(/abrir/)
    expect(lineas[1]).toMatch(/cerrar/)
    for (const l of lineas) { expect(l).not.toContain('\n'); expect(l).toContain('la base rechaza la tabla') }
    expect(sinManejar).toEqual([])
    expect(await r.ultimaGuardada()).toBeNull()
  })

  it('abrir, cerrar y ultima resuelven con esa base (null o nada)', async () => {
    const aviso = vi.fn()
    const g = guardaEnBase(baseQueRechaza(db), aviso)
    const e = { enMarcha: false } as unknown as EstadoRelleno
    await expect(g.abrir(e)).resolves.toBeNull()
    await expect(g.cerrar(null, e)).resolves.toBeUndefined()
    await expect(g.cerrar(5, e)).resolves.toBeUndefined()
    await expect(g.ultima()).resolves.toBeNull()
    expect(aviso).toHaveBeenCalledTimes(4)
    expect(sinManejar).toEqual([])
  })

  it('abrir resuelve con una base que falla aunque avisar lance: la escritura no depende del log', async () => {
    const g = guardaEnBase(baseQueRechaza(db), () => { throw new Error('el log también falla') })
    const e = { enMarcha: false } as unknown as EstadoRelleno
    await expect(g.abrir(e)).resolves.toBeNull()
    await expect(g.cerrar(null, e)).resolves.toBeUndefined()
    await expect(g.ultima()).resolves.toBeNull()
  })

  it('abrir y cerrar con la base sana: abrir devuelve el id, cerrar completa esa fila y ultima la lee con fechas ISO', async () => {
    const g = guardaEnBase(db, () => {})
    const e = { enMarcha: true, peticiones: 0, desde: null } as unknown as EstadoRelleno
    const id = await g.abrir(e)
    expect(typeof id).toBe('number')
    expect((await g.ultima())).toMatchObject({ id, terminadaAt: null, resumen: { peticiones: 0, desde: null, limitePeticiones: LIMITE_PETICIONES } })
    await g.cerrar(id, { ...e, enMarcha: false, peticiones: 9 } as unknown as EstadoRelleno)
    const u = await g.ultima()
    expect(u?.id).toBe(id)
    expect(u?.terminadaAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
    expect(u?.resumen).toMatchObject({ peticiones: 9, enMarcha: false })
    expect(await filasTabla()).toHaveLength(1)
  })

  it('cerrar con id nulo inserta una fila ya completa', async () => {
    const g = guardaEnBase(db, () => {})
    await g.cerrar(null, { enMarcha: false, peticiones: 4 } as unknown as EstadoRelleno)
    const filas = await filasTabla()
    expect(filas).toHaveLength(1)
    expect(filas[0].terminada_at).not.toBeNull()
    expect(comoObjeto(filas[0].resumen)).toMatchObject({ peticiones: 4, limitePeticiones: LIMITE_PETICIONES })
  })
})

describe('conResumenGuardado (D-5)', () => {
  const guardaFalsa = () => {
    const llamadas: string[] = []
    const g: GuardaResumen & { llamadas: string[]; cerradas: { id: number | null; peticiones: number }[] } = {
      llamadas,
      cerradas: [],
      abrir: vi.fn(async (e: EstadoRelleno) => { llamadas.push(`abrir(${e.peticiones})`); return 42 }),
      cerrar: vi.fn(async (id: number | null, e: EstadoRelleno) => { llamadas.push('cerrar'); g.cerradas.push({ id, peticiones: e.peticiones }) }),
      ultima: vi.fn(async () => null),
    }
    return g
  }
  const estadoDe = (limite: number | null) => ({ enMarcha: true, peticiones: 0, limite }) as unknown as EstadoRelleno

  it('limite: 0 no deja fila: corre la pasada y no abre ni cierra', async () => {
    const g = guardaFalsa(); const correr = vi.fn(async () => {})
    await conResumenGuardado({ guardar: g, estado: estadoDe(0), correr })
    expect(correr).toHaveBeenCalledTimes(1)
    expect(g.abrir).not.toHaveBeenCalled()
    expect(g.cerrar).not.toHaveBeenCalled()
  })

  it('limite: 0 con la base real no deja fila', async () => {
    await ticket('Z1', 1)
    const r = montar(servidor([1]))
    r.lanzar({ limite: 0 }); await esperarFin(r)
    await asentar()
    expect(await filasTabla()).toEqual([])
  })

  it('fila al lanzar: abrir se lanza ANTES de correr y sin esperarlo', async () => {
    const g = guardaFalsa(); const orden: string[] = []
    let abrirResuelto = false
    ;(g.abrir as ReturnType<typeof vi.fn>).mockImplementation(() => { orden.push('abrir'); return new Promise<number>((r) => setTimeout(() => { abrirResuelto = true; r(42) }, 20)) })
    await conResumenGuardado({ guardar: g, estado: estadoDe(5), correr: async () => { orden.push(`correr(abrirResuelto=${abrirResuelto})`) } })
    expect(orden).toEqual(['abrir', 'correr(abrirResuelto=false)'])
    expect(g.cerradas).toEqual([{ id: 42, peticiones: 0 }])
  })

  it('completa al terminar: cerrar va DESPUÉS de correr y recibe la foto final del estado por referencia', async () => {
    const g = guardaFalsa(); const e = estadoDe(null)
    await conResumenGuardado({ guardar: g, estado: e, correr: async () => { g.llamadas.push('correr'); e.peticiones = 7 } })
    expect(g.llamadas).toEqual(['abrir(0)', 'correr', 'cerrar'])
    expect(g.cerradas).toEqual([{ id: 42, peticiones: 7 }])
  })

  it('si abrir rechaza, la pasada corre y cerrar recibe id nulo, sin rechazo sin manejar', async () => {
    const g = guardaFalsa(); const correr = vi.fn(async () => {})
    ;(g.abrir as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.reject(new Error('no abre')))
    await conResumenGuardado({ guardar: g, estado: estadoDe(3), correr })
    expect(correr).toHaveBeenCalledTimes(1)
    expect(g.cerradas).toEqual([{ id: null, peticiones: 0 }])
  })
})

describe('el resumen guardado no lleva datos de cliente (RQ-ZS-49, S-10)', () => {
  it('asunto, contacto y empresa marcadores no aparecen en la fila', async () => {
    await ticket('Z1', 1); await ticket('Z2', 2)
    const s = servidor([1, 2], {
      detalleExtra: { subject: 'Asunto Reservado Uno', contactId: 'K1', accountId: 'A1' },
      extra: (p) => p === '/contacts/K1' ? json({ id: 'K1', firstName: 'Contacto', lastName: 'Apellido Secreto', email: 'secreto@cliente.test', accountId: 'A1' })
        : p === '/accounts/A1' ? json({ id: 'A1', accountName: 'Empresa Reservada SA' }) : undefined,
    })
    const r = montar(s)
    r.lanzar(); await esperarFin(r)
    await vi.waitFor(async () => expect((await filasTabla())[0]?.terminada_at).not.toBeNull(), { timeout: 5000 })
    expect(s.peticiones).toContain('/contacts/K1')
    const texto = JSON.stringify(await filasTabla())
    expect(texto).toContain('"recorridos":2')
    for (const dato of ['Asunto Reservado', 'Apellido Secreto', 'secreto@cliente.test', 'Empresa Reservada', 'Contacto']) expect(texto).not.toContain(dato)
  })
})
