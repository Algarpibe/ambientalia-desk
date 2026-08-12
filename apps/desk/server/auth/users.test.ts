import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createUser, getUserByEmail, getUserById, listUsers, updateUser, setPassword, countUsers } from './users'
import { createRole } from './roles'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('users repo', () => {
  // El documento de remisión imprime cargo y empresa del técnico; antes salían de una hoja de Google.
  it('cargo y empresa se guardan, se devuelven y se vacían a NULL', async () => {
    const u = await createUser(db, { email: 'tec@x.co', name: 'Gustavo Novoa', passwordHash: 'h' })
    expect(u.cargo).toBeNull()
    expect(u.empresa).toBeNull()

    await updateUser(db, u.id, { cargo: 'Director Técnico', empresa: 'Ambientalia S.A.S.' })
    expect(await getUserById(db, u.id)).toMatchObject({ cargo: 'Director Técnico', empresa: 'Ambientalia S.A.S.' })

    // Un patch que no menciona esas claves no debe borrarlas.
    await updateUser(db, u.id, { name: 'Gustavo N.' })
    expect(await getUserById(db, u.id)).toMatchObject({ cargo: 'Director Técnico', empresa: 'Ambientalia S.A.S.' })

    await updateUser(db, u.id, { cargo: null })
    expect((await getUserById(db, u.id))!.cargo).toBeNull()
  })

  it('createUser acepta cargo y empresa desde el alta', async () => {
    const u = await createUser(db, { email: 'alta@x.co', name: 'Alta', passwordHash: 'h', cargo: 'Técnico de campo', empresa: 'Ambientalia S.A.S.' })
    expect(u.cargo).toBe('Técnico de campo')
    expect(u.empresa).toBe('Ambientalia S.A.S.')
  })

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

  it('updateUser cambia el correo, normalizado', async () => {
    const u = await createUser(db, { email: 'viejo@x.co', name: 'V', passwordHash: 'h' })
    await updateUser(db, u.id, { email: 'NUEVO@X.CO' })
    expect((await getUserById(db, u.id))!.email).toBe('nuevo@x.co')
    // Y se puede encontrar por el nuevo, que es lo que hace falta para iniciar sesión.
    expect(await getUserByEmail(db, 'nuevo@x.co')).not.toBeNull()
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
    const u = await createUser(db, { email: 'a2@b.co', name: 'A', passwordHash: 'h' })
    await updateUser(db, u.id, { roleId: role.id })
    expect((await getUserById(db, u.id))!.areas).toEqual(['Comercial'])
    await updateUser(db, u.id, { roleId: null })
    expect((await getUserById(db, u.id))!.areas).toEqual([])
  })
})
