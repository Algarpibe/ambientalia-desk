# `@algarpibe/zoho-sync` — paquete delgado de lectura de hub-db (R1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Crear y publicar un paquete npm autónomo `@algarpibe/zoho-sync` que permita a apps futuras conectarse y LEER `zoho-hub-db` (conexión + tipos + helpers), sin tocar el monorepo.

**Architecture:** Proyecto npm independiente en el repo `Algarpibe/zoho-sync`, desarrollado en un clon local `c:\dev\zoho-sync`. Compila con `tsc` → `dist` (JS + `.d.ts`), se publica a GitHub Packages bajo scope `@algarpibe`. Las apps lo instalan y consultan el hub con un usuario read-only.

**Tech Stack:** TypeScript (tsc emit), `pg`, vitest + pg-mem, GitHub Packages.

**Spec:** `docs/superpowers/specs/2026-06-18-paquete-lectura-hub-design.md`.

**Columnas reales del hub (fuente de verdad = schemas del monorepo; los tipos las reflejan):**
- `crm.deals`: id, deal_name, amount(num), stage, type, probability(num), closing_date(date), expected_revenue(num), next_step, account_id, account_name, contact_id, contact_name, owner_id, owner_name, numero_ticket(num), stage_modified_time(ts), created_time(ts), raw(jsonb), modified_time(ts), synced_at(ts).
- `books.invoices`: invoice_id(PK), invoice_number, reference_number, date, due_date, customer_id, customer_name, status, currency_code, exchange_rate(num), sub_total(num), total(num), bcy_sub_total(num), bcy_tax_total(num), bcy_total(num), salesorder_id, raw, zoho_last_modified(ts), synced_at(ts).
- `books.sales_orders`: salesorder_id(PK), salesorder_number, reference_number, date, customer_id, customer_name, status, currency_code, exchange_rate(num), sub_total(num), total(num), bcy_sub_total(num), bcy_tax_total(num), bcy_total(num), raw, zoho_last_modified(ts), synced_at(ts).
- `tickets` (Desk, esquema `desk` en prod): id(PK), number(int UNIQUE), subject, status, status_type, priority, classification, channel, contact_id, account_id, assignee_id, created_time(ts), modified_time(ts), closed_time(ts), due_date(ts), codigo_servicio, tipo_servicio, equipo, marca, modelo, serial, ciudad, nit, orden_venta, …(curado para v1).

**Working directory:** TODAS las tareas se ejecutan en `c:\dev\zoho-sync` (clon del repo nuevo), NO en el monorepo. El monorepo no se modifica.

---

## Task 1: Bootstrap del repo `Algarpibe/zoho-sync`

**Files (en `c:\dev\zoho-sync`):** Create `package.json`, `tsconfig.json`, `vitest.config.ts`, `.npmrc`, `.gitignore`.

- [ ] **Step 1: Clonar el repo** (vacío en GitHub). Run:
```bash
cd /c/dev && git clone https://github.com/Algarpibe/zoho-sync.git && cd zoho-sync
```
Si está vacío, git avisa "warning: You appear to have cloned an empty repository" — normal. Asegurar rama `main`: `git checkout -b main` (si no existe).

- [ ] **Step 2: `package.json`**:
```json
{
  "name": "@algarpibe/zoho-sync",
  "version": "1.0.0",
  "description": "Cliente de solo-lectura para zoho-hub-db (desk.*/books.*/crm.*)",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": { "build": "tsc", "test": "vitest run", "prepublishOnly": "npm run build" },
  "repository": { "type": "git", "url": "git+https://github.com/Algarpibe/zoho-sync.git" },
  "publishConfig": { "registry": "https://npm.pkg.github.com" },
  "license": "UNLICENSED",
  "dependencies": { "pg": "^8.21.0" },
  "devDependencies": {
    "@types/node": "^25.9.1",
    "@types/pg": "^8.20.0",
    "pg-mem": "^3.0.14",
    "typescript": "~5.6.2",
    "vitest": "^3.2.6"
  }
}
```

- [ ] **Step 3: `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true, "resolveJsonModule": true,
    "declaration": true, "outDir": "./dist", "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "dist"]
}
```

- [ ] **Step 4: `vitest.config.ts`**:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'] } })
```

- [ ] **Step 5: `.npmrc`** (auth por env, NUNCA token literal):
```
@algarpibe:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

- [ ] **Step 6: `.gitignore`**:
```
node_modules/
dist/
*.log
```

- [ ] **Step 7: Instalar y verificar.** Run: `npm install` → OK. Run: `npx tsc --noEmit` → exit 0 (sin fuentes aún, no falla). Commit:
```bash
git add -A && git commit -m "chore: bootstrap @algarpibe/zoho-sync (paquete de lectura de hub-db)"
```

---

## Task 2: Conexión (`pool.ts`) + superficie pública (`index.ts`) — TDD

**Files (en `c:\dev\zoho-sync`):** Create `src/pool.ts`, `src/index.ts`, `src/pool.test.ts`.

- [ ] **Step 1: Test `src/pool.test.ts`**:
```ts
import { describe, it, expect } from 'vitest'
import { createPoolFromUrl } from './index'

describe('createPoolFromUrl', () => {
  it('crea un Pool con la connection string', () => {
    const pool = createPoolFromUrl('postgres://u:p@localhost:5432/db')
    expect(typeof pool.query).toBe('function')
    expect(typeof pool.end).toBe('function')
    pool.end().catch(() => {}) // no conecta; solo verifica la forma
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/pool.test.ts` → FAIL (no existe `./index`).

- [ ] **Step 3: `src/pool.ts`** (registra el parser de `numeric`→number para que los tipos `number` sean veraces con node-pg):
```ts
import pg, { Pool } from 'pg'

// node-pg devuelve numeric/decimal como string por defecto; lo parseamos a number para que los tipos sean veraces.
pg.types.setTypeParser(1700, (v: string | null) => (v === null ? null : parseFloat(v)))

export { Pool } from 'pg'

/** Crea un Pool de solo-lectura hacia zoho-hub-db. Usar con un usuario read-only. */
export function createPoolFromUrl(connectionString: string): Pool {
  return new Pool({ connectionString })
}
```

- [ ] **Step 4: `src/index.ts`** (superficie pública; se irá ampliando):
```ts
export { createPoolFromUrl, Pool } from './pool'
export type { Queryable } from './reads'
export * from './types'
export * from './reads'
```
(NOTA: `./types` y `./reads` se crean en Tasks 3–4; hasta entonces `index.ts` no compila. Para que el test de pool pase ya, crear stubs vacíos temporales `src/types.ts` y `src/reads.ts` con `export {}` y un `export interface Queryable { query(sql: string, params?: unknown[]): Promise<{ rows: any[] }> }` en reads — se completan en Tasks 3–4.)

- [ ] **Step 5: Run** `npx vitest run src/pool.test.ts` → PASS. `npx tsc --noEmit` → exit 0.

- [ ] **Step 6: Commit**: `git add -A && git commit -m "feat: createPoolFromUrl + parser numeric->number"`

---

## Task 3: Tipos de fila (`types.ts`)

**Files (en `c:\dev\zoho-sync`):** Modify `src/types.ts`.

- [ ] **Step 1: Reemplazar `src/types.ts`** por las 4 interfaces (reflejan las columnas reales; `numeric`→`number`, `date`/`timestamptz`→`string` (node-pg devuelve fecha/timestamp como string ISO o Date — se tipa `string` por simplicidad de lectura; ver SCHEMA.md), `jsonb`→`unknown`):
```ts
export interface CrmDeal {
  id: string
  deal_name: string | null
  amount: number | null
  stage: string | null
  type: string | null
  probability: number | null
  closing_date: string | null
  expected_revenue: number | null
  next_step: string | null
  account_id: string | null
  account_name: string | null
  contact_id: string | null
  contact_name: string | null
  owner_id: string | null
  owner_name: string | null
  numero_ticket: number | null
  stage_modified_time: string | null
  created_time: string | null
  raw: unknown
  modified_time: string | null
  synced_at: string
}

export interface BooksInvoice {
  invoice_id: string
  invoice_number: string | null
  reference_number: string | null
  date: string | null
  due_date: string | null
  customer_id: string | null
  customer_name: string | null
  status: string | null
  currency_code: string | null
  exchange_rate: number | null
  sub_total: number | null
  total: number | null
  bcy_sub_total: number | null
  bcy_tax_total: number | null
  bcy_total: number | null
  salesorder_id: string | null
  raw: unknown
  zoho_last_modified: string | null
  synced_at: string
}

export interface BooksSalesOrder {
  salesorder_id: string
  salesorder_number: string | null
  reference_number: string | null
  date: string | null
  customer_id: string | null
  customer_name: string | null
  status: string | null
  currency_code: string | null
  exchange_rate: number | null
  sub_total: number | null
  total: number | null
  bcy_sub_total: number | null
  bcy_tax_total: number | null
  bcy_total: number | null
  raw: unknown
  zoho_last_modified: string | null
  synced_at: string
}

export interface DeskTicket {
  id: string
  number: number
  subject: string | null
  status: string | null
  status_type: string | null
  priority: string | null
  classification: string | null
  channel: string | null
  contact_id: string | null
  account_id: string | null
  assignee_id: string | null
  created_time: string | null
  modified_time: string | null
  closed_time: string | null
  due_date: string | null
  codigo_servicio: string | null
  tipo_servicio: string | null
  equipo: string | null
  marca: string | null
  modelo: string | null
  serial: string | null
  ciudad: string | null
  nit: string | null
  orden_venta: string | null
}
```

- [ ] **Step 2: Run** `npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**: `git add -A && git commit -m "feat: tipos de fila CrmDeal/BooksInvoice/BooksSalesOrder/DeskTicket"`

---

## Task 4: Helpers de lectura (`reads.ts`) + tests pg-mem — TDD

**Files (en `c:\dev\zoho-sync`):** Modify `src/reads.ts`; Create `src/reads.test.ts`.

- [ ] **Step 1: Test `src/reads.test.ts`** (pg-mem; el `CREATE TABLE` de cada fixture refleja las columnas de los tipos — sirve de test de contrato: si un tipo y su SELECT divergen del esquema, falla):
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { getDealsByStage, getInvoicesByContact, getSalesOrdersByContact, getTicketByNumber } from './reads'

let db: any
beforeEach(() => {
  const mem = newDb()
  db = mem.adapters.createPg().Pool ? new (mem.adapters.createPg().Pool)() : mem.adapters.createPg()
  // Esquemas + tablas mínimas (columnas espejo de types.ts)
  mem.public.none(`
    CREATE SCHEMA crm; CREATE SCHEMA books; CREATE SCHEMA desk;
    CREATE TABLE crm.deals (id text primary key, deal_name text, stage text, amount numeric, numero_ticket numeric, modified_time timestamptz);
    CREATE TABLE books.invoices (invoice_id text primary key, customer_id text, total numeric, status text, zoho_last_modified timestamptz);
    CREATE TABLE books.sales_orders (salesorder_id text primary key, customer_id text, total numeric, status text, zoho_last_modified timestamptz);
    CREATE TABLE desk.tickets (id text primary key, number integer, subject text, status text);
    INSERT INTO crm.deals (id,deal_name,stage,amount,numero_ticket,modified_time) VALUES ('d1','A','Ganado',100,1000001,'2026-06-01T00:00:00Z'),('d2','B','Perdido',50,null,'2026-06-02T00:00:00Z');
    INSERT INTO books.invoices (invoice_id,customer_id,total,status) VALUES ('i1','c1',200,'paid'),('i2','c2',300,'sent');
    INSERT INTO books.sales_orders (salesorder_id,customer_id,total,status) VALUES ('s1','c1',150,'open');
    INSERT INTO desk.tickets (id,number,subject,status) VALUES ('t1',1000001,'Falla','Abierto');
  `)
})

describe('reads', () => {
  it('getDealsByStage filtra por stage', async () => {
    const r = await getDealsByStage(db, 'Ganado')
    expect(r.map((d) => d.id)).toEqual(['d1'])
    expect(r[0].amount).toBe(100) // numeric llega como number (parser)
  })
  it('getInvoicesByContact filtra por customer_id', async () => {
    const r = await getInvoicesByContact(db, 'c1')
    expect(r.map((x) => x.invoice_id)).toEqual(['i1'])
  })
  it('getSalesOrdersByContact filtra por customer_id', async () => {
    const r = await getSalesOrdersByContact(db, 'c1')
    expect(r.map((x) => x.salesorder_id)).toEqual(['s1'])
  })
  it('getTicketByNumber devuelve uno o null', async () => {
    expect((await getTicketByNumber(db, 1000001))?.id).toBe('t1')
    expect(await getTicketByNumber(db, 999)).toBeNull()
  })
})
```
(NOTA pg-mem: el adaptador es `mem.adapters.createPg()`; usar `const { Pool } = mem.adapters.createPg(); db = new Pool()`. Ajustar el `beforeEach` a la API real de pg-mem v3 — el patrón probado en el monorepo es `newDb().adapters.createPg()`; replicarlo.)

- [ ] **Step 2: Run** `npx vitest run src/reads.test.ts` → FAIL (helpers no existen).

- [ ] **Step 3: `src/reads.ts`**:
```ts
import type { CrmDeal, BooksInvoice, BooksSalesOrder, DeskTicket } from './types'

/** Mínimo para aceptar un pg.Pool o cliente. */
export interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>
}

export async function getDealsByStage(db: Queryable, stage: string): Promise<CrmDeal[]> {
  const { rows } = await db.query('SELECT * FROM crm.deals WHERE stage = $1 ORDER BY modified_time DESC', [stage])
  return rows as CrmDeal[]
}

export async function getInvoicesByContact(db: Queryable, customerId: string): Promise<BooksInvoice[]> {
  const { rows } = await db.query('SELECT * FROM books.invoices WHERE customer_id = $1 ORDER BY date DESC', [customerId])
  return rows as BooksInvoice[]
}

export async function getSalesOrdersByContact(db: Queryable, customerId: string): Promise<BooksSalesOrder[]> {
  const { rows } = await db.query('SELECT * FROM books.sales_orders WHERE customer_id = $1 ORDER BY date DESC', [customerId])
  return rows as BooksSalesOrder[]
}

export async function getTicketByNumber(db: Queryable, n: number): Promise<DeskTicket | null> {
  const { rows } = await db.query('SELECT * FROM desk.tickets WHERE number = $1', [n])
  return (rows[0] as DeskTicket) ?? null
}
```
(NOTA: el `tickets` real está en el esquema `desk` en producción — por eso `desk.tickets`. Documentarlo en SCHEMA.md.)

- [ ] **Step 4: Run** `npx vitest run` → PASS (todos). `npx tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**: `git add -A && git commit -m "feat: helpers de lectura (deals/invoices/sales_orders/ticket) + tests pg-mem"`

---

## Task 5: Documentación (`SCHEMA.md` + `README.md`)

**Files (en `c:\dev\zoho-sync`):** Create `SCHEMA.md`, `README.md`.

- [ ] **Step 1: `SCHEMA.md`** — documentar los esquemas del hub y las tablas tipadas en v1:
```markdown
# Esquema de zoho-hub-db

Centraliza datos de Zoho en 3 esquemas: `desk.*` (Zoho Desk), `books.*` (Zoho Books), `crm.*` (Zoho CRM).
Este paquete (v1) tipa un conjunto representativo; el resto se consulta con `query()` libre.

## Tipado en v1
- `crm.deals` → `CrmDeal` — helper `getDealsByStage`
- `books.invoices` → `BooksInvoice` — helper `getInvoicesByContact`
- `books.sales_orders` → `BooksSalesOrder` — helper `getSalesOrdersByContact`
- `desk.tickets` → `DeskTicket` — helper `getTicketByNumber`

## Notas de tipos
- `numeric` se devuelve como **number** (el paquete registra un parser de pg).
- `date`/`timestamptz` se tipan como `string` (ISO). `jsonb` como `unknown`.
- En producción los tickets viven en el esquema `desk` (`desk.tickets`).

## Otras tablas (sin tipo aún, usar `query()`)
- `crm.*`: leads, tasks, events, calls, products, quotes, quote_line_items, campaigns, visits.
- `books.*`: contacts, items, invoice_line_items, salesorder_line_items.
- Ampliar tipos/helpers cuando una app los necesite.
```

- [ ] **Step 2: `README.md`** — instalación + consumo:
```markdown
# @algarpibe/zoho-sync

Cliente de **solo-lectura** para `zoho-hub-db` (datos centralizados de Zoho Desk/Books/CRM).

## Instalar (GitHub Packages)
1. `.npmrc` en tu app:
   ```
   @algarpibe:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```
   con un PAT de scope `read:packages` en `NPM_TOKEN`.
2. `npm i @algarpibe/zoho-sync`

## Uso
```ts
import { createPoolFromUrl, getDealsByStage } from '@algarpibe/zoho-sync'
const db = createPoolFromUrl(process.env.HUB_DB_URL!) // usuario read-only del hub
const ganados = await getDealsByStage(db, 'Ganado')
// SQL libre:
const { rows } = await db.query('SELECT * FROM crm.quotes WHERE subject ILIKE $1', ['%filtro%'])
```

Ver `SCHEMA.md` para las tablas disponibles.
```

- [ ] **Step 3: Commit**: `git add -A && git commit -m "docs: SCHEMA.md + README (consumo del hub)"`

---

## Task 6: Build, publish v1.0.0 + usuario read-only + cierre

> Pasos de publicación/DB los ejecuta el usuario (PAT + acceso al hub); el agente prepara y verifica lo local.

- [ ] **Step 1: Build + dry-run.**
  - Run: `npm run build` → crea `dist/index.js` + `dist/*.d.ts` (pool, types, reads).
  - Run: `ls dist` → contiene `index.js`, `index.d.ts`, `pool.js`, `types.js`, `reads.js` + `.d.ts`.
  - Run: `npm pack --dry-run` → el tarball incluye SOLO `dist/**` + `package.json` + README (por `files:["dist"]`; README/LICENSE los añade npm). NO incluye `src/`.

- [ ] **Step 2: Push del repo.** `git push -u origin main`.

- [ ] **Step 3: (Usuario) Publicar v1.0.0.** Con `NPM_TOKEN` = PAT `write:packages`:
```bash
npm publish
```
Verificar en GitHub → `Algarpibe/zoho-sync` → Packages que aparece `@algarpibe/zoho-sync@1.0.0`.

- [ ] **Step 4: (Usuario) Crear el usuario read-only en `zoho-hub-db`.** En `zoho-hub` (`\c zoho-hub`):
```sql
CREATE ROLE hub_reader LOGIN PASSWORD '<elige-una>';
GRANT CONNECT ON DATABASE "zoho-hub" TO hub_reader;
GRANT USAGE ON SCHEMA desk, books, crm TO hub_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA desk, books, crm TO hub_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA desk GRANT SELECT ON TABLES TO hub_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA books GRANT SELECT ON TABLES TO hub_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT SELECT ON TABLES TO hub_reader;
```
La connection string de las apps consumidoras usa `hub_reader` (nunca el usuario de escritura del worker).

- [ ] **Step 5: (Opcional) Probar consumo real.** En un dir temporal: `.npmrc` (read:packages) + `npm i @algarpibe/zoho-sync@^1` + `createPoolFromUrl(<hub_reader url>)` + `getDealsByStage(db,'Ganado')` → devuelve filas tipadas del hub real.

- [ ] **Step 6: Actualizar memoria** (en el monorepo). En `zoho-hub-arquitectura.md`: existe `@algarpibe/zoho-sync` v1.0.0 (GitHub Packages, repo `Algarpibe/zoho-sync`) = cliente read-only del hub (conexión + tipos + helpers); usuario `hub_reader` para apps; el motor de ingesta sigue en el monorepo (R1, no se extrajo). Anotar pendiente: ampliar tipos/helpers cuando aparezca la primera app consumidora.

---

## Notas de cierre / riesgos
- **GOTCHA ESM (corregido en ejecución, commit `007ddc2`):** con `"type":"module"` + `tsc moduleResolution:"Bundler"`, los imports relativos DEBEN llevar extensión `.js` (`./pool.js`, `./types.js`, `./reads.js`) en `index.ts`/`reads.ts` — Node NO los reescribe en el emit y el paquete publicado fallaría con `ERR_MODULE_NOT_FOUND`. Los `*.test.ts` no lo necesitan (vitest usa resolución bundler y no se publican).
- **Anti-drift:** los tipos/DDL-de-test duplican el esquema del monorepo (fuente de verdad = `packages/zoho-sync/src/**/schema*.sql`). Cuando el motor cambie una de las 4 tablas tipadas, actualizar `types.ts` + el fixture de `reads.test.ts`. (Documentado; v1 no automatiza la sincronización cross-repo.)
- **numeric→number:** `pool.ts` registra el parser para que los tipos `number` sean veraces con node-pg (pg-mem ya devuelve number).
- **Esquema `desk`:** en prod los tickets están en `desk.tickets` (search_path); los helpers usan el nombre calificado.
- **Fuera de alcance:** tocar el monorepo, tipar todas las tablas, API HTTP, ingesta desde apps, rotación de secretos.
```
