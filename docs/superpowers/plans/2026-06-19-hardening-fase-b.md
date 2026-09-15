# Hardening Fase B (quick wins) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps con checkbox.

**Goal:** Aplicar los quick wins de la auditoría (deps, rate-limit, helmet, error-handler central, authz admin/resolución, dedup) sin cambiar el comportamiento funcional; 242 tests siguen verdes + tests nuevos.

**Architecture:** Cambios acotados a `apps/desk/server` + raíz `package.json` + `.env.example` + un helper en `packages/zoho-sync/src/db/repo.ts`. El worker `hub-sync` no se toca (solo hereda deps/repo).

**Spec:** `docs/superpowers/specs/2026-06-19-hardening-fase-b-design.md`.

**Contexto verificado del código (de la auditoría):**
- `apps/desk/server/app.ts:46` en `1d030d5` `createApp({db,zohoFetch,sync,config})` → `app.use(express.json()); app.use(cookieParser()); registerAuthRoutes(app, db)`.
- `apps/desk/server/app.ts:55-61` en `1d030d5` helper local `requireAdmin(req,res)` = `req.query.token === config.adminToken` (a eliminar). Usado en `:206` y `:217`.
- `apps/desk/server/app.ts:15` en `1d030d5` importa `requireAdmin as requireSuperAdmin` (middleware de rol admin de sesión).
- `apps/desk/server/app.ts:71` en `1d030d5` `app.use('/api/tickets', requireAuth(db))`.
- DELETE resolución: `apps/desk/server/app.ts:104` en `1d030d5` (`/resolution/attachments/:attId`) y `:108` (`/resolution`).
- ~32 `catch (err) { res.status(500).json({ error: String(err) }) }` en `app.ts`.
- Passthrough deliberado de estado upstream (NO genericalizar): `apps/desk/server/app.ts:373` en `1d030d5` (attachment proxy `res.status(zres.status)`) y `:430` (reply `res.status(zres.status)`).
- `repo.ts:117` ≈ `:130`: `.map((row:any)=>({row, refs:{accountName:row.account_name, agentName:row.agent_name, contactName:[row.c_first,row.c_last].filter(Boolean).join(' ').trim()||null, read: row.read_at!=null && (row.modified_time==null || new Date(row.read_at)>=new Date(row.modified_time))}}))`.
- Raíz `package.json`: `tsx`,`cross-env` en `devDependencies`.

---

## Task 1: Deps & config (F1-01/02/03/04)

**Files:** `package.json` (raíz), `.env.example`.

- [ ] **Step 1:** `npm audit fix` (SIN `--force`). Si quedan HIGH irresolubles sin `--force`, NO forzar; anotarlos en el reporte.
- [ ] **Step 2:** En `package.json` raíz, mover `"tsx"` y `"cross-env"` de `devDependencies` a `dependencies` (mantener versiones). Correr `npm install` para actualizar el lockfile.
- [ ] **Step 3:** En `.env.example`, cambiar `ZOHO_ORG_ID=713448415` → `ZOHO_ORG_ID=<tu_org_id>` y `ZOHO_DEPARTMENT_ID=495552000000006907` → `ZOHO_DEPARTMENT_ID=<tu_department_id>`.
- [ ] **Step 4: Verificar:** `npm test` (242 verdes), `npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit` (exit 0), `npx eslint .` (0 errores), `cd apps/desk && npx vite build && cd ../..` (OK). Si `npm audit fix` rompió algo, revertir ese bump puntual y anotar.
- [ ] **Step 5: Commit:** `git add -A && git commit -m "chore(sec): npm audit fix + tsx/cross-env a dependencies + placeholders .env.example"` (trailer Co-Authored-By).

---

## Task 2: helmet + rate-limit + trust proxy (F2-04, F2-01)

**Files:** `package.json`, `apps/desk/server/app.ts`, `apps/desk/server/app.test.ts`.

- [ ] **Step 1:** `npm i helmet express-rate-limit` (dependencies). `npm i -D @types/...` no necesario (traen tipos propios).
- [ ] **Step 2: Test (app.test.ts)** — añadir:
```ts
it('helmet añade cabeceras de seguridad', async () => {
  const res = await request(createApp(deps)).get('/api/auth/login').send()
  expect(res.headers['x-content-type-options']).toBe('nosniff')
})
it('rate-limit: bloquea login tras demasiados intentos', async () => {
  const a = createApp(deps)
  let last: any
  for (let i = 0; i < 11; i++) last = await request(a).post('/api/auth/login').send({ email: 'no@x.co', password: 'mal' })
  expect(last.status).toBe(429)
})
```
(`deps` = el helper de creación de app del archivo; reusar el patrón existente de `app.test.ts`.)
- [ ] **Step 3: Run** `npx vitest run apps/desk/server/app.test.ts -t "helmet|rate-limit"` → FAIL.
- [ ] **Step 4: Implementar en `app.ts`** (en `createApp`, ANTES de las rutas):
```ts
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
// ...dentro de createApp, tras `const app = express()`:
app.set('trust proxy', 1) // detrás del proxy de EasyPanel → IP real para el rate-limit
app.use(helmet({ contentSecurityPolicy: false })) // CSP afinada = deuda (no romper el SPA)
app.use(express.json())
app.use(cookieParser())
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  skipSuccessfulRequests: true, message: { error: 'Demasiados intentos, intenta más tarde' },
})
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth/change-password', loginLimiter)
registerAuthRoutes(app, db)
```
- [ ] **Step 5: Run** `npx vitest run apps/desk/server/app.test.ts` → PASS (incl. los existentes). `npx tsc -p apps/desk/tsconfig.server.json --noEmit` exit 0.
- [ ] **Step 6: Commit:** `git add -A && git commit -m "feat(sec): helmet + rate-limit en login (trust proxy)"`.

---

## Task 3: Error-handler central + asyncHandler + dedup refs (F4-01, F4-04)

**Files:** `apps/desk/server/app.ts`, `apps/desk/server/app.test.ts`, `packages/zoho-sync/src/db/repo.ts`.

- [ ] **Step 1: `repo.ts`** — extraer helper (encima de `getActiveTickets`):
```ts
function mapTicketRowWithRefs(row: any): TicketWithRefs {
  return { row: row as TicketRow, refs: { accountName: row.account_name, agentName: row.agent_name, contactName: [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null, read: row.read_at != null && (row.modified_time == null || new Date(row.read_at) >= new Date(row.modified_time)) } }
}
```
Reemplazar el `.map(...)` de `getActiveTickets` (`:117`) y `getAllTickets` (`:130`) por `return r.rows.map(mapTicketRowWithRefs)`.
- [ ] **Step 2: Test (app.test.ts)** — añadir un handler de prueba NO es trivial; en su lugar test del error-handler vía una ruta real que falle con `db` mock que lanza. Añadir:
```ts
it('error no manejado → 500 genérico (sin filtrar el mensaje)', async () => {
  const boom = { ...deps, db: { query: async () => { throw new Error('detalle-interno-secreto') } } }
  const res = await request(createApp(boom)).get('/api/contacts')
  expect(res.status).toBe(500)
  expect(res.body.error).toBe('Error interno')
  expect(JSON.stringify(res.body)).not.toContain('detalle-interno-secreto')
})
```
(`/api/contacts` usa `getContacts(db)`; con `db.query` que lanza, debe ir al handler central.)
- [ ] **Step 3: Run** el test → FAIL (hoy devuelve `String(err)` con el detalle).
- [ ] **Step 4: Implementar en `app.ts`:**
  - Añadir helper (top de `createApp` o módulo): `const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { fn(req, res, next).catch(next) }` (importar `NextFunction` de express).
  - Reemplazar los **~32** handlers con `try/catch → res.status(500).json({error:String(err)})` por `asyncHandler(async (req,res)=>{ ...cuerpo sin try/catch... })`.
    - **Conservar** las respuestas in-flow de estado upstream: `apps/desk/server/app.ts:373` en `1d030d5` (`res.status(zres.status)...` del attachment) y `:430` (reply). Esos endpoints: envolver en `asyncHandler` y quitar SOLO el `catch` final (la respuesta upstream-status dentro del flujo se queda; el error de red cae al handler central).
  - Añadir al FINAL de `createApp` (después de TODAS las rutas, antes de `return app`):
```ts
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error no manejado:', err)
  if (res.headersSent) return
  res.status(500).json({ error: 'Error interno' })
})
```
- [ ] **Step 5: Run** `npm test` (todos verdes; los tests que antes esperaban `String(err)`—si los hay—ajustar a 'Error interno'). `npx tsc -p apps/desk/tsconfig.server.json --noEmit` exit 0. `npx eslint apps/desk/server packages/zoho-sync/src/db/repo.ts` sin errores.
- [ ] **Step 6: Commit:** `git add -A && git commit -m "refactor(sec): error-handler central + asyncHandler (no filtra errores) + dedup mapTicketRowWithRefs"`.

---

## Task 4: AuthZ — admin con sesión+rol y borrado de resolución con superadmin (F2-02, F2-03)

**Files:** `apps/desk/server/app.ts`, `apps/desk/server/app.test.ts`.

- [ ] **Step 1: Test (app.test.ts)** — añadir:
```ts
it('admin endpoint exige sesión admin (no query-token)', async () => {
  const a = createApp(deps)
  expect((await request(a).get('/api/admin/measure-attachments')).status).toBe(401) // sin sesión
  const op = await userCookie([]) // operador no admin (helper existente)
  expect((await request(a).get('/api/admin/measure-attachments').set('Cookie', op)).status).toBe(403)
})
it('borrar resolución exige superadmin', async () => {
  const a = createApp(deps)
  const op = await userCookie([])
  expect((await request(a).delete('/api/tickets/t1/resolution').set('Cookie', op)).status).toBe(403)
})
```
(Usar los helpers `userCookie`/`adminCookie` existentes del archivo.)
- [ ] **Step 2: Run** → FAIL (hoy admin usa query-token; delete resolución solo requiere login).
- [ ] **Step 3: Implementar en `app.ts`:**
  - Eliminar el helper local `requireAdmin` (`:55-61`).
  - `/api/admin/measure-attachments` (`:205`) y `/api/admin/backfill-details` (`:216`): cambiar a `app.get('/api/admin/...', requireAuth(db), requireSuperAdmin, asyncHandler(async (req,res)=>{ ... }))` quitando el `if(!requireAdmin(req,res))return`.
  - DELETE `/api/tickets/:id/resolution/attachments/:attId` (`:104`) y DELETE `/api/tickets/:id/resolution` (`:108`): añadir `requireSuperAdmin` como middleware de ruta (van bajo `requireAuth` global de `/api/tickets`, así que `app.delete('/api/tickets/:id/resolution', requireSuperAdmin, asyncHandler(...))`).
  - (PUT/POST de resolución y el resto sin cambios.)
  - `config.adminToken` queda sin uso → dejar (limpieza menor anotada en debt).
- [ ] **Step 4: Run** `npm test` → PASS. tsc server exit 0. eslint sin errores.
- [ ] **Step 5: Commit:** `git add -A && git commit -m "feat(sec): admin endpoints con sesión+rol (F2-02) + borrado de resolución solo superadmin (F2-03)"`.

---

## Task 5: Verificación final + push + deploy

- [ ] **Step 1:** `npm test && npx tsc -b && npx tsc -p apps/desk/tsconfig.server.json --noEmit && npx eslint . && (cd apps/desk && npx vite build)` → todo verde.
- [ ] **Step 2:** `npm audit` → confirmar 0 HIGH (o documentar los que requieran `--force`).
- [ ] **Step 3: Push:** `git push origin main`.
- [ ] **Step 4: Deploy (usuario, EasyPanel):** redeploy `ambientalia-desk` (y `zoho-hub-sync` si comparte imagen). Validar: login normal OK; 429 tras 10 fallos; SPA carga (helmet); `/api/admin/*` requiere sesión admin; borrar resolución como operador→403, como admin→OK; flags `ENABLE_WRITES` intactos.
- [ ] **Step 5: Memoria:** registrar Fase B aplicada (rate-limit, helmet, error-handler, authz admin/resolución, deps) y qué queda (CSP estricta, F3/F4-02/F5 deuda, rotación de secretos).

## Notas de cierre
- **No** `npm audit fix --force` (puede romper vite/react major).
- `trust proxy: 1` asume un único proxy (EasyPanel). Si hubiera más saltos, ajustar.
- El passthrough de estado upstream (Zoho) se conserva; solo se genericalizan los errores internos.
- `config.adminToken` queda huérfano (limpieza menor → debt).
