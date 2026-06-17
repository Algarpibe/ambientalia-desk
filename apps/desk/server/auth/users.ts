import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { UserPublic } from '@ambientalia/shared'
import { AREAS } from '@ambientalia/shared'

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

/** Cuántos administradores activos hay (para no dejar el sistema sin admin). */
export async function countActiveAdmins(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM users WHERE is_admin = true AND active = true')
  return r.rows[0].n as number
}
