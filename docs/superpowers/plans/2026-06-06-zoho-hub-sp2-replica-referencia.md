# zoho-hub SP2 (B) — réplica de referencia hub→desk — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La Desk app deja de sincronizar localmente `contacts`/`activities`/`clients`/`sales_orders` (las lee de una réplica del hub), mediante 3 flags que apagan esos loops; la replicación se monta por runbook (infra).

**Architecture:** Solo código: 3 flags en `config` (default `true`) que gatean `syncContacts`, `syncActivities` y el sync de Books en `server/index.ts`. `syncRecent` y las escrituras del app intactos. El servicio `zoho-hub-sync` NO se toca. La replicación hub→desk (publicación/suscripción) y el cutover son pasos manuales de infra (runbook).

**Tech Stack:** TS ESM (server por `tsx`), Vitest, Postgres logical replication. Spec: `docs/superpowers/specs/2026-06-06-zoho-hub-sp2-replica-referencia-design.md`.

**Contexto del repo (verificado):**
- `server/config.ts`: `interface AppConfig` (línea 1) + `loadConfig` (devuelve objeto, líneas ~32-53). Patrón de default: `env.X || 'default'` o `env.X ? Number(env.X) : N`. Para booleano-default-true: `env.X !== 'false'`.
- `server/index.ts` (dentro de `main()`): sync inicial de actividades (`sync.syncActivities().then(...).catch(...)`) y de contactos (`sync.syncContacts()...`); `setInterval` incremental `sync.syncRecent().then(()=>sync.syncActivities()).then(()=>sync.syncContacts())...`; bloque Books `if (config.booksRefreshToken && config.booksOrgId) { ... setInterval(booksSync.syncRecent...) }`.
- `server/config.test.ts`: usa `base` (env mínimo) + `loadConfig`.
- El hub-sync (`server/hubSync.ts`, `server/hub-sync.ts`) NO lee estos flags → no se modifica.

---

## Estructura de archivos
- Modify `server/config.ts` (+ `server/config.test.ts`) — 3 flags.
- Modify `server/index.ts` — gatear los 3 loops.
- (Manual) runbook de cutover — Task 3 (infra, lo corre el usuario).

---

## Task 1: Flags de sync en config (TDD)

**Files:** Modify `server/config.ts`, `server/config.test.ts`

- [ ] **Step 1: Test** en `server/config.test.ts`, añade dentro del `describe('loadConfig', …)`:
```ts
  it('flags de sync local: default true; se desactivan con "false"', () => {
    const def = loadConfig(base)
    expect(def.syncContacts).toBe(true)
    expect(def.syncActivities).toBe(true)
    expect(def.syncBooks).toBe(true)
    const off = loadConfig({ ...base, SYNC_CONTACTS: 'false', SYNC_ACTIVITIES: 'false', SYNC_BOOKS: 'false' })
    expect(off.syncContacts).toBe(false)
    expect(off.syncActivities).toBe(false)
    expect(off.syncBooks).toBe(false)
  })
```

- [ ] **Step 2:** Run `npx vitest run server/config.test.ts` — confirm FAIL (propiedades inexistentes / `undefined`).

- [ ] **Step 3: En `server/config.ts`:**
  - En `interface AppConfig`, añade (junto a `syncIntervalMs`):
```ts
  syncContacts: boolean
  syncActivities: boolean
  syncBooks: boolean
```
  - En el objeto que devuelve `loadConfig` (junto a `syncIntervalMs: …,`), añade:
```ts
    syncContacts: env.SYNC_CONTACTS !== 'false',
    syncActivities: env.SYNC_ACTIVITIES !== 'false',
    syncBooks: env.SYNC_BOOKS !== 'false',
```

- [ ] **Step 4:** Run `npx vitest run server/config.test.ts` — confirm PASS.

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/config.ts server/config.test.ts` — sin errores; eslint 0.

- [ ] **Step 6: Commit**
```bash
git add server/config.ts server/config.test.ts
git commit -m "feat(sp2): flags SYNC_CONTACTS/ACTIVITIES/BOOKS (default true)"
```

---

## Task 2: Gatear los loops en `index.ts`

**Files:** Modify `server/index.ts`

- [ ] **Step 1: Gatear los syncs iniciales.** Reemplaza:
```ts
  sync.syncActivities()
    .then((n) => console.log(`Actividades: sync inicial (${n})`))
    .catch((e) => console.error('Sync actividades falló:', e))

  sync.syncContacts()
    .then((n) => console.log(`Contactos: sync inicial (${n})`))
    .catch((e) => console.error('Sync contactos falló:', e))
```
  por:
```ts
  if (config.syncActivities) {
    sync.syncActivities()
      .then((n) => console.log(`Actividades: sync inicial (${n})`))
      .catch((e) => console.error('Sync actividades falló:', e))
  }

  if (config.syncContacts) {
    sync.syncContacts()
      .then((n) => console.log(`Contactos: sync inicial (${n})`))
      .catch((e) => console.error('Sync contactos falló:', e))
  }
```

- [ ] **Step 2: Gatear el incremental.** Reemplaza:
```ts
  let syncing = false
  setInterval(() => {
    if (syncing) return // evita solapar sincronizaciones si una tarda más que el intervalo
    syncing = true
    sync
      .syncRecent()
      .then(() => sync.syncActivities())
      .then(() => sync.syncContacts())
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, config.syncIntervalMs)
```
  por:
```ts
  let syncing = false
  setInterval(() => {
    if (syncing) return // evita solapar sincronizaciones si una tarda más que el intervalo
    syncing = true
    let p: Promise<unknown> = sync.syncRecent()
    if (config.syncActivities) p = p.then(() => sync.syncActivities())
    if (config.syncContacts) p = p.then(() => sync.syncContacts())
    p.catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
  }, config.syncIntervalMs)
```

- [ ] **Step 3: Gatear Books.** Cambia la condición:
```ts
  if (config.booksRefreshToken && config.booksOrgId) {
```
  por:
```ts
  if (config.booksRefreshToken && config.booksOrgId && config.syncBooks) {
```

- [ ] **Step 4:** Run `npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/index.ts && npx vite build` — sin errores de tipos; eslint 0; build OK.

- [ ] **Step 5: Verificación de lógica (sin desplegar).** Confirma por lectura que:
  - `syncRecent` se llama SIEMPRE (no gateado).
  - actividades/contactos solo si su flag; Books solo si `booksRefreshToken && booksOrgId && syncBooks`.
  - el hub-sync (`server/hubSync.ts`/`hub-sync.ts`) NO fue modificado.

- [ ] **Step 6: Commit**
```bash
git add server/index.ts
git commit -m "feat(sp2): gatear syncContacts/syncActivities/Books por flag en index.ts"
```

---

## Task 3: Verificación completa + runbook de cutover (infra manual)

**Files:** (ninguno de código)

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS (incl. `config.test.ts`); ambos `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Commit (si hubo ajustes) + push**
```bash
git add -A
git commit -m "chore(sp2): verificado" || true
git push origin main
```

- [ ] **Step 3: Cutover (manual, lo ejecuta el usuario en EasyPanel — NO es código):**
  1. **Hub** (servicio `zoho-hub-db` → Postgres Client → `\c zoho-hub`):
     ```sql
     CREATE PUBLICATION zoho_ref_pub FOR TABLE contacts, activities, clients, sales_orders;
     ```
  2. **Desk app** (servicio `ambientalia-desk` → Variables de entorno): añadir
     `SYNC_CONTACTS=false`, `SYNC_ACTIVITIES=false`, `SYNC_BOOKS=false` → **Implementar** (redeploy).
     Verificar en logs que ya NO aparecen "Contactos: sync inicial", "Actividades: sync inicial",
     "Sync Zoho Books habilitado" (y sí sigue el incremental de `syncRecent`).
  3. **Desk** (servicio `desk-db` → Postgres Client → `\c desk`):
     ```sql
     TRUNCATE contacts, activities, clients, sales_orders;
     CREATE SUBSCRIPTION zoho_ref_sub
       CONNECTION 'host=ambientalia_project_zoho-hub-db port=5432 dbname=zoho-hub user=postgres password=<PASS_HUB> sslmode=disable'
       PUBLICATION zoho_ref_pub;
     ```
  4. **Verificar** (en `desk`):
     ```sql
     SELECT (SELECT count(*) FROM contacts) AS contactos, (SELECT count(*) FROM activities) AS actividades,
            (SELECT count(*) FROM clients) AS clientes, (SELECT count(*) FROM sales_orders) AS ovs;
     ```
     Deben cuadrar con el hub. Probar en el hub un `INSERT` en `contacts` y verlo en `desk` (y limpiarlo). La UI
     de **Clientes** y **Actividades** de la Desk app debe seguir funcionando.

- [ ] **Step 4: Rollback (si algo falla):** en `desk` `DROP SUBSCRIPTION zoho_ref_sub;`; en `ambientalia-desk`
  quitar/poner a `true` los 3 flags → redeploy → la app re-backfillea esas tablas con sus syncs. Sin pérdida.

---

## Notas de cierre
- El código del sync de esas 4 tablas **permanece** (solo gateado) → rollback instantáneo. Su limpieza es futura.
- DDL drift: si el hub cambia columnas de esas tablas, aplicar el `migrate`/`schema.sql` **primero en desk, luego
  en el hub**.
- Pendiente operativo: **rotar** secretos expuestos y usar la clave nueva del hub en la `CONNECTION` de la
  suscripción.
