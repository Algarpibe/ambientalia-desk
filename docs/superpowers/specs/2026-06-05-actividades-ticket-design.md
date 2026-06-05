# Diseño — Actividades (tareas) del ticket

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** En el detalle del ticket la pestaña "Actividades" es decorativa. Debe mostrar las **tareas**
(Tasks de Zoho Desk) asociadas al ticket: título, prioridad, fechas, estado y responsable.
**Depende de:** A (tickets + sync + `zohoFetch`), H1 (sesiones).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Origen de datos | **Sincronizar a Postgres** (tabla `activities`), leída por la pestaña |
| Tipos | **Solo Tareas** (Tasks) — sin Eventos ni Llamadas |
| Interacción | **Solo lectura** (mostrar; sin crear/editar/completar) |
| Pestañas | Funcionales solo **Conversaciones + Actividades**; el resto muestra "Pronto" |

## Hallazgo de la API (confirmado en vivo)
Zoho Desk expone las tareas como **lista del departamento** (`GET /tasks`), **sin endpoint por-ticket**. Cada
tarea trae: `id, subject, priority (Normal/High/Highest), dueDate, status, statusType (Open/Closed),
createdTime, modifiedTime, completedTime, ownerId, ticketId` (+ `ticket`/`assignee` con `include`). La API real
acepta `sortBy=-modifiedTime` y paginación `from`/`limit` (el wrapper MCP no, pero `zohoFetch` va directo al
REST). Por eso: **sync global a Postgres** + lectura por `ticket_id`.

## Backend

### Tabla `activities` (schema.sql)
```
id text primary key, ticket_id text, subject text, status text, status_type text, priority text,
due_date timestamptz, created_time timestamptz, modified_time timestamptz, completed_time timestamptz,
owner_id text, owner_name text, raw jsonb, synced_at timestamptz default now()
```
(Comentarios en líneas propias — `migrate` parte por `;`.)

### Mapper `activityRowFromZoho(raw)` (`server/db/mappers.ts`)
Devuelve `ActivityRow` con `ticket_id = raw.ticketId ?? null`, `owner_id = raw.ownerId ?? null`,
`owner_name` = nombre de `raw.assignee` (`firstName`+`lastName`) si viene, fechas tal cual.

### Repo (`server/db/repo.ts` o `server/db/activities.ts`)
- `upsertActivity(db, row)` — upsert por `id` (mismo patrón que `upsertTicket`).
- `getActivities(db, ticketId)` — `WHERE ticket_id=$1 ORDER BY COALESCE(due_date, created_time) ASC NULLS LAST`,
  resuelve `owner_name` (usa `owner_name` o LEFT JOIN `agents` por `owner_id`). Devuelve `Activity[]` mapeadas.

### Sync `syncActivities()` (`server/sync.ts`)
- Pagina `zohoFetch('/tasks?departmentId=${departmentId}&include=tickets,assignee&sortBy=-modifiedTime&from=${n}&limit=100')`.
- Upsert cada tarea. **Incremental**: mantiene marca de agua (máx `modified_time` visto); corta la paginación
  cuando una página trae solo tareas con `modifiedTime <= watermark`. Primera corrida = full.
- Se invoca en el **backfill de arranque** y en el **loop periódico** existente.
- Añadir `syncActivities` a la interfaz `Sync`.

### Endpoint (`server/app.ts`)
`GET /api/tickets/:id/activities` (bajo `requireAuth`, ya aplicado a `/api/tickets`) → `getActivities(db, id)`.
(No dispara sync por-ticket; el background ya pobló la tabla.)

### Tipos (`shared/types.ts`)
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

## Frontend

### Pestañas funcionales (`src/components/TicketDetailView.tsx`)
- Estado `activeTab: 'conversaciones' | 'actividades' | 'otros'` (default `'conversaciones'`).
- El array de pestañas pasa a objetos `{ key, label }`; el botón marca activo y setea `activeTab`.
  Etiquetas con conteo real: `${convCount} CONVERSACIONES`, `${actividades.length} ACTIVIDADES`.
- Área de contenido: `activeTab==='conversaciones'` → hilo actual; `'actividades'` → `<ActividadesPanel/>`;
  cualquier otra → placeholder "Pronto".
- Las actividades se cargan al abrir el ticket (`useAsync(fetchActivities, [ticketId])`), como las
  conversaciones, para tener el conteo.

### `ActividadesPanel` (componente nuevo, en el mismo archivo o `src/components/ActividadesPanel.tsx`)
Replica la captura: por fila → ícono tarea, **título** (bold), línea con **prioridad** + **creada/vence**,
**badge de estado** con color (`statusType==='Closed'`/`status==='Completed'`→verde; `In Progress`→azul;
`Waiting…`→ámbar; resto→gris), y **responsable** (`owner`). Estado vacío: "Este ticket no tiene actividades."

### `src/api/client.ts`
`fetchActivities(ticketId): Promise<Activity[]>` → `GET /api/tickets/:id/activities`.

## Pruebas
- **`activityRowFromZoho`**: mapea subject/priority/status/fechas, `ticket_id` desde `raw.ticketId`,
  `owner_name` desde `raw.assignee`.
- **`getActivities`** (pg-mem): filtra por `ticket_id`, ordena por due/created, resuelve owner.
- **`syncActivities`** (`zohoFetch` mock): pagina, upsert, y **corta** cuando ya no hay nada más nuevo
  (incremental).
- **Endpoint** (supertest+sesión): devuelve las actividades del ticket; **401** sin sesión.

## Fuera de alcance (v1)
- Crear/editar/completar/eliminar tareas (escritura a Zoho/PG).
- Eventos y Llamadas.
- Hacer funcionales las otras pestañas (Resolución, Entrada de tiempo, Adjunto, Aprobación, Historia) —
  solo muestran "Pronto".
- Badge de estado del ticket ("CERRADO" fijo) — se trata aparte.
