# Mark-and-sweep de huérfanos — Implementation Plan

> Ejecutar con TDD. Pasos con checkbox `- [ ]`. Repo: `desk-ambientalia` (`C:\dev\Desk_2_R1.023`).

**Goal:** job diario en `hub-sync` que borra de la réplica Postgres los registros de Books/CRM que ya no existen en Zoho. Con dry-run + tope de seguridad + completo-o-abortar. Spec: `docs/2026-07-19-mark-and-sweep-design.md`.

**Verificado en el código:**
- Worker `apps/hub-sync/src/hub-sync.ts` `main()`: instala timers y usa `scheduleDailyAt(hour, task)` (de `booksHub/schedule.ts`) para el job diario de sales-records. Ahí engancha el sweep.
- `BooksHubSync` (`packages/zoho-sync/src/booksHub/sync.ts`): `listPage(resource,key,page,extra)` pagina (PAGE_SIZE=200); los IDs de cabecera (`invoice_id`,`salesorder_id`,`contact_id`,`item_id`) vienen en el list (no hace falta `fetchDetail`). Tablas `books.*` hardcodeadas.
- `CrmSync` (`crmHub/sync.ts`): `fetchPage(m, extra)` → `{data, info}`; paginación profunda por `info.next_page_token`. Registro `MODULES` en `crmHub/modules.ts` (todos pk `id`; `quotes` tiene `hasLines`→`crm.quote_line_items`). `byTable` valida. Tablas `crm.<table>` hardcodeadas.
- Repos: DELETE+INSERT sin `BEGIN/COMMIT` explícito (usan el pool directo; `replaceInvoiceLines`/`replaceQuoteLines`). **No usar transacciones sobre el Pool** (cada query puede ir en otra conexión) → borrar hijas y luego cabecera como dos queries.
- `config.ts` `loadConfig(env)`: booleanos `env.X !== 'false'` (default-on) o `=== 'true'` (default-off); números con `Number(env.X)`.
- Tests: vitest + **pg-mem** (`newDb().adapters.createPg(); new pg.Pool()`). `Queryable` = `{ query }` (de `db/migrate`).

---

## Task 1: Núcleo del sweep (puro + ejecutor) con TDD

**Files:**
- Create: `packages/zoho-sync/src/sweep/sweep.ts`
- Create: `packages/zoho-sync/src/sweep/sweep.test.ts`

- [ ] **Step 1: Test primero** — `packages/zoho-sync/src/sweep/sweep.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { orphanIds, guardOk, sweepEntity, type SweepEntity } from './sweep'

describe('orphanIds', () => {
  it('devuelve los de la réplica que no están vivos', () => {
    expect(orphanIds(new Set(['a', 'b']), ['a', 'b', 'c', 'd'])).toEqual(['c', 'd'])
    expect(orphanIds(new Set(['a']), ['a'])).toEqual([])
  })
})

describe('guardOk', () => {
  const g = { maxRows: 200, maxPct: 0.1 }
  it('false si supera el tope absoluto', () => expect(guardOk(201, 10000, g)).toBe(false))
  it('false si supera el %', () => expect(guardOk(50, 100, g)).toBe(false)) // 50% > 10%
  it('true si dentro de límites', () => expect(guardOk(5, 1000, g)).toBe(true))
})

describe('sweepEntity (pg-mem)', () => {
  async function db() {
    const pg = newDb().adapters.createPg()
    const pool = new pg.Pool()
    await pool.query('CREATE SCHEMA books')
    await pool.query('CREATE TABLE books.invoices (invoice_id text primary key, n text)')
    await pool.query('CREATE TABLE books.invoice_line_items (line_item_id text primary key, invoice_id text)')
    for (const id of ['A', 'B', 'C']) {
      await pool.query('INSERT INTO books.invoices VALUES ($1,$2)', [id, 'x'])
      await pool.query('INSERT INTO books.invoice_line_items VALUES ($1,$2)', [id + '-L', id])
    }
    return pool
  }
  // confirmGone(id) simula la re-verificación en Zoho: true = ausente (borrar); false = sigue vivo.
  const ent = (live: string[], confirmGone: (id: string) => boolean = () => true): SweepEntity => ({
    schema: 'books', table: 'invoices', pk: 'invoice_id',
    childTable: 'invoice_line_items', childFk: 'invoice_id',
    collectLive: async () => new Set(live),
    confirmDeleted: async (id) => confirmGone(id),
  })
  const guard = { maxRows: 200, maxPct: 0.9 }

  it('borra el huérfano (C) confirmado ausente y sus líneas; deja los vivos', async () => {
    const pool = await db()
    const rep = await sweepEntity(pool, ent(['A', 'B']), { dryRun: false, guard })
    expect(rep).toMatchObject({ table: 'books.invoices', live: 2, replica: 3, orphans: 1, confirmed: 1, liveGaps: 0, deleted: 1, dryRun: false })
    const inv = await pool.query('SELECT invoice_id FROM books.invoices ORDER BY 1')
    expect(inv.rows.map((r: any) => r.invoice_id)).toEqual(['A', 'B'])
    const lines = await pool.query('SELECT line_item_id FROM books.invoice_line_items ORDER BY 1')
    expect(lines.rows.map((r: any) => r.line_item_id)).toEqual(['A-L', 'B-L'])
  })

  it('candidato que la re-verificación dice VIVO (hueco de lista) → NO se borra (liveGaps)', async () => {
    const pool = await db()
    // C falta en la lista (orphan candidato) pero confirmDeleted('C')=false → sigue vivo en Zoho
    const rep = await sweepEntity(pool, ent(['A', 'B'], (id) => id !== 'C'), { dryRun: false, guard })
    expect(rep).toMatchObject({ orphans: 1, confirmed: 0, liveGaps: 1, deleted: 0 })
    const inv = await pool.query('SELECT count(*)::int AS c FROM books.invoices')
    expect(inv.rows[0].c).toBe(3) // C sigue ahí
  })

  it('dry-run NO borra pero reporta confirmed (lo que borraría)', async () => {
    const pool = await db()
    const rep = await sweepEntity(pool, ent(['A', 'B']), { dryRun: true, guard })
    expect(rep).toMatchObject({ orphans: 1, confirmed: 1, deleted: 0, dryRun: true })
    const inv = await pool.query('SELECT count(*)::int AS c FROM books.invoices')
    expect(inv.rows[0].c).toBe(3)
  })

  it('tope excedido → NO borra ni re-verifica, marca skipped', async () => {
    const pool = await db()
    const rep = await sweepEntity(pool, ent([]), { dryRun: false, guard: { maxRows: 200, maxPct: 0.1 } })
    expect(rep.deleted).toBe(0)
    expect(rep.skipped).toBeTruthy()
    const inv = await pool.query('SELECT count(*)::int AS c FROM books.invoices')
    expect(inv.rows[0].c).toBe(3)
  })
})
```

- [ ] **Step 2: Ver fallar** — Run: `npm test -- sweep` (desde la raíz del repo). Expected: FAIL (módulo no existe).

- [ ] **Step 3: Crear `sweep.ts`** — `packages/zoho-sync/src/sweep/sweep.ts`:

```ts
import type { Queryable } from '../db/migrate'

// Núcleo del mark-and-sweep: dado el set de IDs vivos en Zoho y los de la réplica,
// borra de la réplica los que ya no existen. Puro + un ejecutor por entidad.

export interface SweepGuard { maxRows: number; maxPct: number }
export interface SweepOpts { dryRun: boolean; guard: SweepGuard }

export interface SweepReport {
  table: string
  live: number
  replica: number
  orphans: number     // réplica − vivos (candidatos)
  confirmed: number   // candidatos re-verificados por id como AUSENTES en Zoho
  liveGaps: number    // candidatos que resultaron VIVOS (hueco de lista) → NO borrados
  uncertain: number   // no se pudo verificar (error) → NO borrados
  deleted: number
  dryRun: boolean
  skipped?: string    // motivo si se abortó (lista incompleta) o el tope lo frenó
}

export interface SweepEntity {
  schema: string          // 'books' | 'crm'
  table: string
  pk: string
  childTable?: string     // tabla hija a limpiar primero (ej. invoice_line_items)
  childFk?: string        // FK de la hija hacia el padre (ej. invoice_id)
  /** Recolecta TODOS los IDs vivos en Zoho. DEBE lanzar si alguna página falla (→ abortar, no borrar). */
  collectLive: () => Promise<Set<string>>
  /** Re-verifica por id: true = Zoho ya NO lo tiene (borrar); false = sigue vivo (NO borrar). Lanza si es indeterminado. */
  confirmDeleted: (id: string) => Promise<boolean>
}

/** IDs de la réplica que ya no están vivos en Zoho. */
export function orphanIds(live: Set<string>, replica: string[]): string[] {
  return replica.filter((id) => !live.has(id))
}

/** ¿Seguro borrar? false si supera el tope absoluto o el % de la tabla. */
export function guardOk(orphans: number, replicaTotal: number, g: SweepGuard): boolean {
  if (orphans > g.maxRows) return false
  if (replicaTotal > 0 && orphans / replicaTotal > g.maxPct) return false
  return true
}

/**
 * Barre una entidad: recolecta vivos → candidatos huérfanos → tope → **re-verifica cada candidato por id
 * en Zoho** → borra SOLO los confirmados ausentes (hijas y luego cabecera). La re-verificación corre
 * también en dry-run (es de solo lectura). Si `collectLive` lanza (página fallida), propaga → el llamador
 * reporta `skipped` (completo-o-abortar).
 */
export async function sweepEntity(db: Queryable, e: SweepEntity, opts: SweepOpts): Promise<SweepReport> {
  const live = await e.collectLive() // lanza → abortar entidad
  const res = await db.query(`SELECT ${e.pk} AS id FROM ${e.schema}.${e.table}`)
  const replica = res.rows.map((r: { id: unknown }) => String(r.id))
  const orphans = orphanIds(live, replica)
  const base: SweepReport = {
    table: `${e.schema}.${e.table}`, live: live.size, replica: replica.length,
    orphans: orphans.length, confirmed: 0, liveGaps: 0, uncertain: 0, deleted: 0, dryRun: opts.dryRun,
  }
  if (orphans.length === 0) return base
  if (!guardOk(orphans.length, replica.length, opts.guard)) {
    return { ...base, skipped: `tope: ${orphans.length} huérfanos sobre ${replica.length} filas` }
  }
  // ── Red de seguridad: re-verificar cada candidato por id en Zoho (solo lectura) ──
  const confirmed: string[] = []
  let liveGaps = 0, uncertain = 0
  for (const id of orphans) {
    try {
      if (await e.confirmDeleted(id)) confirmed.push(id)
      else { liveGaps++; console.warn(`sweep: ${e.schema}.${e.table} ${id} sigue VIVO en Zoho (hueco de lista) — NO se borra`) }
    } catch (err: any) {
      uncertain++; console.warn(`sweep: ${e.schema}.${e.table} ${id} no verificable (${String(err?.message ?? err)}) — NO se borra`)
    }
  }
  const rep: SweepReport = { ...base, confirmed: confirmed.length, liveGaps, uncertain }
  if (opts.dryRun || confirmed.length === 0) return rep
  if (e.childTable && e.childFk) {
    await db.query(`DELETE FROM ${e.schema}.${e.childTable} WHERE ${e.childFk} = ANY($1::text[])`, [confirmed])
  }
  await db.query(`DELETE FROM ${e.schema}.${e.table} WHERE ${e.pk} = ANY($1::text[])`, [confirmed])
  return { ...rep, deleted: confirmed.length }
}
```

(Si pg-mem rechazara `= ANY($1::text[])`, cambiar los dos DELETE por `WHERE ${col} IN (...)` con placeholders; pg-mem reciente soporta ANY.)

- [ ] **Step 4: Ver pasar** — Run: `npm test -- sweep`. Expected: PASS.
- [ ] **Step 5: Commit** — `git add packages/zoho-sync/src/sweep && git commit -m "feat(sweep): nucleo mark-and-sweep (orphanIds, guard, sweepEntity)"`

---

## Task 2: sweep() en Books

**Files:** Modify `packages/zoho-sync/src/booksHub/sync.ts`

- [ ] **Step 1: Imports + interfaz** — al inicio del archivo añadir:
```ts
import { sweepEntity, type SweepOpts, type SweepReport, type SweepEntity } from '../sweep/sweep'
```
y añadir a `interface BooksHubSync`:
```ts
  sweep(opts: SweepOpts): Promise<SweepReport[]>
```

- [ ] **Step 2: Recolector de IDs vivos** — dentro de `createBooksHubSync`, junto a `listPage`:
```ts
  /** Todos los IDs vivos de un recurso Books (pagina hasta agotar). Lanza si una página falla → aborta el sweep de la entidad. */
  async function collectLiveIds(resource: string, key: string, idKey: string, extra: Record<string, string> = {}): Promise<Set<string>> {
    const ids = new Set<string>()
    let page = 1
    for (;;) {
      const items = await listPage(resource, key, page, extra)
      if (!items.length) break
      for (const it of items) { const id = it[idKey]; if (id != null) ids.add(String(id)) }
      if (items.length < PAGE_SIZE) break
      page++
    }
    return ids
  }

  /** Re-verifica por id en Books: true si Zoho ya NO lo tiene (404); false si existe (200); lanza si es indeterminado. */
  async function verifyDeleted(resource: string, id: string): Promise<boolean> {
    const res = await booksFetch(`/${resource}/${id}?organization_id=${org}`)
    if (res.status === 404) return true
    if (res.ok) return false
    throw new Error(`Books verify /${resource}/${id} ${res.status}`)
  }
```

> **Verificar en la implementación** (spec §Riesgos): confirmar con un id borrado real que Books devuelve **404** (y no otro código con `code!=0`). Si fuera otro código, ajustar `verifyDeleted` para tratarlo como "ausente" SOLO ante un "not found" inequívoco; ante la duda, `throw` (no borra).

- [ ] **Step 3: Método sweep** — añadir al objeto que retorna `createBooksHubSync` (junto a `syncRecent`):
```ts
    async sweep(opts: SweepOpts): Promise<SweepReport[]> {
      const entities: SweepEntity[] = [
        { schema: 'books', table: 'invoices', pk: 'invoice_id', childTable: 'invoice_line_items', childFk: 'invoice_id', collectLive: () => collectLiveIds('invoices', 'invoices', 'invoice_id'), confirmDeleted: (id) => verifyDeleted('invoices', id) },
        { schema: 'books', table: 'sales_orders', pk: 'salesorder_id', childTable: 'salesorder_line_items', childFk: 'salesorder_id', collectLive: () => collectLiveIds('salesorders', 'salesorders', 'salesorder_id'), confirmDeleted: (id) => verifyDeleted('salesorders', id) },
        { schema: 'books', table: 'contacts', pk: 'contact_id', collectLive: () => collectLiveIds('contacts', 'contacts', 'contact_id', { contact_type: 'customer' }), confirmDeleted: (id) => verifyDeleted('contacts', id) },
        { schema: 'books', table: 'items', pk: 'item_id', collectLive: () => collectLiveIds('items', 'items', 'item_id'), confirmDeleted: (id) => verifyDeleted('items', id) },
      ]
      const reports: SweepReport[] = []
      for (const e of entities) {
        try { reports.push(await sweepEntity(db, e, opts)) }
        catch (err: any) { reports.push({ table: `books.${e.table}`, live: 0, replica: 0, orphans: 0, confirmed: 0, liveGaps: 0, uncertain: 0, deleted: 0, dryRun: opts.dryRun, skipped: `abortado: ${String(err?.message ?? err)}` }) }
      }
      return reports
    },
```

- [ ] **Step 4: Build/typecheck** — Run: `npm run typecheck`. Expected: sin errores.
- [ ] **Step 5: Test de integración** — `packages/zoho-sync/src/booksHub/sweep.test.ts` (mirar `booksHub/sync.test.ts` para pg-mem + mock de `booksFetch`). El mock de `booksFetch` distingue por path:
  - `GET /invoices?...` (list) → `{ invoices: [{invoice_id:'A'},{invoice_id:'B'}] }` (C ausente).
  - `GET /invoices/C?...` (verify) → status **404** (confirmado ausente).
  - Casos: seed A,B,C → `sweep({dryRun:false, guard})` → **C borrada**, A/B intactas, `confirmed:1`. Segundo caso: `GET /invoices/C` responde **200** con el registro → C NO se borra, `liveGaps:1`. Tercero: una página del list lanza → `skipped`. Correr `npm test -- booksHub/sweep`.
- [ ] **Step 6: Commit** — `git commit -m "feat(sweep): Books sweep (invoices, sales_orders, contacts, items)"`

---

## Task 3: sweep() en CRM

**Files:** Modify `packages/zoho-sync/src/crmHub/sync.ts`

- [ ] **Step 1: Imports + interfaz** — añadir:
```ts
import { sweepEntity, type SweepOpts, type SweepReport, type SweepEntity } from '../sweep/sweep'
```
y a `interface CrmSync`: `sweep(opts: SweepOpts): Promise<SweepReport[]>`.

- [ ] **Step 2: Recolector de IDs vivos** — dentro de `createCrmSync`, junto a `fetchPage`:
```ts
  /** Todos los IDs vivos de un módulo CRM (paginación profunda por next_page_token). Lanza si una página falla. */
  async function collectLiveIds(m: CrmModule): Promise<Set<string>> {
    const ids = new Set<string>()
    let token: string | null = null
    for (;;) {
      const extra = token ? `page_token=${token}` : `page=1`
      const { data, info } = await fetchPage(m, extra)
      for (const r of data) { if (r?.id != null) ids.add(String(r.id)) }
      if (!info.more_records || !info.next_page_token) break
      token = info.next_page_token
    }
    return ids
  }

  /** Re-verifica por id en CRM: true si Zoho ya NO lo tiene; false si existe; lanza si es indeterminado.
   *  CRM v8 GET /{Module}/{id}: 200 con data[] = existe; 204/404 = no existe. */
  async function verifyDeleted(m: CrmModule, id: string): Promise<boolean> {
    const res = await crmFetch(`/${m.apiName}/${id}`)
    if (res.status === 204 || res.status === 404) return true
    if (res.ok) { const d = await readData(res); return !(Array.isArray(d.data) && d.data.length > 0) }
    throw new Error(`CRM verify /${m.apiName}/${id} ${res.status}`)
  }
```

> **Verificar en la implementación**: confirmar el status/forma exacta que devuelve CRM v8 para un registro borrado (204 vs 404 vs 200 con `data` vacío). Ante la duda, `throw` (no borra).

- [ ] **Step 3: Método sweep** — añadir al objeto retornado (junto a `syncRecent`):
```ts
    async sweep(opts: SweepOpts): Promise<SweepReport[]> {
      const reports: SweepReport[] = []
      for (const m of MODULES) {
        const e: SweepEntity = {
          schema: 'crm', table: m.table, pk: 'id',
          childTable: m.hasLines ? 'quote_line_items' : undefined,
          childFk: m.hasLines ? 'quote_id' : undefined,
          collectLive: () => collectLiveIds(m),
          confirmDeleted: (id) => verifyDeleted(m, id),
        }
        try { reports.push(await sweepEntity(db, e, opts)) }
        catch (err: any) { reports.push({ table: `crm.${m.table}`, live: 0, replica: 0, orphans: 0, confirmed: 0, liveGaps: 0, uncertain: 0, deleted: 0, dryRun: opts.dryRun, skipped: `abortado: ${String(err?.message ?? err)}` }) }
      }
      return reports
    },
```
(Añadir el método a los tres sitios donde el `return { ... }` arma el objeto — hoy retorna `{ backfillAll, syncRecent, backfillIfEmpty }`; añadir `sweep`.)

- [ ] **Step 4: Typecheck** — `npm run typecheck`. Expected: OK.
- [ ] **Step 5: Test** — `packages/zoho-sync/src/crmHub/sweep.test.ts` (mirar `crmHub/sync.test.ts`): pg-mem con `crm.deals` (A,B,C). `crmFetch` por path: `GET /Deals?...` (list) → `{ data:[{id:'A'},{id:'B'}], info:{more_records:false} }`; `GET /Deals/C` (verify) → status **204** (ausente). `sweep({dryRun:false,guard})` → **C borrada**, `confirmed:1`. Segundo caso: `GET /Deals/C` → 200 con `{data:[{id:'C'}]}` → C NO borrada, `liveGaps:1`. Correr `npm test -- crmHub/sweep`.
- [ ] **Step 6: Commit** — `git commit -m "feat(sweep): CRM sweep (generico por MODULES)"`

---

## Task 4: Config + .env.example

**Files:** Modify `packages/zoho-sync/src/config.ts`, `.env.example`

- [ ] **Step 1: AppConfig** — añadir a la interfaz:
```ts
  sweepEnabled: boolean
  sweepDryRun: boolean
  sweepHour: number
  sweepMaxRows: number
  sweepMaxPct: number
```
- [ ] **Step 2: loadConfig** — añadir al objeto devuelto:
```ts
    sweepEnabled: env.SWEEP_ENABLED === 'true',        // default OFF
    sweepDryRun: env.SWEEP_DRY_RUN !== 'false',         // default ON
    sweepHour: env.SWEEP_HOUR ? Number(env.SWEEP_HOUR) : 4,
    sweepMaxRows: env.SWEEP_MAX_ROWS ? Number(env.SWEEP_MAX_ROWS) : 200,
    sweepMaxPct: env.SWEEP_MAX_PCT ? Number(env.SWEEP_MAX_PCT) : 0.1,
```
- [ ] **Step 3: .env.example** — añadir:
```
# Mark-and-sweep de huerfanos (borra de la replica lo eliminado en Zoho)
SWEEP_ENABLED=false
SWEEP_DRY_RUN=true
SWEEP_HOUR=4
SWEEP_MAX_ROWS=200
SWEEP_MAX_PCT=0.1
```
- [ ] **Step 4: Commit** — `git commit -m "feat(sweep): config (SWEEP_ENABLED/DRY_RUN/HOUR/MAX_ROWS/MAX_PCT)"`

---

## Task 5: Programar el sweep en el worker

**Files:** Modify `apps/hub-sync/src/hub-sync.ts`

- [ ] **Step 1: Import** — añadir junto a los imports de sync:
```ts
import type { SweepReport } from '@ambientalia/zoho-sync/sweep/sweep'
```
- [ ] **Step 2: Helper de log** — antes de `main()`:
```ts
function logSweep(dominio: string, reports: SweepReport[]): void {
  for (const r of reports) {
    if (r.skipped) { console.warn(`sweep ${dominio} ${r.table}: SKIP (${r.skipped}) — huerfanos=${r.orphans}`); continue }
    const accion = r.dryRun ? `DRY-RUN (borraria ${r.confirmed})` : `borrados ${r.deleted}`
    const extra = (r.liveGaps || r.uncertain) ? ` [vivos=${r.liveGaps} inciertos=${r.uncertain}]` : ''
    console.log(`sweep ${dominio} ${r.table}: vivos=${r.live} replica=${r.replica} huerfanos=${r.orphans} confirmados=${r.confirmed}${extra} → ${accion}`)
  }
}
```
- [ ] **Step 3: Programar** — al final de `main()` (tras el bloque de sales-records):
```ts
  if (config.sweepEnabled && (booksHubSync || crmSync)) {
    const opts = { dryRun: config.sweepDryRun, guard: { maxRows: config.sweepMaxRows, maxPct: config.sweepMaxPct } }
    const runSweep = async () => {
      if (booksHubSync) logSweep('books', await booksHubSync.sweep(opts))
      if (crmSync) logSweep('crm', await crmSync.sweep(opts))
    }
    scheduleDailyAt(config.sweepHour, runSweep)
    console.log(`Mark-and-sweep habilitado (diario ${config.sweepHour}:00, dryRun=${config.sweepDryRun})`)
  } else {
    console.log('Mark-and-sweep deshabilitado (SWEEP_ENABLED=false o sin Books/CRM)')
  }
```
- [ ] **Step 4: Typecheck** — `npm run typecheck`. Expected: OK.
- [ ] **Step 5: Commit** — `git commit -m "feat(sweep): programar el sweep diario en hub-sync (flag SWEEP_ENABLED)"`

---

## Task 6: Verificación

- [ ] **Step 1: Tests** — Run: `npm test`. Expected: todos verdes (incluye sweep + los existentes).
- [ ] **Step 2: Typecheck** — Run: `npm run typecheck`. Expected: sin errores.
- [ ] **Step 3: Lint** — Run: `npm run lint`. Expected: limpio (o solo warnings preexistentes).
- [ ] **Step 4: Prueba manual (dry-run) en real** — desplegar/correr el worker con `SWEEP_ENABLED=true SWEEP_DRY_RUN=true`; al llegar la hora (o bajar `SWEEP_HOUR` temporalmente) revisar el log: debe reportar los huérfanos correctos SIN borrar. Validar varios días antes de poner `SWEEP_DRY_RUN=false`.

---

## Notas
- **No** usar `BEGIN/COMMIT` sobre el Pool (conexiones distintas): borrar hijas y luego cabecera como dos queries (patrón de `replaceInvoiceLines`).
- Arrancar SIEMPRE con `SWEEP_DRY_RUN=true` en producción; el tope (`SWEEP_MAX_*`) protege contra una respuesta de Zoho truncada.
- Desk (tickets + archivados) queda para una 2ª fase (fuera de alcance v1).
