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
