# D1 — Directorio de Clientes (Contactos + Empresas) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El tab "Clientes" abre un directorio que replica la pantalla "Todos los Contactos" de Zoho: lista de Contactos (persona·empresa·email·teléfono) y Empresas, con búsqueda e índice A-Z.

**Architecture:** Backfill de todos los contactos de Zoho Desk a la tabla `contacts` (`syncContacts`, incremental por `modified_time`); endpoints `GET /api/contacts` y `/api/accounts`; `ClientesPage` (overlay) con toggle Contactos/Empresas + índice A-Z + búsqueda en cliente.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest + supertest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-clientes-directorio-design.md`.

**Contexto del repo:**
- `contacts (id, first_name, last_name, email, phone, mobile, account_id, source, managed_by_app, raw, synced_at, updated_at)`; `accounts (id, name, nit, email, phone, website, city, address, industry, …)`.
- `server/db/rows.ts`: `ContactRow`. `server/db/repo.ts`: `upsertContact` (hoy usa `ON CONFLICT … DO UPDATE … WHERE managed_by_app=false`; lo reescribimos a guarda con SELECT — pg-mem no soporta WHERE en ON CONFLICT — y le añadimos `modified_time`). `J = JSON.stringify`. `repo.test.ts` existe.
- `server/db/mappers.ts`: `contactRowFromZoho(raw)`.
- `server/sync.ts`: `createSync({ zohoFetch, db, config })` con `ensureAccount(accountId)` (privado), `upsertContact`, `contactRowFromZoho` ya importados; `readData`, `PAGE_SIZE=100`. `interface Sync` (con `syncActivities`, `syncTicketHistory`). Los mocks de `Sync` en `server/app.test.ts`, `server/auth/routes.test.ts`, `server/backfill.test.ts` ya tienen `syncActivities: vi.fn(), syncTicketHistory: vi.fn()` → añadir `syncContacts: vi.fn()`.
- `server/index.ts`: backfill de arranque + `setInterval(syncRecent → syncActivities …)`.
- `server/app.ts`: `/api/clients` (Books) muestra el patrón de endpoint con `requireAuth(db)` fuera de `/api/tickets`.
- `src/components/Header.tsx`: `NAV_TABS` incluye `{ label: 'Clientes' }`; el tab 'Análisis' ya es funcional (`onClick … ? onOpenAnalisis : undefined`); usa `useAuth`. `src/App.tsx` orquesta overlays (`showAnalisis` …).

---

## Estructura de archivos
- Modify `server/db/schema.sql`, `server/db/rows.ts`, `shared/types.ts` — columna + tipos.
- Modify `server/db/mappers.ts`, `server/db/repo.ts` (+ `repo.test.ts`) — mapper + upsertContact.
- Create `server/db/directory.ts` (+ `.test.ts`) — `getContacts`, `getAccounts`.
- Modify `server/sync.ts` (+ Create `server/sync.contacts.test.ts`), `server/index.ts` — `syncContacts` + wiring.
- Modify `server/app.ts` (+ `app.test.ts`, `auth/routes.test.ts`, `backfill.test.ts`) — endpoints + mocks.
- Modify `src/api/client.ts`; Create `src/components/ClientesPage.tsx`; Modify `src/components/Header.tsx`, `src/App.tsx`.

---

## Task 1: Columna `modified_time` + tipos

**Files:** Modify `server/db/schema.sql`, `shared/types.ts`

- [ ] **Step 1: Añadir al final de `server/db/schema.sql`:**
```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS modified_time timestamptz;
```

- [ ] **Step 2: Añadir al final de `shared/types.ts`:**
```ts
export interface ContactLite { id: string; name: string; company: string | null; email: string | null; phone: string | null }
export interface AccountLite { id: string; name: string; nit: string | null; email: string | null; phone: string | null; city: string | null }
```

- [ ] **Step 3:** Run `npx tsc -p tsconfig.server.json --noEmit && npx tsc -b` — Expected: sin errores (la columna nueva y los tipos nuevos no rompen nada; `ContactRow` se actualiza en Task 2).

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql shared/types.ts
git commit -m "feat(clientes): columna contacts.modified_time + tipos ContactLite/AccountLite"
```

---

## Task 2: `ContactRow` + `contactRowFromZoho` + `upsertContact` con modified_time (TDD)

**Files:** Modify `server/db/rows.ts`, `server/db/mappers.ts`, `server/db/repo.ts`, `server/db/repo.test.ts`

- [ ] **Step 0: En `server/db/rows.ts`** añade `modified_time` a `ContactRow` — reemplaza la línea `account_id: string | null; source: string; managed_by_app: boolean; raw: unknown` por:
```ts
  account_id: string | null; modified_time: string | null; source: string; managed_by_app: boolean; raw: unknown
```

- [ ] **Step 1: En `server/db/repo.test.ts`** añade:
```ts
describe('upsertContact (modified_time + guarda managed_by_app)', () => {
  it('inserta con modified_time y no pisa los managed_by_app', async () => {
    await upsertContact(db, { id: 'c1', first_name: 'Ana', last_name: 'P', email: 'a@b.co', phone: '1', mobile: null, account_id: null, modified_time: '2026-05-01T00:00:00Z', source: 'zoho', managed_by_app: false, raw: {} })
    const row = (await db.query("SELECT first_name, modified_time FROM contacts WHERE id='c1'")).rows[0]
    expect(row.first_name).toBe('Ana')
    expect(row.modified_time).not.toBeNull()
  })
})
```
(Asegura que `upsertContact` esté importado desde `./repo` en `repo.test.ts`.)

- [ ] **Step 2: En `server/db/mappers.ts`** añade `modified_time` a `contactRowFromZoho` (tras `account_id`):
```ts
    account_id: raw.accountId ?? null, modified_time: raw.modifiedTime ?? null, source: 'zoho', managed_by_app: false, raw,
```

- [ ] **Step 3:** Run `npx vitest run server/db/repo.test.ts` — confirm FAIL (columna/param `modified_time` aún no en `upsertContact`).

- [ ] **Step 4: Reemplaza `upsertContact` en `server/db/repo.ts`** por (guarda con SELECT — pg-mem-safe — y `modified_time`):
```ts
export async function upsertContact(db: Queryable, r: ContactRow): Promise<void> {
  const existing = await db.query('SELECT managed_by_app FROM contacts WHERE id=$1', [r.id])
  if (existing.rows[0]?.managed_by_app === true) return
  await db.query(
    `INSERT INTO contacts (id,first_name,last_name,email,phone,mobile,account_id,modified_time,source,managed_by_app,raw,synced_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now())
     ON CONFLICT (id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,email=EXCLUDED.email,
       phone=EXCLUDED.phone,mobile=EXCLUDED.mobile,account_id=EXCLUDED.account_id,modified_time=EXCLUDED.modified_time,
       raw=EXCLUDED.raw,synced_at=now(),updated_at=now()`,
    [r.id, r.first_name, r.last_name, r.email, r.phone, r.mobile, r.account_id, r.modified_time, r.source, r.managed_by_app, J(r.raw)],
  )
}
```

- [ ] **Step 5:** Run `npx vitest run server/db/repo.test.ts && npx tsc -p tsconfig.server.json --noEmit` — Expected: tests PASS; typecheck limpio.

- [ ] **Step 6: Commit**
```bash
git add server/db/rows.ts server/db/mappers.ts server/db/repo.ts server/db/repo.test.ts
git commit -m "feat(clientes): ContactRow/contactRowFromZoho/upsertContact con modified_time (guarda pg-mem-safe)"
```

---

## Task 3: Repo `getContacts` / `getAccounts` (TDD pg-mem)

**Files:** Create `server/db/directory.ts`, `server/db/directory.test.ts`

- [ ] **Step 1: Escribir `server/db/directory.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { getContacts, getAccounts } from './directory'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('directory repo', () => {
  it('getContacts: nombre compuesto + empresa + phone||mobile', async () => {
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,email,mobile,account_id) VALUES ('c1','Ana','Pérez','a@b.co','300','a1')")
    const list = await getContacts(db)
    expect(list[0]).toMatchObject({ id: 'c1', name: 'Ana Pérez', company: 'ACME', email: 'a@b.co', phone: '300' })
  })
  it('getAccounts ordena por nombre', async () => {
    await db.query("INSERT INTO accounts (id,name,nit) VALUES ('a2','Zeta',null)")
    await db.query("INSERT INTO accounts (id,name,nit) VALUES ('a1','Alfa','900')")
    const list = await getAccounts(db)
    expect(list.map((a) => a.name)).toEqual(['Alfa', 'Zeta'])
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/db/directory.test.ts` — confirm FAIL.

- [ ] **Step 3: Implementar `server/db/directory.ts`**
```ts
import type { Queryable } from './migrate'
import type { ContactLite, AccountLite } from '../../shared/types'

export async function getContacts(db: Queryable): Promise<ContactLite[]> {
  const r = await db.query(
    `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.mobile, a.name AS company
     FROM contacts c LEFT JOIN accounts a ON c.account_id=a.id
     ORDER BY lower(c.first_name) NULLS LAST, lower(c.last_name) NULLS LAST`,
  )
  return (r.rows as any[]).map((x) => {
    const name = `${x.first_name ?? ''} ${x.last_name ?? ''}`.trim() || x.email || '—'
    return { id: x.id, name, company: x.company ?? null, email: x.email ?? null, phone: x.phone || x.mobile || null }
  })
}

export async function getAccounts(db: Queryable): Promise<AccountLite[]> {
  const r = await db.query('SELECT id, name, nit, email, phone, city FROM accounts ORDER BY lower(name)')
  return (r.rows as any[]).map((x) => ({ id: x.id, name: x.name ?? '', nit: x.nit ?? null, email: x.email ?? null, phone: x.phone ?? null, city: x.city ?? null }))
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/directory.test.ts` — confirm PASS. (Si pg-mem tropieza con `NULLS LAST` en el ORDER BY de contacts, simplifica a `ORDER BY lower(c.first_name)` y reporta; pero el patrón se usa ya en el repo.)

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/db/directory.ts` — typecheck limpio; eslint 0 errores (WARNINGs `no-explicit-any` aceptables).

- [ ] **Step 6: Commit**
```bash
git add server/db/directory.ts server/db/directory.test.ts
git commit -m "feat(clientes): getContacts + getAccounts"
```

---

## Task 4: `syncContacts` + wiring (TDD)

**Files:** Modify `server/sync.ts`, `server/index.ts`; Create `server/sync.contacts.test.ts`

- [ ] **Step 1: Escribir `server/sync.contacts.test.ts`**
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('syncContacts', () => {
  it('pagina y hace upsert de los contactos de Zoho', async () => {
    const c = { id: 'c1', firstName: 'Ana', lastName: 'P', email: 'a@b.co', modifiedTime: '2026-05-02T00:00:00Z' }
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [c] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    const n = await sync.syncContacts()
    expect(n).toBe(1)
    expect((await db.query("SELECT count(*)::int AS c FROM contacts WHERE id='c1'")).rows[0].c).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/contacts')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/sync.contacts.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/sync.ts`:**
  - En `interface Sync` añade: `syncContacts(): Promise<number>`.
  - Junto a los demás métodos del objeto retornado, añade (usa `ensureAccount`/`upsertContact`/`contactRowFromZoho`, ya disponibles en el scope):
```ts
    async syncContacts(): Promise<number> {
      const wmRow = (await db.query('SELECT max(modified_time) AS m FROM contacts')).rows[0]
      const watermark = wmRow?.m ? new Date(wmRow.m).getTime() : 0
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ from: String(from), limit: String(PAGE_SIZE), sortBy: '-modifiedTime' })
        const res = await zohoFetch(`/contacts?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /contacts ${res.status}`)
        const items = ((await readData(res)).data ?? []) as any[]
        if (items.length === 0) break
        let reachedOld = false
        for (const c of items) {
          await ensureAccount(c.accountId)
          await upsertContact(db, contactRowFromZoho(c))
          total++
          const mt = c.modifiedTime ? new Date(c.modifiedTime).getTime() : 0
          if (watermark && mt <= watermark) reachedOld = true
        }
        if (reachedOld || items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
```

- [ ] **Step 4:** Run `npx vitest run server/sync.contacts.test.ts` — confirm PASS.

- [ ] **Step 5: Actualizar los mocks `Sync`.** Run `npx tsc -p tsconfig.server.json --noEmit` → fallará (TS2741) en los tests con mock de `Sync`. Busca `syncTicketHistory: vi.fn()` en `server/app.test.ts`, `server/auth/routes.test.ts`, `server/backfill.test.ts` y, junto a cada uno, añade `syncContacts: vi.fn(),`. Re-corre `npx tsc -p tsconfig.server.json --noEmit` → limpio.

- [ ] **Step 6: En `server/index.ts`** conecta el sync:
  - Tras el arranque de actividades (`sync.syncActivities().then(...)`), añade:
```ts
  sync.syncContacts()
    .then((n) => console.log(`Contactos: sync inicial (${n})`))
    .catch((e) => console.error('Sync contactos falló:', e))
```
  - En el `setInterval` que encadena `syncRecent → syncActivities`, añade `.then(() => sync.syncContacts())` antes del `.catch`.

- [ ] **Step 7:** Run `npx eslint server/sync.ts server/index.ts` — eslint 0 errores.

- [ ] **Step 8: Commit**
```bash
git add server/sync.ts server/sync.contacts.test.ts server/index.ts server/app.test.ts server/auth/routes.test.ts server/backfill.test.ts
git commit -m "feat(clientes): syncContacts (backfill incremental) + wiring + mocks Sync"
```

---

## Task 5: Endpoints `GET /api/contacts` + `/api/accounts` (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts` añade un bloque:**
```ts
describe('GET /api/contacts y /api/accounts', () => {
  it('listan contactos y empresas (con sesión); 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,email,account_id) VALUES ('c1','Ana','P','a@b.co','a1')")
    const { app } = appWith()
    const c = await request(app).get('/api/contacts').set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.body[0]).toMatchObject({ name: 'Ana P', company: 'ACME' })
    const e = await request(app).get('/api/accounts').set('Cookie', cookie)
    expect(e.body[0]).toMatchObject({ name: 'ACME' })
    expect((await request(app).get('/api/contacts')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`:**
  - Import: `import { getContacts, getAccounts } from './db/directory'`.
  - Junto a las rutas `/api/clients` (Books), añade:
```ts
  app.get('/api/contacts', requireAuth(db), async (_req, res) => {
    try { res.json(await getContacts(db)) } catch (err) { res.status(500).json({ error: String(err) }) }
  })
  app.get('/api/accounts', requireAuth(db), async (_req, res) => {
    try { res.json(await getAccounts(db)) } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts` — Expected: tests PASS; typecheck limpio; eslint 0 errores.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(clientes): GET /api/contacts + /api/accounts (con sesión)"
```

---

## Task 6: Frontend — ClientesPage + tab "Clientes"

**Files:** Modify `src/api/client.ts`; Create `src/components/ClientesPage.tsx`; Modify `src/components/Header.tsx`, `src/App.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `ContactLite, AccountLite` al import de tipos y:
```ts
export function fetchContacts(): Promise<ContactLite[]> {
  return fetch('/api/contacts', { credentials: 'include' }).then((r) => json<ContactLite[]>(r))
}
export function fetchAccounts(): Promise<AccountLite[]> {
  return fetch('/api/accounts', { credentials: 'include' }).then((r) => json<AccountLite[]>(r))
}
```

- [ ] **Step 2: Crear `src/components/ClientesPage.tsx`** (verbatim):
```tsx
import { useMemo, useState } from 'react'
import type { ContactLite, AccountLite } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchContacts, fetchAccounts } from '../api/client'

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
function inicial(s: string): string { const c = (s.trim()[0] || '#').toUpperCase(); return /[A-Z]/.test(c) ? c : '#' }
function iniciales(name: string): string { return name.split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() }

export function ClientesPage({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'contactos' | 'empresas'>('contactos')
  const [q, setQ] = useState('')
  const { data: contactos } = useAsync<ContactLite[]>(() => fetchContacts(), [])
  const { data: empresas } = useAsync<AccountLite[]>(() => fetchAccounts(), [])

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (tab === 'contactos') {
      return (contactos ?? [])
        .filter((c) => !ql || c.name.toLowerCase().includes(ql) || (c.company ?? '').toLowerCase().includes(ql) || (c.email ?? '').toLowerCase().includes(ql))
        .map((c) => ({ id: c.id, name: c.name, letter: inicial(c.name), lines: [c.company, c.email, c.phone].filter(Boolean).join('  ·  ') }))
    }
    return (empresas ?? [])
      .filter((e) => !ql || e.name.toLowerCase().includes(ql) || (e.nit ?? '').includes(ql))
      .map((e) => ({ id: e.id, name: e.name, letter: inicial(e.name), lines: [e.nit ? `NIT ${e.nit}` : null, e.email, e.phone, e.city].filter(Boolean).join('  ·  ') }))
  }, [tab, q, contactos, empresas])

  const lettersPresent = useMemo(() => new Set(rows.map((r) => r.letter)), [rows])
  const firstByLetter = useMemo(() => { const m: Record<string, string> = {}; for (const r of rows) if (!m[r.letter]) m[r.letter] = r.id; return m }, [rows])
  function jump(l: string) { const id = firstByLetter[l]; if (id) document.getElementById(`row-${id}`)?.scrollIntoView({ block: 'start' }) }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Clientes</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[220px] border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 pt-3 text-[11px] font-bold text-slate-400">VISTAS CON ESTRELLAS</div>
          <div className="px-4 py-2 text-[13px] bg-blue-50 text-blue-600 font-medium">{tab === 'contactos' ? 'Todos los Contactos' : 'Todas las Empresas'}</div>
          <div className="px-4 pt-4 text-[11px] font-bold text-slate-400">TODAS LAS VISTAS</div>
          <div className="mt-auto border-t border-slate-200 flex">
            <button onClick={() => setTab('contactos')} className={`flex-1 py-2 text-[12px] ${tab === 'contactos' ? 'text-blue-600 font-bold border-t-2 border-blue-500 -mt-px' : 'text-slate-500'}`}>Contactos</button>
            <button onClick={() => setTab('empresas')} className={`flex-1 py-2 text-[12px] ${tab === 'empresas' ? 'text-blue-600 font-bold border-t-2 border-blue-500 -mt-px' : 'text-slate-500'}`}>Empresas</button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-slate-200 px-4 py-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-amber-400">star</span>
            <h2 className="text-[14px] font-semibold text-slate-700">{tab === 'contactos' ? 'Todos los Contactos' : 'Todas las Empresas'}</h2>
            <span className="text-[12px] text-slate-400">{rows.length} total</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="ml-auto border border-slate-200 rounded px-3 py-1 text-[13px] w-[260px]" />
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {rows.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin resultados.</div>}
              {rows.map((r) => (
                <div key={r.id} id={`row-${r.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[12px] font-bold shrink-0">{iniciales(r.name)}</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 truncate">{r.name}</div>
                    {r.lines && <div className="text-[12px] text-slate-500 truncate">{r.lines}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-7 flex flex-col items-center justify-center text-[10px] select-none shrink-0">
              {LETRAS.map((l) => (
                <button key={l} onClick={() => jump(l)} disabled={!lettersPresent.has(l)} className={`leading-tight ${lettersPresent.has(l) ? 'text-blue-500 hover:font-bold' : 'text-slate-300 cursor-default'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: En `src/components/Header.tsx`:**
  - Añade `onOpenClientes: () => void` a la firma de props de `Header` (junto a `onOpenAnalisis`) y destructúralo.
  - En el `.map` de `NAV_TABS`, cambia el `onClick` del botón para incluir "Clientes". Reemplaza el `onClick` actual por:
```tsx
                            onClick={
                                tab.label === 'Análisis' && user?.isAdmin ? onOpenAnalisis
                                : tab.label === 'Clientes' ? onOpenClientes
                                : undefined
                            }
```
  - En la `className` del botón, donde añade `cursor-pointer` para Análisis, inclúyelo también para Clientes (p.ej. añade `${(tab.label === 'Análisis' && user?.isAdmin) || tab.label === 'Clientes' ? 'cursor-pointer' : ''}` si existe esa parte; si no, no es bloqueante).

- [ ] **Step 4: En `src/App.tsx`:**
  - Import: `import { ClientesPage } from './components/ClientesPage'`.
  - Estado: `const [showClientes, setShowClientes] = useState(false)`.
  - Pasa `onOpenClientes={() => setShowClientes(true)}` al `<Header .../>`.
  - Junto a los otros overlays añade: `{showClientes && <ClientesPage onClose={() => setShowClientes(false)} />}`.

- [ ] **Step 5:** Run `npx tsc -b && npx vite build && npx eslint src/components/ClientesPage.tsx src/components/Header.tsx src/App.tsx src/api/client.ts` — Expected: sin errores de tipos; build OK; eslint 0 errores.

- [ ] **Step 6: Commit**
```bash
git add src/api/client.ts src/components/ClientesPage.tsx src/components/Header.tsx src/App.tsx
git commit -m "feat(clientes): ClientesPage (Contactos/Empresas + A-Z + búsqueda) + tab 'Clientes'"
```

---

## Task 7: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. En el log: `Contactos: sync inicial (N)`; en PgWeb `SELECT count(*) FROM contacts;` sube mucho.
2. Clic en el tab **"Clientes"** → directorio con avatar/nombre/empresa/email/teléfono; el índice **A-Z** salta a la letra; el **buscador** filtra; el toggle cambia a **Empresas**.
3. Sin sesión, `GET /api/contacts` responde 401.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(clientes): directorio verificado"
```

---

## Notas de cierre
- **D1 = directorio** (lectura). El **detalle** (clic → ficha + tickets) es **D2** (siguiente).
- `syncContacts` corre en arranque + cada ciclo del intervalo (incremental por `modified_time`).
- Búsqueda y A-Z en cliente (lista acotada). Sidebar/“Vista clásica” decorativos.
