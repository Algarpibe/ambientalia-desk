import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'

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
