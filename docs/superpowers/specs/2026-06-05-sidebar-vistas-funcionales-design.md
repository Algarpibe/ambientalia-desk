# Diseño — Vistas funcionales de la barra lateral

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** El `Sidebar` ya muestra todas las secciones (estructura). Ahora un subconjunto de vistas debe
**filtrar el tablero**. El resto se muestran **atenuadas/inertes**.
**Depende de:** tablero (A, `App.tsx` con modos Kanban/lista/tabla).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Vistas funcionales | **Todos los Tickets · Tickets abiertos · Tickets cerrados · Tickets en espera · Tickets vencidos** |
| Archivado | **Diferido** (no guardamos `is_archived` en `tickets`; futuro) |
| Vistas no funcionales | **Atenuadas/inertes** (visibles, sin acción, opacidad reducida) |

## Semántica de cada vista (sobre `tickets` ya cargados en cliente)

| key | Etiqueta | Filtro |
|---|---|---|
| `todos` | Todos los Tickets | `statusType !== 'Closed'` (activos) — **vista por defecto** |
| `abiertos` | Tickets abiertos | activo **y** estado NO contiene "espera" |
| `cerrados` | Tickets cerrados | `statusType === 'Closed'` |
| `espera` | Tickets en espera | estado contiene "espera" (case-insensitive) |
| `vencidos` | Tickets vencidos | activo **y** `dueDate` válido y `< ahora` |

## Arquitectura

### `src/lib/boardView.ts` (nuevo, puro)
```ts
import type { Ticket } from '../../shared/types'

export interface BoardViewDef { key: string; label: string }

// Fuente de verdad de las vistas funcionales (orden = el de la imagen).
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

### `src/components/Sidebar.tsx` (modificar)
- Props nuevas: `activeView: string`, `onSelectView: (key: string) => void`. (Se elimina el `useState` interno `active`.)
- En `TODAS_LAS_VISTAS`, para cada etiqueta: `const key = FUNCTIONAL_BY_LABEL[label]`.
  - **Funcional** (`key` existe): clicable → `onSelectView(key)`; resaltada si `activeView === key`.
  - **No funcional**: `opacity-40 cursor-default` (sin `onClick`, sin hover de selección).
- Resto de secciones (Blueprint, Archivado, etc.) quedan atenuadas/inertes igual que ahora.

### `src/App.tsx` (modificar)
- `const [view, setView] = useState('todos')` y `const base = applyBoardView(all, view, new Date())`.
- Pasar `<Sidebar activeView={view} onSelectView={setView} />`.
- Reemplazar el origen de datos de **todos** los modos por `base` (uniforme):
  - `estado`: `groupTicketsByColumn(base)` (antes `activos`)
  - `prioridad`: `groupByPriority(base)` · `cuenta-regresiva`: `groupByDueDate(base, new Date())`
  - `clasica`/`compacta`: `TicketList tickets={base}` · `tabla`: `TicketTable tickets={base}`
  - (`activos` deja de usarse → eliminar esa línea.)
- El título `<h1>` pasa de fijo "Todos los Tickets" a `{viewLabel(view)}`.

## Pruebas
- **`applyBoardView`** (vitest puro): `todos` excluye cerrados; `cerrados` solo Closed; `abiertos` excluye en espera; `espera` solo en espera; `vencidos` = activo + dueDate pasado (excluye sin fecha, futuros y cerrados); key desconocida → como `todos`.
- Sidebar/App: cubiertos por `tsc` + build (UI). Verificación manual.

## Fuera de alcance (v1)
- Vistas "Mis…" (requieren mapear usuario↔agente), Calificados (sin CSAT), Compartidos, Blueprint/transiciones.
- "Archivado" (requiere `tickets.is_archived` + marcado en backfill/sync + re-backfill).
- Persistir la vista elegida entre sesiones (hoy `useState`).
