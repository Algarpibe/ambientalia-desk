import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createSync } from '@ambientalia/zoho-sync/sync'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { crearRellenoConversaciones } from './rellenoConversaciones'

/**
 * calificaciones-cuadre-conversaciones (L1, RQ-ZS-26, RQ-ZS-28 y RQ-ZS-48), la tercera vía: el relleno. pg-mem + `createSync` REAL con una
 * `zohoFetch` falsa que sirve objetos con `channel` (molde `apps/desk/server/rellenoConversaciones.test.ts:39-68`). La verificación cuenta
 * lo guardado y visible SIN calificaciones, con el predicado único de `conversaciones.ts` (CA-4). Fixtures sin datos de clientes reales.
 */
const config = { departmentId: 'DEP' } as AppConfig
const PASADO = '2026-01-01T00:00:00.000Z'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const conv = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public', ...extra })
const calif = (id: string) => conv(id, { channel: 'FEEDBACK' })

function servidor(commentCount: string, threadCount: string, items: Record<string, unknown>[]) {
  return vi.fn(async (path: string) => {
    if (/^\/tickets\/Z1\?/.test(path)) return json({ id: 'Z1', ticketNumber: '1', subject: 'Asunto', status: 'Ingresado', commentCount, threadCount })
    if (/^\/tickets\/Z1\/conversations\?/.test(path)) return items.length ? json({ data: items }) : new Response(null, { status: 204 })
    if (path.startsWith('/contacts/') || path.startsWith('/accounts/')) return json({}, 404)
    throw new Error('petición inesperada ' + path)
  })
}

let db: Queryable
let errores: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  errores = vi.spyOn(console, 'error').mockImplementation(() => {})
})
const fila = (id: string, raw: Record<string, unknown> | null = null) =>
  db.query("INSERT INTO conversations (id, ticket_id, source, created_at, raw) VALUES ($1, 'Z1', 'zoho', $2, $3)", [id, PASADO, raw ? JSON.stringify(raw) : null])
const marcadas = async () =>
  ((await db.query("SELECT id FROM conversations WHERE ticket_id='Z1' AND ausente_en_zoho_at IS NOT NULL ORDER BY id")).rows as { id: string }[]).map((r) => r.id)

async function preparar(zohoFetch: ReturnType<typeof servidor>, marcar: boolean) {
  await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ('Z1', 1, 'Viejo', 'Ingresado')")
  return { zohoFetch, marcar }
}
async function pasada({ zohoFetch, marcar }: { zohoFetch: ReturnType<typeof servidor>; marcar: boolean }) {
  const sync = createSync({ zohoFetch, db, config })
  const r = crearRellenoConversaciones({ zohoFetch, db, sync, marcar, pausaMs: 0, pausa429Ms: 0, registrar: vi.fn() })
  r.lanzar()
  await vi.waitFor(() => expect(r.estado().terminado).toBe(true), { timeout: 5000 })
  return r.estado()
}

describe('el relleno con calificaciones (RQ-ZS-26, RQ-ZS-28, RQ-ZS-48)', () => {
  it('(a) lista completa con calificación y marcado encendido: se marca la cuarta, no la calificación, y el ticket sale «completo»', async () => {
    const montado = await preparar(servidor('2', '0', [conv('r1'), conv('r2'), calif('cal')]), true)
    for (const id of ['r1', 'r2', 'vieja']) await fila(id)
    await fila('cal', { channel: 'FEEDBACK' })
    const e = await pasada(montado)
    expect(await marcadas()).toEqual(['vieja'])
    expect(e.cuentas).toMatchObject({ completo: 1, descuadrado: 0 })
    expect(e.descuadrados).toEqual([])
  })

  it('(b) falta una real y el tamaño cuadra por la calificación: no se marca nada, queda en el log y el ticket sale «completo» (la real sigue visible)', async () => {
    const montado = await preparar(servidor('2', '1', [conv('r1'), conv('r2'), calif('cal')]), true)
    for (const id of ['r1', 'r2', 'falta']) await fila(id)
    await fila('cal', { channel: 'FEEDBACK' })
    const e = await pasada(montado)
    expect(await marcadas()).toEqual([])
    const lineas = errores.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
    expect(lineas).toContain('recibidos 2')
    expect(lineas).toContain('Zoho cuenta 3')
    expect(e.cuentas).toMatchObject({ completo: 1, descuadrado: 0 })
  })

  it('CA-4: con una calificación visible y recuentos que suman las demás, la verificación da «completo» y no «descuadrado» (incluso sin marcar)', async () => {
    const montado = await preparar(servidor('2', '0', [conv('r1'), conv('r2'), calif('cal')]), false)
    const e = await pasada(montado)
    expect(e.cuentas).toMatchObject({ completo: 1, descuadrado: 0 })
    expect(e.descuadrados).toEqual([])
  })
})
