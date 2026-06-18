# Books rico en Node — Parte A: Ingesta `books.*` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Que el worker `zoho-hub-sync` (Node) pueble el esquema rico `books.*` del hub (contacts, items, sales_orders + líneas, invoices + líneas) con paridad exacta de columnas, reemplazando la ingesta que hacía n8n.

**Architecture:** Módulo nuevo aislado `packages/zoho-sync/src/booksHub/` (espejo de `books/`): `schema-books.sql` + `migrate.ts` + `mappers.ts` + `repo.ts` + `sync.ts`. Listas paginadas por `last_modified_time`; las líneas se traen con `GET /{id}` de detalle. Incremental por marca de agua `MAX(zoho_last_modified)`. Resiliencia por-documento (`persistEach`). Se cablea solo en `apps/hub-sync` (nunca en Desk).

**Tech Stack:** TypeScript ESM, Vitest + pg-mem, `pg`, `tsx`. Spec: `docs/superpowers/specs/2026-06-18-books-rico-node-design.md`.

**Contexto del repo (verificado):**
- `packages/zoho-sync/src/books/` es el módulo análogo (lite, escribe `public.clients`/`public.sales_orders`). Lo usamos de referencia, NO lo tocamos.
- `db/migrate.ts`: `migrate(db)` lee un `.sql` y lo aplica dividiendo por `;` (tolerante por sentencia). `Queryable` = `{ query(text, params?): Promise<{rows:any[]}> }`. **Regla:** ninguna sentencia del `.sql` puede contener `;` internos (sin bloques `DO $$`).
- `books/sync.ts`: patrón `createBooksSync({booksFetch,db,config})`, `readData(res)`, páginas con `URLSearchParams` (`organization_id`, `page`, `per_page=200`, `sort_column=last_modified_time`, `sort_order=D`), incremental que corta al alcanzar la marca de agua.
- `books/repo.ts`: `J = (v)=>JSON.stringify(v??null)`; upsert `INSERT … ON CONFLICT (id) DO UPDATE …`.
- `books/booksClient.ts`: `booksFetch(path)` base `https://{booksApiDomain}/books/v3`, auth + reintento 401.
- Worker `apps/hub-sync/src/hub-sync.ts` (entrypoint) + `hubSync.ts` (`hubBootstrap`, `scheduleHubSync`). `config.ts` con flags tipo `env.X !== 'false'`.
- Tests: `beforeEach` crea pg-mem (`newDb().adapters.createPg()` → `new pg.Pool()`), `await migrate(db)`. Para books-hub los tests llamarán además `await migrateBooks(db)`.

---

## Task 1: Esquema `books.*` + `migrateBooks` (TDD)

**Files:**
- Create: `packages/zoho-sync/src/booksHub/schema-books.sql`
- Create: `packages/zoho-sync/src/booksHub/migrate.ts`
- Create: `packages/zoho-sync/src/booksHub/migrate.test.ts`

- [ ] **Step 1: Crear `schema-books.sql`** (PK inline para BD nueva/pg-mem; sin `;` internos):
```sql
CREATE SCHEMA IF NOT EXISTS books;

CREATE TABLE IF NOT EXISTS books.contacts (
  contact_id text PRIMARY KEY, contact_name text, company_name text, email text, nit text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.items (
  item_id text PRIMARY KEY, name text, category_id text, category_name text, status text,
  rate numeric, purchase_rate numeric, sku text,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.sales_orders (
  salesorder_id text PRIMARY KEY, salesorder_number text, reference_number text, date date,
  customer_id text, customer_name text, status text, currency_code text, exchange_rate numeric,
  sub_total numeric, total numeric, bcy_sub_total numeric, bcy_tax_total numeric, bcy_total numeric,
  raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.salesorder_line_items (
  line_item_id text PRIMARY KEY, salesorder_id text, item_id text, name text, quantity numeric,
  rate numeric, bcy_rate numeric, item_total numeric, tax_percentage numeric,
  raw jsonb, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.invoices (
  invoice_id text PRIMARY KEY, invoice_number text, reference_number text, date date, due_date date,
  customer_id text, customer_name text, status text, currency_code text, exchange_rate numeric,
  sub_total numeric, total numeric, bcy_sub_total numeric, bcy_tax_total numeric, bcy_total numeric,
  salesorder_id text, raw jsonb, zoho_last_modified timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books.invoice_line_items (
  line_item_id text PRIMARY KEY, invoice_id text, item_id text, name text, quantity numeric,
  rate numeric, bcy_rate numeric, item_total numeric, tax_percentage numeric,
  raw jsonb, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_soli_so ON books.salesorder_line_items (salesorder_id);
CREATE INDEX IF NOT EXISTS idx_books_ili_inv ON books.invoice_line_items (invoice_id);
```

- [ ] **Step 2: Test** `migrate.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateBooks } from './migrate'

async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg()
  const db = new pg.Pool()
  await migrate(db)
  await migrateBooks(db)
  return db
}

describe('migrateBooks', () => {
  it('crea las 6 tablas del esquema books', async () => {
    const db = await freshDb()
    const r = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='books'",
    )
    const names = r.rows.map((x: { table_name: string }) => x.table_name)
    for (const t of ['contacts', 'items', 'sales_orders', 'salesorder_line_items', 'invoices', 'invoice_line_items']) {
      expect(names).toContain(t)
    }
  })
})
```

- [ ] **Step 3: Run** `npx vitest run packages/zoho-sync/src/booksHub/migrate.test.ts` — FAIL (`migrateBooks` no existe).

- [ ] **Step 4: Crear `migrate.ts`** (mismo patrón que `db/migrate.ts`, apuntando a `schema-books.sql`):
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Queryable } from '../db/migrate'

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema-books.sql')

/** Crea el esquema books.* (idempotente). Solo lo invoca el worker hub-sync, nunca Desk. */
export async function migrateBooks(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
  for (const stmt of statements) {
    try { await db.query(stmt) }
    catch (e) { console.error('migrateBooks: sentencia omitida:', stmt.slice(0, 60), '→', String(e)) }
  }
}
```

- [ ] **Step 5: Run** `npx vitest run packages/zoho-sync/src/booksHub/migrate.test.ts` — PASS.
  > **Riesgo temprano:** este test valida que pg-mem soporta `CREATE SCHEMA` + tablas calificadas `books.*`. Si pg-mem fallara aquí (no soportado), es BLOCKER: reportarlo — alternativa sería usar prefijo de nombre (`books_contacts`) en lugar de esquema, pero eso rompería la paridad con n8n; discutir antes de cambiar.

- [ ] **Step 6: Verificar que `schema-books.sql` se copia al runtime.** El worker corre por `tsx` leyendo `.ts` del workspace (sin build de packages), así que el `.sql` se lee desde su ruta de fuente — igual que `db/schema.sql` hoy. Run `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit` — exit 0.

- [ ] **Step 7: Commit**
```bash
git add packages/zoho-sync/src/booksHub/schema-books.sql packages/zoho-sync/src/booksHub/migrate.ts packages/zoho-sync/src/booksHub/migrate.test.ts
git commit -m "feat(booksHub): esquema books.* + migrateBooks (paridad n8n)"
```

---

## Task 2: Mappers (TDD)

**Files:**
- Create: `packages/zoho-sync/src/booksHub/mappers.ts`
- Create: `packages/zoho-sync/src/booksHub/mappers.test.ts`

- [ ] **Step 1: Test** `mappers.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow } from './mappers'

describe('booksHub mappers', () => {
  it('contactRow mapea campos y guarda raw completo', () => {
    const raw = { contact_id: 'c1', contact_name: 'Camposol', company_name: 'Camposol SAS', email: 'a@b.co', cf_nit: '900', last_modified_time: '2026-01-01T00:00:00Z', extra: 1 }
    const r = contactRow(raw)
    expect(r.contact_id).toBe('c1')
    expect(r.contact_name).toBe('Camposol')
    expect(r.company_name).toBe('Camposol SAS')
    expect(r.nit).toBe('900')
    expect(r.zoho_last_modified).toBe('2026-01-01T00:00:00Z')
    expect((r.raw as any).extra).toBe(1)
  })

  it('itemRow toma category_name y rate', () => {
    const r = itemRow({ item_id: 'i1', name: 'Filtro', category_name: 'Repuestos', rate: '50.5', last_modified_time: '2026-01-02T00:00:00Z' })
    expect(r.item_id).toBe('i1')
    expect(r.category_name).toBe('Repuestos')
    expect(r.rate).toBe(50.5)
  })

  it('salesOrderRow toma totales y guarda detalle en raw', () => {
    const r = salesOrderRow({ salesorder_id: 's1', salesorder_number: 'OV-1', date: '2026-06-01', status: 'open', bcy_sub_total: '100', invoiced_status: 'not_invoiced', last_modified_time: '2026-06-01T00:00:00Z' })
    expect(r.salesorder_id).toBe('s1')
    expect(r.bcy_sub_total).toBe(100)
    expect((r.raw as any).invoiced_status).toBe('not_invoiced')
  })

  it('soLineRow liga la línea a su salesorder_id', () => {
    const r = soLineRow('s1', { line_item_id: 'l1', item_id: 'i1', name: 'X', quantity: '2', bcy_rate: '10', item_total: '20' })
    expect(r.line_item_id).toBe('l1')
    expect(r.salesorder_id).toBe('s1')
    expect(r.bcy_rate).toBe(10)
    expect(r.quantity).toBe(2)
  })

  it('invoiceRow toma salesorder_id y due_date', () => {
    const r = invoiceRow({ invoice_id: 'f1', invoice_number: 'FV-1', date: '2026-06-01', due_date: '2026-07-01', status: 'sent', salesorder_id: 's1', bcy_sub_total: '80', last_modified_time: '2026-06-01T00:00:00Z' })
    expect(r.invoice_id).toBe('f1')
    expect(r.salesorder_id).toBe('s1')
    expect(r.due_date).toBe('2026-07-01')
    expect(r.bcy_sub_total).toBe(80)
  })

  it('invoiceLineRow liga la línea a su invoice_id', () => {
    const r = invoiceLineRow('f1', { line_item_id: 'l9', item_id: 'i1', quantity: '3', bcy_rate: '5' })
    expect(r.invoice_id).toBe('f1')
    expect(r.bcy_rate).toBe(5)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/booksHub/mappers.test.ts` — FAIL.

- [ ] **Step 3: Crear `mappers.ts`** (helper `num` para `numeric` desde string/empty; `raw` = objeto completo):
```ts
const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)
const str = (v: unknown): string | null => (v != null && v !== '' ? String(v) : null)

export interface ContactRow { contact_id: string; contact_name: string | null; company_name: string | null; email: string | null; nit: string | null; raw: unknown; zoho_last_modified: string | null }
export interface ItemRow { item_id: string; name: string | null; category_id: string | null; category_name: string | null; status: string | null; rate: number | null; purchase_rate: number | null; sku: string | null; raw: unknown; zoho_last_modified: string | null }
export interface SalesOrderRow { salesorder_id: string; salesorder_number: string | null; reference_number: string | null; date: string | null; customer_id: string | null; customer_name: string | null; status: string | null; currency_code: string | null; exchange_rate: number | null; sub_total: number | null; total: number | null; bcy_sub_total: number | null; bcy_tax_total: number | null; bcy_total: number | null; raw: unknown; zoho_last_modified: string | null }
export interface LineRow { line_item_id: string; item_id: string | null; name: string | null; quantity: number | null; rate: number | null; bcy_rate: number | null; item_total: number | null; tax_percentage: number | null; raw: unknown }
export interface SoLineRow extends LineRow { salesorder_id: string }
export interface InvoiceLineRow extends LineRow { invoice_id: string }
export interface InvoiceRow { invoice_id: string; invoice_number: string | null; reference_number: string | null; date: string | null; due_date: string | null; customer_id: string | null; customer_name: string | null; status: string | null; currency_code: string | null; exchange_rate: number | null; sub_total: number | null; total: number | null; bcy_sub_total: number | null; bcy_tax_total: number | null; bcy_total: number | null; salesorder_id: string | null; raw: unknown; zoho_last_modified: string | null }

export function contactRow(raw: any): ContactRow {
  return {
    contact_id: raw.contact_id, contact_name: str(raw.contact_name), company_name: str(raw.company_name),
    email: str(raw.email), nit: str(raw.cf_nit ?? raw.custom_field_hash?.cf_nit),
    raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
export function itemRow(raw: any): ItemRow {
  return {
    item_id: raw.item_id, name: str(raw.name), category_id: str(raw.category_id), category_name: str(raw.category_name),
    status: str(raw.status), rate: num(raw.rate), purchase_rate: num(raw.purchase_rate), sku: str(raw.sku),
    raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
export function salesOrderRow(raw: any): SalesOrderRow {
  return {
    salesorder_id: raw.salesorder_id, salesorder_number: str(raw.salesorder_number), reference_number: str(raw.reference_number),
    date: raw.date || null, customer_id: str(raw.customer_id), customer_name: str(raw.customer_name), status: str(raw.status),
    currency_code: str(raw.currency_code), exchange_rate: num(raw.exchange_rate), sub_total: num(raw.sub_total), total: num(raw.total),
    bcy_sub_total: num(raw.bcy_sub_total), bcy_tax_total: num(raw.bcy_tax_total), bcy_total: num(raw.bcy_total),
    raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
function lineCommon(raw: any): LineRow {
  return {
    line_item_id: raw.line_item_id, item_id: str(raw.item_id), name: str(raw.name), quantity: num(raw.quantity),
    rate: num(raw.rate), bcy_rate: num(raw.bcy_rate), item_total: num(raw.item_total), tax_percentage: num(raw.tax_percentage), raw,
  }
}
export function soLineRow(salesorderId: string, raw: any): SoLineRow { return { ...lineCommon(raw), salesorder_id: salesorderId } }
export function invoiceLineRow(invoiceId: string, raw: any): InvoiceLineRow { return { ...lineCommon(raw), invoice_id: invoiceId } }
export function invoiceRow(raw: any): InvoiceRow {
  return {
    invoice_id: raw.invoice_id, invoice_number: str(raw.invoice_number), reference_number: str(raw.reference_number),
    date: raw.date || null, due_date: raw.due_date || null, customer_id: str(raw.customer_id), customer_name: str(raw.customer_name),
    status: str(raw.status), currency_code: str(raw.currency_code), exchange_rate: num(raw.exchange_rate), sub_total: num(raw.sub_total),
    total: num(raw.total), bcy_sub_total: num(raw.bcy_sub_total), bcy_tax_total: num(raw.bcy_tax_total), bcy_total: num(raw.bcy_total),
    salesorder_id: str(raw.salesorder_id), raw, zoho_last_modified: raw.last_modified_time ?? null,
  }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/booksHub/mappers.test.ts` — PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/booksHub/mappers.ts packages/zoho-sync/src/booksHub/mappers.test.ts
git commit -m "feat(booksHub): mappers raw Zoho → filas books.* (raw completo)"
```

---

## Task 3: Repo (upserts + replaceLineItems + watermark) (TDD)

**Files:**
- Create: `packages/zoho-sync/src/booksHub/repo.ts`
- Create: `packages/zoho-sync/src/booksHub/repo.test.ts`

- [ ] **Step 1: Test** `repo.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateBooks } from './migrate'
import { upsertContact, upsertItem, upsertSalesOrder, upsertInvoice, replaceSoLines, replaceInvoiceLines, maxZohoLastModified } from './repo'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow } from './mappers'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateBooks(db) })

describe('booksHub repo', () => {
  it('upsertSalesOrder inserta y luego actualiza (no duplica)', async () => {
    await upsertSalesOrder(db, salesOrderRow({ salesorder_id: 's1', status: 'open', bcy_sub_total: 100, last_modified_time: '2026-06-01T00:00:00Z' }))
    await upsertSalesOrder(db, salesOrderRow({ salesorder_id: 's1', status: 'invoiced', bcy_sub_total: 200, last_modified_time: '2026-06-02T00:00:00Z' }))
    const r = await db.query("SELECT status, bcy_sub_total FROM books.sales_orders WHERE salesorder_id='s1'")
    expect(r.rows.length).toBe(1)
    expect(r.rows[0].status).toBe('invoiced')
  })

  it('replaceSoLines borra las líneas previas y deja solo las nuevas', async () => {
    await upsertSalesOrder(db, salesOrderRow({ salesorder_id: 's1', last_modified_time: '2026-06-01T00:00:00Z' }))
    await replaceSoLines(db, 's1', [soLineRow('s1', { line_item_id: 'a', bcy_rate: 1, quantity: 1 }), soLineRow('s1', { line_item_id: 'b', bcy_rate: 2, quantity: 1 })])
    await replaceSoLines(db, 's1', [soLineRow('s1', { line_item_id: 'c', bcy_rate: 3, quantity: 1 })])
    const r = await db.query("SELECT line_item_id FROM books.salesorder_line_items WHERE salesorder_id='s1' ORDER BY line_item_id")
    expect(r.rows.map((x: any) => x.line_item_id)).toEqual(['c'])
  })

  it('upsertItem y upsertContact persisten', async () => {
    await upsertContact(db, contactRow({ contact_id: 'c1', contact_name: 'A', last_modified_time: '2026-01-01T00:00:00Z' }))
    await upsertItem(db, itemRow({ item_id: 'i1', name: 'X', category_name: 'Cat', last_modified_time: '2026-01-01T00:00:00Z' }))
    expect((await db.query("SELECT 1 FROM books.contacts WHERE contact_id='c1'")).rows.length).toBe(1)
    expect((await db.query("SELECT category_name FROM books.items WHERE item_id='i1'")).rows[0].category_name).toBe('Cat')
  })

  it('upsertInvoice + replaceInvoiceLines', async () => {
    await upsertInvoice(db, invoiceRow({ invoice_id: 'f1', salesorder_id: 's1', status: 'sent', bcy_sub_total: 50, last_modified_time: '2026-06-01T00:00:00Z' }))
    await replaceInvoiceLines(db, 'f1', [invoiceLineRow('f1', { line_item_id: 'x', bcy_rate: 5, quantity: 2 })])
    expect((await db.query("SELECT salesorder_id FROM books.invoices WHERE invoice_id='f1'")).rows[0].salesorder_id).toBe('s1')
    expect((await db.query("SELECT count(*) n FROM books.invoice_line_items WHERE invoice_id='f1'")).rows[0].n).toBe('1')
  })

  it('maxZohoLastModified devuelve la marca de agua de la tabla', async () => {
    await upsertContact(db, contactRow({ contact_id: 'c1', contact_name: 'A', last_modified_time: '2026-01-01T00:00:00Z' }))
    await upsertContact(db, contactRow({ contact_id: 'c2', contact_name: 'B', last_modified_time: '2026-03-01T00:00:00Z' }))
    const wm = await maxZohoLastModified(db, 'contacts')
    expect(new Date(wm!).getTime()).toBe(new Date('2026-03-01T00:00:00Z').getTime())
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/booksHub/repo.test.ts` — FAIL.

- [ ] **Step 3: Crear `repo.ts`**:
```ts
import type { Queryable } from '../db/migrate'
import type { ContactRow, ItemRow, SalesOrderRow, InvoiceRow, SoLineRow, InvoiceLineRow } from './mappers'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertContact(db: Queryable, r: ContactRow): Promise<void> {
  await db.query(
    `INSERT INTO books.contacts (contact_id,contact_name,company_name,email,nit,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,now())
     ON CONFLICT (contact_id) DO UPDATE SET contact_name=EXCLUDED.contact_name,company_name=EXCLUDED.company_name,
       email=EXCLUDED.email,nit=EXCLUDED.nit,raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.contact_id, r.contact_name, r.company_name, r.email, r.nit, J(r.raw), r.zoho_last_modified],
  )
}

export async function upsertItem(db: Queryable, r: ItemRow): Promise<void> {
  await db.query(
    `INSERT INTO books.items (item_id,name,category_id,category_name,status,rate,purchase_rate,sku,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
     ON CONFLICT (item_id) DO UPDATE SET name=EXCLUDED.name,category_id=EXCLUDED.category_id,category_name=EXCLUDED.category_name,
       status=EXCLUDED.status,rate=EXCLUDED.rate,purchase_rate=EXCLUDED.purchase_rate,sku=EXCLUDED.sku,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.item_id, r.name, r.category_id, r.category_name, r.status, r.rate, r.purchase_rate, r.sku, J(r.raw), r.zoho_last_modified],
  )
}

export async function upsertSalesOrder(db: Queryable, r: SalesOrderRow): Promise<void> {
  await db.query(
    `INSERT INTO books.sales_orders (salesorder_id,salesorder_number,reference_number,date,customer_id,customer_name,status,currency_code,exchange_rate,sub_total,total,bcy_sub_total,bcy_tax_total,bcy_total,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now())
     ON CONFLICT (salesorder_id) DO UPDATE SET salesorder_number=EXCLUDED.salesorder_number,reference_number=EXCLUDED.reference_number,
       date=EXCLUDED.date,customer_id=EXCLUDED.customer_id,customer_name=EXCLUDED.customer_name,status=EXCLUDED.status,
       currency_code=EXCLUDED.currency_code,exchange_rate=EXCLUDED.exchange_rate,sub_total=EXCLUDED.sub_total,total=EXCLUDED.total,
       bcy_sub_total=EXCLUDED.bcy_sub_total,bcy_tax_total=EXCLUDED.bcy_tax_total,bcy_total=EXCLUDED.bcy_total,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.salesorder_id, r.salesorder_number, r.reference_number, r.date, r.customer_id, r.customer_name, r.status, r.currency_code, r.exchange_rate, r.sub_total, r.total, r.bcy_sub_total, r.bcy_tax_total, r.bcy_total, J(r.raw), r.zoho_last_modified],
  )
}

export async function upsertInvoice(db: Queryable, r: InvoiceRow): Promise<void> {
  await db.query(
    `INSERT INTO books.invoices (invoice_id,invoice_number,reference_number,date,due_date,customer_id,customer_name,status,currency_code,exchange_rate,sub_total,total,bcy_sub_total,bcy_tax_total,bcy_total,salesorder_id,raw,zoho_last_modified,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,now())
     ON CONFLICT (invoice_id) DO UPDATE SET invoice_number=EXCLUDED.invoice_number,reference_number=EXCLUDED.reference_number,
       date=EXCLUDED.date,due_date=EXCLUDED.due_date,customer_id=EXCLUDED.customer_id,customer_name=EXCLUDED.customer_name,status=EXCLUDED.status,
       currency_code=EXCLUDED.currency_code,exchange_rate=EXCLUDED.exchange_rate,sub_total=EXCLUDED.sub_total,total=EXCLUDED.total,
       bcy_sub_total=EXCLUDED.bcy_sub_total,bcy_tax_total=EXCLUDED.bcy_tax_total,bcy_total=EXCLUDED.bcy_total,salesorder_id=EXCLUDED.salesorder_id,
       raw=EXCLUDED.raw,zoho_last_modified=EXCLUDED.zoho_last_modified,synced_at=now()`,
    [r.invoice_id, r.invoice_number, r.reference_number, r.date, r.due_date, r.customer_id, r.customer_name, r.status, r.currency_code, r.exchange_rate, r.sub_total, r.total, r.bcy_sub_total, r.bcy_tax_total, r.bcy_total, r.salesorder_id, J(r.raw), r.zoho_last_modified],
  )
}

async function insertSoLine(db: Queryable, r: SoLineRow): Promise<void> {
  await db.query(
    `INSERT INTO books.salesorder_line_items (line_item_id,salesorder_id,item_id,name,quantity,rate,bcy_rate,item_total,tax_percentage,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
     ON CONFLICT (line_item_id) DO UPDATE SET salesorder_id=EXCLUDED.salesorder_id,item_id=EXCLUDED.item_id,name=EXCLUDED.name,
       quantity=EXCLUDED.quantity,rate=EXCLUDED.rate,bcy_rate=EXCLUDED.bcy_rate,item_total=EXCLUDED.item_total,tax_percentage=EXCLUDED.tax_percentage,raw=EXCLUDED.raw,synced_at=now()`,
    [r.line_item_id, r.salesorder_id, r.item_id, r.name, r.quantity, r.rate, r.bcy_rate, r.item_total, r.tax_percentage, J(r.raw)],
  )
}
async function insertInvoiceLine(db: Queryable, r: InvoiceLineRow): Promise<void> {
  await db.query(
    `INSERT INTO books.invoice_line_items (line_item_id,invoice_id,item_id,name,quantity,rate,bcy_rate,item_total,tax_percentage,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
     ON CONFLICT (line_item_id) DO UPDATE SET invoice_id=EXCLUDED.invoice_id,item_id=EXCLUDED.item_id,name=EXCLUDED.name,
       quantity=EXCLUDED.quantity,rate=EXCLUDED.rate,bcy_rate=EXCLUDED.bcy_rate,item_total=EXCLUDED.item_total,tax_percentage=EXCLUDED.tax_percentage,raw=EXCLUDED.raw,synced_at=now()`,
    [r.line_item_id, r.invoice_id, r.item_id, r.name, r.quantity, r.rate, r.bcy_rate, r.item_total, r.tax_percentage, J(r.raw)],
  )
}

/** Reemplaza TODAS las líneas de un salesorder (borra previas + inserta nuevas), evitando huérfanas. */
export async function replaceSoLines(db: Queryable, salesorderId: string, lines: SoLineRow[]): Promise<void> {
  await db.query('DELETE FROM books.salesorder_line_items WHERE salesorder_id=$1', [salesorderId])
  for (const l of lines) await insertSoLine(db, l)
}
export async function replaceInvoiceLines(db: Queryable, invoiceId: string, lines: InvoiceLineRow[]): Promise<void> {
  await db.query('DELETE FROM books.invoice_line_items WHERE invoice_id=$1', [invoiceId])
  for (const l of lines) await insertInvoiceLine(db, l)
}

/** Marca de agua: máximo zoho_last_modified de una de las 4 tablas-cabecera. */
export async function maxZohoLastModified(db: Queryable, table: 'contacts' | 'items' | 'sales_orders' | 'invoices'): Promise<string | null> {
  const r = await db.query(`SELECT MAX(zoho_last_modified) AS m FROM books.${table}`)
  return r.rows[0]?.m ?? null
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/booksHub/repo.test.ts` — PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/booksHub/repo.ts packages/zoho-sync/src/booksHub/repo.test.ts
git commit -m "feat(booksHub): upserts books.* + replaceLineItems + watermark"
```

---

## Task 4: Sync (backfill + incremental + detalle de líneas + resiliencia) (TDD)

**Files:**
- Create: `packages/zoho-sync/src/booksHub/sync.ts`
- Create: `packages/zoho-sync/src/booksHub/sync.test.ts`

- [ ] **Step 1: Test** `sync.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateBooks } from './migrate'
import { createBooksHubSync } from './sync'
import type { AppConfig } from '../config'

const config = { booksOrgId: 'o' } as AppConfig
const page = (key: string, items: unknown[]) => new Response(JSON.stringify({ [key]: items }), { status: 200 })
const detail = (key: string, obj: unknown) => new Response(JSON.stringify({ [key]: obj }), { status: 200 })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateBooks(db) })

describe('booksHub sync', () => {
  it('backfillSalesOrders trae cabecera por lista y líneas por detalle', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/salesorders?')) return Promise.resolve(page('salesorders', [{ salesorder_id: 's1', salesorder_number: 'OV-1', date: '2026-06-01', last_modified_time: '2026-06-01T00:00:00Z' }]))
      if (path.startsWith('/salesorders/s1')) return Promise.resolve(detail('salesorder', { salesorder_id: 's1', salesorder_number: 'OV-1', date: '2026-06-01', bcy_sub_total: 100, last_modified_time: '2026-06-01T00:00:00Z', line_items: [{ line_item_id: 'l1', item_id: 'i1', bcy_rate: 10, quantity: 2 }] }))
      return Promise.resolve(page('salesorders', []))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    expect(await sync.backfillSalesOrders()).toBe(1)
    expect((await db.query("SELECT bcy_sub_total FROM books.sales_orders WHERE salesorder_id='s1'")).rows[0].bcy_sub_total).toBe(100)
    expect((await db.query("SELECT count(*) n FROM books.salesorder_line_items WHERE salesorder_id='s1'")).rows[0].n).toBe('1')
  })

  it('un documento que falla en detalle no aborta el lote (resiliencia)', async () => {
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/salesorders?')) return Promise.resolve(page('salesorders', [{ salesorder_id: 'bad', last_modified_time: '2026-06-02T00:00:00Z' }, { salesorder_id: 'ok', last_modified_time: '2026-06-01T00:00:00Z' }]))
      if (path.startsWith('/salesorders/bad')) return Promise.resolve(new Response('boom', { status: 500 }))
      if (path.startsWith('/salesorders/ok')) return Promise.resolve(detail('salesorder', { salesorder_id: 'ok', line_items: [] }))
      return Promise.resolve(page('salesorders', []))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    await expect(sync.backfillSalesOrders()).resolves.toBeDefined()
    expect((await db.query("SELECT 1 FROM books.sales_orders WHERE salesorder_id='ok'")).rows.length).toBe(1)
    expect((await db.query("SELECT 1 FROM books.sales_orders WHERE salesorder_id='bad'")).rows.length).toBe(0)
  })

  it('syncRecent (incremental) solo trae items más nuevos que la marca de agua', async () => {
    await db.query("INSERT INTO books.items (item_id, zoho_last_modified) VALUES ('old','2024-01-01T00:00:00Z')")
    const booksFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/items')) return Promise.resolve(page('items', [
        { item_id: 'new', name: 'N', last_modified_time: '2024-06-01T00:00:00Z' },
        { item_id: 'old', name: 'O', last_modified_time: '2024-01-01T00:00:00Z' },
      ]))
      return Promise.resolve(page(path.startsWith('/contacts') ? 'contacts' : path.startsWith('/salesorders') ? 'salesorders' : 'invoices', []))
    })
    const sync = createBooksHubSync({ booksFetch: booksFetch as any, db, config })
    const r = await sync.syncRecent()
    expect(r.items).toBe(1)
    expect((await db.query("SELECT name FROM books.items WHERE item_id='new'")).rows.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/booksHub/sync.test.ts` — FAIL.

- [ ] **Step 3: Crear `sync.ts`**:
```ts
import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { upsertContact, upsertItem, upsertSalesOrder, upsertInvoice, replaceSoLines, replaceInvoiceLines, maxZohoLastModified } from './repo'
import { contactRow, itemRow, salesOrderRow, soLineRow, invoiceRow, invoiceLineRow } from './mappers'

interface Deps { booksFetch: (path: string, init?: RequestInit) => Promise<Response>; db: Queryable; config: AppConfig }
export interface BooksHubSync {
  backfillContacts(): Promise<number>
  backfillItems(): Promise<number>
  backfillSalesOrders(): Promise<number>
  backfillInvoices(): Promise<number>
  syncRecent(): Promise<{ contacts: number; items: number; salesOrders: number; invoices: number }>
}
const PAGE_SIZE = 200
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createBooksHubSync({ booksFetch, db, config }: Deps): BooksHubSync {
  const org = config.booksOrgId

  function listPath(resource: string, page: number, extra: Record<string, string> = {}): string {
    const p = new URLSearchParams({ organization_id: org, page: String(page), per_page: String(PAGE_SIZE), sort_column: 'last_modified_time', sort_order: 'D', ...extra })
    return `/${resource}?${p.toString()}`
  }
  async function listPage(resource: string, key: string, page: number, extra?: Record<string, string>): Promise<any[]> {
    const res = await booksFetch(listPath(resource, page, extra))
    if (!res.ok) throw new Error(`Books /${resource} ${res.status}`)
    return (await readData(res))[key] ?? []
  }
  async function fetchDetail(resource: string, key: string, id: string): Promise<any> {
    const res = await booksFetch(`/${resource}/${id}?organization_id=${org}`)
    if (!res.ok) throw new Error(`Books /${resource}/${id} ${res.status}`)
    return (await readData(res))[key] ?? {}
  }

  /** Aplica fn a cada item aislando fallos por-documento (un malo no aborta el lote). Devuelve OK count. */
  async function forEachSafe<T>(items: T[], fn: (t: T) => Promise<void>): Promise<number> {
    let ok = 0
    for (const it of items) {
      try { await fn(it); ok++ }
      catch (e: any) { console.error('booksHub item falló:', String(e?.message ?? e)) }
    }
    return ok
  }

  async function persistSalesOrder(header: any): Promise<void> {
    const d = await fetchDetail('salesorders', 'salesorder', header.salesorder_id)
    await upsertSalesOrder(db, salesOrderRow(d))
    await replaceSoLines(db, d.salesorder_id, (d.line_items ?? []).map((l: any) => soLineRow(d.salesorder_id, l)))
  }
  async function persistInvoice(header: any): Promise<void> {
    const d = await fetchDetail('invoices', 'invoice', header.invoice_id)
    await upsertInvoice(db, invoiceRow(d))
    await replaceInvoiceLines(db, d.invoice_id, (d.line_items ?? []).map((l: any) => invoiceLineRow(d.invoice_id, l)))
  }

  // ── Backfill (todas las páginas) ──
  async function backfillSimple(resource: string, key: string, extra: Record<string, string>, persist: (raw: any) => Promise<void>): Promise<number> {
    let page = 1, total = 0
    for (;;) {
      const items = await listPage(resource, key, page, extra)
      if (!items.length) break
      total += await forEachSafe(items, persist)
      if (items.length < PAGE_SIZE) break
      page++
    }
    return total
  }

  // ── Incremental (corta al alcanzar la marca de agua) ──
  async function incremental(resource: string, key: string, table: 'contacts' | 'items' | 'sales_orders' | 'invoices', extra: Record<string, string>, persist: (raw: any) => Promise<void>): Promise<number> {
    const watermark = await maxZohoLastModified(db, table)
    const wm = watermark ? new Date(watermark).getTime() : 0
    let page = 1, count = 0
    for (;;) {
      const items = await listPage(resource, key, page, extra)
      if (!items.length) break
      const fresh: any[] = []
      let reachedOld = false
      for (const it of items) {
        const lmt = it.last_modified_time ? new Date(it.last_modified_time).getTime() : 0
        if (wm && lmt <= wm) { reachedOld = true; break }
        fresh.push(it)
      }
      count += await forEachSafe(fresh, persist)
      if (reachedOld || items.length < PAGE_SIZE) break
      page++
    }
    return count
  }

  const persistContact = (raw: any) => upsertContact(db, contactRow(raw))
  const persistItem = (raw: any) => upsertItem(db, itemRow(raw))

  return {
    backfillContacts: () => backfillSimple('contacts', 'contacts', { contact_type: 'customer' }, persistContact),
    backfillItems: () => backfillSimple('items', 'items', {}, persistItem),
    backfillSalesOrders: () => backfillSimple('salesorders', 'salesorders', {}, persistSalesOrder),
    backfillInvoices: () => backfillSimple('invoices', 'invoices', {}, persistInvoice),
    async syncRecent() {
      return {
        contacts: await incremental('contacts', 'contacts', 'contacts', { contact_type: 'customer' }, persistContact),
        items: await incremental('items', 'items', 'items', {}, persistItem),
        salesOrders: await incremental('salesorders', 'salesorders', 'sales_orders', {}, persistSalesOrder),
        invoices: await incremental('invoices', 'invoices', 'invoices', {}, persistInvoice),
      }
    },
  }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/booksHub/sync.test.ts` — PASS.

- [ ] **Step 5:** Run `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit && npx eslint packages/zoho-sync/src/booksHub` — sin errores (warnings `no-explicit-any` aceptables).

- [ ] **Step 6: Commit**
```bash
git add packages/zoho-sync/src/booksHub/sync.ts packages/zoho-sync/src/booksHub/sync.test.ts
git commit -m "feat(booksHub): sync backfill+incremental con detalle de líneas y resiliencia"
```

---

## Task 5: Flag de config + cableado en el worker (TDD)

**Files:**
- Modify: `packages/zoho-sync/src/config.ts` (interface + loader), `packages/zoho-sync/src/config.test.ts`
- Modify: `apps/hub-sync/src/hubSync.ts`, `apps/hub-sync/src/hubSync.test.ts`
- Modify: `apps/hub-sync/src/hub-sync.ts` (entrypoint)

- [ ] **Step 1: Test config** — en `packages/zoho-sync/src/config.test.ts`, añade dentro del describe existente:
```ts
  it('syncBooksRich default true; false con SYNC_BOOKS_RICH=false', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    expect(loadConfig(base as any).syncBooksRich).toBe(true)
    expect(loadConfig({ ...base, SYNC_BOOKS_RICH: 'false' } as any).syncBooksRich).toBe(false)
  })
```
(Asegura el import de `loadConfig` ya presente en el archivo.)

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/config.test.ts -t "syncBooksRich"` — FAIL.

- [ ] **Step 3: Implementar en `config.ts`** — añade a la interfaz `AppConfig` (junto a `syncBooks`):
```ts
  syncBooksRich: boolean
```
y en el objeto de `loadConfig` (junto a `syncBooks`):
```ts
    syncBooksRich: env.SYNC_BOOKS_RICH !== 'false',
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/config.test.ts` — PASS.

- [ ] **Step 5: Test wiring** — en `apps/hub-sync/src/hubSync.test.ts`, añade un test que verifique que `hubBootstrap` migra books y hace backfill-si-vacío cuando se pasa `booksHubSync`. Usa el patrón de mocks existente del archivo (revisa cómo se construyen `sync`/`booksSync` mock allí) y añade:
```ts
import { migrateBooks } from '@ambientalia/zoho-sync/booksHub/migrate'
// dentro del describe de hubBootstrap:
it('migra books.* y backfillea si está vacío', async () => {
  const pg = newDb().adapters.createPg(); const db = new (pg.Pool)()
  await migrate(db)
  const calls: string[] = []
  const booksHubSync = {
    backfillContacts: async () => { calls.push('c'); return 0 },
    backfillItems: async () => { calls.push('i'); return 0 },
    backfillSalesOrders: async () => { calls.push('so'); return 0 },
    backfillInvoices: async () => { calls.push('inv'); return 0 },
    syncRecent: async () => ({ contacts: 0, items: 0, salesOrders: 0, invoices: 0 }),
  }
  await hubBootstrap({ db, sync: mockSync(), booksSync: null, booksHubSync })
  expect((await db.query("SELECT 1 FROM information_schema.schemata WHERE schema_name='books'")).rows.length).toBe(1)
  expect(calls).toEqual(['c', 'i', 'so', 'inv'])
})
```
(Reusa el helper `mockSync`/`mockBooks` que ya exista en el archivo; si los mocks actuales no incluyen `booksHubSync`, este test fija la nueva firma.)

- [ ] **Step 6: Run** `npx vitest run apps/hub-sync/src/hubSync.test.ts -t "books"` — FAIL.

- [ ] **Step 7: Implementar en `hubSync.ts`** — importar y aceptar `booksHubSync`:
```ts
import { migrateBooks } from '@ambientalia/zoho-sync/booksHub/migrate'
import { maxZohoLastModified } from '@ambientalia/zoho-sync/booksHub/repo'
import type { BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'
```
Cambiar la firma de `hubBootstrap` a `deps: { db: Queryable; sync: Sync; booksSync: BooksSync | null; booksHubSync?: BooksHubSync | null }` (OPCIONAL → no rompe las llamadas existentes que no lo pasan) y desestructurar `const { db, sync, booksSync, booksHubSync = null } = deps`. Al final del cuerpo, añadir:
```ts
  if (booksHubSync) {
    await migrateBooks(db)
    if ((await maxZohoLastModified(db, 'items')) == null) {
      console.log('Books rico vacío: backfill…')
      await booksHubSync.backfillContacts()
      await booksHubSync.backfillItems()
      await booksHubSync.backfillSalesOrders()
      await booksHubSync.backfillInvoices()
    }
  }
```
Cambiar la firma de `scheduleHubSync` a incluir `booksHubSync?: BooksHubSync | null` (opcional) y desestructurar `const { sync, booksSync, booksHubSync = null, intervalMs } = deps`. Dentro, añadir un timer:
```ts
  if (booksHubSync) {
    timers.push(setInterval(() => {
      booksHubSync.syncRecent().catch((e) => console.error('Books rico syncRecent falló:', e))
    }, intervalMs))
  }
```
(Desestructurar `booksHubSync` de `deps` en ambas funciones.)

- [ ] **Step 8: Run** `npx vitest run apps/hub-sync/src/hubSync.test.ts` — PASS. (Como el parámetro es opcional, los tests existentes que no pasan `booksHubSync` siguen compilando sin cambios.)

- [ ] **Step 9: Cablear el entrypoint `apps/hub-sync/src/hub-sync.ts`** — añade tras la construcción de `booksSync`:
```ts
import { createBooksHubSync, type BooksHubSync } from '@ambientalia/zoho-sync/booksHub/sync'
// …
let booksHubSync: BooksHubSync | null = null
if (config.booksRefreshToken && config.booksOrgId && config.syncBooksRich) {
  const { booksFetch } = createBooksClient({ config })
  booksHubSync = createBooksHubSync({ booksFetch, db: pool, config })
  console.log('Sync Books rico (books.*) habilitado')
}
```
y pasar `booksHubSync` a `hubBootstrap({ … , booksHubSync })` y `scheduleHubSync({ … , booksHubSync })`.

- [ ] **Step 10:** Run `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint .` — sin errores.

- [ ] **Step 11: Commit**
```bash
git add packages/zoho-sync/src/config.ts packages/zoho-sync/src/config.test.ts apps/hub-sync/src/hubSync.ts apps/hub-sync/src/hubSync.test.ts apps/hub-sync/src/hub-sync.ts
git commit -m "feat(booksHub): cableado en worker hub-sync + flag SYNC_BOOKS_RICH"
```

---

## Task 6: Verificación completa + runbook de despliegue

- [ ] **Step 1:** Run `npm install && npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)`
Expected: tests PASS; ambos tsc exit 0; eslint 0 errores; build OK. (El `npm install` cablea los symlinks de workspace — necesario para que vitest resuelva `@ambientalia/zoho-sync/booksHub/*`.)

- [ ] **Step 2: Commit + push**
```bash
git add -A && git commit -m "chore(booksHub): verificado" || true
git push origin main
```
(Dispara rebuild del worker `zoho-hub-sync` en EasyPanel.)

- [ ] **Step 3: Verificar PKs en el hub (manual, una vez).** En `zoho-hub-db` → Postgres Client → `\c zoho-hub`, comprobar que las 6 tablas tienen PRIMARY/UNIQUE sobre la clave del upsert (n8n pudo crearlas sin PK):
```
SELECT conrelid::regclass t, conname, contype FROM pg_constraint WHERE connamespace='books'::regnamespace AND contype IN ('p','u') ORDER BY 1;
```
Si falta el PK de alguna (p.ej. `books.contacts`), añadirlo (una línea por tabla que falte):
```
ALTER TABLE books.contacts ADD CONSTRAINT books_contacts_pkey PRIMARY KEY (contact_id);
ALTER TABLE books.items ADD CONSTRAINT books_items_pkey PRIMARY KEY (item_id);
ALTER TABLE books.sales_orders ADD CONSTRAINT books_sales_orders_pkey PRIMARY KEY (salesorder_id);
ALTER TABLE books.salesorder_line_items ADD CONSTRAINT books_soli_pkey PRIMARY KEY (line_item_id);
ALTER TABLE books.invoices ADD CONSTRAINT books_invoices_pkey PRIMARY KEY (invoice_id);
ALTER TABLE books.invoice_line_items ADD CONSTRAINT books_ili_pkey PRIMARY KEY (line_item_id);
```
(Si ya tienen PK, el `ALTER` falla inofensivamente con "multiple primary keys"; ignorar.) **Sin estos PK, el `ON CONFLICT` del upsert falla en producción.**

- [ ] **Step 4: Validar tras el deploy.** En los logs de `zoho-hub-sync`: aparece `Sync Books rico (books.*) habilitado` y los ciclos `Books rico syncRecent` corren sin errores de `duplicate key`/`ON CONFLICT`. Como `books.*` ya está poblado, el backfill se salta (la condición `maxZohoLastModified('items') == null` es falsa) y arranca incremental, recuperando lo cambiado desde que se despublicó n8n.

- [ ] **Step 5: Comprobar frescura de datos.** En `zoho-hub`: `SELECT max(zoho_last_modified) FROM books.sales_orders;` y `… FROM books.invoices;` deben avanzar tras un par de ciclos (3–6 min). Conteos coherentes con Zoho Books.

---

## Notas de cierre
- Fuera de alcance aquí: la **derivación `sales_records`** (es la Parte B, plan aparte) y pagos/estimates.
- La ingesta de Books de n8n ya está despublicada por el usuario; esta parte la reemplaza por completo.
