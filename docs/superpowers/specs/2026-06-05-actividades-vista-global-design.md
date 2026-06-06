# Diseño — Vista global de Actividades (tab "Actividades")

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** El tab "Actividades" del Header es decorativo. Debe abrir una pantalla que replica la vista
"Todas las Actividades" de Zoho Desk: lista global de todas las tareas (de todos los tickets), con vistas
(Todas/Abiertas/Vencidas), búsqueda, y cada fila lleva su ticket.
**Depende de:** subsistema "Actividades del ticket" (tabla `activities` ya sincronizada), A (tickets), H1 (sesiones).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Vistas (sidebar) | **Todas las Actividades · Abiertas · Vencidas** (las "Mi…" de Zoho quedan fuera: requieren vincular usuario↔agente) |
| Volumen (~3000) | **Recientes (limit 300) + búsqueda** server-side (por rendimiento) |
| Clic en actividad | **Abre su ticket** (cierra Actividades + abre `TicketDetailView`) |
| Tipos | **Solo Tareas** (lo que sincronizamos); Llamadas/Eventos fuera de v1 |

## Backend

### Tipo (`shared/types.ts`)
```ts
export interface ActivityListItem {
  id: string; subject: string; status: string; statusType: string | null; priority: string | null
  dueDate: string | null; owner: string | null; ticketId: string | null; ticketNumber: string | null
}
```

### Repo `getAllActivities(db, opts)` (`server/db/activities.ts`)
`opts: { filter: 'todas' | 'abiertas' | 'vencidas'; search: string; limit: number }`.
```sql
SELECT a.id, a.subject, a.status, a.status_type, a.priority, a.due_date, a.owner_name, a.ticket_id,
       t.number AS ticket_number, g.name AS agent_name
FROM activities a
LEFT JOIN tickets t ON a.ticket_id = t.id
LEFT JOIN agents g ON a.owner_id = g.id
WHERE 1=1
  -- filtro: abiertas → a.status_type <> 'Closed'; vencidas → a.due_date < now() AND a.status_type <> 'Closed'
  -- search → LOWER(a.subject) LIKE LOWER('%'||$x||'%')
ORDER BY COALESCE(a.due_date, a.created_time) DESC NULLS LAST
LIMIT $limit
```
Map: `ticketNumber = ticket_number != null ? '#'+ticket_number : null`, `owner = owner_name ?? agent_name ?? null`.
Parámetros ligados; `filter` se traduce a cláusulas fijas (no interpolar entrada de usuario).

### Endpoint (`server/app.ts`, `requireAuth(db)`)
`GET /api/activities?filter=todas|abiertas|vencidas&search=&limit=` → `getAllActivities` (default `filter=todas`,
`limit=300`). Distinto de `GET /api/tickets/:id/activities` (por-ticket), sin conflicto de ruta.

## Frontend

### Util compartido `src/lib/actividades.ts`
`traducirEstado(status)`, `traducirPrioridad(priority)`, `estadoBadgeClass(status, statusType)` (los mapas que
hoy están dentro de `ActividadesPanel.tsx`). **Refactor**: `ActividadesPanel` pasa a importarlos (DRY), y la
nueva página los reutiliza.

### `src/components/ActividadesPage.tsx` (overlay pantalla completa) — réplica de la imagen
- Barra superior oscura: volver + "Actividades".
- **Sidebar izq**: "VISTAS CON ESTRELLAS / Todas las Actividades (activa) / Abiertas / Vencidas" (cambian el
  filtro); "TODAS LAS VISTAS" decorativo. Abajo: "Tareas" (activo); Llamadas/Eventos decorativos.
- **Header**: título de la vista + **buscador** + "Vista clásica" (decorativo).
- **Lista**: por fila → ícono `task_alt` · **título** (bold) · `#{ticketNumber} · {owner} · {prioridad
  traducida} · {fecha}` · **badge de estado** (traducido + color). Clic → `onSelectTicket(ticketId)`.
- Estado de carga/vacío. `filter` + `search` → re-fetch (`useAsync` con deps).

### `src/api/client.ts`
`fetchAllActivities(filter: string, search: string): Promise<ActivityListItem[]>`.

### Wiring
- `src/components/Header.tsx`: el tab **"Actividades"** se vuelve funcional (`onClick` → `onOpenActividades`,
  para cualquier usuario con sesión).
- `src/App.tsx`: estado `showActividades`; rinde `<ActividadesPage onClose=… onSelectTicket={(id) => {
  setShowActividades(false); setSelectedTicketId(id) }} />`.

## Pruebas
- **`getAllActivities`** (pg-mem): trae con `ticketNumber` (join), `owner`; filtro **abiertas** excluye
  Completed; **vencidas** = due pasada y no completada; **search** filtra por subject; respeta `limit`.
- **`traducirEstado`/`traducirPrioridad`** (puro): mapeos + fallback.
- **Endpoint** (supertest+sesión): devuelve la lista; el `filter` acota; **401** sin sesión.

## Fuera de alcance (v1)
- Vistas "Mi Actividades / vencidas / Missed" (requieren mapear usuario↔agente de Zoho).
- Llamadas y Eventos (otros módulos).
- Crear/editar/completar actividades; "Vista clásica"/otros modos; paginación infinita (se usa limit+búsqueda).
