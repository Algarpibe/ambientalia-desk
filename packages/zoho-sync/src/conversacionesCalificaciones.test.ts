import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'
import { guardarYReflejar, instanteBase, crearPasadaConversaciones, esCalificacion, contadasPorZoho } from './conversaciones'

/**
 * calificaciones-cuadre-conversaciones (L1, RQ-ZS-26 y RQ-ZS-48): las calificaciones de satisfacción (canal `FEEDBACK`, S-2,
 * hipótesis hasta P-1) no cuentan en el cuadre, pero SÍ en el marcado. Un solo predicado, probado por tabla; el criterio, probado
 * con el mismo fixture en las tres vías que lo heredan (la del relleno, en `apps/desk/server/rellenoConversacionesCalificaciones.test.ts`).
 * (a) lista completa con calificación: se marca lo ausente. (b) falta una real y el tamaño cuadra gracias a la calificación: no se marca.
 * Fixtures sin datos de clientes reales.
 */
const config = { departmentId: 'DEP' } as AppConfig
const PASADO = '2026-01-01T00:00:00.000Z'
const MODIFICADO = '2026-10-29T10:00:00.000Z'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const conv = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public', ...extra })
const calif = (id: string) => conv(id, { channel: 'FEEDBACK' })
const servidor = (items: Record<string, unknown>[]) =>
  vi.fn(async () => (items.length ? json({ data: items }) : new Response(null, { status: 204 })))

let db: Queryable
let errores: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  errores = vi.spyOn(console, 'error').mockImplementation(() => {})
})
const ticket = (id: string, raw: Record<string, unknown>) =>
  db.query("INSERT INTO tickets (id, number, status, raw) VALUES ($1, $2, 'Ingresado', $3)", [id, Number(id.replace(/\D/g, '')) || 1, JSON.stringify(raw)])
const fila = (id: string, tk: string, raw: Record<string, unknown> | null = null) =>
  db.query('INSERT INTO conversations (id, ticket_id, source, created_at, raw) VALUES ($1, $2, $3, $4, $5)', [id, tk, 'zoho', PASADO, raw ? JSON.stringify(raw) : null])
const marcadas = async (tk: string) =>
  ((await db.query('SELECT id FROM conversations WHERE ticket_id=$1 AND ausente_en_zoho_at IS NOT NULL ORDER BY id', [tk])).rows as { id: string }[]).map((r) => r.id)
const log = () => errores.mock.calls.map((c) => c.map(String).join(' ')).join('\n')

describe('esCalificacion · el predicado único (RQ-ZS-48, D-1)', () => {
  it.each([
    ['objeto con FEEDBACK', { channel: 'FEEDBACK' }],
    ['jsonb como texto con FEEDBACK', JSON.stringify({ id: '1', channel: 'FEEDBACK' })],
  ])('%s es calificación', (_t, raw) => { expect(esCalificacion(raw)).toBe(true) })

  it.each([
    ['otro canal', { channel: 'EMAIL' }],
    ['sin canal', { id: '1' }],
    ['canal en minúsculas', { channel: 'feedback' }],
    ['canal con espacio', { channel: ' FEEDBACK' }],
    ['canal que no es texto', { channel: ['FEEDBACK'] }],
    ['nulo', null],
    ['undefined', undefined],
    ['texto que no es JSON', 'FEEDBACK'],
    ['texto que es JSON de una cadena', '"FEEDBACK"'],
    ['número', 7],
  ])('%s NO es calificación', (_t, raw) => { expect(esCalificacion(raw)).toBe(false) })

  it('contadasPorZoho cuenta ids únicos y deja fuera las calificaciones', () => {
    expect(contadasPorZoho([conv('a'), conv('a'), conv('b'), calif('c'), calif('c')])).toBe(2)
    expect(contadasPorZoho([])).toBe(0)
    expect(contadasPorZoho([calif('a')])).toBe(0)
  })
})

describe('guardarYReflejar directo (RQ-ZS-26, RQ-ZS-48)', () => {
  const lista = (items: Record<string, unknown>[]) => ({ items, error: null, por429: false })
  async function guardadas() {
    await ticket('T1', { commentCount: 2, threadCount: 0 })
    await fila('r1', 'T1'); await fila('r2', 'T1'); await fila('cal', 'T1', { channel: 'FEEDBACK' })
  }

  it('una calificación recibida nunca se marca, aunque la lista sea completa', async () => {
    await guardadas(); await fila('vieja', 'T1')
    const r = await guardarYReflejar(db, 'T1', lista([conv('r1'), conv('r2'), calif('cal')]), { esperado: 2, marcar: true, inicio: await instanteBase(db) })
    expect(r).toEqual({ marcadas: ['vieja'], completa: true })
    expect(await marcadas('T1')).toEqual(['vieja'])
  })

  it('una calificación guardada que la lista completa ya no trae se marca, y al reaparecer se desmarca', async () => {
    await guardadas()
    const primera = await guardarYReflejar(db, 'T1', lista([conv('r1'), conv('r2')]), { esperado: 2, marcar: true, inicio: await instanteBase(db) })
    expect(primera).toEqual({ marcadas: ['cal'], completa: true })
    expect(await marcadas('T1')).toEqual(['cal'])
    const segunda = await guardarYReflejar(db, 'T1', lista([conv('r1'), conv('r2'), calif('cal')]), { esperado: 2, marcar: true, inicio: await instanteBase(db) })
    expect(segunda).toEqual({ marcadas: [], completa: true })
    expect(await marcadas('T1')).toEqual([])
  })

  it('con marcar apagado, (a) informa completa: true y no marca ni registra nada', async () => {
    await guardadas(); await fila('vieja', 'T1')
    const r = await guardarYReflejar(db, 'T1', lista([conv('r1'), conv('r2'), calif('cal')]), { esperado: 2, marcar: false, inicio: await instanteBase(db) })
    expect(r).toEqual({ marcadas: [], completa: true })
    expect(await marcadas('T1')).toEqual([])
    expect(errores).not.toHaveBeenCalled()
  })

  it('con marcar apagado, (b) informa completa: false', async () => {
    await ticket('T1', { commentCount: 2, threadCount: 1 })
    const r = await guardarYReflejar(db, 'T1', lista([conv('r1'), conv('r2'), calif('cal')]), { esperado: 3, marcar: false, inicio: await instanteBase(db) })
    expect(r).toEqual({ marcadas: [], completa: false })
  })
})

type Via = (zohoFetch: ReturnType<typeof servidor>, recuentos: { commentCount: number; threadCount: number }) => Promise<void>
const vias: Record<string, Via> = {
  'la pasada periódica (crearPasadaConversaciones)': async (zohoFetch, r) => {
    await crearPasadaConversaciones({ zohoFetch, db, marcar: true, pausaMs: 0, pausa429Ms: 0 })([{ id: 'T1', modifiedTime: MODIFICADO, ...r }])
  },
  'syncConversations de createSync': async (zohoFetch) => {
    await createSync({ zohoFetch, db, config, conversaciones: { marcarAusentes: true } }).syncConversations('T1')
  },
}

describe.each(Object.entries(vias))('el criterio en %s (RQ-ZS-26, RQ-ZS-48)', (_nombre, via) => {
  it('(a) calificación recibida y lista completa: se marca la cuarta y nunca la calificación', async () => {
    const recuentos = { commentCount: 2, threadCount: 0 }
    await ticket('T1', recuentos)
    for (const id of ['r1', 'r2', 'vieja']) await fila(id, 'T1')
    await fila('cal', 'T1', { channel: 'FEEDBACK' })
    await via(servidor([conv('r1'), conv('r2'), calif('cal')]), recuentos)
    expect(await marcadas('T1')).toEqual(['vieja'])
  })

  it('(b) falta una real y el tamaño cuadra por la calificación: no se marca nada y el log dice 2 recibidos y 3 contados', async () => {
    const recuentos = { commentCount: 2, threadCount: 1 }
    await ticket('T1', recuentos)
    for (const id of ['r1', 'r2', 'falta']) await fila(id, 'T1')
    await fila('cal', 'T1', { channel: 'FEEDBACK' })
    await via(servidor([conv('r1'), conv('r2'), calif('cal')]), recuentos)
    expect(await marcadas('T1')).toEqual([])
    expect(log()).toContain('recibidos 2')
    expect(log()).toContain('Zoho cuenta 3')
  })
})
