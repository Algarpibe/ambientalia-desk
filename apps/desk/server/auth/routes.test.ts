import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createApp } from '../app'
import { createUser } from './users'
import { hashPassword } from './passwords'
import type { AppConfig } from '@ambientalia/zoho-sync/config'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function app() {
  const sync = { backfillTickets: vi.fn(), backfillArchivedTickets: vi.fn(), syncRecent: vi.fn(), syncTicket: vi.fn(), syncConversations: vi.fn(), syncActivities: vi.fn(), syncTicketHistory: vi.fn(), backfillTicketHistory: vi.fn(), syncContacts: vi.fn(), syncPendingHistory: vi.fn() }
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

  it('elimina al usuario sin historial; con historial da 409 con la salida escrita', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const creado = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'op@x.co', name: 'Op', password: 'password123' })
    const id = creado.body.id

    // Con historial no se borra, y el mensaje trae el conteo y la salida (desactivar).
    await db.query("INSERT INTO tickets (id, number, status) VALUES ('t1', 1, 'Ingresado')")
    await db.query('UPDATE tickets SET derivado_a = $1 WHERE id = $2', [id, 't1'])
    const enUso = await request(a).delete(`/api/users/${id}`).set('Cookie', cookie)
    expect(enUso.status).toBe(409)
    expect(enUso.body.error).toMatch(/Desactívalo/)

    // Sin historial, sí.
    await db.query('UPDATE tickets SET derivado_a = NULL WHERE id = $1', ['t1'])
    expect((await request(a).delete(`/api/users/${id}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(a).get('/api/users').set('Cookie', cookie)).body).toHaveLength(1)

    expect((await request(a).delete(`/api/users/${id}`).set('Cookie', cookie)).status).toBe(404)
  })

  /**
   * Esta puerta es además la que hace imposible quedarse sin administradores: para borrar al último
   * que queda tendrías que ser tú mismo, y por aquí no pasas. Por eso el DELETE no lleva la
   * comprobación de `countActiveAdmins` que sí tiene el PATCH — ahí sería inalcanzable.
   */
  it('no puedes borrarte a ti mismo, ni siendo el único administrador ni habiendo otro', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const yo = (await request(a).get('/api/auth/me').set('Cookie', cookie)).body

    // Siendo el único administrador: es el caso que deja el sistema sin nadie que administre.
    const solo = await request(a).delete(`/api/users/${yo.id}`).set('Cookie', cookie)
    expect(solo.status).toBe(409)
    expect(solo.body.error).toMatch(/ti mismo/)

    // Y con un segundo administrador tampoco, porque la razón no es el conteo sino que eres tú.
    await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'a2@x.co', name: 'A2', password: 'password123', isAdmin: true })
    const conOtro = await request(a).delete(`/api/users/${yo.id}`).set('Cookie', cookie)
    expect(conOtro.status).toBe(409)
    expect(conOtro.body.error).toMatch(/ti mismo/)
  })

  it('el PATCH cambia el correo, y el duplicado da 409 sin bloquear al propio usuario', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const creado = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'op@x.co', name: 'Op', password: 'password123' })
    const id = creado.body.id

    const ok = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: '  NUEVO@X.CO ' })
    expect(ok.status).toBe(200)
    expect(ok.body.email).toBe('nuevo@x.co')

    // LA TRAMPA: guardar la ficha sin haber tocado el correo no puede rechazarse a sí misma. Sin
    // excluir al propio usuario de la comprobación, este PATCH da 409 y no se puede editar nada más.
    const mismo = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: 'nuevo@x.co', name: 'Op 2' })
    expect(mismo.status).toBe(200)
    expect(mismo.body.name).toBe('Op 2')

    // El de OTRO usuario sí se rechaza.
    const chocado = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: 'admin@x.co' })
    expect(chocado.status).toBe(409)

    const vacio = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: '   ' })
    expect(vacio.status).toBe(422)
  })

  it('el alta acepta cargo y empresa; vacíos o espacios quedan NULL', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const con = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'c@x.co', name: 'C', password: 'password123', cargo: 'Técnico', empresa: 'Ambientalia S.A.S.' })
    expect(con.status).toBe(201)
    expect(con.body).toMatchObject({ cargo: 'Técnico', empresa: 'Ambientalia S.A.S.' })
    // El documento de remisión imprime estos campos: una cadena en blanco debe guardarse como NULL.
    const sin = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 's@x.co', name: 'S', password: 'password123', cargo: '   ', empresa: '' })
    expect(sin.status).toBe(201)
    expect(sin.body.cargo).toBeNull()
    expect(sin.body.empresa).toBeNull()
  })
})

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

  it('no-admin no puede listar roles (403)', async () => {
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

describe('protección de administradores', () => {
  it('no permite quitar el último administrador activo (409)', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const users = (await request(a).get('/api/users').set('Cookie', cookie)).body
    const admin = users.find((u: { email: string }) => u.email === 'admin@x.co')
    const res = await request(a).patch(`/api/users/${admin.id}`).set('Cookie', cookie).send({ isAdmin: false })
    expect(res.status).toBe(409)
  })

  it('sí permite quitar admin si queda otro (200)', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'a2@x.co', name: 'A2', password: 'password123', isAdmin: true })
    const users = (await request(a).get('/api/users').set('Cookie', cookie)).body
    const second = users.find((u: { email: string }) => u.email === 'a2@x.co')
    const res = await request(a).patch(`/api/users/${second.id}`).set('Cookie', cookie).send({ isAdmin: false })
    expect(res.status).toBe(200)
    expect(res.body.isAdmin).toBe(false)
  })
})
