import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { loadConfig } from '@ambientalia/zoho-sync/config'
import { createSync } from '@ambientalia/zoho-sync/sync'

/**
 * sync-conversaciones-zoho (1G-01, RQ-ZS-27, S-1b) · CARACTERIZACIÓN, nace en verde: el worker `hub-sync` construye
 * `createSync` SIN la opción `conversaciones`, así que no pide conversaciones aunque sus dos variables valgan `'true'`
 * en su entorno. Dos pruebas, las dos necesarias: la de comportamiento ejecuta el cableado de `hub-sync.ts:21`, y la
 * estática lee el FICHERO VIGILADO, porque `hub-sync.ts` arranca `main()` al importarse y no se puede ejercitar (regla de
 * mutación 2). Se comprueban ensuciando `sync.ts` y `hub-sync.ts`, no con mutaciones en memoria.
 */
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const entorno = {
  ZOHO_CLIENT_ID: 'cid', ZOHO_CLIENT_SECRET: 'sec', ZOHO_REFRESH_TOKEN: 'ref', ZOHO_ORG_ID: '713448415',
  ZOHO_DEPARTMENT_ID: '495552000000006907', DATABASE_URL: 'postgres://u:p@localhost:5432/desk',
  SYNC_CONVERSACIONES_PERIODICA: 'true', MARCAR_CONVERSACIONES_AUSENTES: 'true',
}

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('hub-sync · sin la opción conversaciones', () => {
  it('con las dos variables en true, syncRecent lee los tickets modificados y no pide ninguna conversación', async () => {
    await db.query("INSERT INTO tickets (id, number, status, modified_time) VALUES ('Z1', 1, 'Ingresado', '2026-10-02T10:00:00.000Z')")
    const peticiones: string[] = []
    const zohoFetch = vi.fn(async (path: string) => {
      peticiones.push(path)
      if (path.startsWith('/tickets/search?')) return json({ data: [{ id: '101', modifiedTime: '2026-10-03T10:00:00.000Z' }] })
      if (path.startsWith('/tickets/101?')) return json({ id: '101', ticketNumber: '101', subject: 's', status: 'Ingresado', statusType: 'Open', customFields: {}, modifiedTime: '2026-10-03T10:00:00.000Z', commentCount: 1, threadCount: 0 })
      return new Response(null, { status: 404 })
    })
    const config = loadConfig(entorno)
    expect([config.syncConversacionesPeriodica, config.marcarConversacionesAusentes]).toEqual([true, true])
    expect(await createSync({ zohoFetch, db, config }).syncRecent()).toBe(1)
    expect(peticiones.some((p) => p.startsWith('/tickets/101?'))).toBe(true)
    expect(peticiones.filter((p) => p.includes('/conversations'))).toHaveLength(0)
  })

  it('hub-sync.ts no pasa `conversaciones` a createSync (fichero vigilado)', () => {
    const real = readFileSync(fileURLToPath(new URL('./hub-sync.ts', import.meta.url)), 'utf8')
    const llamada = real.split(/\r?\n/).find((l) => l.includes('createSync({'))
    expect(llamada).toBeDefined()
    expect(llamada).not.toContain('conversaciones')
  })
})
