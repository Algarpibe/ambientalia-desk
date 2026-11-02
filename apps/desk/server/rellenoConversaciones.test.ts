import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createSync } from '@ambientalia/zoho-sync/sync'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { crearRellenoConversaciones } from './rellenoConversaciones'

/**
 * relleno-completo-conversaciones (1G-01, RQ-ZS-28 y RQ-ZS-29), lote L1. pg-mem + `createSync` REAL con una `zohoFetch` falsa
 * ENRUTADA POR RUTA (molde `packages/zoho-sync/src/conversaciones.test.ts:17-36`): el contacto y la cuenta que pide
 * `persistTicket` (`sync.ts:90`, `:100`) responden 404, y las peticiones de detalle se cuentan sólo por `/tickets/<id>?…`.
 * La pasada corre en segundo plano: se espera su fin por estado, nunca con una pausa fija.
 */
const config = { departmentId: 'DEP' } as AppConfig
const PASADO = '2026-01-01T00:00:00.000Z'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = (status = 204) => new Response(null, { status })
const conv = (id: string) => ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' })
const ids = (ticket: string, n: number) => Array.from({ length: n }, (_, i) => `${ticket}-c${i}`)

type Detalle = { status?: number; body?: Record<string, unknown> }
type Paginas = string[] | { status: number }
const det = (id: string, numero: number, extra: Record<string, unknown> = {}): Detalle =>
  ({ body: { id, ticketNumber: String(numero), subject: 'Asunto ' + id, status: 'Ingresado', commentCount: '0', threadCount: '1', ...extra } })
const url = (id: string) => `/tickets/${id}?include=contacts,assignee`

function servidor(detalles: Record<string, Detalle>, conversaciones: Record<string, Paginas> = {}) {
  const peticiones: string[] = []
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    const m = /^\/tickets\/([^/?]+)(\/conversations)?\?(.*)$/.exec(path)
    if (m && !m[2]) { const d = detalles[m[1]]; return d ? json(d.body ?? {}, d.status ?? 200) : json({}, 404) }
    if (m && m[2]) {
      const c = conversaciones[m[1]] ?? []
      if (!Array.isArray(c)) return json({}, c.status)
      const q = new URLSearchParams(m[3]); const from = Number(q.get('from')); const limit = Number(q.get('limit'))
      const data = c.slice(from, from + limit).map(conv)
      return data.length ? json({ data }) : vacio()
    }
    if (path.startsWith('/contacts/') || path.startsWith('/accounts/')) return json({}, 404)
    throw new Error('petición inesperada ' + path)
  })
  const deDetalle = () => peticiones.filter((p) => /^\/tickets\/[^/?]+\?/.test(p))
  const deConversaciones = () => peticiones.filter((p) => p.includes('/conversations?'))
  return { zohoFetch, peticiones, deDetalle, deConversaciones }
}

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {})
})
const ticket = (id: string, numero: number, raw: Record<string, unknown> | null = null, subject = 'Viejo') =>
  db.query("INSERT INTO tickets (id, number, subject, status, raw) VALUES ($1, $2, $3, 'Ingresado', $4)", [id, numero, subject, raw ? JSON.stringify(raw) : null])
const filas = async (tk: string) =>
  ((await db.query('SELECT id, ausente_en_zoho_at FROM conversations WHERE ticket_id=$1 ORDER BY id', [tk])).rows as { id: string; ausente_en_zoho_at: unknown }[])
const asunto = async (id: string) => ((await db.query('SELECT subject FROM tickets WHERE id=$1', [id])).rows[0] as { subject: string }).subject

function montar(s: ReturnType<typeof servidor>, marcar = false) {
  const sync = createSync({ zohoFetch: s.zohoFetch, db, config })
  const registrar = vi.fn()
  return crearRellenoConversaciones({ zohoFetch: s.zohoFetch, db, sync, marcar, pausaMs: 0, pausa429Ms: 0, registrar })
}
async function correr(r: ReturnType<typeof montar>, o: { desde?: number; limite?: number } = {}) {
  r.lanzar(o)
  await vi.waitFor(() => expect(r.estado().terminado).toBe(true), { timeout: 5000 })
  return r.estado()
}
const unoPorNumero = (numeros: number[]) => ({
  detalles: Object.fromEntries(numeros.map((n) => ['Z' + n, det('Z' + n, n)])),
  conversaciones: Object.fromEntries(numeros.map((n) => ['Z' + n, ids('Z' + n, 1)])),
})

describe('recorrido (RQ-ZS-28)', () => {
  it('orden ascendente por number, archivados incluidos, sin el id app- ni la lista /tickets', async () => {
    await ticket('Z30', 30); await ticket('Z10', 10); await ticket('Z20', 20, { isArchived: true }); await ticket('app-uno', 5)
    const u = unoPorNumero([10, 20, 30])
    const s = servidor(u.detalles, u.conversaciones)
    const e = await correr(montar(s))
    expect(s.deDetalle()).toEqual(['Z10', 'Z20', 'Z30'].map(url))
    expect(s.peticiones.some((p) => p.includes('app-uno'))).toBe(false)
    expect(s.peticiones.some((p) => p.startsWith('/tickets?'))).toBe(false)
    expect([e.aRecorrer, e.saltadosApp, e.recorridos]).toEqual([3, 1, 3])
    expect(e.enMarcha).toBe(false)
  })

  it('una sola petición de detalle por ticket: persistir el detalle no lo vuelve a pedir', async () => {
    for (const n of [1, 2, 3]) await ticket('Z' + n, n)
    const u = unoPorNumero([1, 2, 3])
    const s = servidor(u.detalles, u.conversaciones)
    await correr(montar(s))
    expect(s.deDetalle()).toHaveLength(3)
    expect(s.deConversaciones()).toHaveLength(3)
  })

  it('desde=3 y limite=2 sólo piden los detalles de 3 y 4', async () => {
    for (let n = 1; n <= 5; n++) await ticket('Z' + n, n)
    const u = unoPorNumero([1, 2, 3, 4, 5])
    const s = servidor(u.detalles, u.conversaciones)
    const e = await correr(montar(s), { desde: 3, limite: 2 })
    expect(s.deDetalle()).toEqual(['Z3', 'Z4'].map(url))
    expect([e.desde, e.limite, e.aRecorrer]).toEqual([3, 2, 2])
  })

  it('limite=0 en el módulo no pide nada ni escribe nada y termina', async () => {
    await ticket('Z1', 1)
    const s = servidor({ Z1: det('Z1', 1, { subject: 'Nuevo' }) }, { Z1: ids('Z1', 1) })
    const e = await correr(montar(s), { limite: 0 })
    expect(s.peticiones).toEqual([])
    expect(await filas('Z1')).toEqual([])
    expect(await asunto('Z1')).toBe('Viejo')
    expect([e.aRecorrer, e.recorridos]).toEqual([0, 0])
  })

  it('el límite cuenta sólo los de Zoho: un app- dentro del tramo no gasta cupo y se anota como saltado', async () => {
    await ticket('Z1', 1); await ticket('app-dos', 2); await ticket('Z3', 3); await ticket('Z4', 4)
    const u = unoPorNumero([1, 3, 4])
    const s = servidor(u.detalles, u.conversaciones)
    const e = await correr(montar(s), { limite: 2 })
    expect(s.deDetalle()).toEqual(['Z1', 'Z3'].map(url))
    expect([e.aRecorrer, e.saltadosApp]).toEqual([2, 1])
  })

  it('recuento({ desde }) cuenta sin llamar a Zoho ni escribir', async () => {
    for (let n = 1; n <= 5; n++) await ticket('Z' + n, n)
    await ticket('app-uno', 6); await ticket('app-bajo', 0)
    const s = servidor({})
    const r = montar(s)
    expect(await r.recuento({})).toEqual({ aRecorrer: 5, saltadosApp: 2 })
    expect(await r.recuento({ desde: 3 })).toEqual({ aRecorrer: 3, saltadosApp: 1 })
    expect(s.peticiones).toEqual([])
    expect(r.estado().terminado).toBe(false)
  })
})

describe('detalle y persistencia (RQ-ZS-28)', () => {
  it('persiste el detalle fresco por syncTicket y deja la fila con los valores de Zoho', async () => {
    await ticket('Z1', 1)
    const s = servidor({ Z1: det('Z1', 1, { subject: 'Fresco' }) }, { Z1: ids('Z1', 1) })
    await correr(montar(s))
    expect(await asunto('Z1')).toBe('Fresco')
  })

  it('un 404 y un isTrashed/isDeleted (booleano o texto) salen «no está en Zoho» sin escribir ni leer ni marcar', async () => {
    for (const n of [1, 2, 3, 4]) await ticket('Z' + n, n)
    await db.query("INSERT INTO conversations (id, ticket_id, source, created_at) VALUES ('previa', 'Z1', 'zoho', $1)", [PASADO])
    const s = servidor({
      Z2: det('Z2', 2, { isTrashed: true, subject: 'Cambiado' }),
      Z3: det('Z3', 3, { isDeleted: 'true', subject: 'Cambiado' }),
      Z4: det('Z4', 4, { isTrashed: 'true', subject: 'Cambiado' }),
    }, { Z1: ids('Z1', 1), Z2: ids('Z2', 1), Z3: ids('Z3', 1), Z4: ids('Z4', 1) })
    const e = await correr(montar(s, true))
    expect(e.noEstaEnZoho).toEqual([1, 2, 3, 4])
    expect(e.cuentas).toEqual({ completo: 0, descuadrado: 0, sinRecuento: 0, conError: 0, noEstaEnZoho: 4 })
    expect(s.deConversaciones()).toEqual([])
    for (const id of ['Z1', 'Z2', 'Z3', 'Z4']) expect(await asunto(id)).toBe('Viejo')
    expect(await filas('Z1')).toEqual([{ id: 'previa', ausente_en_zoho_at: null }])
  })

  it('un 500 del detalle cuenta como «con error» y la pasada sigue con el siguiente', async () => {
    await ticket('Z1', 1); await ticket('Z2', 2)
    const s = servidor({ Z1: { status: 500 }, Z2: det('Z2', 2) }, { Z2: ids('Z2', 1) })
    const e = await correr(montar(s))
    expect(e.conError).toEqual([1])
    expect(e.cuentas).toMatchObject({ conError: 1, completo: 1 })
    expect(e.recorridos).toBe(2)
    expect(s.deConversaciones()).toEqual(['/tickets/Z2/conversations?from=0&limit=100'])
  })
})

describe('lectura y clases (RQ-ZS-28)', () => {
  it('un archivado tipo #300 (commentCount 7 + threadCount 1, 8 conversaciones) sale completo con 8 filas sin marca', async () => {
    await ticket('Z300', 300, { isArchived: true })
    const s = servidor({ Z300: det('Z300', 300, { commentCount: '7', threadCount: '1' }) }, { Z300: ids('Z300', 8) })
    const e = await correr(montar(s))
    expect(e.cuentas).toMatchObject({ completo: 1, descuadrado: 0 })
    const f = await filas('Z300')
    expect(f).toHaveLength(8)
    expect(f.every((x) => x.ausente_en_zoho_at === null)).toBe(true)
  })

  it('un recuento que no cuadra sale descuadrado con número, esperado y guardadas', async () => {
    await ticket('Z8', 8)
    const s = servidor({ Z8: det('Z8', 8, { commentCount: '7', threadCount: '1' }) }, { Z8: ids('Z8', 7) })
    const e = await correr(montar(s))
    expect(e.cuentas).toMatchObject({ completo: 0, descuadrado: 1 })
    expect(e.descuadrados).toEqual([{ numero: 8, esperado: 8, guardadas: 7 }])
    expect(await filas('Z8')).toHaveLength(7)
  })

  it('un detalle sin threadCount sale «sin recuento», nunca completo ni descuadrado', async () => {
    await ticket('Z5', 5)
    const body = det('Z5', 5).body!; delete body.threadCount
    const s = servidor({ Z5: { body } }, { Z5: ids('Z5', 2) })
    const e = await correr(montar(s))
    expect(e.sinRecuento).toEqual([5])
    expect(e.cuentas).toMatchObject({ sinRecuento: 1, completo: 0, descuadrado: 0 })
    expect(await filas('Z5')).toHaveLength(2)
  })

  it('una página de conversaciones que responde 500 sale «con error» y la pasada sigue con los demás', async () => {
    for (const n of [1, 2, 3]) await ticket('Z' + n, n)
    const u = unoPorNumero([1, 2, 3])
    const s = servidor(u.detalles, { ...u.conversaciones, Z2: { status: 500 } })
    const e = await correr(montar(s))
    expect(e.conError).toEqual([2])
    expect(e.cuentas).toMatchObject({ completo: 2, conError: 1 })
    expect(e.recorridos).toBe(3)
    expect(await filas('Z3')).toHaveLength(1)
  })

  it('cuenta las peticiones de detalle y de páginas, no las de contacto ni cuenta', async () => {
    await ticket('Z1', 1); await ticket('Z2', 2)
    const s = servidor({ Z1: det('Z1', 1, { contactId: 'K1' }), Z2: det('Z2', 2) }, { Z1: ids('Z1', 1), Z2: ids('Z2', 1) })
    const e = await correr(montar(s))
    expect(s.peticiones.some((p) => p.startsWith('/contacts/'))).toBe(true)
    expect(e.peticiones).toBe(4)
  })
})
