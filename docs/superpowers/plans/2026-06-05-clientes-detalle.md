# D2 — Detalle de Cliente (Contacto / Empresa) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Al hacer clic en un contacto/empresa del directorio, abrir su detalle (maestro-detalle) replicando Zoho: columna de Propiedades + cabecera + pestañas + INFORMACIÓN GENERAL (KPIs + tickets + dona de canal + tiempos).

**Architecture:** Endpoints `GET /api/contacts/:id` y `/api/accounts/:id` devuelven info + `tickets` (lite) + (empresa) `contacts`; el frontend (`ClienteDetalle`) calcula KPIs/dona/tiempos. `ClientesPage` pasa a maestro-detalle (lista a la izquierda, detalle a la derecha). Clic en ticket → abre `TicketDetailView` (vía App); "Agregar Ticket" → `CreateTicket`.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest + supertest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-clientes-detalle-design.md`.

**Contexto del repo:**
- `tickets`: `contact_id`, `account_id`, `number`, `subject`, `status`, `status_type`, `channel`, `created_time`, `closed_time`, `due_date`.
- `server/db/directory.ts`: ya tiene `getContacts`/`getAccounts`. `shared/types.ts`: `ContactLite`/`AccountLite`.
- `server/app.ts`: `/api/contacts` y `/api/accounts` (lista) con `requireAuth(db)`; importa `getContacts, getAccounts` de `./db/directory`.
- `src/App.tsx`: `{showClientes && <ClientesPage onClose=… />}` (línea ~104), `CreateTicket` (`setShowCreate`), `selectedTicketId`/`setSelectedTicketId`.
- `src/components/ClientesPage.tsx` (D1): firma `({ onClose })`; filas en `rows.map`.

---

## Estructura de archivos
- Modify `shared/types.ts` — `TicketLite`, `ContactDetail`, `AccountDetail`.
- Modify `server/db/directory.ts` (+ `directory.test.ts`) — `getContactDetail`, `getAccountDetail`.
- Modify `server/app.ts` (+ `app.test.ts`) — endpoints `:id`.
- Modify `src/api/client.ts`; Create `src/components/ClienteDetalle.tsx`; Modify `src/components/ClientesPage.tsx`, `src/App.tsx`.

---

## Task 1: Tipos del detalle

**Files:** Modify `shared/types.ts`

- [ ] **Step 1: Añadir al final de `shared/types.ts`:**
```ts
export interface TicketLite { id: string; number: string; subject: string; status: string; statusType: string | null; channel: string | null; createdAt: string | null; closedAt: string | null; dueDate: string | null }
export interface ContactDetail { id: string; name: string; email: string | null; phone: string | null; mobile: string | null; company: string | null; companyId: string | null; owner: string | null; createdAt: string | null; tickets: TicketLite[] }
export interface AccountDetail { id: string; name: string; nit: string | null; email: string | null; phone: string | null; city: string | null; address: string | null; website: string | null; owner: string | null; createdAt: string | null; tickets: TicketLite[]; contacts: ContactLite[] }
```

- [ ] **Step 2:** Run `npx tsc -p tsconfig.server.json --noEmit && npx tsc -b` — Expected: sin errores.

- [ ] **Step 3: Commit**
```bash
git add shared/types.ts
git commit -m "feat(clientes-d2): tipos TicketLite/ContactDetail/AccountDetail"
```

---

## Task 2: Repo `getContactDetail` / `getAccountDetail` (TDD pg-mem)

**Files:** Modify `server/db/directory.ts`, `server/db/directory.test.ts`

- [ ] **Step 1: En `server/db/directory.test.ts`** añade:
```ts
describe('directory detail', () => {
  it('getContactDetail: info + company + tickets por contact_id', async () => {
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,email,account_id) VALUES ('c1','Ana','P','a@b.co','a1')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,channel,contact_id,created_time) VALUES ('t1',5,'Asunto','Finalizado','Closed','Email','c1',now())")
    const d = await getContactDetail(db, 'c1')
    expect(d).toMatchObject({ id: 'c1', name: 'Ana P', company: 'ACME' })
    expect(d!.tickets).toHaveLength(1)
    expect(d!.tickets[0]).toMatchObject({ number: '#5', subject: 'Asunto', channel: 'Email' })
  })
  it('getAccountDetail: info + tickets + contactos por account_id', async () => {
    await db.query("INSERT INTO accounts (id,name,nit) VALUES ('a1','ACME','900')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,account_id) VALUES ('c1','Ana','P','a1')")
    await db.query("INSERT INTO tickets (id,number,subject,status,account_id,created_time) VALUES ('t1',5,'X','Ingresado','a1',now())")
    const d = await getAccountDetail(db, 'a1')
    expect(d).toMatchObject({ id: 'a1', name: 'ACME', nit: '900' })
    expect(d!.tickets).toHaveLength(1)
    expect(d!.contacts.map((c) => c.id)).toEqual(['c1'])
  })
  it('null si no existe', async () => {
    expect(await getContactDetail(db, 'nope')).toBeNull()
  })
})
```
(Añade `getContactDetail, getAccountDetail` al import desde `./directory` en el test.)

- [ ] **Step 2:** Run `npx vitest run server/db/directory.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/db/directory.ts`** añade (importa `ContactDetail, AccountDetail, TicketLite` desde `../../shared/types`):
```ts
async function ticketsLite(db: Queryable, col: 'contact_id' | 'account_id', id: string): Promise<TicketLite[]> {
  const r = await db.query(
    `SELECT id, number, subject, status, status_type, channel, created_time, closed_time, due_date
     FROM tickets WHERE ${col}=$1 ORDER BY created_time DESC NULLS LAST`, [id])
  return (r.rows as any[]).map((x) => ({
    id: x.id, number: `#${x.number}`, subject: x.subject ?? '', status: x.status ?? '',
    statusType: x.status_type ?? null, channel: x.channel ?? null,
    createdAt: x.created_time ?? null, closedAt: x.closed_time ?? null, dueDate: x.due_date ?? null,
  }))
}

function parseRaw(raw: unknown): any { return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {}) }

export async function getContactDetail(db: Queryable, id: string): Promise<ContactDetail | null> {
  const r = await db.query('SELECT c.*, a.name AS company FROM contacts c LEFT JOIN accounts a ON c.account_id=a.id WHERE c.id=$1', [id])
  const row = (r.rows as any[])[0]
  if (!row) return null
  const raw = parseRaw(row.raw)
  return {
    id: row.id, name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || row.email || '—',
    email: row.email ?? null, phone: row.phone ?? null, mobile: row.mobile ?? null,
    company: row.company ?? null, companyId: row.account_id ?? null,
    owner: raw.owner?.name ?? null, createdAt: raw.createdTime ?? row.created_at ?? null,
    tickets: await ticketsLite(db, 'contact_id', id),
  }
}

export async function getAccountDetail(db: Queryable, id: string): Promise<AccountDetail | null> {
  const r = await db.query('SELECT * FROM accounts WHERE id=$1', [id])
  const row = (r.rows as any[])[0]
  if (!row) return null
  const raw = parseRaw(row.raw)
  const cr = await db.query('SELECT id, first_name, last_name, email, phone, mobile FROM contacts WHERE account_id=$1 ORDER BY lower(first_name) NULLS LAST', [id])
  const contacts = (cr.rows as any[]).map((x) => ({
    id: x.id, name: `${x.first_name ?? ''} ${x.last_name ?? ''}`.trim() || x.email || '—',
    company: row.name ?? null, email: x.email ?? null, phone: x.phone || x.mobile || null,
  }))
  return {
    id: row.id, name: row.name ?? '', nit: row.nit ?? null, email: row.email ?? null, phone: row.phone ?? null,
    city: row.city ?? null, address: row.address ?? null, website: row.website ?? null,
    owner: raw.owner?.name ?? null, createdAt: raw.createdTime ?? row.created_at ?? null,
    tickets: await ticketsLite(db, 'account_id', id), contacts,
  }
}
```

- [ ] **Step 4:** Run `npx vitest run server/db/directory.test.ts` — confirm PASS.

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/db/directory.ts` — typecheck limpio; eslint 0 errores (WARNINGs `no-explicit-any` aceptables).

- [ ] **Step 6: Commit**
```bash
git add server/db/directory.ts server/db/directory.test.ts
git commit -m "feat(clientes-d2): getContactDetail + getAccountDetail (info + tickets + contactos)"
```

---

## Task 3: Endpoints `:id` (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: En `server/app.test.ts` añade un bloque:**
```ts
describe('GET /api/contacts/:id y /api/accounts/:id', () => {
  it('detalle (con sesión); 404 inexistente; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,account_id) VALUES ('c1','Ana','P','a1')")
    const { app } = appWith()
    expect((await request(app).get('/api/contacts/c1').set('Cookie', cookie)).body).toMatchObject({ name: 'Ana P' })
    expect((await request(app).get('/api/accounts/a1').set('Cookie', cookie)).body).toMatchObject({ name: 'ACME' })
    expect((await request(app).get('/api/contacts/nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get('/api/contacts/c1')).status).toBe(401)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts` — confirm FAIL.

- [ ] **Step 3: En `server/app.ts`:**
  - Cambia el import de directory a: `import { getContacts, getAccounts, getContactDetail, getAccountDetail } from './db/directory'`.
  - Junto a las rutas `/api/contacts` y `/api/accounts` (lista), añade:
```ts
  app.get('/api/contacts/:id', requireAuth(db), async (req, res) => {
    try { const d = await getContactDetail(db, String(req.params.id)); if (!d) { res.status(404).json({ error: 'No encontrado' }); return } res.json(d) }
    catch (err) { res.status(500).json({ error: String(err) }) }
  })
  app.get('/api/accounts/:id', requireAuth(db), async (req, res) => {
    try { const d = await getAccountDetail(db, String(req.params.id)); if (!d) { res.status(404).json({ error: 'No encontrado' }); return } res.json(d) }
    catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts && npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts` — Expected: tests PASS; typecheck limpio; eslint 0 errores.

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(clientes-d2): GET /api/contacts/:id + /api/accounts/:id"
```

---

## Task 4: Frontend — cliente + `ClienteDetalle`

**Files:** Modify `src/api/client.ts`; Create `src/components/ClienteDetalle.tsx`

- [ ] **Step 1: En `src/api/client.ts`** añade `ContactDetail, AccountDetail` al import de tipos y:
```ts
export function fetchContactDetail(id: string): Promise<ContactDetail> {
  return fetch(`/api/contacts/${id}`, { credentials: 'include' }).then((r) => json<ContactDetail>(r))
}
export function fetchAccountDetail(id: string): Promise<AccountDetail> {
  return fetch(`/api/accounts/${id}`, { credentials: 'include' }).then((r) => json<AccountDetail>(r))
}
```

- [ ] **Step 2: Crear `src/components/ClienteDetalle.tsx`** (verbatim):
```tsx
import { useMemo, useState } from 'react'
import type { ContactDetail, AccountDetail, TicketLite } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchContactDetail, fetchAccountDetail } from '../api/client'

function iniciales(name: string): string { return name.split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() }
function fmtFecha(s: string | null): string { if (!s) return ''; const d = new Date(s); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtFechaHora(s: string | null): string { if (!s) return '—'; const d = new Date(s); return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

const CLOSED = 'Closed'
const esAbierto = (t: TicketLite) => t.statusType !== CLOSED
const esEspera = (t: TicketLite) => /espera/i.test(t.status)
const esAtrasado = (t: TicketLite) => !!t.dueDate && new Date(t.dueDate).getTime() < Date.now() && esAbierto(t)
function badgeClass(t: TicketLite): string {
  if (t.statusType === CLOSED || /finaliz/i.test(t.status)) return 'bg-green-50 text-green-600 border-green-200'
  if (/espera/i.test(t.status)) return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-blue-50 text-blue-600 border-blue-200'
}

const TABS_CONTACTO = ['INFORMACIÓN GENERAL', 'HISTORIA', 'ACTIVIDADES', 'INTERACCIÓN CON TICKET', 'TICKETS', 'ENTRADA DE TIEMPO', 'CALIFICACIÓN DE SATISFACCIÓN', 'PRODUCTOS']
const TABS_EMPRESA = ['INFORMACIÓN GENERAL', 'HISTORIA', 'ACTIVIDADES', 'INTERACCIÓN CON TICKET', 'TICKETS', 'ENTRADA DE TIEMPO', 'CONTACTOS', 'CALIFICACIÓN DE SATISFACCIÓN', 'PRODUCTOS']

function Prop({ label, value }: { label: string; value: string | null }) {
  return <div className="mb-4"><div className="text-[11px] text-slate-400">{label}</div><div className="text-[13px] text-slate-700 break-words">{value || '—'}</div></div>
}
function Kpi({ label, value, red }: { label: string; value: string; red?: boolean }) {
  return <div className="bg-white border border-slate-200 rounded-md p-4"><div className="text-[12px] text-slate-500">{label}</div><div className={`text-[24px] font-bold ${red ? 'text-red-500' : 'text-slate-800'}`}>{value}</div></div>
}
function Tiempo({ label, value }: { label: string; value: string }) {
  return <div className="mb-3"><div className="flex justify-between text-[12px] text-slate-600"><span>{label}</span><span className="font-bold">{value}</span></div><div className="h-1 bg-slate-100 rounded mt-1"><div className="h-1 bg-blue-400 rounded" style={{ width: value === '00:00' ? '0%' : '60%' }} /></div></div>
}
function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const colors = ['#2C7BE5', '#22c55e', '#f59e0b', '#a855f7', '#64748b']
  const r = 52, c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-6">
      <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#eef2f7" strokeWidth="16" />
        {data.map((d, i) => {
          const frac = d.value / total
          const el = <circle key={i} cx="65" cy="65" r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth="16" strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-acc * c} />
          acc += frac
          return el
        })}
      </svg>
      <div className="flex flex-col gap-1 text-[12px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />{d.value} {d.label} ({Math.round((d.value / total) * 100)}%)</div>
        ))}
      </div>
    </div>
  )
}

export function ClienteDetalle({ kind, id, onSelectTicket, onSelectContacto, onAgregarTicket }: {
  kind: 'contacto' | 'empresa'; id: string
  onSelectTicket: (id: string) => void
  onSelectContacto: (id: string) => void
  onAgregarTicket: () => void
}) {
  const { data, loading } = useAsync<ContactDetail | AccountDetail>(() => (kind === 'contacto' ? fetchContactDetail(id) : fetchAccountDetail(id)), [kind, id])
  const [tab, setTab] = useState('INFORMACIÓN GENERAL')
  const [sub, setSub] = useState<'todo' | 'abierto' | 'espera'>('todo')

  const tickets = useMemo(() => data?.tickets ?? [], [data])
  const abiertos = useMemo(() => tickets.filter(esAbierto), [tickets])
  const espera = useMemo(() => tickets.filter(esEspera), [tickets])
  const atrasados = useMemo(() => tickets.filter(esAtrasado), [tickets])
  const visibles = sub === 'abierto' ? abiertos : sub === 'espera' ? espera : tickets
  const canal = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tickets) { const k = t.channel || 'Otro'; m.set(k, (m.get(k) ?? 0) + 1) }
    return [...m.entries()].map(([label, value]) => ({ label, value }))
  }, [tickets])
  const resolucion = useMemo(() => {
    const cer = tickets.filter((t) => t.statusType === CLOSED && t.createdAt && t.closedAt)
    if (!cer.length) return '00:00'
    const ms = cer.reduce((s, t) => s + (new Date(t.closedAt!).getTime() - new Date(t.createdAt!).getTime()), 0) / cer.length
    return `${Math.floor(ms / 3600000)}:${String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')}`
  }, [tickets])

  if (loading && !data) return <div className="flex-1 p-6 text-[13px] text-slate-400">Cargando…</div>
  if (!data) return <div className="flex-1 p-6 text-[13px] text-slate-400">No encontrado.</div>

  const acc = kind === 'empresa' ? (data as AccountDetail) : null
  const con = kind === 'contacto' ? (data as ContactDetail) : null
  const tabs = kind === 'empresa' ? TABS_EMPRESA : TABS_CONTACTO

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[290px] border-r border-slate-200 overflow-y-auto p-4 shrink-0">
        <div className="text-[13px] font-bold text-slate-700 mb-4">Propiedades de {kind === 'empresa' ? 'Empresa' : 'Contacto'}</div>
        <Prop label={`Propietario de ${kind === 'empresa' ? 'Empresa' : 'Contacto'}`} value={data.owner} />
        <Prop label="Correo electrónico" value={data.email} />
        {con && <Prop label="Número de móvil" value={con.mobile} />}
        <Prop label="Número de teléfono" value={data.phone} />
        {acc && <Prop label="Página web" value={acc.website} />}
        <Prop label="Dirección" value={acc?.address ?? null} />
        {acc && <Prop label="NIT" value={acc.nit} />}
        <Prop label={`Hora de creación de ${kind === 'empresa' ? 'Empresa' : 'Contact'}`} value={fmtFechaHora(data.createdAt)} />
        <Prop label="Diseño" value="Ambientalia Soporte y Servicio Técnico" />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[13px] font-bold shrink-0">{iniciales(data.name)}</div>
          <div className="min-w-0">
            <div className="text-[16px] font-bold text-slate-800 truncate">{data.name}</div>
            {con?.company && <div className="text-[12px] text-slate-500 truncate">{con.company}</div>}
          </div>
          <button onClick={onAgregarTicket} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold flex items-center gap-1 shrink-0"><span className="material-symbols-outlined text-[16px]">add</span>Agregar Ticket</button>
        </div>
        <nav className="px-6 flex gap-5 border-b border-slate-200 overflow-x-auto hide-scrollbar">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-[11px] font-bold py-2 whitespace-nowrap ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>{t}</button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto p-6 bg-[#f7f8fa]">
          {tab === 'INFORMACIÓN GENERAL' && (
            <div className="flex flex-col gap-6 max-w-[1100px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Kpi label="Todas las Tickets" value={String(tickets.length)} />
                <Kpi label="Tickets abierto" value={String(abiertos.length)} />
                <Kpi label="Tickets atrasados" value={String(atrasados.length)} red />
                <Kpi label="Calificación de satisfacción" value="0 %" />
              </div>
              <section className="bg-white border border-slate-200 rounded-md">
                <div className="px-4 pt-3 text-[13px] font-bold text-slate-700">Tickets</div>
                <div className="px-4 flex gap-4 border-b border-slate-200 text-[12px]">
                  <button onClick={() => setSub('todo')} className={`py-2 ${sub === 'todo' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-slate-500'}`}>TODO ({tickets.length})</button>
                  <button onClick={() => setSub('abierto')} className={`py-2 ${sub === 'abierto' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-slate-500'}`}>ABIERTO ({abiertos.length})</button>
                  <button onClick={() => setSub('espera')} className={`py-2 ${sub === 'espera' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-slate-500'}`}>EN ESPERA ({espera.length})</button>
                </div>
                {visibles.length === 0 && <div className="p-6 text-center text-[13px] text-slate-400">No hay ningún Tickets disponible</div>}
                {visibles.map((t) => (
                  <button key={t.id} onClick={() => onSelectTicket(t.id)} className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">mail</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-slate-700 truncate">{t.subject}</div>
                      <div className="text-[11px] text-slate-400 truncate">{t.number} · {fmtFecha(t.createdAt)}</div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded border shrink-0 ${badgeClass(t)}`}>{t.status}</span>
                  </button>
                ))}
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[13px] font-bold text-slate-700 mb-3">Análisis del tráfico</div>
                  {tickets.length ? <Donut data={canal} /> : <div className="text-[13px] text-slate-400">Sin datos.</div>}
                </section>
                <section className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[13px] font-bold text-slate-700 mb-3">Tiempo promedio de operación <span className="text-[11px] text-slate-400 font-normal">Últimos 6 meses</span></div>
                  <Tiempo label="Tiempo de primera respuesta" value="00:00" />
                  <Tiempo label="Tiempo de respuesta" value="00:00" />
                  <Tiempo label="Tiempo de resolución" value={resolucion} />
                </section>
              </div>
            </div>
          )}
          {tab === 'CONTACTOS' && acc && (
            <div className="max-w-[700px] bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
              {acc.contacts.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin contactos.</div>}
              {acc.contacts.map((c) => (
                <button key={c.id} onClick={() => onSelectContacto(c.id)} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold">{iniciales(c.name)}</div>
                  <div className="min-w-0"><div className="text-[13px] font-bold text-slate-800 truncate">{c.name}</div><div className="text-[12px] text-slate-500 truncate">{[c.email, c.phone].filter(Boolean).join('  ·  ')}</div></div>
                </button>
              ))}
            </div>
          )}
          {tab !== 'INFORMACIÓN GENERAL' && tab !== 'CONTACTOS' && <div className="text-center text-[13px] text-slate-400 py-10">Pronto.</div>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3:** Run `npx tsc -b && npx vite build && npx eslint src/components/ClienteDetalle.tsx src/api/client.ts` — Expected: sin errores de tipos; build OK; eslint 0 errores.

- [ ] **Step 4: Commit**
```bash
git add src/api/client.ts src/components/ClienteDetalle.tsx
git commit -m "feat(clientes-d2): ClienteDetalle (propiedades + KPIs + tickets + dona + tiempos)"
```

---

## Task 5: `ClientesPage` maestro-detalle + wiring en App

**Files:** Modify `src/components/ClientesPage.tsx`, `src/App.tsx`

- [ ] **Step 1: Reemplaza TODO el contenido de `src/components/ClientesPage.tsx`** por:
```tsx
import { useMemo, useState } from 'react'
import type { ContactLite, AccountLite } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchContacts, fetchAccounts } from '../api/client'
import { ClienteDetalle } from './ClienteDetalle'

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
function inicial(s: string): string { const c = (s.trim()[0] || '#').toUpperCase(); return /[A-Z]/.test(c) ? c : '#' }
function iniciales(name: string): string { return name.split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() }

export function ClientesPage({ onClose, onSelectTicket, onAgregarTicket }: { onClose: () => void; onSelectTicket: (id: string) => void; onAgregarTicket: () => void }) {
  const [tab, setTab] = useState<'contactos' | 'empresas'>('contactos')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(null)
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
  const kind: 'contacto' | 'empresa' = tab === 'contactos' ? 'contacto' : 'empresa'

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Clientes</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[200px] border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 pt-3 text-[11px] font-bold text-slate-400">VISTAS CON ESTRELLAS</div>
          <div className="px-4 py-2 text-[13px] bg-blue-50 text-blue-600 font-medium">{tab === 'contactos' ? 'Todos los Contactos' : 'Todas las Empresas'}</div>
          <div className="px-4 pt-4 text-[11px] font-bold text-slate-400">TODAS LAS VISTAS</div>
          <div className="mt-auto border-t border-slate-200 flex">
            <button onClick={() => { setTab('contactos'); setSelected(null) }} className={`flex-1 py-2 text-[12px] ${tab === 'contactos' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>Contactos</button>
            <button onClick={() => { setTab('empresas'); setSelected(null) }} className={`flex-1 py-2 text-[12px] ${tab === 'empresas' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>Empresas</button>
          </div>
        </div>
        <div className="w-[320px] border-r border-slate-200 flex flex-col shrink-0 min-w-0">
          <div className="border-b border-slate-200 px-3 py-2 flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-700">{rows.length}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="ml-auto border border-slate-200 rounded px-2 py-1 text-[12px] w-[170px]" />
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {rows.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin resultados.</div>}
              {rows.map((r) => (
                <button key={r.id} id={`row-${r.id}`} onClick={() => setSelected({ kind, id: r.id })} className={`w-full text-left flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 ${selected?.id === r.id ? 'bg-blue-50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0">{iniciales(r.name)}</div>
                  <div className="min-w-0"><div className="text-[13px] font-bold text-slate-800 truncate">{r.name}</div>{r.lines && <div className="text-[11px] text-slate-500 truncate">{r.lines}</div>}</div>
                </button>
              ))}
            </div>
            <div className="w-6 flex flex-col items-center justify-center text-[10px] select-none shrink-0">
              {LETRAS.map((l) => (
                <button key={l} onClick={() => jump(l)} disabled={!lettersPresent.has(l)} className={`leading-tight ${lettersPresent.has(l) ? 'text-blue-500 hover:font-bold' : 'text-slate-300 cursor-default'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        {selected
          ? <ClienteDetalle key={`${selected.kind}-${selected.id}`} kind={selected.kind} id={selected.id} onSelectTicket={onSelectTicket} onSelectContacto={(cid) => setSelected({ kind: 'contacto', id: cid })} onAgregarTicket={onAgregarTicket} />
          : <div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">Selecciona un contacto o empresa.</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: En `src/App.tsx`** actualiza el render de `ClientesPage` (línea ~104) a:
```tsx
      {showClientes && <ClientesPage onClose={() => setShowClientes(false)} onSelectTicket={(id) => { setShowClientes(false); setSelectedTicketId(id) }} onAgregarTicket={() => setShowCreate(true)} />}
```

- [ ] **Step 3:** Run `npx tsc -b && npx vite build && npx eslint src/components/ClientesPage.tsx src/App.tsx` — Expected: sin errores de tipos; build OK; eslint 0 errores.

- [ ] **Step 4: Commit**
```bash
git add src/components/ClientesPage.tsx src/App.tsx
git commit -m "feat(clientes-d2): ClientesPage maestro-detalle + wiring (abrir ticket / nuevo ticket)"
```

---

## Task 6: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Tab **Clientes** → clic en un contacto → se abre el detalle (Propiedades + KPIs + Tickets + dona + tiempos), como la imagen.
2. Sub-tabs TODO/ABIERTO/EN ESPERA filtran; clic en un ticket → abre el detalle del ticket.
3. Toggle **Empresas** → clic en una empresa → su detalle + pestaña **CONTACTOS** (clic → ficha del contacto).
4. Botón **"Agregar Ticket"** abre "Nuevo ticket".
5. Sin sesión, `GET /api/contacts/:id` responde 401; inexistente 404.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(clientes-d2): detalle verificado"
```

---

## Notas de cierre
- **Reales**: info, tickets, conteos, dona por canal, tiempo de resolución. **Placeholder**: CSAT (`0 %`) y tiempos de 1ª/2ª respuesta (`00:00`).
- Pestañas extra → "Pronto"; CONTACTOS (empresa) e INFORMACIÓN GENERAL funcionan.
- Clic en ticket cierra Clientes y abre `TicketDetailView` (vía App).
