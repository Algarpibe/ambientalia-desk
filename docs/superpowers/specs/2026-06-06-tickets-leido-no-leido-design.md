# Diseño — Tickets leído / no leído (por usuario)

**Fecha:** 2026-06-06
**Estado:** Aprobado para planificación
**Contexto:** En las vistas de tickets (Kanban/lista/tabla) marcar cada ticket como leído/no leído **por usuario**:
no leído = título en **negrita** + icono **libro cerrado**; leído = título normal + icono **libro abierto** (esquina
inferior derecha de la tarjeta; equivalente en lista/tabla). Sirve para saber si yo ya lo revisé.
**Depende de:** A (tickets/tablero), H1 (sesiones; `req.user.id`).

## Decisiones (confirmadas)
- **Alcance:** por usuario (tabla `ticket_reads`).
- **Marcado:** automático al abrir el detalle **+** icono clicable para alternar leído/no leído.
- **Reactivación:** vuelve a "no leído" si el ticket fue modificado **después** de la última lectura
  (`read_at >= modified_time`).

## Backend

### Esquema (`server/db/schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS ticket_reads (
  user_id text NOT NULL,
  ticket_id text NOT NULL,
  read_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, ticket_id)
);
```
(`migrate` ejecuta `schema.sql`; vale para prod y pg-mem.)

### `server/db/repo.ts`
- `getActiveTickets(db, userId = '')` y `getAllTickets(db, userId = '')`:
  - Añadir `LEFT JOIN ticket_reads tr ON tr.ticket_id=t.id AND tr.user_id=$1` (param `$1 = userId`;
    si `userId=''` no casa → `read_at` null → no leído).
  - Seleccionar `tr.read_at`.
  - En el `.map`, calcular y pasar en refs:
    `read = read_at != null && (modified_time == null || new Date(read_at) >= new Date(modified_time))`.
- `setTicketRead(db, userId, ticketId, read)`: `DELETE FROM ticket_reads WHERE user_id=$1 AND ticket_id=$2`;
  si `read`, además `INSERT INTO ticket_reads (user_id, ticket_id, read_at) VALUES ($1,$2,now())`.
  (DELETE+INSERT evita `ON CONFLICT`, no soportado por pg-mem.)

### `server/db/mappers.ts`
- `TicketRefs` += `read?: boolean`.
- `rowToTicket`: añadir `read: refs.read ?? false`.

### `shared/types.ts`
- `Ticket` += `read?: boolean`.

### `server/app.ts` (bajo `requireAuth` de `/api/tickets`)
- En `GET /api/tickets`: pasar el usuario →
  `req.query.scope === 'all' ? getAllTickets(db, req.user!.id) : getActiveTickets(db, req.user!.id)`.
- Nuevo `POST /api/tickets/:id/read` (body `{ read: boolean }`) →
  `await setTicketRead(db, req.user!.id, req.params.id, !!req.body?.read); res.json({ ok: true })`.

## Frontend

### `src/api/client.ts`
- `setTicketRead(id: string, read: boolean): Promise<void>` → `POST /api/tickets/:id/read` con `{ read }`.

### `src/App.tsx`
- Estado optimista: `const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({})`.
- `const marcarLeido = (id: string, read: boolean) => { setReadOverrides((o) => ({ ...o, [id]: read })); setTicketRead(id, read).catch(() => {}) }`.
- Lista efectiva para las vistas: `const baseRead = base.map((t) => (t.id in readOverrides ? { ...t, read: readOverrides[t.id] } : t))`.
  Pasar `baseRead` a KanbanBoard/TicketList/TicketTable (en vez de `base`).
- Al abrir un ticket (los `onSelect`): además de `setSelectedTicketId(id)`, llamar `marcarLeido(id, true)`.
- Pasar `onToggleRead={(id, read) => marcarLeido(id, read)}` a KanbanBoard (3 modos), TicketList, TicketTable.

### Vistas — icono + negrita
Icono Material Symbols: **leído → `menu_book`** (libro abierto), **no leído → `book`** (libro cerrado).
- **`TicketCard`**: prop `onToggleRead?: (id, read) => void`. Título: `font-bold` si `!ticket.read`, `font-normal`
  si leído. En la fila de iconos inferior-derecha añadir un botón libro:
  `onClick` con `stopPropagation` → `onToggleRead?.(ticket.id, !ticket.read)`; icono según `ticket.read`;
  `title` = "Marcar como leído"/"Marcar como no leído".
- **`KanbanBoard`**: aceptar y pasar `onToggleRead` a cada `TicketCard`.
- **`TicketList`**: prop `onToggleRead?`. Título `font-bold` si no leído, `font-normal` si leído. Añadir el botón
  libro al final de la fila (junto al `StatusBadge`), con `stopPropagation`.
- **`TicketTable`**: prop `onToggleRead?`. En la celda "Asunto", texto en `font-bold` si no leído; anteponer el
  botón libro (`stopPropagation`) al título (sin columna nueva).

## Pruebas
- **`setTicketRead` + `getActiveTickets`** (pg-mem, `server/db/repo.test.ts`): marcar leído → `read=true`;
  marcar no leído → `read=false`; si `modified_time > read_at` → `read=false` (reactivación).
- **`POST /api/tickets/:id/read`** (`server/app.test.ts`): con sesión marca leído y `GET /api/tickets` lo
  refleja para ese usuario; **401** sin sesión.
- **`rowToTicket`** (`server/db/mappers.test.ts`): `refs.read` → `ticket.read`.
- Vistas/App: cubierto por `tsc` + build + verificación manual.

## Fuera de alcance (v1)
- Contador de no leídos por columna/global; filtro "solo no leídos".
- Marcar leído al hacer scroll/preview; sincronización en vivo entre pestañas (se usa estado optimista + recarga).
