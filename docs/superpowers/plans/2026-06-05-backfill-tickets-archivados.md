# Backfill de tickets archivados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traer a Postgres los tickets archivados de Zoho (que el sync actual omite), vía un backfill admin en segundo plano sobre `GET /tickets/archivedTickets`.

**Architecture:** `backfillArchivedTickets()` en `server/sync.ts` (espejo de `backfillTickets`, otro endpoint) + `POST /api/admin/backfill-archived` (sesión + admin, fire-and-forget). Idempotente vía `upsertTicket`.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest + supertest. Spec: `docs/superpowers/specs/2026-06-05-backfill-tickets-archivados-design.md`.

**Contexto del repo:**
- `server/sync.ts`: `createSync({ zohoFetch, db, config })` con `persistTicket(t)` (resuelve cuenta/contacto + `upsertTicket`, idempotente, protege `managed_by_app`), `readData(res)`, `PAGE_SIZE=100`, `config.departmentId`. `interface Sync` (con `backfillTickets`, `syncRecent`, `syncActivities`, `syncTicketHistory`, `syncContacts`, …).
- `server/app.ts`: importa `requireAuth, requireAdmin as requireSuperAdmin`; `sync` está en el scope de `createApp({ db, zohoFetch, sync, config })`. `app.test.ts`: `appWith()` → `{ app, sync, zohoFetch }` donde `sync` es un objeto de `vi.fn()` (línea 27); helpers `adminCookie()`, `userCookie(areas)`, `db`, `request`. Los mocks de `Sync` están en `server/app.test.ts` (línea 27), `server/auth/routes.test.ts`, `server/backfill.test.ts`.

---

## Estructura de archivos
- Modify `server/sync.ts` (+ Create `server/sync.archived.test.ts`) — `backfillArchivedTickets`.
- Modify `server/app.ts` (+ `app.test.ts`, `auth/routes.test.ts`, `backfill.test.ts`) — endpoint + mocks.

---

## Task 1: `backfillArchivedTickets` (TDD)

**Files:** Modify `server/sync.ts`; Create `server/sync.archived.test.ts`

- [ ] **Step 1: Escribir `server/sync.archived.test.ts`**
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('backfillArchivedTickets', () => {
  it('pagina /tickets/archivedTickets y persiste', async () => {
    const t = { id: 'arch1', ticketNumber: '264', subject: 'Viejo', status: 'Finalizado', statusType: 'Closed', customFields: {} }
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [t] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    const n = await sync.backfillArchivedTickets()
    expect(n).toBe(1)
    expect((await db.query("SELECT count(*)::int AS c FROM tickets WHERE id='arch1'")).rows[0].c).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/archivedTickets')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/sync.archived.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/sync.ts`:**
  - En `interface Sync` añade: `backfillArchivedTickets(): Promise<number>`.
  - Junto a `backfillTickets` en el objeto retornado por `createSync`, añade:
```ts
    async backfillArchivedTickets(): Promise<number> {
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), include: 'contacts,assignee' })
        const res = await zohoFetch(`/tickets/archivedTickets?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /tickets/archivedTickets ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        for (const t of items) await persistTicket(t)
        total += items.length
        if (items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
```

- [ ] **Step 4:** Run `npx vitest run server/sync.archived.test.ts` — confirm PASS.

- [ ] **Step 5: Actualizar los mocks de `Sync`.** Run `npx tsc -p tsconfig.server.json --noEmit` → fallará (TS2741) en los tests con mock de `Sync`. En `server/app.test.ts` (línea ~27), añade al objeto `sync` el método **resolviendo una promesa** (el endpoint hace `.then()`): `backfillArchivedTickets: vi.fn().mockResolvedValue(0)`. En `server/auth/routes.test.ts` y `server/backfill.test.ts`, busca `syncContacts: vi.fn()` y junto a él añade `backfillArchivedTickets: vi.fn(),` (ahí basta el type). Re-corre `npx tsc -p tsconfig.server.json --noEmit` → limpio.

- [ ] **Step 6:** Run `npx eslint server/sync.ts` — eslint 0 errores (WARNINGs `no-explicit-any` aceptables).

- [ ] **Step 7: Commit**
```bash
git add server/sync.ts server/sync.archived.test.ts server/app.test.ts server/auth/routes.test.ts server/backfill.test.ts
git commit -m "feat(archivados): backfillArchivedTickets (GET /tickets/archivedTickets) + mocks Sync"
```

---

## Task 2: Endpoint `POST /api/admin/backfill-archived` (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts` añade un bloque** (usa el `sync` que devuelve `appWith()` para verificar la llamada):
```ts
describe('POST /api/admin/backfill-archived (admin)', () => {
  it('admin arranca; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    const { app, sync } = appWith()
    const res = await request(app).post('/api/admin/backfill-archived').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ started: true })
    expect(sync.backfillArchivedTickets).toHaveBeenCalled()
    const op = await userCookie([])
    expect((await request(app).post('/api/admin/backfill-archived').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/backfill-archived')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`** registra la ruta (junto a las otras rutas `/api/admin/*` o admin):
```ts
  app.post('/api/admin/backfill-archived', requireAuth(db), requireSuperAdmin, (_req, res) => {
    sync.backfillArchivedTickets()
      .then((n) => console.log(`Backfill archivados: ${n} tickets`))
      .catch((e) => console.error('Backfill archivados falló:', e))
    res.json({ started: true })
  })
```
(`requireSuperAdmin` ya está importado; `sync` está en el scope de `createApp`.)

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts` — Expected: tests PASS; typecheck limpio; eslint 0 errores.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(archivados): POST /api/admin/backfill-archived (fire-and-forget, admin)"
```

---

## Task 3: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Como **admin**, en la consola del navegador (logueado): `fetch('/api/admin/backfill-archived', { method: 'POST', credentials: 'include' }).then(r => r.json()).then(console.log)` → `{ started: true }`.
2. Espera 1–3 min; en el log de EasyPanel: `Backfill archivados: N`.
3. PgWeb: `SELECT count(*) FROM tickets;` sube de ~191 a ~800. El detalle del contacto Ricardo Buitrago pasa de 9 a 44 tickets.
4. Si se cortó por 429, repite el `fetch` (idempotente).

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(archivados): backfill verificado"
```

---

## Notas de cierre
- **Una sola vez** (los archivados son estáticos; el sync actual cubre los nuevos no-archivados).
- **Idempotente** (`upsertTicket` protege `managed_by_app`; re-correr no duplica).
- El endpoint es **fire-and-forget**; el progreso se verifica con `count(*)` y el log.
