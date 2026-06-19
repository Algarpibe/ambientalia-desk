# Diseño — F3-01: paginación de tickets (split activos / cerrados)

**Fecha:** 2026-06-19
**Estado:** Aprobado para planificación
**Origen:** auditoría (Fase D). Repo: `ambientalia-desk`. Trabajo directo en `main`.

## Problema
El front carga **todos** los tickets (`fetchTickets('all')`, App.tsx:43) — incluido todo el historial cerrado — y filtra/agrupa client-side. Payload y render sin techo al crecer los tickets.

## Hallazgo que define el diseño
`applyBoardView` (apps/desk/src/lib/boardView.ts): de las 5 vistas funcionales, **4 ya descartan cerrados** (`todos`/`abiertos`/`espera`/`vencidos` filtran `statusType !== 'Closed'`). Solo **`cerrados`** muestra `statusType === 'Closed'` (el conjunto no acotado e histórico). En el server, `getActiveTickets` = `WHERE status_type <> 'Closed'`; `getAllTickets` = todo.

## Decisión (confirmada): split pragmático
- **Vistas activas** (`todos`/`abiertos`/`espera`/`vencidos`): cargar **`getActiveTickets`** (acotado). Resultado idéntico al actual (esas vistas ya filtran cerrados client-side).
- **Vista `cerrados`**: cargar **cerrados PAGINADOS** desde el server (página + total) con controles de paginación en la UI.

## Backend
- **`packages/zoho-sync/src/db/repo.ts`:**
  - `getClosedTickets(db, userId, limit, offset)`: como `getActiveTickets` pero `WHERE t.status_type = 'Closed'`, `ORDER BY t.created_time DESC NULLS LAST LIMIT $2 OFFSET $3`.
  - `countClosedTickets(db)`: `SELECT count(*)::int FROM tickets WHERE status_type = 'Closed'`.
- **`apps/desk/server/app.ts`** — `GET /api/tickets`:
  - `scope` ausente o `active` (default) → `getActiveTickets(db, userId)` → array `Ticket[]` (forma actual, retrocompatible).
  - `scope=closed` → `{ items: Ticket[], total, page, pageSize }`. `page` = `Math.max(1, Number(req.query.page)||1)`, `pageSize=50`, `offset=(page-1)*pageSize`. `items` = `getClosedTickets(...)`, `total` = `countClosedTickets(...)`.
  - `scope=all` se conserva (compat; el front deja de usarlo). (Limpieza futura.)
  - (El endpoint ya está bajo `requireAuth`; usa `req.user!.id` como hoy.)

## Frontend
- **`apps/desk/src/api/client.ts`:**
  - `fetchActiveTickets(): Promise<Ticket[]>` → `/api/tickets` (sin scope).
  - `fetchClosedTickets(page): Promise<{ items: Ticket[]; total: number; page: number; pageSize: number }>` → `/api/tickets?scope=closed&page=${page}`.
  - (Mantener `fetchTickets` o reemplazar usos; preferible reemplazar por las 2 nuevas para claridad.)
- **`apps/desk/src/App.tsx`** (flujo de datos por vista):
  - Estado nuevo: `const [closedPage, setClosedPage] = useState(1)`.
  - El fetch depende de la vista:
    - `useAsync(() => view === 'cerrados' ? fetchClosedTickets(closedPage) : fetchActiveTickets(), [user?.id, view, closedPage])`.
  - Normalizar: si la respuesta es paginada (`view==='cerrados'`) → `tickets = resp.items` + guardar `total`/`pageSize`; si no, `tickets = resp` (array).
  - `applyBoardView(tickets, view)` se mantiene (para `cerrados`, `tickets` ya viene filtrado del server → el filtro `'cerrados'` es no-op; OK).
  - **Controles de paginación**: visibles solo cuando `view === 'cerrados'` (en cualquier mode). Componente nuevo `Pagination` ({page, pageSize, total, onPrev, onNext}) mostrando "Página N de M" + botones; deshabilitar prev en página 1 y next en la última.
  - Al cambiar de vista, resetear `closedPage` a 1 (`useEffect` sobre `view`).
- **Nuevo componente** `apps/desk/src/components/Pagination.tsx` (presentacional, sin lógica de datos).

## No-objetivos / invariantes
- Las 4 vistas activas: **comportamiento idéntico** (mismo conjunto, mismo render), solo que el server ya no manda cerrados.
- `cerrados`: ahora paginado (antes mostraba todos los cerrados de golpe).
- Sin tocar el Kanban/board internamente; con `cerrados`+board, la página actual de cerrados se agrupa igual (los cerrados caen en su columna; funcional).
- Sin cambiar auth ni otras rutas.

## Pruebas
- **repo (pg-mem):** `getClosedTickets` respeta `WHERE Closed` + `LIMIT/OFFSET` + orden; `countClosedTickets` cuenta solo cerrados. Sembrar mezcla de activos/cerrados.
- **app endpoint:** `GET /api/tickets` (default) → array de solo activos; `?scope=closed&page=1` → `{items, total, page, pageSize}` con solo cerrados y `items.length <= pageSize`; página fuera de rango → items vacíos, total correcto.
- **front (si hay test runner de componentes):** `Pagination` deshabilita prev/next en bordes. (Si no, verificación por `vite build` + manual.)
- Verificación: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Despliegue
Commit directo a `main` (CI corre como aviso). Tras deploy validar: vistas activas iguales y más rápidas (no bajan cerrados); vista `cerrados` pagina (50/pág) con controles; total correcto.

## Fuera de alcance
- Paginación/filtrado server-side de las vistas activas (acotadas; no hace falta). Virtualización del render. Búsqueda server-side. Quitar `getAllTickets`/`scope=all` (compat, limpieza futura).
