import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { RemisionListado } from '@ambientalia/shared'
import { upsertEquipo } from './db/equipos'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { TRANSITION_ACTOR } from './transitionActor'
import { db, instalarArnes, equipoRow, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * RQ-TZ-14 · restaurar una remisión deja rastro: quién, cuándo y la anulación que deshace.
 * Por la ruta real y con pg-mem: lo que se mira es la fila de `remisiones`, no un mock.
 */
const preparar = async () => {
  await upsertEquipo(db, equipoRow('eq-rr1', '18A20070'))
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0)")
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-rr1', 'Grimm', 'EDM180C', '18A1')`)
}

/** Segundo administrador: hace falta para distinguir quién anuló de quién restauró. */
const cookieDe = async (nombre: string): Promise<string> => {
  const u = await createUser(db, { email: `${nombre.toLowerCase()}@x.co`, name: nombre, passwordHash: await hashPassword('password123'), isAdmin: true })
  return `sid=${await createSession(db, u.id)}`
}

const crearRemision = async (app: import('express').Express, cookie: string): Promise<string> => {
  const r = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
  return r.body.id
}
const anular = (app: import('express').Express, cookie: string, id: string) => request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)
const restaurar = (app: import('express').Express, cookie: string, id: string) => request(app).post(`/api/remisiones/${id}/restaurar`).set('Cookie', cookie)
const fila = async (id: string) => (await db.query(
  'SELECT anulada_at, anulada_por, restaurada_at, restaurada_por, anulacion_previa_at, anulacion_previa_por FROM remisiones WHERE id = $1', [id],
)).rows[0] as Record<string, unknown>

/** Envuelve la base para que la sesión llegue sin nombre (`users.name` es NOT NULL y no se puede sembrar así): ejercita el respaldo de la ruta. */
const baseSinNombre = (real: Queryable): Queryable => ({
  query: (async (sql: string, params?: unknown[]) => {
    const r = await real.query(sql, params)
    return /FROM sessions s JOIN users u/.test(sql) ? { ...r, rows: r.rows.map((x) => ({ ...(x as object), name: null })) } : r
  }) as Queryable['query'],
})

describe('RQ-TZ-14 · restaurar deja rastro', () => {
  it('anular y restaurar por la ruta deja las cuatro columnas y vacía las dos vigentes', async () => {
    const ana = await adminCookie(); const beto = await cookieDe('Beto'); await preparar()
    const { app } = appWith()
    const id = await crearRemision(app, ana)
    expect((await anular(app, ana, id)).status).toBe(200)
    const anulada = await fila(id)
    expect((await restaurar(app, beto, id)).status).toBe(200)

    const f = await fila(id)
    expect(f.anulada_at).toBeNull()
    expect(f.anulada_por).toBeNull()
    expect(f.anulacion_previa_por).toBe('Admin')
    expect(f.restaurada_por).toBe('Beto')
    expect(f.anulacion_previa_at).toEqual(anulada.anulada_at)
    expect(f.restaurada_at).toBeInstanceOf(Date)
  })

  it('sin nombre en la sesión se escribe TRANSITION_ACTOR y no NULL', async () => {
    const ana = await adminCookie(); await preparar()
    const id = await crearRemision(appWith().app, ana)
    await anular(appWith().app, ana, id)
    const { app } = appWith({}, baseSinNombre(db))
    expect((await restaurar(app, ana, id)).status).toBe(200)

    const f = await fila(id)
    expect(f.restaurada_por).toBe(TRANSITION_ACTOR)
    expect(f.anulacion_previa_por).toBe('Admin')
  })

  it('restaurar una remisión vigente responde 200 y no escribe nada', async () => {
    const ana = await adminCookie(); await preparar()
    const { app } = appWith()
    const id = await crearRemision(app, ana)
    expect((await restaurar(app, ana, id)).status).toBe(200)

    const f = await fila(id)
    expect(f.restaurada_at).toBeNull()
    expect(f.restaurada_por).toBeNull()
    expect(f.anulacion_previa_at).toBeNull()
    expect(f.anulacion_previa_por).toBeNull()
  })

  it('anulada, restaurada y anulada de nuevo conserva el rastro de la restauración; la anulación vigente es la nueva', async () => {
    const ana = await adminCookie(); const beto = await cookieDe('Beto'); await preparar()
    const { app } = appWith()
    const id = await crearRemision(app, ana)
    await anular(app, ana, id); await restaurar(app, beto, id)
    await anular(app, beto, id)

    const f = await fila(id)
    expect(f.restaurada_por).toBe('Beto')
    expect(f.anulacion_previa_por).toBe('Admin')
    expect(f.anulada_por).toBe('Beto')
    expect(f.anulada_at).toBeInstanceOf(Date)
  })

  it('un segundo ciclo pisa el primero (S-2): sólo queda la anulación y la restauración del ciclo 2', async () => {
    const ana = await adminCookie(); const beto = await cookieDe('Beto'); await preparar()
    const { app } = appWith()
    const id = await crearRemision(app, ana)
    await anular(app, ana, id); await restaurar(app, beto, id)   // ciclo 1: anula Admin, restaura Beto
    await anular(app, beto, id); await restaurar(app, ana, id)   // ciclo 2: anula Beto, restaura Admin

    const f = await fila(id)
    expect(f.anulacion_previa_por).toBe('Beto')
    expect(f.restaurada_por).toBe('Admin')
    expect(f.anulada_at).toBeNull()
    expect(f.anulada_por).toBeNull()
  })

  it('tras restaurar, el listado y el panel del ticket vuelven a enseñar la remisión', async () => {
    const ana = await adminCookie(); await preparar()
    const { app } = appWith()
    const id = await crearRemision(app, ana)
    await anular(app, ana, id)
    expect((await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', ana)).body).toHaveLength(0)

    await restaurar(app, ana, id)
    const panel = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', ana)
    expect(panel.body).toHaveLength(1)
    const listado = await request(app).get('/api/remisiones/listado').set('Cookie', ana)
    expect(listado.body.find((r: RemisionListado) => r.id === id)).toBeDefined()
  })
})
