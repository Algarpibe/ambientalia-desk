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
