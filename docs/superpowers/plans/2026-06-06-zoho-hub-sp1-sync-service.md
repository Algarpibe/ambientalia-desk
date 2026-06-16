# zoho-hub SP1 — servicio `zoho-hub-sync` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un servicio aparte (mismo repo) que sincroniza Zoho (Desk+Books) al hub `zoho-hub-db`, reusando el motor de sync existente, sin tocar la Desk app.

**Architecture:** Núcleo testeable `server/hubSync.ts` (`hubBootstrap` = migrate + backfill-si-vacío; `scheduleHubSync` = loops incrementales) + entrypoint delgado `server/hub-sync.ts` (sin Express/SPA, `DATABASE_URL`→hub) + script npm. Se despliega como servicio EasyPanel propio.

**Tech Stack:** TS ESM, Express-less entrypoint vía `tsx`, pg-mem, Vitest. Spec: `docs/superpowers/specs/2026-06-06-zoho-hub-sp1-sync-service-design.md`.

**Contexto del repo (verificado):**
- El server corre con **`tsx`** (no `dist/`): `start` = `cross-env NODE_ENV=production tsx server/index.ts`.
- `interface Sync` (server/sync.ts): `backfillTickets`, `backfillArchivedTickets`, `syncRecent`, `syncTicket`, `syncConversations`, `syncTicketHistory`, `syncActivities`, `syncContacts`.
- `interface BooksSync` (server/books/sync.ts): `backfillClients`, `backfillSalesOrders`, `syncRecent` (devuelve `{clients, salesOrders}`).
- Helpers: `migrate(db)`, `reseedTicketNumber(db)`, `type Queryable` en `./db/migrate`; `countTickets(db)` en `./db/repo`; `maxLastModified(db,'clients'|'sales_orders')` en `./books/repo`.
- Factories: `createPool(config)`, `createTokenManager({config})`, `createZohoClient({config,tokenManager})→{zohoFetch}`, `createSync({zohoFetch,db,config})`, `createBooksClient({config})→{booksFetch}`, `createBooksSync({booksFetch,db,config})`.
- `loadConfig()` exige solo `ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN/ORG_ID/DEPARTMENT_ID` + `DATABASE_URL`; resto con defaults (`syncIntervalMs=180000`, Books opcional via `booksRefreshToken`+`booksOrgId`).
- Patrón mock de `Sync` en tests: ver `server/backfill.test.ts` (objeto con `vi.fn()` por método).

---

## Estructura de archivos
- Create `server/hubSync.ts` — núcleo (`hubBootstrap`, `scheduleHubSync`).
- Create `server/hubSync.test.ts` — tests (pg-mem + mocks).
- Create `server/hub-sync.ts` — entrypoint.
- Modify `package.json` — script `start:hub-sync`.

---

## Task 1: Núcleo `hubSync.ts` (TDD)

**Files:** Create `server/hubSync.ts`, `server/hubSync.test.ts`

- [ ] **Step 1: Escribir `server/hubSync.test.ts`**
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { hubBootstrap, scheduleHubSync } from './hubSync'
import type { Sync } from './sync'
import type { BooksSync } from './books/sync'

let db: Queryable
beforeEach(() => { const pg = newDb().adapters.createPg(); db = new pg.Pool() })

function mockSync(): Sync {
  return {
    backfillTickets: vi.fn().mockResolvedValue(0),
    backfillArchivedTickets: vi.fn().mockResolvedValue(0),
    syncRecent: vi.fn().mockResolvedValue(0),
    syncTicket: vi.fn().mockResolvedValue(undefined),
    syncConversations: vi.fn().mockResolvedValue(undefined),
    syncTicketHistory: vi.fn().mockResolvedValue(undefined),
    syncActivities: vi.fn().mockResolvedValue(0),
    syncContacts: vi.fn().mockResolvedValue(0),
  }
}
function mockBooks(): BooksSync {
  return {
    backfillClients: vi.fn().mockResolvedValue(0),
    backfillSalesOrders: vi.fn().mockResolvedValue(0),
    syncRecent: vi.fn().mockResolvedValue({ clients: 0, salesOrders: 0 }),
  }
}

describe('hubBootstrap', () => {
  it('migra y hace backfill cuando el hub está vacío', async () => {
    const sync = mockSync(); const booksSync = mockBooks()
    await hubBootstrap({ db, sync, booksSync })
    const r = await db.query('SELECT count(*)::int AS n FROM tickets')
    expect(r.rows[0].n).toBe(0) // migrate corrió → la tabla existe
    expect(sync.backfillTickets).toHaveBeenCalledTimes(1)
    expect(sync.backfillArchivedTickets).toHaveBeenCalledTimes(1)
    expect(sync.syncActivities).toHaveBeenCalled()
    expect(sync.syncContacts).toHaveBeenCalled()
    expect(booksSync.backfillClients).toHaveBeenCalledTimes(1)
    expect(booksSync.backfillSalesOrders).toHaveBeenCalledTimes(1)
  })

  it('NO backfillea tickets si ya hay datos', async () => {
    await migrate(db)
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    const sync = mockSync()
    await hubBootstrap({ db, sync, booksSync: null })
    expect(sync.backfillTickets).not.toHaveBeenCalled()
    expect(sync.syncActivities).toHaveBeenCalled()
  })

  it('sin booksSync no falla', async () => {
    const sync = mockSync()
    await expect(hubBootstrap({ db, sync, booksSync: null })).resolves.toBeUndefined()
  })
})

describe('scheduleHubSync', () => {
  afterEach(() => { vi.useRealTimers() })
  it('agenda el ciclo y stop() lo detiene', async () => {
    vi.useFakeTimers()
    const sync = mockSync(); const booksSync = mockBooks()
    const stop = scheduleHubSync({ sync, booksSync, intervalMs: 1000 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(sync.syncRecent).toHaveBeenCalledTimes(1)
    expect(booksSync.syncRecent).toHaveBeenCalledTimes(1)
    stop()
    await vi.advanceTimersByTimeAsync(3000)
    expect(sync.syncRecent).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/hubSync.test.ts` — confirm FAIL (módulo `./hubSync` no existe).

- [ ] **Step 3: Crear `server/hubSync.ts`**
```ts
import { migrate, reseedTicketNumber, type Queryable } from './db/migrate'
import { countTickets } from './db/repo'
import { maxLastModified } from './books/repo'
import type { Sync } from './sync'
import type { BooksSync } from './books/sync'

/** Migra el hub y hace el backfill inicial solo si está vacío. Idempotente entre reinicios. */
export async function hubBootstrap(deps: { db: Queryable; sync: Sync; booksSync: BooksSync | null }): Promise<void> {
  const { db, sync, booksSync } = deps
  await migrate(db)
  try { await reseedTicketNumber(db) } catch (e) { console.error('reseed inicial omitido:', e) }
  if ((await countTickets(db)) === 0) {
    console.log('Hub vacío: backfill de tickets…')
    await sync.backfillTickets()
    await sync.backfillArchivedTickets()
    try { await reseedTicketNumber(db) } catch (e) { console.error('reseed tras backfill omitido:', e) }
  }
  await sync.syncActivities().catch((e) => console.error('Sync actividades inicial falló:', e))
  await sync.syncContacts().catch((e) => console.error('Sync contactos inicial falló:', e))
  if (booksSync && (await maxLastModified(db, 'clients')) == null) {
    console.log('Books vacío: backfill…')
    await booksSync.backfillClients()
    await booksSync.backfillSalesOrders()
  }
}

/** Programa los ciclos incrementales. Devuelve un stop() que limpia los timers. */
export function scheduleHubSync(deps: { sync: Sync; booksSync: BooksSync | null; intervalMs: number }): () => void {
  const { sync, booksSync, intervalMs } = deps
  let syncing = false
  const timers: ReturnType<typeof setInterval>[] = []
  timers.push(setInterval(() => {
    if (syncing) return
    syncing = true
    sync.syncRecent().then(() => sync.syncActivities()).then(() => sync.syncContacts())
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, intervalMs))
  if (booksSync) {
    timers.push(setInterval(() => {
      booksSync.syncRecent().catch((e) => console.error('Books syncRecent falló:', e))
    }, intervalMs))
  }
  return () => timers.forEach((t) => clearInterval(t))
}
```

- [ ] **Step 4:** Run `npx vitest run server/hubSync.test.ts` — confirm PASS.

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/hubSync.ts server/hubSync.test.ts` — sin errores; eslint 0.

- [ ] **Step 6: Commit**
```bash
git add server/hubSync.ts server/hubSync.test.ts
git commit -m "feat(zoho-hub): hubSync core (hubBootstrap + scheduleHubSync)"
```

---

## Task 2: Entrypoint `hub-sync.ts` + script npm

**Files:** Create `server/hub-sync.ts`; Modify `package.json`

- [ ] **Step 1: Crear `server/hub-sync.ts`**
```ts
import 'dotenv/config'
import { loadConfig } from './config'
import { createTokenManager } from './tokenManager'
import { createZohoClient } from './zohoClient'
import { createPool } from './db/pool'
import { createSync } from './sync'
import { createBooksClient } from './books/booksClient'
import { createBooksSync, type BooksSync } from './books/sync'
import { hubBootstrap, scheduleHubSync } from './hubSync'

const config = loadConfig()
const pool = createPool(config)
const tokenManager = createTokenManager({ config })
const { zohoFetch } = createZohoClient({ config, tokenManager })
const sync = createSync({ zohoFetch, db: pool, config })

let booksSync: BooksSync | null = null
if (config.booksRefreshToken && config.booksOrgId) {
  const { booksFetch } = createBooksClient({ config })
  booksSync = createBooksSync({ booksFetch, db: pool, config })
  console.log('Sync Zoho Books habilitado (hub)')
} else {
  console.log('Sync Zoho Books deshabilitado (hub): faltan ZOHO_BOOKS_REFRESH_TOKEN / ZOHO_BOOKS_ORG_ID')
}

async function main() {
  await hubBootstrap({ db: pool, sync, booksSync })
  scheduleHubSync({ sync, booksSync, intervalMs: config.syncIntervalMs })
  console.log(`zoho-hub-sync en marcha (intervalo ${config.syncIntervalMs} ms)`)
}

main().catch((e) => { console.error('Fallo al arrancar zoho-hub-sync:', e); process.exit(1) })
```
  (Nota: `createBooksSync` debe exportar el tipo `BooksSync`; ya está como `export interface BooksSync`. Si el
  import del tipo diera problema, usa `import type { BooksSync } from './books/sync'` por separado.)

- [ ] **Step 2: Modificar `package.json`** — añade en `"scripts"`, tras `"start"`:
```json
    "start:hub-sync": "cross-env NODE_ENV=production tsx server/hub-sync.ts",
```

- [ ] **Step 3:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/hub-sync.ts` — sin errores; eslint 0.

- [ ] **Step 4: Smoke local opcional (sin Zoho real):** verificar que arranca y falla limpio si faltan envs:
  Run `node -e "process.exit(0)"` (no-op) — el arranque real se valida en el despliegue. (No hay test unitario del
  entrypoint: es wiring; la lógica está cubierta en Task 1.)

- [ ] **Step 5: Commit**
```bash
git add server/hub-sync.ts package.json
git commit -m "feat(zoho-hub): entrypoint hub-sync.ts + script start:hub-sync"
```

---

## Task 3: Verificación + nota de despliegue

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS (incl. `hubSync.test.ts`); ambos `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Despliegue (manual, lo hace el usuario en EasyPanel — NO es código):**
  Crear un nuevo servicio (App) en el proyecto `ambientalia_project`, desde el mismo repo:
  - **Start command:** `npm run start:hub-sync`
  - **Env:** `DATABASE_URL` = URL interna del **hub** (`postgres://postgres:<pass>@ambientalia_project_zoho-hub-db:5432/zoho-hub?sslmode=disable`), `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ORG_ID`, `ZOHO_DEPARTMENT_ID`, y para Books `ZOHO_BOOKS_REFRESH_TOKEN`, `ZOHO_BOOKS_ORG_ID` (+ opcionales). `SYNC_INTERVAL_MS` opcional. No requiere `PORT`/`ADMIN_*`.
  - Sin puerto expuesto. Verificar en logs: "Hub vacío: backfill…" y luego "zoho-hub-sync en marcha".
  - Comprobar en el hub (`psql`): `SELECT count(*) FROM tickets;` crece.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(zoho-hub): SP1 verificado"
```

---

## Notas de cierre
- SP1 no toca la Desk app; el hub se llena en paralelo. Cutover de lectura = SP2.
- Transitorio: app y hub-sync sincronizan ambos contra Zoho (doble carga incremental, ligera).
- Pendiente operativo: **rotar** contraseñas expuestas (`zoho-hub-db`, `desk`) y guardarlas como secretos.
