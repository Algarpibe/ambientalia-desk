import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

/**
 * sync-conversaciones-zoho (1G-01, RQ-ZS-25 y RQ-ZS-26) a través de `createSync`: `syncConversations` pide la lista
 * entera por páginas, guarda lo recibido aunque una página falle, y SÓLO con el interruptor `marcarAusentes` que
 * pasa la App y con la lista completa contra `commentCount` + `threadCount` de `tickets.raw` (S-4) marca lo ausente.
 * `zohoFetch` va ENRUTADO por ruta (`from` y `limit` de la petición), como `sync.modificados.test.ts`.
 */
const config = { departmentId: 'DEP' } as AppConfig
const PASADO = '2026-01-01T00:00:00.000Z'
const HILO = '495552000057899091'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = (status = 204) => new Response(null, { status })
const conv = (id: string) => ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' })
const ids = (desde: number, hasta: number) => Array.from({ length: hasta - desde }, (_, i) => 'c' + (desde + i))
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

function servidor(total: number, opciones: { fallaEn?: number } = {}) {
  const peticiones: string[] = []
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    const q = new URLSearchParams(path.split('?')[1])
    const from = Number(q.get('from')); const limit = Number(q.get('limit'))
    if (opciones.fallaEn === from) return json({}, 500)
    const data = ids(from, Math.min(from + limit, total)).map(conv)
    return data.length ? json({ data }) : vacio()
  })
  return { zohoFetch, peticiones }
}

let db: Queryable
let errores: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  errores = vi.spyOn(console, 'error').mockImplementation(() => {})
})
const ticket = (id: string, n: number, raw: Record<string, unknown> | null) =>
  db.query("INSERT INTO tickets (id, number, status, raw) VALUES ($1, $2, 'Ingresado', $3)", [id, n, raw ? JSON.stringify(raw) : null])
const fila = (id: string, tk: string, source = 'zoho') =>
  db.query('INSERT INTO conversations (id, ticket_id, source, created_at) VALUES ($1, $2, $3, $4)', [id, tk, source, PASADO])
const cuenta = async (tk: string) => Number(((await db.query('SELECT count(*) AS n FROM conversations WHERE ticket_id=$1', [tk])).rows[0] as { n: unknown }).n)
const marcadas = async (tk: string) =>
  ((await db.query('SELECT id FROM conversations WHERE ticket_id=$1 AND ausente_en_zoho_at IS NOT NULL ORDER BY id', [tk])).rows as { id: string }[]).map((r) => r.id)

describe('syncConversations · lista entera (RQ-ZS-25)', () => {
  it('250 conversaciones llegan en tres páginas (from=0/100/200, limit=100) y quedan las 250', async () => {
    const s = servidor(250)
    await createSync({ zohoFetch: s.zohoFetch, db, config }).syncConversations('T1')
    expect(s.peticiones).toEqual([
      '/tickets/T1/conversations?from=0&limit=100',
      '/tickets/T1/conversations?from=100&limit=100',
      '/tickets/T1/conversations?from=200&limit=100',
    ])
    expect(await cuenta('T1')).toBe(250)
  })
  it('una segunda página con 500 guarda las 100 de la primera y rechaza nombrando ticket y estado', async () => {
    const s = servidor(250, { fallaEn: 100 })
    await expect(createSync({ zohoFetch: s.zohoFetch, db, config }).syncConversations('T2')).rejects.toThrow('Zoho /tickets/T2/conversations 500')
    expect(await cuenta('T2')).toBe(100)
  })
})

describe('syncConversations · reflejo de lo ausente (RQ-ZS-26)', () => {
  const cinco = ids(0, 5)
  async function preparar958() {
    await ticket('958', 958, { commentCount: 5, threadCount: 0 })
    for (const id of [...cinco, HILO]) await fila(id, '958')
  }
  it('#958 con marcarAusentes: marca el hilo y sólo el hilo, y no borra nada', async () => {
    await preparar958()
    await createSync({ zohoFetch: servidor(5).zohoFetch, db, config, conversaciones: { marcarAusentes: true } }).syncConversations('958')
    expect(await marcadas('958')).toEqual([HILO])
    expect(await cuenta('958')).toBe(6)
  })
  it('sin la opción conversaciones no marca nada', async () => {
    await preparar958()
    await createSync({ zohoFetch: servidor(5).zohoFetch, db, config }).syncConversations('958')
    expect(await marcadas('958')).toEqual([])
  })
  it('con marcarAusentes apagado no marca nada', async () => {
    await preparar958()
    await createSync({ zohoFetch: servidor(5).zohoFetch, db, config, conversaciones: { marcarAusentes: false } }).syncConversations('958')
    expect(await marcadas('958')).toEqual([])
  })
  it('un recuento de tickets.raw que no coincide no marca y lo dice en el log', async () => {
    await ticket('958', 958, { commentCount: 5, threadCount: 1 })
    for (const id of [...cinco, HILO]) await fila(id, '958')
    await createSync({ zohoFetch: servidor(5).zohoFetch, db, config, conversaciones: { marcarAusentes: true } }).syncConversations('958')
    expect(await marcadas('958')).toEqual([])
    expect(errores.mock.calls.map((c) => c.map(String).join(' ')).join('\n')).toContain('Zoho cuenta 6')
  })
  it('un ticket sin fila en tickets (sin recuento) no marca', async () => {
    for (const id of [...cinco, HILO]) await fila(id, '958')
    await createSync({ zohoFetch: servidor(5).zohoFetch, db, config, conversaciones: { marcarAusentes: true } }).syncConversations('958')
    expect(await marcadas('958')).toEqual([])
  })
  it('una lista con error (segunda página 500) no marca nada aunque las 100 recibidas igualen el recuento', async () => {
    await ticket('T1', 1, { commentCount: 100, threadCount: 0 })
    for (const id of [...ids(0, 100), 'extra']) await fila(id, 'T1')
    const s = servidor(250, { fallaEn: 100 })
    await expect(createSync({ zohoFetch: s.zohoFetch, db, config, conversaciones: { marcarAusentes: true } }).syncConversations('T1')).rejects.toThrow('500')
    expect(await marcadas('T1')).toEqual([])
  })
  it('una fila marcada que Zoho vuelve a devolver se desmarca, con marcarAusentes encendido y apagado', async () => {
    for (const marcarAusentes of [true, false]) {
      await db.query('DELETE FROM conversations')
      await fila('c0', 'T1'); await db.query("UPDATE conversations SET ausente_en_zoho_at = now() WHERE id = 'c0'")
      expect(await marcadas('T1')).toEqual(['c0'])
      await createSync({ zohoFetch: servidor(1).zohoFetch, db, config, conversaciones: { marcarAusentes } }).syncConversations('T1')
      expect(await marcadas('T1')).toEqual([])
    }
  })
  it('P1 · una fila de Zoho guardada por otra vía DURANTE la petición no se marca', async () => {
    await ticket('T1', 1, { commentCount: 2, threadCount: 0 })
    await fila('c0', 'T1'); await fila('c1', 'T1'); await fila('vieja', 'T1')
    const zohoFetch = vi.fn(async () => {
      await dormir(5)
      await db.query("INSERT INTO conversations (id, ticket_id, source) VALUES ('durante', 'T1', 'zoho')")
      await dormir(5)
      return json({ data: [conv('c0'), conv('c1')] })
    })
    await createSync({ zohoFetch, db, config, conversaciones: { marcarAusentes: true } }).syncConversations('T1')
    expect(await marcadas('T1')).toEqual(['vieja'])
  })
})
