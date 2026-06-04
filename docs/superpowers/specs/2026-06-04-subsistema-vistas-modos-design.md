# Diseño — Subsistema "Vistas" (modos de visualización de tickets)

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Depende de:** A (modelo tipado), C/E (creación), tablero actual (`shared/columns.ts`, `src/board.ts`, `App.tsx`).

## Objetivo

Replicar la sección de **Vistas** de Zoho Desk: un selector de modo que ofrece **vistas de lista/tabla**
sobre **todos los tickets existentes** (incluidos los Finalizados) y **modos Kanban** (por estado, por
prioridad, por cuenta regresiva). El Kanban **"Modo de estado" sigue mostrando solo los activos**; los
demás modos muestran **todos** los tickets. El modo elegido se recuerda por navegador.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Modos en esta fase | Vista clásica, Vista compacta, Vista de tabla + Kanban: Modo de estado, Modo de prioridad, Modo de cuenta regresiva. (Sin "tipo de cliente": no hay dato.) |
| Activos vs todos | **Solo "Modo de estado" = activos**; lista/tabla y los demás Kanban = **todos** los tickets |
| Persistencia | Modo seleccionado en **localStorage** (arranca en "Modo de estado") |
| Carga de datos | Se cargan **todos** los tickets una vez (`scope=all`) y cada modo se deriva en el cliente |

## Datos (backend)

### Endpoint
`GET /api/tickets` gana el query param `scope`:
- `?scope=all` → **todos** los tickets (incl. Finalizados) vía `getAllTickets`.
- sin `scope` → solo activos (`getActiveTickets`, comportamiento actual; compatibilidad).

### Repo (`server/db/repo.ts`)
`getAllTickets(db)`: idéntica a `getActiveTickets` pero **sin** la cláusula `WHERE status_type <> 'Closed'`
(mismos JOINs accounts/agents/clients + `COALESCE(a.name, cl.name)`), `ORDER BY created_time DESC NULLS LAST`.

### Mapper (`server/db/mappers.ts`) + tipo (`shared/types.ts`)
`rowToTicket` añade campos **opcionales** (ya presentes en la fila; la tarjeta del tablero los ignora):
```ts
// en interface Ticket:
  priority?: string | null
  statusType?: string | null
  dueDate?: string | null     // due_date crudo (ISO)
  createdAt?: string | null   // created_time crudo (ISO)
  channel?: string | null
  diasEntrega?: string | null
```
`rowToTicket` los rellena desde `row.priority`, `row.status_type`, `row.due_date`, `row.created_time`,
`row.channel`, `row.dias_entrega`. El "Propietario" sale de `assignee.name` (ya existe).

## Lógica de agrupación (`src/board.ts`, puro, TDD)

Además de `groupTicketsByColumn` (existente, para estado):

```ts
export const PRIORITY_COLUMNS = [
  { id: 'High', label: 'High' }, { id: 'Medium', label: 'Medium' },
  { id: 'Low', label: 'Low' }, { id: 'otra', label: 'Otra prioridad' },
] as const
// Urgent → High; vacío/desconocido → otra
export function groupByPriority(tickets: Ticket[]): ColumnGroups

export const DUEDATE_COLUMNS = [
  { id: 'vencidos', label: 'Vencidos' }, { id: 'hoy', label: 'Vence hoy' },
  { id: 'semana', label: 'Esta semana' }, { id: 'adelante', label: 'Más adelante' },
  { id: 'sinfecha', label: 'Sin fecha' },
] as const
// dueDate < now → vencidos; < fin de hoy → hoy; < +7 días → semana; resto → adelante; sin dueDate → sinfecha
export function groupByDueDate(tickets: Ticket[], now: Date): ColumnGroups
```
`now` se pasa como argumento (testeable; sin `Date.now()` dentro). `visibleColumns` (ya existe) se reutiliza
para ocultar columnas vacías cuando aplica.

## Selector de modo (`src/components/ViewModeMenu.tsx`)

Dropdown arriba a la derecha de la barra del tablero, estilo Zoho, con dos secciones:
- **Vistas:** Vista clásica · Vista compacta · Vista de tabla
- **Modos de trabajo:** Modo de estado · Modo de prioridad · Modo de cuenta regresiva

Marca el modo activo con un check. Props `{ mode, onChange }`.

## Persistencia (`src/viewSettings.ts`)

`ViewMode = 'estado' | 'prioridad' | 'cuenta-regresiva' | 'clasica' | 'compacta' | 'tabla'`.
`getViewMode()` / `setViewMode(m)` (localStorage, default `'estado'`) + hook `useViewMode()` (reactivo,
mismo patrón que `boardSettings.ts`).

## Render por modo (componentes)

- **`KanbanBoard.tsx`** (genérico): props `{ columns, groups, hideEmpty, loading, onSelect }`. Reutiliza
  `TicketCard` y `visibleColumns`. Se extrae del JSX de columnas que hoy vive en `App.tsx`.
  - Modo de estado: `COLUMNS` + `groupTicketsByColumn(activos)` + `hideEmpty` (config actual).
  - Modo de prioridad: `PRIORITY_COLUMNS` + `groupByPriority(todos)`.
  - Modo de cuenta regresiva: `DUEDATE_COLUMNS` + `groupByDueDate(todos, new Date())`.
- **`TicketList.tsx`** (clásica/compacta): props `{ tickets, dense, onSelect }`. Filas con asunto, #ticket,
  agente, fecha y badge de estado; `dense` reduce paddings (compacta).
- **`TicketTable.tsx`** (tabla): props `{ tickets, onSelect }`. Columnas: **#, Asunto, Cliente, Estado,
  Prioridad, Propietario, Creado, Vencimiento, Días entrega, Canal**. "Creado"/"Vencimiento" se formatean
  desde `createdAt`/`dueDate`.

## Orquestación (`App.tsx`)

- Carga **todos** los tickets: `useAsync(() => fetchTickets('all'), [user?.id])`.
- `mode = useViewMode()`. La barra del tablero muestra `ViewModeMenu` (derecha) junto a "Nuevo ticket".
- Activos = `tickets.filter((t) => t.statusType !== 'Closed')`.
- Render condicional:
  - `estado` → `KanbanBoard(COLUMNS, groupTicketsByColumn(activos), hideEmpty)`.
  - `prioridad` → `KanbanBoard(PRIORITY_COLUMNS, groupByPriority(todos), hideEmpty)`.
  - `cuenta-regresiva` → `KanbanBoard(DUEDATE_COLUMNS, groupByDueDate(todos, new Date()), hideEmpty)`.
  - `clasica`/`compacta` → `TicketList(todos, dense)`.
  - `tabla` → `TicketTable(todos)`.
- Abrir un ticket (clic) abre el `TicketDetailView` existente (igual en todas las vistas).

## API cliente (`src/api/client.ts`)
`fetchTickets(scope?: 'all')`: añade `?scope=all` cuando se pide todo.

## Pruebas
- **backend** (pg-mem): `getAllTickets` incluye cerrados (un ticket `Closed` aparece); endpoint `?scope=all`
  devuelve cerrados y sin `scope` no; el mapper expone `priority/statusType/dueDate/createdAt/channel/diasEntrega`.
- **frontend** (puro, `src/board.test.ts`): `groupByPriority` (High/Medium/Low/otra; Urgent→High) y
  `groupByDueDate(tickets, now)` (los 5 buckets según un `now` fijo).

## Fuera de alcance (futuro)
"Modo de tipo de cliente"; ordenar/elegir/persistir columnas de la tabla; acciones masivas (checkboxes);
vistas guardadas personalizadas (Mis Tickets, etc.); conteo de comentarios; paginación (con ~190 tickets no
hace falta aún).
