# Actividades (tareas) del ticket — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar en el detalle del ticket la pestaña "Actividades" con las tareas (Tasks) sincronizadas desde Zoho Desk a Postgres, en solo lectura, con las pestañas Conversaciones/Actividades funcionales.

**Architecture:** Tabla `activities` poblada por `syncActivities()` (paginado incremental por `-modifiedTime`, en background). `GET /api/tickets/:id/activities` lee de Postgres. El frontend introduce estado de pestaña activa y un `ActividadesPanel` de solo lectura.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-actividades-ticket-design.md`.

**Contexto del repo:**
- `server/db/schema.sql`: las tablas se crean con `CREATE TABLE IF NOT EXISTS …;` (comentarios en líneas propias — `migrate` parte por `;`). Ej. tabla `equipos` (líneas 155+).
- `server/db/rows.ts`: tipos de fila (`TicketRow`, etc.). `server/db/mappers.ts`: `*RowFromZoho` y `rowTo*`.
- `server/db/repo.ts`: `upsertConversation` muestra el patrón de upsert explícito; `getConversations` el de lectura.
- `server/sync.ts`: `createSync({ zohoFetch, db, config })` → objeto `Sync`; `readData(res)`, `PAGE_SIZE=100`, `config.departmentId`. `zohoFetch` va directo al REST de Zoho (acepta `sortBy=-modifiedTime` y `from/limit`).
- `server/app.ts`: `/api/tickets/:id/conversations` (línea ~126) bajo `app.use('/api/tickets', requireAuth(db))`. `app.test.ts` tiene `adminCookie()`, `appWith()`, `db`, `request`.
- `server/index.ts`: backfill de arranque (`countTickets().then(... backfillTickets())`) + `setInterval(syncRecent, config.syncIntervalMs)`.
- `src/components/TicketDetailView.tsx`: ya tiene `convCount`, `adjuntosCount`, y la nav con las pestañas (array de strings) + el área de conversaciones.

---

## Estructura de archivos
- Modify `server/db/schema.sql` — tabla `activities`.
- Modify `server/db/rows.ts` — `ActivityRow`.
- Modify `shared/types.ts` — `Activity`.
- Modify `server/db/mappers.ts` (+ `mappers.test.ts`) — `activityRowFromZoho`, `rowToActivity`.
- Create `server/db/activities.ts` (+ `.test.ts`) — `upsertActivity`, `getActivities`.
- Modify `server/sync.ts` (+ Create `server/sync.activities.test.ts`) — `syncActivities`.
- Modify `server/app.ts` (+ `app.test.ts`), `server/index.ts` — endpoint + wiring.
- Modify `src/api/client.ts`, `src/components/TicketDetailView.tsx`; Create `src/components/ActividadesPanel.tsx`.

---

## Task 1: Tabla `activities` + tipos

**Files:** Modify `server/db/schema.sql`, `server/db/rows.ts`, `shared/types.ts`

- [ ] **Step 1: Añadir al final de `server/db/schema.sql`:**
```sql
CREATE TABLE IF NOT EXISTS activities (
  id text PRIMARY KEY,
  ticket_id text,
  subject text,
  status text,
  status_type text,
  priority text,
  due_date timestamptz,
  created_time timestamptz,
  modified_time timestamptz,
  completed_time timestamptz,
  owner_id text,
  owner_name text,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activities_ticket ON activities (ticket_id);
```

- [ ] **Step 2: Añadir a `server/db/rows.ts`** (junto a los otros `*Row`):
```ts
export interface ActivityRow {
  id: string
  ticket_id: string | null
  subject: string | null
  status: string | null
  status_type: string | null
  priority: string | null
  due_date: string | null
  created_time: string | null
  modified_time: string | null
  completed_time: string | null
  owner_id: string | null
  owner_name: string | null
  raw: unknown
}
```

- [ ] **Step 3: Añadir a `shared/types.ts`** (al final):
```ts
export interface Activity {
  id: string
  ticketId: string | null
  subject: string
  status: string
  statusType: string | null
  priority: string | null
  dueDate: string | null
  createdAt: string | null
  completedAt: string | null
  owner: string | null
}
```

- [ ] **Step 4:** Run `npx tsc -p tsconfig.server.json --noEmit && npx tsc -b` — Expected: sin errores.

- [ ] **Step 5: Commit**
```bash
git add server/db/schema.sql server/db/rows.ts shared/types.ts
git commit -m "feat(actividades): tabla activities + ActivityRow + tipo Activity"
```

---

## Task 2: Mappers `activityRowFromZoho` / `rowToActivity` (TDD)

**Files:** Modify `server/db/mappers.ts`, `server/db/mappers.test.ts`

- [ ] **Step 1: Añadir a `server/db/mappers.test.ts`** (usa los imports existentes desde `./mappers`; añade `activityRowFromZoho, rowToActivity` a ese import):
```ts
describe('activityRowFromZoho / rowToActivity', () => {
  it('mapea una tarea de Zoho a ActivityRow (ticket_id, owner_name)', () => {
    const row = activityRowFromZoho({ id: 'a1', ticketId: 't1', subject: 'Informe', priority: 'High', status: 'In Progress', statusType: 'Open', dueDate: '2026-03-24T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', modifiedTime: '2026-03-21T00:00:00Z', ownerId: 'g1', assignee: { firstName: 'Ana', lastName: 'P' } } as any)
    expect(row).toMatchObject({ id: 'a1', ticket_id: 't1', subject: 'Informe', priority: 'High', status: 'In Progress', owner_id: 'g1', owner_name: 'Ana P' })
  })
  it('rowToActivity normaliza al tipo compartido (owner por owner_name o agent_name)', () => {
    expect(rowToActivity({ id: 'a1', ticket_id: 't1', subject: 'X', status: 'Completed', status_type: 'Closed', priority: 'Normal', due_date: null, created_time: null, completed_time: null, owner_name: null, agent_name: 'Beto' }))
      .toMatchObject({ id: 'a1', ticketId: 't1', subject: 'X', statusType: 'Closed', owner: 'Beto' })
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/mappers.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/db/mappers.ts`:**
  - Añade a los imports de tipos: `ActivityRow` desde `./rows` y `Activity` desde `../../shared/types` (si ya hay un import de `../../shared/types`, agrégale `Activity`).
  - Añade las funciones:
```ts
export function activityRowFromZoho(raw: any): ActivityRow {
  const owner = raw.assignee ?? raw.owner ?? null
  const ownerName = owner ? ([owner.firstName, owner.lastName].filter(Boolean).join(' ').trim() || null) : null
  return {
    id: raw.id, ticket_id: raw.ticketId ?? raw.ticket?.id ?? null,
    subject: raw.subject ?? null, status: raw.status ?? null, status_type: raw.statusType ?? null,
    priority: raw.priority ?? null, due_date: raw.dueDate ?? null, created_time: raw.createdTime ?? null,
    modified_time: raw.modifiedTime ?? null, completed_time: raw.completedTime ?? null,
    owner_id: raw.ownerId ?? null, owner_name: ownerName, raw,
  }
}

export function rowToActivity(row: any): Activity {
  return {
    id: row.id, ticketId: row.ticket_id ?? null, subject: row.subject ?? '',
    status: row.status ?? '', statusType: row.status_type ?? null, priority: row.priority ?? null,
    dueDate: row.due_date ?? null, createdAt: row.created_time ?? null, completedAt: row.completed_time ?? null,
    owner: row.owner_name ?? row.agent_name ?? null,
  }
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/mappers.test.ts` — confirm PASS.

- [ ] **Step 5: Commit**
```bash
git add server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat(actividades): activityRowFromZoho + rowToActivity"
```

---

## Task 3: Repo `upsertActivity` / `getActivities` (TDD pg-mem)

**Files:** Create `server/db/activities.ts`, `server/db/activities.test.ts`

- [ ] **Step 1: Escribir `server/db/activities.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertActivity, getActivities } from './activities'
import { activityRowFromZoho } from './mappers'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('activities repo', () => {
  it('upsert + getActivities filtra por ticket, ordena por due/created y resuelve owner', async () => {
    await db.query("INSERT INTO agents (id,name,source) VALUES ('g1','Ana P','zoho')")
    await upsertActivity(db, activityRowFromZoho({ id: 'a1', ticketId: 't1', subject: 'Vence después', dueDate: '2026-03-25T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', status: 'Not Started', ownerId: 'g1' }))
    await upsertActivity(db, activityRowFromZoho({ id: 'a2', ticketId: 't1', subject: 'Vence antes', dueDate: '2026-03-22T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', status: 'In Progress', assignee: { firstName: 'Beto', lastName: '' } }))
    await upsertActivity(db, activityRowFromZoho({ id: 'a3', ticketId: 't2', subject: 'Otro ticket', dueDate: '2026-03-21T00:00:00Z', status: 'Completed' }))
    const acts = await getActivities(db, 't1')
    expect(acts.map((a) => a.id)).toEqual(['a2', 'a1'])
    expect(acts[1].owner).toBe('Ana P')   // a1: owner_name null → resuelto por agents
    expect(acts[0].owner).toBe('Beto')     // a2: owner_name del assignee
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/activities.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `server/db/activities.ts`**
```ts
import type { Queryable } from './migrate'
import type { ActivityRow } from './rows'
import type { Activity } from '../../shared/types'
import { rowToActivity } from './mappers'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertActivity(db: Queryable, r: ActivityRow): Promise<void> {
  await db.query(
    `INSERT INTO activities (id,ticket_id,subject,status,status_type,priority,due_date,created_time,modified_time,completed_time,owner_id,owner_name,raw,synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
     ON CONFLICT (id) DO UPDATE SET ticket_id=EXCLUDED.ticket_id,subject=EXCLUDED.subject,status=EXCLUDED.status,
       status_type=EXCLUDED.status_type,priority=EXCLUDED.priority,due_date=EXCLUDED.due_date,created_time=EXCLUDED.created_time,
       modified_time=EXCLUDED.modified_time,completed_time=EXCLUDED.completed_time,owner_id=EXCLUDED.owner_id,
       owner_name=EXCLUDED.owner_name,raw=EXCLUDED.raw,synced_at=now()`,
    [r.id, r.ticket_id, r.subject, r.status, r.status_type, r.priority, r.due_date, r.created_time, r.modified_time, r.completed_time, r.owner_id, r.owner_name, J(r.raw)],
  )
}

export async function getActivities(db: Queryable, ticketId: string): Promise<Activity[]> {
  const res = await db.query(
    `SELECT a.*, g.name AS agent_name FROM activities a
     LEFT JOIN agents g ON a.owner_id=g.id
     WHERE a.ticket_id=$1 ORDER BY COALESCE(a.due_date, a.created_time) ASC NULLS LAST`,
    [ticketId],
  )
  return (res.rows as any[]).map(rowToActivity)
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/activities.test.ts` — confirm PASS.

- [ ] **Step 5: Commit**
```bash
git add server/db/activities.ts server/db/activities.test.ts
git commit -m "feat(actividades): upsertActivity + getActivities"
```

---

## Task 4: `syncActivities` (TDD con zohoFetch mock)

**Files:** Modify `server/sync.ts`; Create `server/sync.activities.test.ts`

- [ ] **Step 1: Escribir `server/sync.activities.test.ts`**
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

function task(id: string, ticketId: string, modifiedTime: string) {
  return { id, ticketId, subject: `T-${id}`, status: 'In Progress', statusType: 'Open', priority: 'High', dueDate: '2026-03-24T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', modifiedTime, assignee: { firstName: 'Ana', lastName: 'P' } }
}

describe('syncActivities', () => {
  it('pagina, hace upsert y devuelve el total', async () => {
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [task('1', 't1', '2026-05-02T00:00:00Z'), task('2', 't1', '2026-05-01T00:00:00Z')] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    const n = await sync.syncActivities()
    expect(n).toBe(2)
    const rows = (await db.query("SELECT id, ticket_id, owner_name FROM activities ORDER BY id")).rows
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ id: '1', ticket_id: 't1', owner_name: 'Ana P' })
    // la URL pedía /tasks con departmentId
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tasks?')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/sync.activities.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/sync.ts`:**
  - Añade a los imports: `upsertActivity` desde `./db/activities` y `activityRowFromZoho` desde `./db/mappers`.
  - Añade a la interfaz `Sync`: `syncActivities(): Promise<number>`.
  - Dentro del objeto que retorna `createSync` (junto a `syncConversations`), añade:
```ts
    async syncActivities(): Promise<number> {
      const wmRow = (await db.query('SELECT max(modified_time) AS m FROM activities')).rows[0]
      const watermark = wmRow?.m ? new Date(wmRow.m).getTime() : 0
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), include: 'tickets,assignee', sortBy: '-modifiedTime' })
        const res = await zohoFetch(`/tasks?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /tasks ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        let reachedOld = false
        for (const t of items) {
          await upsertActivity(db, activityRowFromZoho(t))
          total++
          const mt = t.modifiedTime ? new Date(t.modifiedTime).getTime() : 0
          if (watermark && mt <= watermark) reachedOld = true
        }
        if (reachedOld || items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
```

- [ ] **Step 4:** Run `npx vitest run server/sync.activities.test.ts` — confirm PASS.

- [ ] **Step 5: Commit**
```bash
git add server/sync.ts server/sync.activities.test.ts
git commit -m "feat(actividades): syncActivities (paginado incremental por -modifiedTime)"
```

---

## Task 5: Endpoint + wiring de sync (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`, `server/index.ts`

- [ ] **Step 1: En `server/app.test.ts`** añade un bloque:
```ts
describe('GET /api/tickets/:id/activities', () => {
  it('devuelve las actividades del ticket; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,due_date) VALUES ('a1','t1','Informe','In Progress','2026-03-24T00:00:00Z')")
    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/activities').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'a1', subject: 'Informe', status: 'In Progress' })
    expect((await request(app).get('/api/tickets/t1/activities')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`:**
  - Import: `import { getActivities } from './db/activities'`.
  - Junto a la ruta de conversaciones, añade (queda bajo `app.use('/api/tickets', requireAuth(db))`):
```ts
  app.get('/api/tickets/:id/activities', async (req, res) => {
    try {
      res.json(await getActivities(db, String(req.params.id)))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts` — confirm PASS.

- [ ] **Step 5: En `server/index.ts`** conecta el sync:
  - Tras el bloque `countTickets(pool).then(...)`, añade un arranque inicial:
```ts
  sync.syncActivities()
    .then((n) => console.log(`Actividades: sync inicial (${n})`))
    .catch((e) => console.error('Sync actividades falló:', e))
```
  - En el `setInterval` existente que llama a `syncRecent`, encadena las actividades. Reemplaza:
```ts
    sync
      .syncRecent()
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
```
  por:
```ts
    sync
      .syncRecent()
      .then(() => sync.syncActivities())
      .catch((e) => console.error('Sync incremental falló:', e))
      .finally(() => { syncing = false })
```

- [ ] **Step 6:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts server/index.ts server/sync.ts server/db/activities.ts` — Expected: typecheck limpio; eslint 0 errores.

- [ ] **Step 7: Commit**
```bash
git add server/app.ts server/app.test.ts server/index.ts
git commit -m "feat(actividades): GET /api/tickets/:id/activities + wiring del sync (arranque + periódico)"
```

---

## Task 6: Frontend — pestañas funcionales + ActividadesPanel

**Files:** Modify `src/api/client.ts`; Create `src/components/ActividadesPanel.tsx`; Modify `src/components/TicketDetailView.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `Activity` al import de tipos y la función:
```ts
export function fetchActivities(ticketId: string): Promise<Activity[]> {
  return fetch(`/api/tickets/${ticketId}/activities`, { credentials: 'include' }).then((r) => json<Activity[]>(r))
}
```

- [ ] **Step 2: Crear `src/components/ActividadesPanel.tsx`** (verbatim):
```tsx
import type { Activity } from '../../shared/types'

function fmtDate(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function statusClass(a: Activity): string {
  const t = (a.status ?? '').toLowerCase()
  if (a.statusType === 'Closed' || t.includes('complet')) return 'bg-green-50 text-green-600 border-green-200'
  if (t.includes('progress') || t.includes('proceso')) return 'bg-blue-50 text-blue-600 border-blue-200'
  if (t.includes('wait') || t.includes('espera')) return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-slate-50 text-slate-500 border-slate-200'
}

export function ActividadesPanel({ items }: { items: Activity[] }) {
  if (items.length === 0) return <div className="text-[13px] text-slate-400 p-4">Este ticket no tiene actividades.</div>
  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {items.map((a) => (
        <div key={a.id} className="flex items-center gap-4 py-3 px-2">
          <span className="material-symbols-outlined text-slate-300 text-[20px]">task_alt</span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-800 truncate">{a.subject || '—'}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
              {a.priority && <span>{a.priority}</span>}
              {a.dueDate && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">flag</span>{fmtDate(a.dueDate)}</span>}
            </div>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium shrink-0 ${statusClass(a)}`}>{a.status || '—'}</span>
          {a.owner && <span className="text-[11px] text-slate-500 w-[120px] truncate text-right shrink-0">{a.owner}</span>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: En `src/components/TicketDetailView.tsx`** (READ el archivo y adapta):
  - Imports: `import { fetchActivities } from '../api/client'` (junto a `fetchConversations`), `import type { Activity } from '../../shared/types'` (o agrégalo al import de tipos existente), `import { ActividadesPanel } from './ActividadesPanel'`.
  - Tras la línea de `messages` (y `convCount`/`adjuntosCount`), añade:
```tsx
    const { data: actividades } = useAsync<Activity[]>(() => fetchActivities(ticketId), [ticketId]);
    const actCount = (actividades ?? []).length;
    const [activeTabId, setActiveTabId] = useState<string>('conv');
    const TABS = [
        { id: 'conv', label: `${convCount} ${convCount === 1 ? 'CONVERSACIÓN' : 'CONVERSACIONES'}`, view: 'conversaciones' },
        { id: 'res', label: 'RESOLUCIÓN', view: 'otros' },
        { id: 'tiempo', label: 'ENTRADA DE TIEMPO', view: 'otros' },
        { id: 'adj', label: `${adjuntosCount} ${adjuntosCount === 1 ? 'ADJUNTO' : 'ADJUNTOS'}`, view: 'otros' },
        { id: 'act', label: `${actCount} ACTIVIDADES`, view: 'actividades' },
        { id: 'apr', label: 'APROBACIÓN', view: 'otros' },
        { id: 'his', label: 'HISTORIA', view: 'otros' },
    ];
    const activeView = TABS.find((t) => t.id === activeTabId)?.view ?? 'conversaciones';
```
  - Reemplaza el `<nav>` de pestañas (el bloque que mapea el array de strings con los conteos) por:
```tsx
                            <nav className="flex gap-8 border-b-0">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={`text-[11px] font-bold py-2 transition-colors ${activeTabId === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
```
  - El área de contenido de las conversaciones (el `<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white relative">` con el mapa de `messages` y la caja de respuesta) **envuélvelo** para que solo se muestre en la vista de conversaciones, y añade las otras vistas justo después. Es decir, deja ese div tal cual pero condicionado: antes de él pon `{activeView === 'conversaciones' && (` y ciérralo `)}` tras su `</div>` de cierre; y agrega:
```tsx
                            {activeView === 'actividades' && (
                                <div className="flex-1 overflow-y-auto p-4 bg-white">
                                    <ActividadesPanel items={actividades ?? []} />
                                </div>
                            )}
                            {activeView === 'otros' && (
                                <div className="flex-1 overflow-y-auto p-8 bg-white text-center text-[13px] text-slate-400">Pronto.</div>
                            )}
```
  (Si envolver el bloque grande resulta arriesgado, una alternativa equivalente: deja el div de conversaciones siempre montado pero con `className` que incluya `${activeView === 'conversaciones' ? '' : 'hidden'}`, y añade los otros dos bloques con la misma condición. Lo importante: solo una vista visible a la vez según `activeView`.)

- [ ] **Step 4:** Run `npx tsc -b && npx vite build && npx eslint src/components/TicketDetailView.tsx src/components/ActividadesPanel.tsx src/api/client.ts` — Expected: sin errores de tipos; build OK; eslint 0 errores.

- [ ] **Step 5: Commit**
```bash
git add src/api/client.ts src/components/ActividadesPanel.tsx src/components/TicketDetailView.tsx
git commit -m "feat(actividades): pestañas funcionales (Conversaciones/Actividades) + ActividadesPanel"
```

---

## Task 7: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. En arranque, el log muestra `Actividades: sync inicial (N)`; en PgWeb `SELECT count(*) FROM activities;` > 0.
2. Abre un ticket con tareas (p.ej. #899) → la pestaña **ACTIVIDADES** muestra el conteo real; al hacer clic, lista las tareas (título, prioridad, fecha, estado con color, responsable).
3. La pestaña **CONVERSACIONES** sigue mostrando el hilo; las demás muestran "Pronto".

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(actividades): verificado"
```

---

## Notas de cierre
- **Solo lectura**; sin escritura a Zoho/PG.
- El sync de actividades corre en **arranque** + en cada ciclo del **intervalo** existente (encadenado tras `syncRecent`).
- **Fuera de alcance**: Eventos/Llamadas, crear/editar tareas, y las otras pestañas (solo "Pronto").
