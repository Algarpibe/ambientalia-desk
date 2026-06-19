# Publicar el motor `@algarpibe/zoho-sync` (Enfoque C) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Hacer `@algarpibe/shared` y `@algarpibe/zoho-sync` publicables a GitHub Packages (compilados + versionados), publicar v1.0.0, sin cambiar cómo el monorepo los consume (sigue en fuente).

> **NOTA DE SCOPE (decisión 2026-06-18):** GitHub Packages exige que el scope == dueño del repo. La cuenta es el usuario `Algarpibe` → el scope pasa de `@algarpibe` a **`@algarpibe`**. **Task 0 renombra `@algarpibe` → `@algarpibe` en TODO el repo** antes de lo demás. Todo el código de las tareas siguientes ya usa `@algarpibe`. El código del motor SE QUEDA en el monorepo `ambientalia-desk` (Enfoque C); no se usa el repo separado.

**Architecture:** Exports condicionales (`development`→`src/*.ts`, `default`→`dist/*.js`+`.d.ts`). El monorepo resuelve a **fuente** por tres mecanismos ya probados: runtime `tsx --conditions=development` (verificado en spike), vite/vitest **aliases** a `src`, y tsc **tsconfig paths** a `src`. Los consumidores externos (sin la condición `development`) reciben `dist/`. Build = `tsc -p tsconfig.build.json` + copia de los `.sql` a `dist/`.

**Tech Stack:** npm workspaces, TypeScript (tsc emit), tsx, vite/vitest, GitHub Packages (npm registry).

**Spec:** `docs/superpowers/specs/2026-06-18-publicar-motor-zoho-sync-design.md`.

**Contexto verificado (estado actual):**
- `packages/shared/package.json`: `{ private:true, version:0.0.0, main:"src/index.ts", exports:{ ".":"./src/index.ts", "./*":"./src/*.ts" } }`. Fuente en `src/` (analisis, columns, historyMap, permissions, ticketCreate, transitions, types, index). Sin deps. Sin `.sql`.
- `packages/zoho-sync/package.json`: `{ private:true, version:0.0.0, exports:{ "./*":"./src/*.ts" }, dependencies:{ "@algarpibe/shared":"*" } }`. 3 `.sql`: `src/db/schema.sql`, `src/booksHub/schema-books.sql`, `src/crmHub/schema-crm.sql` (leídos vía `fileURLToPath(import.meta.url)`).
- `tsconfig.base.json`: `noEmit:true`, `moduleResolution:"Bundler"`, `paths:{ "@algarpibe/shared":["./packages/shared/src/index.ts"], "@algarpibe/zoho-sync/*":["./packages/zoho-sync/src/*"] }`.
- `vitest.config.ts`: alias `@algarpibe/shared` → `packages/shared/src/index.ts` (no hay alias para zoho-sync; hoy resuelve por exports=src).
- `apps/desk/vite.config.ts`: alias `@algarpibe/shared` → `packages/shared/src/index.ts`.
- Root `package.json` scripts con tsx: `dev:api`=`tsx watch apps/desk/server/index.ts`, `start`=`...tsx apps/desk/server/index.ts`, `start:hub-sync`=`...tsx apps/hub-sync/src/hub-sync.ts`.
- `Dockerfile` CMD: `["sh","-c","npx tsx \"${APP_ENTRYPOINT:-apps/desk/server/index.ts}\""]`.
- **Spike confirmado:** con exports condicionales, `tsx consumer.ts`→`dist`; `tsx --conditions=development consumer.ts`→`src`.

**Orden de tareas:** T0 = renombrar scope `@ambientalia` → `@algarpibe` (mecánico, todo el repo). T1 = `shared` publicable + **cableado global del monorepo** (tsx conditions, aliases) — es el canario que prueba todo el enfoque en el paquete más simple. T2 = `zoho-sync` publicable (+ copia `.sql`). T3 = infra de publicación + doc + dry-run. T4 = publish v1.0.0 (manual) + memoria.

---

## Task 0: Renombrar el scope `@ambientalia` → `@algarpibe` (mecánico)

**Files:** Toda referencia a `@ambientalia` en el repo: `package.json` de root + `packages/*/package.json` (`name`, `dependencies`), `tsconfig.base.json` (`paths`), `vitest.config.ts` + `apps/desk/vite.config.ts` (aliases), y TODOS los imports `@ambientalia/...` en `apps/**` y `packages/**`.

- [ ] **Step 1: Inventariar** todas las ocurrencias. Run: `grep -rln "@ambientalia" --include='*.ts' --include='*.json' --include='*.tsx' .` (excluye `node_modules`, `dist`, `docs/superpowers`). Anotar la lista.

- [ ] **Step 2: Reemplazo global** `@ambientalia` → `@algarpibe` en código y config (NO tocar `docs/superpowers/` ni `node_modules/`):
  - `packages/shared/package.json`: `"name": "@algarpibe/shared"`.
  - `packages/zoho-sync/package.json`: `"name": "@algarpibe/zoho-sync"`, `"dependencies": { "@algarpibe/shared": "*" }` (sigue `*` en este punto; T2 lo subirá a `^1.0.0`).
  - `tsconfig.base.json` paths: `"@algarpibe/shared"` y `"@algarpibe/zoho-sync/*"`.
  - `vitest.config.ts` y `apps/desk/vite.config.ts`: aliases con `@algarpibe`.
  - Todos los imports en `apps/**/*.ts(x)` y `packages/**/*.ts`: `from '@algarpibe/...'`.
  - El `start:hub-sync`/`start`/`dev:api` del root no referencian el scope (rutas de archivo), no cambian aquí.

- [ ] **Step 3: Re-cablear workspaces.** Run: `npm install` (re-crea los symlinks con los nombres nuevos en `node_modules/@algarpibe/`).

- [ ] **Step 4: Verificar el monorepo intacto.**
  - Run: `npm test` → todos verdes (242+).
  - Run: `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit` → exit 0.
  - Run: `npx eslint .` → 0 errores.
  - Run: `cd apps/desk && npx vite build && cd ../..` → OK.
  - Run (residuo): `grep -rln "@ambientalia" --include='*.ts' --include='*.tsx' --include='*.json' . | grep -v node_modules | grep -v docs/superpowers` → SIN resultados (todo renombrado).

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "refactor: renombrar scope @ambientalia -> @algarpibe (GitHub Packages = dueño del repo)"
```

---

## Task 1: `@algarpibe/shared` publicable + cableado global del monorepo

**Files:**
- Modify: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.build.json`
- Modify: `package.json` (root scripts), `Dockerfile`, `vitest.config.ts`, `apps/desk/vite.config.ts`

- [ ] **Step 1: Exports condicionales + metadatos de publicación en `packages/shared/package.json`.** Reemplazar el contenido por:
```json
{
  "name": "@algarpibe/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "development": "./src/index.ts", "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./*": { "development": "./src/*.ts", "types": "./dist/*.d.ts", "default": "./dist/*.js" }
  },
  "files": ["dist"],
  "scripts": { "build": "tsc -p tsconfig.build.json" },
  "repository": { "type": "git", "url": "git+https://github.com/Algarpibe/ambientalia-desk.git", "directory": "packages/shared" },
  "publishConfig": { "registry": "https://npm.pkg.github.com" }
}
```
(Se quita `private:true` → publicable. `main`/`types` a dist para herramientas que no leen `exports`.)

- [ ] **Step 2: `packages/shared/tsconfig.build.json`** (compila solo para publicar; `paths:{}` para que las deps resuelvan por node_modules, no por fuente):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {}
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: Cableado runtime — `--conditions=development` en los scripts tsx del root `package.json`.** Cambiar:
  - `"dev:api": "tsx watch --conditions=development apps/desk/server/index.ts"`
  - `"start": "cross-env NODE_ENV=production tsx --conditions=development apps/desk/server/index.ts"`
  - `"start:hub-sync": "cross-env NODE_ENV=production tsx --conditions=development apps/hub-sync/src/hub-sync.ts"`

- [ ] **Step 4: Cableado runtime en producción — `Dockerfile` CMD.** Cambiar la última línea a:
```dockerfile
CMD ["sh", "-c", "npx tsx --conditions=development \"${APP_ENTRYPOINT:-apps/desk/server/index.ts}\""]
```

- [ ] **Step 5: Cableado vite/vitest — aliases a fuente (cubre `.` y subpaths de AMBOS paquetes).** En `vitest.config.ts`, reemplazar el bloque `alias` por:
```ts
import { fileURLToPath } from 'node:url'
// ...
  resolve: {
    alias: [
      { find: /^@algarpibe\/shared$/, replacement: fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)) },
      { find: /^@algarpibe\/shared\/(.*)$/, replacement: fileURLToPath(new URL('./packages/shared/src/', import.meta.url)) + '$1.ts' },
      { find: /^@algarpibe\/zoho-sync\/(.*)$/, replacement: fileURLToPath(new URL('./packages/zoho-sync/src/', import.meta.url)) + '$1.ts' },
    ],
  },
```
En `apps/desk/vite.config.ts`, reemplazar el bloque `alias` por (rutas relativas a `apps/desk/`):
```ts
    alias: [
      { find: /^@algarpibe\/shared$/, replacement: fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)) },
      { find: /^@algarpibe\/shared\/(.*)$/, replacement: fileURLToPath(new URL('../../packages/shared/src/', import.meta.url)) + '$1.ts' },
      { find: /^@algarpibe\/zoho-sync\/(.*)$/, replacement: fileURLToPath(new URL('../../packages/zoho-sync/src/', import.meta.url)) + '$1.ts' },
    ],
```
(El frontend de Desk quizá no importe zoho-sync, pero el alias es inocuo y deja el patrón completo.)

- [ ] **Step 6: Verificar el monorepo intacto (consumiendo fuente).**
  - Run: `npm install` (re-cablea symlinks tras cambiar package.json) → OK.
  - Run: `npm test` → todos verdes (242+).
  - Run: `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit` → exit 0 (paths resuelven a src).
  - Run: `npx eslint .` → 0 errores.
  - Run (build front): `cd apps/desk && npx vite build` → OK; `cd ../..`.
  - **Smoke runtime (resolución a fuente vía tsx conditions):** `node -e "process.exit(0)"` no aplica; en su lugar: `npx tsx --conditions=development -e "import('@algarpibe/shared').then(m=>{if(!m) throw new Error('no shared'); console.log('shared OK via src')})"` → imprime `shared OK via src` (resuelve a `src/index.ts`, NO a dist que no existe).
  - Si el smoke falla con "Cannot find module .../dist/index.js", significa que la condición `development` no se aplicó → revisar el flag.

- [ ] **Step 7: Verificar que el build de `shared` emite dist (para publicar luego).**
  - Run: `npm --workspace @algarpibe/shared run build` → crea `packages/shared/dist/` con `index.js` + `index.d.ts` + el resto de módulos.
  - Run: `ls packages/shared/dist` → contiene `index.js`, `index.d.ts`, `columns.js`, etc. (sin `*.test.*`).
  - Limpieza: `rm -rf packages/shared/dist` (no se commitea; lo regenera la publicación). Confirmar que `dist/` está en `.gitignore` (si no, añadir `dist/` y `packages/*/dist/`).

- [ ] **Step 8: Commit**
```bash
git add packages/shared/package.json packages/shared/tsconfig.build.json package.json Dockerfile vitest.config.ts apps/desk/vite.config.ts .gitignore
git commit -m "feat(pkg): shared publicable (exports condicionales + build) + cableado --conditions=development"
```

---

## Task 2: `@algarpibe/zoho-sync` publicable (+ copia de `.sql` a dist)

**Files:**
- Modify: `packages/zoho-sync/package.json`
- Create: `packages/zoho-sync/tsconfig.build.json`, `packages/zoho-sync/scripts/copy-sql.mjs`

- [ ] **Step 1: `packages/zoho-sync/package.json`** — exports condicionales + metadatos + dep a shared con rango semver. Reemplazar por:
```json
{
  "name": "@algarpibe/zoho-sync",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    "./*": { "development": "./src/*.ts", "types": "./dist/*.d.ts", "default": "./dist/*.js" }
  },
  "files": ["dist"],
  "scripts": { "build": "tsc -p tsconfig.build.json && node ./scripts/copy-sql.mjs" },
  "repository": { "type": "git", "url": "git+https://github.com/Algarpibe/ambientalia-desk.git", "directory": "packages/zoho-sync" },
  "publishConfig": { "registry": "https://npm.pkg.github.com" },
  "dependencies": { "@algarpibe/shared": "^1.0.0" }
}
```
(NOTA: `@algarpibe/shared: "^1.0.0"` en vez de `"*"` — el consumidor externo traerá shared 1.x. En el monorepo, npm sigue resolviendo el workspace local por nombre.)

- [ ] **Step 2: `packages/zoho-sync/tsconfig.build.json`** (igual que shared; `paths:{}` → `@algarpibe/shared` resuelve por node_modules a su dist ya compilado):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {}
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: `packages/zoho-sync/scripts/copy-sql.mjs`** — copia los `.sql` de `src/` a `dist/` preservando la ruta (el código los lee relativo a `import.meta.url`, que en dist apunta a `dist/...`):
```js
import { readdir, mkdir, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, dirname, relative } from 'node:path'

const srcDir = fileURLToPath(new URL('../src/', import.meta.url))
const distDir = fileURLToPath(new URL('../dist/', import.meta.url))

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (e.name.endsWith('.sql')) yield p
  }
}

let n = 0
for await (const sql of walk(srcDir)) {
  const rel = relative(srcDir, sql)
  const dest = join(distDir, rel)
  await mkdir(dirname(dest), { recursive: true })
  await copyFile(sql, dest)
  n++
}
console.log(`copy-sql: ${n} archivos .sql copiados a dist/`)
```

- [ ] **Step 4: Verificar monorepo intacto (consume fuente).**
  - Run: `npm install` → OK.
  - Run: `npm test` → verdes.
  - Run: `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit` → exit 0.
  - Run: `npx eslint .` → 0 errores.
  - **Smoke runtime zoho-sync vía fuente:** `npx tsx --conditions=development -e "import('@algarpibe/zoho-sync/db/migrate').then(m=>{if(!m.migrate) throw new Error('no migrate'); console.log('zoho-sync OK via src')})"` → imprime `zoho-sync OK via src`.

- [ ] **Step 5: Verificar el build completo (dist con JS + d.ts + sql).** Orden: shared primero (zoho-sync lo necesita compilado).
  - Run: `npm --workspace @algarpibe/shared run build`
  - Run: `npm --workspace @algarpibe/zoho-sync run build` → `tsc` emite + `copy-sql` copia 3 `.sql`.
  - Run: `ls packages/zoho-sync/dist/db` → contiene `migrate.js`, `migrate.d.ts`, `schema.sql`, `pool.js`, etc.
  - Run: `ls packages/zoho-sync/dist/booksHub` y `.../crmHub` → contienen `schema-books.sql` / `schema-crm.sql` respectivamente.
  - **Smoke del artefacto compilado:** `npx tsx -e "import('@algarpibe/zoho-sync/db/migrate').then(m=>console.log('dist resolve:', typeof m.migrate))"` (SIN `--conditions` → resuelve a `dist/db/migrate.js`) → imprime `dist resolve: function`. Confirma que el `default`/dist funciona para externos.
  - Limpieza: `rm -rf packages/shared/dist packages/zoho-sync/dist`.

- [ ] **Step 6: Commit**
```bash
git add packages/zoho-sync/package.json packages/zoho-sync/tsconfig.build.json packages/zoho-sync/scripts/copy-sql.mjs
git commit -m "feat(pkg): zoho-sync publicable (exports condicionales + build + copia .sql a dist)"
```

---

## Task 3: Infra de publicación + doc del consumidor externo + dry-run

**Files:**
- Create: `.npmrc`, `docs/publicar-paquetes.md`
- Modify: `.gitignore` (si hace falta para `dist/`)

- [ ] **Step 1: `.npmrc` (raíz)** — registry del scope + auth por variable de entorno (NO hardcodear token):
```
@algarpibe:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```
(NOTA seguridad: el token va en `NPM_TOKEN` (env), nunca en el archivo. `.npmrc` con `${NPM_TOKEN}` es seguro de commitear. Verificar que `.npmrc` NO contenga el token literal.)

- [ ] **Step 2: `docs/publicar-paquetes.md`** — runbook de publicación + cómo consumir externamente:
```markdown
# Publicar `@algarpibe/shared` y `@algarpibe/zoho-sync` (GitHub Packages)

## Publicar una versión
1. Bump de versión en ambos `package.json` (mismo número, p. ej. 1.0.1). `zoho-sync` depende de `@algarpibe/shared: "^1.x"`.
2. Exporta un PAT con scope `write:packages`:  `export NPM_TOKEN=ghp_xxx`  (Windows PowerShell: `$env:NPM_TOKEN="ghp_xxx"`).
3. Build + publish (shared PRIMERO, por la dependencia):
   ```
   npm --workspace @algarpibe/shared run build
   npm publish --workspace @algarpibe/shared
   npm --workspace @algarpibe/zoho-sync run build
   npm publish --workspace @algarpibe/zoho-sync
   ```
4. Verifica en GitHub → Packages que aparecen las versiones.

## Consumir el motor desde una app EXTERNA
1. En el repo externo, crea `.npmrc`:
   ```
   @algarpibe:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```
   con un PAT de scope `read:packages` en `NPM_TOKEN`.
2. `npm i @algarpibe/zoho-sync@^1` (trae también `@algarpibe/shared`).
3. Uso: la lib expone el motor (clientes Zoho, migrate, sync). La app aporta su config (env Zoho) y un `pg` Pool.
   Ejemplo: `import { createPoolFromUrl } from '@algarpibe/zoho-sync/db/pool'`.
```

- [ ] **Step 3: Asegurar `dist/` ignorado.** Confirmar que `.gitignore` contiene `dist/` o añadir `packages/*/dist/`. Run: `git check-ignore packages/zoho-sync/dist` → debe imprimir la ruta (ignorado). Si no, añadir y commitear.

- [ ] **Step 4: Dry-run de empaquetado (sin publicar).**
  - Run: `npm --workspace @algarpibe/shared run build && npm --workspace @algarpibe/zoho-sync run build`
  - Run: `npm pack --workspace @algarpibe/shared --dry-run` → la lista de archivos incluye SOLO `dist/**` + `package.json` (no `src/`).
  - Run: `npm pack --workspace @algarpibe/zoho-sync --dry-run` → incluye `dist/**` con `.js`, `.d.ts` y los 3 `.sql`; NO incluye `src/`.
  - Si aparece `src/` en el tarball, revisar `files:["dist"]`.
  - Limpieza: `rm -rf packages/shared/dist packages/zoho-sync/dist`.

- [ ] **Step 5: Commit**
```bash
git add .npmrc docs/publicar-paquetes.md .gitignore
git commit -m "feat(pkg): .npmrc (GitHub Packages) + runbook de publicación y consumo externo"
```

---

## Task 4: Publicar v1.0.0 (manual) + verificación + memoria

> Esta tarea la ejecuta el usuario (requiere un PAT con `write:packages`); el agente prepara y verifica lo verificable localmente.

- [ ] **Step 1: Verificación final completa (monorepo intacto).**
  - Run: `npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint .` → todo verde.
  - Run: `cd apps/desk && npx vite build && cd ../..` → OK.
  - Push de T1–T3: `git push origin main`.

- [ ] **Step 2: (Usuario) Publicar v1.0.0.** Con `NPM_TOKEN` = PAT `write:packages`:
```
npm --workspace @algarpibe/shared run build
npm publish --workspace @algarpibe/shared
npm --workspace @algarpibe/zoho-sync run build
npm publish --workspace @algarpibe/zoho-sync
```
Verificar en GitHub → repo → Packages que aparecen `@algarpibe/shared@1.0.0` y `@algarpibe/zoho-sync@1.0.0`.

- [ ] **Step 3: (Opcional) Probar consumo externo.** En un dir temporal fuera del monorepo: `.npmrc` (read:packages) + `npm i @algarpibe/zoho-sync@^1` + un `import('@algarpibe/zoho-sync/db/migrate')` → resuelve a `dist`.

- [ ] **Step 4: Validar despliegue intacto.** Tras el push, el worker/Desk redeployan; el CMD ahora usa `--conditions=development` → siguen corriendo fuente. Logs de arranque sin errores de resolución (`Cannot find module .../dist`). Confirmar `zoho-hub-sync en marcha` y la app Desk operativa.

- [ ] **Step 5: Actualizar memoria.** En `zoho-hub-arquitectura.md`: motor `@algarpibe/zoho-sync` + `shared` **publicables/publicados** en GitHub Packages (v1.0.0); monorepo consume fuente vía `--conditions=development` + aliases; runbook en `docs/publicar-paquetes.md`. (Enfoque C; A/B descartados.)

---

## Notas de cierre / riesgos
- **Resolución a fuente:** 3 capas independientes apuntan a `src` (tsx conditions ✓ spike, vite/vitest aliases, tsc paths). Si una fallara, el Step de verificación de su tarea lo detecta antes de avanzar.
- **Build order:** shared SIEMPRE antes que zoho-sync (zoho-sync compila contra el dist de shared vía node_modules con `paths:{}`).
- **`.sql` en dist:** crítico para el consumidor externo (el código los lee por ruta relativa); `copy-sql.mjs` los lleva a `dist/` preservando estructura.
- **Seguridad:** el token nunca se commitea (`.npmrc` usa `${NPM_TOKEN}`). PAT `write:packages` para publicar, `read:packages` para consumir.
- **Fuera de alcance:** GitHub Action de publish automática, separar Desk/worker en repos (Enfoque A), consumir la versión publicada dentro del monorepo, rotación de secretos.
```
