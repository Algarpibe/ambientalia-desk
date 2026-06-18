# Books rico en Node — Parte B: Derivación `sales_records` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).
> **Depende de la Parte A** (`2026-06-18-books-rico-node-A-ingesta.md`): el esquema `books.*` debe estar poblado por Node.

**Goal:** Que `zoho-hub-sync` (Node) reemplace el workflow n8n "Transform to sales_records": agrega desde `books.*` del hub y escribe `sales_records` en la BD de sales-tracker, diariamente.

**Architecture:** Módulo `packages/zoho-sync/src/booksHub/salesRecords.ts`. Lee `books.*` del hub con la query SQL **copiada literal** del workflow probado; escribe en sales-tracker (segunda conexión) con wipe + upsert dentro de **una transacción**. Programado diario a `SALES_RECORDS_HOUR` (default 5) + una corrida al arranque. Solo en el worker.

**Tech Stack:** TypeScript ESM, Vitest, `pg`. Spec: `docs/superpowers/specs/2026-06-18-books-rico-node-design.md`.

**Contexto verificado (esquema sales-tracker):**
- `sales_records`: `id uuid PK (default)`, `company_id uuid`, `category_id uuid`, `record_type record_type(enum)`, `amount_usd numeric`, `record_month int`, `record_year int`, `notes`, `created_by/updated_by`, `created_at/updated_at`. Único: `(company_id, category_id, record_type, record_month, record_year)`.
- `categories`: `id uuid`, `company_id uuid`, `name text`, … El upsert mapea `lower(name)=lower(category_name)` → `company_id`+`category_id`.
- enum `record_type`: `SALES_ORDER`, `INVOICE`, `BACKLOG`.
- Conexión: `SALES_TRACKER_DATABASE_URL` (host interno `ambientalia_project_sales-tracker-db:5432`, base `sales_tracker`).
- `config.ts`: patrón flags `env.X !== 'false'`; `createPool(config)` usa `config.databaseUrl`.

---

## Task 1: Config (URL + flag + hora) (TDD)

**Files:** Modify `packages/zoho-sync/src/config.ts`, `packages/zoho-sync/src/config.test.ts`

- [ ] **Step 1: Test** — en `config.test.ts`, añade:
```ts
  it('deriveSalesRecords/url/hora con defaults y overrides', () => {
    const base = { ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c', ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'u' }
    const def = loadConfig(base as any)
    expect(def.deriveSalesRecords).toBe(true)
    expect(def.salesTrackerDatabaseUrl).toBe('')
    expect(def.salesRecordsHour).toBe(5)
    const ov = loadConfig({ ...base, DERIVE_SALES_RECORDS: 'false', SALES_TRACKER_DATABASE_URL: 'postgres://x', SALES_RECORDS_HOUR: '7' } as any)
    expect(ov.deriveSalesRecords).toBe(false)
    expect(ov.salesTrackerDatabaseUrl).toBe('postgres://x')
    expect(ov.salesRecordsHour).toBe(7)
  })
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/config.test.ts -t "deriveSalesRecords"` — FAIL.

- [ ] **Step 3: Implementar** — en la interfaz `AppConfig` añade:
```ts
  salesTrackerDatabaseUrl: string
  deriveSalesRecords: boolean
  salesRecordsHour: number
```
y en `loadConfig` (junto a los flags de sync):
```ts
    salesTrackerDatabaseUrl: env.SALES_TRACKER_DATABASE_URL || '',
    deriveSalesRecords: env.DERIVE_SALES_RECORDS !== 'false',
    salesRecordsHour: env.SALES_RECORDS_HOUR ? Number(env.SALES_RECORDS_HOUR) : 5,
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/config.test.ts` — PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/config.ts packages/zoho-sync/src/config.test.ts
git commit -m "feat(salesRecords): config URL sales-tracker + flag + hora"
```

---

## Task 2: Programador diario (función pura + scheduler) (TDD)

**Files:**
- Create: `packages/zoho-sync/src/booksHub/schedule.ts`
- Create: `packages/zoho-sync/src/booksHub/schedule.test.ts`

- [ ] **Step 1: Test** `schedule.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { msUntilNextRun, scheduleDailyAt } from './schedule'

describe('msUntilNextRun', () => {
  it('si aún no pasó la hora hoy, apunta a hoy', () => {
    const now = new Date('2026-06-18T03:00:00')
    expect(msUntilNextRun(5, now)).toBe(2 * 3600 * 1000)
  })
  it('si ya pasó la hora, apunta a mañana', () => {
    const now = new Date('2026-06-18T06:00:00')
    expect(msUntilNextRun(5, now)).toBe(23 * 3600 * 1000)
  })
})

describe('scheduleDailyAt', () => {
  afterEach(() => vi.useRealTimers())
  it('ejecuta la tarea cuando llega la hora y stop() la cancela', async () => {
    vi.useFakeTimers({ now: new Date('2026-06-18T04:59:59') })
    const task = vi.fn().mockResolvedValue(undefined)
    const stop = scheduleDailyAt(5, task)
    await vi.advanceTimersByTimeAsync(1000)
    expect(task).toHaveBeenCalledTimes(1)
    stop()
    await vi.advanceTimersByTimeAsync(24 * 3600 * 1000)
    expect(task).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/booksHub/schedule.test.ts` — FAIL.

- [ ] **Step 3: Crear `schedule.ts`**:
```ts
/** ms desde `now` hasta la próxima ocurrencia de `hour`:00 local (hoy si aún no pasó, si no mañana). */
export function msUntilNextRun(hour: number, now: Date): number {
  const next = new Date(now)
  next.setHours(hour, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

/** Programa `task` cada día a `hour`:00. Devuelve stop() que cancela el próximo disparo. */
export function scheduleDailyAt(hour: number, task: () => Promise<void>): () => void {
  let timer: ReturnType<typeof setTimeout>
  let stopped = false
  function arm() {
    if (stopped) return
    timer = setTimeout(async () => {
      try { await task() } catch (e) { console.error('Job diario falló:', e) }
      arm()
    }, msUntilNextRun(hour, new Date()))
  }
  arm()
  return () => { stopped = true; clearTimeout(timer) }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/booksHub/schedule.test.ts` — PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/zoho-sync/src/booksHub/schedule.ts packages/zoho-sync/src/booksHub/schedule.test.ts
git commit -m "feat(salesRecords): programador diario (msUntilNextRun + scheduleDailyAt)"
```

---

## Task 3: `deriveSalesRecords` (agregación + wipe/upsert transaccional) (TDD)

**Files:**
- Create: `packages/zoho-sync/src/booksHub/salesRecords.ts`
- Create: `packages/zoho-sync/src/booksHub/salesRecords.test.ts`

- [ ] **Step 1: Test** `salesRecords.test.ts` (usa un `Queryable` espía → verifica secuencia transaccional + parámetros exactos del upsert; evita que pg-mem corra el enum/SQL gigante):
```ts
import { describe, it, expect } from 'vitest'
import { deriveSalesRecords, type AggRow } from './salesRecords'
import type { Queryable } from '../db/migrate'

function recorder(failOn?: string) {
  const calls: { verb: string; params?: unknown[] }[] = []
  const q: Queryable = {
    query: async (sql: string, params?: unknown[]) => {
      const verb = sql.trim().split(/\s+/)[0].toUpperCase()
      calls.push({ verb, params })
      if (failOn && verb === failOn) throw new Error('boom')
      return { rows: [] }
    },
  }
  return { q, calls }
}
const agg: AggRow[] = [{ category_name: 'Repuestos', record_type: 'INVOICE', record_month: 6, record_year: 2026, amount_usd: 1234.5 }]

describe('deriveSalesRecords', () => {
  it('hace BEGIN → DELETE → INSERT(params) → COMMIT', async () => {
    const st = recorder()
    const r = await deriveSalesRecords({ hub: {} as Queryable, salesTracker: st.q, aggregate: async () => agg })
    expect(r.rows).toBe(1)
    expect(st.calls.map((c) => c.verb)).toEqual(['BEGIN', 'DELETE', 'INSERT', 'COMMIT'])
    expect(st.calls[2].params).toEqual(['INVOICE', 1234.5, 6, 2026, 'Repuestos'])
  })

  it('si falla un INSERT hace ROLLBACK y propaga', async () => {
    const st = recorder('INSERT')
    await expect(deriveSalesRecords({ hub: {} as Queryable, salesTracker: st.q, aggregate: async () => agg })).rejects.toThrow('boom')
    expect(st.calls.map((c) => c.verb)).toEqual(['BEGIN', 'DELETE', 'INSERT', 'ROLLBACK'])
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/booksHub/salesRecords.test.ts` — FAIL.

- [ ] **Step 3: Crear `salesRecords.ts`** (la query de agregación es **copia literal** del workflow n8n probado en prod):
```ts
import type { Queryable } from '../db/migrate'

export interface AggRow { category_name: string; record_type: string; record_month: number; record_year: number; amount_usd: number }

/** Agregación desde books.* (copiada literal del workflow n8n "Transform to sales_records"). */
export const AGGREGATE_SQL = `WITH ord AS (
  SELECT s.salesorder_id, s.date, (s.raw->>'invoiced_status') st, sum(l.bcy_rate*l.quantity) gross
  FROM books.salesorder_line_items l JOIN books.sales_orders s ON s.salesorder_id=l.salesorder_id
  WHERE s.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND s.status NOT IN ('void','draft')
  GROUP BY 1,2,3
),
oi AS (
  SELECT i.salesorder_id, sum(li.bcy_rate*li.quantity) inv
  FROM books.invoice_line_items li JOIN books.invoices i ON i.invoice_id=li.invoice_id
  WHERE i.salesorder_id IS NOT NULL AND i.salesorder_id<>'' AND li.bcy_rate IS NOT NULL AND i.status NOT IN ('void','draft')
  GROUP BY 1
),
frac AS (
  SELECT o.salesorder_id, o.date,
    CASE WHEN o.st='not_invoiced' THEN 1
         WHEN o.st='partially_invoiced' AND o.gross>0 THEN greatest(0,(o.gross-coalesce(oi.inv,0))/o.gross)
         ELSE 0 END f
  FROM ord o LEFT JOIN oi ON oi.salesorder_id=o.salesorder_id
),
lines AS (
  SELECT it.category_name cat,'INVOICE' rt, extract(year from i.date)::int yy, extract(month from i.date)::int mm,
    l.bcy_rate*l.quantity * COALESCE(1 - COALESCE((i.raw->>'bcy_discount_total')::numeric,0)/NULLIF(i.bcy_sub_total,0),1) amt
  FROM books.invoice_line_items l JOIN books.invoices i ON i.invoice_id=l.invoice_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE i.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND i.status NOT IN ('void','draft')
  UNION ALL
  SELECT it.category_name,'SALES_ORDER', extract(year from s.date)::int, extract(month from s.date)::int,
    l.bcy_rate*l.quantity * COALESCE(1 - COALESCE((s.raw->>'bcy_discount_total')::numeric,0)/NULLIF(s.bcy_sub_total,0),1)
  FROM books.salesorder_line_items l JOIN books.sales_orders s ON s.salesorder_id=l.salesorder_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE s.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND s.status NOT IN ('void','draft')
  UNION ALL
  SELECT it.category_name,'BACKLOG', extract(year from f.date)::int, extract(month from f.date)::int,
    l.bcy_rate*l.quantity * f.f
  FROM books.salesorder_line_items l JOIN frac f ON f.salesorder_id=l.salesorder_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE l.bcy_rate IS NOT NULL AND f.f > 0
)
SELECT cat AS category_name, rt AS record_type, mm AS record_month, yy AS record_year, round(sum(amt),2) AS amount_usd
FROM lines WHERE cat IS NOT NULL GROUP BY cat, rt, mm, yy`

const UPSERT_SQL = `INSERT INTO sales_records (company_id, category_id, record_type, amount_usd, record_month, record_year)
SELECT c.company_id, c.id, $1::record_type, $2::numeric, $3::int, $4::int
FROM categories c WHERE lower(c.name)=lower($5)
ON CONFLICT (company_id, category_id, record_type, record_month, record_year)
DO UPDATE SET amount_usd=EXCLUDED.amount_usd, updated_at=now()`

export async function runAggregate(hub: Queryable): Promise<AggRow[]> {
  const r = await hub.query(AGGREGATE_SQL)
  return r.rows as AggRow[]
}

/**
 * Reemplaza el workflow n8n: agrega books.* (hub) y reescribe sales_records (sales-tracker) en una transacción.
 * `salesTracker` DEBE ser una conexión única (un client de pool), no el pool, para que BEGIN/COMMIT sean atómicos.
 */
export async function deriveSalesRecords(deps: {
  hub: Queryable
  salesTracker: Queryable
  aggregate?: (hub: Queryable) => Promise<AggRow[]>
}): Promise<{ rows: number }> {
  const { hub, salesTracker, aggregate = runAggregate } = deps
  const rows = await aggregate(hub)
  await salesTracker.query('BEGIN')
  try {
    await salesTracker.query('DELETE FROM sales_records WHERE record_year >= 2020')
    for (const r of rows) {
      await salesTracker.query(UPSERT_SQL, [r.record_type, r.amount_usd, r.record_month, r.record_year, r.category_name])
    }
    await salesTracker.query('COMMIT')
  } catch (e) {
    await salesTracker.query('ROLLBACK')
    throw e
  }
  return { rows: rows.length }
}
```

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/booksHub/salesRecords.test.ts` — PASS.

- [ ] **Step 5:** Run `npx tsc -p packages/zoho-sync/tsconfig.json --noEmit && npx eslint packages/zoho-sync/src/booksHub/salesRecords.ts packages/zoho-sync/src/booksHub/salesRecords.test.ts` — sin errores.

- [ ] **Step 6: Commit**
```bash
git add packages/zoho-sync/src/booksHub/salesRecords.ts packages/zoho-sync/src/booksHub/salesRecords.test.ts
git commit -m "feat(salesRecords): derivación books.* → sales_records (transaccional, paridad n8n)"
```

---

## Task 4: Cableado en el worker (segundo pool + arranque + diario)

**Files:**
- Modify: `packages/zoho-sync/src/db/pool.ts`, `packages/zoho-sync/src/db/pool.test.ts` (crear si no existe)
- Modify: `apps/hub-sync/src/hub-sync.ts` (entrypoint)

- [ ] **Step 1: Test** `pool.test.ts` (helper para crear pool desde URL arbitraria):
```ts
import { describe, it, expect } from 'vitest'
import { createPoolFromUrl } from './pool'

describe('createPoolFromUrl', () => {
  it('crea un Pool con la connectionString dada', () => {
    const p = createPoolFromUrl('postgres://u:p@h:5432/db')
    expect(p).toBeTruthy()
    expect(typeof (p as any).query).toBe('function')
    return p.end()
  })
})
```

- [ ] **Step 2: Run** `npx vitest run packages/zoho-sync/src/db/pool.test.ts` — FAIL.

- [ ] **Step 3: Implementar en `pool.ts`**:
```ts
export function createPoolFromUrl(connectionString: string): Pool {
  return new Pool({ connectionString })
}
```
(Mantener `createPool(config)` como está.)

- [ ] **Step 4: Run** `npx vitest run packages/zoho-sync/src/db/pool.test.ts` — PASS.

- [ ] **Step 5: Cablear `apps/hub-sync/src/hub-sync.ts`** — añade imports y, tras `scheduleHubSync(...)`, el arranque + diario de la derivación:
```ts
import { createPoolFromUrl } from '@ambientalia/zoho-sync/db/pool'
import { deriveSalesRecords } from '@ambientalia/zoho-sync/booksHub/salesRecords'
import { scheduleDailyAt } from '@ambientalia/zoho-sync/booksHub/schedule'
// … dentro de main(), después de scheduleHubSync:
if (config.deriveSalesRecords && config.salesTrackerDatabaseUrl) {
  const stPool = createPoolFromUrl(config.salesTrackerDatabaseUrl)
  const runDerivation = async () => {
    const client = await stPool.connect()
    try {
      const { rows } = await deriveSalesRecords({ hub: pool, salesTracker: client })
      console.log(`sales_records derivado: ${rows} filas`)
    } finally { client.release() }
  }
  await runDerivation().catch((e) => console.error('Derivación inicial sales_records falló:', e))
  scheduleDailyAt(config.salesRecordsHour, runDerivation)
  console.log(`Derivación sales_records habilitada (diaria ${config.salesRecordsHour}:00)`)
} else {
  console.log('Derivación sales_records deshabilitada (falta SALES_TRACKER_DATABASE_URL o DERIVE_SALES_RECORDS=false)')
}
```

- [ ] **Step 6:** Run `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint .` — sin errores.

- [ ] **Step 7: Commit**
```bash
git add packages/zoho-sync/src/db/pool.ts packages/zoho-sync/src/db/pool.test.ts apps/hub-sync/src/hub-sync.ts
git commit -m "feat(salesRecords): cableado en worker (pool sales-tracker + diario + arranque)"
```

---

## Task 5: Verificación completa + cutover/runbook

- [ ] **Step 1:** Run `npm install && npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)`
Expected: tests PASS; ambos tsc exit 0; eslint 0 errores; build OK.

- [ ] **Step 2: Configurar env del worker `zoho-hub-sync` en EasyPanel** (antes de pushear, o justo después): `SALES_TRACKER_DATABASE_URL=postgres://postgres:<pwd>@ambientalia_project_sales-tracker-db:5432/sales_tracker?sslmode=disable`. Opcional `SALES_RECORDS_HOUR`.

- [ ] **Step 3: Push**
```bash
git push origin main
```
(Dispara rebuild del worker. Al arrancar corre `runDerivation()` una vez + agenda diaria.)

- [ ] **Step 4: Validar paridad (post-deploy).** En logs de `zoho-hub-sync`: `Derivación sales_records habilitada` y `sales_records derivado: N filas` sin error. En `sales_tracker`: `SELECT record_type, count(*), round(sum(amount_usd),2) FROM sales_records GROUP BY 1 ORDER BY 1;` — comparar contra lo que dejó n8n (mismos tipos/sumas, salvo cambios por datos nuevos ya sincronizados). Si cuadra → paridad confirmada.

- [ ] **Step 5: Retirar n8n.** Confirmado el cutover, archivar/eliminar el workflow n8n "ZohoHub - Transform to sales_records" (la ingesta Books ya estaba despublicada). n8n queda fuera del pipeline Books por completo.

- [ ] **Step 6: Actualizar memoria.** Marcar en `zoho-hub-arquitectura` que Books rico + derivación corren en Node y n8n Books está retirado; añadir la password de `sales-tracker-db` a la lista de secretos a rotar.

---

## Notas de cierre
- **Límite de tests honesto:** la query `AGGREGATE_SQL` no se ejecuta en pg-mem (usa `extract`, `greatest`, `raw->>`, `NULLIF`, casts); se trata como copia literal del workflow probado y se valida por paridad post-deploy (Step 4). Los tests cubren orquestación, transacción, parámetros del upsert y el programador.
- **Transaccionalidad:** `deriveSalesRecords` recibe un client único (no el pool) para que BEGIN/COMMIT sean atómicos — el wipe+upserts nunca dejan `sales_records` a medias (mejora sobre n8n).
- Fuera de alcance: variante "escribir al hub", pagos/estimates, consolidar contactos.
