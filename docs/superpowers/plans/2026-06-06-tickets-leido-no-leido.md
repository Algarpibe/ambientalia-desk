# Tickets leído / no leído — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Marcar tickets como leído/no leído por usuario en todas las vistas (icono libro + título en negrita si no leído), con auto-marcado al abrir y alternancia manual.

**Architecture:** Tabla `ticket_reads(user_id, ticket_id, read_at)`; `getActiveTickets`/`getAllTickets` calculan `read` por usuario (join); `setTicketRead` + `POST /api/tickets/:id/read`; `Ticket.read` fluye a las vistas; `App` usa estado optimista (`readOverrides`) y un `ReadToggle` reutilizable. `read = read_at >= modified_time`.

**Tech Stack:** TS ESM, Express 5, pg-mem, Vitest + supertest, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-06-tickets-leido-no-leido-design.md`.

**Contexto del repo:**
- `migrate` ejecuta `server/db/schema.sql` (idempotente) → vale para prod y pg-mem.
- `shared/types.ts` `Ticket`: termina en `accountId?: string | null` (campos recién añadidos).
- `server/db/mappers.ts`: `TicketRefs { accountName?; agentName?; contactName? }`; `rowToTicket(row, refs)`.
- `server/db/repo.ts`: `getActiveTickets(db)` y `getAllTickets(db)` (sin params actualmente); SELECT con joins a accounts/agents/clients/contacts; `.map((row) => ({ row, refs: { accountName, agentName, contactName } }))`. `getActiveTickets` tiene `WHERE (t.status_type <> 'Closed' OR t.status_type IS NULL)`.
- `server/db/repo.test.ts`: usa `getActiveTickets(db)` SIN userId (por eso el nuevo param es opcional). Inserta tickets con `INSERT INTO tickets (...)` o `upsertTicket`.
- `server/app.ts`: `app.use('/api/tickets', requireAuth(db))`; `GET /api/tickets` → `req.query.scope === 'all' ? await getAllTickets(db) : await getActiveTickets(db)`. `req.user` disponible (UserPublic con `id`).
- `src/api/client.ts`: helper `json<T>`, fetchs con `credentials:'include'`.
- `src/App.tsx`: `const base = applyBoardView(all, view, new Date())`; modos: `groupTicketsByColumn(base)`, `groupByPriority(base)`, `groupByDueDate(base, new Date())`, `<TicketList tickets={base} … onSelect={setSelectedTicketId} onOpenCliente={abrirCliente} />`, `<TicketTable tickets={base} onSelect={setSelectedTicketId} onOpenCliente={abrirCliente} />`, `<KanbanBoard … onSelect={setSelectedTicketId} onOpenCliente={abrirCliente} />` (×3).
- `src/components/TicketCard.tsx`: outer `<div onClick>`; título `<h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">`; fila de iconos inferior-derecha con botones mail/notes. Props `{ ticket, onClick, onOpenCliente }`.
- `src/components/TicketList.tsx`: fila es `<button onClick={onSelect}>`; título `<div className="font-semibold …">`; termina con `<StatusBadge status={t.status} />`. Props incluyen `onOpenCliente?`.
- `src/components/TicketTable.tsx`: fila `<tr onClick>`; celda Asunto `<td className="px-3 py-2 text-slate-800 max-w-[360px] truncate">{t.title}</td>`. Props incluyen `onOpenCliente?`.
- `src/components/KanbanBoard.tsx`: props `{ columns, groups, hideEmpty, loading, onSelect, onOpenCliente }`; renderiza `<TicketCard … onClick={() => onSelect(ticket.id)} onOpenCliente={onOpenCliente} />`.

---

## Estructura de archivos
- Modify `shared/types.ts` — `Ticket.read`.
- Modify `server/db/schema.sql` — tabla `ticket_reads`.
- Modify `server/db/mappers.ts` (+ `mappers.test.ts`) — `TicketRefs.read` + `rowToTicket`.
- Modify `server/db/repo.ts` (+ `repo.test.ts`) — `read` en listas + `setTicketRead`.
- Modify `server/app.ts` (+ `app.test.ts`) — userId en GET + `POST /read`.
- Create `src/components/ReadToggle.tsx`.
- Modify `src/components/TicketCard.tsx`, `TicketList.tsx`, `TicketTable.tsx`, `KanbanBoard.tsx`.
- Modify `src/api/client.ts`, `src/App.tsx`.

---

## Task 1: Backend de datos (esquema + repo + mapper) (TDD)

**Files:** Modify `shared/types.ts`, `server/db/schema.sql`, `server/db/mappers.ts`, `server/db/repo.ts`, `server/db/repo.test.ts`

- [ ] **Step 1: `shared/types.ts`** — en `Ticket`, tras `accountId?: string | null` añade:
```ts
  read?: boolean
```

- [ ] **Step 2: `server/db/schema.sql`** — añade (al final, junto a otras tablas):
```sql
CREATE TABLE IF NOT EXISTS ticket_reads (
  user_id text NOT NULL,
  ticket_id text NOT NULL,
  read_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, ticket_id)
);
```

- [ ] **Step 3: `server/db/mappers.ts`** — `TicketRefs` pasa a:
```ts
export interface TicketRefs { accountName?: string | null; agentName?: string | null; contactName?: string | null; read?: boolean }
```
  y en `rowToTicket`, en el objeto devuelto (tras `accountId: …,`) añade: `read: refs.read ?? false,`.

- [ ] **Step 4: Escribir el test** en `server/db/repo.test.ts` (importa `setTicketRead` desde `./repo`). Añade un `describe`:
```ts
describe('ticket_reads (leído/no leído)', () => {
  it('setTicketRead marca leído/no leído por usuario; reactiva si se modifica tras leer', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time,modified_time) VALUES ('t1',1,'A','Ingresado','Open',now(),'2026-01-01T00:00:00Z')")
    const readFor = async (u: string) => (await getActiveTickets(db, u))[0].refs.read
    expect(await readFor('u1')).toBe(false)
    await setTicketRead(db, 'u1', 't1', true)
    expect(await readFor('u1')).toBe(true)
    expect(await readFor('u2')).toBe(false)
    await setTicketRead(db, 'u1', 't1', false)
    expect(await readFor('u1')).toBe(false)
    await setTicketRead(db, 'u1', 't1', true)
    await db.query("UPDATE tickets SET modified_time='2999-01-01T00:00:00Z' WHERE id='t1'")
    expect(await readFor('u1')).toBe(false)
  })
})
```

- [ ] **Step 5:** Run `npx vitest run server/db/repo.test.ts` — confirm FAIL (`setTicketRead` no existe / `read` undefined).

- [ ] **Step 6: `server/db/repo.ts`** — añade `setTicketRead` (junto a las otras funciones de tickets):
```ts
export async function setTicketRead(db: Queryable, userId: string, ticketId: string, read: boolean): Promise<void> {
  await db.query('DELETE FROM ticket_reads WHERE user_id=$1 AND ticket_id=$2', [userId, ticketId])
  if (read) await db.query('INSERT INTO ticket_reads (user_id, ticket_id, read_at) VALUES ($1,$2,now())', [userId, ticketId])
}
```

- [ ] **Step 7: `server/db/repo.ts`** — en `getActiveTickets` y `getAllTickets`:
  - Cambia la firma: `getActiveTickets(db: Queryable, userId = '')` y `getAllTickets(db: Queryable, userId = '')`.
  - Añade `, tr.read_at` al final del SELECT (tras `c.last_name AS c_last`).
  - Añade el join (tras `LEFT JOIN contacts c ON t.contact_id=c.id`): `LEFT JOIN ticket_reads tr ON tr.ticket_id=t.id AND tr.user_id=$1`.
  - Pasa el parámetro a `db.query(...)`: añade `, [userId]` como segundo argumento.
  - En el `.map`, añade `read` a refs:
```ts
    refs: { accountName: row.account_name, agentName: row.agent_name, contactName: [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null, read: row.read_at != null && (row.modified_time == null || new Date(row.read_at) >= new Date(row.modified_time)) }
```
  (Aplica EXACTAMENTE igual en ambas funciones. `getActiveTickets` ya tenía `WHERE` literal sin params; ahora `$1` es `userId`.)

- [ ] **Step 8:** Run `npx vitest run server/db/repo.test.ts` — confirm PASS.

- [ ] **Step 9:** Run `npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint shared/types.ts server/db/repo.ts server/db/mappers.ts` — sin errores; eslint 0 (warnings `no-explicit-any` aceptables).

- [ ] **Step 10: Commit**
```bash
git add shared/types.ts server/db/schema.sql server/db/mappers.ts server/db/repo.ts server/db/repo.test.ts
git commit -m "feat(read): ticket_reads + read por usuario en getActive/AllTickets + setTicketRead"
```

---

## Task 2: Endpoint `POST /api/tickets/:id/read` + userId en GET (TDD)

**Files:** Modify `server/app.ts`, `server/app.test.ts`

- [ ] **Step 1: Test** en `server/app.test.ts`, dentro del `describe('GET /api/tickets', …)` añade un `it`:
```ts
  it('marca leído por usuario (POST /:id/read) y GET lo refleja; 401 sin sesión', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time,modified_time) VALUES ('t9',9,'Z','Ingresado','Open',now(),'2026-01-01T00:00:00Z')")
    const cookie = await adminCookie()
    const { app } = appWith()
    const before = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(before.body.find((t: any) => t.number === '#9').read).toBe(false)
    const m = await request(app).post('/api/tickets/t9/read').set('Cookie', cookie).send({ read: true })
    expect(m.status).toBe(200)
    const after = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(after.body.find((t: any) => t.number === '#9').read).toBe(true)
    expect((await request(app).post('/api/tickets/t9/read').send({ read: true })).status).toBe(401)
  })
```

- [ ] **Step 2:** Run `npx vitest run server/app.test.ts -t "marca leído"` — confirm FAIL.

- [ ] **Step 3: `server/app.ts`:**
  - En el import de `./db/repo`, añade `setTicketRead`.
  - En `GET /api/tickets`, cambia la línea de la lista a:
```ts
      const list = req.query.scope === 'all' ? await getAllTickets(db, req.user!.id) : await getActiveTickets(db, req.user!.id)
```
  - Añade la ruta (dentro del grupo `/api/tickets`, p.ej. tras `GET /api/tickets`):
```ts
  app.post('/api/tickets/:id/read', async (req, res) => {
    try {
      await setTicketRead(db, req.user!.id, String(req.params.id), !!req.body?.read)
      res.json({ ok: true })
    } catch (err) { res.status(500).json({ error: String(err) }) }
  })
```

- [ ] **Step 4:** Run `npx vitest run server/app.test.ts` — confirm PASS (archivo completo).

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/app.ts` — typecheck limpio; eslint 0.

- [ ] **Step 6: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(read): GET /api/tickets con userId + POST /api/tickets/:id/read"
```

---

## Task 3: `ReadToggle` + vistas (Card/List/Table/Kanban)

**Files:** Create `src/components/ReadToggle.tsx`; Modify `src/components/TicketCard.tsx`, `TicketList.tsx`, `TicketTable.tsx`, `KanbanBoard.tsx`

- [ ] **Step 1: Crear `src/components/ReadToggle.tsx`** (span, no button → válido dentro de `<button>`/`<tr>`):
```tsx
export function ReadToggle({ read, onToggle, className }: { read?: boolean; onToggle?: (read: boolean) => void; className?: string }) {
  return (
    <span role="button" tabIndex={0} title={read ? 'Marcar como no leído' : 'Marcar como leído'}
      onClick={(e) => { e.stopPropagation(); onToggle?.(!read) }}
      className={`material-symbols-outlined cursor-pointer text-slate-400 hover:text-slate-600 ${className ?? ''}`}>
      {read ? 'menu_book' : 'book'}
    </span>
  )
}
```

- [ ] **Step 2: `TicketCard.tsx`:**
  - Tras el import de `ClienteLink`, añade: `import { ReadToggle } from './ReadToggle'`.
  - Añade a `TicketCardProps`: `onToggleRead?: (id: string, read: boolean) => void;`
  - En la firma: `({ ticket, onClick, onOpenCliente, onToggleRead })`.
  - Título: cambia `className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1"` por:
    `` className={`text-[12px] leading-tight mb-1 dark:text-slate-100 ${ticket.read ? 'font-normal text-slate-600' : 'font-bold text-slate-800'}`} ``
  - En la fila de iconos inferior-derecha (el `<div className="flex items-center gap-2">` con los botones mail/notes),
    añade como primer hijo: `<ReadToggle read={ticket.read} onToggle={(r) => onToggleRead?.(ticket.id, r)} className="text-[16px]" />`

- [ ] **Step 3: `KanbanBoard.tsx`:**
  - En el tipo de props añade: `onToggleRead?: (id: string, read: boolean) => void`.
  - Destructura `onToggleRead` en la firma.
  - Cambia `<TicketCard … onOpenCliente={onOpenCliente} />` por `<TicketCard … onOpenCliente={onOpenCliente} onToggleRead={onToggleRead} />`.

- [ ] **Step 4: `TicketList.tsx`:**
  - Tras el import de `ClienteLink`, añade: `import { ReadToggle } from './ReadToggle'`.
  - Firma: añade `onToggleRead?: (id: string, read: boolean) => void` al objeto de props.
  - Título: cambia la clase `font-semibold` del `<div>` del título por condicional:
    `` className={`truncate ${dense ? 'text-[12px]' : 'text-[13px]'} ${t.read ? 'font-normal text-slate-600' : 'font-bold text-slate-800'}`} `` (conserva el resto de clases existentes).
  - Antes de `<StatusBadge status={t.status} />` añade: `<ReadToggle read={t.read} onToggle={(r) => onToggleRead?.(t.id, r)} className="text-[16px] shrink-0" />`

- [ ] **Step 5: `TicketTable.tsx`:**
  - Tras el import de `ClienteLink`, añade: `import { ReadToggle } from './ReadToggle'`.
  - Firma: añade `onToggleRead?: (id: string, read: boolean) => void` al objeto de props.
  - Celda Asunto: cambia `<td className="px-3 py-2 text-slate-800 max-w-[360px] truncate">{t.title}</td>` por:
```tsx
              <td className="px-3 py-2 max-w-[360px] truncate">
                <ReadToggle read={t.read} onToggle={(r) => onToggleRead?.(t.id, r)} className="text-[15px] align-middle mr-1" />
                <span className={t.read ? 'text-slate-600' : 'font-bold text-slate-800'}>{t.title}</span>
              </td>
```

- [ ] **Step 6:** Run `npx tsc -b && npx eslint src/components/ReadToggle.tsx src/components/TicketCard.tsx src/components/TicketList.tsx src/components/TicketTable.tsx src/components/KanbanBoard.tsx && npx vite build` — sin errores; eslint 0; build OK.

- [ ] **Step 7: Commit**
```bash
git add src/components/ReadToggle.tsx src/components/TicketCard.tsx src/components/TicketList.tsx src/components/TicketTable.tsx src/components/KanbanBoard.tsx
git commit -m "feat(read): ReadToggle (libro) + negrita no-leído en Card/List/Table"
```

---

## Task 4: Cliente API + wiring en `App`

**Files:** Modify `src/api/client.ts`, `src/App.tsx`

- [ ] **Step 1: `src/api/client.ts`** — añade:
```ts
export function setTicketRead(id: string, read: boolean): Promise<void> {
  return fetch(`/api/tickets/${id}/read`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ read }),
  }).then(() => undefined)
}
```

- [ ] **Step 2: `src/App.tsx`** — import: añade `setTicketRead` al import existente de `./api/client`.

- [ ] **Step 3: `src/App.tsx`** — estado + handlers. Tras la línea `const base = applyBoardView(all, view, new Date())` añade:
```tsx
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({})
  const baseRead = base.map((t) => (t.id in readOverrides ? { ...t, read: readOverrides[t.id] } : t))
  const marcarLeido = (id: string, read: boolean) => { setReadOverrides((o) => ({ ...o, [id]: read })); setTicketRead(id, read).catch(() => {}) }
  const abrirTicket = (id: string) => { setSelectedTicketId(id); marcarLeido(id, true) }
```

- [ ] **Step 4: `src/App.tsx`** — en los 5 renders de vistas:
  - Sustituye el origen de datos `base` por `baseRead`: `groupTicketsByColumn(baseRead)`, `groupByPriority(baseRead)`, `groupByDueDate(baseRead, new Date())`, `<TicketList tickets={baseRead} …>`, `<TicketTable tickets={baseRead} …>`.
  - Cambia `onSelect={setSelectedTicketId}` por `onSelect={abrirTicket}` en los 3 `<KanbanBoard>`, el `<TicketList>` y el `<TicketTable>`.
  - Añade `onToggleRead={marcarLeido}` a los 3 `<KanbanBoard>`, el `<TicketList>` y el `<TicketTable>`.

- [ ] **Step 5:** Run `npx tsc -b && npx eslint src/api/client.ts src/App.tsx && npx vite build` — sin errores; eslint 0; build OK.

- [ ] **Step 6: Commit**
```bash
git add src/api/client.ts src/App.tsx
git commit -m "feat(read): App marca leído al abrir + alterna (estado optimista) en todas las vistas"
```

---

## Task 5: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS (incl. repo.test, app.test, mappers.test); ambos `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Tickets no leídos → título en **negrita** + icono **libro cerrado** (`book`).
2. Abrir un ticket → al volver, ese ticket queda **leído** (normal + libro abierto `menu_book`).
3. Clic en el **icono libro** (sin abrir el ticket) → alterna leído/no leído al instante.
4. El estado es **por usuario** (otro usuario lo ve distinto).
5. Si el ticket se modifica tras leerlo (nueva sincronización), vuelve a **no leído**.
6. Funciona igual en Kanban, lista y tabla.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(read): verificado"
```

---

## Notas de cierre
- Estado optimista en `App` (`readOverrides`) para feedback inmediato sin recargar; al recargar tickets manda el servidor.
- Fuera de v1: contador de no leídos, filtro "solo no leídos", marcado por preview/scroll.
