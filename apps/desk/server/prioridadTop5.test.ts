import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { CARGOS } from '@ambientalia/shared'
import { createUser } from './auth/users'
import { createRole } from './auth/roles'
import { createSession } from './auth/sessions'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * PRIORIDAD DEL CLIENTE Y TOP 5 (F1B-07, lote 1), contra el servidor.
 *
 * Escalera del `PUT` (F1B-10): A existencia del cliente (404) < B permiso (403) < C contenido (422). Las pruebas de
 * POSICIÓN activan DOS guardas a la vez: con una sola, mover la guarda de sitio no rompería nada (regla de mutación 1).
 * El permiso es `puedeFijarPrioridadTop5` de `shared` y se CONSUME aquí, no se reescribe (regla invariable 13).
 */
const cliente = async (id = 'cli-1', nombre = 'Gecelca S.A. E.S.P.') => {
  await db.query('INSERT INTO books.contacts (contact_id, contact_name) VALUES ($1,$2)', [id, nombre])
}
const ticketDe = async (id: string, number: number, clientId: string, priority: string, status = 'Ingresado') => {
  await db.query('INSERT INTO tickets (id, number, subject, status, client_id, priority) VALUES ($1,$2,$3,$4,$5,$6)', [id, number, 'Top 5', status, clientId, priority])
}
const prioridadDe = async (id: string) => ((await db.query('SELECT priority FROM tickets WHERE id=$1', [id])).rows[0] as { priority: string | null }).priority
const filas = async () => (await db.query('SELECT client_id, top5, prioridad, actualizado_por, actualizado_at FROM public.cliente_prioridad')).rows as Record<string, unknown>[]
const fijar = (app: ReturnType<typeof appWith>['app'], cookie: string, id: string, cuerpo: unknown) =>
  request(app).put(`/api/clients/${id}/prioridad`).set('Cookie', cookie).send(cuerpo as object)
/** Un usuario con área y cargo propios, con correo propio para poder tener varios en la misma base. */
async function sujeto(n: number, areas: string[], cargo: (typeof CARGOS)[number] | null): Promise<string> {
  const role = await createRole(db, { name: `Rol-${n}`, areas })
  const u = await createUser(db, { email: `s${n}@x.co`, name: `Sujeto ${n}`, passwordHash: 'h', roleId: role.id, cargoPermiso: cargo })
  return `sid=${await createSession(db, u.id)}`
}

describe('PUT /api/clients/:id/prioridad · quién puede (RQ-TC-27)', () => {
  it('TC27-1 · Director Comercial (Comercial) fija Top 5 Medium: 200 y la fila lleva quién y cuándo', async () => {
    await cliente(); const { app } = appWith()
    const res = await fijar(app, await userCookie(['Comercial'], 'Director Comercial'), 'cli-1', { top5: true, prioridad: 'Medium' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ clientId: 'cli-1', top5: true, prioridad: 'Medium', actualizadoPor: 'Op' })
    const f = await filas()
    expect(f).toHaveLength(1)
    expect(f[0]).toMatchObject({ client_id: 'cli-1', top5: true, prioridad: 'Medium', actualizado_por: 'Op' })
    expect(f[0].actualizado_at).toBeTruthy()
  })

  it('TC27-2 · el administrador fija un Top 5 sin cargo', async () => {
    await cliente(); const { app } = appWith()
    expect((await fijar(app, await adminCookie(), 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(200)
    expect((await filas())[0]).toMatchObject({ top5: true, prioridad: 'High' })
  })

  it('TC27-3 · Coordinador Comercial: 403 y sin fila', async () => {
    await cliente(); const { app } = appWith()
    const res = await fijar(app, await userCookie(['Comercial'], 'Coordinador Comercial'), 'cli-1', { top5: true, prioridad: 'High' })
    expect(res.status).toBe(403)
    expect(await filas()).toEqual([])
  })

  it('TC27-4 · Servicio Técnico + Director Técnico: 403', async () => {
    await cliente(); const { app } = appWith()
    expect((await fijar(app, await userCookie(['Servicio Técnico'], 'Director Técnico'), 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(403)
  })

  it('TC27-5 · Urgent y Alta: 422 y sin fila', async () => {
    await cliente(); const { app } = appWith(); const cookie = await userCookie(['Comercial'], 'Director Comercial')
    for (const mala of ['Urgent', 'Alta']) {
      const res = await fijar(app, cookie, 'cli-1', { top5: true, prioridad: mala })
      expect(res.status, mala).toBe(422)
      expect(Array.isArray(res.body.errors), mala).toBe(true)
    }
    expect(await filas()).toEqual([])
  })

  it('TC27-6 · top5 verdadero sin prioridad: 422', async () => {
    await cliente(); const { app } = appWith()
    expect((await fijar(app, await userCookie(['Comercial'], 'Director Comercial'), 'cli-1', { top5: true })).status).toBe(422)
    expect(await filas()).toEqual([])
  })

  it('TC27-7 · POSICIÓN · sin permiso Y con prioridad inválida: 403, no 422', async () => {
    await cliente(); const { app } = appWith()
    const res = await fijar(app, await userCookie(['Comercial'], 'Coordinador Comercial'), 'cli-1', { top5: true, prioridad: 'Urgent' })
    expect(res.status).toBe(403)
  })

  it('POSICIÓN A < B · cliente inexistente Y sin cargo: 404 con el mensaje propio', async () => {
    const { app } = appWith()
    const res = await fijar(app, await userCookie(['Comercial']), 'no-existe', { top5: true, prioridad: 'High' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Cliente no encontrado')
  })

  it('POSICIÓN A < C · cliente inexistente Y cuerpo inválido: 404', async () => {
    const { app } = appWith()
    expect((await fijar(app, await adminCookie(), 'no-existe', { top5: true, prioridad: 'Urgent' })).status).toBe(404)
  })

  it('TC27-8 · top5 falso: 200, deja de ser Top 5 y la prioridad se guarda null aunque venga valor (S-9)', async () => {
    await cliente(); const { app } = appWith(); const admin = await adminCookie()
    await fijar(app, admin, 'cli-1', { top5: true, prioridad: 'High' })
    const res = await fijar(app, admin, 'cli-1', { top5: false, prioridad: 'High' })
    expect(res.status).toBe(200)
    expect(await filas()).toMatchObject([{ client_id: 'cli-1', top5: false, prioridad: null }])
    expect((await request(app).get('/api/top5').set('Cookie', admin)).body).toEqual([])
  })

  it('TC27-9 · la lectura está abierta a una sesión sin cargo, y la lista Top 5 trae nombre y prioridad', async () => {
    await cliente(); const { app } = appWith()
    await fijar(app, await adminCookie(), 'cli-1', { top5: true, prioridad: 'Low' })
    const lector = await sujeto(1, ['Compras'], null)
    const uno = await request(app).get('/api/clients/cli-1/prioridad').set('Cookie', lector)
    expect(uno.status).toBe(200)
    expect(uno.body).toMatchObject({ clientId: 'cli-1', top5: true, prioridad: 'Low' })
    const lista = await request(app).get('/api/top5').set('Cookie', lector)
    expect(lista.status).toBe(200)
    expect(lista.body).toMatchObject([{ clientId: 'cli-1', name: 'Gecelca S.A. E.S.P.', prioridad: 'Low' }])
  })

  it('TC27-9 · un cliente sin fila se lee como no Top 5; uno inexistente es 404 con el mensaje propio (no el comodín)', async () => {
    await cliente(); const { app } = appWith(); const cookie = await sujeto(1, ['Compras'], null)
    const sin = await request(app).get('/api/clients/cli-1/prioridad').set('Cookie', cookie)
    expect(sin.body).toMatchObject({ clientId: 'cli-1', top5: false, prioridad: null })
    const no = await request(app).get('/api/clients/no-existe/prioridad').set('Cookie', cookie)
    expect(no.status).toBe(404)
    expect(no.body.error).toBe('Cliente no encontrado')
  })

  it('la lectura sin sesión es 401', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/top5')).status).toBe(401)
    expect((await request(app).put('/api/clients/cli-1/prioridad').send({ top5: false })).status).toBe(401)
  })
})

describe('PUT /api/clients/:id/prioridad · sin nadie con cargo y matriz de sujetos (RQ-TC-28, RQ-PM-23)', () => {
  it('TC28-1 · base sin cargos: un no admin de Comercial recibe 403 y el administrador 200', async () => {
    await cliente(); const { app } = appWith()
    const comercial = await userCookie(['Comercial']); const admin = await adminCookie()
    expect((await db.query('SELECT 1 FROM users WHERE cargo_permiso IS NOT NULL')).rows).toEqual([])
    expect((await fijar(app, comercial, 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(403)
    expect((await fijar(app, admin, 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(200)
  })

  it('PM23-1 · nueve sujetos con área Comercial (siete cargos, sin cargo, admin): sólo Director Comercial y admin → 200', async () => {
    await cliente(); const { app } = appWith()
    const sujetos: [string, string][] = []
    let n = 0
    for (const c of CARGOS) sujetos.push([c, await sujeto(++n, ['Comercial'], c)])
    sujetos.push(['sin cargo', await sujeto(++n, ['Comercial'], null)])
    sujetos.push(['admin', await adminCookie()])
    expect(sujetos).toHaveLength(9)
    let aceptados = 0
    for (const [nombre, cookie] of sujetos) {
      const res = await fijar(app, cookie, 'cli-1', { top5: true, prioridad: 'Medium' })
      const debe = nombre === 'Director Comercial' || nombre === 'admin'
      expect(res.status, nombre).toBe(debe ? 200 : 403)
      if (res.status === 200) aceptados += 1
    }
    expect(aceptados).toBe(2)
  })

  it('PM23-2 · Director Comercial sólo con Servicio Técnico: 403', async () => {
    await cliente(); const { app } = appWith()
    expect((await fijar(app, await sujeto(1, ['Servicio Técnico'], 'Director Comercial'), 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(403)
  })

  it('PM23-3 · Compras + Director Comercial: 403', async () => {
    await cliente(); const { app } = appWith()
    expect((await fijar(app, await sujeto(1, ['Compras'], 'Director Comercial'), 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(403)
  })
})

describe('marcar o desmarcar el Top 5 no reescribe tickets ya nacidos (RQ-TC-24, mitad de servidor)', () => {
  it('TC24-14 · dos tickets abiertos Low del cliente conservan Low tras marcarlo Top 5 High', async () => {
    await cliente(); const { app } = appWith()
    await ticketDe('t1', 9101, 'cli-1', 'Low'); await ticketDe('t2', 9102, 'cli-1', 'Low')
    expect((await fijar(app, await adminCookie(), 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(200)
    expect([await prioridadDe('t1'), await prioridadDe('t2')]).toEqual(['Low', 'Low'])
  })

  it('TC24-15 · desmarcar no cambia un ticket que ya es High', async () => {
    await cliente(); const { app } = appWith(); const admin = await adminCookie()
    await ticketDe('t1', 9103, 'cli-1', 'High')
    await fijar(app, admin, 'cli-1', { top5: true, prioridad: 'High' })
    expect((await fijar(app, admin, 'cli-1', { top5: false })).status).toBe(200)
    expect(await prioridadDe('t1')).toBe('High')
  })
})
