// F1B-12 — lector de cierres de empresa: RQ-CL-06. Sin ruta HTTP (D6): el alta es directa en la base,
// a cargo de Alfonso (proposal, pregunta 1). Molde de `avisos.test.ts:1-9`.
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { listarCierres } from './calendarioCierres'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('listarCierres', () => {
  it('devuelve los cierres dados de alta directamente en la base, ordenados por fecha', async () => {
    await db.query(
      "INSERT INTO calendario_cierres (fecha, motivo, registrado_por) VALUES ('2027-01-02', 'Cierre fin de año', 'Alfonso')",
    )
    await db.query(
      "INSERT INTO calendario_cierres (fecha, motivo, registrado_por) VALUES ('2026-12-31', 'Cierre fin de año', 'Alfonso')",
    )

    expect(await listarCierres(db)).toEqual(['2026-12-31', '2027-01-02'])
  })

  it('sin cierres registrados, devuelve la lista vacía', async () => {
    expect(await listarCierres(db)).toEqual([])
  })
})
