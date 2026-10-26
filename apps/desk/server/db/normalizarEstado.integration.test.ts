import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Pool } from 'pg'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { reorgToDesk, migrate } from '@ambientalia/zoho-sync/db/migrate'
import { normalizarEstado, sqlEstadoNormalizado } from '@ambientalia/shared'
import { ticketsEnEspera } from './esperasVencidas'

/**
 * normalizar-estados-zoho (F1F-01), `zoho-sync` RQ-ZS-24 · la forma SQL de la regla contra PostgreSQL REAL (`design.md` «pg-mem»).
 *
 * Por qué existe: en local, `apps/desk/server/testing/pgMemEstado.ts` imita `btrim` y `regexp_replace`; esta prueba cierra el riesgo de
 * que pg-mem acepte una forma de la consulta (el alias `AS status`, la función dentro de `IN`) que PostgreSQL rechace, y fija que la
 * imitación y el servidor real dan lo mismo que `normalizarEstado` sobre las muestras de la spec.
 *
 * Aislamiento: crea SU base en el servidor de `TEST_DATABASE_URL` y la borra al terminar (molde de
 * `apps/desk/server/db/migracionConcurrente.integration.test.ts`). Se salta sin la variable.
 */
const url = process.env.TEST_DATABASE_URL
const d = url ? describe : describe.skip

const NBSP = '\u00a0'
const MUESTRAS = [
  'Notificación  Comercial', 'Notificación   Comercial', ' En Proceso', 'En Proceso ', '  En   Proceso  ',
  'Notificación Comercial', 'notificación comercial', 'Notificacion Comercial', 'Rev./Diagnostico',
  `Notificación\tComercial`, `Notificación${NBSP}Comercial`, `${NBSP}En Proceso`, '', '   ',
]

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

d('la forma SQL de la regla de estados en PostgreSQL real (RQ-ZS-24)', () => {
  let admin: Pool
  let pool: Pool
  const base = `estado_it_${process.pid}_${Date.now()}`
  const bd = () => pool as unknown as Queryable

  beforeAll(async () => {
    admin = new Pool({ connectionString: url })
    await admin.query(`CREATE DATABASE ${base}`)
    const propia = new URL(url!)
    propia.pathname = `/${base}`
    pool = new Pool({ connectionString: propia.toString(), options: '-c search_path=desk,public' })
    await pool.query('CREATE SCHEMA IF NOT EXISTS books') // schema.sql referencia books.* (calificado)
    await reorgToDesk(pool)
    await migrate(pool)
  }, 120_000)

  afterAll(async () => {
    await pool?.end()
    if (admin) {
      // pg-pool resuelve `end()` antes de que cierren sus sockets: se espera a que el servidor no vea sesiones antes del DROP forzado.
      const fin = Date.now() + 10_000
      while (Date.now() < fin && Number((await admin.query('SELECT count(*) AS n FROM pg_stat_activity WHERE datname = $1', [base])).rows[0].n) > 0) await dormir(50)
      await admin.query(`DROP DATABASE IF EXISTS ${base} WITH (FORCE)`)
    }
    await admin?.end()
  }, 60_000)

  beforeEach(async () => {
    await pool.query('DELETE FROM ticket_transitions')
    await pool.query('DELETE FROM tickets')
  })

  it.each(MUESTRAS.map((m) => [JSON.stringify(m), m] as const))('(a) SELECT de la forma SQL sobre la muestra %s da lo de normalizarEstado', async (_nombre, muestra) => {
    const r = await pool.query(`SELECT ${sqlEstadoNormalizado('v')} AS r FROM (VALUES ($1::text)) AS m(v)`, [muestra])
    expect(r.rows).toEqual([{ r: normalizarEstado(muestra) }])
  })

  it('(b) ticketsEnEspera con el par de gemelos: los dos, mismo estado y mismo desde, y la columna sigue cruda', async () => {
    const creado = '2026-10-02T15:00:00Z'
    const entrada = new Date('2026-10-05T15:00:00Z')
    for (const [id, number, status] of [['dos', 1004, 'Solicitado '], ['uno', 1005, 'Solicitado']] as const) {
      await pool.query("INSERT INTO tickets (id, number, subject, status, status_type, created_time) VALUES ($1,$2,'S',$3,'On Hold',$4)", [id, number, status, creado])
      await pool.query('INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)', [id, 'x', 'En Proceso', 'Solicitado', entrada])
    }
    const esperas = (await ticketsEnEspera(bd())).sort((a, b) => a.id.localeCompare(b.id))
    expect(esperas).toEqual([
      { id: 'dos', number: 1004, estado: 'Solicitado', desde: entrada, derivadoA: null },
      { id: 'uno', number: 1005, estado: 'Solicitado', desde: entrada, derivadoA: null },
    ])
    expect((await pool.query("SELECT status FROM tickets WHERE id = 'dos'")).rows).toEqual([{ status: 'Solicitado ' }])
  })
})
