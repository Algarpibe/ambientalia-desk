# F3-05 code-splitting del frontend — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development. Rama `fix/f3-05-code-splitting` → PR. Frontend-only (no toca server).

**Goal:** Reducir el bundle inicial cargando con `React.lazy` las vistas que solo aparecen bajo demanda (overlays gated por `show*`), dejando el board/detalle eager.

**Contexto ([apps/desk/src/App.tsx](apps/desk/src/App.tsx)):** estas se renderizan condicionalmente (`{showX && <X/>}`, líneas ~114-120) y son **named exports** (`export function UsersAdmin`, etc.):
`UsersAdmin, RolesAdmin, EquiposAdmin, CreateTicket, Configuracion, Analisis, ClientesPage, ActividadesPage`.
Eager (se quedan): Sidebar, Header, KanbanBoard, TicketList, TicketTable, TicketDetailView, Login, ViewModeMenu (flujo principal/frecuente).

---

## Task 1: Lazy-load de las 8 vistas overlay

**Files:** `apps/desk/src/App.tsx`.

- [ ] **Step 1:** En `App.tsx`, sustituir los `import { X } from './components/X'` de las 8 vistas por imports perezosos. Como son **named exports**, mapear a `default`:
```tsx
import { lazy, Suspense, useState, useEffect } from 'react'
// ...
const UsersAdmin = lazy(() => import('./components/UsersAdmin').then(m => ({ default: m.UsersAdmin })))
const RolesAdmin = lazy(() => import('./components/RolesAdmin').then(m => ({ default: m.RolesAdmin })))
const EquiposAdmin = lazy(() => import('./components/EquiposAdmin').then(m => ({ default: m.EquiposAdmin })))
const CreateTicket = lazy(() => import('./components/CreateTicket').then(m => ({ default: m.CreateTicket })))
const Configuracion = lazy(() => import('./components/Configuracion').then(m => ({ default: m.Configuracion })))
const Analisis = lazy(() => import('./components/Analisis').then(m => ({ default: m.Analisis })))
const ClientesPage = lazy(() => import('./components/ClientesPage').then(m => ({ default: m.ClientesPage })))
const ActividadesPage = lazy(() => import('./components/ActividadesPage').then(m => ({ default: m.ActividadesPage })))
```
(Verificar el nombre exacto del export en cada archivo; si alguno ya es `export default`, usar `lazy(() => import('./components/X'))` sin el `.then`.)

- [ ] **Step 2:** Envolver el bloque donde se renderizan estos overlays (las líneas `{showUsers && <UsersAdmin .../>}` … `{showCreate && <CreateTicket .../>}`, ~114-120) en UN `<Suspense>` con fallback mínimo (es modal → un overlay simple):
```tsx
<Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 text-sm text-slate-600">Cargando…</div>}>
  {showUsers && <UsersAdmin onClose={() => setShowUsers(false)} />}
  {showEquipos && <EquiposAdmin onClose={() => setShowEquipos(false)} />}
  {showAnalisis && <Analisis onClose={() => setShowAnalisis(false)} />}
  {showClientes && <ClientesPage initial={clientesInitial} onClose={() => { setShowClientes(false); setClientesInitial(null) }} onSelectTicket={(id) => { setShowClientes(false); setClientesInitial(null); setSelectedTicketId(id) }} onAgregarTicket={() => setShowCreate(true)} />}
  {showActividades && <ActividadesPage onClose={() => setShowActividades(false)} onSelectTicket={(id) => { setShowActividades(false); setSelectedTicketId(id) }} />}
  {showRoles && <RolesAdmin onClose={() => setShowRoles(false)} />}
  {showCreate && <CreateTicket onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />}
  {showConfig && <Configuracion onClose={() => setShowConfig(false)} />}
</Suspense>
```
(Conservar EXACTAMENTE las props actuales de cada overlay — copiarlas del render existente, no inventarlas. Incluir `Configuracion` si está en el render actual.)

- [ ] **Step 3: Verificar:**
  - `npm run typecheck` → exit 0.
  - `npm run lint` → 0 errores.
  - `cd apps/desk && npx vite build` → ahora el output debe mostrar **varios chunks** (un archivo JS por vista lazy, p.ej. `Analisis-*.js`, `UsersAdmin-*.js`…) y el `index-*.js` principal **más pequeño** que antes (~358 KB). Anotar los tamaños antes/después.
  - `npm test` → sigue verde (los tests de `lib`/`board` no se ven afectados).
- [ ] **Step 4: Commit** (rama): `git add apps/desk/src/App.tsx && git commit -m "perf(desk): code-splitting de vistas overlay con React.lazy (F3-05)"` (trailer Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>).

## Notas
- Frontend-only → sin conflicto con F3-02 (server). Rama desde `main`.
- Si `useEffect` ya estaba importado, no duplicar; solo añadir `lazy, Suspense`.
- El fallback aparece <1s solo la primera vez que se abre cada vista (luego el chunk queda cacheado).
