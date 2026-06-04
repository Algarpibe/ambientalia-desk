# Subsistema Vistas (modos de visualización) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un selector de modo (estilo Zoho) con vistas de lista/tabla sobre TODOS los tickets y modos Kanban (estado/prioridad/cuenta regresiva); solo "Modo de estado" muestra activos.

**Architecture:** El backend gana `GET /api/tickets?scope=all` y `Ticket` se enriquece con campos opcionales; el front carga todos los tickets una vez y deriva cada modo en el cliente con funciones puras + componentes de render (Kanban genérico, lista, tabla). El modo se recuerda en localStorage.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-04-subsistema-vistas-modos-design.md`.

**Contexto:**
- `shared/types.ts` → `interface Ticket` (id, number, title, company, time, status, assignee?, urgent?, messages?, description?).
- `server/db/mappers.ts` → `rowToTicket(row, refs)`; `TicketRow` tiene `priority, status_type, due_date, created_time, channel, dias_entrega`.
- `server/db/repo.ts` → `getActiveTickets` (filtra `status_type <> 'Closed'`), `TicketWithRefs`. `server/app.ts` → `GET /api/tickets` (activos), bajo `app.use('/api/tickets', requireAuth(db))`.
- `src/board.ts` → `groupTicketsByColumn`, `visibleColumns`, `ColumnGroups = Record<string, Ticket[]>`. `shared/columns.ts` → `COLUMNS` (`{id,label,statuses}[]`).
- `src/App.tsx` (tablero), `src/components/TicketCard.tsx` (acepta el `Ticket` compartido), `src/boardSettings.ts` (`useHideEmptyColumns`), `src/api/client.ts` (`fetchTickets`, helper `json<T>`).
- `server/app.test.ts`: helpers `adminCookie()`, `appWith()`, `db`, `request`.

---

## Estructura de archivos
- Modify `shared/types.ts` — campos opcionales en `Ticket`.
- Modify `server/db/mappers.ts` (+ `mappers.test.ts`) — `rowToTicket` enriquecido.
- Modify `server/db/repo.ts` (+ `repo.test.ts`), `server/app.ts` (+ `app.test.ts`) — `getAllTickets` + `?scope=all`.
- Modify `src/board.ts` (+ `board.test.ts`) — `groupByPriority`, `groupByDueDate`, columnas.
- Create `src/viewSettings.ts`; Modify `src/api/client.ts` — modo + fetch con scope.
- Create `src/components/KanbanBoard.tsx`, `TicketList.tsx`, `TicketTable.tsx`, `ViewModeMenu.tsx`.
- Modify `src/App.tsx` — orquestación por modo.

---

## Task 1: `Ticket` enriquecido + `rowToTicket` (TDD)

**Files:** Modify `shared/types.ts`, `server/db/mappers.ts`; Create/Modify `server/db/mappers.test.ts`

- [ ] **Step 1: En `shared/types.ts`**, dentro de `interface Ticket`, tras `description?: string`, añade:
```ts
  priority?: string | null
  statusType?: string | null
  dueDate?: string | null
  createdAt?: string | null
  channel?: string | null
  diasEntrega?: string | null
```

- [ ] **Step 2: Crear/añadir el test.** Si `server/db/mappers.test.ts` NO existe, créalo con:
```ts
import { describe, it, expect } from 'vitest'
import { rowToTicket } from './mappers'

describe('rowToTicket (campos enriquecidos)', () => {
  it('expone priority/statusType/dueDate/createdAt/channel/diasEntrega', () => {
    const row = {
      id: 't1', number: 5, subject: 'S', status: 'Ingresado', status_type: 'Open',
      priority: 'High', due_date: '2026-06-10', created_time: '2026-06-01T10:00:00Z',
      channel: 'Email', dias_entrega: '5',
    } as any
    const t = rowToTicket(row, { accountName: 'ACME', agentName: 'Ana' })
    expect(t).toMatchObject({
      priority: 'High', statusType: 'Open', dueDate: '2026-06-10',
      createdAt: '2026-06-01T10:00:00Z', channel: 'Email', diasEntrega: '5',
    })
  })
})
```
Si YA existe, añade ese `describe` al archivo (con el import de `rowToTicket` si falta).

- [ ] **Step 3: Ejecutar y ver fallar** — `npx vitest run server/db/mappers.test.ts` → FAIL.

- [ ] **Step 4: En `server/db/mappers.ts`**, en `rowToTicket`, añade los campos al objeto devuelto (tras `urgent: ...`):
```ts
    urgent: row.priority === 'High' || row.priority === 'Urgent',
    priority: row.priority ?? null,
    statusType: row.status_type ?? null,
    dueDate: row.due_date ?? null,
    createdAt: row.created_time ?? null,
    channel: row.channel ?? null,
    diasEntrega: row.dias_entrega ?? null,
```

- [ ] **Step 5: Ejecutar** — `npx vitest run server/db/mappers.test.ts` → PASS.

- [ ] **Step 6: Commit**
```bash
git add shared/types.ts server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat(vistas): enriquecer Ticket + rowToTicket (priority/statusType/dueDate/createdAt/channel/diasEntrega)"
```

---

## Task 2: `getAllTickets` + endpoint `?scope=all` (TDD)

**Files:** Modify `server/db/repo.ts`, `server/db/repo.test.ts`, `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/db/repo.test.ts`** añade (importa `getAllTickets` junto a `getActiveTickets` en el import existente de `./repo`):
```ts
describe('getAllTickets', () => {
  it('incluye cerrados; getActiveTickets no', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a',1,'A','Ingresado','Open',now())")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('b',2,'B','Finalizado','Closed',now())")
    expect((await getActiveTickets(db)).length).toBe(1)
    expect((await getAllTickets(db)).length).toBe(2)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar** — `npx vitest run server/db/repo.test.ts` → FAIL.

- [ ] **Step 3: En `server/db/repo.ts`**, tras `getActiveTickets`, añade:
```ts
export async function getAllTickets(db: Queryable): Promise<TicketWithRefs[]> {
  const r = await db.query(
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name
     FROM tickets t LEFT JOIN accounts a ON t.account_id=a.id LEFT JOIN agents g ON t.assignee_id=g.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     ORDER BY t.created_time DESC NULLS LAST`,
  )
  return r.rows.map((row: any) => ({ row: row as TicketRow, refs: { accountName: row.account_name, agentName: row.agent_name } }))
}
```

- [ ] **Step 4: Ejecutar** — `npx vitest run server/db/repo.test.ts` → PASS.

- [ ] **Step 5: En `server/app.test.ts`** añade un test:
```ts
describe('GET /api/tickets?scope=all', () => {
  it('scope=all incluye cerrados; sin scope solo activos; campos enriquecidos', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,priority,due_date,created_time,channel,dias_entrega) VALUES ('a',1,'A','Ingresado','Open','High','2026-06-10',now(),'Email','5')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('b',2,'B','Finalizado','Closed',now())")
    const { app } = appWith()
    const active = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(active.body.map((t: any) => t.number)).toEqual(['#1'])
    const all = await request(app).get('/api/tickets?scope=all').set('Cookie', cookie)
    expect(all.body.length).toBe(2)
    expect(all.body.find((t: any) => t.number === '#1')).toMatchObject({ priority: 'High', statusType: 'Open', channel: 'Email', diasEntrega: '5' })
  })
})
```

- [ ] **Step 6: En `server/app.ts`** añade `getAllTickets` al import de `./db/repo` y reemplaza el handler `app.get('/api/tickets', ...)` (el de la lista) por:
```ts
  app.get('/api/tickets', async (req, res) => {
    try {
      const list = req.query.scope === 'all' ? await getAllTickets(db) : await getActiveTickets(db)
      res.json(list.map(({ row, refs }) => rowToTicket(row, refs)))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 7: Ejecutar suite backend + typecheck**
Run: `npx vitest run server/app.test.ts server/db/repo.test.ts && npx tsc -p tsconfig.server.json --noEmit`
Expected: PASS + limpio.

- [ ] **Step 8: Commit**
```bash
git add server/db/repo.ts server/db/repo.test.ts server/app.ts server/app.test.ts
git commit -m "feat(vistas): getAllTickets + GET /api/tickets?scope=all (todos los tickets)"
```

---

## Task 3: Agrupaciones por prioridad y vencimiento (TDD puro)

**Files:** Modify `src/board.ts`, `src/board.test.ts`

- [ ] **Step 1: En `src/board.test.ts`** añade imports + tests (junto a los existentes):
```ts
import { groupTicketsByColumn, visibleColumns, groupByPriority, groupByDueDate } from './board'

const mk = (id: string, extra: Partial<Ticket>): Ticket => ({ id, number: `#${id}`, title: '', company: '', time: '', status: 'X', ...extra })

describe('groupByPriority', () => {
  it('agrupa High/Medium/Low/otra (Urgent→High)', () => {
    const g = groupByPriority([mk('1', { priority: 'High' }), mk('2', { priority: 'Urgent' }), mk('3', { priority: 'Medium' }), mk('4', { priority: 'Low' }), mk('5', { priority: null })])
    expect(g.High.map((x) => x.id)).toEqual(['1', '2'])
    expect(g.Medium.map((x) => x.id)).toEqual(['3'])
    expect(g.Low.map((x) => x.id)).toEqual(['4'])
    expect(g.otra.map((x) => x.id)).toEqual(['5'])
  })
})

describe('groupByDueDate', () => {
  it('buckets por vencimiento respecto a now', () => {
    const now = new Date(2026, 5, 4, 12, 0, 0)
    const g = groupByDueDate([
      mk('v', { dueDate: '2026-06-01' }),
      mk('h', { dueDate: new Date(2026, 5, 4, 18).toISOString() }),
      mk('s', { dueDate: new Date(2026, 5, 7).toISOString() }),
      mk('a', { dueDate: new Date(2026, 5, 20).toISOString() }),
      mk('n', { dueDate: null }),
    ], now)
    expect(g.vencidos.map((x) => x.id)).toEqual(['v'])
    expect(g.hoy.map((x) => x.id)).toEqual(['h'])
    expect(g.semana.map((x) => x.id)).toEqual(['s'])
    expect(g.adelante.map((x) => x.id)).toEqual(['a'])
    expect(g.sinfecha.map((x) => x.id)).toEqual(['n'])
  })
})
```
(El import de `Ticket` ya está en el archivo: `import type { Ticket } from '../shared/types'`.)

- [ ] **Step 2: Ejecutar y ver fallar** — `npx vitest run src/board.test.ts` → FAIL.

- [ ] **Step 3: En `src/board.ts`** añade al final:
```ts
export const PRIORITY_COLUMNS = [
  { id: 'High', label: 'High' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Low', label: 'Low' },
  { id: 'otra', label: 'Otra prioridad' },
] as const

export function groupByPriority(tickets: Ticket[]): ColumnGroups {
  const groups: ColumnGroups = { High: [], Medium: [], Low: [], otra: [] }
  for (const t of tickets) {
    const p = t.priority
    if (p === 'High' || p === 'Urgent') groups.High.push(t)
    else if (p === 'Medium') groups.Medium.push(t)
    else if (p === 'Low') groups.Low.push(t)
    else groups.otra.push(t)
  }
  return groups
}

export const DUEDATE_COLUMNS = [
  { id: 'vencidos', label: 'Vencidos' },
  { id: 'hoy', label: 'Vence hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'adelante', label: 'Más adelante' },
  { id: 'sinfecha', label: 'Sin fecha' },
] as const

export function groupByDueDate(tickets: Ticket[], now: Date): ColumnGroups {
  const groups: ColumnGroups = { vencidos: [], hoy: [], semana: [], adelante: [], sinfecha: [] }
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endToday = startToday + 24 * 3600 * 1000
  const endWeek = startToday + 7 * 24 * 3600 * 1000
  const t0 = now.getTime()
  for (const t of tickets) {
    if (!t.dueDate) { groups.sinfecha.push(t); continue }
    const d = new Date(t.dueDate).getTime()
    if (Number.isNaN(d)) { groups.sinfecha.push(t); continue }
    if (d < t0) groups.vencidos.push(t)
    else if (d < endToday) groups.hoy.push(t)
    else if (d < endWeek) groups.semana.push(t)
    else groups.adelante.push(t)
  }
  return groups
}
```

- [ ] **Step 4: Ejecutar** — `npx vitest run src/board.test.ts` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/board.ts src/board.test.ts
git commit -m "feat(vistas): groupByPriority + groupByDueDate (+ columnas) puras"
```

---

## Task 4: Persistencia del modo + fetch con scope

**Files:** Create `src/viewSettings.ts`; Modify `src/api/client.ts`

- [ ] **Step 1: Crear `src/viewSettings.ts`:**
```ts
import { useEffect, useState } from 'react'

export type ViewMode = 'estado' | 'prioridad' | 'cuenta-regresiva' | 'clasica' | 'compacta' | 'tabla'
const KEY = 'view.mode'
const EVENT = 'view-settings'
const VALID: ViewMode[] = ['estado', 'prioridad', 'cuenta-regresiva', 'clasica', 'compacta', 'tabla']

export function getViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(KEY) as ViewMode | null
    return v && VALID.includes(v) ? v : 'estado'
  } catch {
    return 'estado'
  }
}

export function setViewMode(m: ViewMode): void {
  try { localStorage.setItem(KEY, m) } catch { /* sin localStorage */ }
  window.dispatchEvent(new Event(EVENT))
}

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState(getViewMode)
  useEffect(() => {
    const refresh = () => setMode(getViewMode())
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return [mode, setViewMode]
}
```

- [ ] **Step 2: En `src/api/client.ts`** reemplaza `fetchTickets` por:
```ts
export function fetchTickets(scope?: 'all'): Promise<Ticket[]> {
  const qs = scope === 'all' ? '?scope=all' : ''
  return fetch(`/api/tickets${qs}`, { credentials: 'include' }).then((r) => json<Ticket[]>(r))
}
```

- [ ] **Step 3: Typecheck cliente** — `npx tsc -b` → sin errores.

- [ ] **Step 4: Commit**
```bash
git add src/viewSettings.ts src/api/client.ts
git commit -m "feat(vistas): viewSettings (modo en localStorage) + fetchTickets(scope)"
```

---

## Task 5: Kanban genérico (`KanbanBoard.tsx`)

**Files:** Create `src/components/KanbanBoard.tsx`

- [ ] **Step 1: Crear `src/components/KanbanBoard.tsx`:**
```tsx
import type { Ticket } from '../../shared/types'
import { TicketCard } from './TicketCard'
import { visibleColumns } from '../board'

export function KanbanBoard({ columns, groups, hideEmpty, loading, onSelect }: {
  columns: readonly { id: string; label: string }[]
  groups: Record<string, Ticket[]>
  hideEmpty: boolean
  loading: boolean
  onSelect: (id: string) => void
}) {
  const counts = Object.fromEntries(columns.map((c) => [c.id, groups[c.id]?.length ?? 0]))
  return (
    <main className="flex-1 flex overflow-x-auto p-3 gap-2 bg-[#E9EDF2] dark:bg-slate-950">
      {visibleColumns(columns, counts, hideEmpty).map((column) => {
        const colTickets = groups[column.id] ?? []
        return (
          <section key={column.id} className="w-[280px] min-w-[280px] flex flex-col">
            <div className="px-1 py-2 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{column.label} ({colTickets.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 hide-scrollbar">
              {loading && <div className="h-20 rounded-lg bg-slate-200/60 animate-pulse" />}
              {!loading && colTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onClick={() => onSelect(ticket.id)} />
              ))}
              {!loading && colTickets.length === 0 && (
                <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center opacity-40">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Sin Tickets</span>
                </div>
              )}
            </div>
          </section>
        )
      })}
    </main>
  )
}
```

- [ ] **Step 2: Typecheck** — `npx tsc -b` → sin errores (aún no se usa; sin errores de tipos).

- [ ] **Step 3: Commit**
```bash
git add src/components/KanbanBoard.tsx
git commit -m "feat(vistas): KanbanBoard genérico (columnas + grupos, reusa TicketCard)"
```

---

## Task 6: Vistas de lista y tabla (`TicketList.tsx`, `TicketTable.tsx`)

**Files:** Create `src/components/TicketList.tsx`, `src/components/TicketTable.tsx`

- [ ] **Step 1: Crear `src/components/TicketList.tsx`:**
```tsx
import type { Ticket } from '../../shared/types'

function StatusBadge({ status }: { status: string }) {
  return <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">{status}</span>
}

export function TicketList({ tickets, dense, onSelect }: { tickets: Ticket[]; dense?: boolean; onSelect: (id: string) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-white">
      <ul className="divide-y divide-slate-100">
        {tickets.map((t) => (
          <li key={t.id}>
            <button onClick={() => onSelect(t.id)} className={`w-full text-left flex items-center gap-3 hover:bg-slate-50 ${dense ? 'px-4 py-1.5' : 'px-4 py-3'}`}>
              <span className="material-symbols-outlined text-[18px] text-slate-300 shrink-0">mail</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-slate-800 truncate ${dense ? 'text-[12px]' : 'text-[13px]'}`}>{t.title}</div>
                {!dense && (
                  <div className="text-[11px] text-slate-500 truncate">
                    <span className="font-bold text-slate-400">{t.number}</span> · {t.assignee?.name} · {t.company} · {t.time}
                  </div>
                )}
              </div>
              {dense && <span className="text-[11px] text-slate-400 shrink-0">{t.number}</span>}
              <StatusBadge status={t.status} />
            </button>
          </li>
        ))}
        {tickets.length === 0 && <li className="px-4 py-6 text-[13px] text-slate-400">Sin tickets.</li>}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Crear `src/components/TicketTable.tsx`:**
```tsx
import type { Ticket } from '../../shared/types'

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const COLS = ['#', 'Asunto', 'Cliente', 'Estado', 'Prioridad', 'Propietario', 'Creado', 'Vencimiento', 'Días entrega', 'Canal']

export function TicketTable({ tickets, onSelect }: { tickets: Ticket[]; onSelect: (id: string) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full text-[12px]">
        <thead className="sticky top-0 bg-slate-50 text-slate-500 uppercase text-[11px]">
          <tr className="text-left border-b border-slate-200">
            {COLS.map((c) => <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} onClick={() => onSelect(t.id)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
              <td className="px-3 py-2 font-bold text-slate-400 whitespace-nowrap">{t.number}</td>
              <td className="px-3 py-2 text-slate-800 max-w-[360px] truncate">{t.title}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.company}</td>
              <td className="px-3 py-2 whitespace-nowrap"><span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">{t.status}</span></td>
              <td className="px-3 py-2 text-slate-600">{t.priority ?? '—'}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.assignee?.name ?? '—'}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{fmtDate(t.dueDate)}</td>
              <td className="px-3 py-2 text-slate-600">{t.diasEntrega ?? '—'}</td>
              <td className="px-3 py-2 text-slate-600">{t.channel ?? '—'}</td>
            </tr>
          ))}
          {tickets.length === 0 && <tr><td colSpan={COLS.length} className="px-3 py-6 text-slate-400">Sin tickets.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck** — `npx tsc -b` → sin errores.

- [ ] **Step 4: Commit**
```bash
git add src/components/TicketList.tsx src/components/TicketTable.tsx
git commit -m "feat(vistas): TicketList (clásica/compacta) + TicketTable"
```

---

## Task 7: Selector de modo (`ViewModeMenu.tsx`)

**Files:** Create `src/components/ViewModeMenu.tsx`

- [ ] **Step 1: Crear `src/components/ViewModeMenu.tsx`:**
```tsx
import { useState } from 'react'
import type { ViewMode } from '../viewSettings'

const VISTAS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'clasica', label: 'Vista clásica', icon: 'view_agenda' },
  { id: 'compacta', label: 'Vista compacta', icon: 'view_headline' },
  { id: 'tabla', label: 'Vista de tabla', icon: 'table_rows' },
]
const MODOS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'estado', label: 'Modo de estado', icon: 'flag' },
  { id: 'prioridad', label: 'Modo de prioridad', icon: 'priority_high' },
  { id: 'cuenta-regresiva', label: 'Modo de cuenta regresiva', icon: 'timer' },
]
const ALL = [...VISTAS, ...MODOS]

function MenuItem({ item, active, onPick }: { item: { label: string; icon: string }; active: boolean; onPick: () => void }) {
  return (
    <button onClick={onPick} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50">
      <span className="material-symbols-outlined text-[18px] text-slate-400">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {active && <span className="material-symbols-outlined text-[18px] text-blue-600">check</span>}
    </button>
  )
}

export function ViewModeMenu({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const [open, setOpen] = useState(false)
  const current = ALL.find((x) => x.id === mode) ?? MODOS[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 border border-slate-200 rounded px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50">
        <span className="material-symbols-outlined text-[18px] text-slate-400">{current.icon}</span>
        {current.label}
        <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-[250px] bg-white border border-slate-200 rounded-md shadow-lg z-[61] py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vistas</div>
            {VISTAS.map((v) => <MenuItem key={v.id} item={v} active={mode === v.id} onPick={() => { onChange(v.id); setOpen(false) }} />)}
            <div className="px-3 py-1 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-t border-slate-100">Modos de trabajo</div>
            {MODOS.map((v) => <MenuItem key={v.id} item={v} active={mode === v.id} onPick={() => { onChange(v.id); setOpen(false) }} />)}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck** — `npx tsc -b` → sin errores.

- [ ] **Step 3: Commit**
```bash
git add src/components/ViewModeMenu.tsx
git commit -m "feat(vistas): ViewModeMenu (selector de modo estilo Zoho)"
```

---

## Task 8: Orquestación en `App.tsx`

**Files:** Modify `src/App.tsx`

- [ ] **Step 1: Imports.** Reemplaza el import de `./board` y añade los nuevos (junto a los otros imports):
```tsx
import { groupTicketsByColumn, groupByPriority, groupByDueDate, PRIORITY_COLUMNS, DUEDATE_COLUMNS } from './board';
import { useHideEmptyColumns } from './boardSettings';
import { useViewMode } from './viewSettings';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketList } from './components/TicketList';
import { TicketTable } from './components/TicketTable';
import { ViewModeMenu } from './components/ViewModeMenu';
```
(Quita el import de `visibleColumns` si quedó suelto en `./board` — ya no se usa directo en App; lo usa KanbanBoard.)

- [ ] **Step 2: Datos derivados.** Reemplaza el bloque:
```tsx
  const hideEmpty = useHideEmptyColumns()
  const { data: tickets, loading, error, reload } = useAsync(fetchTickets, [user?.id]);
  const groups = groupTicketsByColumn(tickets ?? []);
  const counts = Object.fromEntries(COLUMNS.map((c) => [c.id, groups[c.id]?.length ?? 0]));
```
por:
```tsx
  const hideEmpty = useHideEmptyColumns()
  const [mode, setMode] = useViewMode()
  const { data: tickets, loading, error, reload } = useAsync(() => fetchTickets('all'), [user?.id]);
  const all = tickets ?? [];
  const activos = all.filter((t) => t.statusType !== 'Closed');
```

- [ ] **Step 3: Cabecera.** Reemplaza el botón "Nuevo ticket" (hijo derecho de la barra) por el grupo con el selector:
```tsx
            <div className="flex items-center gap-2">
              <ViewModeMenu mode={mode} onChange={setMode} />
              <button onClick={() => setShowCreate(true)} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo ticket</button>
            </div>
```

- [ ] **Step 4: Render por modo.** Reemplaza TODO el bloque `<main className="flex-1 flex overflow-x-auto ...">…</main>` por:
```tsx
          {mode === 'estado' && (
            <KanbanBoard columns={COLUMNS} groups={groupTicketsByColumn(activos)} hideEmpty={hideEmpty} loading={loading} onSelect={setSelectedTicketId} />
          )}
          {mode === 'prioridad' && (
            <KanbanBoard columns={PRIORITY_COLUMNS} groups={groupByPriority(all)} hideEmpty={hideEmpty} loading={loading} onSelect={setSelectedTicketId} />
          )}
          {mode === 'cuenta-regresiva' && (
            <KanbanBoard columns={DUEDATE_COLUMNS} groups={groupByDueDate(all, new Date())} hideEmpty={hideEmpty} loading={loading} onSelect={setSelectedTicketId} />
          )}
          {(mode === 'clasica' || mode === 'compacta') && (
            <TicketList tickets={all} dense={mode === 'compacta'} onSelect={setSelectedTicketId} />
          )}
          {mode === 'tabla' && (
            <TicketTable tickets={all} onSelect={setSelectedTicketId} />
          )}
```

- [ ] **Step 5: Typecheck + build** — `npx tsc -b && npx vite build` → sin errores; build OK.

- [ ] **Step 6: Commit**
```bash
git add src/App.tsx
git commit -m "feat(vistas): App orquesta los 6 modos (Kanban estado/prioridad/cuenta regresiva + lista/compacta/tabla)"
```

---

## Task 9: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. En el tablero, el **selector de modo** (arriba-derecha): cambia entre Vista clásica / compacta / tabla y Modos de estado / prioridad / cuenta regresiva. El modo se recuerda al recargar.
2. **Modo de estado**: solo activos (no Finalizados), por estado del Blueprint; respeta "ocultar columnas vacías".
3. **Vista de tabla / lista**: muestran **todos** los tickets (incluidos Finalizados) — debería verse ~190.
4. **Modo de prioridad / cuenta regresiva**: agrupan todos por prioridad / vencimiento.
5. Abrir cualquier ticket (clic) abre el detalle en todas las vistas.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(vistas): subsistema Vistas verificado"
```

---

## Notas de cierre
- **Solo "Modo de estado" = activos**; el resto = todos los tickets.
- El modo se recuerda por navegador; respeta "ocultar columnas vacías" en los Kanban.
- **Siguiente**: ordenar/elegir columnas de la tabla, acciones masivas, vistas guardadas, "Modo de tipo de cliente".
