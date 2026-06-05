# Diseño — Subsistema F: Gestión de equipos

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Parte de:** programa de autonomía de la plataforma. Extiende el **Subsistema E** (registro de equipos,
solo lectura desde semilla) con alta/edición/baja en la app.
**Depende de:** E (tabla `equipos`, repo, `searchEquipos`), I (clientes de Books `/api/clients`), H1 (sesiones).

## Objetivo

Dar a los usuarios una página para **registrar y editar equipos** (los nuevos que vende Ambientalia) y
**desactivar** los que salen de circulación, sobre el registro `equipos` sembrado en E. Así el gate de
creación de tickets (que exige un equipo registrado) deja de depender de re-importar la semilla.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Permiso | **Cualquier usuario autenticado** (sin gate por área/admin) |
| Operaciones | **Crear + editar + desactivar** (soft, flag `active`); **sin** borrado físico (los tickets referencian `equipo_id`) |
| Marca / Tipo | Desplegables poblados desde **facetas** de la BD (valores distintos ya existentes); no constantes hardcodeadas |
| Cliente | Elegido de **Books** (`/api/clients`); se guarda `client_id` + `cliente_nombre` |
| Búsqueda de creación | `GET /api/equipos?search=` **no cambia**: sigue devolviendo solo **activos** |

## Modelo de datos

```sql
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS client_id text;
```
- `client_id` (nullable → `clients.id` de Books). Los sembrados quedan con `client_id` null y su
  `cliente_nombre` de texto; al editarlos y elegir el cliente de Books se **reconcilian** (set client_id +
  nombre). Aditivo e idempotente (en `server/db/schema.sql`).
- Los equipos creados a mano usan `id = 'eq-' + randomUUID()` (los sembrados usan el hash determinista de E).

## Backend (todo bajo `requireAuth`)

### Repo (`server/db/equipos.ts`, extiende lo de E)
- `createEquipo(db, input): Promise<string>` — genera `id`, INSERT; devuelve el id. `input = { serial, marca, modelo, tipo, clienteNombre, clientId }`.
- `updateEquipo(db, id, patch)` — campos editables: `serial, marca, modelo, tipo, clienteNombre, clientId`.
- `setEquipoActive(db, id, active)` — UPDATE `active`.
- `listEquiposManage(db, q, limit=50, offset=0)` — lista **activos e inactivos** (búsqueda por serial/cliente/marca/modelo/tipo), orden por `updated_at`/`serial`; devuelve `EquipoFull[]`.
- `equipoFacets(db)` — `{ marcas: string[], tipos: string[] }` (distintos no nulos, ordenados).
- `getEquipoFull(db, id): EquipoFull | null`.
- `searchEquipos` (de E) **sin cambios** (solo `active=true`, límite 20) — lo usa la creación de tickets.

### Endpoints (`server/app.ts`)
- `GET /api/equipos/manage?search=&page=` → `{ items: EquipoFull[], page }` (página de ~50; incluye inactivos).
- `GET /api/equipos/facets` → `{ marcas, tipos }`.
- `POST /api/equipos` → valida `serial` y `clientId` (cliente debe existir en `clients`); crea; 201 con `EquipoFull`.
- `PATCH /api/equipos/:id` → edita campos y/o `active`; 404 si no existe; 200 con `EquipoFull`.
- `GET /api/equipos?search=` (creación) — **no cambia**.

## Tipos compartidos (`shared/types.ts`)
`EquipoFull` = `EquipoLite` + `{ active: boolean; clientId?: string }`.
(`EquipoLite` ya existe: `{ id, serial, marca?, modelo?, tipo?, clienteNombre? }`.)

## Frontend
- `src/components/EquiposAdmin.tsx` (patrón `UsersAdmin.tsx`): pantalla completa con buscador, botón
  **"Nuevo equipo"**, tabla (serial · marca · modelo · tipo · cliente · estado) con **Editar** y
  **Activar/Desactivar** por fila. Modal de alta/edición:
  - Serial (texto, obligatorio), Modelo (texto).
  - Marca y Tipo: `<select>` poblados con `equipoFacets()` (permitiendo el valor actual aunque no esté en la lista, al editar).
  - Cliente: buscador sobre `/api/clients` (reusa `searchClients`) → fija `clientId` + nombre. Obligatorio.
- Entrada **"Equipos"** en el menú del Header (icono, visible para todos; no admin-only).
- `src/api/client.ts`: `listEquiposManage(search, page)`, `createEquipo(input)`, `updateEquipo(id, patch)`,
  `setEquipoActive(id, active)`, `equipoFacets()`. Reusa `searchClients`.
- `src/App.tsx`: estado `showEquipos` + render de `EquiposAdmin`.

## Manejo de errores y seguridad
- Todos los endpoints bajo `requireAuth`. Validaciones en servidor (serial y cliente obligatorios; 404 al
  editar inexistente). Búsquedas con parámetros ligados (sin inyección). `equipoFacets` interpola solo
  nombres de columna literales.
- Un equipo desactivado no aparece en `searchEquipos` → no se pueden crear tickets nuevos con él.

## Pruebas
- **Repo** (pg-mem): `createEquipo` (id propio `eq-…`, guarda client_id), `updateEquipo`, `setEquipoActive`
  (sale de `searchEquipos`), `listEquiposManage` (incluye inactivos + filtra por búsqueda), `equipoFacets`
  (distintos).
- **Endpoints** (supertest+sesión): crear (422 sin serial/cliente; 422 si el cliente no existe), editar,
  desactivar; `manage` lista inactivos; `facets` devuelve listas; **401 sin sesión**; `searchEquipos` sigue
  excluyendo inactivos.

## Fuera de alcance
- Borrado físico de equipos.
- Historial de cambios del equipo (auditoría).
- La **vista de hoja de vida** del equipo (historial de tickets) — pieza aparte.
- Reconciliación masiva automática equipo↔Books (solo se reconcilia al editar a mano).
