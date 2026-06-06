# Vistas funcionales de la barra lateral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un subconjunto de vistas del `Sidebar` (Todos/Abiertos/Cerrados/En espera/Vencidos) filtre el tablero; el resto se muestran atenuadas/inertes.

**Architecture:** Función pura `applyBoardView(tickets, key, now)` + fuente de verdad `FUNCTIONAL_VIEWS`/`FUNCTIONAL_BY_LABEL`/`viewLabel` en `src/lib/boardView.ts`. `App` mantiene la vista seleccionada (`useState`), calcula `base = applyBoardView(all, view, now)` y la pasa a todos los modos + al título; el `Sidebar` recibe `activeView`/`onSelectView` y marca cada ítem funcional o atenuado.

**Tech Stack:** React 19 + Vite + Tailwind + TS ESM, Vitest 3.x. Spec: `docs/superpowers/specs/2026-06-05-sidebar-vistas-funcionales-design.md`.

**Contexto del repo:**
- `App.tsx`: `const all = tickets ?? []; const activos = all.filter((t) => t.statusType !== 'Closed')`. Modos:
  `estado` → `groupTicketsByColumn(activos)`; `prioridad` → `groupByPriority(all)`; `cuenta-regresiva` →
  `groupByDueDate(all, new Date())`; `clasica`/`compacta` → `<TicketList tickets={all} …>`; `tabla` →
  `<TicketTable tickets={all} …>`. Imports: `import { groupTicketsByColumn, groupByPriority, groupByDueDate, PRIORITY_COLUMNS, DUEDATE_COLUMNS } from './board'`, `import { COLUMNS } from '../shared/columns'`, `import { Sidebar } from './components/Sidebar'`. El `<h1>` muestra "Todos los Tickets" fijo. `<Sidebar />` se renderiza sin props.
- `Sidebar.tsx`: hoy tiene `const [active, setActive] = useState('Todos los Tickets')`, un array `TODAS_LAS_VISTAS: string[]`, y `ViewItem({ label, active, onClick })`. Render: `TODAS_LAS_VISTAS.map((v) => <ViewItem key={v} label={v} active={active === v} onClick={() => setActive(v)} />)`.
- `shared/types.ts`: `Ticket { status: string; statusType?: string | null; dueDate?: string | null; … }`.

---

## Estructura de archivos
- Create `src/lib/boardView.ts` (+ `src/lib/boardView.test.ts`) — vistas + filtro puro.
- Modify `src/components/Sidebar.tsx` — props `activeView`/`onSelectView`; funcional vs atenuado.
- Modify `src/App.tsx` — estado de vista, `base`, propagación a modos + título + Sidebar.

---

## Task 1: `src/lib/boardView.ts` + filtro puro (TDD)

**Files:** Create `src/lib/boardView.ts`, `src/lib/boardView.test.ts`

- [ ] **Step 1: Escribir `src/lib/boardView.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import type { Ticket } from '../../shared/types'
import { applyBoardView, viewLabel, FUNCTIONAL_BY_LABEL } from './boardView'

const BASE = { id: 'x', number: '#1', subject: 's', status: 'Ingresado', statusType: 'Open', dueDate: null }
const T = (over: Partial<Ticket>): Ticket => ({ ...BASE, ...over } as Ticket)

const now = new Date('2026-06-06T00:00:00Z')
const tickets: Ticket[] = [
  T({ id: 'a', status: 'Ingresado', statusType: 'Open', dueDate: '2026-01-01T00:00:00Z' }),   // activo, vencido
  T({ id: 'b', status: 'En espera de repuesto', statusType: 'Open', dueDate: null }),          // en espera
  T({ id: 'c', status: 'Finalizado', statusType: 'Closed', dueDate: '2026-01-01T00:00:00Z' }), // cerrado (no vencido)
  T({ id: 'd', status: 'Diagnóstico', statusType: 'Open', dueDate: '2026-12-31T00:00:00Z' }),  // activo, futuro
]

describe('applyBoardView', () => {
  const ids = (key: string) => applyBoardView(tickets, key, now).map((t) => t.id).sort()
  it('todos = activos (excluye cerrados)', () => { expect(ids('todos')).toEqual(['a', 'b', 'd']) })
  it('cerrados = solo Closed', () => { expect(ids('cerrados')).toEqual(['c']) })
  it('abiertos = activos sin en espera', () => { expect(ids('abiertos')).toEqual(['a', 'd']) })
  it('espera = solo en espera', () => { expect(ids('espera')).toEqual(['b']) })
  it('vencidos = activo + fecha pasada (excluye sin fecha/futuro/cerrado)', () => { expect(ids('vencidos')).toEqual(['a']) })
  it('key desconocida → como todos', () => { expect(ids('zzz')).toEqual(['a', 'b', 'd']) })
})

describe('viewLabel / FUNCTIONAL_BY_LABEL', () => {
  it('viewLabel mapea key→etiqueta con fallback', () => {
    expect(viewLabel('cerrados')).toBe('Tickets cerrados')
    expect(viewLabel('zzz')).toBe('Todos los Tickets')
  })
  it('FUNCTIONAL_BY_LABEL mapea etiqueta→key', () => {
    expect(FUNCTIONAL_BY_LABEL['Tickets en espera']).toBe('espera')
    expect(FUNCTIONAL_BY_LABEL['Mis Tickets']).toBeUndefined()
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/boardView.test.ts` — confirm FAIL.

- [ ] **Step 3: Crear `src/lib/boardView.ts`**
```ts
import type { Ticket } from '../../shared/types'

export interface BoardViewDef { key: string; label: string }

// Fuente de verdad de las vistas funcionales (orden = el de la imagen del Sidebar).
export const FUNCTIONAL_VIEWS: BoardViewDef[] = [
  { key: 'todos', label: 'Todos los Tickets' },
  { key: 'abiertos', label: 'Tickets abiertos' },
  { key: 'cerrados', label: 'Tickets cerrados' },
  { key: 'espera', label: 'Tickets en espera' },
  { key: 'vencidos', label: 'Tickets vencidos' },
]

// label -> key, para que el Sidebar sepa qué ítems son funcionales.
export const FUNCTIONAL_BY_LABEL: Record<string, string> =
  Object.fromEntries(FUNCTIONAL_VIEWS.map((v) => [v.label, v.key]))

export function viewLabel(key: string): string {
  return FUNCTIONAL_VIEWS.find((v) => v.key === key)?.label ?? 'Todos los Tickets'
}

export function applyBoardView(tickets: Ticket[], key: string, now: Date): Ticket[] {
  const enEspera = (t: Ticket) => /espera/i.test(t.status ?? '')
  switch (key) {
    case 'cerrados': return tickets.filter((t) => t.statusType === 'Closed')
    case 'abiertos': return tickets.filter((t) => t.statusType !== 'Closed' && !enEspera(t))
    case 'espera': return tickets.filter((t) => t.statusType !== 'Closed' && enEspera(t))
    case 'vencidos': return tickets.filter((t) => {
      if (t.statusType === 'Closed' || !t.dueDate) return false
      const d = new Date(t.dueDate); return !isNaN(d.getTime()) && d.getTime() < now.getTime()
    })
    case 'todos':
    default: return tickets.filter((t) => t.statusType !== 'Closed')
  }
}
```

- [ ] **Step 4:** Run `npx vitest run src/lib/boardView.test.ts` — confirm PASS. (Si el `T(...)` helper del test diera problemas de tipos, simplifícalo a un objeto literal con cast `as Ticket`; no cambies las aserciones.)

- [ ] **Step 5:** Run `npx tsc -b && npx eslint src/lib/boardView.ts src/lib/boardView.test.ts` — Expected: sin errores; eslint 0.

- [ ] **Step 6: Commit**
```bash
git add src/lib/boardView.ts src/lib/boardView.test.ts
git commit -m "feat(sidebar-vistas): applyBoardView + FUNCTIONAL_VIEWS (filtro puro de vistas)"
```

---

## Task 2: `Sidebar` recibe `activeView`/`onSelectView` (funcional vs atenuado)

**Files:** Modify `src/components/Sidebar.tsx`

- [ ] **Step 1: Cambiar la firma y quitar el estado interno.** Reemplaza el import de React y la línea de estado:
  - Import: `import React from 'react';` (ya no se usa `useState` aquí).
  - Firma del componente: de `export const Sidebar: React.FC = () => {` a
    `export const Sidebar: React.FC<{ activeView: string; onSelectView: (key: string) => void }> = ({ activeView, onSelectView }) => {`
  - **Elimina** la línea `const [active, setActive] = useState('Todos los Tickets');`.

- [ ] **Step 2: Importar el mapa de vistas funcionales.** Tras el import de React añade:
```tsx
import { FUNCTIONAL_BY_LABEL } from '../lib/boardView';
```

- [ ] **Step 3: Actualizar `ViewItem`** para soportar el estado atenuado (no funcional). Sustituye la función `ViewItem` por:
```tsx
function ViewItem({ label, active, onClick, disabled }: { label: string; active?: boolean; onClick?: () => void; disabled?: boolean }) {
    if (disabled) {
        return (
            <div className="w-full text-left px-3 py-1.5 pl-6 text-[12px] font-medium truncate text-white/30 cursor-default" title={label}>
                {label}
            </div>
        );
    }
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-1.5 pl-6 transition-colors text-[12px] font-medium truncate ${active ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            title={label}
        >
            {label}
        </button>
    );
}
```

- [ ] **Step 4: Actualizar el render de `TODAS_LAS_VISTAS`.** Reemplaza el `.map` actual por:
```tsx
                {TODAS_LAS_VISTAS.map((v) => {
                    const key = FUNCTIONAL_BY_LABEL[v];
                    return key
                        ? <ViewItem key={v} label={v} active={activeView === key} onClick={() => onSelectView(key)} />
                        : <ViewItem key={v} label={v} disabled />;
                })}
```

- [ ] **Step 5: Atenuar las vistas de Blueprint** (no funcionales). En el `.map` de `VISTAS_BLUEPRINT` reemplaza el render por:
```tsx
                {VISTAS_BLUEPRINT.map((v) => (
                    <ViewItem key={v} label={v} disabled />
                ))}
```

- [ ] **Step 6:** Run `npx tsc -b 2>&1` — Expected: **fallará** en `src/App.tsx` porque `<Sidebar />` aún no pasa las props nuevas. Eso es esperado; se corrige en Task 3. Verifica que el ÚNICO error sea el de las props de `Sidebar` en App. (Ejecuta también `npx eslint src/components/Sidebar.tsx` → 0 errores.)

- [ ] **Step 7: Commit**
```bash
git add src/components/Sidebar.tsx
git commit -m "feat(sidebar-vistas): Sidebar con activeView/onSelectView (funcional vs atenuado)"
```

---

## Task 3: `App` aplica la vista al tablero

**Files:** Modify `src/App.tsx`

- [ ] **Step 1: Importar el filtro.** Junto a los otros imports añade:
```tsx
import { applyBoardView, viewLabel } from './lib/boardView';
```

- [ ] **Step 2: Estado de vista + base filtrada.** Sustituye la línea
  `const activos = all.filter((t) => t.statusType !== 'Closed');` por:
```tsx
  const [view, setView] = useState('todos');
  const base = applyBoardView(all, view, new Date());
```
  (Asegúrate de que `useState` ya esté importado en App; si no, añádelo al import de `react`.)

- [ ] **Step 3: Pasar props al `Sidebar`.** Cambia `<Sidebar />` por:
```tsx
        <Sidebar activeView={view} onSelectView={setView} />
```

- [ ] **Step 4: Título dinámico.** Cambia el `<h1 …>Todos los Tickets</h1>` por:
```tsx
              <h1 className="text-[14px] font-semibold text-slate-700">{viewLabel(view)}</h1>
```
  (Conserva las clases existentes del `<h1>`.)

- [ ] **Step 5: Renderizar todos los modos desde `base`.** Reemplaza en los cinco modos el origen de datos:
  - `groupTicketsByColumn(activos)` → `groupTicketsByColumn(base)`
  - `groupByPriority(all)` → `groupByPriority(base)`
  - `groupByDueDate(all, new Date())` → `groupByDueDate(base, new Date())`
  - `<TicketList tickets={all} …>` → `<TicketList tickets={base} …>`
  - `<TicketTable tickets={all} …>` → `<TicketTable tickets={base} …>`
  (No quedan usos de `activos`; `all` se sigue usando solo para construir `base`.)

- [ ] **Step 6:** Run `npx tsc -b && npx eslint src/App.tsx && npx vite build` — Expected: sin errores de tipos (incluido el de Task 2 ya resuelto); eslint 0; build OK.

- [ ] **Step 7: Commit**
```bash
git add src/App.tsx
git commit -m "feat(sidebar-vistas): App filtra el tablero por la vista elegida + título dinámico"
```

---

## Task 4: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx eslint . && npx vite build`
Expected: tests PASS (incl. `boardView.test.ts`); `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Sidebar: **Todos los Tickets** (por defecto) resaltada; el tablero muestra los activos.
2. Clic en **Tickets cerrados** → el tablero (lista/tabla) muestra solo Finalizados; el título cambia a "Tickets cerrados".
3. **Tickets abiertos / En espera / Vencidos** filtran correctamente; el título sigue a la vista.
4. Las vistas "Mis…", Blueprint, etc. se ven **atenuadas** y no responden al clic.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(sidebar-vistas): verificado"
```

---

## Notas de cierre
- **Diferido**: "Archivado" (requiere `tickets.is_archived` + marcado en backfill/sync), vistas "Mis…" (usuario↔agente), Calificados/Compartidos/Blueprint, y persistir la vista entre sesiones.
- En modo `estado`, los tickets cerrados no tienen columna en `COLUMNS` (columnas activas), por lo que la vista "Tickets cerrados" se aprecia mejor en modo **lista/tabla** — comportamiento esperado, no un bug.
