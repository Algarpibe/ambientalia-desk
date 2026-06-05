# Subsistema G — Análisis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página "Análisis" (solo admin) con KPIs de servicio, distribuciones y tendencia mensual, calculados desde `tickets`, con selector de periodo y barras CSS propias.

**Architecture:** Helper puro `computeAnalisis(rows, from, to)` (en `shared/`) + `getAnalisisRows` (SELECT con joins) + endpoint `GET /api/analisis?range=` (admin). Frontend `Analisis` (overlay) abierto desde el botón "Análisis" de la barra superior (funcional solo para admin).

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-subsistema-g-analisis-design.md`.

**Contexto del repo:**
- `tickets`: `status, status_type, created_time (timestamptz), closed_time (timestamptz), fecha_finalizacion_st (date), dias_entrega (integer), marca, account_id, client_id, assignee_id`. Joins: `accounts a`, `clients cl`, `agents g` (ver `getActiveTickets` en `server/db/repo.ts`).
- `server/app.ts`: importa `requireAuth, requireAdmin as requireSuperAdmin` de `./auth/middleware`; rutas con `requireAuth(db)`; `app.test.ts` tiene `adminCookie()`, `userCookie(areas)`, `appWith()`, `db`, `request`.
- `src/components/Header.tsx`: `Header: React.FC<{ onOpenUsers; onOpenRoles; onOpenConfig; onOpenEquipos }>` + `NAV_TABS` (incluye `{ label: 'Análisis' }`, hoy inerte) + usa `useAuth` (en `UserMenu`). `src/App.tsx` maneja overlays (`showConfig`/`showEquipos`/…) y rinde `<Header .../>`. `src/hooks/useAsync.ts`: `useAsync(fn, deps) → { data, loading, error }`.

---

## Estructura de archivos
- Modify `shared/types.ts` — tipos `Analisis`, `AnalisisPunto`, `AnalisisMes`, `AnalisisRow`.
- Create `shared/analisis.ts` (+ `.test.ts`) — `computeAnalisis` puro.
- Create `server/analisis.ts` (+ `.test.ts`) — `getAnalisisRows`, `rangeToFromTo`.
- Modify `server/app.ts` (+ `app.test.ts`) — `GET /api/analisis`.
- Modify `src/api/client.ts`; Create `src/components/Analisis.tsx`; Modify `src/components/Header.tsx`, `src/App.tsx`.

---

## Task 1: Tipos compartidos

**Files:** Modify `shared/types.ts`

- [ ] **Step 1: Añadir a `shared/types.ts`** (al final):
```ts
export interface AnalisisPunto { label: string; value: number }
export interface AnalisisMes { mes: string; creados: number; finalizados: number }
export interface Analisis {
  activos: number
  creados: number
  finalizados: number
  tiempoPromedioDias: number | null
  cumplimientoPct: number | null
  porEstado: AnalisisPunto[]
  porTecnico: AnalisisPunto[]
  porCliente: AnalisisPunto[]
  porMarca: AnalisisPunto[]
  tendencia: AnalisisMes[]
}
export interface AnalisisRow {
  status: string
  statusType: string | null
  createdAt: string | null
  finalizadoAt: string | null
  diasEntrega: number | null
  marca: string | null
  cliente: string | null
  tecnico: string | null
}
```

- [ ] **Step 2:** Run `npx tsc -p tsconfig.server.json --noEmit && npx tsc -b` — Expected: sin errores.

- [ ] **Step 3: Commit**
```bash
git add shared/types.ts
git commit -m "feat(g): tipos Analisis/AnalisisPunto/AnalisisMes/AnalisisRow"
```

---

## Task 2: `computeAnalisis` puro (TDD)

**Files:** Create `shared/analisis.ts`, `shared/analisis.test.ts`

- [ ] **Step 1: Escribir `shared/analisis.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { computeAnalisis } from './analisis'
import type { AnalisisRow } from './types'

const rows: AnalisisRow[] = [
  { status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-10T00:00:00Z', finalizadoAt: null, diasEntrega: null, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-05T00:00:00Z', diasEntrega: 5, marca: 'Horiba', cliente: 'ACME', tecnico: 'Ana' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-11T00:00:00Z', diasEntrega: 3, marca: 'Grimm', cliente: 'Otro', tecnico: 'Beto' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2025-01-01T00:00:00Z', finalizadoAt: '2025-01-02T00:00:00Z', diasEntrega: 5, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana' },
]

describe('computeAnalisis', () => {
  it('KPIs, distribuciones y tendencia dentro del rango', () => {
    const from = new Date('2026-05-01T00:00:00Z')
    const to = new Date('2026-05-31T23:59:59Z')
    const a = computeAnalisis(rows, from, to)
    expect(a.activos).toBe(1)
    expect(a.creados).toBe(3)
    expect(a.finalizados).toBe(2)
    expect(a.tiempoPromedioDias).toBe(7)
    expect(a.cumplimientoPct).toBe(50)
    expect(a.porEstado).toEqual([{ label: 'Ingresado', value: 1 }])
    expect(a.porTecnico.find((p) => p.label === 'Ana')?.value).toBe(2)
    expect(a.porMarca.find((p) => p.label === 'Grimm')?.value).toBe(2)
    expect(a.tendencia.find((m) => m.mes === '2026-05')).toMatchObject({ creados: 3, finalizados: 2 })
  })

  it('null cuando no hay finalizados/promesas en el rango', () => {
    const a = computeAnalisis([], new Date('2026-01-01T00:00:00Z'), new Date('2026-12-31T00:00:00Z'))
    expect(a.tiempoPromedioDias).toBeNull()
    expect(a.cumplimientoPct).toBeNull()
  })
})
```

- [ ] **Step 2:** Run `npx vitest run shared/analisis.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `shared/analisis.ts`**
```ts
import type { Analisis, AnalisisPunto, AnalisisMes, AnalisisRow } from './types'

function parseDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}
function inRange(d: Date | null, from: Date | null, to: Date): boolean {
  if (!d) return false
  if (from && d < from) return false
  return d <= to
}
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function computeAnalisis(rows: AnalisisRow[], from: Date | null, to: Date): Analisis {
  let activos = 0, creados = 0, finalizados = 0
  const servicio: number[] = []
  let conPromesa = 0, cumplidos = 0
  const porEstado = new Map<string, number>()
  const porTecnico = new Map<string, number>()
  const porCliente = new Map<string, number>()
  const porMarca = new Map<string, number>()
  const tend = new Map<string, { creados: number; finalizados: number }>()
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
  const bumpMes = (k: string, f: 'creados' | 'finalizados') => {
    const cur = tend.get(k) ?? { creados: 0, finalizados: 0 }
    cur[f]++
    tend.set(k, cur)
  }

  for (const r of rows) {
    const cerrado = r.statusType === 'Closed'
    if (!cerrado) { activos++; bump(porEstado, r.status || '—') }
    const created = parseDate(r.createdAt)
    const fin = parseDate(r.finalizadoAt)
    if (inRange(created, from, to)) {
      creados++
      bump(porTecnico, r.tecnico || 'Sin asignar')
      bump(porCliente, r.cliente || '—')
      bump(porMarca, r.marca || '—')
      bumpMes(monthKey(created!), 'creados')
    }
    if (cerrado && inRange(fin, from, to)) {
      finalizados++
      bumpMes(monthKey(fin!), 'finalizados')
      if (created && fin) {
        const dias = (fin.getTime() - created.getTime()) / 86400000
        if (dias >= 0) {
          servicio.push(dias)
          if (r.diasEntrega != null) { conPromesa++; if (dias <= r.diasEntrega) cumplidos++ }
        }
      }
    }
  }

  const puntos = (m: Map<string, number>, top?: number): AnalisisPunto[] => {
    const arr = [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    return top ? arr.slice(0, top) : arr
  }
  const tendencia: AnalisisMes[] = [...tend.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({ mes, creados: v.creados, finalizados: v.finalizados }))

  return {
    activos, creados, finalizados,
    tiempoPromedioDias: servicio.length ? Math.round((servicio.reduce((a, b) => a + b, 0) / servicio.length) * 10) / 10 : null,
    cumplimientoPct: conPromesa ? Math.round((cumplidos / conPromesa) * 100) : null,
    porEstado: puntos(porEstado),
    porTecnico: puntos(porTecnico, 10),
    porCliente: puntos(porCliente, 10),
    porMarca: puntos(porMarca, 10),
    tendencia,
  }
}
```

- [ ] **Step 4:** Run `npx vitest run shared/analisis.test.ts` — confirm PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add shared/analisis.ts shared/analisis.test.ts
git commit -m "feat(g): computeAnalisis (KPIs + distribuciones + tendencia, puro)"
```

---

## Task 3: `getAnalisisRows` + `rangeToFromTo` (TDD pg-mem)

**Files:** Create `server/analisis.ts`, `server/analisis.test.ts`

- [ ] **Step 1: Escribir `server/analisis.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { getAnalisisRows, rangeToFromTo } from './analisis'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('getAnalisisRows', () => {
  it('finalizadoAt = fecha_finalizacion_st ?? closed_time; diasEntrega numérico; técnico por join', async () => {
    await db.query("INSERT INTO agents (id,name,source) VALUES ('g1','Ana','zoho')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time,fecha_finalizacion_st,dias_entrega,marca,assignee_id) VALUES ('t1',1,'A','Finalizado','Closed','2026-05-01T00:00:00Z','2026-05-06',5,'Grimm','g1')")
    const rows = await getAnalisisRows(db)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ status: 'Finalizado', statusType: 'Closed', diasEntrega: 5, marca: 'Grimm', tecnico: 'Ana' })
    expect(rows[0].finalizadoAt?.slice(0, 10)).toBe('2026-05-06')
    expect(rows[0].createdAt?.slice(0, 10)).toBe('2026-05-01')
  })
})

describe('rangeToFromTo', () => {
  it('mapea rangos; "todo" sin cota inferior', () => {
    const now = new Date('2026-06-05T00:00:00Z')
    expect(rangeToFromTo('todo', now).from).toBeNull()
    expect(rangeToFromTo('todo', now).to).toBe(now)
    expect(rangeToFromTo('mes', now).from).not.toBeNull()
    expect(rangeToFromTo('xxx', now).from).toBeNull()
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/analisis.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `server/analisis.ts`**
```ts
import type { Queryable } from './db/migrate'
import type { AnalisisRow } from '../shared/types'

function toIso(v: unknown): string | null {
  if (v == null) return null
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

export async function getAnalisisRows(db: Queryable): Promise<AnalisisRow[]> {
  const r = await db.query(
    `SELECT t.status, t.status_type, t.created_time, t.closed_time, t.fecha_finalizacion_st, t.dias_entrega, t.marca,
            COALESCE(a.name, cl.name) AS cliente, g.name AS tecnico
     FROM tickets t
     LEFT JOIN accounts a ON t.account_id=a.id
     LEFT JOIN clients cl ON t.client_id=cl.id
     LEFT JOIN agents g ON t.assignee_id=g.id`,
  )
  return (r.rows as any[]).map((x) => ({
    status: x.status, statusType: x.status_type ?? null,
    createdAt: toIso(x.created_time),
    finalizadoAt: toIso(x.fecha_finalizacion_st ?? x.closed_time),
    diasEntrega: x.dias_entrega != null && x.dias_entrega !== '' ? Number(x.dias_entrega) : null,
    marca: x.marca ?? null, cliente: x.cliente ?? null, tecnico: x.tecnico ?? null,
  }))
}

export function rangeToFromTo(range: string, now: Date): { from: Date | null; to: Date } {
  const day = 86400000
  if (range === 'mes') return { from: new Date(now.getTime() - 30 * day), to: now }
  if (range === 'trimestre') return { from: new Date(now.getTime() - 90 * day), to: now }
  if (range === 'anio') return { from: new Date(now.getTime() - 365 * day), to: now }
  return { from: null, to: now }
}
```

- [ ] **Step 4:** Run `npx vitest run server/analisis.test.ts` — confirm PASS. (Si pg-mem devolviera la fecha en otro formato, el `.slice(0,10)` del test ya lo tolera; si aún fallara, reporta el valor recibido.)

- [ ] **Step 5: Commit**
```bash
git add server/analisis.ts server/analisis.test.ts
git commit -m "feat(g): getAnalisisRows (joins) + rangeToFromTo"
```

---

## Task 4: Endpoint `GET /api/analisis` (TDD, admin)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts`** añade un bloque (usa `userCookie([])` para el no-admin):
```ts
describe('GET /api/analisis (admin)', () => {
  it('admin obtiene métricas; 403 no-admin; 401 sin sesión', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time) VALUES ('a1',1,'A','Ingresado','Open',now())")
    const { app } = appWith()
    const res = await request(app).get('/api/analisis?range=todo').set('Cookie', admin)
    expect(res.status).toBe(200)
    expect(typeof res.body.activos).toBe('number')
    expect(Array.isArray(res.body.porEstado)).toBe(true)
    const op = await userCookie([])
    expect((await request(app).get('/api/analisis').set('Cookie', op)).status).toBe(403)
    expect((await request(app).get('/api/analisis')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`** añade los imports y la ruta:
```ts
import { getAnalisisRows, rangeToFromTo } from './analisis'
import { computeAnalisis } from '../shared/analisis'
```
Y registra (junto a las demás rutas, fuera de `/api/tickets`):
```ts
  app.get('/api/analisis', requireAuth(db), requireSuperAdmin, async (req, res) => {
    try {
      const { from, to } = rangeToFromTo(String(req.query.range ?? 'todo'), new Date())
      const rows = await getAnalisisRows(db)
      res.json(computeAnalisis(rows, from, to))
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```
(`requireSuperAdmin` ya está importado en app.ts; valida `req.user.isAdmin` → 403.)

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts server/analisis.ts` — Expected: PASS + typecheck + eslint 0 errores.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(g): GET /api/analisis (session + admin)"
```

---

## Task 5: Frontend — página Análisis + botón en la barra superior

**Files:** Modify `src/api/client.ts`; Create `src/components/Analisis.tsx`; Modify `src/components/Header.tsx`, `src/App.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `Analisis` al import de tipos y la función:
```ts
export function fetchAnalisis(range: string): Promise<Analisis> {
  return fetch(`/api/analisis?range=${encodeURIComponent(range)}`, { credentials: 'include' }).then((r) => json<Analisis>(r))
}
```

- [ ] **Step 2: Crear `src/components/Analisis.tsx`**
```tsx
import { useState } from 'react'
import type { Analisis as AnalisisData, AnalisisPunto, AnalisisMes } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchAnalisis } from '../api/client'

const RANGOS: { key: string; label: string }[] = [
  { key: 'mes', label: 'Último mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'anio', label: 'Año' },
  { key: 'todo', label: 'Todo' },
]

function Kpi({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-4">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className="text-[24px] font-bold text-slate-800">{value == null ? '—' : value}{value != null && suffix ? <span className="text-[14px] font-normal text-slate-400"> {suffix}</span> : null}</div>
    </div>
  )
}

function BarList({ title, data }: { title: string; data: AnalisisPunto[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <section className="bg-white border border-slate-200 rounded-md p-4">
      <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h3>
      {data.length === 0 && <div className="text-[12px] text-slate-400">Sin datos.</div>}
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-[12px]">
            <span className="w-[170px] truncate text-slate-600" title={d.label}>{d.label}</span>
            <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden"><div className="bg-blue-400 h-3" style={{ width: `${(d.value / max) * 100}%` }} /></div>
            <span className="w-8 text-right font-bold text-slate-700">{d.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Tendencia({ data }: { data: AnalisisMes[] }) {
  const max = Math.max(1, ...data.flatMap((m) => [m.creados, m.finalizados]))
  return (
    <section className="bg-white border border-slate-200 rounded-md p-4">
      <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Tendencia mensual (creados vs finalizados)</h3>
      {data.length === 0 ? <div className="text-[12px] text-slate-400">Sin datos.</div> : (
        <>
          <div className="flex items-end gap-3 h-[150px]">
            {data.map((m) => (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="flex items-end gap-1 flex-1 w-full justify-center">
                  <div className="w-3 bg-blue-400 rounded-t" style={{ height: `${(m.creados / max) * 100}%` }} title={`Creados: ${m.creados}`} />
                  <div className="w-3 bg-emerald-400 rounded-t" style={{ height: `${(m.finalizados / max) * 100}%` }} title={`Finalizados: ${m.finalizados}`} />
                </div>
                <span className="text-[10px] text-slate-400">{m.mes.slice(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-sm" />Creados</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm" />Finalizados</span>
          </div>
        </>
      )}
    </section>
  )
}

export function Analisis({ onClose }: { onClose: () => void }) {
  const [range, setRange] = useState('trimestre')
  const { data, loading, error } = useAsync<AnalisisData>(() => fetchAnalisis(range), [range])

  return (
    <div className="fixed inset-0 z-[70] bg-[#f4f5f7] flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Análisis</h1>
        <div className="ml-auto flex gap-1">
          {RANGOS.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} className={`px-3 py-1 rounded text-[12px] ${range === r.key ? 'bg-white text-slate-800 font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{r.label}</button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-6">
        {loading && !data && <div className="text-center text-slate-400 text-[13px]">Cargando…</div>}
        {data && (
          <div className="max-w-[1100px] mx-auto flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi label="Activos (ahora)" value={data.activos} />
              <Kpi label="Creados (periodo)" value={data.creados} />
              <Kpi label="Finalizados (periodo)" value={data.finalizados} />
              <Kpi label="Tiempo prom. servicio" value={data.tiempoPromedioDias} suffix="días" />
              <Kpi label="Cumplimiento promesa" value={data.cumplimientoPct} suffix="%" />
            </div>
            <Tendencia data={data.tendencia} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BarList title="Por estado (activos)" data={data.porEstado} />
              <BarList title="Por técnico (periodo)" data={data.porTecnico} />
              <BarList title="Por cliente (periodo)" data={data.porCliente} />
              <BarList title="Por marca (periodo)" data={data.porMarca} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: En `src/components/Header.tsx`** habilita el tab "Análisis" (solo admin).
  - Asegura `import { useAuth } from '../auth/AuthContext'` (ya está en el archivo).
  - Cambia la firma de `Header` para aceptar `onOpenAnalisis: () => void` (junto a los otros `onOpen*`).
  - Dentro de `Header`, añade al inicio: `const { user } = useAuth()`.
  - En el `.map` de `NAV_TABS`, dale al botón un `onClick` y cursor cuando sea "Análisis" y el usuario sea admin. Reemplaza el `<button ...>` del map por:
```tsx
                        <button
                            key={idx}
                            onClick={tab.label === 'Análisis' && user?.isAdmin ? onOpenAnalisis : undefined}
                            className={`px-4 h-full text-[13px] font-medium transition-colors border-b-2 ${tab.active ? 'text-white border-blue-500 bg-white/5' : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'} ${tab.label === 'Análisis' && user?.isAdmin ? 'cursor-pointer' : ''}`}
                        >
                            {tab.label}
                        </button>
```

- [ ] **Step 4: En `src/App.tsx`** (lee el archivo y adapta): importa `Analisis`, añade `const [showAnalisis, setShowAnalisis] = useState(false)`, pasa `onOpenAnalisis={() => setShowAnalisis(true)}` al `<Header .../>`, y junto a los otros overlays añade:
```tsx
      {showAnalisis && <Analisis onClose={() => setShowAnalisis(false)} />}
```

- [ ] **Step 5:** Run `npx tsc -b && npx vite build && npx eslint src/components/Analisis.tsx src/components/Header.tsx src/App.tsx src/api/client.ts` — Expected: sin errores de tipos; build OK; eslint 0 errores.

- [ ] **Step 6: Commit**
```bash
git add src/api/client.ts src/components/Analisis.tsx src/components/Header.tsx src/App.tsx
git commit -m "feat(g): página Análisis (KPIs/distribuciones/tendencia) + tab 'Análisis' (admin)"
```

---

## Task 6: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Como **admin**, clic en **"Análisis"** (barra superior) → abre la página con KPIs, tendencia y distribuciones.
2. Cambia el rango (mes/trimestre/año/todo) → los KPIs y la tendencia se recalculan.
3. Como **no-admin**, el tab "Análisis" no hace nada; `GET /api/analisis` responde 403.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(g): subsistema G (Análisis) verificado"
```

---

## Notas de cierre
- **Solo admin** (`requireSuperAdmin` en el endpoint; tab funcional solo si `user.isAdmin`).
- **Cómputo puro** (`computeAnalisis`) sobre filas traídas por `getAnalisisRows` — fácil de testear y de extender.
- **Diferido a v2**: tiempos por etapa / cuello de botella desde `ticket_transitions`.
