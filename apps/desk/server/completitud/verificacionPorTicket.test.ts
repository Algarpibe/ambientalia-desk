import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { eventId, upsertHistoryEvent } from '@ambientalia/zoho-sync/db/history'
import { REINTENTOS_429 } from '@ambientalia/zoho-sync/conversaciones'
import { crearVerificacionCompletitud, type EstadoVerificacion, type Informe } from './verificacion'

/**
 * verificacion-completitud (1G-03, D8, RQ-ZS-36, RQ-ZS-37) · el motor, fase B (por ticket).
 * QUÉ COMPRUEBA: CA-2 (listas de ids, el recuento declarado no decide), CA-3 (adjunto por las dos vías una vez, `size` distinto), CA-4 (historia por el id
 * derivado, con el `upsertHistoryEvent` real), un ticket ausente transmite su clase a sus hijos, `noEvaluados` del que sólo está en Zoho, el error de una
 * fuente es error del ticket (no ausencia), el corte `429` en la B sin filas parciales y `desde`/`limite`, CA-10 con grabadora y CA-11 con marcadores.
 * QUÉ NO COMPRUEBA: el veredicto global ni `completa` (L6), el volumen ni la continuación (L6), la ruta (L6). Pg-mem y `zohoFetch` falsa, sin red.
 */
type Cuerpo = unknown[] | number | { cuerpo: unknown } | Response
type Salida = Cuerpo | ((n: number) => Cuerpo)
const responder = (s: Cuerpo) => (s instanceof Response ? s : Array.isArray(s) ? new Response(JSON.stringify({ data: s })) : typeof s === 'number' ? new Response('', { status: s }) : new Response(JSON.stringify(s.cuerpo)))
/** Zoho falso: `tabla` da la salida de cada ruta sin parámetros (una función recibe el número de llamada; puede lanzar); lo no listado es `404`. */
function zoho(tabla: Record<string, Salida>) {
  const rutas: string[] = []; const inits: unknown[] = []; const cuenta = new Map<string, number>()
  const f = async (path: string, init?: RequestInit) => {
    rutas.push(path); inits.push(init); const p = path.split('?')[0]; const n = (cuenta.get(p) ?? 0) + 1; cuenta.set(p, n)
    const s = tabla[p] ?? 404
    return responder(typeof s === 'function' ? s(n) : s)
  }
  return { f, rutas, inits, pedidos: (p: string) => rutas.filter((r) => r.split('?')[0] === p).length }
}
const VACIAS: Record<string, Salida> = { '/tickets': [], '/tickets/archivedTickets': [], '/contacts': [], '/accounts': [] }
const zt = (n: number) => ({ id: String(n), ticketNumber: String(n) })
/** Las tres lecturas por ticket; lo que no se da es una lista vacía. */
const hijos = (id: string, h: { conv?: Salida; adj?: Salida; hist?: Salida } = {}): Record<string, Salida> =>
  ({ [`/tickets/${id}/conversations`]: h.conv ?? [], [`/tickets/${id}/attachments`]: h.adj ?? [], [`/tickets/${id}/History`]: h.hist ?? [] })
const SIN_REGLAS = JSON.stringify({ version: 1, entradas: [] })
const lista = (entradas: unknown[]) => JSON.stringify({ version: 1, entradas })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const ticketDesk = (id: string, numero: number) => db.query('INSERT INTO tickets (id, number, status) VALUES ($1, $2, $3)', [id, numero, 'Abierto'])
const convDesk = (id: string, ticket: string, source = 'zoho', ausente: string | null = null, contenido: string | null = null) =>
  db.query('INSERT INTO conversations (id, ticket_id, source, ausente_en_zoho_at, content) VALUES ($1, $2, $3, $4, $5)', [id, ticket, source, ausente, contenido])
const adjDesk = (id: string, ticket: string, conv: string | null, size: number | null) => db.query('INSERT INTO attachments (id, ticket_id, conversation_id, size) VALUES ($1, $2, $3, $4)', [id, ticket, conv, size])
const EV1 = { eventTime: '2026-01-01T00:00:00Z', eventName: 'TicketCreated', eventInfo: [{ k: 1 }] }
const EV2 = { eventTime: '2026-01-02T00:00:00Z', eventName: 'TicketUpdated', eventInfo: [{ k: 2 }] }

function montar(tabla: Record<string, Salida> = {}, extra: Partial<Parameters<typeof crearVerificacionCompletitud>[0]> = {}) {
  const z = zoho({ ...VACIAS, ...tabla }); const registrado: EstadoVerificacion[] = []
  const v = crearVerificacionCompletitud({ zohoFetch: z.f, db, departmentId: '77', dir: null, pausaMs: 0, pausa429Ms: 0, registrar: (r) => registrado.push(r), ...extra })
  return { v, z, registrado }
}
async function esperar(v: { estado(): EstadoVerificacion }): Promise<EstadoVerificacion> {
  for (let i = 0; i < 5000 && !v.estado().terminado; i++) await new Promise<void>((r) => setImmediate(r))
  expect(v.estado().terminado).toBe(true)
  return v.estado()
}
async function correr(m: ReturnType<typeof montar>, opciones: { desde?: number; limite?: number } = {}): Promise<Informe> {
  m.v.lanzar(opciones)
  const { informe } = await esperar(m.v)
  if (!informe) throw new Error('la pasada no dejó informe')
  return informe
}
const ids = (filas: { id: string }[]) => filas.map((f) => f.id)

describe('CA-2 · conversaciones como listas de ids', () => {
  it('Zoho a1, a2 y Desk a1, a3 con el mismo número ⇒ a2 falta en Desk y a3 falta en Zoho', async () => {
    await ticketDesk('1', 1); await convDesk('a1', '1'); await convDesk('a3', '1')
    const c = (await correr(montar({ '/tickets': [zt(1)], ...hijos('1', { conv: [{ id: 'a1' }, { id: 'a2' }] }) }))).entidades.conversaciones
    expect([ids(c.faltaEnDesk), ids(c.faltaEnZoho), c.casan, c.enZoho, c.enDesk, c.sinExplicar]).toEqual([['a2'], ['a3'], 1, 2, 2, 2])
    expect([c.faltaEnDesk[0].numero, c.estado]).toEqual([1, 'rojo'])
  })

  it('E-266: el ticket declara 5 conversaciones, Zoho devuelve 4 y Desk guarda esas 4 ⇒ ninguna discrepancia', async () => {
    await ticketDesk('1', 1)
    for (const id of ['a1', 'a2', 'a3', 'a4']) await convDesk(id, '1')
    const zc = ['a1', 'a2', 'a3', 'a4'].map((id) => ({ id }))
    const c = (await correr(montar({ '/tickets': [{ ...zt(1), commentCount: 5, threadCount: 0 }], ...hijos('1', { conv: zc }) }))).entidades.conversaciones
    expect([c.faltaEnDesk, c.faltaEnZoho, c.casan, c.estado]).toEqual([[], [], 4, 'verde'])
  })
})

describe('CA-3 · adjuntos: unión por las dos vías, contados una vez, y tamaño', () => {
  it('el 4001 por las dos vías cuenta una vez y casa; el 4002 con otro size es diferencia con los bytes de cada lado; el 4003 sólo en la segunda vía falta en Desk', async () => {
    await ticketDesk('1', 1); await convDesk('a1', '1'); await adjDesk('4001', '1', 'a1', 100); await adjDesk('4002', '1', 'a1', 70)
    const conv = [{ id: 'a1', attachments: [{ id: '4001', size: '100' }, { id: '4002', size: 50 }] }]
    const adj = [{ id: '4001', size: 100 }, { id: '4003', size: 10 }]
    const a = (await correr(montar({ '/tickets': [zt(1)], ...hijos('1', { conv, adj }) }))).entidades.adjuntos
    expect([ids(a.faltaEnDesk), a.faltaEnZoho, a.casan, a.enZoho, a.enDesk, a.bytes]).toEqual([['4003'], [], 1, 3, 2, { zoho: 160, desk: 170 }])
    expect(a.distintoTamano).toMatchObject([{ id: '4002', clase: 'sin explicar', tamano: { zoho: 50, desk: 70 } }])
    expect(a.sinExplicar).toBe(2)
  })

  it('un 404 de la segunda vía es error del ticket en adjuntos, no ausencia: el adjunto de Desk no sale «falta en Zoho» y las conversaciones sí se comparan', async () => {
    await ticketDesk('1', 1); await convDesk('a1', '1'); await adjDesk('4001', '1', 'a1', 100)
    const i = await correr(montar({ '/tickets': [zt(1)], ...hijos('1', { conv: [{ id: 'a1' }], adj: 404 }) }))
    expect(i.errores).toEqual([{ entidad: 'adjuntos', numero: 1, motivo: 'tickets/attachments http 404' }])
    expect([i.entidades.adjuntos.faltaEnZoho, i.entidades.adjuntos.enDesk, i.entidades.adjuntos.estado]).toEqual([[], 0, 'incompleto'])
    expect([i.entidades.conversaciones.casan, i.entidades.conversaciones.estado, i.entidades.historia.estado]).toEqual([1, 'verde', 'verde'])
  })

  it('el error de las conversaciones arrastra a adjuntos (sin pedir la segunda vía) y la historia sí se compara', async () => {
    await ticketDesk('1', 1); await upsertHistoryEvent(db, '1', EV1)
    const m = montar({ '/tickets': [zt(1)], ...hijos('1', { conv: 500, hist: [EV1] }) })
    const i = await correr(m)
    expect(i.errores).toEqual([{ entidad: 'conversaciones', numero: 1, motivo: 'conversaciones http 500' }, { entidad: 'adjuntos', numero: 1, motivo: 'sin lista de conversaciones' }])
    expect([i.entidades.conversaciones.estado, i.entidades.adjuntos.estado, i.entidades.historia.casan]).toEqual(['incompleto', 'incompleto', 1])
    expect(m.z.pedidos('/tickets/1/attachments')).toBe(0)
  })
})

describe('CA-4 · la historia casa por el id derivado', () => {
  it('el evento guardado con el upsert real casa y el no guardado falta en Desk con su id derivado', async () => {
    await ticketDesk('1', 1); await upsertHistoryEvent(db, '1', EV1)
    const h = (await correr(montar({ '/tickets': [zt(1)], ...hijos('1', { hist: [EV1, EV2] }) }))).entidades.historia
    expect([ids(h.faltaEnDesk), h.casan, h.enZoho, h.enDesk, h.faltaEnZoho]).toEqual([[eventId('1', EV2)], 1, 2, 1, []])
  })
})

describe('herencia: un ticket sólo de un lado', () => {
  async function sembrar1017() {
    await ticketDesk('1017', 1017); await convDesk('c1', '1017'); await adjDesk('ad1', '1017', 'c1', 5); await upsertHistoryEvent(db, '1017', EV1)
  }
  it('el #1017 ausente de Zoho: sus conversaciones, adjuntos e historia salen «falta en Zoho» conocidos con E-267, sin pedir nada de ese ticket', async () => {
    await sembrar1017()
    const m = montar({ '/tickets/1017': 404 })
    const e = (await correr(m)).entidades
    // El adjunto hereda de su conversación (la más cercana), que a su vez hereda del ticket.
    for (const [x, de] of [[e.conversaciones, 'tickets:1017'], [e.adjuntos, 'conversaciones:c1'], [e.historia, 'tickets:1017']] as const) {
      expect(x.faltaEnZoho).toMatchObject([{ numero: 1017, clase: 'conocida', entrada: 'E-267', heredadaDe: de }])
      expect([x.conocidas, x.sinExplicar, x.enDesk]).toEqual([1, 0, 1])
    }
    expect(ids(e.conversaciones.faltaEnZoho)).toEqual(['c1'])
    expect(m.z.rutas.filter((r) => r.startsWith('/tickets/1017/'))).toEqual([])
  })

  it('sin la entrada del #1017 los mismos hijos salen «sin explicar» y su entidad es roja', async () => {
    await sembrar1017()
    const e = (await correr(montar({ '/tickets/1017': 404 }, { leerLista: () => SIN_REGLAS }))).entidades
    expect([e.conversaciones, e.adjuntos, e.historia].map((x) => [x.faltaEnZoho[0].clase, x.sinExplicar, x.estado])).toEqual(Array(3).fill(['sin explicar', 1, 'rojo']))
  })

  it('las conversaciones de un ticket presente se explican por regla (ausente_en_zoho_at, source de app) y el adjunto de la ausente hereda; sin las reglas, «sin explicar»', async () => {
    await ticketDesk('1', 1); await convDesk('c1', '1', 'zoho', '2026-11-01T00:00:00Z'); await convDesk('c2', '1', 'app'); await adjDesk('ad1', '1', 'c1', 5)
    const tabla = { '/tickets': [zt(1)], ...hijos('1', { conv: [] }) }
    const e = (await correr(montar(tabla))).entidades
    expect(e.conversaciones.faltaEnZoho).toMatchObject([{ id: 'c1', entrada: 'DEPLOY.md §19' }, { id: 'c2', entrada: 'DEPLOY.md §23' }])
    expect(e.adjuntos.faltaEnZoho).toMatchObject([{ id: 'ad1', clase: 'conocida', entrada: 'DEPLOY.md §19', heredadaDe: 'conversaciones:c1' }])
    const sin = (await correr(montar(tabla, { leerLista: () => SIN_REGLAS }))).entidades
    expect([...sin.conversaciones.faltaEnZoho, ...sin.adjuntos.faltaEnZoho].map((x) => x.clase)).toEqual(Array(3).fill('sin explicar'))
  })

  it('el ticket que sólo está en Zoho no pide hijos: cada entidad lo lista en noEvaluados con su número y su clase, y cuenta «sin explicar» si lo es', async () => {
    const tabla = { '/tickets': [zt(55)] }
    const m = montar(tabla)
    const e = (await correr(m)).entidades
    for (const x of [e.conversaciones, e.adjuntos, e.historia]) expect([x.noEvaluados, x.sinExplicar, x.estado]).toEqual([[{ numero: 55, clase: 'sin explicar', heredadaDe: 'tickets:55' }], 1, 'rojo'])
    expect(m.z.rutas.filter((r) => r.startsWith('/tickets/55/'))).toEqual([])
    const conocido = lista([{ entidad: 'tickets', numeros: [55], causa: 'causa propia', entrada: 'E-1' }])
    const k = (await correr(montar(tabla, { leerLista: () => conocido }))).entidades.historia
    expect([k.noEvaluados, k.conocidas, k.sinExplicar]).toEqual([[{ numero: 55, clase: 'conocida', causa: 'causa propia', entrada: 'E-1', heredadaDe: 'tickets:55' }], 1, 0])
  })
})

describe('corte 429 en la B, desde y limite', () => {
  const tabla = (h20: Salida) => ({ '/tickets': [zt(10), zt(20), zt(30)], ...hijos('10'), ...hijos('20', { hist: h20 }), ...hijos('30') })
  const sembrar = async () => { await ticketDesk('10', 10); await ticketDesk('20', 20); await ticketDesk('30', 30); await convDesk('x20', '20') }

  it('el 429 agotado en la historia del 20 corta en el 20: nada de ese ticket entra en el informe (ni su conversación ya leída) y no se pide el 30; comparados es 1', async () => {
    await sembrar()
    const m = montar(tabla(429))
    const i = await correr(m)
    expect([i.cortadoEn, i.motivoCorte, i.cobertura.comparados, i.errores]).toEqual([{ fase: 'B', numero: 20 }, '429', 1, []])
    expect([i.entidades.conversaciones.faltaEnZoho, i.entidades.conversaciones.enDesk, i.entidades.conversaciones.estado]).toEqual([[], 0, 'incompleto'])
    expect([m.z.pedidos('/tickets/20/History'), m.z.pedidos('/tickets/30/conversations')]).toEqual([1 + REINTENTOS_429, 0])
  })

  it('desde=20 con Zoho sano pide sólo el 20 y el 30, en ese orden, y publica lo del 20', async () => {
    await sembrar()
    const m = montar(tabla([]))
    const i = await correr(m, { desde: 20 })
    expect(m.z.rutas.filter((r) => r.includes('/conversations')).map((r) => r.split('?')[0])).toEqual(['/tickets/20/conversations', '/tickets/30/conversations'])
    expect([i.cobertura.desde, i.cobertura.comparados, i.cortadoEn, ids(i.entidades.conversaciones.faltaEnZoho)]).toEqual([20, 2, null, ['x20']])
  })

  it('limite=2 corta en el siguiente con motivo «limite» y no pide el 30', async () => {
    await sembrar()
    const m = montar(tabla([]))
    const i = await correr(m, { limite: 2 })
    expect([i.cortadoEn, i.motivoCorte, i.cobertura.comparados, m.z.pedidos('/tickets/30/conversations')]).toEqual([{ fase: 'B', numero: 30 }, 'limite', 2, 0])
  })
})

describe('orden de los errores', () => {
  it('por entidad (el orden del tipo), número e id, aunque la A los empuje antes', async () => {
    await ticketDesk('1', 1); await ticketDesk('2', 2); await db.query("INSERT INTO contacts (id, source, managed_by_app) VALUES ('c1', 'zoho', false)")
    const m = montar({ '/tickets': [zt(1), zt(2)], '/contacts/c1': 500, ...hijos('1', { conv: 500 }), ...hijos('2', { hist: 500 }) })
    const i = await correr(m)
    expect(i.errores.map((x) => [x.entidad, x.numero ?? x.id])).toEqual([['conversaciones', 1], ['adjuntos', 1], ['historia', 2], ['contactos', 'c1']])
  })
})

describe('sólo lectura y sin datos de clientes', () => {
  it('CA-10: con grabadora, ninguna sentencia que no sea SELECT llega a la base y toda petición a Zoho va sin init', async () => {
    await ticketDesk('1', 1); await convDesk('a1', '1'); await adjDesk('4001', '1', 'a1', 100); await ticketDesk('1017', 1017); await convDesk('c1', '1017')
    const sentencias: string[] = []
    const grabadora: Queryable = { query: async (sql, params) => { sentencias.push(sql); return db.query(sql, params) } }
    const m = montar({ '/tickets': [zt(1)], '/tickets/1017': 404, ...hijos('1', { conv: [{ id: 'a1', attachments: [{ id: '4001', size: 100 }] }] }) }, { db: grabadora })
    const i = await correr(m)
    expect(sentencias.filter((s) => /FROM conversations/.test(s)).length).toBeGreaterThanOrEqual(2)
    expect(sentencias.filter((s) => !/^\s*select\b/i.test(s))).toEqual([])
    expect([i.escriturasRechazadas.total, m.v.estado().error, i.cobertura.comparados]).toEqual([0, undefined, 1])
    expect(m.z.inits).toHaveLength(8)
    expect(m.z.inits.every((x) => x === undefined)).toBe(true)
  })

  it('CA-11: asunto, contacto, empresa, contenido, autor, nombre de adjunto, actor, el cuerpo de un 500 y el mensaje de una excepción no llegan al informe, al GET ni a registrar', async () => {
    const MARCA = 'marcador-cliente-8842'
    await ticketDesk('1', 1); await ticketDesk('2', 2); await ticketDesk('3', 3); await convDesk('a9', '1', 'zoho', null, MARCA)
    const ticket1 = { ...zt(1), subject: MARCA, contact: { firstName: MARCA, email: `${MARCA}@x.co` }, account: { accountName: MARCA } }
    const conv = [{ id: 'a1', content: MARCA, author: { name: MARCA }, attachments: [{ id: '4001', name: `${MARCA}.pdf`, size: 1 }] }]
    const m = montar({
      '/tickets': [zt(2), zt(3), ticket1],
      ...hijos('1', { conv, adj: [{ id: '4001', name: MARCA, size: 1 }], hist: [{ ...EV1, actor: { name: MARCA } }] }),
      ...hijos('2', { conv: () => new Response(MARCA, { status: 500 }) }),
      ...hijos('3', { conv: () => { throw new Error(MARCA) } }),
    })
    const i = await correr(m)
    const salida = JSON.stringify(m.v.estado()) + JSON.stringify(m.registrado)
    expect(salida).not.toContain(MARCA)
    expect(salida).toContain('"a9"')
    expect(i.errores.filter((x) => x.entidad === 'conversaciones').map((x) => x.motivo)).toEqual(['conversaciones http 500', 'conversaciones red'])
    expect(m.registrado).toHaveLength(1)
  })
})
