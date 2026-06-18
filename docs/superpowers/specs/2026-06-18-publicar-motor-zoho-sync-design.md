# Diseño — Publicar el motor `@ambientalia/zoho-sync` (Enfoque C: paquete publicable, monorepo se queda)

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Depende de:** monorepo Etapa 1 (packages/* + apps/*). Memoria `zoho-hub-arquitectura`, `debt.md` (independización).

## Contexto y objetivo

El motor de sync vive en `packages/zoho-sync` (+ `packages/shared`), consumido por `apps/desk` y `apps/hub-sync` como
**fuente `.ts`** (vía `exports: ./*: ./src/*.ts` + tsx + aliases). Los paquetes son `private:true, version 0.0.0`.

**Objetivo (Enfoque C, confirmado):** hacer **`@ambientalia/zoho-sync` y `@ambientalia/shared` publicables** a **GitHub
Packages** (compilados + versionados) para que apps externas futuras los reutilicen, **sin cambiar** cómo el monorepo los
consume hoy. Es una capacidad **aditiva**. (Las apps `desk`/`hub-sync` NO se publican; siguen en el monorepo con despliegue
por `APP_ENTRYPOINT`.)

**Decisiones (de la conversación):**
- Enfoque C (publicar el motor) — NO la separación total en 3 repos (A) ni solo deploys (B). El motor es lo único con reuso real.
- Mínimo viable: habilitar publish + publicar **v1.0.0** + documentar el consumo externo. Sin CI pesada.
- **YAGNI declarado:** aún no hay consumidor externo; publicar prueba la capacidad, el paquete queda disponible para cuando aparezca.

## Riesgo central a de-riesgar PRIMERO (spike, plan Task 1)

El monorepo consume **fuente**; un paquete publicado debe enviar **JS compilado + `.d.ts`**. El mecanismo propuesto =
**exports condicionales** (`development`→src, `default`→dist) + `tsx --conditions=development` para lo interno. **Antes de
tocar todo**, un spike confirma que con exports condicionales:
1. `tsx --conditions=development` resuelve `@ambientalia/zoho-sync/db/migrate` → `./src/db/migrate.ts` (fuente).
2. `vitest` y `vite` resuelven a fuente (vía sus aliases/conditions).
3. `tsc -b` (typecheck) resuelve vía tsconfig paths a `src`.
Si algún resolutor no coopera, se ajusta el mecanismo (p. ej. mantener `exports` a src + un `exports` de publicación generado
en build, o aliases explícitos) **antes** de comprometer el resto. (Lección de la sesión: de-riesgar resolución antes de construir.)

## Cambios por paquete (`packages/zoho-sync`, `packages/shared`)

- **`package.json`:**
  - `version: "1.0.0"`, quitar `private: true` (o `publishConfig.access`), añadir `repository`, `files: ["dist"]`.
  - `exports` condicionales:
    ```json
    "exports": { "./*": { "development": "./src/*.ts", "types": "./dist/*.d.ts", "default": "./dist/*.js" } }
    ```
    (`shared` usa `"."` además de `./*` si exporta un índice; reflejar su forma actual.)
  - `"main"`/`"types"` → dist (para herramientas que no leen exports).
  - `"build": "tsc -p tsconfig.build.json"` en `scripts`.
  - `publishConfig: { "registry": "https://npm.pkg.github.com" }`.
- **`tsconfig.build.json`** por paquete: extiende la base, `outDir: dist`, `declaration: true`, `rootDir: src`, `noEmit: false`,
  incluye `src/**/*` (excluye tests).
- **`schema.sql`/`schema-books.sql`/`schema-crm.sql`:** son `.sql` (no los emite tsc). Hay que **copiarlos a `dist/`** en el
  build (paso `copyfiles`/script) y que el código los lea relativo a su ubicación (ya usan `fileURLToPath(import.meta.url)`,
  que en dist apuntará a `dist/db/schema.sql` → el copy debe preservar la ruta relativa). El consumidor externo necesita esos `.sql`.

## Consumo interno del monorepo (no cambia el día a día)

- **tsx (runtime worker/Desk):** añadir `--conditions=development` a: `start`, `start:hub-sync`, `dev:api` (root `package.json`)
  y al **CMD del Dockerfile** (`npx tsx --conditions=development "${APP_ENTRYPOINT...}"`). Así resuelve a `src` (fuente, como hoy).
- **vite/vitest:** ya usan aliases a `src` (extender a `@ambientalia/zoho-sync` si hiciera falta, o añadir `resolve.conditions: ['development']`).
- **tsc:** `tsconfig.base.json` paths ya apuntan a `src` → typecheck contra fuente sin cambios.
- **Resultado:** `npm test`, `tsc -b`, build y arranque siguen verde, consumiendo fuente. El `dist/` solo lo usan consumidores externos.

## Publicación a GitHub Packages

- **`.npmrc`** (raíz, para publicar): `@ambientalia:registry=https://npm.pkg.github.com` + `//npm.pkg.github.com/:_authToken=${NPM_TOKEN}`.
- **Publicar v1.0.0:** opción simple = **script manual** (`npm run build` por paquete → `npm publish --workspace @ambientalia/shared`
  → idem zoho-sync; shared primero por la dependencia). Auth = un **PAT con `write:packages`** del owner del repo, en `NPM_TOKEN`.
  (Opción futura: GitHub Action en *release* que haga build+publish; fuera de alcance del mínimo.)
- **Orden:** publicar `@ambientalia/shared` antes que `@ambientalia/zoho-sync` (dependencia). `zoho-sync` declara
  `@ambientalia/shared: "^1.0.0"` (no `"*"`).

## Consumidor externo (documentación)

Un proyecto externo que quiera el motor:
1. `.npmrc`: `@ambientalia:registry=https://npm.pkg.github.com` + un token de **lectura** (`read:packages`).
2. `npm i @ambientalia/zoho-sync@^1` → trae `dist/` (JS + types). Aporta su propia config (env Zoho) y un `pg` Pool.
Documentar en un `docs/` o README del paquete.

## Pruebas / verificación

- **Spike (Task 1):** resolución condicional OK en tsx/vitest/vite/tsc (ver arriba).
- **Monorepo intacto:** `npm test`, `tsc -b`, `tsc server`, `eslint`, `vite build` verdes; arranque de Desk/worker vía `tsx --conditions=development`.
- **Build de paquetes:** `npm run build` por lib emite `dist/` con JS + `.d.ts` + los `.sql` copiados.
- **`npm pack` dry-run:** el tarball incluye `dist/` (no `src/` de más de lo necesario).
- **Publish v1.0.0** (manual, con PAT) y, opcional, instalación en un proyecto de prueba para confirmar que resuelve a `dist`.

## Despliegue

- El **Dockerfile** del worker/Desk añade `--conditions=development` al CMD → sin cambio funcional (sigue corriendo fuente).
- Publicar es manual/CI, **fuera del runtime** de los servicios. No afecta los despliegues actuales.

## Fuera de alcance

- Enfoque A (3 repos) y B (deploys separados). Separar Desk/worker en repos propios. CI de publish automática (más allá de un script).
- Consumir la versión publicada DENTRO del monorepo (sigue consumiendo fuente). Rotación de secretos.
