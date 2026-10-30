import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

/**
 * sync-conversaciones-zoho (1G-01, RQ-ZS-27): la pasada periódica que `syncRecent` ejecuta tras leer los tickets
 * modificados, SÓLO si la App pasa `conversaciones.periodica`. `zohoFetch` va ENRUTADO por ruta (molde de
 * `sync.modificados.test.ts`): búsqueda como índice, detalle con `modifiedTime` y recuentos, y la lista de conversaciones.
 */
const config = { departmentId: 'DEP' } as AppConfig
const PASADO = '2026-01-01T00:00:00.000Z'
const HILO = '495552000057899091'
const ON = { periodica: true, pausaMs: 0, pausa429Ms: 0 }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = (status = 204) => new Response(null, { status })
const conv = (id: string) => ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' })
const hora = (n: number) => `2026-10-03T10:0${n}:00.000Z`

interface Rutas {
  busqueda?: () => Response
  detalle?: (id: string) => Response
  lista?: (id: string, n: number) => Response
  pagina1?: () => Response
}
function enrutar(r: Rutas) {
  const peticiones: string[] = []
  const veces = new Map<string, number>()
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    const c = /^\/tickets\/([^/?]+)\/conversations\?/.exec(path)
    if (c) { const n = veces.get(c[1]) ?? 0; veces.set(c[1], n + 1); return r.lista ? r.lista(c[1], n) : json({ data: [] }) }
    if (path.startsWith('/tickets/search?')) return r.busqueda!()
    if (path.startsWith('/tickets?')) return r.pagina1 ? r.pagina1() : json({ data: [] })
    const m = /^\/tickets\/([^/?]+)\?/.exec(path)
    if (m) return r.detalle ? r.detalle(m[1]) : vacio(404)
    return vacio(404)
  })
  return { zohoFetch, convs: () => peticiones.filter((p) => p.includes('/conversations?')) }
}
const detalleDe = (mod: Record<string, string> = {}, cuentas: [number, number] = [1, 0]) => (id: string) => json({
  id, ticketNumber: id, subject: 's', status: 'Ingresado', statusType: 'Open', customFields: {}, modifiedTime: mod[id] ?? hora(Number(id.slice(-1))),
  commentCount: cuentas[0], threadCount: cuentas[1],
})
const busca = (...ids: string[]) => () => json({ data: ids.map((id) => ({ id, modifiedTime: hora(Number(id.slice(-1))) })) })

let db: Queryable
let errores: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  errores = vi.spyOn(console, 'error').mockImplementation(() => {})
  await db.query("INSERT INTO tickets (id, number, status, modified_time) VALUES ('Z1', 1, 'Ingresado', '2026-10-02T10:00:00.000Z')")
})
const textoErrores = () => errores.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
const cuenta = async (tk: string) => Number(((await db.query('SELECT count(*) AS n FROM conversations WHERE ticket_id=$1', [tk])).rows[0] as { n: unknown }).n)
const listaDe = (...ids: string[]) => () => json({ data: ids.map(conv) })
const propia = (id: string) => json({ data: [conv('c' + id)] })   // un id de conversación por ticket: la clave es global

describe('pasada periódica · qué tickets pide (RQ-ZS-27)', () => {
  it('con la opción pide la lista de los dos modificados y sólo de ésos, y las guarda', async () => {
    const h = enrutar({ busqueda: busca('101', '102'), detalle: detalleDe(), lista: propia })
    const n = await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON }).syncRecent()
    expect(n).toBe(2)
    expect(h.convs()).toEqual(['/tickets/101/conversations?from=0&limit=100', '/tickets/102/conversations?from=0&limit=100'])
    expect(await cuenta('101')).toBe(1)
    expect(await cuenta('Z1')).toBe(0)
  })

  it('apagada, sin la opción o con periodica false: cero peticiones de conversaciones', async () => {
    for (const conversaciones of [undefined, { periodica: false, marcarAusentes: true }, { marcarAusentes: true }]) {
      const h = enrutar({ busqueda: busca('101', '102'), detalle: detalleDe(), lista: propia })
      expect(await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones }).syncRecent()).toBe(2)
      expect(h.convs(), JSON.stringify(conversaciones)).toHaveLength(0)
    }
  })

  it('si la búsqueda cae y el ciclo usa la página 1, no hay pasada', async () => {
    const h = enrutar({ busqueda: () => json({}, 500), pagina1: () => json({ data: [{ id: '101', ticketNumber: '101', subject: 's', status: 'Ingresado', statusType: 'Open', customFields: {} }] }) })
    expect(await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON }).syncRecent()).toBe(1)
    expect(h.convs()).toHaveLength(0)
  })
})

describe('pasada periódica · marcar ausentes con el recuento del detalle leído (S-4)', () => {
  async function preparar958() {
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app, raw) VALUES ('958', 958, 'Ingresado', true, $1)", [JSON.stringify({ commentCount: 5, threadCount: 1 })])
    for (const id of ['c0', 'c1', 'c2', 'c3', 'c4', HILO]) await db.query("INSERT INTO conversations (id, ticket_id, source, created_at) VALUES ($1, '958', 'zoho', $2)", [id, PASADO])
    return enrutar({ busqueda: () => json({ data: [{ id: '958', modifiedTime: hora(1) }] }), detalle: detalleDe({}, [5, 0]), lista: listaDe('c0', 'c1', 'c2', 'c3', 'c4') })
  }
  const marcadas = async () => ((await db.query("SELECT id FROM conversations WHERE ticket_id='958' AND ausente_en_zoho_at IS NOT NULL ORDER BY id")).rows as { id: string }[]).map((r) => r.id)

  it('un managed_by_app con raw viejo (1 hilo) pero detalle 5/0: con marcarAusentes marca el hilo y sólo el hilo', async () => {
    const h = await preparar958()
    await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: { ...ON, marcarAusentes: true } }).syncRecent()
    expect(await marcadas()).toEqual([HILO])
    expect(await cuenta('958')).toBe(6)
  })

  it('con la pasada encendida y marcarAusentes apagado no marca nada, aunque la lista esté completa', async () => {
    const h = await preparar958()
    await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON }).syncRecent()
    expect(h.convs()).toHaveLength(1)
    expect(await marcadas()).toEqual([])
  })
})

describe('pasada periódica · 429 (S-5)', () => {
  it('un 429 y luego 200: repite la misma página y guarda el ticket', async () => {
    const h = enrutar({ busqueda: busca('101'), detalle: detalleDe(), lista: (_id, n) => (n === 0 ? json({}, 429) : json({ data: [conv('c0')] })) })
    await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON }).syncRecent()
    expect(h.convs()).toEqual(Array(2).fill('/tickets/101/conversations?from=0&limit=100'))
    expect(await cuenta('101')).toBe(1)
  })

  it('cuatro 429 seguidos en el primero: corta la pasada, no pide el segundo y nombra los pendientes', async () => {
    const h = enrutar({ busqueda: busca('101', '102', '103'), detalle: detalleDe(), lista: () => json({}, 429) })
    const n = await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON }).syncRecent()
    expect(n).toBe(3)
    expect(h.convs()).toEqual(Array(4).fill('/tickets/101/conversations?from=0&limit=100'))
    expect(textoErrores()).toContain('sin pedir: 101, 102, 103')
  })
})

describe('pasada periódica · memoria por proceso (S-7)', () => {
  it('el mismo modifiedTime en el segundo ciclo no se vuelve a pedir; uno distinto sí', async () => {
    const mod: Record<string, string> = {}
    const h = enrutar({ busqueda: busca('101', '102'), detalle: (id) => detalleDe(mod)(id), lista: propia })
    const sync = createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON })
    await sync.syncRecent()
    expect(h.convs()).toHaveLength(2)
    await sync.syncRecent()
    expect(h.convs()).toHaveLength(2)
    mod['102'] = hora(9)
    await sync.syncRecent()
    expect(h.convs().slice(2)).toEqual(['/tickets/102/conversations?from=0&limit=100'])
  })

  it('un ticket cuya lista falló no se recuerda: el ciclo siguiente lo pide otra vez', async () => {
    const h = enrutar({ busqueda: busca('101'), detalle: detalleDe(), lista: (_id, n) => (n === 0 ? json({}, 500) : json({ data: [conv('c0')] })) })
    const sync = createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON })
    await sync.syncRecent()
    await sync.syncRecent()
    expect(h.convs()).toHaveLength(2)
    expect(await cuenta('101')).toBe(1)
  })
})

describe('pasada periódica · nunca rompe el ciclo', () => {
  it('una lista con 500 no cambia lo que devuelve syncRecent, queda en el log y la pasada sigue con el siguiente', async () => {
    const h = enrutar({ busqueda: busca('101', '102'), detalle: detalleDe(), lista: (id) => (id === '101' ? json({}, 500) : json({ data: [conv('c0')] })) })
    expect(await createSync({ zohoFetch: h.zohoFetch, db, config, conversaciones: ON }).syncRecent()).toBe(2)
    expect(textoErrores()).toContain('/tickets/101/conversations 500')
    expect(h.convs()).toHaveLength(2)
    expect(await cuenta('102')).toBe(1)
  })

  it('un error de base al guardar un ticket se registra y la pasada sigue con el siguiente', async () => {
    let fallos = 1
    const dbQueSeCae: Queryable = { query: (sql: string, p?: unknown[]) => (sql.includes('INSERT INTO conversations') && fallos-- > 0 ? Promise.reject(new Error('base caída')) : db.query(sql, p)) }
    const h = enrutar({ busqueda: busca('101', '102'), detalle: detalleDe(), lista: propia })
    expect(await createSync({ zohoFetch: h.zohoFetch, db: dbQueSeCae, config, conversaciones: ON }).syncRecent()).toBe(2)
    expect(textoErrores()).toContain('base caída')
    expect(await cuenta('101')).toBe(0)
    expect(await cuenta('102')).toBe(1)
  })
})
