# Fix numeración tickets (#954) + resiliencia de sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Que un ticket que colisiona no aborte el ciclo de sync (Capa A), y que los tickets creados por la app se numeren en un rango alto propio que nunca colisione con Zoho (Capa B). Más un borrado puntual del ticket de prueba #954.

**Architecture:** Capa A: helper `persistEach` con try/catch por-ticket en los 3 loops de `sync.ts`. Capa B: `reseedTicketNumber` (en `migrate.ts`) solo considera tickets `managed_by_app` con piso en `APP_TICKET_NUMBER_BASE` (1.000.000); `nextTicketNumber`/`createTicket` sin cambios. Borrado del app #954 = paso manual (runbook).

**Tech Stack:** TS ESM, Vitest + pg-mem. Monorepo: el motor está en `packages/zoho-sync/src/`. Spec: `docs/superpowers/specs/2026-06-17-fix-numeracion-tickets-design.md`.

**Contexto del repo (verificado):**
- `packages/zoho-sync/src/sync.ts`: `persistTicket` es closure dentro de `createSync`. 3 loops `for (const t of …) await persistTicket(t)`: `backfillTickets` (línea ~81, `pageItems` por página), `backfillArchivedTickets` (~96, `items`), `syncRecent` (~105, `pageItems`).
- `packages/zoho-sync/src/db/migrate.ts:28` `reseedTicketNumber`: `SELECT COALESCE(MAX(number),0) FROM tickets` → `setval('ticket_number_seq', max(m,1))`.
- `packages/zoho-sync/src/db/repo.ts`: `nextTicketNumber` = `nextval('ticket_number_seq')`; `createTicket` usa `nextTicketNumber`. `upsertTicket` = `INSERT … ON CONFLICT (id)`.
- Tests: `sync.test.ts` (helpers `page(t)`, `z(id,n)`, `createSync({zohoFetch,db,config})`, `getTicketRow`); `migrate.test.ts` (`freshDb()`, test existente línea 24 que asume el comportamiento viejo del reseed → se reescribe).

---

## Task 1: Capa A — resiliencia por-ticket (`sync.ts`) (TDD)

**Files:** Modify `packages/zoho-sync/src/sync.ts`, `packages/zoho-sync/src/sync.test.ts`

- [ ] **Step 1: Test** en `sync.test.ts`, añade dentro del `describe`:
```ts
  it('syncRecent aísla un ticket que colisiona y persiste el resto', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('pre',5,'p','Ingresado')")
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(page([z('A', 5), z('B', 6)])) // A choca (number 5 ya existe), B ok
      .mockResolvedValue(page([]))
    const sync = createSync({ zohoFetch, db, config })
    await expect(sync.syncRecent()).resolves.toBeDefined() // NO lanza
    expect(await getTicketRow(db, 'B')).not.toBeNull()     // el otro persistió
    expect(await getTicketRow(db, 'A')).toBeNull()         // el que colisiona, no
  })
```

- [ ] **Step 2:** Run `npx vitest run packages/zoho-sync/src/sync.test.ts -t "aísla"` — confirm FAIL (hoy `syncRecent` lanza y aborta).

- [ ] **Step 3:** En `sync.ts`, añade el helper a nivel de módulo (antes de `createSync` o dentro, accesible a los loops). Como `persistTicket` es closure, define el helper **dentro de `createSync`** justo tras `persistTicket`:
```ts
  /** Persiste cada item aislando fallos: uno malo no aborta el lote. Devuelve cuántos persistieron OK. */
  async function persistEach(items: any[]): Promise<number> {
    let ok = 0
    for (const t of items) {
      try { await persistTicket(t); ok++ }
      catch (e: any) { console.error(`persistTicket(${t?.id ?? '?'}) falló:`, String(e?.detail ?? e?.message ?? e)) }
    }
    return ok
  }
```

- [ ] **Step 4:** Reemplaza los 3 loops:
  - `syncRecent`: `const pageItems = await fetchTicketPage(1, '-recentThread'); await persistEach(pageItems); return pageItems.length`
  - `backfillTickets` (loop por página): cambia `for (const t of pageItems) await persistTicket(t)` por `await persistEach(pageItems)` (conserva el resto del loop/paginación tal cual).
  - `backfillArchivedTickets`: cambia `for (const t of items) await persistTicket(t)` por `await persistEach(items)`.

- [ ] **Step 5:** Run `npx vitest run packages/zoho-sync/src/sync.test.ts` — confirm PASS (incl. los tests existentes).

- [ ] **Step 6:** Run `npx tsc -b && npx eslint packages/zoho-sync/src/sync.ts packages/zoho-sync/src/sync.test.ts` — sin errores; eslint 0 (warnings `no-explicit-any` aceptables).

- [ ] **Step 7: Commit**
```bash
git add packages/zoho-sync/src/sync.ts packages/zoho-sync/src/sync.test.ts
git commit -m "fix(sync): aislar fallos por-ticket (un ticket malo no aborta el ciclo)"
```

---

## Task 2: Capa B — numeración alta de tickets de app (`migrate.ts`) (TDD)

**Files:** Modify `packages/zoho-sync/src/db/migrate.ts`, `packages/zoho-sync/src/db/migrate.test.ts`

- [ ] **Step 1: Reescribir el test** existente de reseed en `migrate.test.ts` (reemplaza el `it('reseedTicketNumber deja la secuencia en el máximo number', …)` completo, líneas ~24-32) por (añade `nextTicketNumber` y `APP_TICKET_NUMBER_BASE` a los imports — `import { migrate, reseedTicketNumber, APP_TICKET_NUMBER_BASE, type Queryable } from './migrate'` y `import { nextTicketNumber } from './repo'`):
```ts
  it('reseedTicketNumber numera la app desde la base alta e ignora números de Zoho', async () => {
    const db = await freshDb()
    // un ticket de Zoho con número alto NO debe arrastrar la secuencia de la app
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('z', 958, 'Ingresado', false)")
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(APP_TICKET_NUMBER_BASE) // 1.000.000, no 959
    // con un ticket de app existente, continúa desde su número
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('app1', 1000005, 'Ingresado', true)")
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(1000006)
  })
```

- [ ] **Step 2:** Run `npx vitest run packages/zoho-sync/src/db/migrate.test.ts -t "base alta"` — confirm FAIL.

- [ ] **Step 3:** En `migrate.ts`, añade la constante exportada y reescribe `reseedTicketNumber`:
```ts
/** Base del espacio de numeración de tickets creados por la app (separado del de Zoho). */
export const APP_TICKET_NUMBER_BASE = 1_000_000

/** Re-siembra la secuencia de la app: solo mira tickets de la app, con piso en la base (nunca arrastra a Zoho). */
export async function reseedTicketNumber(db: Queryable): Promise<void> {
  const r = await db.query('SELECT COALESCE(MAX(number),0) AS m FROM tickets WHERE managed_by_app = true')
  const next = Math.max(Number(r.rows[0].m), APP_TICKET_NUMBER_BASE - 1) // setval = "último usado"; siguiente nextval = +1
  await db.query(`SELECT setval('ticket_number_seq', $1)`, [next])
}
```
  (`nextTicketNumber`/`createTicket` quedan **sin cambios**.)

- [ ] **Step 4:** Run `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` — confirm PASS (todo el archivo).

- [ ] **Step 5:** Run `npx tsc -b && npx eslint packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/migrate.test.ts` — sin errores; eslint 0.

- [ ] **Step 6: Commit**
```bash
git add packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/migrate.test.ts
git commit -m "fix(numeracion): tickets de app en rango alto (base 1.000.000), reseed ignora Zoho"
```

---

## Task 3: Verificación completa + runbook de despliegue/datos

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)`
Expected: tests PASS (incl. sync.test, migrate.test); ambos tsc exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Commit final (si hubo ajustes) + push**
```bash
git add -A
git commit -m "chore(fix-numeracion): verificado" || true
git push origin main
```
  (El push dispara el rebuild de `ambientalia-desk` y `zoho-hub-sync` en EasyPanel.)

- [ ] **Step 3: Borrado del ticket de prueba (manual en EasyPanel — NO es código):**
  Servicio `desk-db` → Postgres Client → `\c desk` →
```sql
DELETE FROM ticket_reads WHERE ticket_id = 'app-13ba40fd-7968-4d1e-9e14-5f37abe25fbf';
DELETE FROM tickets      WHERE id        = 'app-13ba40fd-7968-4d1e-9e14-5f37abe25fbf';
```
  (Si `DELETE FROM tickets` fallara por FK, borrar antes las filas hijas; en este esquema son `text` sin FK → basta el borrado directo.)

- [ ] **Step 4: Validar (tras deploy + borrado):**
  - Logs de `ambientalia-desk`: el `Sync incremental` **ya NO** spamea `duplicate key (number)=(954)`; los tickets sincronizan.
  - En `desk`: `SELECT number FROM tickets WHERE number = 954;` → ahora es el ticket de **Zoho** (ya entró). `SELECT max(number) FROM tickets WHERE managed_by_app = true;` → vacío (no hay tickets de app) o ≥ 1.000.000 si creas uno nuevo.
  - Crear un **ticket de prueba** en la app → su número debe ser **#1000000** (rango alto), sin colisión.

---

## Notas de cierre
- Ambos pasos (deploy del código + borrado del #954) son necesarios: el código evita la **recurrencia**; el borrado libera el **954 actual** para Zoho.
- Fuera de alcance: Opción A (write-back), Etapa 2 (deploys independientes), separación en repos, rotación de secretos.
