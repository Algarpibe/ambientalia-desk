import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { Pool } from 'pg'
import { reorgToDesk, migrate } from './migrate'

const url = process.env.TEST_DATABASE_URL
const d = url ? describe : describe.skip

d('integración path desk/search_path (Postgres real)', () => {
  let pool: Pool
  const DESK = ['accounts','contacts','agents','tickets','conversations','attachments','ticket_transitions','ticket_history','activities','equipos']
  beforeEach(async () => {
    pool = new Pool({ connectionString: url, options: '-c search_path=desk,public' })
    await pool.query('DROP SCHEMA IF EXISTS desk CASCADE')
    for (const t of DESK) await pool.query(`DROP TABLE IF EXISTS public.${t} CASCADE`)
    await pool.query('CREATE SCHEMA IF NOT EXISTS books') // schema.sql referencia books.* (calificado)
  })
  afterAll(async () => { await pool?.end() })

  it('reorgToDesk mueve tablas public→desk preservando datos y resolviendo por search_path', async () => {
    await pool.query('CREATE TABLE public.tickets (id text primary key, number integer)')
    await pool.query("INSERT INTO public.tickets (id, number) VALUES ('t1', 5)")
    await reorgToDesk(pool)
    const inDesk = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_schema='desk' AND table_name='tickets'")
    expect(inDesk.rowCount).toBe(1)
    const inPublic = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tickets'")
    expect(inPublic.rowCount).toBe(0)
    // unqualified → resuelto vía search_path=desk,public
    const r = await pool.query("SELECT number FROM tickets WHERE id='t1'")
    expect(r.rows[0].number).toBe(5)
  })

  it('con search_path=desk,public, migrate crea las tablas Desk en el esquema desk', async () => {
    await reorgToDesk(pool) // crea schema desk (las tablas aún no existen → ALTER no-op tolerante)
    await migrate(pool)
    const r = await pool.query("SELECT table_schema FROM information_schema.tables WHERE table_name='tickets'")
    expect(r.rows.map((x: { table_schema: string }) => x.table_schema)).toContain('desk')
    // CRUD básico unqualified resuelve a desk.tickets
    await pool.query("INSERT INTO tickets (id, number, status) VALUES ('t2', 1000001, 'OV asignada') ON CONFLICT (id) DO NOTHING")
    const got = await pool.query("SELECT status FROM tickets WHERE id='t2'")
    expect(got.rows[0]?.status).toBe('OV asignada')
  })
})
