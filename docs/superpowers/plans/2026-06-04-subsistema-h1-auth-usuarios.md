# Subsistema H1 — Autenticación + gestión de usuarios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a la app login con correo+contraseña, sesiones en servidor (cookie httpOnly), gestión de usuarios por un admin, y dejar toda la app detrás del login; el actor de las transiciones pasa a ser el usuario autenticado.

**Architecture:** Backend en `server/auth/` (passwords con bcryptjs, repos de `users` y `sessions` sobre `Queryable`, middleware `requireAuth`/`requireAdmin`, rutas HTTP). El esquema añade tablas `users` y `sessions`. El frontend gana un `AuthContext`, una pantalla `Login`, un gate en `App`, menú de usuario en `Header` y una página `UsersAdmin` (solo admin). Sesiones revocables (logout, desactivación, cambio de contraseña).

**Tech Stack:** TypeScript ESM, Express 5, pg, pg-mem, Vitest, React, bcryptjs, cookie-parser. Spec: `docs/superpowers/specs/2026-06-04-subsistema-h1-auth-usuarios-design.md`.

**Contexto:** repo en `main`. `server/db/migrate.ts` aplica `schema.sql` tolerante por sentencia. `createApp({ db, zohoFetch, sync, config })` en `server/app.ts`. `server/index.ts` arranca (migrate → reseed → listen → backfill). Las transiciones (B) usan `TRANSITION_ACTOR`. El frontend se sirve same-origin (Express estático).

---

## Estructura de archivos

- Modify `server/db/schema.sql` — tablas `users`, `sessions` + índice.
- Modify `server/db/migrate.test.ts` — afirmar que existen las tablas nuevas.
- Modify `shared/types.ts` — `UserPublic`.
- Create `server/auth/passwords.ts` — `hashPassword`, `verifyPassword` (bcryptjs).
- Create `server/auth/users.ts` — repo de usuarios (+ tipo `UserWithHash`).
- Create `server/auth/sessions.ts` — repo de sesiones.
- Create `server/auth/middleware.ts` — `requireAuth(db)`, `requireAdmin`.
- Create `server/auth/routes.ts` — `registerAuthRoutes(app, db)` (auth + usuarios).
- Modify `server/app.ts` — cookie-parser, registrar auth, proteger `/api/tickets`, actor = usuario.
- Modify `server/app.test.ts` — helper de sesión; autenticar los tests de tickets.
- Modify `server/config.ts` — `adminEmail`, `adminPassword`.
- Modify `server/index.ts` — bootstrap del admin inicial.
- Modify `src/api/client.ts` — `credentials:'include'` + funciones auth/usuarios.
- Create `src/auth/AuthContext.tsx` — contexto de auth.
- Create `src/components/Login.tsx` — pantalla de login.
- Create `src/components/UsersAdmin.tsx` — gestión de usuarios (admin).
- Modify `src/components/Header.tsx` — menú de usuario.
- Modify `src/App.tsx` — gate de login + navegación a Usuarios.
- Modify `src/main.tsx` — envolver en `AuthProvider`.

---

## Task 1: Esquema de `users` y `sessions`

**Files:**
- Modify: `server/db/schema.sql`
- Modify: `server/db/migrate.test.ts`

- [ ] **Step 1: Añadir al final de `server/db/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  user_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
```

- [ ] **Step 2: Extender el test de migrate** en `server/db/migrate.test.ts` — en el array de tablas esperadas del primer test, añade `'users', 'sessions'`:
```ts
    for (const t of ['accounts', 'contacts', 'agents', 'tickets', 'conversations', 'attachments', 'ticket_transitions', 'users', 'sessions']) {
      expect(names).toContain(t)
    }
```

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run server/db/migrate.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add server/db/schema.sql server/db/migrate.test.ts
git commit -m "feat(H1): users + sessions tables in schema"
```

---

## Task 2: Hashing de contraseñas (`passwords.ts`)

**Files:**
- Create: `server/auth/passwords.ts`
- Create: `server/auth/passwords.test.ts`

- [ ] **Step 1: Instalar bcryptjs**
```bash
npm install bcryptjs && npm install -D @types/bcryptjs
```

- [ ] **Step 2: Escribir el test `server/auth/passwords.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './passwords'

describe('passwords', () => {
  it('hashea (distinto del texto plano) y verifica correcto/incorrecto', async () => {
    const hash = await hashPassword('secreto-123')
    expect(hash).not.toBe('secreto-123')
    expect(await verifyPassword('secreto-123', hash)).toBe(true)
    expect(await verifyPassword('otra', hash)).toBe(false)
  })
})
```

- [ ] **Step 3: Ejecutar y ver fallar**
Run: `npx vitest run server/auth/passwords.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementar `server/auth/passwords.ts`**
```ts
import bcrypt from 'bcryptjs'

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 5: Ejecutar y ver pasar**
Run: `npx vitest run server/auth/passwords.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add server/auth/passwords.ts server/auth/passwords.test.ts package.json package-lock.json
git commit -m "feat(H1): password hashing with bcryptjs"
```

---

## Task 3: Tipo `UserPublic` + repo de usuarios (`users.ts`)

**Files:**
- Modify: `shared/types.ts`
- Create: `server/auth/users.ts`
- Create: `server/auth/users.test.ts`

- [ ] **Step 1: Añadir `UserPublic` al final de `shared/types.ts`**
```ts
export interface UserPublic {
  id: string
  email: string
  name: string
  isAdmin: boolean
  active: boolean
}
```

- [ ] **Step 2: Escribir el test `server/auth/users.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { createUser, getUserByEmail, getUserById, listUsers, updateUser, setPassword, countUsers } from './users'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('users repo', () => {
  it('crea (email normalizado), busca por email/id y lista', async () => {
    const u = await createUser(db, { email: '  Admin@X.CO ', name: 'Admin', passwordHash: 'h', isAdmin: true })
    expect(u.email).toBe('admin@x.co')
    expect(u.isAdmin).toBe(true)
    const byEmail = await getUserByEmail(db, 'ADMIN@x.co')
    expect(byEmail!.passwordHash).toBe('h')
    expect((await getUserById(db, u.id))!.name).toBe('Admin')
    expect((await listUsers(db)).length).toBe(1)
    expect(await countUsers(db)).toBe(1)
  })

  it('update (active/isAdmin/name) y setPassword', async () => {
    const u = await createUser(db, { email: 'a@b.co', name: 'A', passwordHash: 'h1' })
    await updateUser(db, u.id, { name: 'Nuevo', active: false, isAdmin: true })
    const got = await getUserById(db, u.id)
    expect(got!.name).toBe('Nuevo'); expect(got!.active).toBe(false); expect(got!.isAdmin).toBe(true)
    await setPassword(db, u.id, 'h2')
    expect((await getUserByEmail(db, 'a@b.co'))!.passwordHash).toBe('h2')
  })

  it('email duplicado lanza', async () => {
    await createUser(db, { email: 'd@d.co', name: 'D', passwordHash: 'h' })
    await expect(createUser(db, { email: 'd@d.co', name: 'D2', passwordHash: 'h' })).rejects.toThrow()
  })
})
```

- [ ] **Step 3: Ejecutar y ver fallar**
Run: `npx vitest run server/auth/users.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementar `server/auth/users.ts`**
```ts
import { randomUUID } from 'node:crypto'
import type { Queryable } from '../db/migrate'
import type { UserPublic } from '../../shared/types'

export interface UserWithHash extends UserPublic { passwordHash: string }

function rowToPublic(r: any): UserPublic {
  return { id: r.id, email: r.email, name: r.name, isAdmin: r.is_admin, active: r.active }
}
const normalize = (email: string) => email.trim().toLowerCase()

export async function createUser(
  db: Queryable,
  input: { email: string; name: string; passwordHash: string; isAdmin?: boolean },
): Promise<UserPublic> {
  const r = await db.query(
    `INSERT INTO users (id,email,name,password_hash,is_admin,active,updated_at)
     VALUES ($1,$2,$3,$4,$5,true,now())
     RETURNING id,email,name,is_admin,active`,
    [randomUUID(), normalize(input.email), input.name, input.passwordHash, input.isAdmin ?? false],
  )
  return rowToPublic(r.rows[0])
}

export async function getUserByEmail(db: Queryable, email: string): Promise<UserWithHash | null> {
  const r = await db.query('SELECT id,email,name,password_hash,is_admin,active FROM users WHERE email=$1', [normalize(email)])
  const row = r.rows[0]
  return row ? { ...rowToPublic(row), passwordHash: row.password_hash } : null
}

export async function getUserById(db: Queryable, id: string): Promise<UserPublic | null> {
  const r = await db.query('SELECT id,email,name,is_admin,active FROM users WHERE id=$1', [id])
  return r.rows[0] ? rowToPublic(r.rows[0]) : null
}

export async function listUsers(db: Queryable): Promise<UserPublic[]> {
  const r = await db.query('SELECT id,email,name,is_admin,active FROM users ORDER BY created_at')
  return r.rows.map(rowToPublic)
}

export async function updateUser(
  db: Queryable,
  id: string,
  patch: { name?: string; isAdmin?: boolean; active?: boolean },
): Promise<void> {
  const sets: string[] = ['updated_at=now()']
  const params: unknown[] = [id]
  if (patch.name !== undefined) { params.push(patch.name); sets.push(`name=$${params.length}`) }
  if (patch.isAdmin !== undefined) { params.push(patch.isAdmin); sets.push(`is_admin=$${params.length}`) }
  if (patch.active !== undefined) { params.push(patch.active); sets.push(`active=$${params.length}`) }
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

- [ ] **Step 5: Ejecutar y ver pasar**
Run: `npx vitest run server/auth/users.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**
```bash
git add shared/types.ts server/auth/users.ts server/auth/users.test.ts
git commit -m "feat(H1): UserPublic type + users repo (create/get/list/update/setPassword)"
```

---

## Task 4: Repo de sesiones (`sessions.ts`)

**Files:**
- Create: `server/auth/sessions.ts`
- Create: `server/auth/sessions.test.ts`

- [ ] **Step 1: Escribir el test `server/auth/sessions.test.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { createUser, updateUser } from './users'
import { createSession, getSessionUser, deleteSession, deleteUserSessions } from './sessions'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('sessions', () => {
  it('crea sesión y resuelve el usuario', async () => {
    const u = await createUser(db, { email: 'a@b.co', name: 'A', passwordHash: 'h' })
    const token = await createSession(db, u.id)
    const got = await getSessionUser(db, token)
    expect(got!.id).toBe(u.id)
    expect(got!.email).toBe('a@b.co')
  })

  it('sesión expirada → null', async () => {
    const u = await createUser(db, { email: 'a@b.co', name: 'A', passwordHash: 'h' })
    await db.query("INSERT INTO sessions (token,user_id,expires_at) VALUES ('old',$1,'2000-01-01T00:00:00Z')", [u.id])
    expect(await getSessionUser(db, 'old')).toBeNull()
  })

  it('usuario inactivo → null', async () => {
    const u = await createUser(db, { email: 'a@b.co', name: 'A', passwordHash: 'h' })
    const token = await createSession(db, u.id)
    await updateUser(db, u.id, { active: false })
    expect(await getSessionUser(db, token)).toBeNull()
  })

  it('borrar sesión y borrar todas las del usuario', async () => {
    const u = await createUser(db, { email: 'a@b.co', name: 'A', passwordHash: 'h' })
    const t1 = await createSession(db, u.id)
    const t2 = await createSession(db, u.id)
    await deleteSession(db, t1)
    expect(await getSessionUser(db, t1)).toBeNull()
    expect(await getSessionUser(db, t2)).not.toBeNull()
    await deleteUserSessions(db, u.id)
    expect(await getSessionUser(db, t2)).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y ver fallar**
Run: `npx vitest run server/auth/sessions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `server/auth/sessions.ts`**
```ts
import { randomBytes } from 'node:crypto'
import type { Queryable } from '../db/migrate'
import type { UserPublic } from '../../shared/types'

const SESSION_DAYS = 30

export async function createSession(db: Queryable, userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await db.query('INSERT INTO sessions (token,user_id,expires_at) VALUES ($1,$2,$3)', [token, userId, expiresAt])
  return token
}

export async function getSessionUser(db: Queryable, token: string): Promise<UserPublic | null> {
  const r = await db.query(
    `SELECT u.id, u.email, u.name, u.is_admin, u.active
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > now() AND u.active = true`,
    [token],
  )
  const row = r.rows[0]
  return row ? { id: row.id, email: row.email, name: row.name, isAdmin: row.is_admin, active: row.active } : null
}

export async function deleteSession(db: Queryable, token: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE token=$1', [token])
}

export async function deleteUserSessions(db: Queryable, userId: string): Promise<void> {
  await db.query('DELETE FROM sessions WHERE user_id=$1', [userId])
}
```

- [ ] **Step 4: Ejecutar y ver pasar**
Run: `npx vitest run server/auth/sessions.test.ts`
Expected: PASS (4 tests). (Si pg-mem fallara en `expires_at > now()`, verifica que `now()` se use tal cual; pg-mem lo soporta.)

- [ ] **Step 5: Commit**
```bash
git add server/auth/sessions.ts server/auth/sessions.test.ts
git commit -m "feat(H1): sessions repo (create/resolve/expire/revoke)"
```

---

## Task 5: Middleware + rutas de auth, cableadas en `createApp` (TDD supertest)

**Files:**
- Create: `server/auth/middleware.ts`
- Create: `server/auth/routes.ts`
- Modify: `server/app.ts`
- Create: `server/auth/routes.test.ts`

- [ ] **Step 1: Instalar cookie-parser**
```bash
npm install cookie-parser && npm install -D @types/cookie-parser
```

- [ ] **Step 2: Implementar `server/auth/middleware.ts`**
```ts
import type { Request, Response, NextFunction } from 'express'
import type { Queryable } from '../db/migrate'
import type { UserPublic } from '../../shared/types'
import { getSessionUser } from './sessions'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: UserPublic }
  }
}

/** Exige sesión válida (cookie `sid`). Adjunta `req.user`. */
export function requireAuth(db: Queryable) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies?.sid
    if (!token) { res.status(401).json({ error: 'No autenticado' }); return }
    const user = await getSessionUser(db, String(token))
    if (!user) { res.status(401).json({ error: 'Sesión inválida o expirada' }); return }
    req.user = user
    next()
  }
}

/** Exige que `req.user` sea admin (usar tras requireAuth). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) { res.status(403).json({ error: 'Requiere permisos de administrador' }); return }
  next()
}
```

- [ ] **Step 3: Implementar `server/auth/routes.ts`**
```ts
import type { Express } from 'express'
import type { Queryable } from '../db/migrate'
import { hashPassword, verifyPassword } from './passwords'
import { createUser, getUserByEmail, getUserById, listUsers, updateUser, setPassword } from './users'
import { createSession, deleteSession, deleteUserSessions } from './sessions'
import { requireAuth, requireAdmin } from './middleware'

const COOKIE = 'sid'
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, maxAge: 30 * 24 * 60 * 60 * 1000 }

export function registerAuthRoutes(app: Express, db: Queryable): void {
  const auth = requireAuth(db)

  app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body.email ?? '')
    const password = String(req.body.password ?? '')
    const u = await getUserByEmail(db, email)
    if (!u || !u.active || !(await verifyPassword(password, u.passwordHash))) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos' }); return
    }
    const token = await createSession(db, u.id)
    res.cookie(COOKIE, token, COOKIE_OPTS)
    res.json({ id: u.id, email: u.email, name: u.name, isAdmin: u.isAdmin, active: u.active })
  })

  app.post('/api/auth/logout', auth, async (req, res) => {
    const token = req.cookies?.sid
    if (token) await deleteSession(db, String(token))
    res.clearCookie(COOKIE)
    res.json({ ok: true })
  })

  app.get('/api/auth/me', auth, (req, res) => { res.json(req.user) })

  app.post('/api/auth/change-password', auth, async (req, res) => {
    const current = String(req.body.currentPassword ?? '')
    const next = String(req.body.newPassword ?? '')
    if (next.length < 8) { res.status(422).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }); return }
    const u = await getUserByEmail(db, req.user!.email)
    if (!u || !(await verifyPassword(current, u.passwordHash))) { res.status(401).json({ error: 'Contraseña actual incorrecta' }); return }
    await setPassword(db, u.id, await hashPassword(next))
    await deleteUserSessions(db, u.id)
    const token = await createSession(db, u.id) // mantener al propio usuario logueado
    res.cookie(COOKIE, token, COOKIE_OPTS)
    res.json({ ok: true })
  })

  app.get('/api/users', auth, requireAdmin, async (_req, res) => {
    res.json(await listUsers(db))
  })

  app.post('/api/users', auth, requireAdmin, async (req, res) => {
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const name = String(req.body.name ?? '').trim()
    const password = String(req.body.password ?? '')
    if (!email || !name) { res.status(422).json({ error: 'Correo y nombre son obligatorios' }); return }
    if (password.length < 8) { res.status(422).json({ error: 'La contraseña debe tener al menos 8 caracteres' }); return }
    if (await getUserByEmail(db, email)) { res.status(409).json({ error: 'Ya existe un usuario con ese correo' }); return }
    const created = await createUser(db, { email, name, passwordHash: await hashPassword(password), isAdmin: Boolean(req.body.isAdmin) })
    res.status(201).json(created)
  })

  app.patch('/api/users/:id', auth, requireAdmin, async (req, res) => {
    const id = String(req.params.id)
    const patch: { name?: string; isAdmin?: boolean; active?: boolean } = {}
    if (req.body.name !== undefined) patch.name = String(req.body.name)
    if (req.body.isAdmin !== undefined) patch.isAdmin = Boolean(req.body.isAdmin)
    if (req.body.active !== undefined) patch.active = Boolean(req.body.active)
    await updateUser(db, id, patch)
    if (req.body.password !== undefined) {
      const pw = String(req.body.password)
      if (pw.length < 8) { res.status(422).json({ error: 'La contraseña debe tener al menos 8 caracteres' }); return }
      await setPassword(db, id, await hashPassword(pw))
    }
    if (patch.active === false || req.body.password !== undefined) await deleteUserSessions(db, id)
    const updated = await getUserById(db, id)
    if (!updated) { res.status(404).json({ error: 'Usuario no encontrado' }); return }
    res.json(updated)
  })
}
```

- [ ] **Step 4: Cablear en `server/app.ts`** — añade imports y registra (sin tocar aún las rutas de tickets, eso es la Task 6):
```ts
import cookieParser from 'cookie-parser'
import { registerAuthRoutes } from './auth/routes'
```
Justo después de `app.use(express.json())` añade:
```ts
  app.use(cookieParser())
  registerAuthRoutes(app, db)
```

- [ ] **Step 5: Escribir el test `server/auth/routes.test.ts`**
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { createApp } from '../app'
import { createUser } from './users'
import { hashPassword } from './passwords'
import type { AppConfig } from '../config'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function app() {
  const sync = { backfillTickets: vi.fn(), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn() }
  const zohoFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  return createApp({ db, zohoFetch, sync, config: { enableWrites: false } as AppConfig })
}
async function seedAdmin() {
  await createUser(db, { email: 'admin@x.co', name: 'Admin', passwordHash: await hashPassword('password123'), isAdmin: true })
}

describe('auth routes', () => {
  it('login ok devuelve usuario y cookie; me funciona', async () => {
    await seedAdmin()
    const a = app()
    const login = await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })
    expect(login.status).toBe(200)
    expect(login.body.email).toBe('admin@x.co')
    const cookie = login.headers['set-cookie']
    const me = await request(a).get('/api/auth/me').set('Cookie', cookie)
    expect(me.status).toBe(200)
    expect(me.body.isAdmin).toBe(true)
  })

  it('credenciales malas → 401 genérico', async () => {
    await seedAdmin()
    const res = await request(app()).post('/api/auth/login').send({ email: 'admin@x.co', password: 'mala' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Correo o contraseña incorrectos')
  })

  it('me sin cookie → 401', async () => {
    const res = await request(app()).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('usuario admin crea otro usuario; no-admin recibe 403', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const created = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'op@x.co', name: 'Op', password: 'password123' })
    expect(created.status).toBe(201)
    expect((await request(a).get('/api/users').set('Cookie', cookie)).body.length).toBe(2)
    // login como no-admin y probar 403
    const opCookie = (await request(a).post('/api/auth/login').send({ email: 'op@x.co', password: 'password123' })).headers['set-cookie']
    const forbidden = await request(a).get('/api/users').set('Cookie', opCookie)
    expect(forbidden.status).toBe(403)
  })

  it('correo duplicado → 409', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const dup = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'admin@x.co', name: 'X', password: 'password123' })
    expect(dup.status).toBe(409)
  })
})
```

- [ ] **Step 6: Ejecutar y ver pasar**
Run: `npx vitest run server/auth/routes.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**
```bash
git add server/auth/middleware.ts server/auth/routes.ts server/app.ts server/auth/routes.test.ts package.json package-lock.json
git commit -m "feat(H1): auth + users HTTP routes (login/logout/me/change-password, users CRUD) + middleware"
```

---

## Task 6: Proteger `/api/tickets*` + actor de transición = usuario

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`

- [ ] **Step 1: Proteger las rutas de tickets en `server/app.ts`**

Añade el import del middleware:
```ts
import { requireAuth } from './auth/middleware'
```
Justo ANTES de la primera ruta `app.get('/api/tickets', ...)`, añade:
```ts
  app.use('/api/tickets', requireAuth(db)) // login obligatorio para tickets/transiciones/reply
```

- [ ] **Step 2: Usar el usuario autenticado como actor de la transición**

En el handler `app.post('/api/tickets/:id/transition', ...)`, cambia la llamada a `applyTransition` para usar el nombre del usuario:
```ts
      const actor = req.user?.name ?? TRANSITION_ACTOR
      await applyTransition(db, id, current.row.status, { id: t.id, name: t.name, area: t.area }, plan, actor, values)
```
(El `import { TRANSITION_ACTOR } from './transitionActor'` ya existe y se mantiene como respaldo.)

- [ ] **Step 3: Autenticar los tests de tickets en `server/app.test.ts`**

Añade imports y un helper que cree un usuario + sesión y devuelva la cookie:
```ts
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'

async function authCookie(isAdmin = false): Promise<string> {
  const u = await createUser(db, { email: 'tester@x.co', name: 'Tester', passwordHash: await hashPassword('password123'), isAdmin })
  return `sid=${await createSession(db, u.id)}`
}
```
Ahora, en CADA test que llama a `/api/tickets...`, crea la cookie y añádela con `.set('Cookie', cookie)`. Por ejemplo, el test de GET /api/tickets:
```ts
  it('devuelve tickets activos normalizados desde Postgres', async () => {
    const cookie = await authCookie()
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'AGQ' } as any))
    await upsertTicket(db, { ...ticketRowFromZoho({ id: '1', ticketNumber: '864', subject: 'Test', status: 'Ingresado', statusType: 'Open', customFields: {} } as any), account_id: 'a1' })
    const { app } = appWith()
    const res = await request(app).get('/api/tickets').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ number: '#864', company: 'AGQ', status: 'Ingresado' })
  })
```
Aplica el mismo patrón (`const cookie = await authCookie(); … .set('Cookie', cookie)`) a los 4 tests del bloque `describe('POST /api/tickets/:id/transition (Postgres)')`. Para el test "aplica la transición…", además verifica que el actor es el usuario:
```ts
  it('aplica la transición en Postgres y registra al usuario como actor', async () => {
    const cookie = await authCookie()
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'Notificación cliente', statusType: 'On Hold', customFields: {} } as any))
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/1/transition').set('Cookie', cookie).send({ transitionId: 'aprobacion', values: { comment: 'aprobado' } })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('En Proceso')
    const r = await getTicketRow(db, '1')
    expect(r!.managed_by_app).toBe(true)
    const hist = await db.query('SELECT performed_by FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(hist.rows[0].performed_by).toBe('Tester')
  })
```
Añade también un test de que **sin cookie** las rutas de tickets dan 401:
```ts
  it('GET /api/tickets sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/tickets')
    expect(res.status).toBe(401)
  })
```
(Pon este test dentro del `describe('GET /api/tickets', …)`.) El bloque `describe('escrituras', …)` para `/reply` queda igual salvo que ahora `/api/tickets/1/reply` requiere sesión: si ese test esperaba `403` por `enableWrites=false`, ahora **sin cookie** dará `401` antes del guard. Ajusta ese test para enviar la cookie:
```ts
  it('POST reply → 403 si enableWrites=false', async () => {
    const cookie = await authCookie()
    const { app, zohoFetch } = appWith({ enableWrites: false })
    const res = await request(app).post('/api/tickets/1/reply').set('Cookie', cookie).send({ content: 'hola' })
    expect(res.status).toBe(403)
    expect(zohoFetch).not.toHaveBeenCalled()
  })
```

- [ ] **Step 4: Verificar la suite completa + typecheck server**
Run: `npx vitest run && npx tsc -p tsconfig.server.json --noEmit`
Expected: todos los tests PASS; server typecheck limpio. (Si algún test de tickets quedó sin cookie y da 401, añádele la cookie.)

- [ ] **Step 5: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "feat(H1): require login for /api/tickets*; transition actor = authenticated user"
```

---

## Task 7: Config + bootstrap del admin inicial

**Files:**
- Modify: `server/config.ts`
- Modify: `server/config.test.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Añadir campos a `server/config.ts`**

En `AppConfig` añade:
```ts
  adminEmail: string     // bootstrap del primer admin (vacío = no se siembra)
  adminPassword: string
```
En `loadConfig`, dentro del objeto devuelto, añade:
```ts
    adminEmail: env.ADMIN_EMAIL || '',
    adminPassword: env.ADMIN_PASSWORD || '',
```

- [ ] **Step 2: Test en `server/config.test.ts`** — añade un caso que verifique que se leen (usa el patrón de los tests existentes del archivo; este bloque asume un `baseEnv` con las requeridas). Añade:
```ts
import { describe, it, expect } from 'vitest'
import { loadConfig } from './config'

const baseEnv = {
  ZOHO_CLIENT_ID: 'a', ZOHO_CLIENT_SECRET: 'b', ZOHO_REFRESH_TOKEN: 'c',
  ZOHO_ORG_ID: 'd', ZOHO_DEPARTMENT_ID: 'e', DATABASE_URL: 'postgres://x',
}

describe('loadConfig admin bootstrap', () => {
  it('lee ADMIN_EMAIL/ADMIN_PASSWORD (vacíos por defecto)', () => {
    expect(loadConfig(baseEnv).adminEmail).toBe('')
    const c = loadConfig({ ...baseEnv, ADMIN_EMAIL: 'a@x.co', ADMIN_PASSWORD: 'secreta12' })
    expect(c.adminEmail).toBe('a@x.co')
    expect(c.adminPassword).toBe('secreta12')
  })
})
```
(Si `server/config.test.ts` ya existe con otros tests, sólo añade este `describe` y reutiliza/define `baseEnv` sin duplicar imports.)

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run server/config.test.ts`
Expected: PASS.

- [ ] **Step 4: Bootstrap en `server/index.ts`**

Añade imports:
```ts
import { countUsers, createUser, getUserByEmail } from './auth/users'
import { hashPassword } from './auth/passwords'
```
Tras `await reseedTicketNumber(pool)` (en `main()`), añade:
```ts
  // Bootstrap: si no hay usuarios y hay credenciales en env, crea el admin inicial.
  if (config.adminEmail && config.adminPassword && (await countUsers(pool)) === 0) {
    if (!(await getUserByEmail(pool, config.adminEmail))) {
      await createUser(pool, {
        email: config.adminEmail, name: 'Administrador',
        passwordHash: await hashPassword(config.adminPassword), isAdmin: true,
      })
      console.log(`Admin inicial creado: ${config.adminEmail}`)
    }
  }
```

- [ ] **Step 5: Verificar typecheck server**
Run: `npx tsc -p tsconfig.server.json --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**
```bash
git add server/config.ts server/config.test.ts server/index.ts
git commit -m "feat(H1): ADMIN_EMAIL/ADMIN_PASSWORD config + seed initial admin on boot"
```

---

## Task 8: Cliente frontend (auth + usuarios)

**Files:**
- Modify: `src/api/client.ts`
- Modify: `src/api/client.test.ts`

- [ ] **Step 1: Añadir funciones a `src/api/client.ts`**

Añade el import del tipo y, a TODAS las llamadas `fetch(...)` existentes, el campo `credentials: 'include'` (en `fetchTickets`, `fetchTicket`, `fetchConversations`, `replyTicket`, `executeTransition`). Luego añade al final:
```ts
import type { UserPublic } from '../../shared/types'

export async function authMe(): Promise<UserPublic | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (res.status === 401) return null
  return json<UserPublic>(res)
}

export async function authLogin(email: string, password: string): Promise<UserPublic> {
  const res = await fetch('/api/auth/login', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<UserPublic>
}

export async function authLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
}

export function listUsers(): Promise<UserPublic[]> {
  return fetch('/api/users', { credentials: 'include' }).then((r) => json<UserPublic[]>(r))
}

export interface NewUser { email: string; name: string; password: string; isAdmin: boolean }
export async function createUser(input: NewUser): Promise<UserPublic> {
  const res = await fetch('/api/users', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<UserPublic>
}

export function updateUser(id: string, patch: Partial<{ name: string; isAdmin: boolean; active: boolean; password: string }>): Promise<UserPublic> {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<UserPublic>(r))
}
```

- [ ] **Step 2: Test en `src/api/client.test.ts`** — añade un caso para `authMe` que devuelve null en 401. Usa el patrón de mock de `fetch` del archivo (si ya mockea `global.fetch`). Añade:
```ts
import { authMe } from './client'

it('authMe → null en 401', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))
  expect(await authMe()).toBeNull()
})
```
(Si el archivo no usa `vi.stubGlobal`, adáptalo al estilo de mock existente; importa `vi` si falta.)

- [ ] **Step 3: Ejecutar**
Run: `npx vitest run src/api/client.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/api/client.ts src/api/client.test.ts
git commit -m "feat(H1): frontend API client for auth + users (credentials include)"
```

---

## Task 9: AuthContext + Login + gate en App + Header

**Files:**
- Create: `src/auth/AuthContext.tsx`
- Create: `src/components/Login.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Crear `src/auth/AuthContext.tsx`**
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserPublic } from '../../shared/types'
import { authMe, authLogin, authLogout } from '../api/client'

interface AuthState {
  user: UserPublic | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() { setUser(await authMe()) }

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

  async function login(email: string, password: string) { setUser(await authLogin(email, password)) }
  async function logout() { await authLogout(); setUser(null) }

  return <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthCtx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
```

- [ ] **Step 2: Crear `src/components/Login.tsx`**
```tsx
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try { await login(email, password) }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E9EDF2]">
      <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 w-[360px] flex flex-col gap-3">
        <h1 className="text-[18px] font-bold text-slate-800 mb-1">Ambientalia · Servicio Técnico</h1>
        <label className="text-[12px] font-medium text-slate-600">Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 w-full border border-slate-200 rounded p-2 text-[13px]" />
        </label>
        <label className="text-[12px] font-medium text-slate-600">Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="mt-1 w-full border border-slate-200 rounded p-2 text-[13px]" />
        </label>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <button type="submit" disabled={busy}
          className="bg-[#2C7BE5] text-white rounded p-2 text-[13px] font-bold disabled:opacity-50">
          {busy ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Envolver en `src/main.tsx`** — importa y envuelve `<App/>` con `<AuthProvider>`:
```tsx
import { AuthProvider } from './auth/AuthContext'
// … dentro de createRoot(...).render(<StrictMode> ... </StrictMode>):
//   <AuthProvider><App /></AuthProvider>
```
(Localiza el `<App />` en el render y envuélvelo: `<AuthProvider><App /></AuthProvider>`.)

- [ ] **Step 4: Gate en `src/App.tsx`** (respetando las Reglas de Hooks)

⚠️ IMPORTANTE: los `return` condicionales deben ir **DESPUÉS de TODAS las llamadas a hooks** (no antes), o React falla con "Rendered fewer hooks than expected".

1. Añade imports:
```tsx
import { useAuth } from './auth/AuthContext'
import { Login } from './components/Login'
```
2. Como **primera** línea dentro de `function App()` (es una llamada a hook, va con los demás hooks):
```tsx
  const { user, loading: authLoading } = useAuth()
```
3. Cambia la dependencia del `useAsync` para que el tablero se **recargue al iniciar sesión** (el `user` pasa de `null` a definido):
```tsx
  const { data: tickets, loading, error, reload } = useAsync(fetchTickets, [user?.id])
```
4. **Después** de `const groups = groupTicketsByColumn(tickets ?? [])` (es decir, tras TODOS los hooks), añade los returns condicionales:
```tsx
  if (authLoading) return <div className="h-screen flex items-center justify-center text-slate-400">Cargando…</div>
  if (!user) return <Login />
```
Así todos los hooks se llaman siempre y el `return` del login ocurre después. Mantén el resto del JSX igual.

- [ ] **Step 5: Menú de usuario en `src/components/Header.tsx`** — el Header necesita saber el usuario y permitir logout. Añade el uso de auth y un botón de salir + nombre (reemplaza el avatar estático). Añade arriba:
```tsx
import { useAuth } from '../auth/AuthContext'
```
Y reemplaza el bloque del avatar (el `<div className="w-8 h-8 rounded-full …">…</div>` final) por:
```tsx
                    <UserMenu />
```
Y añade, al final del archivo (fuera del componente `Header`):
```tsx
function UserMenu() {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-3 ml-1">
      <span className="text-[12px] font-medium hidden md:block">{user.name}{user.isAdmin ? ' · Admin' : ''}</span>
      <button onClick={() => logout()} title="Cerrar sesión" className="p-1.5 text-white/60 hover:text-white">
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Verificar suite + typecheck + build**
Run: `npx vitest run && npx tsc -b && npx vite build`
Expected: tests PASS, tsc exit 0, build OK.

- [ ] **Step 7: Commit**
```bash
git add src/auth/AuthContext.tsx src/components/Login.tsx src/main.tsx src/App.tsx src/components/Header.tsx
git commit -m "feat(H1): frontend auth context + login screen + app gate + user menu/logout"
```

---

## Task 10: Página de gestión de usuarios (admin) + navegación + cambiar contraseña

**Files:**
- Create: `src/components/UsersAdmin.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Crear `src/components/UsersAdmin.tsx`**
```tsx
import { useEffect, useState } from 'react'
import type { UserPublic } from '../../shared/types'
import { listUsers, createUser, updateUser } from '../api/client'

export function UsersAdmin({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try { setUsers(await listUsers()) } catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [])

  async function toggleActive(u: UserPublic) {
    await updateUser(u.id, { active: !u.active }); reload()
  }
  async function resetPassword(u: UserPublic) {
    const pw = prompt(`Nueva contraseña para ${u.email} (mínimo 8 caracteres):`)
    if (!pw) return
    try { await updateUser(u.id, { password: pw }); alert('Contraseña actualizada') }
    catch (e) { alert('Error: ' + String(e instanceof Error ? e.message : e)) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Usuarios</h1>
        <button onClick={() => setCreating(true)} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo usuario</button>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-slate-500 border-b">
            <th className="py-2">Correo</th><th>Nombre</th><th>Admin</th><th>Activo</th><th></th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.email}</td>
                <td>{u.name}</td>
                <td>{u.isAdmin ? 'Sí' : 'No'}</td>
                <td>{u.active ? 'Sí' : 'No'}</td>
                <td className="text-right">
                  <button onClick={() => toggleActive(u)} className="text-[12px] text-blue-600 mr-3">{u.active ? 'Desactivar' : 'Activar'}</button>
                  <button onClick={() => resetPassword(u)} className="text-[12px] text-blue-600">Resetear contraseña</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && <CreateUser onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
    </div>
  )
}

function CreateUser({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await createUser({ email, name, password, isAdmin }); onCreated() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo usuario</h3>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="password" placeholder="Contraseña inicial (mín. 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="border border-slate-200 rounded p-2 text-[13px]" />
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} /> Administrador</label>
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

- [ ] **Step 2: Navegación a Usuarios desde el Header (solo admin)**

En `src/components/Header.tsx`, el `UserMenu` debe poder abrir la página de usuarios. Cambia `UserMenu` para recibir una prop `onOpenUsers` y mostrar el enlace solo a admins:
```tsx
function UserMenu({ onOpenUsers }: { onOpenUsers: () => void }) {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-3 ml-1">
      {user.isAdmin && (
        <button onClick={onOpenUsers} title="Usuarios" className="p-1.5 text-white/60 hover:text-white">
          <span className="material-symbols-outlined text-[20px]">group</span>
        </button>
      )}
      <span className="text-[12px] font-medium hidden md:block">{user.name}{user.isAdmin ? ' · Admin' : ''}</span>
      <button onClick={() => logout()} title="Cerrar sesión" className="p-1.5 text-white/60 hover:text-white">
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </div>
  )
}
```
Y haz que `Header` reciba y pase la prop:
```tsx
export const Header: React.FC<{ onOpenUsers: () => void }> = ({ onOpenUsers }) => {
```
…y donde se renderiza `<UserMenu />`, ponlo `<UserMenu onOpenUsers={onOpenUsers} />`.

- [ ] **Step 3: Conectar en `src/App.tsx`**

Añade estado para mostrar la página de usuarios y pásalo al Header:
```tsx
import { UsersAdmin } from './components/UsersAdmin'
// … dentro de App(), junto a los otros useState:
  const [showUsers, setShowUsers] = useState(false)
// … cambia <Header /> por:
        <Header onOpenUsers={() => setShowUsers(true)} />
// … y antes del cierre del div raíz (junto al render condicional de TicketDetailView), añade:
      {showUsers && <UsersAdmin onClose={() => setShowUsers(false)} />}
```

- [ ] **Step 4: Verificar suite + typecheck + build**
Run: `npx vitest run && npx tsc -b && npx vite build`
Expected: tests PASS, tsc exit 0, build OK.

- [ ] **Step 5: Commit**
```bash
git add src/components/UsersAdmin.tsx src/App.tsx src/components/Header.tsx
git commit -m "feat(H1): admin Users page (list/create/activate/reset password) + header navigation"
```

---

## Task 11: Verificación completa + retiro del endpoint destructivo

**Files:**
- Modify: `server/app.ts` (retirar `recreate-schema`)
- Modify: `server/app.test.ts` (si tenía test de ese endpoint)

- [ ] **Step 1: Retirar el endpoint destructivo `recreate-schema`**

Ahora que hay tickets gestionados por la app (B) y usuarios (H1), el endpoint `GET /api/admin/recreate-schema` (DROP de todo) es un riesgo y ya cumplió su función de migración. **Elimínalo** de `server/app.ts` (todo el bloque `app.get('/api/admin/recreate-schema', …)`). Si quedan imports sin usar por ello (`migrate`, `reseedTicketNumber`), elimínalos del `import … from './db/migrate'` de `app.ts`. (Quedan disponibles en `server/index.ts` para el arranque.)

- [ ] **Step 2: Suite + typecheck + lint + build**
Run: `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS; `tsc -b` exit 0; server typecheck sin errores; eslint **0 errores** (warnings OK); build OK. Corrige lo que tu cambio haya introducido.

- [ ] **Step 3: Commit**
```bash
git add server/app.ts server/app.test.ts
git commit -m "chore(H1): remove destructive recreate-schema endpoint (migration done; managed data exists)"
```

- [ ] **Step 4: Verificación manual (tras desplegar)**

1. En EasyPanel añade variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` (≥8) y **Implementar**.
2. Al arrancar (con la tabla `users` vacía) se crea el admin inicial (revisa logs: "Admin inicial creado: …").
3. Abre la app → debe pedir **login**. Entra con `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
4. Verás el tablero. En el Header (icono de grupo) abre **Usuarios** → crea un usuario no-admin.
5. Cierra sesión, entra con el nuevo usuario: NO ve "Usuarios"; sí ve el tablero y puede transicionar.
6. Haz una transición → en PgWeb `SELECT performed_by FROM ticket_transitions ORDER BY performed_at DESC LIMIT 1;` debe ser el **nombre del usuario logueado** (no "Equipo Técnico").

---

## Notas de cierre
- **Sesiones**: cookie httpOnly `sid`, 30 días, revocables (logout, desactivar usuario, cambiar contraseña).
- **Actor de transición**: ahora es el usuario autenticado; `TRANSITION_ACTOR` queda solo de respaldo.
- **Fuera de alcance (H2/H3)**: roles ricos con capacidades por área, página de configuración avanzada, aprobación de perfiles, auto-registro, reseteo de contraseña por correo (depende de D).
- **`/api/attachment`** sigue abierto (proxy con patrón de ruta validado); si se quiere, gatearlo con `requireAuth` es trivial en una iteración futura.
