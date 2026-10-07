import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import { MENSAJES_REASIGNACION, CATALOGO_POR_FLUJO, AREAS, areasForTransition, type Flujo } from '@ambientalia/shared'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createUser } from '../auth/users'
import { createRole } from '../auth/roles'
import { createSession } from '../auth/sessions'
import { entradasActuales } from '../db/sla'
import { primerDerivado } from '../db/primerDerivado'
import { db, instalarArnes, appWith, adminCookie } from '../testing/appHarness'

instalarArnes()
afterEach(() => { vi.unstubAllGlobals() })

/**
 * REASIGNAR LA PERSONA A CARGO (F1B-05, lote 3), contra el servidor: `POST /api/tickets/:id/reasignar`.
 *
 * Escalera de F1B-10: A existencia (404) < B permiso (403) < C contenido (422) < D unicidad/carrera (409). Las pruebas de
 * POSICIÓN activan DOS guardas a la vez: con una sola, mover la guarda de sitio no rompería nada (regla de mutación 1).
 * El permiso es `puedeReasignar` de `shared` y se CONSUME (regla invariable 13); el barrido HTTP de más abajo lo fija.
 * Los textos de error se comparan contra `MENSAJES_REASIGNACION`, no contra literales.
 */
const reasignar = (app: ReturnType<typeof appWith>['app'], cookie: string, id: string, cuerpo: unknown) =>
  request(app).post(`/api/tickets/${id}/reasignar`).set('Cookie', cookie).send(cuerpo as object)

/** Una persona con correo propio (varias por base). `areas` crea un rol; `sesion` abre sesión. */
async function persona(n: string, o: { areas?: string[]; admin?: boolean; activa?: boolean } = {}): Promise<{ id: string; cookie: string }> {
  const roleId = o.areas ? (await createRole(db, { name: `Rol-${n}`, areas: o.areas })).id : null
  const u = await createUser(db, { email: `${n.toLowerCase()}@x.co`, name: n, passwordHash: 'h', roleId, isAdmin: o.admin ?? false })
  if (o.activa === false) await db.query('UPDATE users SET active = false WHERE id = $1', [u.id])
  return { id: u.id, cookie: `sid=${await createSession(db, u.id)}` }
}
const ticketDe = async (id: string, number: number, derivadoA: string | null, status = 'Ingresado', classification: string | null = null) => {
  await db.query('INSERT INTO tickets (id, number, subject, status, classification, derivado_a) VALUES ($1,$2,$3,$4,$5,$6)', [id, number, 'Reasignar', status, classification, derivadoA])
}
const fila = async (id: string) => (await db.query('SELECT status, derivado_a, managed_by_app FROM tickets WHERE id = $1', [id])).rows[0] as { status: string; derivado_a: string | null; managed_by_app: boolean }
const derivadoA = async (id: string) => (await fila(id)).derivado_a
const trazas = async () => (await db.query('SELECT de, a, motivo, reasignado_por FROM reasignaciones ORDER BY id')).rows as Array<{ de: string | null; a: string; motivo: string; reasignado_por: string }>
const avisosDe = async (userId: string) => (await db.query('SELECT texto, ticket_id, enviado_at FROM avisos WHERE user_id = $1', [userId])).rows as Array<{ texto: string; ticket_id: string; enviado_at: unknown }>
const totalAvisos = async () => Number((await db.query('SELECT COUNT(*)::int AS n FROM avisos')).rows[0].n)
const filasDeTransiciones = async () => Number((await db.query('SELECT COUNT(*)::int AS n FROM ticket_transitions')).rows[0].n)
/** Un área que puede actuar en `status` (flujo servicio), calculada del catálogo y no de la implementación. */
const areaDe = (status: string): string => CATALOGO_POR_FLUJO.servicio.filter((t) => t.from.includes(status)).flatMap((t) => areasForTransition(t.area))[0]

describe('escalón A y B · existencia y permiso (RQ-TC-50, RQ-PM-27)', () => {
  it('sin sesión: 401', async () => {
    const { app } = appWith(); await ticketDe('t1', 9501, null)
    expect((await request(app).post('/api/tickets/t1/reasignar').send({})).status).toBe(401)
  })

  it('un usuario del área del estado reasigna: 200, derivado_a cambia y el estado no', async () => {
    const carla = await persona('Carla', { areas: [areaDe('Ingresado')] }); const beto = await persona('Beto')
    await ticketDe('t1', 9501, null); const { app } = appWith()
    const res = await reasignar(app, carla.cookie, 't1', { destino: beto.id, motivo: 'Ana está de vacaciones' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ticketId: 't1', derivadoA: beto.id })
    expect(await fila('t1')).toMatchObject({ derivado_a: beto.id, status: 'Ingresado' })
  })

  it('no hace falta ser la persona a cargo: el ticket es de Ana y reasigna Carla, que sólo tiene el área', async () => {
    const ana = await persona('Ana'); const carla = await persona('Carla', { areas: [areaDe('Ingresado')] }); const beto = await persona('Beto')
    await ticketDe('t1', 9501, ana.id); const { app } = appWith()
    expect((await reasignar(app, carla.cookie, 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(200)
    expect(await derivadoA('t1')).toBe(beto.id)
  })

  it('el administrador pasa sin área', async () => {
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null); const { app } = appWith()
    expect((await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(200)
  })

  it('sin el área del estado y sin ser administrador: 403 aunque el cuerpo sea válido, y nada cambia', async () => {
    const intruso = await persona('Intruso', { areas: [] }); const beto = await persona('Beto')
    await ticketDe('t1', 9501, null); const { app } = appWith()
    const res = await reasignar(app, intruso.cookie, 't1', { destino: beto.id, motivo: 'cobertura' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJES_REASIGNACION.permiso)
    expect(await derivadoA('t1')).toBeNull()
    expect(await trazas()).toEqual([])
  })

  // PAR 1 y 2 (y 3): ticket inexistente, usuario sin área, cuerpo vacío → 404 (A antes que B y que C)
  it('par 1 y 2: ticket inexistente + usuario sin permiso + cuerpo vacío: 404, no 403 ni 422', async () => {
    const intruso = await persona('Intruso', { areas: [] }); const { app } = appWith()
    expect((await reasignar(app, intruso.cookie, 'no-existe', {})).status).toBe(404)
  })

  // PAR 2 y 3: ticket existente, usuario sin área, sin motivo → 403 (B antes que C)
  it('par 2 y 3: ticket existente + usuario sin permiso + sin motivo: 403, no 422', async () => {
    const intruso = await persona('Intruso', { areas: [] }); await ticketDe('t1', 9501, null); const { app } = appWith()
    const res = await reasignar(app, intruso.cookie, 't1', {})
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJES_REASIGNACION.permiso)
  })
})

describe('escalón C · contenido (RQ-TC-50)', () => {
  const con = async () => {
    const ana = await persona('Ana'); const beto = await persona('Beto')
    const carla = await persona('Carla', { areas: [areaDe('Ingresado')] })
    await ticketDe('t1', 9501, ana.id)
    return { ana, beto, carla, ...appWith() }
  }

  it.each([['vacío', { destino: 'x', motivo: '' }], ['de espacios', { destino: 'x', motivo: '   ' }], ['ausente', { destino: 'x' }]])('motivo %s: 422 con el texto del motivo y nada se escribe', async (_n, cuerpo) => {
    const { ana, beto, carla, app } = await con()
    const res = await reasignar(app, carla.cookie, 't1', { ...cuerpo, destino: beto.id })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe(MENSAJES_REASIGNACION.motivo)
    expect(await derivadoA('t1')).toBe(ana.id)
    expect(await trazas()).toEqual([]); expect(await totalAvisos()).toBe(0)
  })

  // PAR 3 y 4: motivo de espacios y sin destino → el texto del motivo
  it('par 3 y 4: motivo de espacios y sin destino: el texto del motivo', async () => {
    const { carla, app } = await con()
    expect((await reasignar(app, carla.cookie, 't1', { motivo: '   ' })).body.error).toBe(MENSAJES_REASIGNACION.motivo)
  })

  // PAR 3 y 5, 3 y 6: motivo vacío con destino igual al actual, inexistente e inactivo → el texto del motivo las tres veces
  it('par 3 y 5 y 3 y 6: motivo vacío con destino igual, inexistente e inactivo: el texto del motivo las tres veces', async () => {
    const { ana, carla, app } = await con(); const baja = await persona('Baja', { activa: false })
    for (const destino of [ana.id, 'no-existe', baja.id]) {
      const res = await reasignar(app, carla.cookie, 't1', { destino, motivo: '' })
      expect(res.status).toBe(422)
      expect(res.body.error, `destino ${destino}`).toBe(MENSAJES_REASIGNACION.motivo)
    }
  })

  // PAR 4 y 5: ticket SIN persona a cargo, motivo válido, destino ausente → «falta el destino», no «ya está a cargo»
  it('par 4 y 5: ticket sin persona a cargo, destino ausente: el texto de destino ausente', async () => {
    const carla = await persona('Carla', { areas: [areaDe('Ingresado')] }); await ticketDe('t2', 9502, null); const { app } = appWith()
    for (const cuerpo of [{ motivo: 'cobertura' }, { motivo: 'cobertura', destino: '' }]) {
      const res = await reasignar(app, carla.cookie, 't2', cuerpo)
      expect(res.status).toBe(422)
      expect(res.body.error).toBe(MENSAJES_REASIGNACION.destino)
    }
  })

  // PAR 5 y 6: destino que es la persona actual y está inactiva → el texto de destino igual
  it('par 5 y 6: destino igual a la persona a cargo e inactiva: el texto de destino igual, no el de inexistente', async () => {
    const baja = await persona('Baja', { activa: false }); const carla = await persona('Carla', { areas: [areaDe('Ingresado')] })
    await ticketDe('t1', 9501, baja.id); const { app } = appWith()
    const res = await reasignar(app, carla.cookie, 't1', { destino: baja.id, motivo: 'cobertura' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe(MENSAJES_REASIGNACION.mismo)
  })

  it('destino igual a la persona a cargo (S-4): 422', async () => {
    const { ana, carla, app } = await con()
    const res = await reasignar(app, carla.cookie, 't1', { destino: ana.id, motivo: 'cobertura' })
    expect(res.status).toBe(422); expect(res.body.error).toBe(MENSAJES_REASIGNACION.mismo)
  })

  it('destino ausente o vacío: 422', async () => {
    const { carla, app } = await con()
    for (const destino of [undefined, '', '   ']) {
      const res = await reasignar(app, carla.cookie, 't1', { destino, motivo: 'cobertura' })
      expect(res.status).toBe(422); expect(res.body.error).toBe(MENSAJES_REASIGNACION.destino)
    }
  })

  it('no se puede vaciar por esta ruta: un destino vacío no deja el ticket sin persona a cargo', async () => {
    const { ana, carla, app } = await con()
    expect((await reasignar(app, carla.cookie, 't1', { destino: null, motivo: 'cobertura' })).status).toBe(422)
    expect(await derivadoA('t1')).toBe(ana.id)
  })

  it('destino inexistente o inactivo: 422 con el texto de inexistente, y nada cambia', async () => {
    const { ana, carla, app } = await con(); const baja = await persona('Baja', { activa: false })
    for (const destino of ['no-existe', baja.id]) {
      const res = await reasignar(app, carla.cookie, 't1', { destino, motivo: 'cobertura' })
      expect(res.status).toBe(422); expect(res.body.error).toBe(MENSAJES_REASIGNACION.inexistente)
    }
    expect(await derivadoA('t1')).toBe(ana.id)
    expect(await trazas()).toEqual([]); expect(await totalAvisos()).toBe(0)
  })
})

describe('éxito y escalón D · traza y carrera (RQ-TC-50)', () => {
  it('el motivo se guarda recortado y la traza lleva origen, destino y quién reasignó', async () => {
    const ana = await persona('Ana'); const beto = await persona('Beto'); const carla = await persona('Carla', { areas: [areaDe('Ingresado')] })
    await ticketDe('t1', 9501, ana.id); const { app } = appWith()
    expect((await reasignar(app, carla.cookie, 't1', { destino: ` ${beto.id} `, motivo: '  Ana sale de vacaciones  ' })).status).toBe(200)
    expect(await trazas()).toEqual([{ de: ana.id, a: beto.id, motivo: 'Ana sale de vacaciones', reasignado_por: 'Carla' }])
  })

  it('origen nulo se puede reasignar: 200 y la traza lleva de nulo', async () => {
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null); const { app } = appWith()
    expect((await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'primera asignación' })).status).toBe(200)
    expect((await trazas())[0]).toMatchObject({ de: null, a: beto.id })
  })

  it('reasignarse a uno mismo se permite (S-5)', async () => {
    const ana = await persona('Ana'); const carla = await persona('Carla', { areas: [areaDe('Ingresado')] })
    await ticketDe('t1', 9501, ana.id); const { app } = appWith()
    expect((await reasignar(app, carla.cookie, 't1', { destino: carla.id, motivo: 'lo tomo yo' })).status).toBe(200)
    expect(await derivadoA('t1')).toBe(carla.id)
  })

  it('el destino puede ser de otra área (S-6)', async () => {
    const otra = AREAS.find((a) => a !== areaDe('Ingresado'))!
    const dora = await persona('Dora', { areas: [otra] }); const carla = await persona('Carla', { areas: [areaDe('Ingresado')] })
    await ticketDe('t1', 9501, null); const { app } = appWith()
    expect((await reasignar(app, carla.cookie, 't1', { destino: dora.id, motivo: 'cobertura' })).status).toBe(200)
  })

  it('encadenadas A→B y B→C dejan dos filas con el origen vigente en cada una', async () => {
    const ana = await persona('Ana'); const beto = await persona('Beto'); const cris = await persona('Cris')
    await ticketDe('t1', 9501, ana.id); const { app } = appWith(); const admin = await adminCookie()
    expect((await reasignar(app, admin, 't1', { destino: beto.id, motivo: 'uno' })).status).toBe(200)
    expect((await reasignar(app, admin, 't1', { destino: cris.id, motivo: 'dos' })).status).toBe(200)
    expect((await trazas()).map((t) => [t.de, t.a])).toEqual([[ana.id, beto.id], [beto.id, cris.id]])
  })

  /**
   * Carrera determinista (diseño §4): un `Queryable` SIN `connect` —así `enTransaccion` llama directo— que, justo antes de
   * reenviar el `UPDATE tickets SET derivado_a`, escribe OTRO `derivado_a` en la base real, como si otra reasignación se
   * hubiera colado entre la lectura y la escritura.
   */
  const conCarrera = (colado: () => string | null): { dbPropia: Queryable; disparos: () => number } => {
    let n = 0
    const dbPropia = {
      query: async (sql: string, params?: unknown[]) => {
        if (sql.startsWith('UPDATE tickets SET derivado_a')) { n++; await db.query('UPDATE tickets SET derivado_a = $1 WHERE id = $2', [colado(), 't1']) }
        return db.query(sql, params)
      },
    } as unknown as Queryable
    return { dbPropia, disparos: () => n }
  }

  it('la persona a cargo cambió entre la lectura y la escritura: 409, sin traza, sin aviso y derivado_a como lo dejó la otra escritura', async () => {
    const ana = await persona('Ana'); const beto = await persona('Beto'); const carla = await persona('Carla')
    await ticketDe('t1', 9501, ana.id)
    const { dbPropia, disparos } = conCarrera(() => carla.id)
    const { app } = appWith({}, dbPropia)
    const res = await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })
    expect(disparos()).toBe(1)
    expect(res.status).toBe(409)
    expect(res.body.error).toBe(MENSAJES_REASIGNACION.carrera)
    expect(await derivadoA('t1')).toBe(carla.id)
    expect(await trazas()).toEqual([]); expect(await totalAvisos()).toBe(0)
  })

  // POSICIÓN: el 422 de contenido va antes que el 409 de carrera. Con el cuerpo inválido la escritura ni se intenta.
  it('un contenido inválido sobre un ticket que otro cambió da 422 y no 409: la escritura no se intenta', async () => {
    const ana = await persona('Ana'); const carla = await persona('Carla')
    await ticketDe('t1', 9501, ana.id)
    const { dbPropia, disparos } = conCarrera(() => carla.id)
    const { app } = appWith({}, dbPropia)
    const res = await reasignar(app, await adminCookie(), 't1', { destino: carla.id, motivo: '' })
    expect(res.status).toBe(422); expect(res.body.error).toBe(MENSAJES_REASIGNACION.motivo)
    expect(disparos()).toBe(0)
    expect(await derivadoA('t1')).toBe(ana.id)
  })
})

describe('aviso al destino y no interferencia (RQ-AV-20, RQ-TC-51)', () => {
  it('el destino recibe el aviso con el motivo y el nombre de quien reasigna, y el origen no', async () => {
    const ana = await persona('Ana'); const beto = await persona('Beto'); const carla = await persona('Carla', { areas: [areaDe('Ingresado')] })
    await ticketDe('t1', 9501, ana.id); const { app } = appWith()
    expect((await reasignar(app, carla.cookie, 't1', { destino: beto.id, motivo: 'Ana sale de vacaciones' })).status).toBe(200)
    const avisos = await avisosDe(beto.id)
    expect(avisos).toHaveLength(1)
    expect(avisos[0].ticket_id).toBe('t1')
    expect(avisos[0].texto).toContain('Carla'); expect(avisos[0].texto).toContain('Ana sale de vacaciones'); expect(avisos[0].texto).toContain('9501')
    expect(await avisosDe(ana.id)).toEqual([])
  })

  it('reasignarse a uno mismo no crea aviso', async () => {
    const carla = await persona('Carla', { areas: [areaDe('Ingresado')] }); await ticketDe('t1', 9501, null); const { app } = appWith()
    expect((await reasignar(app, carla.cookie, 't1', { destino: carla.id, motivo: 'lo tomo yo' })).status).toBe(200)
    expect(await totalAvisos()).toBe(0)
  })

  it('con el correo configurado y fallando: 200, todo escrito y enviado_at queda NULL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })))
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null)
    const { app } = appWith({ avisosWebhookUrl: 'https://n8n/webhook/avisos' })
    const res = await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })
    expect(res.status).toBe(200)
    expect(await derivadoA('t1')).toBe(beto.id); expect(await trazas()).toHaveLength(1)
    const avisos = await avisosDe(beto.id)
    expect(avisos).toHaveLength(1); expect(avisos[0].enviado_at).toBeNull()
  })

  it('con el correo sin configurar: 200 y enviado_at NULL', async () => {
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null); const { app } = appWith()
    expect((await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(200)
    expect((await avisosDe(beto.id))[0].enviado_at).toBeNull()
  })

  it('con el correo funcionando el aviso se sella como enviado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null)
    const { app } = appWith({ avisosWebhookUrl: 'https://n8n/webhook/avisos' })
    expect((await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(200)
    expect((await avisosDe(beto.id))[0].enviado_at).not.toBeNull()
  })

  // El aviso va DESPUÉS y fuera de la transacción: si su INSERT falla, la reasignación y su traza ya están escritas.
  it('si falla el alta del aviso tras la reasignación, derivado_a y la traza permanecen', async () => {
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null)
    const dbPropia = { query: async (sql: string, params?: unknown[]) => { if (sql.includes('INSERT INTO avisos')) throw new Error('fallo del aviso'); return db.query(sql, params) } } as unknown as Queryable
    const { app } = appWith({}, dbPropia)
    const res = await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })
    expect(res.status).toBe(500)
    expect(await derivadoA('t1')).toBe(beto.id); expect(await trazas()).toHaveLength(1)
  })

  it('no toca el historial de estados: ticket_transitions sigue igual, el estado también, y entradasActuales y primerDerivado no se mueven', async () => {
    const ana = await persona('Ana'); const beto = await persona('Beto')
    await ticketDe('t1', 9501, ana.id, 'Ingresado')
    await db.query("INSERT INTO ticket_transitions (ticket_id, from_status, to_status, performed_by, values) VALUES ('t1', 'Habilitar Servicio', 'Ingresado', 'Admin', $1)", [JSON.stringify({ derivado_a: ana.id })])
    const antes = { n: await filasDeTransiciones(), entradas: await entradasActuales(db, [{ id: 't1', status: 'Ingresado' }], ['Ingresado']), primero: await primerDerivado(db, 't1') }
    expect(antes.n).toBe(1); expect(antes.primero).toBe(ana.id)
    const { app } = appWith()
    expect((await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(200)
    expect(await filasDeTransiciones()).toBe(antes.n)
    expect(await entradasActuales(db, [{ id: 't1', status: 'Ingresado' }], ['Ingresado'])).toEqual(antes.entradas)
    expect(await primerDerivado(db, 't1')).toBe(antes.primero)
    expect((await fila('t1')).status).toBe('Ingresado')
  })
})

describe('barrido HTTP de estados por áreas contra la guarda (RQ-PM-27, RQ-TC-52)', () => {
  const CLASIFICACION: Record<Flujo, string | null> = { servicio: null, 'equipo-nuevo': 'Equipo nuevo', 'soporte-remoto': 'Soporte remoto' }

  // Cuerpo SIN motivo: con permiso cae en el 422 del motivo, sin él en el 403. El par (403, 422) delata la guarda sin escribir nada.
  it('cada estado de los tres catálogos, por cada área: 403 si ninguna transición que sale de él es del área, 422 si alguna lo es', async () => {
    const sesiones = new Map<string, string>()
    for (const area of AREAS) sesiones.set(area, (await persona(`Area${AREAS.indexOf(area)}`, { areas: [area] })).cookie)
    const admin = await adminCookie(); const { app } = appWith()
    let n = 0, permitidos = 0, negados = 0
    for (const flujo of Object.keys(CATALOGO_POR_FLUJO) as Flujo[]) {
      const catalogo = CATALOGO_POR_FLUJO[flujo]
      for (const status of new Set(catalogo.flatMap((t) => [...t.from, t.to]))) {
        const id = `s${n}`; await ticketDe(id, 9600 + n, null, status, CLASIFICACION[flujo]); n++
        for (const area of AREAS) {
          const esperado = catalogo.some((t) => t.from.includes(status) && areasForTransition(t.area).includes(area))
          const res = await reasignar(app, sesiones.get(area)!, id, {})
          expect(res.status, `${flujo} · ${status} · ${area}`).toBe(esperado ? 422 : 403)
          if (esperado) permitidos++; else negados++
        }
        expect((await reasignar(app, admin, id, {})).status, `${flujo} · ${status} · administrador`).toBe(422)
      }
    }
    expect(n).toBeGreaterThan(10); expect(permitidos).toBeGreaterThan(0); expect(negados).toBeGreaterThan(0)
  }, 60000)

  it('un estado sin salida («Finalizado»): sólo el administrador reasigna (S-2)', async () => {
    expect(CATALOGO_POR_FLUJO.servicio.some((t) => t.from.includes('Finalizado'))).toBe(false)
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null, 'Finalizado'); const { app } = appWith()
    for (const area of AREAS) {
      const c = (await persona(`Fin${AREAS.indexOf(area)}`, { areas: [area] })).cookie
      expect((await reasignar(app, c, 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(403)
    }
    expect(await derivadoA('t1')).toBeNull()
    expect((await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(200)
  })
})

// W-1 del verify (RQ-AV-20): «el aviso se escribe FUERA de la transacción». pg-mem no expone `connect`, así que con él
// `enTransaccion` ejecuta sin transacción y el orden no se ve (`transaccion.ts:15`). Este pool falso SÍ lo expone y reparte
// cada sentencia por su origen: `tx` es la conexión de la transacción, `pool` es el pool. Se registran sólo las tres
// sentencias que importan; BEGIN, COMMIT y ROLLBACK los resuelve el falso, el resto va a la base real.
describe('el aviso va DESPUÉS del COMMIT y por el pool, no por la transacción (RQ-AV-20)', () => {
  it('secuencia: tx BEGIN, UPDATE, INSERT de la traza, COMMIT, y sólo entonces el INSERT del aviso por el pool', async () => {
    const beto = await persona('Beto'); await ticketDe('t1', 9501, null)
    const orden: string[] = []
    const rastrear = (origen: string) => async (sql: string, params?: unknown[]) => {
      const s = sql.trim()
      const verbo = s.split(/\s+/)[0].toUpperCase()
      if (verbo === 'BEGIN' || verbo === 'COMMIT' || verbo === 'ROLLBACK') { orden.push(`${origen}:${verbo}`); return { rows: [], rowCount: 0 } }
      if (/^UPDATE tickets SET derivado_a/.test(s)) orden.push(`${origen}:UPDATE tickets`)
      else if (/^INSERT INTO reasignaciones/.test(s)) orden.push(`${origen}:INSERT reasignaciones`)
      else if (/^INSERT INTO avisos/.test(s)) orden.push(`${origen}:INSERT avisos`)
      return db.query(s, params)
    }
    const falso = { query: rastrear('pool'), connect: async () => ({ query: rastrear('tx'), release: () => {} }) } as unknown as Queryable
    const { app } = appWith({}, falso)
    expect((await reasignar(app, await adminCookie(), 't1', { destino: beto.id, motivo: 'cobertura' })).status).toBe(200)
    expect(orden).toEqual(['tx:BEGIN', 'tx:UPDATE tickets', 'tx:INSERT reasignaciones', 'tx:COMMIT', 'pool:INSERT avisos'])
  })
})
