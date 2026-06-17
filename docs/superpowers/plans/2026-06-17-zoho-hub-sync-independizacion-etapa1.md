# Independizar zoho-hub-sync — Etapa 1 (estructura) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`). **Ejecutar en un worktree/rama aislada** (`superpowers:using-git-worktrees`); NO fusionar hasta que TODO el gate esté verde. El refactor es mecánico pero la resolución (tsconfig/vite/vitest) es empírica: tras cada movimiento, `tsc -b` lista los imports rotos → arréglalos al nuevo especificador hasta verde.

**Goal:** Reorganizar el repo en monorepo npm workspaces (`packages/shared`, `packages/zoho-sync`, `apps/desk`, `apps/hub-sync`) **sin cambiar el despliegue** (sigue 1 Dockerfile raíz + `APP_ENTRYPOINT`).

**Architecture:** Workspaces npm + tsconfig `paths` + alias de vite/vitest que mapean los nombres de paquete a su **código fuente** (`.ts`, sin build de los paquetes; el server corre con `tsx`, el front con vite). Los módulos del motor se mueven con sus imports internos **relativos intactos**; solo los imports que **cruzan** frontera de paquete pasan a `@ambientalia/shared` / `@ambientalia/zoho-sync/...`.

**Tech Stack:** TS ESM, npm workspaces, tsx, Vite 6, Vitest 3, ESLint. Spec: `docs/superpowers/specs/2026-06-17-zoho-hub-sync-independizacion-design.md`.

**Gate de verificación (tras cada tarea):** `npm test` (204) · `npx tsc -b` · `npx tsc -p apps/desk/tsconfig.server.json --noEmit` (o equivalente) · `npx vite build` (en apps/desk) — todo verde antes de commit.

**Contexto del repo (verificado):**
- Raíz hoy: `package.json` (name `desk-ambientalia`, scripts dev/build/start/start:hub-sync/test, deps express/pg/react…), `tsconfig.{json,app,node,server}.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tailwind/postcss`, `index.html`, `src/` (frontend), `server/`, `shared/`.
- `shared/`: `types,columns,transitions,permissions,ticketCreate,historyMap,analisis` (+ tests). 42 archivos importan `(../)+shared/<mod>`.
- Motor (→ `packages/zoho-sync`): `server/config.ts, tokenManager.ts, zohoClient.ts, sync.ts`, `server/books/{booksClient,sync,mappers,repo}.ts`, `server/db/{pool,migrate,repo,mappers,rows,activities,history}.ts` + `server/db/schema.sql` + sus `*.test.ts`.
- Desk-app server (→ `apps/desk/server`): `app.ts, index.ts`, `auth/`, `db/{equipos,resolutions,directory,seedEquipos}.ts`, `analisis.ts, measure.ts, transitionExec.ts, transitionActor.ts, backfill.ts, backfillSerial.ts` + tests + `db/equipos.seed.csv`.
- Worker (→ `apps/hub-sync`): `server/hubSync.ts, hub-sync.ts` (+ `hubSync.test.ts`).
- `migrate.ts` lee `schema.sql` por `import.meta.url` → **mantener `schema.sql` junto a `migrate.ts`** dentro de zoho-sync.

---

## Convenciones de import (reglas de recableado)
- `from '(../)+shared/<mod>'` → `from '@ambientalia/shared'` (barrel) **en TODO el repo** (server, frontend).
- En **apps/desk/server** y **apps/hub-sync**, los imports que apuntaban a módulos del **motor** (`./config`, `./db/migrate`, `./sync`, `./zohoClient`, `./tokenManager`, `./db/repo`, `./db/mappers`, `./db/pool`, `./db/rows`, `./db/activities`, `./db/history`, `./books/<x>`) → `@ambientalia/zoho-sync/<misma-ruta-sin-./>` (p.ej. `./db/repo` → `@ambientalia/zoho-sync/db/repo`; `./sync` → `@ambientalia/zoho-sync/sync`).
- **Imports internos del motor** (entre archivos que se mueven juntos a zoho-sync) → **se quedan relativos** (se mueven juntos; no cambian).
- Regla operativa: tras mover, correr `npx tsc -b` y arreglar cada error de módulo no encontrado aplicando las reglas de arriba, hasta 0 errores.

---

## Task 1: Esqueleto de workspaces (sin mover lógica todavía)

**Files:** Modify `package.json`; Create `tsconfig.base.json`, `packages/`, `apps/` (dirs)

- [ ] **Step 1:** Crear worktree aislado y trabajar ahí (skill using-git-worktrees). Confirmar `npm ci` actual verde.
- [ ] **Step 2:** En `package.json` raíz, añadir workspaces y marcar privado:
```json
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
```
- [ ] **Step 3:** Crear `tsconfig.base.json` con las `compilerOptions` comunes que hoy están en `tsconfig.json`/`tsconfig.server.json` (target/module/moduleResolution `Bundler` o `NodeNext` según el actual, `strict`, `esModuleInterop`, `skipLibCheck`, etc.) **+** `paths`:
```json
{
  "compilerOptions": {
    "paths": {
      "@ambientalia/shared": ["./packages/shared/src/index.ts"],
      "@ambientalia/zoho-sync/*": ["./packages/zoho-sync/src/*"]
    }
  }
}
```
  (Copiar las opciones reales del tsconfig actual; este archivo es la base que extenderán los demás.)
- [ ] **Step 4:** `npm install` (regenera lock con workspaces). Verifica que no rompe nada aún: `npm test && npx tsc -b`.
- [ ] **Step 5: Commit** `git add -A && git commit -m "chore(monorepo): habilitar npm workspaces + tsconfig.base"`

---

## Task 2: `packages/shared` (@ambientalia/shared)

**Files:** Create `packages/shared/{package.json,tsconfig.json,src/index.ts}`; Move `shared/*` → `packages/shared/src/`

- [ ] **Step 1:** `git mv shared packages/shared/src` (queda `packages/shared/src/{types,columns,...}.ts` + tests).
- [ ] **Step 2:** Crear `packages/shared/package.json`:
```json
{ "name": "@ambientalia/shared", "version": "0.0.0", "private": true, "type": "module",
  "main": "src/index.ts", "exports": { ".": "./src/index.ts", "./*": "./src/*.ts" } }
```
- [ ] **Step 3:** Crear `packages/shared/src/index.ts` (barrel) re-exportando todos los módulos:
```ts
export * from './types'
export * from './columns'
export * from './transitions'
export * from './permissions'
export * from './ticketCreate'
export * from './historyMap'
export * from './analisis'
```
- [ ] **Step 4:** Crear `packages/shared/tsconfig.json` (`extends ../../tsconfig.base.json`, `include ["src"]`).
- [ ] **Step 5:** Recablear TODO el repo: `from '(../)+shared/<mod>'` → `from '@ambientalia/shared'`. (Buscar con `grep -rlE "from '(\.\./)+shared/" .` y reemplazar; luego `tsc -b` para cazar los que queden.)
- [ ] **Step 6:** Añadir alias en `vite.config.ts` y `vitest.config.ts`: `resolve.alias['@ambientalia/shared'] = <abs>/packages/shared/src/index.ts`.
- [ ] **Step 7:** Gate verde (`npm test && npx tsc -b && npx vite build`). Arreglar imports hasta 0 errores.
- [ ] **Step 8: Commit** `git add -A && git commit -m "refactor(monorepo): extraer packages/shared (@ambientalia/shared)"`

---

## Task 3: `packages/zoho-sync` (@ambientalia/zoho-sync)

**Files:** Create `packages/zoho-sync/{package.json,tsconfig.json}`; Move engine modules → `packages/zoho-sync/src/`

- [ ] **Step 1:** Mover el motor preservando subrutas:
```bash
mkdir -p packages/zoho-sync/src/db packages/zoho-sync/src/books
git mv server/config.ts server/tokenManager.ts server/zohoClient.ts server/sync.ts packages/zoho-sync/src/
git mv server/config.test.ts server/tokenManager.test.ts server/zohoClient.test.ts server/sync*.test.ts packages/zoho-sync/src/
git mv server/db/pool.ts server/db/migrate.ts server/db/repo.ts server/db/mappers.ts server/db/rows.ts server/db/activities.ts server/db/history.ts server/db/schema.sql packages/zoho-sync/src/db/
git mv server/db/migrate.test.ts server/db/repo.test.ts server/db/mappers.test.ts server/db/activities.test.ts server/db/history.test.ts packages/zoho-sync/src/db/
git mv server/books/booksClient.ts server/books/sync.ts server/books/mappers.ts server/books/repo.ts packages/zoho-sync/src/books/
git mv server/books/*.test.ts packages/zoho-sync/src/books/
```
  (Los imports **internos** entre estos archivos son relativos `./db/...`, `./books/...`, `../sync` — se mueven juntos, siguen resolviendo.)
- [ ] **Step 2:** `packages/zoho-sync/package.json`:
```json
{ "name": "@ambientalia/zoho-sync", "version": "0.0.0", "private": true, "type": "module",
  "exports": { "./*": "./src/*.ts" },
  "dependencies": { "@ambientalia/shared": "*" } }
```
- [ ] **Step 3:** `packages/zoho-sync/tsconfig.json` (`extends ../../tsconfig.base.json`, `include ["src"]`).
- [ ] **Step 4:** Recablear en **apps-server/worker** (lo que aún vive en `server/`) los imports al motor según la regla (`./db/repo` → `@ambientalia/zoho-sync/db/repo`, etc.). Dentro de zoho-sync, los imports a `shared` ya quedaron como `@ambientalia/shared` (Task 2).
- [ ] **Step 5:** Alias en vite/vitest: `'@ambientalia/zoho-sync'` por wildcard → mapear a `packages/zoho-sync/src/*` (vitest: usar `resolve.alias` con regex o entradas explícitas; vite igual).
- [ ] **Step 6:** Gate verde. `tsc -b` guía los imports faltantes. Verificar que `migrate` encuentra `schema.sql` (su test pg-mem corre).
- [ ] **Step 7: Commit** `git add -A && git commit -m "refactor(monorepo): extraer packages/zoho-sync (motor de ingesta)"`

---

## Task 4: `apps/desk`

**Files:** Create `apps/desk/{package.json,tsconfig*.json,vite.config.ts,...}`; Move `server/` restante + `src/` + configs front

- [ ] **Step 1:** Mover lo de la Desk app:
```bash
mkdir -p apps/desk
git mv server apps/desk/server          # lo que queda: app.ts,index.ts,auth/,db/{equipos,resolutions,directory,seedEquipos}, analisis.ts, measure.ts, transition*, backfill*, hubSync*/hub-sync (se moverán en Task 5)
git mv src apps/desk/src
git mv index.html vite.config.ts tailwind.config.js postcss.config.js apps/desk/
git mv tsconfig.app.json tsconfig.node.json tsconfig.server.json apps/desk/
```
- [ ] **Step 2:** `apps/desk/package.json` (name `@ambientalia/desk`, `private`, `type module`, scripts `dev/build/start`, deps: express/pg/react/etc. + `@ambientalia/shared` + `@ambientalia/zoho-sync`). Ajustar `vite.config.ts` (root sigue siendo apps/desk) y los tsconfig (`extends ../../tsconfig.base.json`, paths/refs).
- [ ] **Step 3:** Ajustar rutas relativas que se rompan por el move del front/config (p.ej. `vite.config.ts` root, `index.html` script src, alias) y los imports server→motor/shared (ya casi todos hechos en Tasks 2–3; `tsc -b` caza el resto).
- [ ] **Step 4:** Gate verde **incluyendo** `cd apps/desk && npx vite build` (el frontend compila) + `npm test` (raíz, todos los proyectos).
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(monorepo): mover Desk app a apps/desk"`

---

## Task 5: `apps/hub-sync`

**Files:** Create `apps/hub-sync/{package.json,tsconfig.json}`; Move worker

- [ ] **Step 1:** `mkdir -p apps/hub-sync/src && git mv apps/desk/server/hubSync.ts apps/desk/server/hub-sync.ts apps/desk/server/hubSync.test.ts apps/hub-sync/src/`
- [ ] **Step 2:** `apps/hub-sync/package.json` (name `@ambientalia/hub-sync`, `private`, `type module`, deps: `@ambientalia/zoho-sync`, `@ambientalia/shared`, `dotenv`; sin express/react) + `tsconfig.json` (extends base).
- [ ] **Step 3:** En `hub-sync.ts`/`hubSync.ts` recablear imports del motor a `@ambientalia/zoho-sync/...` (config, db/migrate, db/repo, sync, books/sync, books/repo, tokenManager, zohoClient, db/pool).
- [ ] **Step 4:** Gate verde (`npm test` incl. `hubSync.test.ts` en su nueva ubicación; `tsc -b`).
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(monorepo): mover worker a apps/hub-sync"`

---

## Task 6: Dockerfile raíz + entrypoints (deploy SIN cambios)

**Files:** Modify `Dockerfile`, `package.json` (scripts raíz)

- [ ] **Step 1:** Actualizar `Dockerfile` (sigue 1 solo, en la raíz): el `npm ci` instala el workspace; copiar `packages/` + `apps/`; el `CMD` mantiene el switch por `APP_ENTRYPOINT` pero con rutas nuevas:
```dockerfile
CMD ["sh", "-c", "npx tsx \"${APP_ENTRYPOINT:-apps/desk/server/index.ts}\""]
```
  (Worker: `APP_ENTRYPOINT=apps/hub-sync/src/hub-sync.ts`.) El `npm run build` debe compilar el front de `apps/desk` (ajustar el script raíz `build` a `npm --workspace @ambientalia/desk run build` o `cd apps/desk && vite build`), y copiar el `dist` resultante.
- [ ] **Step 2:** Scripts raíz en `package.json`: `start` → `cross-env NODE_ENV=production tsx apps/desk/server/index.ts`; `start:hub-sync` → `… tsx apps/hub-sync/src/hub-sync.ts`; `dev:api`, `test`, `build` ajustados a las nuevas rutas/workspaces.
- [ ] **Step 3:** `docker build .` local (o `docker build -t test .`) → **debe construir sin error**. Verificar que la imagen arranca ambos modos (probar `docker run` con env mínimas que fallen limpio, o al menos que el build pase).
- [ ] **Step 4: Commit** `git add -A && git commit -m "build(monorepo): Dockerfile + scripts a rutas apps/* (APP_ENTRYPOINT)"`

---

## Task 7: Verificación completa

- [ ] **Step 1:** `npm test && npx tsc -b && npx vite build` (en apps/desk) `&& docker build -t ambientalia-test .` — todo verde.
- [ ] **Step 2:** Revisar que **NO** quedan imports `'(../)+shared/'` ni `'./db/…'`/`'./sync'` cruzando paquetes: `grep -rE "from '(\.\./)+shared/|from '\./(sync|config|zohoClient|tokenManager)'" apps/ packages/` → 0 (salvo internos del motor).
- [ ] **Step 2.5: Code review** (subagente): boundaries de paquetes correctos, sin duplicación, sin ciclos, schema.sql junto a migrate, tests movidos con sus módulos.
- [ ] **Step 3: Fusionar** la rama y desplegar: en EasyPanel, **sin cambios de config** (mismo repo, mismo Dockerfile; el worker ya usa `APP_ENTRYPOINT`, ahora apuntando a `apps/hub-sync/src/hub-sync.ts`). Verificar **ambos** servicios arrancan (Desk: SPA+API; hub-sync: logs de sync).

---

## Notas de cierre
- Etapa 2 (Dockerfile por app + servicios EasyPanel independientes, quitar `APP_ENTRYPOINT`) = plan aparte, tras Etapa 1 verde y desplegada.
- Si la resolución de paquetes-como-fuente da guerra en algún runner (tsx/vite/vitest), la palanca es alinear los **tres** (tsconfig `paths`, alias vite, alias vitest) al mismo mapeo a `src`.
- `APP_ENTRYPOINT` del servicio `zoho-hub-sync` en EasyPanel deberá pasar de `hub-sync.ts` a `apps/hub-sync/src/hub-sync.ts` al desplegar esta rama.
