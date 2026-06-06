# Diseño — Contacto + Empresa accionables en las vistas de tickets

**Fecha:** 2026-06-06
**Estado:** Aprobado para planificación
**Contexto:** En las vistas de tickets (Kanban, lista, tabla) hoy solo se muestra la empresa. Debe mostrarse
también el **nombre del contacto**, y tanto **contacto** como **empresa** deben ser **enlaces** que abran el
detalle correspondiente en Clientes (Contacto / Empresa).
**Depende de:** A (tablero/tickets), D1/D2 (Clientes: `ClientesPage` master-detail).

## Decisiones
- **Qué se muestra:** contacto **y** empresa en `TicketCard` (Kanban), `TicketList`, `TicketTable`.
- **Acción del clic:** abre el overlay **Clientes** enfocado en ese registro (`ClientesPage` con `initial`),
  reutilizando el master-detail existente. El clic en el contacto/empresa NO debe abrir el ticket
  (`stopPropagation`).
- **Sin id:** si el ticket no tiene contacto/empresa asociada, se muestra el texto sin enlace (o nada si falta).

## Backend

### `shared/types.ts` — `Ticket`
Añadir: `contactName?: string | null`, `contactId?: string | null`, `accountId?: string | null`.

### `server/db/mappers.ts`
- `TicketRefs`: añadir `contactName?: string | null`.
- `rowToTicket(row, refs)`: añadir al objeto devuelto:
  `contactName: refs.contactName ?? null`, `contactId: row.contact_id ?? null`, `accountId: row.account_id ?? null`.
  (`TicketRow` ya tiene `contact_id`/`account_id` por `SELECT t.*`.)

### `server/db/repo.ts` — `getActiveTickets` y `getAllTickets`
- Añadir `LEFT JOIN contacts c ON t.contact_id=c.id` y seleccionar `c.first_name AS c_first, c.last_name AS c_last`.
- En el `.map`, construir `contactName` igual que `getTicketWithRefs`:
  `const contactName = [row.c_first, row.c_last].filter(Boolean).join(' ').trim() || null` y pasarlo en `refs`.

## Frontend

### `src/components/ClienteLink.tsx` (nuevo, reutilizable)
```tsx
export function ClienteLink({ label, kind, id, onOpen, className }: {
  label: string | null | undefined
  kind: 'contacto' | 'empresa'
  id: string | null | undefined
  onOpen?: (kind: 'contacto' | 'empresa', id: string) => void
  className?: string
}) {
  if (!label) return null
  if (!id || !onOpen) return <span className={className}>{label}</span>
  return <span role="link" tabIndex={0} onClick={(e) => { e.stopPropagation(); onOpen(kind, id) }}
    className={`text-blue-600 hover:underline cursor-pointer ${className ?? ''}`}>{label}</span>
}
```

### `TicketCard` / `TicketList` / `TicketTable`
- Cada uno recibe una prop nueva `onOpenCliente?: (kind, id) => void`.
- **TicketCard**: en la línea que hoy muestra `{ticket.company}`, mostrar contacto **y** empresa:
  `<ClienteLink label={contactName} kind="contacto" id={contactId} onOpen=… /> · <ClienteLink label={company} kind="empresa" id={accountId} onOpen=… />` (con un separador `·` solo si ambos existen).
- **TicketList**: en la sublínea, reemplazar ` · {t.company} · ` por contacto + empresa con `ClienteLink`.
- **TicketTable**: añadir columna **"Contacto"** (junto a "Cliente"); ambas celdas usan `ClienteLink`.
- **KanbanBoard**: aceptar y pasar `onOpenCliente` a cada `TicketCard`.

### `src/App.tsx`
- Estado: `const [clientesInitial, setClientesInitial] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(null)`.
- `const abrirCliente = (kind, id) => { setClientesInitial({ kind, id }); setShowClientes(true) }`.
- Botón de nav "Clientes": `onOpenClientes={() => { setClientesInitial(null); setShowClientes(true) }}`.
- Pasar `onOpenCliente={abrirCliente}` a `KanbanBoard` (los 3 modos), `TicketList`, `TicketTable`.
- `<ClientesPage initial={clientesInitial} … />`.

### `src/components/ClientesPage.tsx`
- Prop `initial?: { kind: 'contacto' | 'empresa'; id: string } | null`.
- Inicializar desde `initial`: `useState<'contactos'|'empresas'>(initial?.kind === 'empresa' ? 'empresas' : 'contactos')`
  y `useState<{kind; id} | null>(initial ? { kind: initial.kind, id: initial.id } : null)`.

## Pruebas
- **`rowToTicket`** (`server/db/mappers.test.ts`): con `refs.contactName` y `row.contact_id`/`account_id`,
  el Ticket trae `contactName`/`contactId`/`accountId`.
- **`getActiveTickets`** (extender un test existente en `server/app.test.ts` o `repo.test.ts`): un ticket con
  contacto devuelve `contactName` y `contactId`/`accountId` (vía `/api/tickets` → `rowToTicket`).
- UI (Card/List/Table/ClienteLink/App/ClientesPage): cubierto por `tsc` + build + verificación manual.

## Fuera de alcance (v1)
- La mini-lista de hermanos dentro de `TicketDetailView` (se mantiene como está).
- Cambiar el comportamiento del clic en el resto de la tarjeta/fila (sigue abriendo el ticket).
