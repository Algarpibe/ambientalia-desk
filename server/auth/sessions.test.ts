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
