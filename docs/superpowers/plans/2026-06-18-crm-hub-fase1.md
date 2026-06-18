# CRM rico en Node — Fase 1: ingesta `crm.*` (8 módulos) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Ingestar 8 módulos de Zoho CRM (Leads, Deals, Tasks, Events, Calls, Products, Quotes, Campaigns) al esquema `crm.*` del hub, vía un motor genérico dirigido por descriptores, solo en el worker.

**Architecture:** Módulo `packages/zoho-sync/src/crmHub/` espejo de `booksHub` pero **genérico**: un array `MODULES` de descriptores (`{table, apiName, fields, toRow}`); un `upsertRow` genérico (INSERT dinámico por las claves de la fila, `ON CONFLICT (id)`); un `createCrmSync` genérico (backfill con `next_page_token`, incremental por `Modified_Time`, `forEachSafe` por-registro y por-módulo). Token CRM propio (`ZohoCRM.modules.READ`). `crm.*` solo en el hub.

**Tech Stack:** TS ESM, Vitest + pg-mem, `pg`. Spec: `docs/superpowers/specs/2026-06-18-crm-hub-fase1-design.md`.

**Contexto verificado:**
- Patrón de referencia: `packages/zoho-sync/src/booksHub/*` (booksClient con refresh+401, migrate por `;`, mappers `num`/`str`, sync con `forEachSafe`, incremental por watermark). `books/booksClient.ts` = patrón exacto del cliente OAuth.
- Worker entrypoint `apps/hub-sync/src/hub-sync.ts` (construye sync/booksHubSync, llama `hubBootstrap` + `scheduleHubSync`). `hubSync.ts` = `hubBootstrap`/`scheduleHubSync`.
- `config.ts` patrón flags. pg-mem soporta esquemas + jsonb (verificado en Books).
- Zoho CRM v8: `GET /crm/v8/{Module}?fields=<csv>&per_page=200&sort_by=Modified_Time&sort_order=desc&page=N` → `{data:[...], info:{more_records, next_page_token}}`. Lookups vienen como `{id, name}`. `fields` es **requerido**. Backfill profundo usa `next_page_token` (page-based topa ~2000).

---

## Task 1: Config CRM + `crmClient` (TDD)

**Files:** Modify `packages/zoho-sync/src/config.ts`, `config.test.ts`; Create `packages/zoho-sync/src/crmHub/crmClient.ts`, `crmClient.test.ts`

- [ ] **Step 1: Test config** — en `config.test.ts` añade:
```ts
  it('CRM: token/flag/domain con defaults y overrides', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    const d = loadConfig(base as any)
    expect(d.syncCrm).toBe(true)
    expect(d.crmRefreshToken).toBe('')
    expect(d.crmApiDomain).toBe('www.zohoapis.com')
    expect(d.crmClientId).toBe('a') // fallback a ZOHO_CLIENT_ID
    const o = loadConfig({ ...base, ZOHO_CRM_REFRESH_TOKEN: 'r', ZOHO_CRM_CLIENT_ID: 'cc', SYNC_CRM: 'false' } as any)
    expect(o.crmRefreshToken).toBe('r'); expect(o.crmClientId).toBe('cc'); expect(o.syncCrm).toBe(false)
  })
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/config.test.ts -t "CRM:"` — FAIL.

- [ ] **Step 3: Implementar config.ts** — añade a `AppConfig`:
```ts
  crmClientId: string
  crmClientSecret: string
  crmRefreshToken: string
  crmApiDomain: string
  crmAccountsDomain: string
  syncCrm: boolean
```
y a `loadConfig`:
```ts
    crmClientId: env.ZOHO_CRM_CLIENT_ID || env.ZOHO_CLIENT_ID || '',
    crmClientSecret: env.ZOHO_CRM_CLIENT_SECRET || env.ZOHO_CLIENT_SECRET || '',
    crmRefreshToken: env.ZOHO_CRM_REFRESH_TOKEN || '',
    crmApiDomain: env.ZOHO_CRM_API_DOMAIN || 'www.zohoapis.com',
    crmAccountsDomain: env.ZOHO_CRM_ACCOUNTS_DOMAIN || env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com',
    syncCrm: env.SYNC_CRM !== 'false',
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/config.test.ts` — PASS.

- [ ] **Step 5: Test crmClient** — `crmHub/crmClient.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { createCrmClient } from './crmClient'
import type { AppConfig } from '../config'

const config = { crmApiDomain: 'www.zohoapis.com', crmAccountsDomain: 'acc.test', crmRefreshToken: 'r', crmClientId: 'c', crmClientSecret: 's' } as AppConfig

describe('crmClient', () => {
  it('adjunta el token y reintenta una vez ante 401', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 't1', expires_in: 3600 }), { status: 200 })) // refresh
      .mockResolvedValueOnce(new Response('nope', { status: 401 })) // call 1 → 401
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 't2', expires_in: 3600 }), { status: 200 })) // refresh forzado
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 })) // retry OK
    const { crmFetch } = createCrmClient({ config, fetchImpl: fetchImpl as any })
    const res = await crmFetch('/Deals?per_page=1')
    expect(res.status).toBe(200)
    const url = (fetchImpl.mock.calls[1][0] as string)
    expect(url).toBe('https://www.zohoapis.com/crm/v8/Deals?per_page=1')
    expect((fetchImpl.mock.calls[1][1] as any).headers.Authorization).toBe('Zoho-oauthtoken t1')
  })
})
```

- [ ] **Step 6: Run** `npx vitest run packages/zoho-sync/src/crmHub/crmClient.test.ts` — FAIL.

- [ ] **Step 7: Implementar `crmClient.ts`** (copia el patrón de `books/booksClient.ts`, cambiando base a `/crm/v8` y el token endpoint):
```ts
import type { AppConfig } from '../config'

export interface CrmClient { crmFetch(path: string, init?: RequestInit): Promise<Response> }
interface Deps { config: AppConfig; fetchImpl?: typeof fetch; now?: () => number }

export function createCrmClient({ config, fetchImpl = fetch, now = () => Date.now() }: Deps): CrmClient {
  const base = `https://${config.crmApiDomain}/crm/v8`
  let token: string | null = null
  let expiresAt = 0
  async function refresh(): Promise<string> {
    const url = `https://${config.crmAccountsDomain}/oauth/v2/token`
    const body = new URLSearchParams({ refresh_token: config.crmRefreshToken, client_id: config.crmClientId, client_secret: config.crmClientSecret, grant_type: 'refresh_token' })
    const res = await fetchImpl(url, { method: 'POST', body })
    if (!res.ok) throw new Error(`Fallo al refrescar token CRM: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) throw new Error(`Token CRM inválido: ${JSON.stringify(data)}`)
    token = data.access_token; expiresAt = now() + ((data.expires_in ?? 3600) - 60) * 1000
    return token
  }
  async function getToken(force = false): Promise<string> { return (!force && token && now() < expiresAt) ? token : refresh() }
  async function call(path: string, init: RequestInit, t: string): Promise<Response> {
    return fetchImpl(`${base}${path}`, { ...init, headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Zoho-oauthtoken ${t}` } })
  }
  return {
    async crmFetch(path: string, init: RequestInit = {}): Promise<Response> {
      let t = await getToken(); let res = await call(path, init, t)
      if (res.status === 401) { t = await getToken(true); res = await call(path, init, t) }
      return res
    },
  }
}
```

- [ ] **Step 8: Run** `npx vitest run packages/zoho-sync/src/crmHub/crmClient.test.ts` — PASS. Luego `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit && npx eslint packages/zoho-sync/src/config.ts packages/zoho-sync/src/crmHub` — sin errores.

- [ ] **Step 9: Commit**
```bash
git add packages/zoho-sync/src/config.ts packages/zoho-sync/src/config.test.ts packages/zoho-sync/src/crmHub/crmClient.ts packages/zoho-sync/src/crmHub/crmClient.test.ts
git commit -m "feat(crmHub): config CRM + crmClient (OAuth refresh + reintento 401)"
```

---

## Task 2: Esquema `crm.*` (8 tablas) + `migrateCrm` (TDD)

**Files:** Create `packages/zoho-sync/src/crmHub/schema-crm.sql`, `migrate.ts`, `migrate.test.ts`

- [ ] **Step 1: Crear `schema-crm.sql`** (PK inline `id`; sin `;` internos; cada tabla = id + columnas clave + raw + modified_time + synced_at):
```sql
CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE IF NOT EXISTS crm.leads (
  id text PRIMARY KEY, company text, first_name text, last_name text, full_name text, email text, phone text, mobile text,
  lead_source text, lead_status text, industry text, city text, pais text, departamento text, cargo text,
  is_converted boolean, converted_deal_id text, converted_deal_name text, owner_id text, owner_name text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.deals (
  id text PRIMARY KEY, deal_name text, amount numeric, stage text, type text, probability numeric, closing_date date,
  expected_revenue numeric, next_step text, account_id text, account_name text, contact_id text, contact_name text,
  owner_id text, owner_name text, numero_ticket numeric, stage_modified_time timestamptz, created_time timestamptz,
  raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.tasks (
  id text PRIMARY KEY, subject text, status text, priority text, due_date date, closed_time timestamptz,
  who_id text, who_name text, what_id text, what_name text, owner_id text, owner_name text, description text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.events (
  id text PRIMARY KEY, event_title text, venue text, start_datetime timestamptz, end_datetime timestamptz, all_day boolean,
  who_id text, who_name text, what_id text, what_name text, owner_id text, owner_name text, meeting_venue text,
  meeting_provider text, description text, created_time timestamptz, raw jsonb, modified_time timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.calls (
  id text PRIMARY KEY, subject text, call_type text, call_purpose text, call_result text, call_start_time timestamptz,
  call_duration_seconds numeric, outgoing_call_status text, dialled_number text, who_id text, who_name text,
  what_id text, what_name text, owner_id text, owner_name text, created_time timestamptz, raw jsonb,
  modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.products (
  id text PRIMARY KEY, product_name text, product_code text, unit_price numeric, product_active boolean, manufacturer text,
  categoria text, posicion numeric, vendor_id text, vendor_name text, owner_id text, owner_name text, description text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.quotes (
  id text PRIMARY KEY, quote_number text, no_cotizacion text, subject text, quote_stage text, valid_till date,
  fecha_cotizacion date, sub_total numeric, tax numeric, discount numeric, grand_total numeric, deal_id text, deal_name text,
  account_id text, account_name text, contact_id text, contact_name text, owner_id text, owner_name text,
  created_time timestamptz, raw jsonb, modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.campaigns (
  id text PRIMARY KEY, campaign_name text, type text, status text, start_date date, end_date date, expected_revenue numeric,
  budgeted_cost numeric, actual_cost numeric, expected_response numeric, num_sent numeric, parent_campaign_id text,
  parent_campaign_name text, owner_id text, owner_name text, description text, created_time timestamptz, raw jsonb,
  modified_time timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Crear `migrate.ts`** (mismo patrón que `booksHub/migrate.ts`):
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Queryable } from '../db/migrate'

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema-crm.sql')

/** Crea el esquema crm.* (idempotente). Solo lo invoca el worker hub-sync. */
export async function migrateCrm(db: Queryable): Promise<void> {
  const sql = readFileSync(schemaPath, 'utf8')
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    try { await db.query(stmt) }
    catch (e) { console.error('migrateCrm: sentencia omitida:', stmt.slice(0, 60), '→', String(e)) }
  }
}
```

- [ ] **Step 3: Test** `migrate.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'

async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg(); const db = new pg.Pool(); await migrate(db); await migrateCrm(db); return db
}

describe('migrateCrm', () => {
  it('crea las 8 tablas del esquema crm', async () => {
    const db = await freshDb()
    for (const t of ['leads', 'deals', 'tasks', 'events', 'calls', 'products', 'quotes', 'campaigns']) {
      expect((await db.query(`SELECT count(*)::int AS n FROM crm.${t}`)).rows[0].n).toBe(0)
    }
  })
})
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/crmHub/migrate.test.ts` — PASS (pg-mem soporta esquemas).

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/crmHub/schema-crm.sql packages/zoho-sync/src/crmHub/migrate.ts packages/zoho-sync/src/crmHub/migrate.test.ts
git commit -m "feat(crmHub): esquema crm.* (8 tablas) + migrateCrm"
```

---

## Task 3: Descriptores de módulo + mappers (`toRow`) (TDD)

**Files:** Create `packages/zoho-sync/src/crmHub/modules.ts`, `modules.test.ts`

- [ ] **Step 1: Test** `modules.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { MODULES, byTable } from './modules'

describe('crm modules', () => {
  it('hay 8 descriptores con table/apiName/fields/toRow', () => {
    expect(MODULES.map((m) => m.table).sort()).toEqual(['calls', 'campaigns', 'deals', 'events', 'leads', 'products', 'quotes', 'tasks'])
    for (const m of MODULES) { expect(m.apiName).toBeTruthy(); expect(m.fields).toContain('Modified_Time'); expect(typeof m.toRow).toBe('function') }
  })
  it('deals.toRow extrae columnas clave, lookups id/name y raw', () => {
    const row = byTable('deals').toRow({ id: '1', Deal_Name: 'OV X', Amount: '500', Stage: 'Won', N_mero_Ticket: '958', Account_Name: { id: 'a1', name: 'Acme' }, Owner: { id: 'o1', name: 'Ana' }, Modified_Time: '2026-06-01T00:00:00Z' })
    expect(row.id).toBe('1'); expect(row.deal_name).toBe('OV X'); expect(row.amount).toBe(500)
    expect(row.account_id).toBe('a1'); expect(row.account_name).toBe('Acme'); expect(row.numero_ticket).toBe(958)
    expect(row.modified_time).toBe('2026-06-01T00:00:00Z'); expect(typeof row.raw).toBe('string')
  })
  it('leads.toRow mapea Full_Name, Converted__s y Converted_Deal lookup', () => {
    const row = byTable('leads').toRow({ id: 'l1', Full_Name: 'Juan Pérez', Converted__s: true, Converted_Deal: { id: 'd9', name: 'D' }, Modified_Time: '2026-01-01T00:00:00Z' })
    expect(row.full_name).toBe('Juan Pérez'); expect(row.is_converted).toBe(true); expect(row.converted_deal_id).toBe('d9')
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/crmHub/modules.test.ts` — FAIL.

- [ ] **Step 3: Crear `modules.ts`** (helpers + 8 descriptores; `toRow` devuelve la fila con `raw` ya stringificado):
```ts
const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)
const str = (v: unknown): string | null => (v != null && v !== '' ? String(v) : null)
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : v == null ? null : v === 'true')
const ts = (v: unknown): string | null => (v ? String(v) : null)
const lkId = (v: any): string | null => (v && typeof v === 'object' ? v.id ?? null : null)
const lkName = (v: any): string | null => (v && typeof v === 'object' ? v.name ?? null : null)
const J = (v: unknown) => JSON.stringify(v ?? null)

export interface CrmModule {
  table: string
  apiName: string
  fields: string  // csv de api_names para el param ?fields=
  toRow: (raw: any) => Record<string, unknown>
}

export const MODULES: CrmModule[] = [
  {
    table: 'leads', apiName: 'Leads',
    fields: 'Company,First_Name,Last_Name,Full_Name,Email,Phone,Mobile,Lead_Source,Lead_Status,Industry,City,Pa_s,Departamento,Cargo,Converted__s,Converted_Deal,Owner,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), company: str(r.Company), first_name: str(r.First_Name), last_name: str(r.Last_Name), full_name: str(r.Full_Name), email: str(r.Email), phone: str(r.Phone), mobile: str(r.Mobile), lead_source: str(r.Lead_Source), lead_status: str(r.Lead_Status), industry: str(r.Industry), city: str(r.City), pais: str(r.Pa_s), departamento: str(r.Departamento), cargo: str(r.Cargo), is_converted: bool(r.Converted__s), converted_deal_id: lkId(r.Converted_Deal), converted_deal_name: lkName(r.Converted_Deal), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'deals', apiName: 'Deals',
    fields: 'Deal_Name,Amount,Stage,Type,Probability,Closing_Date,Expected_Revenue,Next_Step,Account_Name,Contact_Name,Owner,N_mero_Ticket,Stage_Modified_Time,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), deal_name: str(r.Deal_Name), amount: num(r.Amount), stage: str(r.Stage), type: str(r.Type), probability: num(r.Probability), closing_date: r.Closing_Date || null, expected_revenue: num(r.Expected_Revenue), next_step: str(r.Next_Step), account_id: lkId(r.Account_Name), account_name: lkName(r.Account_Name), contact_id: lkId(r.Contact_Name), contact_name: lkName(r.Contact_Name), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), numero_ticket: num(r.N_mero_Ticket), stage_modified_time: ts(r.Stage_Modified_Time), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'tasks', apiName: 'Tasks',
    fields: 'Subject,Status,Priority,Due_Date,Closed_Time,Who_Id,What_Id,Owner,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), subject: str(r.Subject), status: str(r.Status), priority: str(r.Priority), due_date: r.Due_Date || null, closed_time: ts(r.Closed_Time), who_id: lkId(r.Who_Id), who_name: lkName(r.Who_Id), what_id: lkId(r.What_Id), what_name: lkName(r.What_Id), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'events', apiName: 'Events',
    fields: 'Event_Title,Venue,Start_DateTime,End_DateTime,All_day,Who_Id,What_Id,Owner,Meeting_Venue__s,Meeting_Provider__s,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), event_title: str(r.Event_Title), venue: str(r.Venue), start_datetime: ts(r.Start_DateTime), end_datetime: ts(r.End_DateTime), all_day: bool(r.All_day), who_id: lkId(r.Who_Id), who_name: lkName(r.Who_Id), what_id: lkId(r.What_Id), what_name: lkName(r.What_Id), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), meeting_venue: str(r.Meeting_Venue__s), meeting_provider: str(r.Meeting_Provider__s), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'calls', apiName: 'Calls',
    fields: 'Subject,Call_Type,Call_Purpose,Call_Result,Call_Start_Time,Call_Duration_in_seconds,Outgoing_Call_Status,Dialled_Number,Who_Id,What_Id,Owner,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), subject: str(r.Subject), call_type: str(r.Call_Type), call_purpose: str(r.Call_Purpose), call_result: str(r.Call_Result), call_start_time: ts(r.Call_Start_Time), call_duration_seconds: num(r.Call_Duration_in_seconds), outgoing_call_status: str(r.Outgoing_Call_Status), dialled_number: str(r.Dialled_Number), who_id: lkId(r.Who_Id), who_name: lkName(r.Who_Id), what_id: lkId(r.What_Id), what_name: lkName(r.What_Id), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'products', apiName: 'Products',
    fields: 'Product_Name,Product_Code,Unit_Price,Product_Active,Manufacturer,Categor_a,Posici_n,Vendor_Name,Owner,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), product_name: str(r.Product_Name), product_code: str(r.Product_Code), unit_price: num(r.Unit_Price), product_active: bool(r.Product_Active), manufacturer: str(r.Manufacturer), categoria: str(r.Categor_a), posicion: num(r.Posici_n), vendor_id: lkId(r.Vendor_Name), vendor_name: lkName(r.Vendor_Name), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'quotes', apiName: 'Quotes',
    fields: 'Quote_Number,No_Cotizaci_n,Subject,Quote_Stage,Valid_Till,Fecha_de_Cotizaci_n,Sub_Total,Tax,Discount,Grand_Total,Deal_Name,Account_Name,Contact_Name,Owner,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), quote_number: str(r.Quote_Number), no_cotizacion: str(r.No_Cotizaci_n), subject: str(r.Subject), quote_stage: str(r.Quote_Stage), valid_till: r.Valid_Till || null, fecha_cotizacion: r.Fecha_de_Cotizaci_n || null, sub_total: num(r.Sub_Total), tax: num(r.Tax), discount: num(r.Discount), grand_total: num(r.Grand_Total), deal_id: lkId(r.Deal_Name), deal_name: lkName(r.Deal_Name), account_id: lkId(r.Account_Name), account_name: lkName(r.Account_Name), contact_id: lkId(r.Contact_Name), contact_name: lkName(r.Contact_Name), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'campaigns', apiName: 'Campaigns',
    fields: 'Campaign_Name,Type,Status,Start_Date,End_Date,Expected_Revenue,Budgeted_Cost,Actual_Cost,Expected_Response,Num_sent,Parent_Campaign,Owner,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), campaign_name: str(r.Campaign_Name), type: str(r.Type), status: str(r.Status), start_date: r.Start_Date || null, end_date: r.End_Date || null, expected_revenue: num(r.Expected_Revenue), budgeted_cost: num(r.Budgeted_Cost), actual_cost: num(r.Actual_Cost), expected_response: num(r.Expected_Response), num_sent: num(r.Num_sent), parent_campaign_id: lkId(r.Parent_Campaign), parent_campaign_name: lkName(r.Parent_Campaign), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
]

export function byTable(table: string): CrmModule {
  const m = MODULES.find((x) => x.table === table)
  if (!m) throw new Error(`Módulo CRM desconocido: ${table}`)
  return m
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/crmHub/modules.test.ts` — PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/crmHub/modules.ts packages/zoho-sync/src/crmHub/modules.test.ts
git commit -m "feat(crmHub): descriptores de los 8 módulos + mappers toRow"
```

---

## Task 4: Repo genérico (`upsertRow` + `maxModifiedTime`) (TDD)

**Files:** Create `packages/zoho-sync/src/crmHub/repo.ts`, `repo.test.ts`

- [ ] **Step 1: Test** `repo.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { upsertRow, maxModifiedTime } from './repo'
import { byTable } from './modules'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateCrm(db) })

describe('crm repo', () => {
  it('upsertRow inserta y luego actualiza (no duplica) por id', async () => {
    const m = byTable('deals')
    await upsertRow(db, 'deals', m.toRow({ id: 'd1', Deal_Name: 'A', Stage: 'Open', Modified_Time: '2026-06-01T00:00:00Z' }))
    await upsertRow(db, 'deals', m.toRow({ id: 'd1', Deal_Name: 'A', Stage: 'Won', Modified_Time: '2026-06-02T00:00:00Z' }))
    const r = await db.query("SELECT stage FROM crm.deals WHERE id='d1'")
    expect(r.rows.length).toBe(1); expect(r.rows[0].stage).toBe('Won')
  })
  it('maxModifiedTime devuelve la marca de agua', async () => {
    const m = byTable('leads')
    await upsertRow(db, 'leads', m.toRow({ id: 'a', Modified_Time: '2026-01-01T00:00:00Z' }))
    await upsertRow(db, 'leads', m.toRow({ id: 'b', Modified_Time: '2026-03-01T00:00:00Z' }))
    expect(new Date((await maxModifiedTime(db, 'leads'))!).getTime()).toBe(new Date('2026-03-01T00:00:00Z').getTime())
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/crmHub/repo.test.ts` — FAIL.

- [ ] **Step 3: Crear `repo.ts`** (upsert genérico desde las claves de la fila; `crm.<table>` con `table` validado contra MODULES → no es input de usuario):
```ts
import type { Queryable } from '../db/migrate'
import { byTable } from './modules'

/** Upsert genérico en crm.<table> desde un row {col: valor}. `table` se valida contra MODULES (no es input de usuario). */
export async function upsertRow(db: Queryable, table: string, row: Record<string, unknown>): Promise<void> {
  byTable(table) // valida el nombre de tabla (lanza si desconocido)
  const cols = Object.keys(row)
  const placeholders = cols.map((_, i) => `$${i + 1}`)
  const updates = cols.filter((c) => c !== 'id').map((c) => `${c}=EXCLUDED.${c}`)
  const sql = `INSERT INTO crm.${table} (${cols.join(',')},synced_at) VALUES (${placeholders.join(',')},now())
     ON CONFLICT (id) DO UPDATE SET ${updates.join(',')},synced_at=now()`
  await db.query(sql, cols.map((c) => row[c]))
}

export async function maxModifiedTime(db: Queryable, table: string): Promise<string | null> {
  byTable(table)
  const r = await db.query(`SELECT MAX(modified_time) AS m FROM crm.${table}`)
  return r.rows[0]?.m ?? null
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/crmHub/repo.test.ts` — PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/crmHub/repo.ts packages/zoho-sync/src/crmHub/repo.test.ts
git commit -m "feat(crmHub): repo genérico (upsertRow dinámico + maxModifiedTime)"
```

---

## Task 5: Sync genérico (`createCrmSync`) (TDD)

**Files:** Create `packages/zoho-sync/src/crmHub/sync.ts`, `sync.test.ts`

- [ ] **Step 1: Test** `sync.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { createCrmSync } from './sync'
import type { AppConfig } from '../config'

const config = {} as AppConfig
const page = (data: unknown[], more = false, token: string | null = null) =>
  new Response(JSON.stringify({ data, info: { more_records: more, next_page_token: token } }), { status: 200 })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateCrm(db) })

describe('crm sync', () => {
  it('backfill paginando por next_page_token persiste todos', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (!path.startsWith('/Deals')) return Promise.resolve(page([])) // otros módulos vacíos
      if (path.includes('page_token=t2')) return Promise.resolve(page([{ id: 'd2', Deal_Name: 'B', Modified_Time: '2026-06-02T00:00:00Z' }], false))
      return Promise.resolve(page([{ id: 'd1', Deal_Name: 'A', Modified_Time: '2026-06-01T00:00:00Z' }], true, 't2'))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    await sync.backfillAll()
    expect((await db.query('SELECT count(*)::int n FROM crm.deals')).rows[0].n).toBe(2)
  })

  it('un módulo que falla no aborta los demás (resiliencia)', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Deals')) return Promise.resolve(new Response('boom', { status: 500 }))
      if (path.startsWith('/Leads')) return Promise.resolve(page([{ id: 'l1', Full_Name: 'X', Modified_Time: '2026-06-01T00:00:00Z' }], false))
      return Promise.resolve(page([]))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    await expect(sync.syncRecent()).resolves.toBeDefined()
    expect((await db.query('SELECT count(*)::int n FROM crm.leads')).rows[0].n).toBe(1)
  })

  it('incremental solo trae lo más nuevo que la marca de agua', async () => {
    await db.query("INSERT INTO crm.deals (id, modified_time) VALUES ('old','2024-01-01T00:00:00Z')")
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Deals')) return Promise.resolve(page([
        { id: 'new', Deal_Name: 'N', Modified_Time: '2024-06-01T00:00:00Z' },
        { id: 'old', Deal_Name: 'O', Modified_Time: '2024-01-01T00:00:00Z' },
      ], false))
      return Promise.resolve(page([]))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    const r = await sync.syncRecent()
    expect(r.deals).toBe(1)
    expect((await db.query("SELECT 1 FROM crm.deals WHERE id='new'")).rows.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/crmHub/sync.test.ts` — FAIL.

- [ ] **Step 3: Crear `sync.ts`**:
```ts
import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { MODULES, type CrmModule } from './modules'
import { upsertRow, maxModifiedTime } from './repo'

interface Deps { crmFetch: (path: string, init?: RequestInit) => Promise<Response>; db: Queryable; config: AppConfig }
export type CrmCounts = Record<string, number>
export interface CrmSync { backfillAll(): Promise<CrmCounts>; syncRecent(): Promise<CrmCounts> }
const PER_PAGE = 200
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createCrmSync({ crmFetch, db, config }: Deps): CrmSync {
  void config
  async function fetchPage(m: CrmModule, extra: string): Promise<{ data: any[]; info: any }> {
    const res = await crmFetch(`/${m.apiName}?fields=${m.fields}&per_page=${PER_PAGE}&${extra}`)
    if (!res.ok) throw new Error(`CRM /${m.apiName} ${res.status}`)
    const d = await readData(res)
    return { data: d.data ?? [], info: d.info ?? {} }
  }
  async function forEachSafe(items: any[], m: CrmModule): Promise<number> {
    let ok = 0
    for (const r of items) {
      try { await upsertRow(db, m.table, m.toRow(r)); ok++ }
      catch (e: any) { console.error(`crm ${m.table}(${r?.id ?? '?'}) falló:`, String(e?.message ?? e)) }
    }
    return ok
  }
  /** Backfill completo de un módulo vía next_page_token (paginación profunda). */
  async function backfillModule(m: CrmModule): Promise<number> {
    let total = 0, token: string | null = null
    for (;;) {
      const extra = token ? `page_token=${token}&sort_by=Modified_Time&sort_order=desc` : `page=1&sort_by=Modified_Time&sort_order=desc`
      const { data, info } = await fetchPage(m, extra)
      total += await forEachSafe(data, m)
      if (!info.more_records || !info.next_page_token) break
      token = info.next_page_token
    }
    return total
  }
  /** Incremental: descendente por Modified_Time hasta la marca de agua. */
  async function incrementalModule(m: CrmModule): Promise<number> {
    const wmRaw = await maxModifiedTime(db, m.table)
    const wm = wmRaw ? new Date(wmRaw).getTime() : 0
    let count = 0, page = 1
    for (;;) {
      const { data, info } = await fetchPage(m, `page=${page}&sort_by=Modified_Time&sort_order=desc`)
      if (!data.length) break
      const fresh: any[] = []
      let reachedOld = false
      for (const r of data) {
        const t = r.Modified_Time ? new Date(r.Modified_Time).getTime() : 0
        if (wm && t <= wm) { reachedOld = true; break }
        fresh.push(r)
      }
      count += await forEachSafe(fresh, m)
      if (reachedOld || !info.more_records) break
      page++
    }
    return count
  }
  async function runAll(fn: (m: CrmModule) => Promise<number>): Promise<CrmCounts> {
    const counts: CrmCounts = {}
    for (const m of MODULES) {
      try { counts[m.table] = await fn(m) }
      catch (e) { console.error(`crm módulo ${m.table} falló:`, String(e)); counts[m.table] = 0 }
    }
    return counts
  }
  return { backfillAll: () => runAll(backfillModule), syncRecent: () => runAll(incrementalModule) }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/crmHub/sync.test.ts` — PASS.

- [ ] **Step 5:** `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit && npx eslint packages/zoho-sync/src/crmHub` — sin errores (warnings `no-explicit-any` aceptables).

- [ ] **Step 6: Commit**
```bash
git add packages/zoho-sync/src/crmHub/sync.ts packages/zoho-sync/src/crmHub/sync.test.ts
git commit -m "feat(crmHub): sync genérico (backfill page_token + incremental watermark + resiliencia)"
```

---

## Task 6: Cableado en el worker (TDD)

**Files:** Modify `apps/hub-sync/src/hub-sync.ts`, `apps/hub-sync/src/hubSync.ts`, `apps/hub-sync/src/hubSync.test.ts`

- [ ] **Step 1: Test** — en `hubSync.test.ts` añade un mock `crmSync` y verifica que `hubBootstrap` migra crm + backfillea si vacío, y `scheduleHubSync` agenda su timer. Patrón (ajusta a los helpers del archivo):
```ts
import { migrateCrm } from '@ambientalia/zoho-sync/crmHub/migrate'
// dentro del describe de hubBootstrap:
it('migra crm.* y backfillea si está vacío', async () => {
  const pg = newDb().adapters.createPg(); const db = new pg.Pool(); await migrate(db)
  let backfilled = false
  const crmSync = { backfillAll: async () => { backfilled = true; return {} }, syncRecent: async () => ({}) }
  await hubBootstrap({ db, sync: mockSync(), booksHubSync: null, crmSync })
  expect((await db.query("SELECT count(*)::int n FROM crm.deals")).rows[0].n).toBe(0) // crm.* creado
  expect(backfilled).toBe(true)
})
```

- [ ] **Step 2: Run** `npx vitest run apps/hub-sync/src/hubSync.test.ts -t "crm"` — FAIL.

- [ ] **Step 3: Implementar en `hubSync.ts`** — importar y aceptar `crmSync` (opcional, como `booksHubSync`):
```ts
import { migrateCrm } from '@ambientalia/zoho-sync/crmHub/migrate'
import { maxModifiedTime } from '@ambientalia/zoho-sync/crmHub/repo'
import type { CrmSync } from '@ambientalia/zoho-sync/crmHub/sync'
```
`hubBootstrap` deps: añadir `crmSync?: CrmSync | null` (destructurar `= null`). Al final del cuerpo:
```ts
  if (crmSync) {
    await migrateCrm(db)
    if ((await maxModifiedTime(db, 'deals')) == null) {
      console.log('CRM vacío: backfill…')
      await crmSync.backfillAll()
    }
  }
```
`scheduleHubSync` deps: añadir `crmSync?: CrmSync | null` (`= null`) y un timer:
```ts
  if (crmSync) {
    timers.push(setInterval(() => {
      crmSync.syncRecent().catch((e) => console.error('CRM syncRecent falló:', e))
    }, intervalMs))
  }
```

- [ ] **Step 4: Run** `npx vitest run apps/hub-sync/src/hubSync.test.ts` — PASS (los tests existentes siguen compilando porque `crmSync` es opcional).

- [ ] **Step 5: Cablear entrypoint `apps/hub-sync/src/hub-sync.ts`** — tras la construcción de `booksHubSync`:
```ts
import { createCrmClient } from '@ambientalia/zoho-sync/crmHub/crmClient'
import { createCrmSync, type CrmSync } from '@ambientalia/zoho-sync/crmHub/sync'
// …
let crmSync: CrmSync | null = null
if (config.crmRefreshToken && config.syncCrm) {
  const { crmFetch } = createCrmClient({ config })
  crmSync = createCrmSync({ crmFetch, db: pool, config })
  console.log('Sync CRM (crm.*) habilitado')
}
```
y pasar `crmSync` a `hubBootstrap({ … , crmSync })` y `scheduleHubSync({ … , crmSync })`.

- [ ] **Step 6:** `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint .` — sin errores (correr `npm install` si hace falta).

- [ ] **Step 7: Commit**
```bash
git add apps/hub-sync/src/hub-sync.ts apps/hub-sync/src/hubSync.ts apps/hub-sync/src/hubSync.test.ts
git commit -m "feat(crmHub): cableado en worker hub-sync (migrateCrm + backfill-si-vacío + timer)"
```

---

## Task 7: Verificación completa + runbook de despliegue

- [ ] **Step 1:** `npm install && npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)` — todo verde.

- [ ] **Step 2: Commit + push**
```bash
git add -A && git commit -m "chore(crmHub): verificado Fase 1" || true
git push origin main
```
(Dispara rebuild del worker. **Sin `ZOHO_CRM_REFRESH_TOKEN` aún → CRM se queda deshabilitado** y loguea `Sync CRM deshabilitado`; el resto del worker sigue igual. Verifica que arranca.)

- [ ] **Step 3: Generar el refresh token CRM (manual).** En **api-console.zoho.com** → Self Client → Generate Code con scope `ZohoCRM.modules.READ`, duración 10 min, portal correcto → copiar el grant code. Canjearlo (en una terminal, con el mismo client_id/secret del worker):
```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" -d "grant_type=authorization_code" -d "client_id=<CRM_CLIENT_ID>" -d "client_secret=<CRM_CLIENT_SECRET>" -d "code=<GRANT_CODE>"
```
Copiar el `refresh_token` de la respuesta. (Si el client de CRM es el mismo que el de Desk, usar `ZOHO_CLIENT_ID`/`SECRET`.)

- [ ] **Step 4: Setear env + redeploy.** En el worker `zoho-hub-sync` → `ZOHO_CRM_REFRESH_TOKEN=<refresh_token>` (+ `ZOHO_CRM_CLIENT_ID`/`SECRET` si difieren del de Desk) → Redeploy. Al arrancar: `Sync CRM (crm.*) habilitado`, `migrateCrm` crea `crm.*`, backfill-si-vacío ingesta los 8 módulos (page_token).

- [ ] **Step 5: Validar (post-deploy).** En `zoho-hub` → `\c zoho-hub`:
  - `SELECT 'leads' t, count(*) FROM crm.leads UNION ALL SELECT 'deals', count(*) FROM crm.deals UNION ALL SELECT 'tasks', count(*) FROM crm.tasks UNION ALL SELECT 'events', count(*) FROM crm.events UNION ALL SELECT 'calls', count(*) FROM crm.calls UNION ALL SELECT 'products', count(*) FROM crm.products UNION ALL SELECT 'quotes', count(*) FROM crm.quotes UNION ALL SELECT 'campaigns', count(*) FROM crm.campaigns;` → conteos coherentes con CRM.
  - `SELECT id, deal_name, stage, numero_ticket FROM crm.deals WHERE numero_ticket IS NOT NULL LIMIT 5;` → deals con su nº de ticket.
  - Logs del worker: ciclos `CRM syncRecent` sin errores; marca de agua avanza tras un par de ciclos.

- [ ] **Step 6: Actualizar memoria** — CRM Fase 1 en prod (8 módulos en `crm.*`); fases futuras (Accounts/Contacts, custom, líneas de Quotes) y rotación de secretos pendientes.

---

## Notas de cierre
- **Token CRM:** si el grant code se pega directo en la env da `invalid_code` — hay que **canjearlo** primero (lección de Books).
- **Fuera de alcance:** Accounts/Contacts, módulos custom, `Quoted_Items` (líneas), réplica/vistas a desk-db, rotación de secretos.
