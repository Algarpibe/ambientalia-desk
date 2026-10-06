import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import { getTicketRow } from './db/repo'
import type { AppConfig } from './config'

/**
 * sync-tickets-por-modificacion (`fuera-del-plan`). `syncRecent` pide a `/tickets/search` los tickets
 * modificados desde la marca de agua menos un solape, usa la respuesta SÓLO como índice de ids, relee
 * cada ticket por detalle y lo persiste. `zohoFetch` va ENRUTADO por ruta, no por orden de llamada:
 * una simulación por orden confundiría el índice con el detalle (diseño, «Pruebas existentes»).
 */
const config = { departmentId: 'DEP' } as AppConfig
const MARCA = Date.parse('2026-10-02T10:00:00.000Z')
const SOLAPE = 15 * 60_000

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = (status = 204) => new Response(null, { status })
function z(id: string, n: number, extra: Record<string, unknown> = {}) {
  return { id, ticketNumber: String(n), subject: 's', status: 'Ingresado', statusType: 'Open', customFields: { Serial: 'SR' + id }, ...extra }
}
const ref = (id: string, mt: string) => ({ id, modifiedTime: mt })

interface Rutas {
  busqueda?: (p: URLSearchParams, n: number) => Response | Promise<Response>
  detalle?: (id: string) => Response
  lista?: () => Response
}
function enrutar(r: Rutas) {
  const peticiones: string[] = []
  let busquedas = 0
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    if (path.startsWith('/tickets/search?')) return r.busqueda!(new URLSearchParams(path.split('?')[1]), busquedas++)
    if (path.startsWith('/tickets?')) return r.lista ? r.lista() : json({ data: [] })
    const m = /^\/tickets\/([^/?]+)\?/.exec(path)
    if (m) return r.detalle ? r.detalle(m[1]) : vacio(404)
    return vacio(404) // contactos y cuentas: sin datos
  })
  const de = (frag: string) => peticiones.filter((p) => p.includes(frag))
  return { zohoFetch, peticiones, de, detalles: () => peticiones.filter((p) => /^\/tickets\/[^/?]+\?/.test(p) && !p.startsWith('/tickets/search')) }
}

let db: Queryable
let errores: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  errores = vi.spyOn(console, 'error').mockImplementation(() => {})
})
const fila = (id: string, n: number, mod: string, managed = false) => db.query(
  'INSERT INTO tickets (id, number, status, modified_time, managed_by_app) VALUES ($1, $2, $3, $4, $5)', [id, n, 'Ingresado', mod, managed],
)
const textoErrores = () => errores.mock.calls.map((c) => c.map(String).join(' ')).join('\n')

describe('syncRecent · sin marca (camino de hoy)', () => {
  it('5 · sin marca va por la página 1 de -recentThread, sin búsqueda y sin log', async () => {
    const h = enrutar({ lista: () => json({ data: [z('L', 9)] }) })
    const n = await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(n).toBe(1)
    expect(h.de('/tickets/search')).toHaveLength(0)
    expect(h.de('sortBy=-recentThread')).toHaveLength(1)
    expect(await getTicketRow(db, 'L')).not.toBeNull()
    expect(errores).not.toHaveBeenCalled()
  })
})

describe('syncRecent · marca de agua', () => {
  it('3 · una fila managed_by_app más reciente no adelanta la marca', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    await fila('G1', 2, '2026-10-05T10:00:00.000Z', true)
    const h = enrutar({ busqueda: () => json({ data: [] }) })
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    const [desde] = new URLSearchParams(h.de('/tickets/search')[0].split('?')[1]).get('modifiedTimeRange')!.split(',')
    expect(Date.parse(desde)).toBe(MARCA - SOLAPE)
  })

  it('4 · una fila app-… más reciente no adelanta la marca', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    await fila('app-1', 2, '2026-10-05T10:00:00.000Z')
    const h = enrutar({ busqueda: () => json({ data: [] }) })
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    const [desde] = new URLSearchParams(h.de('/tickets/search')[0].split('?')[1]).get('modifiedTimeRange')!.split(',')
    expect(Date.parse(desde)).toBe(MARCA - SOLAPE)
  })
})

describe('syncRecent · búsqueda como índice', () => {
  it('1 · persiste el DETALLE, no el elemento recortado de la búsqueda; no llama a /tickets?', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({
      busqueda: () => json({ data: [ref('X', '2026-10-03T10:00:00.000Z')] }),
      detalle: (id) => json(z(id, 7, { status: 'Closed', statusType: 'Closed', closedTime: '2026-10-03T09:00:00.000Z', modifiedTime: '2026-10-03T10:00:00.000Z' })),
    })
    const n = await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(n).toBe(1)
    const r = await getTicketRow(db, 'X')
    expect(r!.status).toBe('Closed')
    expect(r!.closed_time).not.toBeNull()
    expect(r!.serial).toBe('SRX')
    expect(h.de('/tickets?')).toHaveLength(0)
    expect(h.detalles()[0]).toContain('include=contacts,assignee')
  })

  it('2 · forma de la petición: departamento, orden, página, límite y rango exacto', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({ busqueda: () => json({ data: [] }) })
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    const p = new URLSearchParams(h.de('/tickets/search')[0].split('?')[1])
    expect(p.get('departmentId')).toBe('DEP')
    expect(p.get('sortBy')).toBe('modifiedTime')
    expect(p.get('from')).toBe('0')
    expect(p.get('limit')).toBe('100')
    const [desde, hasta] = p.get('modifiedTimeRange')!.split(',')
    expect(Date.parse(desde)).toBe(MARCA - SOLAPE)
    expect(Date.parse(hasta)).toBeGreaterThanOrEqual(MARCA)
  })

  it('6 · 100 + 3 resultados: dos páginas (from=0 y from=100) y 103 detalles', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const ids = Array.from({ length: 103 }, (_, i) => `T${i}`)
    const h = enrutar({
      busqueda: (p) => json({ data: (p.get('from') === '0' ? ids.slice(0, 100) : ids.slice(100)).map((id) => ref(id, '2026-10-03T10:00:00.000Z')) }),
      detalle: (id) => json(z(id, 100 + Number(id.slice(1)))),
    })
    const n = await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(h.de('/tickets/search').map((p) => new URLSearchParams(p.split('?')[1]).get('from'))).toEqual(['0', '100'])
    expect(h.detalles()).toHaveLength(103)
    expect(n).toBe(103)
  }, 60_000)

  it('10 · ids repetidos y en orden descendente: un detalle por id, en orden ascendente', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({
      busqueda: () => json({ data: [ref('C', '2026-10-03T12:00:00.000Z'), ref('B', '2026-10-03T11:00:00.000Z'), ref('A', '2026-10-03T10:00:00.000Z'), ref('B', '2026-10-03T11:00:00.000Z')] }),
      detalle: (id) => json(z(id, id.charCodeAt(0))),
    })
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(h.detalles().map((p) => /^\/tickets\/([^/?]+)/.exec(p)![1])).toEqual(['A', 'B', 'C'])
  })
})

describe('syncRecent · caída, vacío y fallos', () => {
  it('7 · 204 sin cuerpo devuelve 0, sin caída y sin log', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({ busqueda: () => vacio(204) })
    const n = await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(n).toBe(0)
    expect(h.de('/tickets?')).toHaveLength(0)
    expect(errores).not.toHaveBeenCalled()
  })

  it('8 · búsqueda 403: log con la ruta y el estado, y se persiste la página 1', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({ busqueda: () => json({}, 403), lista: () => json({ data: [z('L', 9)] }) })
    await expect(createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()).resolves.toBe(1)
    expect(textoErrores()).toContain('/tickets/search')
    expect(textoErrores()).toContain('403')
    expect(h.de('sortBy=-recentThread')).toHaveLength(1)
    expect(await getTicketRow(db, 'L')).not.toBeNull()
  })

  it('8b · búsqueda que lanza: mismo comportamiento, no lanza', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({ busqueda: () => { throw new Error('red caída') }, lista: () => json({ data: [z('L', 9)] }) })
    await expect(createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()).resolves.toBe(1)
    expect(textoErrores()).toContain('/tickets/search')
    expect(await getTicketRow(db, 'L')).not.toBeNull()
  })

  it('9 · POSICIÓN: página 2 con 500: ningún detalle pedido y hay caída', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({
      busqueda: (p) => p.get('from') === '0'
        ? json({ data: Array.from({ length: 100 }, (_, i) => ref(`T${i}`, '2026-10-03T10:00:00.000Z')) })
        : json({}, 500),
      detalle: (id) => json(z(id, 100 + Number(id.slice(1)))),
      lista: () => json({ data: [] }),
    })
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(h.detalles()).toHaveLength(0)
    expect(h.de('sortBy=-recentThread')).toHaveLength(1)
    expect(textoErrores()).toContain('500')
  })

  const tres = (detalle: (id: string) => Response) => enrutar({
    busqueda: () => json({ data: [ref('A', '2026-10-03T10:00:00.000Z'), ref('B', '2026-10-03T11:00:00.000Z'), ref('C', '2026-10-03T12:00:00.000Z')] }),
    detalle,
  })

  it('11 · detalle 429 en el 2.º de 3: el 1.º persiste y el 3.º no se pide', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = tres((id) => id === 'B' ? json({}, 429) : json(z(id, id.charCodeAt(0))))
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(await getTicketRow(db, 'A')).not.toBeNull()
    expect(h.detalles().some((p) => p.startsWith('/tickets/C?'))).toBe(false)
    expect(await getTicketRow(db, 'C')).toBeNull()
    expect(errores).toHaveBeenCalled()
  })

  it('12 · detalle 404 en el 2.º de 3: sigue y el 3.º persiste', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = tres((id) => id === 'B' ? json({}, 404) : json(z(id, id.charCodeAt(0))))
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(await getTicketRow(db, 'C')).not.toBeNull()
    expect(await getTicketRow(db, 'B')).toBeNull()
  })

  it('13 · colisión de número en uno: el otro persiste, no lanza y el recuento incluye a los dos', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,modified_time) VALUES ('pre',5,'p','Ingresado','2026-10-02T10:00:00.000Z')")
    const h = enrutar({
      busqueda: () => json({ data: [ref('A', '2026-10-03T10:00:00.000Z'), ref('B', '2026-10-03T11:00:00.000Z')] }),
      detalle: (id) => json(z(id, id === 'A' ? 5 : 6)),
    })
    const n = await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    expect(await getTicketRow(db, 'B')).not.toBeNull()
    expect(await getTicketRow(db, 'A')).toBeNull()
    expect(n).toBe(2)
  })

  it('14 · diez páginas llenas: no se pide from=1000 y el log nombra el tope', async () => {
    await fila('Z1', 1, '2026-10-02T10:00:00.000Z')
    const h = enrutar({
      busqueda: (p) => json({ data: Array.from({ length: 100 }, (_, i) => ref(`T${Number(p.get('from')) + i}`, '2026-10-03T10:00:00.000Z')) }),
    })
    await createSync({ zohoFetch: h.zohoFetch, db, config }).syncRecent()
    const froms = h.de('/tickets/search').map((p) => new URLSearchParams(p.split('?')[1]).get('from'))
    expect(froms).toHaveLength(10)
    expect(froms).not.toContain('1000')
    expect(textoErrores()).toContain('tope')
  })
})
