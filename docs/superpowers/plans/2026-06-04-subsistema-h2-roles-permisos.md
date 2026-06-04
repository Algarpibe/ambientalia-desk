# Subsistema H2 — Roles y permisos (por área) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada transición del Blueprint solo la pueda ejecutar un usuario cuyo rol cubre el área responsable de esa transición; un admin crea roles (nombre + áreas) y los asigna a usuarios. El backend impone el permiso (403); el frontend filtra los botones.

**Architecture:** Áreas base `Comercial / Servicio Técnico / Compras`. Tabla `roles` (areas jsonb) + `users.role_id`. `UserPublic` gana `areas` (resueltas al login/`me`: admin→las 3, rol activo→sus áreas, sin rol→ninguna). Helper puro `canExecuteTransition` compartido frontend+backend. El endpoint de transición valida con 403; `TransitionPanel` filtra. Página admin de Roles + selector de rol en Usuarios.

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React. Spec: `docs/superpowers/specs/2026-06-04-subsistema-h2-roles-permisos-design.md`.

**Contexto:** repo en `main`. H1 ya dio auth/usuarios (`server/auth/`: `users.ts`, `sessions.ts`, `routes.ts`, `middleware.ts`; `UserPublic` en `shared/types.ts`; `requireAuth`/`requireAdmin`). El endpoint de transición está en `server/app.ts` y ya tiene `req.user` (por `app.use('/api/tickets', requireAuth(db))`). `shared/transitions.ts` tiene `TRANSITIONS`/`transitionsForStatus`/`transitionById` y cada `Transition` tiene `area`.

---

## Estructura de archivos

- Modify `shared/transitions.ts` — `AREAS` + `areasForTransition(area)`.
- Create `shared/permissions.ts` — `canExecuteTransition(...)`.
- Modify `shared/types.ts` — `UserPublic` gana `roleId?`, `roleName?`, `areas`.
- Modify `server/db/schema.sql` — tabla `roles` + `users.role_id` (+ ALTER).
- Modify `server/db/migrate.test.ts` — afirmar tabla `roles`.
- Create `server/auth/roles.ts` — repo de roles.
- Modify `server/auth/users.ts` — `role_id`, resolución enriquecida (`rowToPublicUser`, `getUserById`/`listUsers`/`createUser`/`updateUser`), `UserWithHash` independiente.
- Modify `server/auth/sessions.ts` — `getSessionUser` resuelve áreas (join roles).
- Modify `server/auth/routes.ts` — roles CRUD + `roleId` en usuarios + login devuelve áreas.
- Modify `server/app.ts` — enforcement 403 en transición.
- Modify `server/app.test.ts` — tests de permiso por área.
- Modify `src/api/client.ts` — funciones de roles + `roleId` en `updateUser`.
- Modify `src/components/TransitionPanel.tsx` — filtrar por áreas del usuario.
- Create `src/components/RolesAdmin.tsx` — página admin de roles.
- Modify `src/components/UsersAdmin.tsx` — selector de rol por usuario.
- Modify `src/components/Header.tsx` — icono "Roles" (admin).
- Modify `src/App.tsx` — estado/render de `RolesAdmin`.

---

## Task 1: Áreas + helper de permiso (compartido, puro)

**Files:**
- Modify: `shared/transitions.ts`
- Create: `shared/permissions.ts`
- Create: `shared/permissions.test.ts`

- [ ] **Step 1: Añadir a `shared/transitions.ts`** (al final del archivo, tras las exportaciones existentes):
```ts
/** Áreas base de permiso (las del Blueprint, descompuestas). */
export const AREAS = ['Comercial', 'Servicio Técnico', 'Compras'] as const

/** Descompone el `area` de una transición en áreas base (las compuestas usan ' / '). */
export function areasForTransition(area: string): string[] {
  return area.split(' / ').map((s) => s.trim()).filter(Boolean)
}
```

- [ ] **Step 2: Escribir el test `shared/permissions.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { canExecuteTransition } from './permissions'
import { areasForTransition } from './transitions'

describe('areasForTransition', () => {
  it('descompone compuestas y deja simples', () => {
    expect(areasForTransition('Comercial')).toEqual(['Comercial'])
    expect(areasForTransition('Comercial / Compras')).toEqual(['Comercial', 'Compras'])
    expect(areasForTransition('Comercial / Servicio Técnico')).toEqual(['Comercial', 'Servicio Técnico'])
  })
})

describe('canExecuteTransition', () => {
  it('admin siempre puede', () => {
    expect(canExecuteTransition([], true, 'Servicio Técnico')).toBe(true)
  })
  it('rol que cubre el área puede; el que no, no', () => {
    expect(canExecuteTransition(['Servicio Técnico'], false, 'Servicio Técnico')).toBe(true)
    expect(canExecuteTransition(['Comercial'], false, 'Servicio Técnico')).toBe(false)
  })
  it('compuesta: basta cubrir una de las áreas', () => {
    expect(canExecuteTransition(['Compras'], false, 'Comercial / Compras')).toBe(true)
  })
  it('sin áreas no puede', () => {
    expect(canExecuteTransition([], false, 'Comercial')).toBe(false)
  })
})
```

- [ ] **Step 3: Ejecutar y ver fallar**
Run: `npx vitest run shared/permissions.test.ts`
Expected: FAIL (`canExecuteTransition` no existe).

- [ ] **Step 4: Implementar `shared/permissions.ts`**
```ts
import { areasForTransition } from './transitions'

/** ¿Puede un usuario con estas áreas (o admin) ejecutar una transición de `transitionArea`? */
export function canExecuteTransition(userAreas: string[], isAdmin: boolean, transitionArea: string): boolean {
  if (isAdmin) return true
  return areasForTransition(transitionArea).some((a) => userAreas.includes(a))
}
```

- [ ] **Step 5: Ejecutar y ver pasar**
Run: `npx vitest run shared/permissions.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add shared/transitions.ts shared/permissions.ts shared/permissions.test.ts
git commit -m "feat(H2): AREAS + areasForTransition + canExecuteTransition (shared, pure)"
```

---

## Task 2: Esquema `roles` + `users.role_id`

**Files:**
- Modify: `server/db/schema.sql`
- Modify: `server/db/migrate.test.ts`

- [ ] **Step 1: Añadir a `server/db/schema.sql`**

(a) Dentro del `CREATE TABLE IF NOT EXISTS users (...)`, añade la columna `role_id text` (p.ej. tras `active boolean ...`). El bloque `users` queda con esa columna añadida.
(b) Al final del archivo añade:
```sql
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id text;
```
(El `ALTER` cubre la DB de producción ya existente; en DB nuevas/pg-mem la columna ya viene del `CREATE`. Migrate es tolerante por sentencia, así que si pg-mem no soporta el `ALTER … IF NOT EXISTS` se ignora sin romper.)

- [ ] **Step 2: Extender `server/db/migrate.test.ts`** — añade `'roles'` al array de tablas esperadas del primer test:
```ts
    for (const t of ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments', 'ticket_transitions', 'users', 'sessions', 'roles']) {
      expect(names).toContain(t)
    }
```

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run server/db/migrate.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql server/db/migrate.test.ts
git commit -m "feat(H2): roles table + users.role_id column"
```

---

## Task 3: Repo de roles (`roles.ts`)

**Files:**
- Create: `server/auth/roles.ts`
- Create: `server/auth/roles.test.ts`

- [ ] **Step 1: Escribir el test `server/auth/roles.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { createRole, listRoles, getRole, updateRole } from './roles'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('roles repo', () => {
  it('crea con áreas válidas (filtra inválidas) y lista', async () => {
    const r = await createRole(db, { name: 'Técnico', areas: ['Servicio Técnico', 'Inventado'] })
    expect(r.name).toBe('Técnico')
    expect(r.areas).toEqual(['Servicio Técnico'])
    expect(r.active).toBe(true)
    expect((await listRoles(db)).length).toBe(1)
    expect((await getRole(db, r.id))!.areas).toEqual(['Servicio Técnico'])
  })

  it('update name/areas/active', async () => {
    const r = await createRole(db, { name: 'X', areas: ['Comercial'] })
    await updateRole(db, r.id, { name: 'Comercial', areas: ['Comercial', 'Compras'], active: false })
    const got = await getRole(db, r.id)
    expect(got!.name).toBe('Comercial')
    expect(got!.areas).toEqual(['Comercial', 'Compras'])
    expect(got!.active).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/auth/roles.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `server/auth/roles.ts`**
```ts
import { randomUUID } from 'node:crypto'
import type { Queryable } from '../db/migrate'
import { AREAS } from '../../shared/transitions'

export interface Role { id: string; name: string; areas: string[]; active: boolean }

function rowToRole(r: any): Role {
  return { id: r.id, name: r.name, areas: Array.isArray(r.areas) ? r.areas : [], active: r.active }
}
function validAreas(areas: unknown): string[] {
  if (!Array.isArray(areas)) return []
  return areas.filter((a): a is string => typeof a === 'string' && (AREAS as readonly string[]).includes(a))
}

export async function createRole(db: Queryable, input: { name: string; areas: string[] }): Promise<Role> {
  const r = await db.query(
    'INSERT INTO roles (id,name,areas,updated_at) VALUES ($1,$2,$3,now()) RETURNING id,name,areas,active',
    [randomUUID(), input.name.trim(), JSON.stringify(validAreas(input.areas))],
  )
  return rowToRole(r.rows[0])
}

export async function listRoles(db: Queryable): Promise<Role[]> {
  const r = await db.query('SELECT id,name,areas,active FROM roles ORDER BY name')
  return r.rows.map(rowToRole)
}

export async function getRole(db: Queryable, id: string): Promise<Role | null> {
  const r = await db.query('SELECT id,name,areas,active FROM roles WHERE id=$1', [id])
  return r.rows[0] ? rowToRole(r.rows[0]) : null
}

export async function updateRole(
  db: Queryable,
  id: string,
  patch: { name?: string; areas?: string[]; active?: boolean },
): Promise<void> {
  const sets: string[] = ['updated_at=now()']
  const params: unknown[] = [id]
  if (patch.name !== undefined) { params.push(patch.name.trim()); sets.push(`name=$${params.length}`) }
  if (patch.areas !== undefined) { params.push(JSON.stringify(validAreas(patch.areas))); sets.push(`areas=$${params.length}`) }
  if (patch.active !== undefined) { params.push(patch.active); sets.push(`active=$${params.length}`) }
  await db.query(`UPDATE roles SET ${sets.join(',')} WHERE id=$1`, params)
}
```
NOTA: `areas` es jsonb; se pasa `JSON.stringify(...)` como parámetro (mismo patrón que `custom_fields` en `server/db/repo.ts`). pg-mem y Postgres real aceptan el string en una columna jsonb.

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/auth/roles.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add server/auth/roles.ts server/auth/roles.test.ts
git commit -m "feat(H2): roles repo (create/list/get/update, area validation)"
```

---

## Task 4: `UserPublic` con áreas + usuarios/sesiones resuelven el rol

**Files:**
- Modify: `shared/types.ts`
- Modify: `server/auth/users.ts`
- Modify: `server/auth/sessions.ts`
- Modify: `server/auth/users.test.ts`
- Modify: `server/auth/sessions.test.ts`

- [ ] **Step 1: `shared/types.ts`** — extiende `UserPublic`:
```ts
export interface UserPublic {
  id: string
  email: string
  name: string
  isAdmin: boolean
  active: boolean
  roleId?: string | null
  roleName?: string | null
  areas: string[]
}
```

- [ ] **Step 2: Reescribir `server/auth/users.ts`** (resolución enriquecida + roleId). Reemplaza el contenido por:
```ts
import { randomUUID } from 'node:crypto'
import type { Queryable } from '../db/migrate'
import type { UserPublic } from '../../shared/types'
import { AREAS } from '../../shared/transitions'

/** Tipo interno para verificar credenciales (incluye el hash); NO se devuelve al cliente. */
export interface UserWithHash {
  id: string; email: string; name: string; isAdmin: boolean; active: boolean; passwordHash: string
}

const normalize = (email: string) => email.trim().toLowerCase()

// SELECT con LEFT JOIN al rol para resolver áreas.
const USER_SELECT = `SELECT u.id,u.email,u.name,u.is_admin,u.active,u.role_id,
  r.name AS role_name, r.areas AS role_areas, r.active AS role_active
  FROM users u LEFT JOIN roles r ON u.role_id = r.id`

/** Convierte una fila (con columnas role_*) en UserPublic resolviendo las áreas efectivas. */
export function rowToPublicUser(row: any): UserPublic {
  const isAdmin = row.is_admin === true
  const roleActive = row.role_active === true
  const roleAreas = Array.isArray(row.role_areas) ? row.role_areas : []
  return {
    id: row.id, email: row.email, name: row.name, isAdmin, active: row.active,
    roleId: row.role_id ?? null,
    roleName: roleActive ? row.role_name : null,
    areas: isAdmin ? [...AREAS] : (roleActive ? roleAreas : []),
  }
}

export async function createUser(
  db: Queryable,
  input: { email: string; name: string; passwordHash: string; isAdmin?: boolean; roleId?: string | null },
): Promise<UserPublic> {
  const id = randomUUID()
  await db.query(
    `INSERT INTO users (id,email,name,password_hash,is_admin,active,role_id,updated_at)
     VALUES ($1,$2,$3,$4,$5,true,$6,now())`,
    [id, normalize(input.email), input.name, input.passwordHash, input.isAdmin ?? false, input.roleId ?? null],
  )
  return (await getUserById(db, id))!
}

export async function getUserByEmail(db: Queryable, email: string): Promise<UserWithHash | null> {
  const r = await db.query('SELECT id,email,name,password_hash,is_admin,active FROM users WHERE email=$1', [normalize(email)])
  const row = r.rows[0]
  return row ? { id: row.id, email: row.email, name: row.name, isAdmin: row.is_admin, active: row.active, passwordHash: row.password_hash } : null
}

export async function getUserById(db: Queryable, id: string): Promise<UserPublic | null> {
  const r = await db.query(`${USER_SELECT} WHERE u.id=$1`, [id])
  return r.rows[0] ? rowToPublicUser(r.rows[0]) : null
}

export async function listUsers(db: Queryable): Promise<UserPublic[]> {
  const r = await db.query(`${USER_SELECT} ORDER BY u.created_at`)
  return r.rows.map(rowToPublicUser)
}

export async function updateUser(
  db: Queryable,
  id: string,
  patch: { name?: string; isAdmin?: boolean; active?: boolean; roleId?: string | null },
): Promise<void> {
  const sets: string[] = ['updated_at=now()']
  const params: unknown[] = [id]
  if (patch.name !== undefined) { params.push(patch.name); sets.push(`name=$${params.length}`) }
  if (patch.isAdmin !== undefined) { params.push(patch.isAdmin); sets.push(`is_admin=$${params.length}`) }
  if (patch.active !== undefined) { params.push(patch.active); sets.push(`active=$${params.length}`) }
  if (patch.roleId !== undefined) { params.push(patch.roleId); sets.push(`role_id=$${params.length}`) }
  await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=$1`, params)
}

export async function setPassword(db: Queryable, id: string, passwordHash: string): Promise<void> {
  await db.query('UPDATE users SET password_hash=$2, updated_at=now() WHERE id=$1', [id, passwordHash])
}

export async function countUsers(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM users')
  return r.rows[0].n as number
}
```

- [ ] **Step 3: `server/auth/sessions.ts`** — `getSessionUser` resuelve áreas. Reemplaza la función por:
```ts
import { rowToPublicUser } from './users'
// ... (mantén los imports existentes de crypto/Queryable/UserPublic y createSession/deleteSession/deleteUserSessions)

export async function getSessionUser(db: Queryable, token: string): Promise<UserPublic | null> {
  const r = await db.query(
    `SELECT u.id,u.email,u.name,u.is_admin,u.active,u.role_id,
            ro.name AS role_name, ro.areas AS role_areas, ro.active AS role_active
     FROM sessions s JOIN users u ON s.user_id = u.id
     LEFT JOIN roles ro ON u.role_id = ro.id
     WHERE s.token = $1 AND s.expires_at > now() AND u.active = true`,
    [token],
  )
  return r.rows[0] ? rowToPublicUser(r.rows[0]) : null
}
```
(Añade `import { rowToPublicUser } from './users'` arriba. `UserPublic` ya está importado.)

- [ ] **Step 4: Actualizar tests existentes**

(a) `server/auth/users.test.ts` — añade casos de áreas/rol. Importa `createRole` y añade:
```ts
import { createRole } from './roles'

it('resuelve áreas: admin→3, rol→áreas del rol, sin rol→[]', async () => {
  const admin = await createUser(db, { email: 'admin@x.co', name: 'Ad', passwordHash: 'h', isAdmin: true })
  expect(admin.areas.sort()).toEqual(['Comercial', 'Compras', 'Servicio Técnico'])
  const role = await createRole(db, { name: 'Téc', areas: ['Servicio Técnico'] })
  const u = await createUser(db, { email: 'u@x.co', name: 'U', passwordHash: 'h', roleId: role.id })
  expect(u.areas).toEqual(['Servicio Técnico'])
  expect(u.roleName).toBe('Téc')
  const noRole = await createUser(db, { email: 'n@x.co', name: 'N', passwordHash: 'h' })
  expect(noRole.areas).toEqual([])
})

it('updateUser asigna y quita rol', async () => {
  const role = await createRole(db, { name: 'Com', areas: ['Comercial'] })
  const u = await createUser(db, { email: 'a@b.co', name: 'A', passwordHash: 'h' })
  await updateUser(db, u.id, { roleId: role.id })
  expect((await getUserById(db, u.id))!.areas).toEqual(['Comercial'])
  await updateUser(db, u.id, { roleId: null })
  expect((await getUserById(db, u.id))!.areas).toEqual([])
})
```
Si algún test existente afirmaba la forma vieja de `UserPublic` (sin `areas`), seguirá pasando (sólo añadimos campos). El test "email duplicado lanza" sigue válido.

(b) `server/auth/sessions.test.ts` — el primer test ("crea sesión y resuelve el usuario") sigue válido; añade uno de áreas:
```ts
import { createRole } from './roles'

it('getSessionUser resuelve áreas del rol', async () => {
  const role = await createRole(db, { name: 'Téc', areas: ['Servicio Técnico'] })
  const u = await createUser(db, { email: 'a@b.co', name: 'A', passwordHash: 'h', roleId: role.id })
  const token = await createSession(db, u.id)
  const got = await getSessionUser(db, token)
  expect(got!.areas).toEqual(['Servicio Técnico'])
})
```
(El import de `createUser` ya está; añade `createRole` y, si falta, importa `getSessionUser`/`createSession` ya presentes.)

- [ ] **Step 5: Ejecutar**
Run: `npx vitest run server/auth/users.test.ts server/auth/sessions.test.ts`
Expected: PASS. (No corras la suite completa aún: `routes.ts`/`app.ts` siguen con el login viejo y se actualizan en la Task 5; pueden no compilar hasta entonces.)

- [ ] **Step 6: Commit**
```bash
git add shared/types.ts server/auth/users.ts server/auth/sessions.ts server/auth/users.test.ts server/auth/sessions.test.ts
git commit -m "feat(H2): UserPublic.areas resolved via role; users/sessions join roles; users accept roleId"
```

---

## Task 5: Rutas — roles CRUD + roleId en usuarios + login devuelve áreas

**Files:**
- Modify: `server/auth/routes.ts`
- Modify: `server/auth/routes.test.ts`

- [ ] **Step 1: Editar `server/auth/routes.ts`**

(a) Añade imports:
```ts
import { createRole, listRoles, getRole, updateRole } from './roles'
```
(`getUserById` ya se importa de `./users`; si no, añádelo al import existente.)

(b) En `POST /api/auth/login`, reemplaza la respuesta manual por el usuario resuelto (con áreas):
```ts
    const token = await createSession(db, u.id)
    res.cookie(COOKIE, token, COOKIE_OPTS)
    res.json(await getUserById(db, u.id))
```
(`GET /api/auth/me` ya devuelve `req.user`, que ahora trae áreas.)

(c) En `POST /api/users`, acepta `roleId` (validando que exista):
```ts
    let roleId: string | null = null
    if (req.body.roleId) {
      roleId = String(req.body.roleId)
      if (!(await getRole(db, roleId))) { res.status(422).json({ error: 'Rol no encontrado' }); return }
    }
    const created = await createUser(db, { email, name, passwordHash: await hashPassword(password), isAdmin: Boolean(req.body.isAdmin), roleId })
    res.status(201).json(created)
```
(Reemplaza la línea actual de `createUser(...)` por este bloque, justo después de la verificación de duplicado.)

(d) En `PATCH /api/users/:id`, acepta `roleId` (con validación). Dentro del handler, antes de `await updateUser(db, id, patch)`, añade:
```ts
    if (req.body.roleId !== undefined) {
      const roleId = req.body.roleId === null ? null : String(req.body.roleId)
      if (roleId !== null && !(await getRole(db, roleId))) { res.status(422).json({ error: 'Rol no encontrado' }); return }
      patch.roleId = roleId
    }
```
y amplía el tipo de `patch` para incluir `roleId`:
```ts
    const patch: { name?: string; isAdmin?: boolean; active?: boolean; roleId?: string | null } = {}
```

(e) Añade los endpoints de roles (tras los de usuarios, dentro de `registerAuthRoutes`):
```ts
  app.get('/api/roles', auth, requireAdmin, async (_req, res) => {
    res.json(await listRoles(db))
  })

  app.post('/api/roles', auth, requireAdmin, async (req, res) => {
    const name = String(req.body.name ?? '').trim()
    const areas = Array.isArray(req.body.areas) ? req.body.areas : []
    if (!name) { res.status(422).json({ error: 'El nombre del rol es obligatorio' }); return }
    if ((await listRoles(db)).some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: 'Ya existe un rol con ese nombre' }); return
    }
    res.status(201).json(await createRole(db, { name, areas }))
  })

  app.patch('/api/roles/:id', auth, requireAdmin, async (req, res) => {
    const id = String(req.params.id)
    const patch: { name?: string; areas?: string[]; active?: boolean } = {}
    if (req.body.name !== undefined) patch.name = String(req.body.name)
    if (req.body.areas !== undefined) patch.areas = Array.isArray(req.body.areas) ? req.body.areas : []
    if (req.body.active !== undefined) patch.active = Boolean(req.body.active)
    await updateRole(db, id, patch)
    const updated = await getRole(db, id)
    if (!updated) { res.status(404).json({ error: 'Rol no encontrado' }); return }
    res.json(updated)
  })
```

- [ ] **Step 2: Añadir tests a `server/auth/routes.test.ts`**
```ts
describe('roles + asignación', () => {
  it('admin crea rol, lo asigna a un usuario y el login devuelve sus áreas', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const role = await request(a).post('/api/roles').set('Cookie', cookie).send({ name: 'Comercial', areas: ['Comercial'] })
    expect(role.status).toBe(201)
    expect(role.body.areas).toEqual(['Comercial'])
    const u = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'op@x.co', name: 'Op', password: 'password123', roleId: role.body.id })
    expect(u.status).toBe(201)
    expect(u.body.areas).toEqual(['Comercial'])
    const opLogin = await request(a).post('/api/auth/login').send({ email: 'op@x.co', password: 'password123' })
    expect(opLogin.body.areas).toEqual(['Comercial'])
  })

  it('no-admin no puede listar/crear roles (403)', async () => {
    await seedAdmin()
    const a = app()
    const adminCookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    await request(a).post('/api/users').set('Cookie', adminCookie).send({ email: 'op@x.co', name: 'Op', password: 'password123' })
    const opCookie = (await request(a).post('/api/auth/login').send({ email: 'op@x.co', password: 'password123' })).headers['set-cookie']
    expect((await request(a).get('/api/roles').set('Cookie', opCookie)).status).toBe(403)
  })

  it('rol con nombre duplicado → 409', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    await request(a).post('/api/roles').set('Cookie', cookie).send({ name: 'Comercial', areas: [] })
    expect((await request(a).post('/api/roles').set('Cookie', cookie).send({ name: 'comercial', areas: [] })).status).toBe(409)
  })
})
```

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run server/auth/routes.test.ts`
Expected: PASS (los 5 de H1 + 3 nuevos).

- [ ] **Step 4: Commit**
```bash
git add server/auth/routes.ts server/auth/routes.test.ts
git commit -m "feat(H2): roles CRUD endpoints + roleId on users + login returns resolved areas"
```

---

## Task 6: Enforcement por área en la transición (403)

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`

- [ ] **Step 1: En `server/app.ts`**, añade el import:
```ts
import { canExecuteTransition } from '../shared/permissions'
```
En el handler `app.post('/api/tickets/:id/transition', …)`, **después** del check de `from` (el 409) y **antes** de `const values = …`, añade:
```ts
      if (!canExecuteTransition(req.user!.areas, req.user!.isAdmin, t.area)) {
        res.status(403).json({ error: `Tu rol no tiene permiso para esta transición (área: ${t.area})` })
        return
      }
```

- [ ] **Step 2: Actualizar `server/app.test.ts`** (el `authCookie` por defecto crea un usuario SIN rol → áreas vacías → no puede transicionar; los tests que esperan 200/422 deben usar un usuario con permiso).

(a) Cambia el helper `authCookie` para poder asignar áreas vía un rol, y deja un atajo admin:
```ts
import { createRole } from './auth/roles'

// Reemplaza el authCookie existente por estas dos variantes:
async function adminCookie(): Promise<string> {
  const u = await createUser(db, { email: 'admin@x.co', name: 'Admin', passwordHash: await hashPassword('password123'), isAdmin: true })
  return `sid=${await createSession(db, u.id)}`
}
async function userCookie(areas: string[]): Promise<string> {
  const role = await createRole(db, { name: 'Rol-' + areas.join('-'), areas })
  const u = await createUser(db, { email: 'op@x.co', name: 'Op', passwordHash: await hashPassword('password123'), roleId: role.id })
  return `sid=${await createSession(db, u.id)}`
}
```
(Elimina el `authCookie` anterior; ningún otro test debe seguir usándolo tras este paso.)

(b) En el bloque `describe('POST /api/tickets/:id/transition (Postgres)')`, ajusta:
- Test **400 (transición desconocida)**: usa `await adminCookie()` (el 400 ocurre antes del check de área, pero usar admin evita ambigüedad).
- Test **409 (from no aplica)**: usa `await adminCookie()` (el 409 va antes del 403).
- Test **422 (faltan campos)**: usa `await adminCookie()` (admin pasa el check de área y llega a la validación 422).
- Test **"aplica la transición…"**: usa `await adminCookie()`; el actor sigue siendo el nombre del usuario admin. Ajusta la aserción de `performed_by` a `'Admin'`:
```ts
    expect(hist.rows[0].performed_by).toBe('Admin')
```
- Añade **dos** tests nuevos de permiso por área:
```ts
  it('403 si el rol del usuario no cubre el área de la transición', async () => {
    const cookie = await userCookie(['Servicio Técnico']) // 'aprobacion' es área Comercial
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'x' } })
    expect(res.status).toBe(403)
  })

  it('200 si el rol del usuario cubre el área', async () => {
    const cookie = await userCookie(['Comercial']) // 'aprobacion' es área Comercial
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'ok' } })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('En Proceso')
  })
```
(c) En el bloque `describe('GET /api/tickets')`, el test "devuelve tickets activos…" usa `await adminCookie()` (o `userCookie([])`, da igual: el listado no exige áreas). El test "GET /api/tickets sin sesión → 401" queda igual.
(d) En `describe('escrituras')`, el test de reply usa `await adminCookie()` en vez de `authCookie()`.

- [ ] **Step 3: Verificar suite completa + typecheck server**
Run: `npx vitest run && npx tsc -p tsconfig.server.json --noEmit`
Expected: todos los tests PASS; server typecheck limpio. (Si algún test de tickets aún usa `authCookie`, cámbialo a `adminCookie`/`userCookie`.)

- [ ] **Step 4: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(H2): enforce transition area permission (403) on the transition endpoint"
```

---

## Task 7: Frontend — cliente de roles + filtrado del panel de transiciones

**Files:**
- Modify: `src/api/client.ts`
- Modify: `src/components/TransitionPanel.tsx`

- [ ] **Step 1: En `src/api/client.ts`**, añade el tipo y las funciones de roles, y amplía `updateUser` para aceptar `roleId`:

(a) Cambia la firma de `updateUser` (su `patch`) para incluir `roleId`:
```ts
export function updateUser(id: string, patch: Partial<{ name: string; isAdmin: boolean; active: boolean; password: string; roleId: string | null }>): Promise<UserPublic> {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<UserPublic>(r))
}
```
(b) Añade al final:
```ts
export interface Role { id: string; name: string; areas: string[]; active: boolean }

export function listRoles(): Promise<Role[]> {
  return fetch('/api/roles', { credentials: 'include' }).then((r) => json<Role[]>(r))
}

export async function createRole(input: { name: string; areas: string[] }): Promise<Role> {
  const res = await fetch('/api/roles', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<Role>
}

export function updateRole(id: string, patch: Partial<{ name: string; areas: string[]; active: boolean }>): Promise<Role> {
  return fetch(`/api/roles/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<Role>(r))
}
```

- [ ] **Step 2: En `src/components/TransitionPanel.tsx`**, filtra por las áreas del usuario.

Añade imports:
```tsx
import { useAuth } from '../auth/AuthContext'
import { canExecuteTransition } from '../../shared/permissions'
```
Cambia la línea `const transitions = transitionsForStatus(status)` por:
```tsx
  const { user } = useAuth()
  const transitions = transitionsForStatus(status).filter(
    (t) => !!user && canExecuteTransition(user.areas, user.isAdmin, t.area),
  )
```
Y cambia el texto del caso vacío para que sea claro:
```tsx
    return <div className="text-[11px] text-slate-400">Sin transiciones disponibles para tu rol en el estado «{status}».</div>;
```

- [ ] **Step 3: Verificar suite + typecheck + build**
Run: `npx vitest run && npx tsc -b && npx vite build`
Expected: tests PASS, tsc exit 0, build OK.

- [ ] **Step 4: Commit**
```bash
git add src/api/client.ts src/components/TransitionPanel.tsx
git commit -m "feat(H2): frontend roles client + TransitionPanel filters by user areas"
```

---

## Task 8: Frontend — página de Roles (admin) + selector de rol en Usuarios + navegación

**Files:**
- Create: `src/components/RolesAdmin.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/UsersAdmin.tsx`

- [ ] **Step 1: Crear `src/components/RolesAdmin.tsx`**
```tsx
import { useEffect, useState } from 'react'
import { AREAS } from '../../shared/transitions'
import { listRoles, createRole, updateRole, type Role } from '../api/client'

export function RolesAdmin({ onClose }: { onClose: () => void }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try { setRoles(await listRoles()) } catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [])

  async function toggleActive(r: Role) { await updateRole(r.id, { active: !r.active }); reload() }
  async function toggleArea(r: Role, area: string) {
    const areas = r.areas.includes(area) ? r.areas.filter((a) => a !== area) : [...r.areas, area]
    await updateRole(r.id, { areas }); reload()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Roles y permisos</h1>
        <button onClick={() => setCreating(true)} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo rol</button>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-slate-500 border-b">
            <th className="py-2">Rol</th>{AREAS.map((a) => <th key={a} className="px-2">{a}</th>)}<th>Activo</th><th></th>
          </tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2 font-medium">{r.name}</td>
                {AREAS.map((a) => (
                  <td key={a} className="px-2 text-center">
                    <input type="checkbox" checked={r.areas.includes(a)} onChange={() => toggleArea(r, a)} className="accent-blue-600" />
                  </td>
                ))}
                <td>{r.active ? 'Sí' : 'No'}</td>
                <td className="text-right">
                  <button onClick={() => toggleActive(r)} className="text-[12px] text-blue-600">{r.active ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-400 mt-3">Cada rol puede ejecutar las transiciones de las áreas marcadas. Un rol con las 3 áreas equivale a "Gerencia/Director".</p>
      </div>
      {creating && <CreateRole onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
    </div>
  )
}

function CreateRole({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function toggle(area: string) {
    setAreas((s) => (s.includes(area) ? s.filter((a) => a !== area) : [...s, area]))
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await createRole({ name, areas }); onCreated() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo rol</h3>
        <input type="text" placeholder="Nombre (p.ej. Técnico, Comercial, Gerencia)" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-slate-600">Áreas</span>
          {AREAS.map((a) => (
            <label key={a} className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={areas.includes(a)} onChange={() => toggle(a)} /> {a}</label>
          ))}
        </div>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: `src/components/Header.tsx`** — añade un botón "Roles" (solo admin) en `UserMenu`. Cambia `UserMenu` para recibir además `onOpenRoles`:
```tsx
function UserMenu({ onOpenUsers, onOpenRoles }: { onOpenUsers: () => void; onOpenRoles: () => void }) {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-3 ml-1">
      {user.isAdmin && (
        <>
          <button onClick={onOpenUsers} title="Usuarios" className="p-1.5 text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">group</span>
          </button>
          <button onClick={onOpenRoles} title="Roles" className="p-1.5 text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </button>
        </>
      )}
      <span className="text-[12px] font-medium hidden md:block">{user.name}{user.isAdmin ? ' · Admin' : ''}</span>
      <button onClick={() => logout()} title="Cerrar sesión" className="p-1.5 text-white/60 hover:text-white">
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </div>
  )
}
```
Y la firma del `Header` + el render de `UserMenu`:
```tsx
export const Header: React.FC<{ onOpenUsers: () => void; onOpenRoles: () => void }> = ({ onOpenUsers, onOpenRoles }) => {
```
…donde se renderiza `<UserMenu onOpenUsers={onOpenUsers} />`, cámbialo a `<UserMenu onOpenUsers={onOpenUsers} onOpenRoles={onOpenRoles} />`.

- [ ] **Step 3: `src/App.tsx`** — estado + render de `RolesAdmin` y pasar la prop al Header (recuerda: hooks antes de los `return` condicionales).
```tsx
import { RolesAdmin } from './components/RolesAdmin'
// junto a los otros useState:
  const [showRoles, setShowRoles] = useState(false)
// cambia <Header onOpenUsers={() => setShowUsers(true)} /> por:
        <Header onOpenUsers={() => setShowUsers(true)} onOpenRoles={() => setShowRoles(true)} />
// junto a {showUsers && <UsersAdmin .../>} añade:
      {showRoles && <RolesAdmin onClose={() => setShowRoles(false)} />}
```

- [ ] **Step 4: `src/components/UsersAdmin.tsx`** — añade una columna **Rol** con un selector por usuario.

(a) Importa y carga roles:
```tsx
import { listUsers, createUser, updateUser, listRoles, type Role } from '../api/client'
```
(Si `Role` no se exporta aún desde donde lo importas, viene de `../api/client` según la Task 7.)
(b) En `UsersAdmin`, añade estado de roles y cárgalos:
```tsx
  const [roles, setRoles] = useState<Role[]>([])
  useEffect(() => { listRoles().then(setRoles).catch(() => {}) }, [])
```
(c) Añade una función para cambiar el rol:
```tsx
  async function changeRole(u: UserPublic, roleId: string) {
    await updateUser(u.id, { roleId: roleId || null }); reload()
  }
```
(d) En la cabecera de la tabla, añade `<th>Rol</th>` (p.ej. tras "Activo"). En cada fila, añade una celda con el selector:
```tsx
                <td>
                  <select value={u.roleId ?? ''} onChange={(e) => changeRole(u, e.target.value)} className="border border-slate-200 rounded p-1 text-[12px]">
                    <option value="">— Sin rol —</option>
                    {roles.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
```
(`u.roleId` ya viene en `UserPublic`. El admin tiene todas las áreas aunque no tenga rol; el selector aplica a no-admins.)

- [ ] **Step 5: Verificar suite + typecheck + build + lint**
Run: `npx vitest run && npx tsc -b && npx vite build && npx eslint .`
Expected: tests PASS, tsc exit 0, build OK, eslint **0 errores** (warnings OK).

- [ ] **Step 6: Commit**
```bash
git add src/components/RolesAdmin.tsx src/components/Header.tsx src/App.tsx src/components/UsersAdmin.tsx
git commit -m "feat(H2): admin Roles page + role selector in Users + header navigation"
```

---

## Task 9: Verificación completa

**Files:** ninguno nuevo.

- [ ] **Step 1: Suite + typechecks + lint + build**
Run: `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; ambos `tsc` exit 0; eslint **0 errores**; build OK. Corrige cualquier error introducido.

- [ ] **Step 2: Verificación manual (tras desplegar)**

1. Despliega en EasyPanel (Implementar). El esquema añade `roles` y `users.role_id` (idempotente, sin recrear).
2. Entra como admin → en el Header aparece el icono **Roles** (escudo). Crea roles: p.ej. "Técnico" = [Servicio Técnico], "Comercial" = [Comercial], "Gerencia" = las 3.
3. En **Usuarios**, asigna un rol a un usuario no-admin.
4. Entra como ese usuario: en un ticket, el panel de transiciones **solo** muestra las de su área. Las de otras áreas no aparecen.
5. Verificación dura del backend: intenta una transición de otra área vía API (o con un rol que no la cubra) → **403**.
6. En PgWeb: `SELECT name, areas, active FROM roles;` y `SELECT email, role_id FROM users;` reflejan lo configurado.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(H2): subsistema H2 verificado (permisos por área)"
```

---

## Notas de cierre
- **Doble candado:** el frontend oculta botones (UX) y el backend rechaza con 403 (seguridad real).
- **Gerencia = rol con las 3 áreas** (no es un área nueva). Admin (`is_admin`) bypassa todo y gestiona usuarios y roles.
- **Cambiar/desactivar un rol** aplica al recargar (las áreas se resuelven en cada `me`/login). Un rol inactivo deja a sus usuarios sin transiciones hasta reasignarlos.
- **Fuera de alcance (futuro):** restringir qué tickets ve cada rol, edición de campos, gatear "Responder" por rol (el correo se rehace en D), múltiples roles por usuario.
