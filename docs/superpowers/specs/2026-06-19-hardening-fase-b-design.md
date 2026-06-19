# Diseño — Hardening Fase B (quick wins de la auditoría)

**Fecha:** 2026-06-19
**Estado:** Aprobado para planificación
**Origen:** auditoría 2026-06-18/19 (este chat). Repo: `ambientalia-desk` (monorepo). Solo `apps/desk` + raíz.

## Objetivo
Cerrar los quick wins de seguridad/calidad de la Fase B sin cambiar comportamiento funcional de la app. Cada cambio mantiene los 242 tests verdes y añade tests donde aplica.

## Decisiones (confirmadas)
- **F2-03:** `PUT /resolution` (guardar) = cualquier usuario autenticado (flujo normal). `DELETE /resolution` y `DELETE /resolution/attachments/:attId` = **superadmin**.
- **F2-04:** `helmet()` **sin CSP estricta** (`contentSecurityPolicy: false`); el resto de cabeceras por defecto. La CSP afinada al SPA queda como **deuda** (fuera de alcance).

## Alcance (9 fixes)

### Dependencias / config
- **F1-01/F1-02:** `npm audit fix` (solo arreglos en-rango; **NO** `--force`). Re-verificar `npm test` + build tras el bump (vite/postcss/rollup). Si algún HIGH no se arregla sin `--force`, se documenta y se deja fuera (no romper el build).
- **F1-03:** mover `tsx` y `cross-env` de `devDependencies` a `dependencies` (raíz `package.json`) → horneados en la imagen, arranque sin descarga en runtime.
- **F1-04:** `.env.example` — `ZOHO_ORG_ID` y `ZOHO_DEPARTMENT_ID` a placeholders (`<tu_org_id>`, `<tu_department_id>`).

### Seguridad
- **F2-01:** rate-limit en login. Dep nueva `express-rate-limit`. `app.set('trust proxy', 1)` (detrás del proxy de EasyPanel) para IP real. Limiter en `POST /api/auth/login` (y `POST /api/auth/change-password`): ventana 15 min, máx 10 intentos por IP, `standardHeaders:true`, respuesta 429 `{error:'Demasiados intentos, intenta más tarde'}`. No contar respuestas 2xx (skipSuccessfulRequests para login).
- **F2-04:** `helmet()` con `contentSecurityPolicy:false`, montado antes de las rutas en `createApp`. Dep nueva `helmet`. Verificar que el SPA y los adjuntos siguen sirviéndose (X-Frame `DENY` ok: no usamos iframes propios).
- **F2-02:** `/api/admin/measure-attachments` y `/api/admin/backfill-details` pasan a `requireAuth(db), requireSuperAdmin` (igual que los otros admin). Se elimina el helper local `requireAdmin` (query-token) y su uso. `config.adminToken` queda sin uso → se puede dejar (limpieza menor anotada) o quitar; en este alcance **se deja** para no tocar `config.ts`/tests, anotado como limpieza.
- **F2-03:** añadir `requireSuperAdmin` a `DELETE /api/tickets/:id/resolution` y `DELETE /api/tickets/:id/resolution/attachments/:attId`. (Ambas ya están bajo `app.use('/api/tickets', requireAuth(db))`; se añade el guard de rol en la ruta.) `PUT` y `POST` (subir) sin cambios.

### Calidad
- **F4-01:** error-handler central de Express (`app.use((err,req,res,next)=>{...})` al final) que loguea server-side y responde `500 {error:'Error interno'}`. Helper `asyncHandler(fn)` que captura rejections y llama `next(err)`. Reemplazar los **32** `catch (err) { res.status(500).json({ error: String(err) }) }` por `asyncHandler` (sin try/catch). **Conservar** las respuestas deliberadas de *passthrough* de estado upstream (p.ej. `res.status(zres.status).json({error: await zres.text()})` en reply/attachment proxy) — esas NO se genericalizan.
- **F4-04:** extraer en `repo.ts` un helper `mapTicketRowWithRefs(row)` y usarlo en `getActiveTickets` y `getAllTickets` (hoy el `.map` está duplicado idéntico en `:117` y `:130`).

## Componentes tocados
- `package.json` (raíz): deps `helmet`, `express-rate-limit`; mover `tsx`/`cross-env` a deps.
- `apps/desk/server/app.ts`: `helmet`, `trust proxy`, limiter, `requireSuperAdmin` en 3 rutas (2 admin + 2 delete resolución), `asyncHandler` en ~32 handlers, error-handler final, quitar helper query-token.
- `apps/desk/server/auth/routes.ts`: limiter en login/change-password (o montarlo en app.ts antes de `registerAuthRoutes`).
- `packages/zoho-sync/src/db/repo.ts`: `mapTicketRowWithRefs`.
- `.env.example`.

## Pruebas
- **F2-01:** test — 11º intento de login devuelve 429 (con limiter de prueba o `MAX` bajo inyectable). Si el limiter es global por proceso, usar un store/config de test que permita simular.
- **F2-02:** test — `/api/admin/measure-attachments` sin sesión→401; con sesión no-admin→403; con admin→200. (Reemplaza la semántica de query-token.)
- **F2-03:** test — `DELETE /resolution` como operador→403; como admin→204.
- **F4-01:** test — un handler que lanza error responde 500 con `{error:'Error interno'}` (no el mensaje crudo).
- **F4-04:** los tests existentes de `getActiveTickets`/`getAllTickets` siguen verdes (refactor sin cambio de salida).
- **F2-04/F1-x:** `npm test` + `tsc -b` + `tsc server` + `eslint` + `vite build` verdes.

## Despliegue
Push a `main` → redeploy en EasyPanel (Desk + worker). Validar: login normal funciona, 429 al exceder; SPA carga con helmet; endpoints admin requieren sesión admin; borrar resolución como no-admin da 403. `ENABLE_WRITES` y demás flags intactos.

## Fuera de alcance
- CSP estricta (deuda). F3/F4-02/F4-05/F5 (deuda). Rotación de secretos (operativo, aparte). Tocar el worker `hub-sync` salvo lo que herede de `repo.ts`/deps. `npm audit fix --force`.
