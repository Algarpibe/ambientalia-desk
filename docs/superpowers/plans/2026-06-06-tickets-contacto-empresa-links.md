# Contacto + Empresa accionables en vistas de tickets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Kanban/lista/tabla mostrar el nombre del contacto además de la empresa, y que ambos sean enlaces que abren el detalle de Contacto/Empresa en Clientes.

**Architecture:** `Ticket` gana contactName/contactId/accountId (poblados por `getActiveTickets`/`getAllTickets` con join a `contacts` + `rowToTicket`). Un componente `ClienteLink` (enlace o texto) se usa en `TicketCard`/`TicketList`/`TicketTable`. El clic llama `onOpenCliente(kind,id)` que `App` enruta abriendo `ClientesPage` con `initial`.

**Tech Stack:** TS ESM, Express 5, pg-mem, Vitest + supertest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-06-tickets-contacto-empresa-links-design.md`.

**Contexto del repo:**
- `shared/types.ts` `Ticket`: tiene `company: string` (no nullable), `assignee?`, etc.
- `server/db/mappers.ts`: `TicketRefs { accountName?; agentName? }`; `rowToTicket(row, refs)` arma el `Ticket`. `TicketRow` (de `SELECT t.*`) tiene `contact_id`, `account_id`.
- `server/db/repo.ts`: `getActiveTickets`/`getAllTickets` hacen `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name FROM tickets t LEFT JOIN accounts a … LEFT JOIN agents g … LEFT JOIN clients cl …` y mapean `refs: { accountName: row.account_name, agentName: row.agent_name }`. `getTicketWithRefs` ya hace el join a contacts y `[row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null`.
- `server/db/mappers.test.ts`: `baseTicketRow()` (con `contact_id:'c1'`, `account_id:'a1'`); test `rowToTicket arma la tarjeta` usa `rowToTicket(baseTicketRow(), { accountName, agentName })`.
- `server/app.test.ts`: test `GET /api/tickets` inserta account `a1` y un ticket con `account_id:'a1'`; usa `adminCookie()`, `appWith()`, `request`.
- `src/components/TicketCard.tsx`: prop `{ ticket, onClick }`; muestra `{ticket.company}` en una línea (≈L43-45). Importa `Ticket` de `../data/mockData` (reexport de shared/types).
- `src/components/TicketList.tsx`: `{ tickets, dense, onSelect }`; sublínea `… · {t.company} · {t.time}` (≈L19).
- `src/components/TicketTable.tsx`: `{ tickets, onSelect }`; `COLS = ['#','Asunto','Cliente','Estado','Prioridad','Propietario','Creado','Vencimiento','Días entrega','Canal']`; celda `<td …>{t.company}</td>`.
- `src/components/KanbanBoard.tsx`: `{ columns, groups, hideEmpty, loading, onSelect }`; renderiza `<TicketCard … onClick={() => onSelect(ticket.id)} />`.
- `src/App.tsx`: `const [showClientes, setShowClientes] = useState(false)`; `onOpenClientes={() => setShowClientes(true)}`; modos con `<KanbanBoard … onSelect={setSelectedTicketId} />`, `<TicketList tickets={base} … onSelect={setSelectedTicketId} />`, `<TicketTable tickets={base} onSelect={setSelectedTicketId} />`; `{showClientes && <ClientesPage onClose=… onSelectTicket=… onAgregarTicket=… />}`.
- `src/components/ClientesPage.tsx`: props `{ onClose, onSelectTicket, onAgregarTicket }`; `useState<'contactos'|'empresas'>('contactos')`; `useState<{kind;id}|null>(null)`.

---

## Estructura de archivos
- Modify `shared/types.ts` — campos en `Ticket`.
- Modify `server/db/mappers.ts` (+ `mappers.test.ts`) — `TicketRefs.contactName` + `rowToTicket`.
- Modify `server/db/repo.ts` (+ `server/app.test.ts`) — joins a contacts.
- Create `src/components/ClienteLink.tsx`.
- Modify `src/components/TicketCard.tsx`, `TicketList.tsx`, `TicketTable.tsx`, `KanbanBoard.tsx`.
- Modify `src/App.tsx`, `src/components/ClientesPage.tsx`.

---

## Task 1: `Ticket` + `rowToTicket` (TDD)

**Files:** Modify `shared/types.ts`, `server/db/mappers.ts`, `server/db/mappers.test.ts`

- [ ] **Step 1: En `shared/types.ts` `Ticket`** (tras `diasEntrega?: string | null`) añade:
```ts
  contactName?: string | null
  contactId?: string | null
  accountId?: string | null
```

- [ ] **Step 2: Añadir aserciones al test** `server/db/mappers.test.ts` dentro del `it('rowToTicket arma la tarjeta', …)` (tras `expect(t.assignee?.name)…`), y pasar `contactName` en los refs. Reemplaza ese `it` por:
```ts
  it('rowToTicket arma la tarjeta', () => {
    const t = rowToTicket(baseTicketRow(), { accountName: 'Gecelca S.A. E.S.P.', agentName: 'Equipo Técnico', contactName: 'Sebastián Laguna' })
    expect(t.number).toBe('#941')
    expect(t.title).toBe('Servicio X')
    expect(t.company).toBe('Gecelca S.A. E.S.P.')
    expect(t.status).toBe('Notificación cliente')
    expect(t.assignee?.name).toBe('Equipo Técnico')
    expect(t.contactName).toBe('Sebastián Laguna')
    expect(t.contactId).toBe('c1')
    expect(t.accountId).toBe('a1')
  })
```

- [ ] **Step 3:** Run `npx vitest run server/db/mappers.test.ts` — confirm FAIL (contactName/contactId/accountId undefined).

- [ ] **Step 4: En `server/db/mappers.ts`:**
  - `TicketRefs`: cambia a `export interface TicketRefs { accountName?: string | null; agentName?: string | null; contactName?: string | null }`.
  - En `rowToTicket`, dentro del objeto devuelto (tras `diasEntrega: …,`) añade:
```ts
    contactName: refs.contactName ?? null,
    contactId: row.contact_id ?? null,
    accountId: row.account_id ?? null,
```

- [ ] **Step 5:** Run `npx vitest run server/db/mappers.test.ts` — confirm PASS.

- [ ] **Step 6:** Run `npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint shared/types.ts server/db/mappers.ts` — sin errores; eslint 0.

- [ ] **Step 7: Commit**
```bash
git add shared/types.ts server/db/mappers.ts server/db/mappers.test.ts
git commit -m "feat(tickets-links): Ticket.contactName/contactId/accountId en rowToTicket"
```

---

## Task 2: `getActiveTickets`/`getAllTickets` traen el contacto (TDD)

**Files:** Modify `server/db/repo.ts`, `server/app.test.ts`

- [ ] **Step 1: Extender el test `GET /api/tickets`** en `server/app.test.ts`. En el caso `devuelve tickets activos normalizados desde Postgres`, añade un contacto y la aserción. Reemplaza el cuerpo del `it` por:
```ts
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'AGQ' } as any))
    await db.query("INSERT INTO contacts (id,first_name,last_name) VALUES ('c1','Sebastián','Laguna')")
    await upsertTicket(db, { ...ticketRowFromZoho({ id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado', statusType: 'Open', customFields: {} } as any), account_id: 'a1', contact_id: 'c1' })
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado', contactName: 'Sebastián Laguna', contactId: 'c1', accountId: 'a1' })
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts -t "tickets activos"` — confirm FAIL (contactName undefined).

- [ ] **Step 3: En `server/db/repo.ts`**, en AMBAS funciones `getActiveTickets` y `getAllTickets`:
  - Añade el join y columnas. El `SELECT` pasa de
    `SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name`
    a:
```sql
SELECT t.*, COALESCE(a.name, cl.name) AS account_name, g.name AS agent_name, c.first_name AS c_first, c.last_name AS c_last
```
  - Añade el join (tras el join de `clients cl`):
```sql
     LEFT JOIN contacts c ON t.contact_id=c.id
```
  - En el `.map`, cambia el `refs` a:
```ts
    refs: { accountName: row.account_name, agentName: row.agent_name, contactName: [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null }
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts` — confirm PASS (todo el archivo).

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/db/repo.ts` — typecheck limpio; eslint 0 (warnings `no-explicit-any` aceptables).

- [ ] **Step 6: Commit**
```bash
git add server/db/repo.ts server/app.test.ts
git commit -m "feat(tickets-links): getActive/AllTickets traen contactName (join contacts)"
```

---

## Task 3: `ClienteLink` + vistas (Card/List/Table/Kanban)

**Files:** Create `src/components/ClienteLink.tsx`; Modify `src/components/TicketCard.tsx`, `TicketList.tsx`, `TicketTable.tsx`, `KanbanBoard.tsx`

- [ ] **Step 1: Crear `src/components/ClienteLink.tsx`:**
```tsx
import React from 'react'

export type ClienteKind = 'contacto' | 'empresa'

export function ClienteLink({ label, kind, id, onOpen, className }: {
  label: string | null | undefined
  kind: ClienteKind
  id: string | null | undefined
  onOpen?: (kind: ClienteKind, id: string) => void
  className?: string
}) {
  if (!label) return null
  if (!id || !onOpen) return <span className={className}>{label}</span>
  return (
    <span role="link" tabIndex={0} onClick={(e) => { e.stopPropagation(); onOpen(kind, id) }}
      className={`text-blue-600 hover:underline cursor-pointer ${className ?? ''}`}>{label}</span>
  )
}
```

- [ ] **Step 2: `TicketCard.tsx`** — añade el import y la prop, y reemplaza la línea de la empresa.
  - Import (tras el import de `Ticket`): `import { ClienteLink, type ClienteKind } from './ClienteLink'`.
  - Cambia `interface TicketCardProps { ticket: Ticket; onClick?: () => void; }` por:
```tsx
interface TicketCardProps {
    ticket: Ticket;
    onClick?: () => void;
    onOpenCliente?: (kind: ClienteKind, id: string) => void;
}
```
  - En la firma del componente: `({ ticket, onClick, onOpenCliente })`.
  - Reemplaza el bloque
```tsx
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                            {ticket.company}
                        </div>
```
  por:
```tsx
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                            <ClienteLink label={ticket.contactName} kind="contacto" id={ticket.contactId} onOpen={onOpenCliente} />
                            {ticket.contactName && ticket.company ? ' · ' : ''}
                            <ClienteLink label={ticket.company} kind="empresa" id={ticket.accountId} onOpen={onOpenCliente} />
                        </div>
```

- [ ] **Step 3: `KanbanBoard.tsx`** — propaga `onOpenCliente`.
  - Añade a las props del componente: `onOpenCliente?: (kind: import('./ClienteLink').ClienteKind, id: string) => void` (dentro del objeto de tipos, junto a `onSelect`).
  - Destructúralo en la firma: `{ columns, groups, hideEmpty, loading, onSelect, onOpenCliente }`.
  - Cambia `<TicketCard key={ticket.id} ticket={ticket} onClick={() => onSelect(ticket.id)} />` por:
```tsx
                <TicketCard key={ticket.id} ticket={ticket} onClick={() => onSelect(ticket.id)} onOpenCliente={onOpenCliente} />
```

- [ ] **Step 4: `TicketList.tsx`** — import + prop + sublínea.
  - Import (tras el import de `Ticket`): `import { ClienteLink, type ClienteKind } from './ClienteLink'`.
  - Cambia la firma a: `export function TicketList({ tickets, dense, onSelect, onOpenCliente }: { tickets: Ticket[]; dense?: boolean; onSelect: (id: string) => void; onOpenCliente?: (kind: ClienteKind, id: string) => void }) {`
  - Reemplaza la sublínea
```tsx
                    <span className="font-bold text-slate-400">{t.number}</span> · {t.assignee?.name} · {t.company} · {t.time}
```
  por:
```tsx
                    <span className="font-bold text-slate-400">{t.number}</span> · {t.assignee?.name} · <ClienteLink label={t.contactName} kind="contacto" id={t.contactId} onOpen={onOpenCliente} />{t.contactName && t.company ? ' · ' : ''}<ClienteLink label={t.company} kind="empresa" id={t.accountId} onOpen={onOpenCliente} /> · {t.time}
```

- [ ] **Step 5: `TicketTable.tsx`** — import + prop + columna "Contacto".
  - Import (tras el import de `Ticket`): `import { ClienteLink, type ClienteKind } from './ClienteLink'`.
  - Cambia `COLS` a: `const COLS = ['#', 'Asunto', 'Cliente', 'Contacto', 'Estado', 'Prioridad', 'Propietario', 'Creado', 'Vencimiento', 'Días entrega', 'Canal']`.
  - Cambia la firma a: `export function TicketTable({ tickets, onSelect, onOpenCliente }: { tickets: Ticket[]; onSelect: (id: string) => void; onOpenCliente?: (kind: ClienteKind, id: string) => void }) {`
  - Reemplaza la celda `<td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.company}</td>` por (Cliente como enlace + nueva celda Contacto):
```tsx
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap"><ClienteLink label={t.company} kind="empresa" id={t.accountId} onOpen={onOpenCliente} /></td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap"><ClienteLink label={t.contactName} kind="contacto" id={t.contactId} onOpen={onOpenCliente} /></td>
```

- [ ] **Step 6:** Run `npx tsc -b && npx eslint src/components/ClienteLink.tsx src/components/TicketCard.tsx src/components/TicketList.tsx src/components/TicketTable.tsx src/components/KanbanBoard.tsx && npx vite build` — sin errores; eslint 0; build OK.

- [ ] **Step 7: Commit**
```bash
git add src/components/ClienteLink.tsx src/components/TicketCard.tsx src/components/TicketList.tsx src/components/TicketTable.tsx src/components/KanbanBoard.tsx
git commit -m "feat(tickets-links): ClienteLink + contacto/empresa en Card/List/Table"
```

---

## Task 4: Wiring en `App` + `ClientesPage` con `initial`

**Files:** Modify `src/App.tsx`, `src/components/ClientesPage.tsx`

- [ ] **Step 1: `ClientesPage.tsx`** — aceptar selección inicial.
  - Cambia la firma a:
```tsx
export function ClientesPage({ onClose, onSelectTicket, onAgregarTicket, initial }: { onClose: () => void; onSelectTicket: (id: string) => void; onAgregarTicket: () => void; initial?: { kind: 'contacto' | 'empresa'; id: string } | null }) {
```
  - Cambia las dos inicializaciones de estado:
    - `const [tab, setTab] = useState<'contactos' | 'empresas'>('contactos')` →
      `const [tab, setTab] = useState<'contactos' | 'empresas'>(initial?.kind === 'empresa' ? 'empresas' : 'contactos')`
    - `const [selected, setSelected] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(null)` →
      `const [selected, setSelected] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(initial ? { kind: initial.kind, id: initial.id } : null)`

- [ ] **Step 2: `App.tsx`** — estado + handler.
  - Tras `const [showClientes, setShowClientes] = useState(false)` añade:
```tsx
  const [clientesInitial, setClientesInitial] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(null)
  const abrirCliente = (kind: 'contacto' | 'empresa', id: string) => { setClientesInitial({ kind, id }); setShowClientes(true) }
```
  - Cambia el `onOpenClientes` del `<Header …>` a: `onOpenClientes={() => { setClientesInitial(null); setShowClientes(true) }}`.

- [ ] **Step 3: `App.tsx`** — pasar `onOpenCliente` a las vistas. En los tres `<KanbanBoard …>` añade `onOpenCliente={abrirCliente}`; en `<TicketList … >` y `<TicketTable …>` añade `onOpenCliente={abrirCliente}`.

- [ ] **Step 4: `App.tsx`** — pasar `initial` y limpiar al cerrar. Cambia la línea de `ClientesPage` por:
```tsx
      {showClientes && <ClientesPage initial={clientesInitial} onClose={() => { setShowClientes(false); setClientesInitial(null) }} onSelectTicket={(id) => { setShowClientes(false); setClientesInitial(null); setSelectedTicketId(id) }} onAgregarTicket={() => setShowCreate(true)} />}
```

- [ ] **Step 5:** Run `npx tsc -b && npx eslint src/App.tsx src/components/ClientesPage.tsx && npx vite build` — sin errores; eslint 0; build OK.

- [ ] **Step 6: Commit**
```bash
git add src/App.tsx src/components/ClientesPage.tsx
git commit -m "feat(tickets-links): App enruta clic de contacto/empresa a ClientesPage (initial)"
```

---

## Task 5: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS (incl. mappers.test, app.test); ambos `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Kanban: cada tarjeta muestra **Contacto · Empresa**; ambos en azul.
2. Clic en el **contacto** → abre Clientes en la pestaña Contactos con ese contacto seleccionado.
3. Clic en la **empresa** → abre Clientes en Empresas con esa empresa seleccionada.
4. Clic en el resto de la tarjeta/fila → sigue abriendo el ticket.
5. Lista y tabla: igual (la tabla tiene columna "Contacto").
6. Botón "Clientes" del menú → abre como antes (sin preselección).

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(tickets-links): verificado"
```

---

## Notas de cierre
- `ClienteLink` centraliza el enlace (DRY) y degrada a texto si falta el id o el handler.
- Fuera de v1: la mini-lista de hermanos en `TicketDetailView`.
