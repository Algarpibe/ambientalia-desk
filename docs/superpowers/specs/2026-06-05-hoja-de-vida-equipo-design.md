# Diseño — Hoja de vida del equipo

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Parte de:** programa de autonomía de la plataforma. Cierra la trilogía de equipos: **E** (registro) → **F**
(gestión) → **Hoja de vida** (historial).
**Depende de:** E/F (`equipos`, `equipo_id`), B (`ticket_transitions`), A (tickets tipados con `serial`).

## Objetivo

Mostrar, por equipo, su **historial de servicio** construido desde los tickets: una vista de solo lectura
con los datos del equipo + sus tickets + la línea de tiempo de transiciones de cada uno. Realiza la visión
del usuario ("hojas de vida de los equipos, alimentadas por la información de los tickets").

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Acceso | Desde la **página Equipos** (botón por fila) **y** desde el **detalle del ticket** (enlace al equipo) |
| Contenido | Cabecera del equipo + lista de tickets + **línea de tiempo de transiciones** por ticket |
| Qué tickets | Los que tienen `equipo_id` = ese equipo **O** `serial` = el serial del equipo (incluye históricos de Zoho) |
| Naturaleza | **Solo lectura**; sin escrituras nuevas |

**Caveat aceptado:** seriales repetidos en distintos equipos (pocos casos en la semilla) podrían mezclar
tickets entre esos equipos. Se asume; documentado.

## Backend

### Endpoint (`server/app.ts`, con sesión)
`GET /api/equipos/:id/historial` → `EquipoHistorial` (404 si el equipo no existe).

### Repo (`server/db/equipos.ts`)
`getEquipoHistorial(db, id): Promise<EquipoHistorial | null>`:
1. `getEquipoFull(db, id)`; si null → null.
2. Tickets del equipo: `SELECT t.id, t.number, t.subject, t.status, t.status_type, t.created_time,
   t.codigo_servicio, t.tipo_servicio, g.name AS agent_name FROM tickets t LEFT JOIN agents g ON
   t.assignee_id=g.id WHERE t.equipo_id=$1 OR (COALESCE(t.serial,'') <> '' AND t.serial=$2) ORDER BY
   t.created_time DESC NULLS LAST` (con `$2` = el serial del equipo).
3. Transiciones de esos tickets: `SELECT ticket_id, transition_name, from_status, to_status, area,
   performed_by, performed_at FROM ticket_transitions WHERE ticket_id IN (SELECT t.id FROM tickets t WHERE
   t.equipo_id=$1 OR (COALESCE(t.serial,'') <> '' AND t.serial=$2)) ORDER BY performed_at`.
4. Agrupar las transiciones por `ticket_id` y anidarlas en cada ticket.

### Tipos compartidos (`shared/types.ts`)
```ts
export interface HistorialTransition {
  transitionName: string | null
  fromStatus: string | null
  toStatus: string | null
  area: string | null
  performedBy: string | null
  performedAt: string | null
}
export interface HistorialTicket {
  id: string
  number: string            // "#123"
  subject: string
  status: string
  statusType?: string | null
  createdAt?: string | null
  tecnico?: string | null
  codigoServicio?: string | null
  tipoServicio?: string | null
  transitions: HistorialTransition[]
}
export interface EquipoHistorial {
  equipo: EquipoFull
  tickets: HistorialTicket[]
}
```

### Detalle del ticket expone el equipo
`rowToTicketDetail` (en `server/db/mappers.ts`) añade `equipoId: row.equipo_id ?? undefined`, y `TicketDetail`
gana `equipoId?: string | null`. Sirve para el enlace "Hoja de vida" desde el detalle (solo cuando el ticket
tiene equipo vinculado).

## Frontend

- `src/components/HojaDeVida.tsx` (overlay pantalla completa):
  - **Cabecera**: serie · marca · modelo · tipo · cliente · estado (activo/inactivo) del equipo.
  - **Lista de tickets** (más reciente primero): por cada uno, número + asunto + estado + fecha + técnico +
    código/tipo de servicio, y debajo su **línea de tiempo** de transiciones (de→a · área · quién · cuándo).
  - Botón **"Abrir ticket"** por ticket → la hoja monta su propio `TicketDetailView` (autocontenida; sirve
    desde ambos accesos sin cablear navegación global).
  - Estados de carga/vacío ("Este equipo aún no tiene tickets").
- `src/api/client.ts`: `fetchEquipoHistorial(id): Promise<EquipoHistorial>`.
- `src/components/EquiposAdmin.tsx`: botón **"Hoja de vida"** por fila → abre `HojaDeVida`.
- `src/components/TicketDetailView.tsx`: enlace **"Hoja de vida del equipo"** (visible si `ticket.equipoId`)
  → abre `HojaDeVida` para ese equipo.

## Manejo de errores y seguridad
- Endpoint bajo `requireAuth`. Consultas con parámetros ligados (sin inyección). 404 si el equipo no existe.
- Solo lectura: la hoja no modifica nada.

## Pruebas
- **Repo** (pg-mem): `getEquipoHistorial` empareja por `equipo_id` Y por `serial` (un ticket de cada vía),
  anida las transiciones en su ticket, ordena tickets por fecha desc; devuelve null si el equipo no existe.
- **Endpoint** (supertest+sesión): devuelve `{ equipo, tickets[] }` con transiciones; **404** equipo
  inexistente; **401** sin sesión.
- **Mapper**: `rowToTicketDetail` expone `equipoId`.

## Fuera de alcance
- Comentarios/notas técnicas de cada ticket dentro de la hoja (se ven al abrir el ticket).
- Exportar la hoja a PDF.
- Métricas agregadas por equipo (van en reportería, Subsistema G).
- Editar/anotar el historial manualmente.
- Reconciliar seriales repetidos (caveat aceptado).
