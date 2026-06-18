# Reorg de esquemas — Fase 1: Zoho Desk → `desk.*` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Mover las tablas Zoho Desk a un esquema `desk.*` (en `desk-db` y `zoho-hub`) vía `search_path`, activado por un toggle de producción `DB_SCHEMA=desk`, sin reescribir las ~230 queries y sin romper la suite de tests.

**Architecture:** Toggle `config.dbSchema`: cuando `='desk'`, `createPool` añade `options: '-c search_path=desk,public'` y los entrypoints corren `reorgToDesk(pool)` (mueve las 10 tablas public→desk con `ALTER … SET SCHEMA`) **antes** de `migrate()`. `schema.sql` deja las tablas Desk "peladas" (→ desk en prod, public en tests) y califica app-native/lite como `public.`. Tests corren con `dbSchema='public'` (default) → todo en `public`, sin cambios funcionales.

**Tech Stack:** TS ESM, Vitest + pg-mem, `pg`. Spec: `docs/superpowers/specs/2026-06-18-reorg-esquemas-fase1-design.md`.

**Contexto verificado:**
- pg-mem **no** soporta `search_path` ni `ALTER … SET SCHEMA` → el move y la resolución son prod-only, validados operativamente. Los tests cubren la **lógica** (config, createPool, las sentencias generadas).
- App entrypoint `apps/desk/server/index.ts:28` = `await migrate(pool)`. Worker `apps/hub-sync/src/hub-sync.ts:37` = `await hubBootstrap(...)` (que internamente hace `migrate`).
- `config.test.ts` tiene un env base (línea ~5). `pool.test.ts` ya prueba `createPoolFromUrl`.
- 0 `public.` hardcodeado en queries; `setval/nextval('ticket_number_seq')` sin calificar.
- Tablas Desk (10): accounts, contacts, agents, tickets, conversations, attachments, ticket_transitions, ticket_history, activities, equipos. App-native (public): users, sessions, roles, ticket_reads, resolution_attachments. Lite (public, transitorio): clients, sales_orders.

---

## Task 1: Config `dbSchema` + `createPool` con search_path condicional (TDD)

**Files:**
- Modify: `packages/zoho-sync/src/config.ts`, `packages/zoho-sync/src/config.test.ts`
- Modify: `packages/zoho-sync/src/db/pool.ts`, `packages/zoho-sync/src/db/pool.test.ts`

- [ ] **Step 1: Test config** — en `config.test.ts`, añade dentro del `describe('loadConfig', …)`:
```ts
  it('dbSchema default public; desk con DB_SCHEMA=desk', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    expect(loadConfig(base as any).dbSchema).toBe('public')
    expect(loadConfig({ ...base, DB_SCHEMA: 'desk' } as any).dbSchema).toBe('desk')
  })
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/config.test.ts -t "dbSchema"` — FAIL.

- [ ] **Step 3: Implementar en `config.ts`** — añade a `AppConfig` (junto a otros campos):
```ts
  dbSchema: string
```
y en `loadConfig`:
```ts
    dbSchema: env.DB_SCHEMA || 'public',
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/config.test.ts` — PASS.

- [ ] **Step 5: Test pool** — en `packages/zoho-sync/src/db/pool.test.ts`, añade:
```ts
import { createPool } from './pool'
import type { AppConfig } from '../config'

describe('createPool search_path', () => {
  it('añade options search_path solo si dbSchema=desk', async () => {
    const desk = createPool({ databaseUrl: 'postgres://u:p@h:5432/db', dbSchema: 'desk' } as AppConfig)
    expect((desk as any).options.options).toBe('-c search_path=desk,public')
    await desk.end()
    const pub = createPool({ databaseUrl: 'postgres://u:p@h:5432/db', dbSchema: 'public' } as AppConfig)
    expect((pub as any).options.options).toBeUndefined()
    await pub.end()
  })
})
```

- [ ] **Step 6: Run** `npx vitest run packages/zoho-sync/src/db/pool.test.ts -t "search_path"` — FAIL.

- [ ] **Step 7: Implementar en `pool.ts`** — reemplaza `createPool`:
```ts
export function createPool(config: AppConfig): Pool {
  const opts = config.dbSchema === 'desk' ? { options: '-c search_path=desk,public' } : {}
  return new Pool({ connectionString: config.databaseUrl, ...opts })
}
```
(`createPoolFromUrl` queda igual.)

- [ ] **Step 8: Run** `npx vitest run packages/zoho-sync/src/db/pool.test.ts` — PASS.

- [ ] **Step 9:** `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit && npx eslint packages/zoho-sync/src/config.ts packages/zoho-sync/src/db/pool.ts` — sin errores.

- [ ] **Step 10: Commit**
```bash
git add packages/zoho-sync/src/config.ts packages/zoho-sync/src/config.test.ts packages/zoho-sync/src/db/pool.ts packages/zoho-sync/src/db/pool.test.ts
git commit -m "feat(reorg): config dbSchema + createPool search_path condicional"
```

---

## Task 2: `reorgToDesk` + `schema.sql` + cableado en entrypoints (TDD)

**Files:**
- Modify: `packages/zoho-sync/src/db/migrate.ts`, `packages/zoho-sync/src/db/migrate.test.ts`
- Modify: `packages/zoho-sync/src/db/schema.sql`
- Modify: `apps/desk/server/index.ts`, `apps/hub-sync/src/hub-sync.ts`

- [ ] **Step 1: Test de `reorgToDeskStatements`** (función pura → testeable sin que pg-mem ejecute SET SCHEMA) — en `migrate.test.ts`, añade:
```ts
import { reorgToDeskStatements } from './migrate'

describe('reorgToDeskStatements', () => {
  it('genera CREATE SCHEMA + SET SCHEMA de las 10 tablas Desk + la secuencia', () => {
    const sql = reorgToDeskStatements()
    expect(sql[0]).toBe('CREATE SCHEMA IF NOT EXISTS desk')
    for (const t of ['accounts','contacts','agents','tickets','conversations','attachments','ticket_transitions','ticket_history','activities','equipos']) {
      expect(sql).toContain(`ALTER TABLE IF EXISTS public.${t} SET SCHEMA desk`)
    }
    expect(sql).toContain('ALTER SEQUENCE IF EXISTS public.ticket_number_seq SET SCHEMA desk')
    // NO mueve app-native ni lite
    for (const t of ['users','sessions','roles','ticket_reads','resolution_attachments','clients','sales_orders']) {
      expect(sql.some((s) => s.includes(`public.${t} SET SCHEMA`))).toBe(false)
    }
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/db/migrate.test.ts -t "reorgToDeskStatements"` — FAIL.

- [ ] **Step 3: Implementar en `migrate.ts`** — añade (tras `reseedTicketNumber`):
```ts
/** Tablas del dominio Zoho Desk que se mueven a desk.* (Fase 1). App-native y Books-lite NO se mueven. */
const DESK_TABLES = ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments',
  'ticket_transitions', 'ticket_history', 'activities', 'equipos']

/** Sentencias del reorg public→desk (puras, para test). El ALTER SET SCHEMA mueve datos+índices+secuencias propias. */
export function reorgToDeskStatements(): string[] {
  return [
    'CREATE SCHEMA IF NOT EXISTS desk',
    ...DESK_TABLES.map((t) => `ALTER TABLE IF EXISTS public.${t} SET SCHEMA desk`),
    'ALTER SEQUENCE IF EXISTS public.ticket_number_seq SET SCHEMA desk',
  ]
}

/**
 * Mueve las tablas Zoho Desk de public→desk (idempotente, tolerante por sentencia). PROD-ONLY: se llama solo cuando
 * config.dbSchema==='desk'. pg-mem no soporta SET SCHEMA, por eso nunca se invoca en tests.
 */
export async function reorgToDesk(db: Queryable): Promise<void> {
  for (const stmt of reorgToDeskStatements()) {
    try { await db.query(stmt) }
    catch (e) { console.error('reorgToDesk: sentencia omitida:', stmt.slice(0, 50), '→', String(e)) }
  }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` — PASS (todo el archivo).

- [ ] **Step 5: Editar `schema.sql`** — calificar **solo** app-native + lite como `public.`; dejar las Desk peladas. Cambios exactos:
  - `CREATE TABLE IF NOT EXISTS users (` → `CREATE TABLE IF NOT EXISTS public.users (`
  - `CREATE TABLE IF NOT EXISTS sessions (` → `public.sessions`
  - `CREATE TABLE IF NOT EXISTS roles (` → `public.roles`
  - `CREATE TABLE IF NOT EXISTS ticket_reads (` → `public.ticket_reads`
  - `CREATE TABLE IF NOT EXISTS resolution_attachments (` → `public.resolution_attachments`
  - `CREATE TABLE IF NOT EXISTS clients (` → `public.clients`
  - `CREATE TABLE IF NOT EXISTS sales_orders (` → `public.sales_orders`
  - Sus índices asociados (si referencian esas tablas) → calificar `public.` también: `idx_sales_orders_client`, `idx_sales_orders_number` (sobre `public.sales_orders`), `idx_clients_name` (sobre `public.clients`).
  - **NO tocar** las 10 tablas Desk ni sus índices/ALTER (quedan pelados → desk en prod vía search_path, public en tests). **NO tocar** `CREATE SEQUENCE IF NOT EXISTS ticket_number_seq` (pelada).

- [ ] **Step 6: Run toda la suite** `npm test` — PASS. (Las tablas siguen creándose en `public` en pg-mem: las Desk peladas → public; las app-native/lite `public.` → public. Los repos con nombres pelados resuelven a public. **Cero regresiones.**) Si algo falla, revisar que ningún índice/ALTER de tabla Desk se haya calificado por error.

- [ ] **Step 7: Cablear entrypoint app** `apps/desk/server/index.ts` — importar y, **antes** de `await migrate(pool)` (línea 28):
```ts
import { migrate, reorgToDesk, reseedTicketNumber } from '@ambientalia/zoho-sync/db/migrate'
// …
  if (config.dbSchema === 'desk') await reorgToDesk(pool)
  await migrate(pool)
```
(Conserva los imports existentes; añade `reorgToDesk` a la lista.)

- [ ] **Step 8: Cablear entrypoint worker** `apps/hub-sync/src/hub-sync.ts` — importar `reorgToDesk` y, **antes** de `await hubBootstrap(...)` (línea 37):
```ts
import { createPool, createPoolFromUrl } from '@ambientalia/zoho-sync/db/pool'
import { reorgToDesk } from '@ambientalia/zoho-sync/db/migrate'
// … en main(), antes de hubBootstrap:
  if (config.dbSchema === 'desk') await reorgToDesk(pool)
  await hubBootstrap({ db: pool, sync, booksSync, booksHubSync })
```

- [ ] **Step 9:** `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint .` — sin errores. (Correr `npm install` antes si hace falta para los symlinks.)

- [ ] **Step 10: Commit**
```bash
git add packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/migrate.test.ts packages/zoho-sync/src/db/schema.sql apps/desk/server/index.ts apps/hub-sync/src/hub-sync.ts
git commit -m "feat(reorg): reorgToDesk + schema.sql califica app-native/lite + cableado entrypoints"
```

---

## Task 3: Verificación completa + runbook de despliegue (2 pasos) + cutover replicación

- [ ] **Step 1:** `npm install && npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)`
Expected: tests PASS (sin regresiones — todo sigue en `public` en pg-mem); ambos tsc exit 0; eslint 0 errores; build OK.

- [ ] **Step 2: Commit + push**
```bash
git add -A && git commit -m "chore(reorg): verificado Fase 1" || true
git push origin main
```
(Dispara rebuild de `ambientalia-desk` y `zoho-hub-sync`. **Aún SIN `DB_SCHEMA` → comportamiento idéntico al actual**: `createPool` sin search_path, `reorgToDesk` no se llama, todo sigue en `public`. Verifica que ambos servicios arrancan normales antes de activar el toggle.)

- [ ] **Step 3: Activar el toggle (manual, EasyPanel).** En **ambos** servicios `ambientalia-desk` y `zoho-hub-sync` → Environment → añadir `DB_SCHEMA=desk` → Guardar → **Redeploy**. Al arrancar, cada uno corre `reorgToDesk(pool)` (mueve las 10 tablas a `desk.*` en su BD) y `createPool` aplica `search_path=desk,public`.

- [ ] **Step 4: Cutover de replicación de `activities`** (manual, tras ambos redeploys). `reorgToDesk` ya movió `activities` a `desk` en hub y desk-db; ahora republicar. En **desk-db** (suscriptor) y **hub** (publisher) vía Postgres Client:
  - Hub: `ALTER PUBLICATION zoho_ref_pub DROP TABLE activities;` luego `ALTER PUBLICATION zoho_ref_pub ADD TABLE desk.activities;`
  - desk-db: `ALTER SUBSCRIPTION zoho_ref_sub REFRESH PUBLICATION;`
  - (Si la publicación no acepta el cambio limpio: `DROP PUBLICATION zoho_ref_pub;` + `CREATE PUBLICATION zoho_ref_pub FOR TABLE desk.activities, clients, sales_orders;` en hub, luego `REFRESH` en desk-db.)

- [ ] **Step 5: Validar (post-toggle).**
  - App `ambientalia-desk`: levanta sin errores; el tablero carga tickets (lee `desk.tickets` vía search_path).
  - En `desk` y `zoho-hub`: `SELECT count(*) FROM desk.tickets;` y `SELECT count(*) FROM desk.activities;` devuelven los conteos esperados; `\dt public.*` ya **no** lista las 10 Desk (sí users/sessions/roles/ticket_reads/resolution_attachments/clients/sales_orders).
  - Worker `zoho-hub-sync`: sincroniza sin errores; `activities` replica (compara conteo hub vs desk tras un ciclo).
  - Crear un ticket de prueba en la app → usa `desk.ticket_number_seq` (número en rango app) sin error.

- [ ] **Step 6: Rollback (si algo falla en prod).** Quitar `DB_SCHEMA` de ambos servicios + Redeploy **no** devuelve los datos solos; revertir manualmente en cada BD:
```sql
ALTER TABLE IF EXISTS desk.accounts SET SCHEMA public;  -- (repetir por las 10 tablas)
ALTER SEQUENCE IF EXISTS desk.ticket_number_seq SET SCHEMA public;
```
y revertir la replicación: hub `ALTER PUBLICATION zoho_ref_pub DROP TABLE desk.activities; ADD TABLE activities;` + desk-db `REFRESH`. Luego quitar la env + redeploy.

---

## Notas de cierre
- **Validación en prod, no pg-mem:** el move (`reorgToDesk` SQL) y el `search_path` no son testeables en pg-mem (no los soporta). Se validan con el Step 5 (queries de verificación), igual que SP2/Books.
- **Fuera de alcance:** Fase 2 (dedup Books-lite vía vistas), R2 (calificar queries — en `debt.md`), `crm.*`, esquema `app.*`.
