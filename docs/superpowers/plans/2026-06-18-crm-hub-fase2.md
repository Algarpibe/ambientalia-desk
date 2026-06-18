# CRM rico en Node — Fase 2: Visitas + líneas de Quotes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Añadir el módulo Visitas (`crm.visits`) y el detalle de líneas de Quotes (`crm.quote_line_items`) a la ingesta CRM existente, sobre el motor genérico `crmHub`.

**Architecture:** Visits = un descriptor más en `MODULES` (el engine genérico lo ingesta por bulk). Líneas de Quotes = marca `hasLines: true` en el descriptor de Quotes; el sync, tras hacer upsert de cada quote, hace `GET /Quotes/{id}` (el subform NO viene en bulk, verificado) y reemplaza `crm.quote_line_items`. Bootstrap pasa a backfill **por-módulo-si-vacío**.

**Tech Stack:** TS ESM, Vitest + pg-mem, `pg`. Spec: `docs/superpowers/specs/2026-06-18-crm-hub-fase2-design.md`.

**Contexto verificado:**
- `crmHub/` (Fase 1): `modules.ts` (helpers privados `num`/`str`/`bool`/`ts`/`lkId`/`lkName`/`J`, `MODULES`, `byTable`), `repo.ts` (`upsertRow`/`maxModifiedTime`), `sync.ts` (`createCrmSync` con `fetchPage`/`forEachSafe`/`backfillModule`/`incrementalModule`/`runAll`, `CrmSync` = `{backfillAll, syncRecent}`), `schema-crm.sql` (8 tablas), `migrate.ts` (`migrateCrm`).
- `apps/hub-sync/src/hubSync.ts` (Fase 1 CRM block): `if (crmSync) { await migrateCrm(db); if ((await maxModifiedTime(db,'deals')) == null) { … crmSync.backfillAll() } }`. (Importa `maxModifiedTime` de crmHub/repo para el gate.)
- Detalle de quote: `GET /crm/v8/Quotes/{id}` → `{ data: [ { …, Quoted_Items: [ {id, Product_Name:{id,name}, Quantity, List_Price, Total, Discount, Total_After_Discount, Tax, Net_Total, Sequence_Number, Price_Book_Name, Line_Tax, Description } ] } ] }`. (`Net_Total` label="Total"; mapear por api_name.) `Parent_Id` de la línea = el quote.

---

## Task 1: Tablas `crm.visits` + `crm.quote_line_items` (TDD)

**Files:** Modify `packages/zoho-sync/src/crmHub/schema-crm.sql`, `packages/zoho-sync/src/crmHub/migrate.test.ts`

- [ ] **Step 1: Añadir a `schema-crm.sql`** (al final; PK inline, sin `;` internos):
```sql
CREATE TABLE IF NOT EXISTS crm.visits (
  id text PRIMARY KEY, visited_by_id text, visited_by_name text, visited_by_module text, visited_time timestamptz,
  visited_page text, visited_page_url text, referrer text, visit_source text, visitor_type text, time_spent numeric,
  no_of_pages numeric, revenue numeric, search_keyword text, search_engine text, attended_by text,
  last_activity_time timestamptz, created_time timestamptz, raw jsonb, modified_time timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.quote_line_items (
  id text PRIMARY KEY, quote_id text, product_id text, product_name text, description text, quantity numeric,
  list_price numeric, total numeric, discount numeric, total_after_discount numeric, tax numeric, net_total numeric,
  sequence_number numeric, price_book_id text, price_book_name text, line_tax jsonb, raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_qli_quote ON crm.quote_line_items (quote_id);
```

- [ ] **Step 2:** en `migrate.test.ts`, extender el array de tablas verificadas para incluir `visits` y `quote_line_items`. Cambiar el `for (const t of [...])` para que incluya: `'leads','deals','tasks','events','calls','products','quotes','campaigns','visits','quote_line_items'`.

- [ ] **Step 3: Run** `npx vitest run packages/zoho-sync/src/crmHub/migrate.test.ts` — FAIL (visits/quote_line_items aún no existen).

- [ ] **Step 4:** confirmar que el Step 1 ya las creó → re-run → PASS. `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit` exit 0.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/crmHub/schema-crm.sql packages/zoho-sync/src/crmHub/migrate.test.ts
git commit -m "feat(crmHub): tablas crm.visits + crm.quote_line_items"
```

---

## Task 2: `replaceQuoteLines` en el repo (TDD)

**Files:** Modify `packages/zoho-sync/src/crmHub/repo.ts`, `packages/zoho-sync/src/crmHub/repo.test.ts`

- [ ] **Step 1: Test** — en `repo.test.ts` añade:
```ts
import { replaceQuoteLines } from './repo'

describe('crm repo - quote lines', () => {
  it('replaceQuoteLines borra previas y deja solo las nuevas', async () => {
    await replaceQuoteLines(db, 'q1', [
      { id: 'l1', quote_id: 'q1', product_name: 'A', quantity: 2, net_total: 20, raw: '{}' },
      { id: 'l2', quote_id: 'q1', product_name: 'B', quantity: 1, net_total: 10, raw: '{}' },
    ])
    await replaceQuoteLines(db, 'q1', [{ id: 'l3', quote_id: 'q1', product_name: 'C', quantity: 1, net_total: 5, raw: '{}' }])
    const r = await db.query("SELECT id FROM crm.quote_line_items WHERE quote_id='q1' ORDER BY id")
    expect(r.rows.map((x: any) => x.id)).toEqual(['l3'])
  })
})
```
(El `beforeEach` del archivo ya hace `migrate` + `migrateCrm`, que ahora crean `crm.quote_line_items`.)

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/crmHub/repo.test.ts -t "quote lines"` — FAIL.

- [ ] **Step 3: Implementar en `repo.ts`** (insert directo por fila — `quote_line_items` NO es un módulo, así que no usa `upsertRow`/`byTable`; el replace por `quote_id` evita conflictos de PK):
```ts
/** Reemplaza TODAS las líneas de un quote (DELETE por quote_id + insert de cada fila). Cada `row` = {col: valor}. */
export async function replaceQuoteLines(db: Queryable, quoteId: string, rows: Record<string, unknown>[]): Promise<void> {
  await db.query('DELETE FROM crm.quote_line_items WHERE quote_id=$1', [quoteId])
  for (const row of rows) {
    const cols = Object.keys(row)
    const placeholders = cols.map((_, i) => `$${i + 1}`)
    await db.query(
      `INSERT INTO crm.quote_line_items (${cols.join(',')},synced_at) VALUES (${placeholders.join(',')},now())`,
      cols.map((c) => row[c]),
    )
  }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/crmHub/repo.test.ts` — PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/crmHub/repo.ts packages/zoho-sync/src/crmHub/repo.test.ts
git commit -m "feat(crmHub): replaceQuoteLines (crm.quote_line_items)"
```

---

## Task 3: Descriptor Visits + `quoteLineRow` + marca `hasLines` (TDD)

**Files:** Modify `packages/zoho-sync/src/crmHub/modules.ts`, `packages/zoho-sync/src/crmHub/modules.test.ts`

- [ ] **Step 1: Test** — en `modules.test.ts` añade:
```ts
import { quoteLineRow } from './modules'

describe('crm modules - fase 2', () => {
  it('existe el descriptor visits con hasLines ausente', () => {
    const v = byTable('visits')
    expect(v.apiName).toBe('Visits'); expect(v.fields).toContain('Visited_Time'); expect(v.hasLines).toBeFalsy()
    const row = v.toRow({ id: 'v1', Visited_By: { id: 'c1', name: 'Cli', module: { api_name: 'Contacts' } }, Visited_Time: '2026-06-01T00:00:00Z', Time_Spent: '12', Modified_Time: '2026-06-01T00:00:00Z' })
    expect(row.id).toBe('v1'); expect(row.visited_by_id).toBe('c1'); expect(row.visited_by_module).toBe('Contacts'); expect(row.time_spent).toBe(12)
  })
  it('quotes tiene hasLines=true', () => { expect(byTable('quotes').hasLines).toBe(true) })
  it('quoteLineRow mapea la línea del subform', () => {
    const r = quoteLineRow('q1', { id: 'l1', Product_Name: { id: 'p1', name: 'Filtro' }, Quantity: '2', List_Price: '10', Net_Total: '20', Discount: '0', Sequence_Number: 1 })
    expect(r.id).toBe('l1'); expect(r.quote_id).toBe('q1'); expect(r.product_id).toBe('p1'); expect(r.product_name).toBe('Filtro')
    expect(r.quantity).toBe(2); expect(r.net_total).toBe(20); expect(typeof r.raw).toBe('string')
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/crmHub/modules.test.ts -t "fase 2"` — FAIL.

- [ ] **Step 3: Implementar en `modules.ts`:**
  - Añade `hasLines?: boolean` a la interfaz `CrmModule`.
  - Añade el helper de lookup de módulo (junto a `lkId`/`lkName`):
```ts
const lkModule = (v: any): string | null => (v && typeof v === 'object' ? (v.module?.api_name ?? (typeof v.module === 'string' ? v.module : null)) : null)
```
  - Marca `hasLines: true` en el descriptor de `quotes` (añade la propiedad al objeto del módulo quotes).
  - Añade el descriptor `visits` al array `MODULES`:
```ts
  {
    table: 'visits', apiName: 'Visits',
    fields: 'Visited_By,Visited_Time,Visited_Page,Visited_Page_URL,Referrer,Visit_Source,Visitor_Type,Time_Spent,No_of_Pages,Revenue,Search_Keyword,Search_Engine,Attended_By,Last_Activity_Time,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), visited_by_id: lkId(r.Visited_By), visited_by_name: lkName(r.Visited_By), visited_by_module: lkModule(r.Visited_By), visited_time: ts(r.Visited_Time), visited_page: str(r.Visited_Page), visited_page_url: str(r.Visited_Page_URL), referrer: str(r.Referrer), visit_source: str(r.Visit_Source), visitor_type: str(r.Visitor_Type), time_spent: num(r.Time_Spent), no_of_pages: num(r.No_of_Pages), revenue: num(r.Revenue), search_keyword: str(r.Search_Keyword), search_engine: str(r.Search_Engine), attended_by: str(r.Attended_By), last_activity_time: ts(r.Last_Activity_Time), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
```
  - Añade el mapper exportado `quoteLineRow` (pura; sin import de repo):
```ts
/** Mapea una línea del subform Quoted_Items → fila de crm.quote_line_items. */
export function quoteLineRow(quoteId: string, r: any): Record<string, unknown> {
  return { id: String(r.id), quote_id: quoteId, product_id: lkId(r.Product_Name), product_name: lkName(r.Product_Name), description: str(r.Description), quantity: num(r.Quantity), list_price: num(r.List_Price), total: num(r.Total), discount: num(r.Discount), total_after_discount: num(r.Total_After_Discount), tax: num(r.Tax), net_total: num(r.Net_Total), sequence_number: num(r.Sequence_Number), price_book_id: lkId(r.Price_Book_Name), price_book_name: lkName(r.Price_Book_Name), line_tax: J(r.Line_Tax), raw: J(r) }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/crmHub/modules.test.ts` — PASS. Verificar que las claves de `quoteLineRow` coinciden con las columnas de `crm.quote_line_items` (Task 1) y las de `visits.toRow` con `crm.visits`.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/crmHub/modules.ts packages/zoho-sync/src/crmHub/modules.test.ts
git commit -m "feat(crmHub): descriptor Visits + quoteLineRow + marca hasLines en Quotes"
```

---

## Task 4: Sync — detalle de líneas + `backfillIfEmpty` (TDD)

**Files:** Modify `packages/zoho-sync/src/crmHub/sync.ts`, `packages/zoho-sync/src/crmHub/sync.test.ts`

- [ ] **Step 1: Test** — en `sync.test.ts` añade:
```ts
  it('Quotes (hasLines) hace GET detalle y persiste las líneas', async () => {
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Quotes/q1')) return Promise.resolve(new Response(JSON.stringify({ data: [{ id: 'q1', Quoted_Items: [{ id: 'l1', Product_Name: { id: 'p1', name: 'X' }, Quantity: 2, Net_Total: 20 }] }] }), { status: 200 }))
      if (path.startsWith('/Quotes')) return Promise.resolve(page([{ id: 'q1', Subject: 'Q', Modified_Time: '2026-06-01T00:00:00Z' }], false))
      return Promise.resolve(page([]))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    await sync.backfillAll()
    expect((await db.query('SELECT count(*)::int n FROM crm.quotes')).rows[0].n).toBe(1)
    expect((await db.query("SELECT product_name FROM crm.quote_line_items WHERE quote_id='q1'")).rows[0].product_name).toBe('X')
  })

  it('backfillIfEmpty solo backfillea módulos vacíos', async () => {
    await db.query("INSERT INTO crm.deals (id, modified_time) VALUES ('d0','2024-01-01T00:00:00Z')") // deals NO vacío
    const crmFetch = vi.fn().mockImplementation((path: string) => {
      if (path.startsWith('/Visits')) return Promise.resolve(page([{ id: 'v1', Visited_Time: '2026-06-01T00:00:00Z', Modified_Time: '2026-06-01T00:00:00Z' }], false))
      return Promise.resolve(page([]))
    })
    const sync = createCrmSync({ crmFetch: crmFetch as any, db, config })
    const counts = await sync.backfillIfEmpty()
    expect(counts.deals).toBe(0) // ya tenía datos → no se backfillea
    expect((await db.query('SELECT count(*)::int n FROM crm.visits')).rows[0].n).toBe(1) // vacía → backfilled
    expect(crmFetch.mock.calls.some((c) => (c[0] as string).startsWith('/Deals'))).toBe(false) // deals no se consultó
  })
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/crmHub/sync.test.ts -t "hasLines"` — FAIL.

- [ ] **Step 3: Implementar en `sync.ts`:**
  - Imports: añade `import { upsertRow, maxModifiedTime } from './repo'` → cambia a `import { upsertRow, maxModifiedTime, replaceQuoteLines } from './repo'`; y `import { MODULES, type CrmModule } from './modules'` → añade `quoteLineRow`: `import { MODULES, quoteLineRow, type CrmModule } from './modules'`.
  - Dentro de `createCrmSync`, antes de `forEachSafe`, añade:
```ts
  /** Para módulos con hasLines (Quotes): trae el detalle (el subform NO viene en bulk) y reemplaza las líneas. */
  async function persistLines(record: any): Promise<void> {
    const res = await crmFetch(`/Quotes/${record.id}`)
    if (!res.ok) throw new Error(`CRM /Quotes/${record.id} ${res.status}`)
    const d = await readData(res)
    const rec = d.data?.[0] ?? {}
    const lines = (rec.Quoted_Items ?? []).map((l: any) => quoteLineRow(String(record.id), l))
    await replaceQuoteLines(db, String(record.id), lines)
  }
```
  - En `forEachSafe`, dentro del `try`, tras `upsertRow(...)`:
```ts
      try { await upsertRow(db, m.table, m.toRow(r)); if (m.hasLines) await persistLines(r); ok++ }
```
  - Añade `backfillIfEmpty` (y exponla):
```ts
  async function backfillIfEmpty(): Promise<CrmCounts> {
    const counts: CrmCounts = {}
    for (const m of MODULES) {
      try { counts[m.table] = (await maxModifiedTime(db, m.table)) == null ? await backfillModule(m) : 0 }
      catch (e) { console.error(`crm backfillIfEmpty ${m.table} falló:`, String(e)); counts[m.table] = 0 }
    }
    return counts
  }
```
  - En la interfaz `CrmSync` añade `backfillIfEmpty(): Promise<CrmCounts>` y en el `return` final añade `backfillIfEmpty`.

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/crmHub/sync.test.ts` — PASS (incl. los tests de Fase 1).

- [ ] **Step 5:** `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit && npx eslint packages/zoho-sync/src/crmHub` — sin errores.

- [ ] **Step 6: Commit**
```bash
git add packages/zoho-sync/src/crmHub/sync.ts packages/zoho-sync/src/crmHub/sync.test.ts
git commit -m "feat(crmHub): detalle de líneas de Quotes (hasLines) + backfillIfEmpty por-módulo"
```

---

## Task 5: Bootstrap por-módulo + verificación + runbook

**Files:** Modify `apps/hub-sync/src/hubSync.ts`, `apps/hub-sync/src/hubSync.test.ts`

- [ ] **Step 1: Cambiar el bloque CRM de `hubBootstrap`** en `hubSync.ts` — reemplazar el gate por-deals por `backfillIfEmpty`:
```ts
  if (crmSync) {
    await migrateCrm(db)
    await crmSync.backfillIfEmpty()
  }
```
  Y **quitar** el import ahora innecesario `import { maxModifiedTime } from '@ambientalia/zoho-sync/crmHub/repo'` (ya no se usa en hubSync; `backfillIfEmpty` lo hace internamente). Mantener `migrateCrm` y `type CrmSync`.

- [ ] **Step 2: Ajustar el test** en `hubSync.test.ts` — el mock `crmSync` ahora necesita `backfillIfEmpty` (en vez de/ además de `backfillAll`). Cambiar el mock a `{ backfillAll: async()=>({}), syncRecent: async()=>({}), backfillIfEmpty: async()=>({}) }` y, en el test que verifica el backfill, comprobar que se llamó `backfillIfEmpty` (p. ej. con un flag o `vi.fn()`). Mantener la verificación de que `crm.deals` existe (migrateCrm corrió).

- [ ] **Step 3: Run** `npx vitest run apps/hub-sync/src/hubSync.test.ts` — PASS.

- [ ] **Step 4: Verificación completa** — `npm install && npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)` — todo verde.

- [ ] **Step 5: Commit + push**
```bash
git add apps/hub-sync/src/hubSync.ts apps/hub-sync/src/hubSync.test.ts
git commit -m "feat(crmHub): bootstrap backfill por-módulo-si-vacío (Visits auto-backfill)"
git push origin main
```
(Dispara rebuild del worker. Al arrancar: `migrateCrm` crea `crm.visits`/`crm.quote_line_items`; `backfillIfEmpty` backfillea `crm.visits` (nueva). Quotes NO se re-backfillea aún → sus líneas vienen en el Step 6.)

- [ ] **Step 6: Runbook one-time — poblar líneas de Quotes existentes.** En `zoho-hub` → `\c zoho-hub`:
```
TRUNCATE crm.quotes;
TRUNCATE crm.quote_line_items;
```
Luego **reiniciar** el worker `zoho-hub-sync` (Restart/Redeploy) → `backfillIfEmpty` ve `crm.quotes` vacío → re-backfillea Quotes, y ahora `persistLines` (hasLines) hace `GET /Quotes/{id}` por cada uno (~2.872 detalles) y llena `crm.quote_line_items`. (Resiliente: un detalle que falle no aborta el lote.)

- [ ] **Step 7: Validar.** En `zoho-hub`:
  - `SELECT count(*) FROM crm.visits;` y `SELECT count(*) FROM crm.quote_line_items;` → > 0 (visits según CRM; líneas para los quotes que las tengan).
  - Join: `SELECT q.id, q.subject, count(li.id) AS lineas FROM crm.quotes q LEFT JOIN crm.quote_line_items li ON li.quote_id=q.id GROUP BY 1,2 ORDER BY lineas DESC LIMIT 5;` → quotes con su nº de líneas.
  - Logs del worker: sin errores de `CRM /Quotes/{id}` repetidos; ciclos incrementales OK.

- [ ] **Step 8: Actualizar memoria** — CRM Fase 2 en prod (Visits + líneas de Quotes); bootstrap per-módulo.

---

## Notas de cierre
- **Líneas vía detalle (N+1):** verificado que el subform `Quoted_Items` no viene en bulk; el detalle por quote es necesario (espejo de Books). El incremental solo trae detalle de quotes que cambian.
- **Fuera de alcance:** Accounts/Contacts, módulos custom, réplica a desk-db, rotación de secretos.
