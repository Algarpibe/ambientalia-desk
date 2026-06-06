# Vista global de Actividades (tab "Actividades") — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El tab "Actividades" del Header abre una vista global de todas las tareas (Todas/Abiertas/Vencidas + búsqueda), cada fila con su ticket; clic abre el ticket.

**Architecture:** `getAllActivities` (join `activities`→`tickets`/`agents`) + `GET /api/activities?filter=&search=&limit=` + `ActividadesPage` (overlay) con sidebar de vistas y lista; util compartido de traducción reutilizado por la pestaña por-ticket.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest + supertest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-actividades-vista-global-design.md`.

**Contexto del repo:**
- `activities (id, ticket_id, subject, status, status_type, priority, due_date, created_time, modified_time, owner_id, owner_name, raw)`. `tickets.number`. `agents (id, name)`.
- `server/db/activities.ts`: ya tiene `getActivities(db, ticketId)`. `server/app.ts` importa `import { getActivities } from './db/activities'` y tiene `GET /api/tickets/:id/activities` (bajo la auth de `/api/tickets`). `app.test.ts`: `adminCookie()`, `appWith()`, `db`, `request`.
- `src/components/ActividadesPanel.tsx` tiene inline: `ESTADOS`/`traducirEstado`, `PRIORIDADES`/`traducirPrioridad`, `statusClass(a)`. Se extraen a un util compartido.
- `src/components/Header.tsx`: `NAV_TABS` con `{ label: 'Actividades' }`; el `.map` ya da onClick a 'Análisis' (admin) y 'Clientes'; usa `useAuth`; props `onOpenAnalisis`, `onOpenClientes`, etc. `src/App.tsx` orquesta overlays + `setSelectedTicketId`.

---

## Estructura de archivos
- Modify `shared/types.ts` — `ActivityListItem`.
- Create `src/lib/actividades.ts` (+ `.test.ts`); Modify `src/components/ActividadesPanel.tsx` — util compartido + refactor.
- Modify `server/db/activities.ts` (+ `activities.test.ts`) — `getAllActivities`.
- Modify `server/app.ts` (+ `app.test.ts`) — `GET /api/activities`.
- Modify `src/api/client.ts`; Create `src/components/ActividadesPage.tsx`; Modify `src/components/Header.tsx`, `src/App.tsx`.

---

## Task 1: Tipo `ActivityListItem`

**Files:** Modify `shared/types.ts`

- [ ] **Step 1: Añadir al final de `shared/types.ts`:**
```ts
export interface ActivityListItem { id: string; subject: string; status: string; statusType: string | null; priority: string | null; dueDate: string | null; owner: string | null; ticketId: string | null; ticketNumber: string | null }
```

- [ ] **Step 2:** Run `npx tsc -p tsconfig.server.json --noEmit && npx tsc -b` — Expected: sin errores.

- [ ] **Step 3: Commit**
```bash
git add shared/types.ts
git commit -m "feat(actividades-global): tipo ActivityListItem"
```

---

## Task 2: Util compartido `src/lib/actividades.ts` + refactor ActividadesPanel (TDD)

**Files:** Create `src/lib/actividades.ts`, `src/lib/actividades.test.ts`; Modify `src/components/ActividadesPanel.tsx`

- [ ] **Step 1: Escribir `src/lib/actividades.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { traducirEstado, traducirPrioridad, estadoBadgeClass } from './actividades'

describe('actividades util', () => {
  it('traduce estados/prioridades + fallback', () => {
    expect(traducirEstado('In Progress')).toBe('En proceso')
    expect(traducirEstado(null)).toBe('—')
    expect(traducirEstado('Custom X')).toBe('Custom X')
    expect(traducirPrioridad('High')).toBe('Alta')
    expect(traducirPrioridad(null)).toBe('')
  })
  it('badge por estado/tipo', () => {
    expect(estadoBadgeClass('Completed', 'Closed')).toContain('green')
    expect(estadoBadgeClass('In Progress', 'Open')).toContain('blue')
    expect(estadoBadgeClass('Waiting on someone else', 'Open')).toContain('amber')
    expect(estadoBadgeClass('Not Started', 'Open')).toContain('slate')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/actividades.test.ts` — confirm FAIL.

- [ ] **Step 3: Crear `src/lib/actividades.ts`**
```ts
const ESTADOS: Record<string, string> = {
  'not started': 'No iniciada',
  'in progress': 'En proceso',
  'waiting on someone else': 'En espera',
  waiting: 'En espera',
  deferred: 'Aplazada',
  completed: 'Completada',
}
export function traducirEstado(s: string | null): string {
  if (!s) return '—'
  return ESTADOS[s.trim().toLowerCase()] ?? s
}

const PRIORIDADES: Record<string, string> = { highest: 'Muy alta', high: 'Alta', normal: 'Normal', low: 'Baja', lowest: 'Muy baja' }
export function traducirPrioridad(p: string | null): string {
  if (!p) return ''
  return PRIORIDADES[p.trim().toLowerCase()] ?? p
}

export function estadoBadgeClass(status: string | null, statusType: string | null): string {
  const t = (status ?? '').toLowerCase()
  if (statusType === 'Closed' || t.includes('complet')) return 'bg-green-50 text-green-600 border-green-200'
  if (t.includes('progress') || t.includes('proceso')) return 'bg-blue-50 text-blue-600 border-blue-200'
  if (t.includes('wait') || t.includes('espera')) return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-slate-50 text-slate-500 border-slate-200'
}
```

- [ ] **Step 4:** Run `npx vitest run src/lib/actividades.test.ts` — confirm PASS.

- [ ] **Step 5: Refactor `src/components/ActividadesPanel.tsx`** para usar el util:
  - Elimina las definiciones inline `const ESTADOS …`, `function traducirEstado …`, `const PRIORIDADES …`, `function traducirPrioridad …`, y `function statusClass …`.
  - Añade el import: `import { traducirEstado, traducirPrioridad, estadoBadgeClass } from '../lib/actividades'`.
  - Donde se use `statusClass(a)`, reemplaza por `estadoBadgeClass(a.status, a.statusType)`.
  - Conserva `fmtDate` (es local del panel) y el resto del componente igual.

- [ ] **Step 6:** Run `npx tsc -b && npx eslint src/lib/actividades.ts src/components/ActividadesPanel.tsx` — Expected: sin errores; eslint 0.

- [ ] **Step 7: Commit**
```bash
git add src/lib/actividades.ts src/lib/actividades.test.ts src/components/ActividadesPanel.tsx
git commit -m "refactor(actividades): util compartido traducirEstado/Prioridad + estadoBadgeClass"
```

---

## Task 3: Repo `getAllActivities` (TDD pg-mem)

**Files:** Modify `server/db/activities.ts`, `server/db/activities.test.ts`

- [ ] **Step 1: En `server/db/activities.test.ts`** añade (importa `getAllActivities` desde `./activities`):
```ts
describe('getAllActivities', () => {
  it('lista con ticketNumber + owner; filtros abiertas/vencidas; search', async () => {
    await db.query("INSERT INTO agents (id,name,source) VALUES ('g1','Ana','zoho')")
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',55,'T','Ingresado')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,priority,due_date,created_time,owner_id) VALUES ('a1','t1','Informe','In Progress','Open','High','2026-12-31T00:00:00Z','2026-01-01T00:00:00Z','g1')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,due_date,created_time) VALUES ('a2','t1','Cerrada','Completed','Closed','2020-01-01T00:00:00Z','2020-01-01T00:00:00Z')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,due_date,created_time) VALUES ('a3','t1','Vieja abierta','Not Started','Open','2020-01-01T00:00:00Z','2019-01-01T00:00:00Z')")
    const all = await getAllActivities(db, { filter: 'todas', search: '', limit: 100 })
    expect(all).toHaveLength(3)
    expect(all.find((x) => x.id === 'a1')).toMatchObject({ subject: 'Informe', owner: 'Ana', ticketNumber: '#55', priority: 'High' })
    expect((await getAllActivities(db, { filter: 'abiertas', search: '', limit: 100 })).map((x) => x.id).sort()).toEqual(['a1', 'a3'])
    expect((await getAllActivities(db, { filter: 'vencidas', search: '', limit: 100 })).map((x) => x.id)).toEqual(['a3'])
    expect((await getAllActivities(db, { filter: 'todas', search: 'informe', limit: 100 })).map((x) => x.id)).toEqual(['a1'])
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/activities.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/db/activities.ts`** añade `ActivityListItem` al import de tipos (`../../shared/types`) y la función:
```ts
export async function getAllActivities(db: Queryable, opts: { filter: string; search: string; limit: number }): Promise<ActivityListItem[]> {
  const where: string[] = []
  const params: unknown[] = []
  if (opts.filter === 'abiertas') where.push("a.status_type <> 'Closed'")
  else if (opts.filter === 'vencidas') where.push("a.status_type <> 'Closed' AND a.due_date < now()")
  if (opts.search) { params.push(`%${opts.search}%`); where.push(`LOWER(a.subject) LIKE LOWER($${params.length})`) }
  params.push(opts.limit)
  const sql =
    `SELECT a.id, a.subject, a.status, a.status_type, a.priority, a.due_date, a.owner_name, a.ticket_id,
            t.number AS ticket_number, g.name AS agent_name
     FROM activities a
     LEFT JOIN tickets t ON a.ticket_id=t.id
     LEFT JOIN agents g ON a.owner_id=g.id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY COALESCE(a.due_date, a.created_time) DESC NULLS LAST
     LIMIT $${params.length}`
  const r = await db.query(sql, params)
  return (r.rows as any[]).map((x) => ({
    id: x.id, subject: x.subject ?? '', status: x.status ?? '', statusType: x.status_type ?? null,
    priority: x.priority ?? null, dueDate: x.due_date ?? null,
    owner: x.owner_name ?? x.agent_name ?? null,
    ticketId: x.ticket_id ?? null, ticketNumber: x.ticket_number != null ? `#${x.ticket_number}` : null,
  }))
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/activities.test.ts` — confirm PASS. (Si pg-mem tropieza con `now()` o el `LIMIT $n`, reporta el error exacto; estos patrones se usan en el repo.)

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/db/activities.ts` — typecheck limpio; eslint 0 (WARNINGs `no-explicit-any` aceptables).

- [ ] **Step 6: Commit**
```bash
git add server/db/activities.ts server/db/activities.test.ts
git commit -m "feat(actividades-global): getAllActivities (filtros + search + join ticket/owner)"
```

---

## Task 4: Endpoint `GET /api/activities` (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts` añade un bloque:**
```ts
describe('GET /api/activities (global)', () => {
  it('lista (con sesión); 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',55,'T','Ingresado')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,created_time) VALUES ('a1','t1','Informe','In Progress','Open',now())")
    const { app } = appWith()
    const res = await request(app).get('/api/activities').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ subject: 'Informe', ticketNumber: '#55' })
    expect((await request(app).get('/api/activities')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`:**
  - Cambia el import a: `import { getActivities, getAllActivities } from './db/activities'`.
  - Añade la ruta (junto a `/api/contacts`/`/api/accounts`, fuera de `/api/tickets`):
```ts
  app.get('/api/activities', requireAuth(db), async (req, res) => {
    try {
      const filter = String(req.query.filter ?? 'todas')
      const search = String(req.query.search ?? '')
      const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 300))
      res.json(await getAllActivities(db, { filter, search, limit }))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts` — Expected: tests PASS; typecheck limpio; eslint 0.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(actividades-global): GET /api/activities (filtro + search + limit)"
```

---

## Task 5: Frontend — ActividadesPage + tab "Actividades"

**Files:** Modify `src/api/client.ts`; Create `src/components/ActividadesPage.tsx`; Modify `src/components/Header.tsx`, `src/App.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `ActivityListItem` al import de tipos y:
```ts
export function fetchAllActivities(filter: string, search: string): Promise<ActivityListItem[]> {
  const p = new URLSearchParams({ filter, search })
  return fetch(`/api/activities?${p.toString()}`, { credentials: 'include' }).then((r) => json<ActivityListItem[]>(r))
}
```

- [ ] **Step 2: Crear `src/components/ActividadesPage.tsx`** (verbatim):
```tsx
import { useState } from 'react'
import type { ActivityListItem } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchAllActivities } from '../api/client'
import { traducirEstado, traducirPrioridad, estadoBadgeClass } from '../lib/actividades'

function fmtFecha(s: string | null): string { if (!s) return ''; const d = new Date(s); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }

const VISTAS: { key: string; label: string }[] = [
  { key: 'todas', label: 'Todas las Actividades' },
  { key: 'abiertas', label: 'Abiertas' },
  { key: 'vencidas', label: 'Vencidas' },
]

export function ActividadesPage({ onClose, onSelectTicket }: { onClose: () => void; onSelectTicket: (id: string) => void }) {
  const [filter, setFilter] = useState('todas')
  const [q, setQ] = useState('')
  const { data, loading } = useAsync<ActivityListItem[]>(() => fetchAllActivities(filter, q), [filter, q])
  const items = data ?? []
  const vista = VISTAS.find((v) => v.key === filter)?.label ?? 'Actividades'

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Actividades</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[220px] border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 pt-3 text-[11px] font-bold text-slate-400">VISTAS CON ESTRELLAS</div>
          {VISTAS.map((v) => (
            <button key={v.key} onClick={() => setFilter(v.key)} className={`text-left px-4 py-2 text-[13px] ${filter === v.key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{v.label}</button>
          ))}
          <div className="mt-auto border-t border-slate-200 px-4 py-2 text-[12px] text-blue-600 font-bold">Tareas</div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-slate-200 px-4 py-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-amber-400">star</span>
            <h2 className="text-[14px] font-semibold text-slate-700">{vista}</h2>
            <span className="text-[12px] text-slate-400">{items.length}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="ml-auto border border-slate-200 rounded px-3 py-1 text-[13px] w-[260px]" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && !data && <div className="p-4 text-[13px] text-slate-400">Cargando…</div>}
            {!loading && items.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin actividades.</div>}
            {items.map((a) => (
              <button key={a.id} onClick={() => a.ticketId && onSelectTicket(a.ticketId)} className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                <span className="material-symbols-outlined text-slate-300 text-[20px]">task_alt</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-800 truncate">{a.subject}</div>
                  <div className="text-[11px] text-slate-400 truncate">{[a.ticketNumber, a.owner, traducirPrioridad(a.priority), fmtFecha(a.dueDate)].filter(Boolean).join(' · ')}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded border shrink-0 ${estadoBadgeClass(a.status, a.statusType)}`}>{traducirEstado(a.status)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: En `src/components/Header.tsx`:**
  - Añade `onOpenActividades: () => void` a las props de `Header` y destructúralo.
  - En el `onClick` del `.map` de `NAV_TABS`, añade la rama de "Actividades" (cualquier usuario). Por ejemplo:
```tsx
                            onClick={
                                tab.label === 'Análisis' && user?.isAdmin ? onOpenAnalisis
                                : tab.label === 'Clientes' ? onOpenClientes
                                : tab.label === 'Actividades' ? onOpenActividades
                                : undefined
                            }
```
  (Adapta a la forma exacta del `onClick` existente; conserva las ramas de Análisis/Clientes.)

- [ ] **Step 4: En `src/App.tsx`:**
  - `import { ActividadesPage } from './components/ActividadesPage'`.
  - `const [showActividades, setShowActividades] = useState(false)`.
  - Pasa `onOpenActividades={() => setShowActividades(true)}` al `<Header .../>`.
  - Junto a los otros overlays: `{showActividades && <ActividadesPage onClose={() => setShowActividades(false)} onSelectTicket={(id) => { setShowActividades(false); setSelectedTicketId(id) }} />}`.

- [ ] **Step 5:** Run `npx tsc -b && npx vite build && npx eslint src/components/ActividadesPage.tsx src/components/Header.tsx src/App.tsx src/api/client.ts` — Expected: sin errores de tipos; build OK; eslint 0.

- [ ] **Step 6: Commit**
```bash
git add src/api/client.ts src/components/ActividadesPage.tsx src/components/Header.tsx src/App.tsx
git commit -m "feat(actividades-global): ActividadesPage + tab 'Actividades' (vistas + búsqueda + abrir ticket)"
```

---

## Task 6: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Clic en el tab **"Actividades"** → lista de actividades recientes con `#ticket · responsable · prioridad · fecha` + estado en español.
2. Sidebar **Abiertas/Vencidas** filtra; el **buscador** filtra por título.
3. Clic en una actividad → cierra Actividades y abre el detalle del ticket.
4. Sin sesión, `GET /api/activities` responde 401.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(actividades-global): verificado"
```

---

## Notas de cierre
- **Recientes (limit 300) + búsqueda** server-side (el buscador re-consulta; se puede debouncear a futuro).
- **Vistas**: Todas/Abiertas/Vencidas (las "Mi…" requieren mapear usuario↔agente — futuro).
- **Solo Tareas**; Llamadas/Eventos fuera de v1.
