# Historia del ticket (timeline de auditoría) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La pestaña "Historia" del detalle muestra el historial completo del ticket (comentarios, cambios de estado, transiciones, notificaciones, tareas…) agrupado por fecha, replicando Zoho Desk.

**Architecture:** Tabla `ticket_history` (dedupe por hash del evento) poblada por `syncTicketHistory(id)` al abrir el ticket. `mapHistoryEvent(raw)` (puro) traduce cada evento a español al leer; fallback a `ticket_transitions` para tickets creados en la app. Frontend: timeline agrupado por fecha.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest + supertest, React 19 + Vite + Tailwind + DOMPurify. Spec: `docs/superpowers/specs/2026-06-05-historia-ticket-design.md`.

**Contexto del repo:**
- `server/db/schema.sql`: `CREATE TABLE IF NOT EXISTS …;` (comentarios en líneas propias). `server/db/seedEquipos.ts` usa `import { createHash } from 'node:crypto'` → `createHash('sha1').update(key).digest('hex').slice(0,16)`.
- `ticket_transitions`: `id bigserial, ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values jsonb, comment_id, performed_at`.
- `server/sync.ts`: `interface Sync` (ya con `syncConversations`, `syncActivities`); `createSync({ zohoFetch, db, config })`; `readData(res)`, `PAGE_SIZE=100`. `zohoFetch` va al REST de Zoho.
- `server/app.ts`: `app.use('/api/tickets', requireAuth(db))` gatea `/api/tickets/*`; `app.get('/api/tickets/:id/conversations', …)` muestra el patrón sync-on-open. `app.test.ts` tiene `adminCookie()`, `appWith()`, `db`, `request`; **los mocks de `Sync` en `app.test.ts`, `auth/routes.test.ts`, `backfill.test.ts` ya incluyen `syncActivities: vi.fn()`** (hay que añadirles `syncTicketHistory: vi.fn()`).
- `src/components/TicketDetailView.tsx`: tab `{ id: 'his', label: 'HISTORIA', view: 'otros' }` (~línea 40); bloques `activeView === …` en el área de contenido. **DOMPurify** ya está instalado.

---

## Estructura de archivos
- Modify `server/db/schema.sql`, `shared/types.ts` — tabla + tipos.
- Create `shared/historyMap.ts` (+ `.test.ts`) — `mapHistoryEvent`.
- Create `server/db/history.ts` (+ `.test.ts`) — repo (upsert + get + fallback).
- Modify `server/sync.ts` (+ Create `server/sync.history.test.ts`) — `syncTicketHistory`.
- Modify `server/app.ts` (+ `app.test.ts`, `auth/routes.test.ts`, `backfill.test.ts`) — endpoint + mocks.
- Modify `src/api/client.ts`; Create `src/components/HistoriaPanel.tsx`; Modify `src/components/TicketDetailView.tsx`.

---

## Task 1: Tabla `ticket_history` + tipos

**Files:** Modify `server/db/schema.sql`, `shared/types.ts`

- [ ] **Step 1: Añadir al final de `server/db/schema.sql`:**
```sql
CREATE TABLE IF NOT EXISTS ticket_history (
  id text PRIMARY KEY,
  ticket_id text NOT NULL,
  event_name text,
  event_time timestamptz,
  actor_name text,
  actor_type text,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history (ticket_id);
```

- [ ] **Step 2: Añadir al final de `shared/types.ts`:**
```ts
export interface HistoryDetail { label: string; value: string; html?: boolean }
export interface HistoryEvent { eventName: string; time: string | null; actor: string; title: string; details: HistoryDetail[] }
```

- [ ] **Step 3:** Run `npx tsc -p tsconfig.server.json --noEmit && npx tsc -b` — Expected: sin errores.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql shared/types.ts
git commit -m "feat(historia): tabla ticket_history + tipos HistoryEvent/HistoryDetail"
```

---

## Task 2: `mapHistoryEvent` puro (TDD)

**Files:** Create `shared/historyMap.ts`, `shared/historyMap.test.ts`

- [ ] **Step 1: Escribir `shared/historyMap.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mapHistoryEvent } from './historyMap'

describe('mapHistoryEvent', () => {
  it('CommentAdded → comentario + tipo + contenido', () => {
    const e = mapHistoryEvent({ eventName: 'CommentAdded', eventTime: 't', actor: { name: 'Equipo Técnico' }, eventInfo: [{ propertyName: 'Content', propertyValue: '<div>Insumos</div>' }, { propertyName: 'CommentType', propertyValue: 'Private' }] })
    expect(e.title).toBe('Equipo Técnico ha publicado un comentario')
    expect(e.details).toEqual([
      { label: 'Tipo de comentario', value: 'Privado' },
      { label: 'Contenido', value: '<div>Insumos</div>', html: true },
    ])
  })
  it('TicketUpdated → estado cambiado', () => {
    const e = mapHistoryEvent({ eventName: 'TicketUpdated', actor: { name: 'Luz' }, eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: 'Ingresado', updatedValue: 'En Proceso' }, propertyType: 'ValueTransition' }] })
    expect(e.title).toBe('Luz ha actualizado el ticket')
    expect(e.details[0]).toEqual({ label: 'Estado', value: 'cambiado desde Ingresado a En Proceso' })
  })
  it('BlueprintTransitionPerformed → transición', () => {
    const e = mapHistoryEvent({ eventName: 'BlueprintTransitionPerformed', actor: { name: 'Luz' }, eventInfo: [{ propertyName: 'Blueprint', propertyValue: { name: 'BP' } }, { propertyName: 'Transition', propertyValue: { name: 'Aprobación y S. repuestos' } }] })
    expect(e.title).toBe('Transición de blueprint realizada por Luz')
    expect(e.details).toContainEqual({ label: 'Nombre de transición', value: 'Aprobación y S. repuestos' })
  })
  it('NotificationSent → regla', () => {
    const e = mapHistoryEvent({ eventName: 'NotificationSent', actor: { name: 'Regla' }, eventInfo: [{ propertyName: 'NotificationType', propertyValue: 'EmailNotification' }, { propertyName: 'Recipients', propertyValue: 'a@b.co' }] })
    expect(e.title).toBe('Notificación de regla aplicada')
    expect(e.details).toContainEqual({ label: 'Destinatario', value: 'a@b.co' })
  })
  it('fallback evento desconocido', () => {
    const e = mapHistoryEvent({ eventName: 'TicketArchived', actor: { name: 'Desk System' }, eventInfo: [] })
    expect(e.title).toBe('Ticket archivado')
    expect(e.details).toEqual([])
  })
})
```

- [ ] **Step 2:** Run `npx vitest run shared/historyMap.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `shared/historyMap.ts`**
```ts
import type { HistoryEvent, HistoryDetail } from './types'

function findProp(info: any[], name: string): any {
  return (info ?? []).find((p) => p.propertyName === name)?.propertyValue
}
function renderValue(v: any): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(renderValue).join(', ')
  if (typeof v === 'object') {
    if ('previousValue' in v || 'updatedValue' in v) return `${v.previousValue ?? '—'} → ${v.updatedValue ?? '—'}`
    if ('name' in v) return String(v.name).trim()
    return JSON.stringify(v)
  }
  return String(v)
}

const COMMENT_TYPE: Record<string, string> = { Private: 'Privado', Public: 'Público' }
const FIELD_LABEL: Record<string, string> = { Status: 'Estado' }
const EVENT_LABEL: Record<string, string> = { TicketArchived: 'Ticket archivado', TicketRestored: 'Ticket restaurado', AttachmentAdded: 'Adjunto agregado' }

export function mapHistoryEvent(raw: any): HistoryEvent {
  const info: any[] = raw.eventInfo ?? []
  const actorInfo: any[] = raw.actorInfo ?? []
  const actor = (raw.actor?.name ?? 'Sistema').trim() || 'Sistema'
  const time: string | null = raw.eventTime ?? null
  const ev: string = raw.eventName ?? ''
  const details: HistoryDetail[] = []
  let title = ''

  switch (ev) {
    case 'CommentAdded': {
      title = `${actor} ha publicado un comentario`
      const t = findProp(info, 'CommentType')
      if (t) details.push({ label: 'Tipo de comentario', value: COMMENT_TYPE[String(t)] ?? String(t) })
      const c = findProp(info, 'Content')
      if (c) details.push({ label: 'Contenido', value: String(c), html: true })
      break
    }
    case 'TicketUpdated': {
      title = `${actor} ha actualizado el ticket`
      for (const p of info) {
        const v = p.propertyValue
        if (v && typeof v === 'object' && ('previousValue' in v || 'updatedValue' in v)) {
          details.push({ label: FIELD_LABEL[p.propertyName] ?? p.propertyName, value: `cambiado desde ${v.previousValue ?? '—'} a ${v.updatedValue ?? '—'}` })
        } else {
          details.push({ label: p.propertyName, value: renderValue(v) })
        }
      }
      break
    }
    case 'BlueprintApplied': {
      title = 'Blueprint aplicado'
      const b = findProp(info, 'Blueprint')
      if (b) details.push({ label: 'Nombre de blueprint', value: renderValue(b) })
      break
    }
    case 'BlueprintRevoked': {
      title = `Blueprint revocado por ${actor}`
      const b = findProp(info, 'Blueprint')
      if (b) details.push({ label: 'Nombre de blueprint', value: renderValue(b) })
      const f = findProp(info, 'FromState')
      if (f) details.push({ label: 'Desde el estado', value: renderValue(f) })
      break
    }
    case 'BlueprintTransitionPerformed': {
      title = `Transición de blueprint realizada por ${actor}`
      const b = findProp(info, 'Blueprint')
      if (b) details.push({ label: 'Nombre de blueprint', value: renderValue(b) })
      const t = findProp(info, 'Transition')
      if (t) details.push({ label: 'Nombre de transición', value: renderValue(t) })
      break
    }
    case 'NotificationSent': {
      title = 'Notificación de regla aplicada'
      const t = findProp(info, 'NotificationType')
      if (t) details.push({ label: 'Tipo de notificación', value: renderValue(t) })
      const r = findProp(info, 'Recipients')
      if (r) details.push({ label: 'Destinatario', value: renderValue(r) })
      break
    }
    case 'TaskAdded': {
      title = 'Se agregó una tarea'
      for (const p of info) details.push({ label: p.propertyName, value: renderValue(p.propertyValue) })
      break
    }
    default: {
      title = EVENT_LABEL[ev] ?? ev
      for (const p of info) details.push({ label: p.propertyName, value: renderValue(p.propertyValue) })
    }
  }

  const tr = (actorInfo ?? []).find((p) => p.propertyName === 'Transition')?.propertyValue
  if (tr && ev !== 'BlueprintTransitionPerformed') details.push({ label: 'Nombre de transición', value: renderValue(tr) })

  return { eventName: ev, time, actor, title, details }
}
```

- [ ] **Step 4:** Run `npx vitest run shared/historyMap.test.ts` — confirm PASS (5 tests).

- [ ] **Step 5: Commit**
```bash
git add shared/historyMap.ts shared/historyMap.test.ts
git commit -m "feat(historia): mapHistoryEvent (eventos comunes en español + fallback)"
```

---

## Task 3: Repo `server/db/history.ts` (TDD pg-mem)

**Files:** Create `server/db/history.ts`, `server/db/history.test.ts`

- [ ] **Step 1: Escribir `server/db/history.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertHistoryEvent, getTicketHistory } from './history'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('history repo', () => {
  it('upsert idempotente + getTicketHistory mapea y ordena', async () => {
    const ev = { eventName: 'CommentAdded', eventTime: '2026-06-04T10:00:00Z', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] }
    await upsertHistoryEvent(db, 't1', ev)
    await upsertHistoryEvent(db, 't1', ev) // mismo evento → no duplica
    const n = (await db.query("SELECT count(*)::int AS c FROM ticket_history WHERE ticket_id='t1'")).rows[0]
    expect(n.c).toBe(1)
    const h = await getTicketHistory(db, 't1')
    expect(h[0]).toMatchObject({ title: 'Ana ha publicado un comentario' })
  })

  it('fallback a ticket_transitions cuando no hay historial', async () => {
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at) VALUES ('t2','Habilitar Servicio','OV asignada','Ingresado','Comercial','Admin',now())")
    const h = await getTicketHistory(db, 't2')
    expect(h).toHaveLength(1)
    expect(h[0]).toMatchObject({ title: 'Transición: Habilitar Servicio', actor: 'Admin' })
    expect(h[0].details).toContainEqual({ label: 'Estado', value: 'OV asignada → Ingresado' })
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/history.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `server/db/history.ts`**
```ts
import { createHash } from 'node:crypto'
import type { Queryable } from './migrate'
import type { HistoryEvent } from '../../shared/types'
import { mapHistoryEvent } from '../../shared/historyMap'

const J = (v: unknown) => JSON.stringify(v ?? null)

function eventId(ticketId: string, raw: any): string {
  const key = `${ticketId}|${raw.eventTime ?? ''}|${raw.eventName ?? ''}|${JSON.stringify(raw.eventInfo ?? [])}`
  return 'h-' + createHash('sha1').update(key).digest('hex').slice(0, 24)
}

export async function upsertHistoryEvent(db: Queryable, ticketId: string, raw: any): Promise<void> {
  await db.query(
    `INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,actor_type,raw)
     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
    [eventId(ticketId, raw), ticketId, raw.eventName ?? null, raw.eventTime ?? null, raw.actor?.name ?? null, raw.actor?.type ?? null, J(raw)],
  )
}

export async function getTicketHistory(db: Queryable, ticketId: string): Promise<HistoryEvent[]> {
  const r = await db.query('SELECT raw FROM ticket_history WHERE ticket_id=$1 ORDER BY event_time DESC NULLS LAST', [ticketId])
  const rows = r.rows as any[]
  if (rows.length > 0) return rows.map((x) => mapHistoryEvent(typeof x.raw === 'string' ? JSON.parse(x.raw) : x.raw))
  const tr = await db.query('SELECT transition_name, from_status, to_status, area, performed_by, performed_at FROM ticket_transitions WHERE ticket_id=$1 ORDER BY performed_at DESC', [ticketId])
  return (tr.rows as any[]).map((t) => ({
    eventName: 'AppTransition',
    time: t.performed_at ?? null,
    actor: t.performed_by ?? 'App',
    title: `Transición: ${t.transition_name ?? ''}`.trim(),
    details: [
      { label: 'Estado', value: `${t.from_status ?? '—'} → ${t.to_status ?? '—'}` },
      ...(t.area ? [{ label: 'Área', value: String(t.area) }] : []),
    ],
  }))
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/history.test.ts` — confirm PASS.

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/db/history.ts` — typecheck limpio; eslint 0 errores (WARNINGs `no-explicit-any` aceptables).

- [ ] **Step 6: Commit**
```bash
git add server/db/history.ts server/db/history.test.ts
git commit -m "feat(historia): repo upsertHistoryEvent + getTicketHistory (con fallback a transiciones)"
```

---

## Task 4: `syncTicketHistory` (TDD con zohoFetch mock)

**Files:** Modify `server/sync.ts`; Create `server/sync.history.test.ts`

- [ ] **Step 1: Escribir `server/sync.history.test.ts`**
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('syncTicketHistory', () => {
  it('pagina y hace upsert del historial de Zoho', async () => {
    const ev = { eventName: 'CommentAdded', eventTime: '2026-06-04T10:00:00Z', actor: { name: 'Ana', type: 'Agent' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] }
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [ev] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    await sync.syncTicketHistory('t1')
    const n = (await db.query("SELECT count(*)::int AS c FROM ticket_history WHERE ticket_id='t1'")).rows[0]
    expect(n.c).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/t1/History')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/sync.history.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/sync.ts`:**
  - Import: `import { upsertHistoryEvent } from './db/history'`.
  - En `interface Sync` añade: `syncTicketHistory(id: string): Promise<void>`.
  - Junto a `syncConversations` en el objeto retornado, añade:
```ts
    async syncTicketHistory(id: string): Promise<void> {
      let from = 1
      for (;;) {
        const res = await zohoFetch(`/tickets/${id}/History?from=${from}&limit=${PAGE_SIZE}`)
        if (!res.ok) throw new Error(`Zoho /tickets/${id}/History ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        for (const e of items) await upsertHistoryEvent(db, id, e)
        if (items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
    },
```

- [ ] **Step 4:** Run `npx vitest run server/sync.history.test.ts` — confirm PASS.

- [ ] **Step 5: Actualizar los mocks de `Sync`.** Run `npx tsc -p tsconfig.server.json --noEmit` — fallará (TS2741) en los tests que construyen un objeto `Sync` completo. Busca `syncActivities: vi.fn()` en `server/app.test.ts`, `server/auth/routes.test.ts`, `server/backfill.test.ts` y, junto a esa línea, añade `syncTicketHistory: vi.fn(),`. Vuelve a correr `npx tsc -p tsconfig.server.json --noEmit` → limpio.

- [ ] **Step 6:** Run `npx eslint server/sync.ts` — eslint 0 errores.

- [ ] **Step 7: Commit**
```bash
git add server/sync.ts server/sync.history.test.ts server/app.test.ts server/auth/routes.test.ts server/backfill.test.ts
git commit -m "feat(historia): syncTicketHistory (paginado, upsert) + mocks Sync"
```

---

## Task 5: Endpoint `GET /api/tickets/:id/history` (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts` añade un bloque** (el mock de `sync.syncTicketHistory` es un `vi.fn()` no-op, así que el endpoint solo lee de la BD):
```ts
describe('GET /api/tickets/:id/history', () => {
  it('mapea el historial; fallback a transiciones; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await db.query("INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h1','t1','CommentAdded',now(),'Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })])
    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/history').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ title: 'Ana ha publicado un comentario' })
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t2',2,'B','Ingresado')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t2','Habilitar','OV asignada','Ingresado','Admin',now())")
    const f = await request(app).get('/api/tickets/t2/history').set('Cookie', cookie)
    expect(f.body[0]).toMatchObject({ title: 'Transición: Habilitar' })
    expect((await request(app).get('/api/tickets/t1/history')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`:**
  - Import: `import { getTicketHistory } from './db/history'`.
  - Junto a la ruta de conversaciones, añade:
```ts
  app.get('/api/tickets/:id/history', async (req, res) => {
    try {
      const id = String(req.params.id)
      try { await sync.syncTicketHistory(id) } catch (e) { console.error(`syncTicketHistory(${id}) falló:`, e) }
      res.json(await getTicketHistory(db, id))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts` — Expected: tests PASS; typecheck limpio; eslint 0 errores.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(historia): GET /api/tickets/:id/history (sync-on-open + lectura/fallback)"
```

---

## Task 6: Frontend — HistoriaPanel + pestaña

**Files:** Modify `src/api/client.ts`; Create `src/components/HistoriaPanel.tsx`; Modify `src/components/TicketDetailView.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `HistoryEvent` al import de tipos y la función:
```ts
export function fetchHistory(id: string): Promise<HistoryEvent[]> {
  return fetch(`/api/tickets/${id}/history`, { credentials: 'include' }).then((r) => json<HistoryEvent[]>(r))
}
```

- [ ] **Step 2: Crear `src/components/HistoriaPanel.tsx`** (verbatim):
```tsx
import DOMPurify from 'dompurify'
import type { HistoryEvent } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchHistory } from '../api/client'

function fmtDateHeader(s: string | null): string {
  if (!s) return 'Sin fecha'
  const d = new Date(s)
  return isNaN(d.getTime()) ? 'Sin fecha' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}
function fmtTime(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export function HistoriaPanel({ ticketId }: { ticketId: string }) {
  const { data, loading } = useAsync<HistoryEvent[]>(() => fetchHistory(ticketId), [ticketId])
  if (loading && !data) return <div className="p-4 text-[13px] text-slate-400">Cargando…</div>
  const events = data ?? []
  if (events.length === 0) return <div className="p-4 text-[13px] text-slate-400">Sin historial.</div>

  const groups: { date: string; items: HistoryEvent[] }[] = []
  for (const e of events) {
    const d = fmtDateHeader(e.time)
    const last = groups[groups.length - 1]
    if (last && last.date === d) last.items.push(e)
    else groups.push({ date: d, items: [e] })
  }

  return (
    <div className="p-4 max-w-[820px]">
      {groups.map((g, gi) => (
        <div key={gi} className="mb-5">
          <div className="text-[12px] font-bold text-slate-500 border-b border-slate-200 pb-1 mb-3">{g.date}</div>
          <div className="flex flex-col gap-4">
            {g.items.map((e, i) => (
              <div key={i} className="text-[12px]">
                <div className="text-[11px] text-slate-400">{fmtTime(e.time)}</div>
                <div className="font-semibold text-slate-700">{e.title}</div>
                {e.details.map((d, di) => (
                  <div key={di} className="text-slate-600 mt-0.5">
                    <span className="text-slate-400">{d.label}</span>{' '}
                    {d.html
                      ? <span className="inline [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(d.value) }} />
                      : <span>{d.value}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: En `src/components/TicketDetailView.tsx`:**
  - Import: `import { HistoriaPanel } from './HistoriaPanel'`.
  - Cambia la pestaña `his` a `view: 'historia'`:
```tsx
        { id: 'his', label: 'HISTORIA', view: 'historia' },
```
  - Junto a los bloques `activeView === …`, añade:
```tsx
                        {activeView === 'historia' && (
                            <div className="flex-1 overflow-y-auto bg-white">
                                <HistoriaPanel ticketId={ticketId} />
                            </div>
                        )}
```

- [ ] **Step 4:** Run `npx tsc -b && npx vite build && npx eslint src/components/HistoriaPanel.tsx src/components/TicketDetailView.tsx src/api/client.ts` — Expected: sin errores de tipos; build OK; eslint 0 errores.

- [ ] **Step 5: Commit**
```bash
git add src/api/client.ts src/components/HistoriaPanel.tsx src/components/TicketDetailView.tsx
git commit -m "feat(historia): HistoriaPanel (timeline agrupado por fecha) + pestaña Historia funcional"
```

---

## Task 7: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Abre un ticket sincronizado (p.ej. #899) → pestaña **HISTORIA** → timeline agrupado por fecha con comentarios, cambios de estado, transiciones, notificaciones (en español).
2. Un ticket creado en la app → muestra sus transiciones propias (fallback).
3. Sin sesión, `GET /api/tickets/:id/history` responde 401.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(historia): verificado"
```

---

## Notas de cierre
- **Sync al abrir** (no backfill global); **map-at-read** (guardamos `raw`).
- **Dedupe por hash** del evento (Zoho no da id) → upsert idempotente.
- **Fallback a `ticket_transitions`** para tickets creados en la app.
- **Fuera de v1**: filtros de Zoho, imágenes en línea de comentarios (auth Zoho), backfill global.
