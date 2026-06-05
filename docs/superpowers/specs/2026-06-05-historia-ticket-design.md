# Diseño — Historia del ticket (timeline de auditoría)

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** La pestaña "Historia" del detalle es decorativa. Debe mostrar el **historial completo** del ticket
(comentarios, cambios de estado, transiciones del blueprint, notificaciones, tareas…), agrupado por fecha,
replicando el diseño de Zoho Desk.
**Depende de:** A (tickets + sync + `zohoFetch`), B (`ticket_transitions`), H1 (sesiones).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Origen | **Sincronizar a Postgres** (tabla `ticket_history`); sync al abrir el ticket |
| Cobertura de eventos | **Comunes en español + fallback genérico** (no se omite ningún evento) |
| Tickets creados en la app | **Fallback a `ticket_transitions`** cuando no hay historial de Zoho |
| Mapeo | **Guardar el `raw` y mapear al leer** (mejorar redacción no exige re-sync) |

## Hallazgo de la API (confirmado en vivo)
`GET /tickets/{id}/History` devuelve eventos: `eventName` (CommentAdded, TicketUpdated, BlueprintApplied,
BlueprintRevoked, BlueprintTransitionPerformed, NotificationSent, TaskAdded, TicketArchived…), `eventTime`,
`actor: { id, name, type }`, `eventInfo: [{ propertyName, propertyValue, propertyType }]`, `actorInfo`.
`propertyValue` puede ser string, `{previousValue, updatedValue}` (ValueTransition), `{id, name, type}`
(Entity), o array. **Los eventos NO traen id** → dedupe por hash. Paginación `from`/`limit`.

## Backend

### Tabla `ticket_history` (`server/db/schema.sql`)
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
`id = 'h-' + sha1(ticket_id|eventTime|eventName|JSON(eventInfo))` (eventos inmutables → upsert idempotente).

### Mapeo puro (`shared/historyMap.ts`)
`mapHistoryEvent(raw): HistoryEvent` — recibe el evento (forma de Zoho) y devuelve el normalizado en español.
- Helper `renderValue(propertyValue)`: string→tal cual; `{previousValue,updatedValue}`→`"X → Y"`;
  `{name}`→`name`; array→`join(', ')`.
- Títulos por `eventName` (los comunes):
  - `CommentAdded` → `"{actor} ha publicado un comentario"`; details: Tipo de comentario (`CommentType`,
    Private→Privado/Public→Público) + Contenido (`Content`, `html:true`).
  - `TicketUpdated` → `"{actor} ha actualizado el ticket"`; details: por cada propiedad ValueTransition →
    `"{label} cambiado desde {previousValue} a {updatedValue}"` (label: Status→Estado; otros = propertyName).
  - `BlueprintApplied` → `"Blueprint aplicado"`; details: Nombre de blueprint.
  - `BlueprintRevoked` → `"Blueprint revocado por {actor}"`; details: Nombre de blueprint + Desde el estado
    (`FromState`).
  - `BlueprintTransitionPerformed` → `"Transición de blueprint realizada por {actor}"`; details: Nombre de
    blueprint + Nombre de transición.
  - `NotificationSent` → `"Notificación de regla aplicada"`; details: Tipo de notificación + Destinatario.
  - `TaskAdded` → `"Se agregó una tarea"`; details: Asunto/Estado/Prioridad/Vence según `eventInfo`.
  - **Fallback (cualquier otro)**: title = `eventName` humanizado (mapa corto: TicketArchived→"Ticket
    archivado", etc., si no, el `eventName`); details = cada propiedad → `{ label: propertyName, value:
    renderValue }`.
- `actor` = `raw.actor?.name ?? 'Sistema'`. `time` = `raw.eventTime ?? null`.

### Repo (`server/db/history.ts`)
- `upsertHistoryEvent(db, ticketId, raw)` — calcula el hash y hace `INSERT … ON CONFLICT (id) DO NOTHING`.
- `getTicketHistory(db, ticketId)` → lee `ticket_history` (orden `event_time DESC NULLS LAST`), mapea cada
  `raw` con `mapHistoryEvent`. **Si vacío**, arma desde `ticket_transitions` (orden `performed_at DESC`):
  cada transición → `HistoryEvent` (title `"Transición: {transition_name}"`, actor `performed_by`, time
  `performed_at`, details: Estado `from→to`, Área).

### Sync (`server/sync.ts`)
- `syncTicketHistory(id)`: pagina `zohoFetch('/tickets/${id}/History?from=${n}&limit=100')`, upsert cada evento;
  corta en página vacía/corta (bounded). Añadir a la interfaz `Sync`.

### Endpoint (`server/app.ts`, bajo la auth de `/api/tickets`)
`GET /api/tickets/:id/history` → `try { await sync.syncTicketHistory(id) } catch {}` (best-effort) →
`res.json(await getTicketHistory(db, id))`.

### Tipos (`shared/types.ts`)
```ts
export interface HistoryDetail { label: string; value: string; html?: boolean }
export interface HistoryEvent { eventName: string; time: string | null; actor: string; title: string; details: HistoryDetail[] }
```

## Frontend

### `src/components/HistoriaPanel.tsx` (nuevo)
- Carga `fetchHistory(ticketId)`; agrupa por **fecha** (`event.time` → "DD MMM" en es-CO).
- Por grupo: cabecera de fecha; por evento: hora + **título en negrita** + líneas `Etiqueta: valor`
  (las `html:true` con `DOMPurify.sanitize` + `dangerouslySetInnerHTML`). Réplica del diseño de Zoho.
- Estados carga/vacío ("Sin historial.").

### `src/api/client.ts`
`fetchHistory(id): Promise<HistoryEvent[]>`.

### `src/components/TicketDetailView.tsx`
- La pestaña `his` (Historia) pasa de `view: 'otros'` a `view: 'historia'`.
- Añadir `{activeView === 'historia' && <HistoriaPanel ticketId={ticketId} />}` en el área de contenido.

## Pruebas
- **`mapHistoryEvent`** (puro): con los eventos reales (CommentAdded, TicketUpdated/Status, BlueprintApplied/
  Revoked/TransitionPerformed, NotificationSent) → títulos y details correctos; fallback genérico para un
  eventName desconocido.
- **Repo** (pg-mem): `upsertHistoryEvent` idempotente (mismo evento dos veces = 1 fila); `getTicketHistory`
  mapea y ordena; **fallback** a `ticket_transitions` cuando `ticket_history` vacío.
- **`syncTicketHistory`** (`zohoFetch` mock): pagina + upsert.
- **Endpoint** (supertest+sesión): devuelve la lista; **401** sin sesión.

## Fuera de alcance (v1)
- Filtros de Zoho ("Filtrar por" / "Todos").
- Imágenes **en línea** de comentarios (URLs de Zoho con auth — pueden no cargar, limitación conocida).
- Backfill global de historial (se sincroniza al abrir cada ticket).
