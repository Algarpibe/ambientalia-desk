# App de prueba `hub-test-app` (validar lectura del hub) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development o executing-plans. Steps con checkbox.

**Goal:** Micro-servicio Express que usa `@algarpibe/zoho-sync` + `hub_reader` para leer `zoho-hub-db`, desplegado en EasyPanel, validando el ciclo end-to-end (publicar→instalar con auth→conectar read-only→leer).

**Architecture:** App npm autónoma en repo `Algarpibe/hub-test-app` (clon local `c:\dev\hub-test-app`). `src/app.ts` = `createApp(deps)` con inyección de dependencias (testeable sin el paquete privado). `src/server.ts` = entrypoint que importa el paquete, crea el Pool y arranca. Dockerfile con `ARG NPM_TOKEN` para `npm ci` del paquete privado.

**Tech Stack:** Node 22, TypeScript, tsx, Express, vitest + supertest. `@algarpibe/zoho-sync` (GitHub Packages, privado).

**Spec:** `docs/superpowers/specs/2026-06-18-app-prueba-hub-design.md`.

**Restricción de token (importante):** instalar `@algarpibe/zoho-sync` exige `NPM_TOKEN` (PAT `read:packages`). Si el agente NO tiene token: crea los archivos y haz commit/push **sin** `npm install` (la validación real es el deploy). Los pasos `npm install`/`npm test`/`tsc` quedan marcados **(requiere NPM_TOKEN; si no, omitir y validar en deploy)**.

**Working dir:** `c:\dev\hub-test-app` (clon del repo nuevo). NO tocar el monorepo.

---

## Task 1: Bootstrap

**Files (en `c:\dev\hub-test-app`):** Create `package.json`, `tsconfig.json`, `.npmrc`, `.gitignore`, `README.md`.

- [ ] **Step 1: Clonar.** `cd /c/dev && git clone https://github.com/Algarpibe/hub-test-app.git && cd hub-test-app`. Si vacío, asegúrate de rama `main`.

- [ ] **Step 2: `package.json`**:
```json
{
  "name": "hub-test-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "start": "tsx src/server.ts", "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": { "@algarpibe/zoho-sync": "^1.0.0", "express": "^5.2.1" },
  "devDependencies": {
    "@types/express": "^5.0.6", "@types/node": "^25.9.1",
    "@types/supertest": "^7.2.0", "supertest": "^7.2.2",
    "tsx": "^4.22.4", "typescript": "~5.6.2", "vitest": "^3.2.6"
  }
}
```

- [ ] **Step 3: `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true,
    "noEmit": true, "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: `.npmrc`** (auth por env):
```
@algarpibe:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

- [ ] **Step 5: `.gitignore`**: `node_modules/` y `*.log`.

- [ ] **Step 6: `README.md`** — qué es + cómo desplegar (ver runbook en Task 4); nota: requiere `NPM_TOKEN` read:packages para instalar.

- [ ] **Step 7:** `npm install` **(requiere NPM_TOKEN; si no, omitir)**. Commit: `git add -A && git commit -m "chore: bootstrap hub-test-app"`.

---

## Task 2: Server con inyección de dependencias + test

**Files (en `c:\dev\hub-test-app`):** Create `src/app.ts`, `src/server.ts`, `src/app.test.ts`.

- [ ] **Step 1: `src/app.test.ts`** (no importa el paquete; mockea las deps):
```ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from './app'

const deps = {
  query: async (sql: string) => {
    if (sql.includes('crm.deals')) return { rows: [{ n: 5 }] }
    if (sql.includes('books.invoices')) return { rows: [{ n: 3 }] }
    if (sql.includes('desk.tickets')) return { rows: [{ n: 7 }] }
    return { rows: [] }
  },
  dealsByStage: async (stage: string) => [{ id: 'd1', deal_name: 'A', stage }],
}

describe('hub-test-app', () => {
  it('GET /health', async () => {
    const res = await request(createApp(deps as any)).get('/health')
    expect(res.status).toBe(200); expect(res.body.ok).toBe(true)
  })
  it('GET /resumen devuelve conteos', async () => {
    const res = await request(createApp(deps as any)).get('/resumen')
    expect(res.status).toBe(200); expect(res.body).toEqual({ deals: 5, invoices: 3, tickets: 7 })
  })
  it('GET /deals usa el stage', async () => {
    const res = await request(createApp(deps as any)).get('/deals?stage=Ganado')
    expect(res.status).toBe(200); expect(res.body[0].stage).toBe('Ganado')
  })
})
```

- [ ] **Step 2: Run** `npx vitest run` **(requiere NPM_TOKEN para instalar express/supertest; si no, omitir)** → FAIL (no `./app`).

- [ ] **Step 3: `src/app.ts`** (DI; NO importa el paquete → testeable sin él):
```ts
import express, { type Express } from 'express'

export interface AppDeps {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
  dealsByStage: (stage: string) => Promise<any[]>
}

export function createApp(deps: AppDeps): Express {
  const app = express()
  app.get('/health', (_req, res) => { res.json({ ok: true }) })
  app.get('/resumen', async (_req, res) => {
    try {
      const d = await deps.query('SELECT count(*)::int n FROM crm.deals')
      const i = await deps.query('SELECT count(*)::int n FROM books.invoices')
      const t = await deps.query('SELECT count(*)::int n FROM desk.tickets')
      res.json({ deals: d.rows[0]?.n ?? 0, invoices: i.rows[0]?.n ?? 0, tickets: t.rows[0]?.n ?? 0 })
    } catch (e: any) { res.status(500).json({ error: String(e?.message ?? e) }) }
  })
  app.get('/deals', async (req, res) => {
    try {
      const stage = typeof req.query.stage === 'string' ? req.query.stage : 'Ganado'
      res.json(await deps.dealsByStage(stage))
    } catch (e: any) { res.status(500).json({ error: String(e?.message ?? e) }) }
  })
  return app
}
```

- [ ] **Step 4: `src/server.ts`** (entrypoint; importa el paquete real, inyecta en createApp):
```ts
import { createPoolFromUrl, getDealsByStage } from '@algarpibe/zoho-sync'
import { createApp } from './app'

const url = process.env.HUB_DB_URL
if (!url) { console.error('Falta HUB_DB_URL'); process.exit(1) }
const pool = createPoolFromUrl(url)

const app = createApp({
  query: (sql, params) => pool.query(sql, params),
  dealsByStage: (stage) => getDealsByStage(pool, stage),
})

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => { console.log(`hub-test-app escuchando en :${port}`) })
```

- [ ] **Step 5: Run** `npx vitest run && npx tsc --noEmit` **(requiere NPM_TOKEN; si no, omitir — `app.ts`/`app.test.ts` no usan el paquete, pero `server.ts` sí, así que tsc completo necesita el paquete instalado)** → PASS / exit 0.

- [ ] **Step 6: Commit**: `git add -A && git commit -m "feat: server con /health /resumen /deals (DI + test mockeado)"`.

---

## Task 3: Dockerfile

**Files (en `c:\dev\hub-test-app`):** Create `Dockerfile`, `.dockerignore`.

- [ ] **Step 1: `Dockerfile`** (`ARG NPM_TOKEN` para instalar el paquete privado; corre con tsx):
```dockerfile
FROM node:22-alpine
WORKDIR /app
# Token de registro solo para la instalación (build arg de EasyPanel).
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN
COPY package.json package-lock.json* .npmrc ./
RUN npm install --omit=dev=false
COPY . .
# Limpia el token del entorno de runtime.
ENV NPM_TOKEN=""
EXPOSE 3001
CMD ["npx", "tsx", "src/server.ts"]
```
(NOTA: si Task 1 generó `package-lock.json`, usar `npm ci` en vez de `npm install`. El `package-lock.json*` con glob tolera su ausencia.)

- [ ] **Step 2: `.dockerignore`**: `node_modules`, `.git`, `*.log`.

- [ ] **Step 3: Commit**: `git add -A && git commit -m "feat: Dockerfile (ARG NPM_TOKEN para el paquete privado)"`.

---

## Task 4: Push + deploy + validación

- [ ] **Step 1: Push.** `git push -u origin main`.

- [ ] **Step 2: (Usuario) Crear el servicio en EasyPanel** (mismo proyecto que el hub):
  - App service → Source = repo `Algarpibe/hub-test-app`, branch `main`, Build = Dockerfile.
  - **Build arg `NPM_TOKEN`** = un PAT `read:packages`.
  - **Env `HUB_DB_URL`** = `postgres://hub_reader:<pwd>@ambientalia_project_zoho-hub-db:5432/zoho-hub`.
  - **Env `PORT`** = el que EasyPanel asigne (o deja 3001 y mapea).
  - Exponer dominio/puerto.

- [ ] **Step 3: Validar (criterio de éxito).**
  - Build Success (el log muestra que `npm` resolvió `@algarpibe/zoho-sync@1.0.0` desde npm.pkg.github.com → auth OK).
  - `GET /health` → `{ ok: true }`.
  - `GET /resumen` → conteos > 0 (p. ej. deals ~1968, invoices, tickets) → lee el hub real con `hub_reader`.
  - `GET /deals?stage=Ganado` → array de deals tipados.
  - → **ciclo end-to-end validado**: publicar → instalar con auth → conectar read-only → leer.

- [ ] **Step 4: Cierre.** Anotar en memoria que el ciclo quedó validado. Si la app era temporal, el usuario puede apagar/borrar el servicio (el paquete y `hub_reader` quedan listos para apps reales).

---

## Notas de cierre
- **Token:** local install/test/tsc completo requieren `NPM_TOKEN` (read:packages); sin él se valida en el deploy. `app.ts`/`app.test.ts` son testeables sin el paquete (DI).
- **Seguridad Dockerfile:** el `NPM_TOKEN` entra como build arg; se limpia del ENV de runtime. Para rigor total se usaría un *secret mount*, pero para una app de prueba interna el build arg es suficiente.
- **Fuera de alcance:** auth/UI, más endpoints, permanencia. Rotación de secretos.
```
