# Diseño — Subsistema H1: Autenticación + gestión de usuarios

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Parte de:** Subsistema **H** (RBAC/auth), descompuesto en **H1** (auth + usuarios), **H2** (roles y
permisos), **H3** (página de configuración). Este spec cubre **solo H1**.
**Depende de:** modelo de datos en Postgres (Subsistema A). Reemplaza el actor temporal de B
(`TRANSITION_ACTOR`) por el usuario autenticado.

## Objetivo

Dar a la app **autenticación con correo + contraseña** y **gestión de usuarios por un administrador**,
dejando **toda la app detrás del login**. Es la base sobre la que H2 montará roles y permisos.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Mecanismo de login | Correo + contraseña (cuentas locales en Postgres) |
| Sesión | Cookie **httpOnly** `sid` + tabla `sessions` en servidor (revocable), expira a 30 días |
| Hash de contraseñas | **bcryptjs** (puro JS, sin compilación nativa) |
| Alta de usuarios | Un **admin crea** cada usuario (sin auto-registro ni aprobación) |
| Distinción de permisos en H1 | Flag booleano **`is_admin`** (los roles ricos llegan en H2) |
| Primer acceso (bootstrap) | Admin inicial sembrado desde env `ADMIN_EMAIL` / `ADMIN_PASSWORD` si no hay usuarios |

## Modelo de datos (Postgres)

```sql
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,                       -- uuid
  email text UNIQUE NOT NULL,                -- normalizado a minúsculas
  name text NOT NULL,
  password_hash text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,                    -- aleatorio (32 bytes hex)
  user_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
```
Se añaden al `schema.sql` existente (idempotente, `CREATE ... IF NOT EXISTS`); no requiere recrear nada.

## Backend

### Hashing y sesiones (unidad `server/auth/`)
- `server/auth/passwords.ts` — `hashPassword(plain): Promise<string>`, `verifyPassword(plain, hash): Promise<boolean>` (bcryptjs, cost 10).
- `server/auth/sessions.ts` — sobre `Queryable`:
  - `createSession(db, userId): Promise<string>` (genera token de 32 bytes hex, expira a 30 días, inserta).
  - `getSessionUser(db, token): Promise<User | null>` (join sessions→users; null si expirada/inexistente/usuario inactivo).
  - `deleteSession(db, token)`, `deleteUserSessions(db, userId)` (al desactivar o cambiar contraseña).
- `server/auth/users.ts` (repo de usuarios sobre `Queryable`): `createUser`, `getUserByEmail`, `getUserById`, `listUsers`, `updateUser` (name/is_admin/active), `setPassword`, `countUsers`. El email se normaliza a minúsculas. Devuelve un tipo `User` **sin** `password_hash` para respuestas (un `UserPublic`).

### Middleware (`server/auth/middleware.ts`)
- `requireAuth(db)` → lee la cookie `sid`, resuelve el usuario; si no, `401`. Adjunta `req.user`.
- `requireAdmin` → exige `req.user.is_admin`; si no, `403`. (Se aplica tras `requireAuth`.)

### Endpoints
Auth:
- `POST /api/auth/login` `{ email, password }` → verifica (credenciales + `active`); crea sesión; `Set-Cookie: sid=…; HttpOnly; SameSite=Lax; Max-Age=30d`; devuelve `UserPublic`. Credenciales inválidas o usuario inactivo → `401` con **mensaje genérico** ("Correo o contraseña incorrectos").
- `POST /api/auth/logout` → borra la sesión y limpia la cookie.
- `GET /api/auth/me` → `UserPublic` del usuario actual, o `401` si no hay sesión.
- `POST /api/auth/change-password` `{ currentPassword, newPassword }` (requiere auth) → verifica la actual, guarda la nueva (hash), **invalida las demás sesiones** del usuario (mantiene la actual). `newPassword` mínimo 8 caracteres.

Usuarios (admin):
- `GET /api/users` → lista de `UserPublic`.
- `POST /api/users` `{ email, name, isAdmin?, password }` → crea (email único, normalizado; `password` ≥ 8). `409` si el email ya existe.
- `PATCH /api/users/:id` `{ name?, isAdmin?, active?, password? }` → edita. Al pasar `active=false` o `password`, **invalida las sesiones** de ese usuario.

### Bootstrap del admin inicial
Al arrancar (`server/index.ts`), tras migrar: si `countUsers() === 0` y existen `ADMIN_EMAIL`+`ADMIN_PASSWORD`, crear ese usuario admin (`is_admin=true`, `active=true`). Log claro. Si ya hay usuarios, no hace nada.

### Protección de rutas existentes
Tras H1, **todas** las rutas `/api/tickets*` (lectura, transición, reply) y `/api/users*` requieren sesión (`requireAuth`). Las rutas admin existentes (`/api/admin/*`) siguen con su `ADMIN_TOKEN` (operación/infra), independiente del login de usuarios.

### Integración con B (actor de transición)
El endpoint `POST /api/tickets/:id/transition` usa `req.user.name` como actor (en vez de la constante
`TRANSITION_ACTOR`). El historial y el comentario quedan a nombre del usuario autenticado. `TRANSITION_ACTOR`
se mantiene solo como respaldo si por algún motivo no hubiera usuario (no debería ocurrir tras H1).

## Frontend

- **Contexto de auth** (`src/auth/AuthContext.tsx`): carga `GET /api/auth/me` al inicio; expone `user`, `login`, `logout`, `loading`. Cliente API envía cookies (`credentials: 'include'`).
- **Pantalla de Login** (`src/components/Login.tsx`): formulario correo + contraseña; muestra error genérico; al éxito, entra a la app.
- **Gate** en `src/App.tsx`: mientras carga `me`, spinner; si no hay `user`, renderiza `Login`; si hay, la app actual.
- **Menú de usuario** (en `Header`): nombre del usuario, "Cambiar contraseña" (modal), "Cerrar sesión".
- **Página "Usuarios"** (solo admin, `src/components/UsersAdmin.tsx`): tabla (correo, nombre, admin, activo) + "Nuevo usuario" (modal: correo, nombre, ¿admin?, contraseña inicial) + acciones por fila (activar/desactivar, resetear contraseña). Se llega desde el menú/sidebar; oculta si no es admin.
- Estilo: el actual de la app (no se piden detalles visuales especiales).

## Manejo de errores y seguridad

- Contraseñas **siempre hasheadas** (bcrypt); nunca se devuelve `password_hash`.
- Cookie **httpOnly + SameSite=Lax**; no accesible por JS (mitiga XSS-robo de sesión).
- Sesiones con **expiración** y **revocables** (logout, desactivación, cambio de contraseña).
- Login con **mensaje genérico** (no revela si el correo existe).
- `password` mínimo 8 caracteres (alta y cambio).
- Usuario **inactivo** no puede iniciar sesión y sus sesiones se invalidan al desactivarlo.
- `401` → el frontend vuelve al login automáticamente (sesión expirada).

## Pruebas

- **passwords**: hash distinto del texto plano; `verifyPassword` true/false correctos.
- **sessions** (pg-mem): crear→resolver usuario; expirada→null; usuario inactivo→null; borrar.
- **users repo** (pg-mem): crear (email normalizado, único→error), get por email/id, listar, update (active/isAdmin/name), setPassword.
- **middleware**: `requireAuth` 401 sin cookie / con token inválido; ok con sesión; `requireAdmin` 403 a no-admin.
- **endpoints** (supertest + pg-mem): login ok / credenciales malas (401 genérico) / inactivo (401); `me`; logout; change-password (actual mala→401, ok invalida otras sesiones); CRUD usuarios (no-admin→403, email duplicado→409); rutas de tickets sin sesión→401.
- **bootstrap**: con 0 usuarios + env → crea admin; con usuarios existentes → no hace nada.
- **integración B**: una transición autenticada registra `performed_by` = nombre del usuario logueado.

## Fuera de alcance (→ otros subsistemas)

- **H2**: roles ricos (Director Técnico, Supervisor, Agente, Comercial…) con capacidades (qué
  transiciones/acciones/vistas/edición), y su enforcement. En H1 solo existe `is_admin`.
- **H3**: página de configuración avanzada (gestión visual de roles + matriz de permisos), aprobación de
  perfiles, auto-registro.
- Reseteo de contraseña por correo / enlaces mágicos (requiere el canal de correo, Subsistema D).
- 2FA, políticas de contraseña avanzadas, bloqueo por intentos (se puede añadir luego).
