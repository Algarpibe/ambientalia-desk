# Subsistema I — Sync Zoho Books (clientes + órdenes de venta) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sincronizar (solo lectura) **clientes** y **órdenes de venta** desde Zoho Books a Postgres (tablas `clients`/`sales_orders`), con búsqueda por API, para que la creación de tickets (C) pueda elegir una OV y autocompletar cliente + Orden de Venta.

**Architecture:** Cliente HTTP propio de Books (token OAuth separado, `booksFetch`); mappers puros Books→fila; repo con upserts + búsqueda; sync con backfill + refresco incremental por marca de agua `last_modified_time`. Endpoints `GET /api/clients` y `GET /api/sales-orders` bajo sesión. Se construye/prueba con mocks; las credenciales (`ZOHO_BOOKS_*`) solo hacen falta al desplegar (si faltan, el sync se deshabilita y la app arranca igual).

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest. Spec: `docs/superpowers/specs/2026-06-04-subsistema-i-sync-zoho-books-design.md`.

**Contexto:** repo en `main`. `server/db/migrate.ts` aplica `schema.sql` tolerante. `server/config.ts` con `loadConfig(env)`. Patrón Desk: `server/tokenManager.ts` + `server/zohoClient.ts` (Books los replica aparte, sin tocarlos). `requireAuth(db)` ya está importado en `server/app.ts`. `J = JSON.stringify` para columnas jsonb (ver `server/db/repo.ts`).

---

## Estructura de archivos

- Modify `server/db/schema.sql` — tablas `clients`, `sales_orders` + índices.
- Modify `server/db/migrate.test.ts` — afirmar las tablas nuevas.
- Modify `shared/types.ts` — `ClientLite`, `SalesOrderLite`.
- Create `server/books/mappers.ts` — `clientFromBooks`, `salesOrderFromBooks` (+ tipos `ClientRow`/`SalesOrderRow`).
- Create `server/books/repo.ts` — upserts, búsqueda, getters, `maxLastModified`.
- Modify `server/config.ts` + `server/config.test.ts` — `ZOHO_BOOKS_*`.
- Create `server/books/booksClient.ts` — `booksFetch` (token + fetch + retry 401).
- Create `server/books/sync.ts` — `createBooksSync` (backfill + incremental).
- Modify `server/app.ts` + `server/app.test.ts` — endpoints de búsqueda.
- Modify `server/index.ts` — arranque del sync de Books (si hay credenciales).

---

## Task 1: Esquema `clients` + `sales_orders`

**Files:**
- Modify: `server/db/schema.sql`
- Modify: `server/db/migrate.test.ts`

- [ ] **Step 1: Añadir al final de `server/db/schema.sql`**
```sql
CREATE TABLE IF NOT EXISTS clients (
  id text PRIMARY KEY,
  name text NOT NULL,
  company_name text,
  nit text,
  email text,
  phone text,
  mobile text,
  contact_person text,
  customer_sub_type text,
  status text,
  source text NOT NULL DEFAULT 'books',
  raw jsonb,
  last_modified_time timestamptz,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id text PRIMARY KEY,
  number text NOT NULL,
  client_id text,
  customer_name text,
  date date,
  total numeric,
  currency_code text,
  status text,
  ticket_number text,
  potential_name text,
  salesperson_name text,
  source text NOT NULL DEFAULT 'books',
  raw jsonb,
  last_modified_time timestamptz,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_client ON sales_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders (number);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);
```

- [ ] **Step 2: En `server/db/migrate.test.ts`** añade `'clients', 'sales_orders'` al array de tablas esperadas del primer test:
```ts
    for (const t of ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments', 'ticket_transitions', 'users', 'sessions', 'roles', 'clients', 'sales_orders']) {
      expect(names).toContain(t)
    }
```

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run server/db/migrate.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql server/db/migrate.test.ts
git commit -m "feat(I): clients + sales_orders tables (Zoho Books)"
```

---

## Task 2: Tipos compartidos + mappers Books→fila (TDD, puro)

**Files:**
- Modify: `shared/types.ts`
- Create: `server/books/mappers.ts`
- Create: `server/books/mappers.test.ts`

- [ ] **Step 1: Añadir a `shared/types.ts`** (al final):
```ts
export interface ClientLite {
  id: string
  name: string
  nit?: string
  email?: string
  companyName?: string
}

export interface SalesOrderLite {
  id: string
  number: string
  clientId?: string
  customerName?: string
  date?: string
  total?: number
  status?: string
  ticketNumber?: string
  potentialName?: string
}
```

- [ ] **Step 2: Escribir `server/books/mappers.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { clientFromBooks, salesOrderFromBooks } from './mappers'

describe('clientFromBooks', () => {
  it('mapea nombre, NIT (cf_nit) y persona de contacto', () => {
    const r = clientFromBooks({
      contact_id: 'c1', contact_name: 'Camposol Colombia S.A.S.', company_name: 'Camposol Colombia S.A.S.',
      cf_nit: '901116362', email: 'a@b.co', phone: '', mobile: '300', first_name: 'Alejandra', last_name: 'Amador',
      customer_sub_type: 'business', status: 'active', last_modified_time: '2023-11-29T15:23:28-0500',
    } as any)
    expect(r.id).toBe('c1')
    expect(r.name).toBe('Camposol Colombia S.A.S.')
    expect(r.nit).toBe('901116362')
    expect(r.contact_person).toBe('Alejandra Amador')
    expect(r.source).toBe('books')
  })
})

describe('salesOrderFromBooks', () => {
  it('mapea número, cliente, total, estado y n° de ticket (cf_n_ticket)', () => {
    const r = salesOrderFromBooks({
      salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_id: 'c1', customer_name: 'Corola Ambiental S.A.S.',
      date: '2026-06-01', total: 1745593, currency_code: 'COP', status: 'invoiced', cf_n_ticket: '944',
      zcrm_potential_name: 'Corola - 0526 - MT_18A10077_EDM180D_260416', salesperson_name: 'Luz Ángela Mora',
      last_modified_time: '2026-06-03T15:26:09-0500',
    } as any)
    expect(r.id).toBe('s1')
    expect(r.number).toBe('OV-2026-117')
    expect(r.client_id).toBe('c1')
    expect(r.total).toBe(1745593)
    expect(r.status).toBe('invoiced')
    expect(r.ticket_number).toBe('944')
    expect(r.potential_name).toContain('MT_18A10077')
  })
})
```

- [ ] **Step 3: Ejecutar y ver fallar**
Run: `npx vitest run server/books/mappers.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 4: Implementar `server/books/mappers.ts`**
```ts
export interface ClientRow {
  id: string; name: string; company_name: string | null; nit: string | null
  email: string | null; phone: string | null; mobile: string | null
  contact_person: string | null; customer_sub_type: string | null; status: string | null
  source: string; raw: unknown; last_modified_time: string | null
}

export interface SalesOrderRow {
  id: string; number: string; client_id: string | null; customer_name: string | null
  date: string | null; total: number | null; currency_code: string | null; status: string | null
  ticket_number: string | null; potential_name: string | null; salesperson_name: string | null
  source: string; raw: unknown; last_modified_time: string | null
}

export function clientFromBooks(raw: any): ClientRow {
  const name = raw.contact_name ?? raw.company_name ?? ''
  const contactPerson = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim() || null
  return {
    id: raw.contact_id, name, company_name: raw.company_name ?? null,
    nit: raw.cf_nit ?? raw.custom_field_hash?.cf_nit ?? null,
    email: raw.email ?? null, phone: raw.phone ?? null, mobile: raw.mobile ?? null,
    contact_person: contactPerson, customer_sub_type: raw.customer_sub_type ?? null,
    status: raw.status ?? null, source: 'books', raw, last_modified_time: raw.last_modified_time ?? null,
  }
}

export function salesOrderFromBooks(raw: any): SalesOrderRow {
  return {
    id: raw.salesorder_id, number: raw.salesorder_number ?? '', client_id: raw.customer_id ?? null,
    customer_name: raw.customer_name ?? null, date: raw.date || null,
    total: raw.total != null && raw.total !== '' ? Number(raw.total) : null,
    currency_code: raw.currency_code ?? null, status: raw.status ?? null,
    ticket_number: raw.cf_n_ticket ?? raw.custom_field_hash?.cf_n_ticket ?? null,
    potential_name: raw.zcrm_potential_name ?? null, salesperson_name: raw.salesperson_name ?? null,
    source: 'books', raw, last_modified_time: raw.last_modified_time ?? null,
  }
}
```

- [ ] **Step 5: Ejecutar y ver pasar**
Run: `npx vitest run server/books/mappers.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**
```bash
git add shared/types.ts server/books/mappers.ts server/books/mappers.test.ts
git commit -m "feat(I): ClientLite/SalesOrderLite types + Books→row mappers"
```

---

## Task 3: Repo de Books (upserts + búsqueda) (TDD pg-mem)

**Files:**
- Create: `server/books/repo.ts`
- Create: `server/books/repo.test.ts`

- [ ] **Step 1: Escribir `server/books/repo.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { clientFromBooks, salesOrderFromBooks } from './mappers'
import { upsertClient, upsertSalesOrder, searchClients, searchSalesOrders, getClient, getSalesOrder, maxLastModified } from './repo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('books repo', () => {
  it('upsert + búsqueda de clientes por nombre/NIT', async () => {
    await upsertClient(db, clientFromBooks({ contact_id: 'c1', contact_name: 'Camposol Colombia S.A.S.', cf_nit: '901116362', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    await upsertClient(db, clientFromBooks({ contact_id: 'c2', contact_name: 'Bancolombia S.A.', cf_nit: '890903938', last_modified_time: '2024-01-02T00:00:00Z' } as any))
    expect((await searchClients(db, 'campo')).map((c) => c.id)).toEqual(['c1'])
    expect((await searchClients(db, '8909')).map((c) => c.id)).toEqual(['c2'])
    expect((await getClient(db, 'c1'))!.nit).toBe('901116362')
  })

  it('upsert actualiza (no duplica) y búsqueda de OV por número/cliente', async () => {
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_name: 'Corola Ambiental', date: '2026-06-01', total: 100, status: 'open', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_name: 'Corola Ambiental', date: '2026-06-01', total: 200, status: 'invoiced', last_modified_time: '2026-06-02T00:00:00Z' } as any))
    expect((await searchSalesOrders(db, 'OV-2026-117')).length).toBe(1)
    expect((await getSalesOrder(db, 's1'))!.status).toBe('invoiced')
    expect((await searchSalesOrders(db, 'corola')).map((s) => s.id)).toEqual(['s1'])
  })

  it('maxLastModified devuelve la marca de agua', async () => {
    await upsertClient(db, clientFromBooks({ contact_id: 'c1', contact_name: 'A', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    await upsertClient(db, clientFromBooks({ contact_id: 'c2', contact_name: 'B', last_modified_time: '2024-03-01T00:00:00Z' } as any))
    const wm = await maxLastModified(db, 'clients')
    expect(new Date(wm!).getTime()).toBe(new Date('2024-03-01T00:00:00Z').getTime())
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/books/repo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `server/books/repo.ts`**
```ts
import type { Queryable } from '../db/migrate'
import type { ClientRow, SalesOrderRow } from './mappers'
import type { ClientLite, SalesOrderLite } from '../../shared/types'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertClient(db: Queryable, r: ClientRow): Promise<void> {
  await db.query(
    `INSERT INTO clients (id,name,company_name,nit,email,phone,mobile,contact_person,customer_sub_type,status,source,raw,last_modified_time,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now())
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,company_name=EXCLUDED.company_name,nit=EXCLUDED.nit,
       email=EXCLUDED.email,phone=EXCLUDED.phone,mobile=EXCLUDED.mobile,contact_person=EXCLUDED.contact_person,
       customer_sub_type=EXCLUDED.customer_sub_type,status=EXCLUDED.status,raw=EXCLUDED.raw,
       last_modified_time=EXCLUDED.last_modified_time,synced_at=now(),updated_at=now()`,
    [r.id, r.name, r.company_name, r.nit, r.email, r.phone, r.mobile, r.contact_person, r.customer_sub_type, r.status, r.source, J(r.raw), r.last_modified_time],
  )
}

export async function upsertSalesOrder(db: Queryable, r: SalesOrderRow): Promise<void> {
  await db.query(
    `INSERT INTO sales_orders (id,number,client_id,customer_name,date,total,currency_code,status,ticket_number,potential_name,salesperson_name,source,raw,last_modified_time,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())
     ON CONFLICT (id) DO UPDATE SET number=EXCLUDED.number,client_id=EXCLUDED.client_id,customer_name=EXCLUDED.customer_name,
       date=EXCLUDED.date,total=EXCLUDED.total,currency_code=EXCLUDED.currency_code,status=EXCLUDED.status,
       ticket_number=EXCLUDED.ticket_number,potential_name=EXCLUDED.potential_name,salesperson_name=EXCLUDED.salesperson_name,
       raw=EXCLUDED.raw,last_modified_time=EXCLUDED.last_modified_time,synced_at=now(),updated_at=now()`,
    [r.id, r.number, r.client_id, r.customer_name, r.date, r.total, r.currency_code, r.status, r.ticket_number, r.potential_name, r.salesperson_name, r.source, J(r.raw), r.last_modified_time],
  )
}

function clientToLite(r: any): ClientLite {
  return { id: r.id, name: r.name, nit: r.nit ?? undefined, email: r.email ?? undefined, companyName: r.company_name ?? undefined }
}
function salesOrderToLite(r: any): SalesOrderLite {
  return {
    id: r.id, number: r.number, clientId: r.client_id ?? undefined, customerName: r.customer_name ?? undefined,
    date: r.date ?? undefined, total: r.total != null ? Number(r.total) : undefined, status: r.status ?? undefined,
    ticketNumber: r.ticket_number ?? undefined, potentialName: r.potential_name ?? undefined,
  }
}

export async function searchClients(db: Queryable, q: string, limit = 20): Promise<ClientLite[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,name,company_name,nit,email FROM clients
     WHERE LOWER(name) LIKE $1 OR LOWER(COALESCE(company_name,'')) LIKE $1 OR LOWER(COALESCE(nit,'')) LIKE $1
     ORDER BY name LIMIT $2`,
    [like, limit],
  )
  return r.rows.map(clientToLite)
}

export async function getClient(db: Queryable, id: string): Promise<ClientLite | null> {
  const r = await db.query('SELECT id,name,company_name,nit,email FROM clients WHERE id=$1', [id])
  return r.rows[0] ? clientToLite(r.rows[0]) : null
}

export async function searchSalesOrders(db: Queryable, q: string, limit = 20): Promise<SalesOrderLite[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,number,client_id,customer_name,date,total,status,ticket_number,potential_name FROM sales_orders
     WHERE LOWER(number) LIKE $1 OR LOWER(COALESCE(customer_name,'')) LIKE $1
     ORDER BY date DESC NULLS LAST LIMIT $2`,
    [like, limit],
  )
  return r.rows.map(salesOrderToLite)
}

export async function getSalesOrder(db: Queryable, id: string): Promise<SalesOrderLite | null> {
  const r = await db.query('SELECT id,number,client_id,customer_name,date,total,status,ticket_number,potential_name FROM sales_orders WHERE id=$1', [id])
  return r.rows[0] ? salesOrderToLite(r.rows[0]) : null
}

export async function maxLastModified(db: Queryable, table: 'clients' | 'sales_orders'): Promise<string | null> {
  const r = await db.query(`SELECT MAX(last_modified_time) AS m FROM ${table}`)
  return r.rows[0]?.m ?? null
}
```
NOTA: `table` en `maxLastModified` es una unión literal (`'clients'|'sales_orders'`), no input de usuario → sin inyección. Búsqueda case-insensitive con `LOWER(...) LIKE` (soportado por pg-mem).

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/books/repo.test.ts`
Expected: PASS (3 tests). (Si pg-mem falla en `date DESC NULLS LAST`, usa `ORDER BY date DESC` a secas.)

- [ ] **Step 5: Commit**
```bash
git add server/books/repo.ts server/books/repo.test.ts
git commit -m "feat(I): books repo (upserts, search by name/nit/number, watermark)"
```

---

## Task 4: Config `ZOHO_BOOKS_*`

**Files:**
- Modify: `server/config.ts`
- Modify: `server/config.test.ts`

- [ ] **Step 1: En `server/config.ts`**, añade al interface `AppConfig` (cerca de `adminPassword`):
```ts
  booksClientId: string
  booksClientSecret: string
  booksRefreshToken: string   // vacío = sync de Books deshabilitado
  booksOrgId: string
  booksApiDomain: string
  booksAccountsDomain: string
```
Y en el objeto que devuelve `loadConfig`:
```ts
    booksClientId: env.ZOHO_BOOKS_CLIENT_ID || env.ZOHO_CLIENT_ID || '',
    booksClientSecret: env.ZOHO_BOOKS_CLIENT_SECRET || env.ZOHO_CLIENT_SECRET || '',
    booksRefreshToken: env.ZOHO_BOOKS_REFRESH_TOKEN || '',
    booksOrgId: env.ZOHO_BOOKS_ORG_ID || '',
    booksApiDomain: env.ZOHO_BOOKS_API_DOMAIN || 'www.zohoapis.com',
    booksAccountsDomain: env.ZOHO_BOOKS_ACCOUNTS_DOMAIN || env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com',
```

- [ ] **Step 2: En `server/config.test.ts`** añade un test (reusa el env base del archivo — se llama `base`):
```ts
  it('lee ZOHO_BOOKS_* (refresh token vacío por defecto)', () => {
    expect(loadConfig(base).booksRefreshToken).toBe('')
    const c = loadConfig({ ...base, ZOHO_BOOKS_REFRESH_TOKEN: 'rt', ZOHO_BOOKS_ORG_ID: '714421387' })
    expect(c.booksRefreshToken).toBe('rt')
    expect(c.booksOrgId).toBe('714421387')
    expect(c.booksApiDomain).toBe('www.zohoapis.com')
  })
```
(Si el env base del archivo tiene otro nombre, sustitúyelo. `loadConfig` ya está importado en el test.)

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run server/config.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add server/config.ts server/config.test.ts
git commit -m "feat(I): ZOHO_BOOKS_* config (sync disabled if no refresh token)"
```

---

## Task 5: Cliente HTTP de Books (`booksClient.ts`) (TDD)

**Files:**
- Create: `server/books/booksClient.ts`
- Create: `server/books/booksClient.test.ts`

- [ ] **Step 1: Escribir `server/books/booksClient.test.ts`**
```ts
import { describe, it, expect, vi } from 'vitest'
import { createBooksClient } from './booksClient'
import type { AppConfig } from '../config'

const config = { booksApiDomain: 'books.test', booksAccountsDomain: 'acc.test', booksRefreshToken: 'r', booksClientId: 'c', booksClientSecret: 's', booksOrgId: 'o' } as AppConfig
const tokenRes = () => new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 })

describe('booksClient', () => {
  it('refresca token y llama a la API con Authorization', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(tokenRes()).mockResolvedValueOnce(new Response('{"ok":1}', { status: 200 }))
    const { booksFetch } = createBooksClient({ config, fetchImpl: fetchImpl as unknown as typeof fetch })
    const res = await booksFetch('/contacts?x=1')
    expect(res.status).toBe(200)
    const [url, init] = fetchImpl.mock.calls[1]
    expect(String(url)).toBe('https://books.test/books/v3/contacts?x=1')
    expect((init.headers as Record<string, string>).Authorization).toBe('Zoho-oauthtoken tok')
  })

  it('reintenta tras 401 refrescando el token', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(new Response('{"ok":1}', { status: 200 }))
    const { booksFetch } = createBooksClient({ config, fetchImpl: fetchImpl as unknown as typeof fetch })
    const res = await booksFetch('/salesorders')
    expect(res.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/books/booksClient.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `server/books/booksClient.ts`**
```ts
import type { AppConfig } from '../config'

export interface BooksClient {
  booksFetch(path: string, init?: RequestInit): Promise<Response>
}

interface Deps {
  config: AppConfig
  fetchImpl?: typeof fetch
  now?: () => number
}

export function createBooksClient({ config, fetchImpl = fetch, now = () => Date.now() }: Deps): BooksClient {
  const base = `https://${config.booksApiDomain}/books/v3`
  let token: string | null = null
  let expiresAt = 0

  async function refresh(): Promise<string> {
    const url = `https://${config.booksAccountsDomain}/oauth/v2/token`
    const body = new URLSearchParams({
      refresh_token: config.booksRefreshToken,
      client_id: config.booksClientId,
      client_secret: config.booksClientSecret,
      grant_type: 'refresh_token',
    })
    const res = await fetchImpl(url, { method: 'POST', body })
    if (!res.ok) throw new Error(`Fallo al refrescar token Books: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) throw new Error(`Token Books inválido: ${JSON.stringify(data)}`)
    token = data.access_token
    expiresAt = now() + ((data.expires_in ?? 3600) - 60) * 1000
    return token
  }
  async function getToken(force = false): Promise<string> {
    if (!force && token && now() < expiresAt) return token
    return refresh()
  }
  async function call(path: string, init: RequestInit, t: string): Promise<Response> {
    return fetchImpl(`${base}${path}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Zoho-oauthtoken ${t}` },
    })
  }

  return {
    async booksFetch(path: string, init: RequestInit = {}): Promise<Response> {
      let t = await getToken()
      let res = await call(path, init, t)
      if (res.status === 401) { t = await getToken(true); res = await call(path, init, t) }
      return res
    },
  }
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/books/booksClient.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add server/books/booksClient.ts server/books/booksClient.test.ts
git commit -m "feat(I): Books HTTP client (separate OAuth token + 401 retry)"
```

---

## Task 6: Sync de Books (backfill + incremental) (TDD)

**Files:**
- Create: `server/books/sync.ts`
- Create: `server/books/sync.test.ts`

- [ ] **Step 1: Escribir `server/books/sync.test.ts`**
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { createBooksSync } from './sync'
import { searchClients, searchSalesOrders, upsertClient } from './repo'
import { clientFromBooks } from './mappers'
import type { AppConfig } from '../config'

const config = { booksOrgId: 'o' } as AppConfig
const page = (key: 'contacts' | 'salesorders', items: unknown[]) => new Response(JSON.stringify({ [key]: items }), { status: 200 })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('books sync', () => {
  it('backfillClients pagina y hace upsert', async () => {
    const booksFetch = vi.fn()
      .mockResolvedValueOnce(page('contacts', [{ contact_id: 'c1', contact_name: 'Camposol', last_modified_time: '2024-01-01T00:00:00Z' }]))
      .mockResolvedValue(page('contacts', []))
    const sync = createBooksSync({ booksFetch: booksFetch as any, db, config })
    expect(await sync.backfillClients()).toBe(1)
    expect((await searchClients(db, 'camp')).length).toBe(1)
  })

  it('backfillSalesOrders pagina y hace upsert', async () => {
    const booksFetch = vi.fn()
      .mockResolvedValueOnce(page('salesorders', [{ salesorder_id: 's1', salesorder_number: 'OV-1', last_modified_time: '2026-01-01T00:00:00Z' }]))
      .mockResolvedValue(page('salesorders', []))
    const sync = createBooksSync({ booksFetch: booksFetch as any, db, config })
    expect(await sync.backfillSalesOrders()).toBe(1)
    expect((await searchSalesOrders(db, 'OV-1')).length).toBe(1)
  })

  it('syncRecent (incremental) solo trae lo más nuevo que la marca de agua', async () => {
    // marca de agua existente
    await upsertClient(db, clientFromBooks({ contact_id: 'old', contact_name: 'Viejo', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    // la API devuelve uno nuevo y luego el viejo (orden desc); debe parar en el viejo
    const booksFetch = vi.fn()
      .mockImplementation((path: string) => {
        if (path.includes('/contacts')) {
          return Promise.resolve(page('contacts', [
            { contact_id: 'new', contact_name: 'Nuevo', last_modified_time: '2024-06-01T00:00:00Z' },
            { contact_id: 'old', contact_name: 'Viejo', last_modified_time: '2024-01-01T00:00:00Z' },
          ]))
        }
        return Promise.resolve(page('salesorders', []))
      })
    const sync = createBooksSync({ booksFetch: booksFetch as any, db, config })
    const r = await sync.syncRecent()
    expect(r.clients).toBe(1) // solo 'new'
    expect((await searchClients(db, 'nuevo')).length).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/books/sync.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `server/books/sync.ts`**
```ts
import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { upsertClient, upsertSalesOrder, maxLastModified } from './repo'
import { clientFromBooks, salesOrderFromBooks } from './mappers'

interface Deps {
  booksFetch: (path: string, init?: RequestInit) => Promise<Response>
  db: Queryable
  config: AppConfig
}
export interface BooksSync {
  backfillClients(): Promise<number>
  backfillSalesOrders(): Promise<number>
  syncRecent(): Promise<{ clients: number; salesOrders: number }>
}
const PAGE_SIZE = 200
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createBooksSync({ booksFetch, db, config }: Deps): BooksSync {
  const org = config.booksOrgId

  async function pageContacts(page: number): Promise<any[]> {
    const p = new URLSearchParams({ organization_id: org, contact_type: 'customer', page: String(page), per_page: String(PAGE_SIZE), sort_column: 'last_modified_time', sort_order: 'D' })
    const res = await booksFetch(`/contacts?${p.toString()}`)
    if (!res.ok) throw new Error(`Books /contacts ${res.status}`)
    return (await readData(res)).contacts ?? []
  }
  async function pageSalesOrders(page: number): Promise<any[]> {
    const p = new URLSearchParams({ organization_id: org, page: String(page), per_page: String(PAGE_SIZE), sort_column: 'last_modified_time', sort_order: 'D' })
    const res = await booksFetch(`/salesorders?${p.toString()}`)
    if (!res.ok) throw new Error(`Books /salesorders ${res.status}`)
    return (await readData(res)).salesorders ?? []
  }

  async function backfillClients(): Promise<number> {
    let page = 1, total = 0
    for (;;) {
      const items = await pageContacts(page)
      if (!items.length) break
      for (const c of items) await upsertClient(db, clientFromBooks(c))
      total += items.length
      if (items.length < PAGE_SIZE) break
      page++
    }
    return total
  }
  async function backfillSalesOrders(): Promise<number> {
    let page = 1, total = 0
    for (;;) {
      const items = await pageSalesOrders(page)
      if (!items.length) break
      for (const s of items) await upsertSalesOrder(db, salesOrderFromBooks(s))
      total += items.length
      if (items.length < PAGE_SIZE) break
      page++
    }
    return total
  }

  // Incremental: descendente por last_modified; se detiene al alcanzar la marca de agua.
  async function incremental(entity: 'clients' | 'sales_orders'): Promise<number> {
    const watermark = await maxLastModified(db, entity)
    const wm = watermark ? new Date(watermark).getTime() : 0
    let page = 1, count = 0
    for (;;) {
      const items = entity === 'clients' ? await pageContacts(page) : await pageSalesOrders(page)
      if (!items.length) break
      let reachedOld = false
      for (const it of items) {
        const lmt = it.last_modified_time ? new Date(it.last_modified_time).getTime() : 0
        if (wm && lmt <= wm) { reachedOld = true; break }
        if (entity === 'clients') await upsertClient(db, clientFromBooks(it))
        else await upsertSalesOrder(db, salesOrderFromBooks(it))
        count++
      }
      if (reachedOld || items.length < PAGE_SIZE) break
      page++
    }
    return count
  }

  return {
    backfillClients,
    backfillSalesOrders,
    async syncRecent() {
      return { clients: await incremental('clients'), salesOrders: await incremental('sales_orders') }
    },
  }
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/books/sync.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add server/books/sync.ts server/books/sync.test.ts
git commit -m "feat(I): Books sync (backfill clients/sales-orders + incremental by watermark)"
```

---

## Task 7: Endpoints de búsqueda + tests

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`

- [ ] **Step 1: En `server/app.ts`** añade el import:
```ts
import { searchClients, searchSalesOrders } from './books/repo'
```
Y, junto a los demás endpoints (después de los de `/api/admin` o cerca de `/api/attachment`), añade (cada uno con su propio `requireAuth(db)`, ya que no están bajo `/api/tickets`):
```ts
  app.get('/api/clients', requireAuth(db), async (req, res) => {
    try {
      res.json(await searchClients(db, String(req.query.search ?? '')))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })

  app.get('/api/sales-orders', requireAuth(db), async (req, res) => {
    try {
      res.json(await searchSalesOrders(db, String(req.query.search ?? '')))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 2: En `server/app.test.ts`** añade imports y un bloque de tests (los helpers `adminCookie`/`appWith` ya existen):
```ts
import { upsertClient, upsertSalesOrder } from './books/repo'
import { clientFromBooks, salesOrderFromBooks } from './books/mappers'

describe('GET /api/clients y /api/sales-orders (Books)', () => {
  it('busca clientes (con sesión)', async () => {
    const cookie = await adminCookie()
    await upsertClient(db, clientFromBooks({ contact_id: 'c1', contact_name: 'Camposol Colombia S.A.S.', cf_nit: '901116362', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=campo').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'c1', nit: '901116362' })
  })

  it('busca órdenes de venta (con sesión)', async () => {
    const cookie = await adminCookie()
    await upsertSalesOrder(db, salesOrderFromBooks({ salesorder_id: 's1', salesorder_number: 'OV-2026-117', customer_name: 'Corola', date: '2026-06-01', status: 'open', last_modified_time: '2026-06-01T00:00:00Z' } as any))
    const { app } = appWith()
    const res = await request(app).get('/api/sales-orders?search=OV-2026').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 's1', number: 'OV-2026-117' })
  })

  it('GET /api/clients sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/clients?search=x')
    expect(res.status).toBe(401)
  })
})
```
(Si `adminCookie` no existe en este archivo —debería, de H2— usa el helper de sesión disponible.)

- [ ] **Step 3: Verificar suite completa + typecheck server**
Run: `npx vitest run && npx tsc -p tsconfig.server.json --noEmit`
Expected: todos los tests PASS; typecheck server limpio.

- [ ] **Step 4: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(I): /api/clients and /api/sales-orders search endpoints (session-gated)"
```

---

## Task 8: Arranque del sync de Books (si hay credenciales)

**Files:**
- Modify: `server/index.ts`

- [ ] **Step 1: En `server/index.ts`** añade imports:
```ts
import { createBooksClient } from './books/booksClient'
import { createBooksSync } from './books/sync'
import { maxLastModified } from './books/repo'
```
Dentro de `main()`, tras configurar el sync de Desk (antes o después del `setInterval` de Desk), añade el bloque de Books:
```ts
  if (config.booksRefreshToken && config.booksOrgId) {
    const { booksFetch } = createBooksClient({ config })
    const booksSync = createBooksSync({ booksFetch, db: pool, config })
    maxLastModified(pool, 'clients')
      .then(async (wm) => {
        if (!wm) {
          console.log('Books vacío: backfill de clientes y órdenes de venta…')
          const c = await booksSync.backfillClients()
          const s = await booksSync.backfillSalesOrders()
          console.log(`Books backfill: ${c} clientes, ${s} órdenes de venta`)
        }
      })
      .catch((e) => console.error('Books backfill falló:', e))
    setInterval(() => {
      booksSync.syncRecent().catch((e) => console.error('Books syncRecent falló:', e))
    }, config.syncIntervalMs)
    console.log('Sync Zoho Books habilitado')
  } else {
    console.log('Sync Zoho Books deshabilitado (faltan ZOHO_BOOKS_REFRESH_TOKEN / ZOHO_BOOKS_ORG_ID)')
  }
```

- [ ] **Step 2: Verificar typecheck server**
Run: `npx tsc -p tsconfig.server.json --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**
```bash
git add server/index.ts
git commit -m "feat(I): boot Books sync when credentials present (backfill-on-empty + interval)"
```

---

## Task 9: Verificación completa

**Files:** ninguno nuevo.

- [ ] **Step 1: Suite + typechecks + lint + build**
Run: `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores** (warnings OK); build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar con credenciales de Books)**

1. En EasyPanel añade `ZOHO_BOOKS_REFRESH_TOKEN` (scope `ZohoBooks.contacts.READ,ZohoBooks.salesorders.READ`), `ZOHO_BOOKS_ORG_ID=714421387` (y `ZOHO_BOOKS_CLIENT_ID/SECRET` si usas otro app; si no, hereda los de Desk). **Implementar**.
2. En logs: "Sync Zoho Books habilitado" y "Books backfill: N clientes, M órdenes de venta".
3. En **PgWeb**: `SELECT count(*) FROM clients;` y `SELECT count(*) FROM sales_orders;` > 0. `SELECT number, customer_name, ticket_number FROM sales_orders ORDER BY date DESC LIMIT 5;` muestra OVs con su n° de ticket.
4. (Tras C) los selectores de cliente/OV usarán `GET /api/clients?search=` y `GET /api/sales-orders?search=`.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(I): subsistema I verificado (sync Zoho Books)"
```

---

## Notas de cierre
- **Solo lectura**: la app no escribe en Books.
- **Sin credenciales** de Books, el sync se omite y la app funciona igual (Desk sigue su curso).
- **Reutilizable**: `clients` lo usará Remisiones; `sales_orders` alimenta C (crear ticket desde OV) y reportería (G).
- **Siguiente**: Subsistema C — el formulario de creación pivota en elegir una OV (`/api/sales-orders`) → autocompleta cliente + Orden de Venta.
