# Diseño — Subsistema H2: Roles y permisos (por área)

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Parte de:** Subsistema **H** (RBAC). H1 (auth + usuarios) ya está. Este spec es **H2**.
**Depende de:** H1 (usuarios, `is_admin`, sesiones) y B (motor de transiciones con campo `area`).

## Objetivo

Que **cada transición del Blueprint solo la pueda ejecutar una persona del área responsable** de esa
transición. Se introducen **roles** (creados por un admin) que otorgan un conjunto de **áreas**; cada
usuario tiene un rol. El backend impone el permiso (403); el frontend solo muestra los botones que el
usuario puede usar.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Unidad de permiso | **Área responsable** de la transición |
| Áreas base | **Comercial · Servicio Técnico · Compras** (las del Blueprint) |
| "Gerencia" / Director | Un **rol con las 3 áreas** (no es un área nueva) |
| Roles | Datos: el admin crea roles (nombre + áreas) y los asigna a usuarios |
| Rol por usuario | **Uno** (`users.role_id`, nullable) |
| `is_admin` (de H1) | **Super-usuario**: todas las áreas + gestiona usuarios y roles |
| No-admin sin rol | Ve el tablero, **no** puede ejecutar transiciones |
| Alcance | **Solo transiciones**; visualización/edición/responder por rol → futuro |

## Áreas y transiciones

Cada transición tiene `area` (`shared/transitions.ts`), con estos valores: `Comercial`,
`Servicio Técnico`, `Comercial / Compras`, `Comercial / Servicio Técnico`. Se descompone en **áreas base**
partiendo por `' / '`:

- `areasForTransition('Comercial')` → `['Comercial']`
- `areasForTransition('Comercial / Compras')` → `['Comercial', 'Compras']`
- `areasForTransition('Comercial / Servicio Técnico')` → `['Comercial', 'Servicio Técnico']`

Constante base: `AREAS = ['Comercial', 'Servicio Técnico', 'Compras']`.

**Regla de permiso** (pura, compartida frontend+backend, en `shared/permissions.ts`):
```ts
canExecuteTransition(userAreas: string[], isAdmin: boolean, transitionArea: string): boolean
// = isAdmin || areasForTransition(transitionArea).some(a => userAreas.includes(a))
```

## Modelo de datos (Postgres)

```sql
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  areas jsonb NOT NULL DEFAULT '[]'::jsonb,   -- subconjunto de AREAS
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id text;   -- para DBs existentes (prod)
```
La columna `role_id` se añade también dentro del `CREATE TABLE users` (para DB nuevas / pg-mem); el
`ALTER … IF NOT EXISTS` cubre la DB de producción ya existente. Migrate es tolerante por sentencia.

## Resolución de áreas efectivas del usuario

`UserPublic` (en `shared/types.ts`) gana: `roleId?: string | null`, `roleName?: string | null`,
`areas: string[]`. Se resuelven al iniciar sesión y en cada `GET /api/auth/me` (vía `getSessionUser`, que
hace `LEFT JOIN roles`):

- `is_admin = true` → `areas = AREAS` (las 3), `roleName` opcional.
- si no, y el rol está **activo** → `areas = role.areas`, `roleName = role.name`.
- sin rol o rol inactivo → `areas = []`.

Así, cambiar el rol de un usuario aplica al recargar (las áreas se recalculan en cada `me`/login; la
sesión sigue válida).

## Backend

- `shared/transitions.ts`: añadir `AREAS` y `areasForTransition(area)`.
- `shared/permissions.ts` (nuevo): `canExecuteTransition(...)` (puro, testeable, sin deps).
- `server/auth/roles.ts` (nuevo, repo sobre `Queryable`): `createRole`, `listRoles`, `getRole`,
  `updateRole(id, { name?, areas?, active? })`. Valida que `areas ⊆ AREAS`. Nombre único.
- `server/auth/users.ts`: `updateUser` y `createUser` aceptan `roleId` (nullable).
- `server/auth/sessions.ts`: `getSessionUser` resuelve `roleId/roleName/areas` (LEFT JOIN roles).
- `server/auth/routes.ts`:
  - `GET /api/roles` (auth + admin) → lista de roles.
  - `POST /api/roles` (admin) `{ name, areas }` → crea (valida nombre no vacío, áreas ⊆ AREAS, nombre único→409).
  - `PATCH /api/roles/:id` (admin) `{ name?, areas?, active? }`.
  - `PATCH /api/users/:id` (admin): acepta además `roleId` (asignar/quitar rol).
  - `POST /api/auth/login` y `GET /api/auth/me`: devuelven `UserPublic` con `areas`/`roleId`/`roleName`.
- **Enforcement** en `POST /api/tickets/:id/transition` (`server/app.ts`): tras validar la transición y
  ANTES de aplicarla, si `!canExecuteTransition(req.user.areas, req.user.isAdmin, t.area)` → **403**
  (`{ error: 'Tu rol no tiene permiso para esta transición (área: …)' }`).

## Frontend

- `src/api/client.ts`: `listRoles()`, `createRole({name,areas})`, `updateRole(id, patch)`; `updateUser`
  ya permite `roleId` (extender su tipo de patch).
- `src/auth/AuthContext.tsx`: el `user` ya trae `areas`/`isAdmin` (vía `me`); sin cambios de API.
- `src/components/TransitionPanel.tsx`: usa `useAuth()` y **filtra** las transiciones a las que el usuario
  puede ejecutar (`canExecuteTransition(user.areas, user.isAdmin, t.area)`). Si no hay transiciones
  permitidas para su estado/rol, muestra "Sin transiciones disponibles para tu rol".
- `src/components/RolesAdmin.tsx` (nuevo, solo admin): tabla de roles + "Nuevo rol" (nombre + casillas de
  las 3 áreas) + editar/activar-desactivar. Se abre desde el Header (junto a "Usuarios").
- `src/components/UsersAdmin.tsx`: añadir una columna/control **Rol** por usuario (desplegable con los roles
  activos) que llama `updateUser(id, { roleId })`.
- `src/components/Header.tsx`: añadir un icono "Roles" (solo admin) que abre `RolesAdmin`.

## Manejo de errores y seguridad

- La autorización real vive en el **backend** (403 en la transición). El filtrado del frontend es solo UX.
- Admin (`is_admin`) bypassa todo. Un no-admin sin rol no puede transicionar (areas vacías).
- Validación: `areas ⊆ AREAS`; nombre de rol único (409). Al asignar `roleId` a un usuario se valida que
  el rol exista → si no, **422**. Pasar `roleId: null` quita el rol (válido).
- Desactivar un rol → sus usuarios quedan con `areas = []` (no pueden transicionar) hasta reasignarse.

## Pruebas

- **`areasForTransition`**: descompone compuestas; simples quedan igual.
- **`canExecuteTransition`** (puro): admin siempre true; rol que cubre el área true; que no cubre false;
  áreas vacías false; compuesta cubierta por una de las áreas del rol true.
- **roles repo** (pg-mem): crear (áreas válidas, nombre único→error), listar, update (name/areas/active).
- **users repo**: asignar/quitar `roleId`.
- **`getSessionUser`** (pg-mem): admin→3 áreas; con rol activo→áreas del rol; rol inactivo/sin rol→[].
- **endpoint transición** (supertest+pg-mem): no-admin con rol que NO cubre el área → **403**; con rol que
  cubre → **200**; admin → **200**; usuario sin rol → **403**.
- **roles CRUD** (supertest): no-admin → 403; áreas inválidas → 422; nombre duplicado → 409.
- **login/me**: devuelven `areas` correctas según el rol.

## Fuera de alcance (futuro)

- Restringir **qué tickets ve** cada rol; **edición de campos**; gatear **"Responder"** por rol (el correo
  se rehace en el Subsistema D); aprobación/auto-registro de perfiles; múltiples roles por usuario.
- Re-etiquetar transiciones del Blueprint con un área "Gerencia" propia (se decidió que Gerencia es un rol
  con todas las áreas).
