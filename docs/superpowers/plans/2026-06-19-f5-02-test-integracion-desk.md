# F5-02 test de integración del path `desk`/`search_path` — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development. Directo en `main`. Spec embebido (auditoría F5-02).

**Goal:** Test de integración contra **Postgres real** que cubre el path de prod no testeado (pg-mem no soporta `search_path`/`SET SCHEMA`): `reorgToDesk` (CREATE SCHEMA desk + ALTER ... SET SCHEMA) + resolución de tablas Desk vía `search_path=desk,public`. **Env-gated** (`TEST_DATABASE_URL`): se salta en local sin Docker; corre en CI con un servicio Postgres.

**Contexto:**
- `createPool` (db/pool.ts): con `dbSchema='desk'` → `new Pool({..., options: '-c search_path=desk,public' })`.
- `reorgToDesk(db)` (db/migrate.ts): `CREATE SCHEMA IF NOT EXISTS desk` + `ALTER TABLE IF EXISTS public.<t> SET SCHEMA desk` para las 10 tablas Desk + `ALTER SEQUENCE ... ticket_number_seq SET SCHEMA desk`. Tolerante por sentencia.
- `migrate(db)`: corre schema.sql (tablas Desk SIN calificar → caen en el 1er schema del search_path; app-native calificadas `public.`). Tolerante por sentencia.
- DESK_TABLES = accounts, contacts, agents, tickets, conversations, attachments, ticket_transitions, ticket_history, activities, equipos.

---

## Task 1: Test de integración (env-gated)

**Files:** Create `packages/zoho-sync/src/db/migrate.integration.test.ts`.

- [ ] **Step 1:** Crear el test, gated por `TEST_DATABASE_URL` (si no está → `describe.skip`):
```ts
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
```
- [ ] **Step 2:** Verificar en LOCAL (sin `TEST_DATABASE_URL`): `npm test` → el `describe` se **salta** (sigue 261 verde, los nuevos como skipped). `npm run typecheck` exit 0; `npm run lint` 0 errores.
- [ ] **Step 3:** (Si hay Docker local, opcional) probar de verdad: levantar `docker run --rm -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=testdb -p 5432:5432 postgres:17`, `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/testdb npx vitest run packages/zoho-sync/src/db/migrate.integration.test.ts` → 2 verdes. (Si no hay Docker, se valida en CI.)
- [ ] **Step 4: Commit:** `git add packages/zoho-sync/src/db/migrate.integration.test.ts && git commit -m "test(desk): integración path desk/search_path contra Postgres real (F5-02, env-gated)"` (trailer).

---

## Task 2: Servicio Postgres en el CI

**Files:** Modify `.github/workflows/ci.yml`.

- [ ] **Step 1:** Añadir al job `verify` un servicio Postgres y pasar `TEST_DATABASE_URL` al paso de tests:
```yaml
jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
        env:
          TEST_DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
      - run: npm run build
```
(Conservar el resto del workflow tal cual; solo añadir `services:` y el `env:` del paso `npm test`.)
- [ ] **Step 2: Commit + push:** `git add .github/workflows/ci.yml && git commit -m "ci: servicio Postgres + TEST_DATABASE_URL para el test de integración (F5-02)" && git push origin main`.
- [ ] **Step 3: Validar:** en la pestaña Actions, la corrida de CI debe ejecutar el test de integración (2 casos) en verde contra el Postgres del servicio (ya no skipped).

## Notas
- El test limpia (`DROP SCHEMA desk CASCADE` + drop public desk-tables) al inicio de cada caso → idempotente/re-ejecutable contra un Postgres throwaway.
- `migrate` es tolerante por sentencia → si alguna parte de schema.sql falla en el Postgres limpio (p.ej. una vista sobre books vacío), no rompe; lo que importa es que `desk.tickets` se crea.
- Si en CI el test fallara por una dependencia de schema.sql (orden de schemas), ajustar el `beforeEach` (crear los schemas que falten) — no relajar las aserciones del reorg.
