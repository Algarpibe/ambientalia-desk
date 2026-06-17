# Diseño — Independizar `zoho-hub-sync` (monorepo + deploys independientes)

**Fecha:** 2026-06-17
**Estado:** Aprobado para planificación
**Contexto:** Hoy el worker `zoho-hub-sync` y la Desk app **comparten el mismo repo/código**; el worker arranca con
`APP_ENTRYPOINT=hub-sync.ts`. Queremos que `zoho-hub-sync` sea un **proyecto hermano** (fuera de Desk), con
**deploy propio**, reutilizando el motor de sync **sin duplicar**. Base para la futura expansión de ingesta
(Books rico, CRM). Decisión: **monorepo npm workspaces + despliegues independientes** (ver memoria
`zoho-hub-arquitectura`). Repos git separados se difieren (triviales tras la Opción A).

## Decisiones (confirmadas)
- **Monorepo** (un repo) con **npm workspaces**: `packages/*` (código compartido) + `apps/*` (desplegables).
- **Deploys independientes:** cada app con su propio Dockerfile y su propio servicio EasyPanel.
- **Sin duplicar** el motor (paquetes compartidos locales, no publicados).
- **2 etapas** para de-riesgar producción: (1) estructura con deploy sin cambios; (2) split de deploys.

## Estructura objetivo
```
<repo>/
├── package.json                 # { "private": true, "workspaces": ["packages/*","apps/*"] }
├── package-lock.json            # único (workspaces)
├── tsconfig.base.json           # opciones comunes; cada workspace extiende
├── eslint.config.js             # raíz (puede cubrir todo el workspace)
├── vitest.config.ts             # raíz con "projects" → corre tests de todos los workspaces
├── packages/
│   ├── shared/                  # @ambientalia/shared  (lo de shared/ actual)
│   │   ├── package.json  tsconfig.json
│   │   └── src/ types.ts columns.ts transitions.ts permissions.ts ticketCreate.ts historyMap.ts analisis.ts (+ *.test.ts)
│   └── zoho-sync/               # @ambientalia/zoho-sync  (MOTOR de ingesta)
│       ├── package.json  tsconfig.json
│       └── src/
│           ├── config.ts tokenManager.ts zohoClient.ts sync.ts
│           ├── books/ booksClient.ts sync.ts mappers.ts repo.ts (+ tests)
│           └── db/ pool.ts migrate.ts repo.ts mappers.ts rows.ts activities.ts history.ts schema.sql (+ tests)
├── apps/
│   ├── desk/                    # la Desk app (web+API)
│   │   ├── package.json  tsconfig*.json  vite.config.ts  tailwind/postcss  index.html  Dockerfile
│   │   ├── server/ app.ts index.ts auth/ equipos.ts resolutions.ts directory.ts analisis.ts measure.ts
│   │   │            transitionExec.ts transitionActor.ts backfill.ts backfillSerial.ts (+ tests)
│   │   └── src/ (frontend React: App.tsx, main.tsx, components/, hooks/, lib/, api/, board.ts, …)
│   └── hub-sync/                # el worker
│       ├── package.json  tsconfig.json  Dockerfile
│       └── src/ hubSync.ts hub-sync.ts (+ hubSync.test.ts)
```

## Límites de cada paquete (qué importa quién)
- **`@ambientalia/shared`**: tipos + lógica de dominio pura (transiciones/permisos/columnas/ticketCreate/analisis/historyMap). La importan **apps/desk (server y frontend)** y **packages/zoho-sync** (tipos/mappers).
- **`@ambientalia/zoho-sync`**: motor de ingesta (Zoho client/token, sync Desk+Books, capa db + `schema.sql` + `migrate`). La importan **apps/hub-sync** y **apps/desk** (server, para su `syncRecent` local y sus lecturas/repo).
- **`apps/desk`**: todo lo específico de la Desk app (Express, auth, equipos, resolutions, directory, analisis server, transiciones, frontend).
- **`apps/hub-sync`**: solo `hubBootstrap`/`scheduleHubSync` + entrypoint.

Regla práctica: `apps/desk/server` deja de importar `./db/...`/`./sync` y pasa a `@ambientalia/zoho-sync`; el frontend y el server dejan de importar `../../shared/...` y pasan a `@ambientalia/shared`.

## Detalles técnicos
- **`schema.sql`** se queda **junto a `migrate.ts`** en `packages/zoho-sync/src/db/` (migrate lo lee por `import.meta.url`, sigue funcionando).
- **tsconfig:** `tsconfig.base.json` con las opciones comunes; cada paquete/app extiende y declara sus `references` (project references) para build incremental.
- **vitest:** un `vitest.config.ts` raíz con `test.projects` apuntando a cada workspace (los tests se mueven **con** sus módulos).
- **eslint:** config raíz cubriendo `packages/**` y `apps/**`.
- **Ejecución (tsx):** las apps siguen corriendo con `tsx` (sin compilar el server); el frontend con `vite build`.

## Etapas de ejecución (de-riesgar)
- **Etapa 1 — estructura (deploy SIN cambios):** crear workspaces, mover archivos a `packages/*`+`apps/*`,
  recablear imports/tsconfig/vitest/eslint. **Mantener el Dockerfile raíz actual + `APP_ENTRYPOINT`** (que ahora
  apunte a `apps/hub-sync/src/hub-sync.ts` vs `apps/desk/server/index.ts`). Gate: `npm test` + `tsc -b` +
  `vite build` + **docker build** verdes. Los dos servicios EasyPanel siguen igual (misma imagen/entrypoint).
- **Etapa 2 — deploys independientes:** un **Dockerfile por app** (`apps/desk/Dockerfile`, `apps/hub-sync/Dockerfile`)
  con **build context = raíz** del repo (para resolver el workspace: `npm ci` en raíz, luego arrancar la app).
  En EasyPanel: en cada servicio fijar **Dockerfile path** = `apps/<x>/Dockerfile`; quitar `APP_ENTRYPOINT`.
  Validar **ambos** despliegues antes de dar por cerrado.

## Pruebas / seguridad
- Refactor **grande pero mecánico**. Red de seguridad: la **suite completa (204 tests)** + `tsc -b` +
  `tsc` server + `eslint` + `vite build` + **docker build** de cada app.
- Se ejecuta en **rama/worktree aislado**; no se fusiona hasta que todo esté verde y, en Etapa 2, **ambos
  despliegues** validados en EasyPanel.

## Fuera de alcance (otros sub-proyectos)
- **Books rico** y **CRM** en Node (expansión de ingesta) — después, sobre esta base.
- **Repos git separados** (post-Opción A), **Opción A** (write-back), rotación de secretos.
