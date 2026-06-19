# Diseño — F4-02: partir `app.ts` en routers por dominio + capa de servicio

**Fecha:** 2026-06-19
**Estado:** Aprobado para planificación
**Origen:** auditoría (Fase D). Repo: `ambientalia-desk`. Directo en `main`.
**Invariante absoluto:** **refactor sin cambio funcional**. Los **259 tests** (esp. `app.test.ts` vía supertest sobre `createApp`) deben quedar verdes en CADA paso. Mismas rutas, mismos status, mismos bodies.

## Problema
`apps/desk/server/app.ts` = `createApp()` de ~412 líneas con ~30 rutas de 6 dominios + lógica de negocio inline (crear ticket, transición). God-file difícil de mantener/testear.

## Estructura objetivo
```
apps/desk/server/
├── app.ts                 # createApp fino: middleware + monta routers + error-handler
├── util/
│   ├── asyncHandler.ts    # (movido desde app.ts)
│   └── httpError.ts       # class HttpError(status, body)
├── services/
│   └── ticketService.ts   # createManagedTicket(), executeTransition() (lógica de negocio, lanza HttpError)
└── routes/
    ├── tickets.ts         # registerTicketRoutes(app, deps): /api/tickets/* (lista, read, create, detalle, conversations, history, activities, transition, reply, resolution + attachments)
    ├── directory.ts       # clients, sales-orders, contacts, accounts, activities
    ├── equipos.ts         # equipos CRUD
    ├── analisis.ts        # /api/analisis
    ├── admin.ts           # measure-attachments, backfill-details, backfill-serial, backfill-archived
    └── attachment.ts      # /api/attachment (proxy SSRF-guard)
```
Patrón = el existente `registerAuthRoutes(app, db)`: cada módulo exporta `registerXRoutes(app, deps)` que adjunta sus rutas al `app` recibido. Deps = lo que cada uno use (`{ db, sync, zohoFetch, config, ... }`).

## Manejo de errores de negocio (clave para no cambiar respuestas)
- **`util/httpError.ts`:** `export class HttpError extends Error { constructor(public status: number, public body: unknown) { super() } }`.
- **Error-handler central** (en `app.ts`, ya existe de F4-01): añadir AL INICIO `if (err instanceof HttpError) { res.status(err.status).json(err.body); return }` (antes del `console.error` + 500 genérico) → los 4xx esperados se mapean sin loguearse como error y sin filtrar internos.
- Los servicios lanzan `throw new HttpError(422, { error: 'Falta el equipo' })` etc.; `asyncHandler` ya enruta al handler central vía `next(err)`. Resultado HTTP **idéntico** al actual.

## Capa de servicio (`services/ticketService.ts`)
- `createManagedTicket(deps, body, actorName)`: TODA la validación + construcción del POST `/api/tickets` actual (equipo/cliente/OV/prefijo/códigos), lanzando `HttpError(422, {error})` en cada fallo; devuelve el `TicketDetail` creado (objeto a serializar). El router: `res.status(201).json(await createManagedTicket(...))`.
- `executeTransition(deps, id, body, user)`: la lógica del POST `/api/tickets/:id/transition` (transitionById, from-check→409, canExecuteTransition→403, buildTransitionPlan→422 con `{errors}`, applyTransition); devuelve el `TicketDetail` actualizado. Errores vía `HttpError`.
- Deps mínimos que necesiten (db, y para createManagedTicket: getEquipo/getSalesOrder/getClient/createTicket/getTicketWithRefs + buildSubject/buildCodigoServicio; para transition: transitionById/canExecuteTransition/buildTransitionPlan/applyTransition/getTicketWithRefs). Importan directo de los paquetes (no por deps) salvo `db`.

## Routers (resumen de qué va en cada uno) — TODOS conservan middlewares actuales
- **tickets.ts:** `app.use('/api/tickets', requireAuth(db))` (igual), multer `upload`, resolución (get/put/post + delete×2 con `requireSuperAdmin`), `GET /api/tickets` (paginación), `POST /read`, `POST /` (→ ticketService), `GET /:id` + conversations + history + activities (lazy+background, idénticos), `POST /:id/transition` (→ ticketService), `POST /:id/reply` (`guardWrites`).
- **directory.ts:** clients, sales-orders, contacts(+:id), accounts(+:id), activities — cada uno con su `requireAuth(db)` como hoy.
- **equipos.ts:** equipos (list/manage/facets/:id/historial/create/patch/delete con requireSuperAdmin) — `requireAuth(db)` como hoy.
- **analisis.ts:** `/api/analisis` (`requireAuth(db), requireSuperAdmin`).
- **admin.ts:** measure-attachments, backfill-details (necesitan `measurer`/`detailBackfiller` creados en createApp → pasados por deps), backfill-serial, backfill-archived. Todos `requireAuth(db), requireSuperAdmin`. `humanBytes` → mover a `util/` o dentro de admin.ts.
- **attachment.ts:** `/api/attachment` (`requireAuth(db)`, regex anti-SSRF intacta).

## createApp final (fino)
`express()` → `trust proxy` → `helmet` → `json` → `cookieParser` → rate-limit login/change-password → `registerAuthRoutes(app, db)` → crear `measurer`/`detailBackfiller` → `registerTicketRoutes/Directory/Equipos/Analisis/Admin/Attachment(app, deps)` → error-handler central (con el branch HttpError). Mismos imports de middleware.

## Pruebas
- Los **259 tests existentes** son el contrato — no se modifican (salvo imports si algún test importaba un símbolo movido; evitarlo). Verde tras CADA extracción.
- Opcional (valor del service layer): tests unitarios de `ticketService` (createManagedTicket lanza HttpError en cada validación; executeTransition mapea estados) — añadir si es barato.
- Verificación por paso: `npm test` + `npm run typecheck` + `npm run lint`; al final `vite build`.

## Plan incremental (orden, cada uno commit con tests verdes)
1. `util/asyncHandler.ts` + `util/httpError.ts` + branch HttpError en el error-handler (sin mover rutas aún).
2. `services/ticketService.ts` (extraer create + transition; el endpoint en app.ts pasa a llamarlo).
3. `routes/tickets.ts` (mover todo /api/tickets/*).
4. `routes/{directory,equipos,analisis,admin,attachment}.ts`.
5. `app.ts` fino + verificación total + push.

## Fuera de alcance
- Cambiar comportamiento/forma de respuestas. Tocar el worker, repo, o el frontend. Reescribir tests existentes (solo ajustes de import si algo se movió).
