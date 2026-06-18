# Reorg de esquemas — Fase 2: dedup Books-lite (vistas) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Eliminar las tablas lite `public.clients`/`public.sales_orders` reemplazándolas por **vistas** sobre `books.*` (fuente única de Books), y apagar el sync lite `createBooksSync`.

**Architecture:** `schema.sql` base pasa a definir `books.contacts`/`books.sales_orders` (estructura, para desk-db) + las vistas `clients`/`sales_orders` sobre ellas. Los lectores (`searchClients`/`getClient`/`searchSalesOrders`/`getSalesOrder`) no cambian (leen las vistas). Se borra el motor lite (`books/sync.ts`, `books/mappers.ts`, `upsertClient`/`upsertSalesOrder`/`maxLastModified`) y su cableado. Cutover de replicación: swap de `clients`/`sales_orders` → `books.contacts`/`books.sales_orders` + tabla→vista.

**Tech Stack:** TS ESM, Vitest + pg-mem (soporta CREATE VIEW + `raw->>` + DROP TABLE, verificado), `pg`. Spec: `docs/superpowers/specs/2026-06-18-reorg-esquemas-fase2-design.md`.

**Contexto verificado (puntos de cableado):**
- `apps/desk/server/index.ts`: imports líneas 14-15 (`createBooksClient`, `createBooksSync`) + bloque 103-116 (booksSync lite: backfill + timer). El bloque está gateado por `config.syncBooks && booksRefreshToken && booksOrgId` (en prod la Desk app no tiene token Books → ya está apagado).
- `apps/hub-sync/src/hub-sync.ts`: línea 11 import (`createBooksSync, BooksSync`), 21 (`let booksSync`), 24 (`booksSync = createBooksSync(...)`), 39-40 (pasa `booksSync` a `hubBootstrap`/`scheduleHubSync`). **`createBooksClient` se queda** (lo usa `booksHubSync`).
- `apps/hub-sync/src/hubSync.ts`: línea 3 (`import maxLastModified`), 7 (`type BooksSync`), 11-12/41-42 (`booksSync` en firmas), 23-26 (backfill-si-vacío lite via `maxLastModified(db,'clients')`), 52-54 (timer `booksSync`). **`booksHubSync` se queda.**
- `packages/zoho-sync/src/books/repo.ts` exporta: `upsertClient`, `upsertSalesOrder` (BORRAR), `searchClients`, `getClient`, `searchSalesOrders`, `getSalesOrder` (CONSERVAR), `maxLastModified` (BORRAR — las vistas no tienen `last_modified_time`; solo lo usaba el sync lite).
- `books/sync.ts`, `books/mappers.ts` (+ sus `.test.ts`): solo los usa el motor lite → **borrar**. `books/booksClient.ts` **se queda** (lo usa `booksHub`).
- `schema.sql`: `public.clients` (114), `public.sales_orders` (133), índices (153-155). `schema-books.sql` (booksHub) define hoy las 6 tablas books.*.

---

## Task 1: Eliminar el motor lite (sync + mappers + upserts + cableado)

**Files:**
- Delete: `packages/zoho-sync/src/books/sync.ts`, `packages/zoho-sync/src/books/sync.test.ts`, `packages/zoho-sync/src/books/mappers.ts`, `packages/zoho-sync/src/books/mappers.test.ts`
- Modify: `packages/zoho-sync/src/books/repo.ts`, `packages/zoho-sync/src/books/repo.test.ts`, `apps/desk/server/index.ts`, `apps/hub-sync/src/hub-sync.ts`, `apps/hub-sync/src/hubSync.ts`, `apps/hub-sync/src/hubSync.test.ts`

- [ ] **Step 1: Verificar que mappers/sync lite no se usan fuera del motor lite.** Run:
```bash
cd c:/dev/Desk_2_R1.023 && git grep -n "books/sync\|books/mappers\|clientFromBooks\|salesOrderFromBooks\|upsertClient\|upsertSalesOrder\|from './sync'\|from './mappers'" -- 'apps/**' 'packages/**' | grep -v "booksHub"
```
Expected: solo referencias dentro de `books/` (repo.test, sync, mappers) + el cableado en index.ts/hub-sync.ts. Si aparece un uso inesperado, reportar antes de borrar.

- [ ] **Step 2: Borrar los 4 archivos del motor lite:**
```bash
git rm packages/zoho-sync/src/books/sync.ts packages/zoho-sync/src/books/sync.test.ts packages/zoho-sync/src/books/mappers.ts packages/zoho-sync/src/books/mappers.test.ts
```

- [ ] **Step 3: `books/repo.ts`** — borrar `upsertClient`, `upsertSalesOrder`, `maxLastModified`, el helper `J` (si solo lo usaban esos) y el import de `ClientRow`/`SalesOrderRow` (de `./mappers`, ya borrado). Conservar `searchClients`, `getClient`, `searchSalesOrders`, `getSalesOrder`, `clientToLite`, `salesOrderToLite` y el import de `ClientLite`/`SalesOrderLite` desde `@ambientalia/shared`. El archivo debe quedar **solo con lectores**.

- [ ] **Step 4: Reescribir `books/repo.test.ts`** — quitar imports de `./mappers`/`upsert*`/`maxLastModified`; insertar datos vía SQL crudo en las tablas lite (que aún existen tras esta tarea) y verificar los lectores. Contenido completo:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { searchClients, getClient, searchSalesOrders, getSalesOrder } from './repo'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('books repo (lectores)', () => {
  it('searchClients / getClient por nombre y NIT', async () => {
    await db.query("INSERT INTO clients (id,name,company_name,nit,email) VALUES ('c1','Camposol Colombia S.A.S.','Camposol','901116362','a@b.co')")
    await db.query("INSERT INTO clients (id,name,nit) VALUES ('c2','Bancolombia S.A.','890903938')")
    expect((await searchClients(db, 'campo')).map((c) => c.id)).toEqual(['c1'])
    expect((await searchClients(db, '8909')).map((c) => c.id)).toEqual(['c2'])
    expect((await getClient(db, 'c1'))!.nit).toBe('901116362')
  })

  it('searchSalesOrders / getSalesOrder por número y cliente', async () => {
    await db.query("INSERT INTO sales_orders (id,number,client_id,customer_name,date,total,status,ticket_number) VALUES ('s1','OV-2026-117','cliA','Corola',' 2026-06-01',200,'invoiced','954')")
    expect((await searchSalesOrders(db, 'OV-2026-117')).length).toBe(1)
    expect((await getSalesOrder(db, 's1'))!.status).toBe('invoiced')
    expect((await getSalesOrder(db, 's1'))!.ticketNumber).toBe('954')
    expect((await searchSalesOrders(db, 'OV', 'cliA')).map((s) => s.id)).toEqual(['s1'])
  })
})
```

- [ ] **Step 5: `apps/desk/server/index.ts`** — borrar los imports líneas 14-15 (`createBooksClient`, `createBooksSync`) y todo el bloque del booksSync lite (≈103-116: el `if (config.booksRefreshToken && ... )` con `createBooksSync` + `backfillClients/SalesOrders` + el `setInterval` de `booksSync.syncRecent`). El app ya no sincroniza Books (lee `clients`/`sales_orders` de la réplica).

- [ ] **Step 6: `apps/hub-sync/src/hub-sync.ts`** — borrar el import de `createBooksSync, BooksSync` (línea 11), `let booksSync` (21), la construcción `booksSync = createBooksSync(...)` (24) y quitar `booksSync` de las llamadas `hubBootstrap({...})` y `scheduleHubSync({...})` (39-40). Mantener `createBooksClient` (lo usa `booksHubSync`) y `booksHubSync`.

- [ ] **Step 7: `apps/hub-sync/src/hubSync.ts`** — quitar: import `maxLastModified` (3) y `type BooksSync` (7); el `booksSync` de las firmas y destructuring de `hubBootstrap`/`scheduleHubSync`; el bloque backfill-si-vacío lite (23-26: `if (booksSync && (await maxLastModified(db,'clients'))==null) {...}`); y el timer de `booksSync` (52-54). Conservar todo lo de `booksHubSync` y el resto.

- [ ] **Step 8: `apps/hub-sync/src/hubSync.test.ts`** — quitar el helper `mockBooks()` y el `booksSync` de las llamadas a `hubBootstrap`/`scheduleHubSync` y sus asserts (`booksSync.backfill*`, `booksSync.syncRecent`). Conservar los tests de `booksHubSync` y de tickets.

- [ ] **Step 9: Run** `npm test` — PASS. (Lectores leen las tablas lite que aún existen; el motor lite ya no existe.)

- [ ] **Step 10:** `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint .` — sin errores (correr `npm install` si hace falta).

- [ ] **Step 11: Commit**
```bash
git add -A
git commit -m "refactor(books): elimina motor lite (sync/mappers/upserts) + cableado; lectores intactos"
```

---

## Task 2: Tablas lite → vistas sobre `books.*`

**Files:**
- Modify: `packages/zoho-sync/src/db/schema.sql`, `packages/zoho-sync/src/booksHub/schema-books.sql`, `packages/zoho-sync/src/books/repo.test.ts`

- [ ] **Step 1: `schema-books.sql`** — quitar las definiciones de `books.contacts` y `books.sales_orders` (se mueven al schema.sql base). Conservar `CREATE SCHEMA IF NOT EXISTS books;`, `books.items`, `books.salesorder_line_items`, `books.invoices`, `books.invoice_line_items` y sus índices. (Las líneas de `sync_state` no las gestiona Node — no estaban en schema-books.sql; dejar como esté.)

- [ ] **Step 2: `schema.sql` base** — reemplazar los bloques `CREATE TABLE IF NOT EXISTS public.clients (…)` (≈114-131) y `public.sales_orders (…)` (≈133-151) **y sus índices** (153-155) por: (a) el esquema + las 2 tablas books rich, (b) las vistas. Inserta esto en su lugar:
```sql
CREATE SCHEMA IF NOT EXISTS books;

CREATE TABLE IF NOT EXISTS books.contacts (
  contact_id text PRIMARY KEY, contact_name text, company_name text, email text, nit text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.sales_orders (
  salesorder_id text PRIMARY KEY, salesorder_number text, reference_number text, date date,
  customer_id text, customer_name text, status text, currency_code text, exchange_rate numeric,
  sub_total numeric, total numeric, bcy_sub_total numeric, bcy_tax_total numeric, bcy_total numeric,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.sales_orders;

CREATE OR REPLACE VIEW public.clients AS
  SELECT contact_id AS id, contact_name AS name, company_name, nit, email
  FROM books.contacts;

CREATE OR REPLACE VIEW public.sales_orders AS
  SELECT salesorder_id AS id, salesorder_number AS number, customer_id AS client_id,
         customer_name, date, total, status,
         COALESCE(raw->>'cf_n_ticket', raw->'custom_field_hash'->>'cf_n_ticket') AS ticket_number,
         raw->>'zcrm_potential_name' AS potential_name
  FROM books.sales_orders;
```
Notas: el `DROP TABLE IF EXISTS` antes del `CREATE VIEW` permite la conversión idempotente (en BD fresca/tests no hay tabla → no-op; en prod existente borra la tabla lite). Como `migrate` es tolerante por sentencia, si en un arranque `clients` ya es vista, el `DROP TABLE` falla inofensivamente y el `CREATE OR REPLACE VIEW` la mantiene. (En prod el `DROP TABLE` de la tabla replicada se hace en el runbook tras sacarla de la suscripción — ver Task 3; aquí el `schema.sql` cubre fresh/tests y el estado final.)

- [ ] **Step 3: Reescribir `books/repo.test.ts`** — ahora insertar en `books.contacts`/`books.sales_orders` (las vistas leen de ahí). Contenido completo:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { searchClients, getClient, searchSalesOrders, getSalesOrder } from './repo'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('books repo (vistas sobre books.*)', () => {
  it('searchClients / getClient leen books.contacts', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name,nit,email) VALUES ('c1','Camposol Colombia S.A.S.','Camposol','901116362','a@b.co')")
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,nit) VALUES ('c2','Bancolombia S.A.','890903938')")
    expect((await searchClients(db, 'campo')).map((c) => c.id)).toEqual(['c1'])
    expect((await searchClients(db, '8909')).map((c) => c.id)).toEqual(['c2'])
    expect((await getClient(db, 'c1'))!.nit).toBe('901116362')
  })

  it('searchSalesOrders / getSalesOrder leen books.sales_orders + ticket_number desde raw', async () => {
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ('s1','OV-2026-117','cliA','Corola','2026-06-01',200,'invoiced','{\"cf_n_ticket\":\"954\"}')")
    expect((await searchSalesOrders(db, 'OV-2026-117')).length).toBe(1)
    expect((await getSalesOrder(db, 's1'))!.status).toBe('invoiced')
    expect((await getSalesOrder(db, 's1'))!.ticketNumber).toBe('954')
    expect((await searchSalesOrders(db, 'OV', 'cliA')).map((s) => s.id)).toEqual(['s1'])
  })
})
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/books/repo.test.ts` — PASS. Luego `npm test` completo — PASS. (Confirmar que `booksHub/*` tests siguen verdes: ahora `books.contacts`/`books.sales_orders` los crea el `schema.sql` base; `migrateBooks` crea las otras 4. Los tests de booksHub llaman `migrate` + `migrateBooks` → las 6 existen.)

- [ ] **Step 5:** `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint .` — sin errores.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat(reorg): clients/sales_orders pasan a vistas sobre books.* (books.* en schema base)"
```

---

## Task 3: Verificación completa + runbook de cutover

- [ ] **Step 1:** `npm install && npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)` — todo verde.

- [ ] **Step 2: Commit + push**
```bash
git add -A && git commit -m "chore(reorg): verificado Fase 2" || true
git push origin main
```
Tras el deploy: `migrate` intentará `CREATE OR REPLACE VIEW public.clients` pero **fallará mientras la TABLA lite exista** (tolerante → loguea y sigue); el app sigue leyendo las tablas lite (ya estáticas, `createBooksSync` eliminado). Verifica que ambos servicios **arrancan** sin caerse.

- [ ] **Step 3: Cutover de replicación (manual, hub + desk-db).** Sacar las lite de la replicación y meter las ricas:
  - **Hub:** `ALTER PUBLICATION zoho_ref_pub DROP TABLE clients, sales_orders;` luego `ALTER PUBLICATION zoho_ref_pub ADD TABLE books.contacts, books.sales_orders;`
  - **desk-db:** `ALTER SUBSCRIPTION zoho_ref_sub REFRESH PUBLICATION;` → desk-db recibe `books.contacts`/`books.sales_orders` (la estructura ya existe por el schema.sql base). Esperar a que copien (ver `pg_subscription_rel` en estado `r`).

- [ ] **Step 4: Tabla→vista (manual, hub + desk-db).** Con las lite ya fuera de la replicación:
```sql
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.sales_orders;
CREATE OR REPLACE VIEW public.clients AS SELECT contact_id AS id, contact_name AS name, company_name, nit, email FROM books.contacts;
CREATE OR REPLACE VIEW public.sales_orders AS SELECT salesorder_id AS id, salesorder_number AS number, customer_id AS client_id, customer_name, date, total, status, COALESCE(raw->>'cf_n_ticket', raw->'custom_field_hash'->>'cf_n_ticket') AS ticket_number, raw->>'zcrm_potential_name' AS potential_name FROM books.sales_orders;
```
(Correr en ambas BDs. Alternativa a las 2 últimas: reiniciar los servicios → `migrate` crea las vistas ya sin la tabla en medio.)

- [ ] **Step 5: Validar.**
  - `SELECT count(*) FROM clients;` y `SELECT * FROM sales_orders WHERE ticket_number IS NOT NULL LIMIT 3;` (en desk-db) devuelven datos de `books.*` con `ticket_number` poblado.
  - App: tablero carga; **búsqueda de clientes/OV** (al crear ticket) funciona; crear un ticket de prueba enlaza cliente/OV correctamente.
  - `\d clients` muestra que es una **vista**, no tabla. `pg_subscription_rel` lista `books.contacts`/`books.sales_orders` (estado `r`) y ya **no** `clients`/`sales_orders`.

- [ ] **Step 6: Actualizar memoria** — marcar Fase 2 hecha (Books-lite eliminado, vistas sobre books.*; doble sync de Books cerrada).

- [ ] **Step 7: Rollback (si algo falla).** Revertir el commit (recrea `books/sync.ts`, `books/mappers.ts`, upserts y las tablas lite en `schema.sql`); en prod: `DROP VIEW public.clients, public.sales_orders;` recrear las tablas lite (`schema.sql` viejo / redeploy del revert), quitar `books.contacts`/`books.sales_orders` de la suscripción y re-añadir `clients`/`sales_orders`, `REFRESH`. Reactivar `createBooksSync` (viene con el revert).

---

## Notas de cierre
- **`config.syncBooks`** queda como flag sin uso tras quitar el sync lite del app — inofensivo; se puede retirar en una limpieza futura (no en esta fase, para minimizar churn).
- **Fuera de alcance:** replicar `books.*` completo a desk-db (solo las 2 que Desk consume); CRM → `crm.*`; rotación de secretos.
