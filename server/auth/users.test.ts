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
