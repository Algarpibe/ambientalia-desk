import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { createCrmSync } from './sync'
import { byTable } from './modules'
import type { AppConfig } from '../config'

const config = {} as AppConfig
const GANADO = 'Cerrado ganado'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateCrm(db) })

/** Un trato del hub con su fase, su `modified_time` y, si se da, la marca de la última ficha leída. */
const trato = (id: string, stage: string, modificado: string | null, leido: string | null = null) =>
  db.query(
    'INSERT INTO crm.deals (id, deal_name, stage, modified_time, stage_detail_synced_at) VALUES ($1,$2,$3,$4,$5)',
    [id, `Trato ${id}`, stage, modificado ? new Date(modificado) : null, leido ? new Date(leido) : null],
  )

const fila = async (id: string): Promise<{ stage_modified_time: Date | null; stage_detail_synced_at: Date | null }> =>
  (await db.query('SELECT stage_modified_time, stage_detail_synced_at FROM crm.deals WHERE id = $1', [id])).rows[0]

describe('esquema · stage_detail_synced_at', () => {
  it('crm.deals tiene la columna y nace nula', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    expect((await fila('d1')).stage_detail_synced_at).toBeNull()
  })
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('listado de tratos · stage_modified_time', () => {
  it('el módulo Deals ya no pide Stage_Modified_Time ni lo mapea', () => {
    const m = byTable('deals')
    expect(m.fields.split(',')).not.toContain('Stage_Modified_Time')
    expect(m.toRow({ id: 'd1', Stage_Modified_Time: '2026-08-31T14:33:09-05:00', Modified_Time: '2026-08-31T19:40:00Z' }))
      .not.toHaveProperty('stage_modified_time')
  })

  /**
   * `upsertRow` actualiza con EXCLUDED todas las columnas del `row`. Si `stage_modified_time` siguiera
   * en él, cada pasada del listado escribiría el nulo que da Zoho y borraría la hora de la ficha.
   */
  it('sincronizar un trato por el listado conserva su stage_modified_time y su marca', async () => {
    await trato('d1', GANADO, '2026-08-31T19:40:00Z', '2026-08-31T19:40:00Z')
    await db.query('UPDATE crm.deals SET stage_modified_time = $1 WHERE id = $2', [new Date('2026-08-31T19:33:09Z'), 'd1'])
    const crmFetch = vi.fn().mockImplementation(async (path: string) =>
      path.startsWith('/Deals?')
        // Así responde el listado de Zoho: Stage_Modified_Time siempre nulo.
        ? json({ data: [{ id: 'd1', Deal_Name: 'Trato d1', Stage: GANADO, Stage_Modified_Time: null, Modified_Time: '2026-09-01T15:00:00Z' }], info: { more_records: false } })
        : json({ data: [], info: { more_records: false } }))
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncRecent()

    expect(r.deals).toBe(1)
    const f = await fila('d1')
    expect(f.stage_modified_time?.toISOString()).toBe('2026-08-31T19:33:09.000Z')
    expect(f.stage_detail_synced_at?.toISOString()).toBe('2026-08-31T19:40:00.000Z')
  })
})
