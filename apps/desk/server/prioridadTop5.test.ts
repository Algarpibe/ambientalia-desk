import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { CARGOS } from '@ambientalia/shared'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { upsertTicket } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { entradasActuales } from './db/sla'
import { ajustarPrioridad } from './db/prioridadCliente'
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

  it('PM23-1 · diez sujetos con área Comercial (ocho cargos, sin cargo, admin): sólo Director Comercial y admin → 200', async () => {
    await cliente(); const { app } = appWith()
    const sujetos: [string, string][] = []
    let n = 0
    for (const c of CARGOS) sujetos.push([c, await sujeto(++n, ['Comercial'], c)])
    sujetos.push(['sin cargo', await sujeto(++n, ['Comercial'], null)])
    sujetos.push(['admin', await adminCookie()])
    expect(sujetos).toHaveLength(10)
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

describe('marcar o desmarcar el Top 5 propaga a los tickets abiertos y lo revierte (RQ-TC-24, mitad de servidor)', () => {
  it('TC24-14 · dos tickets abiertos Low del cliente quedan High tras marcarlo Top 5 High, con una fila top5 por ticket', async () => {
    await cliente(); const { app } = appWith(); await ticketDe('t1', 9101, 'cli-1', 'Low'); await ticketDe('t2', 9102, 'cli-1', 'Low')
    expect((await fijar(app, await adminCookie(), 'cli-1', { top5: true, prioridad: 'High' })).status).toBe(200)
    expect([await prioridadDe('t1'), await prioridadDe('t2')]).toEqual(['High', 'High'])
    expect(await ajustes()).toMatchObject(['t1', 't2'].map((ticket_id) => ({ ticket_id, de: 'Low', a: 'High', origen: 'top5', ajustado_por: 'Admin', ajustado_at: expect.anything() })))
  })

  it('TC24-15 · desmarcar devuelve a Low un ticket que subió por el Top 5, con una fila top5_revertido', async () => {
    await cliente(); const { app } = appWith(); const admin = await adminCookie(); await ticketDe('t1', 9103, 'cli-1', 'Low')
    await fijar(app, admin, 'cli-1', { top5: true, prioridad: 'High' })
    expect((await fijar(app, admin, 'cli-1', { top5: false })).status).toBe(200)
    expect(await prioridadDe('t1')).toBe('Low')
    expect((await ajustes()).map((f) => [f.de, f.a, f.origen])).toEqual([['Low', 'High', 'top5'], ['High', 'Low', 'top5_revertido']])
  })
})

/**
 * AJUSTE POR TICKET (F1B-07, lote 2a; `tickets-core` RQ-TC-29, `permissions` RQ-PM-23 del `POST`).
 *
 * Escalera del `POST` (F1B-10): A el ticket no existe (404) < B1 el cliente no es Top 5 o el ticket no tiene cliente (409)
 * < B2 sin permiso (403) < C contenido (422). Las pruebas de POSICIÓN activan DOS guardas a la vez (regla de mutación 1).
 */
const marcarTop5 = async (clientId: string, prioridad = 'High', top5 = true) => {
  await db.query('INSERT INTO public.cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ($1,$2,$3,$4)', [clientId, top5, prioridad, 'seed'])
}
const ticketSinCliente = async (id: string, number: number, priority = 'Low') => {
  await db.query('INSERT INTO tickets (id, number, subject, status, priority) VALUES ($1,$2,$3,$4,$5)', [id, number, 'Sin cliente', 'Ingresado', priority])
}
const ajustar = (app: ReturnType<typeof appWith>['app'], cookie: string, id: string, cuerpo: unknown) =>
  request(app).post(`/api/tickets/${id}/prioridad`).set('Cookie', cookie).send(cuerpo as object)
const ajustes = async () => (await db.query('SELECT ticket_id, de, a, motivo, ajustado_por, ajustado_at, origen FROM public.prioridad_ajustes ORDER BY id')).rows as Record<string, unknown>[]
const marcaApp = async (id: string) => ((await db.query('SELECT managed_by_app FROM tickets WHERE id=$1', [id])).rows[0] as { managed_by_app: boolean }).managed_by_app
const OK = { prioridad: 'Medium', motivo: 'Cliente estratégico' }

describe('POST /api/tickets/:id/prioridad · el ajuste (RQ-TC-29)', () => {
  it('TC29-1 · con motivo: 200, prioridad nueva y fila de traza con anterior, nueva, motivo recortado, autor y fecha', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    const res = await ajustar(app, await userCookie(['Comercial'], 'Director Comercial'), 't1', { prioridad: 'Medium', motivo: '  Cliente estratégico  ' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ticketId: 't1', prioridad: 'Medium', clientId: 'cli-1', top5: true })
    expect(await prioridadDe('t1')).toBe('Medium')
    const a = await ajustes()
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ ticket_id: 't1', de: 'Low', a: 'Medium', motivo: 'Cliente estratégico', ajustado_por: 'Op' })
    expect(a[0].ajustado_at).toBeTruthy()
  })

  it('TC29-2 · motivo ausente, vacío o de espacios: 422, sin cambio ni traza', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith(); const dc = await userCookie(['Comercial'], 'Director Comercial')
    for (const motivo of [undefined, '', '   ']) {
      const res = await ajustar(app, dc, 't1', { prioridad: 'Medium', motivo })
      expect(res.status, String(motivo)).toBe(422)
    }
    expect(await prioridadDe('t1')).toBe('Low')
    expect(await ajustes()).toEqual([])
  })

  it('TC29-3 · Urgent y Alta no se asignan: 422 con errors[]', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith(); const dc = await userCookie(['Comercial'], 'Director Comercial')
    for (const mala of ['Urgent', 'Alta']) {
      const res = await ajustar(app, dc, 't1', { prioridad: mala, motivo: 'x' })
      expect(res.status, mala).toBe(422)
      expect(res.body.error).toBe(res.body.errors[0])
    }
    expect(await ajustes()).toEqual([])
  })

  it('TC29-3b · igual a la actual (D-9): 422', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    expect((await ajustar(app, await adminCookie(), 't1', { prioridad: 'Low', motivo: 'x' })).status).toBe(422)
    expect(await ajustes()).toEqual([])
  })

  it('TC29-3c · motivo Y prioridad malos a la vez: los DOS errores viajan en errors[]', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    const res = await ajustar(app, await adminCookie(), 't1', { prioridad: 'Urgent', motivo: ' ' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toHaveLength(2)
  })

  it('TC29-4 · cliente sin fila o con top5 falso: 409 y sin cambio', async () => {
    await cliente('cli-1'); await cliente('cli-2'); await marcarTop5('cli-2', 'High', false)
    await ticketDe('t1', 9201, 'cli-1', 'Low'); await ticketDe('t2', 9202, 'cli-2', 'Low'); const { app } = appWith(); const admin = await adminCookie()
    expect((await ajustar(app, admin, 't1', OK)).status).toBe(409)
    expect((await ajustar(app, admin, 't2', OK)).status).toBe(409)
    expect([await prioridadDe('t1'), await prioridadDe('t2')]).toEqual(['Low', 'Low'])
    expect(await ajustes()).toEqual([])
  })

  it('TC29-5 · ticket sin client_id: 409', async () => {
    await ticketSinCliente('t1', 9201); const { app } = appWith()
    expect((await ajustar(app, await adminCookie(), 't1', OK)).status).toBe(409)
    expect(await prioridadDe('t1')).toBe('Low')
  })

  it('TC29-6 · Coordinador Comercial: 403 y sin cambio', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    expect((await ajustar(app, await userCookie(['Comercial'], 'Coordinador Comercial'), 't1', OK)).status).toBe(403)
    expect(await prioridadDe('t1')).toBe('Low')
    expect(await ajustes()).toEqual([])
  })

  it('TC29-7 · POSICIÓN B1 < B2 · sin permiso Y cliente no Top 5 Y sin motivo: 409, no 403 ni 422', async () => {
    await cliente(); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    expect((await ajustar(app, await userCookie(['Comercial'], 'Coordinador Comercial'), 't1', { prioridad: 'Medium' })).status).toBe(409)
  })

  it('TC29-8 · POSICIÓN B1 < C · con permiso Y cliente no Top 5 Y sin motivo: 409, no 422', async () => {
    await cliente(); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    expect((await ajustar(app, await userCookie(['Comercial'], 'Director Comercial'), 't1', { prioridad: 'Medium' })).status).toBe(409)
  })

  it('POSICIÓN B2 < C · sin permiso Y cliente Top 5 Y sin motivo: 403, no 422', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    expect((await ajustar(app, await userCookie(['Comercial'], 'Coordinador Comercial'), 't1', { prioridad: 'Medium' })).status).toBe(403)
  })

  it('TC29-9 · ticket inexistente: 404 con el mensaje propio (no el comodín)', async () => {
    const { app } = appWith()
    const res = await ajustar(app, await adminCookie(), 'no-existe', OK)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Ticket no encontrado')
  })

  it('POSICIÓN A < B2 · ticket inexistente Y sin cargo: 404, no 403', async () => {
    const { app } = appWith()
    expect((await ajustar(app, await userCookie(['Comercial']), 'no-existe', OK)).status).toBe(404)
  })

  it('TC29-10 · el reloj del SLA no se mueve: ni fila nueva en ticket_transitions ni cambio en la entrada que lee db/sla.ts', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low', 'Ingresado'); const { app } = appWith()
    await db.query("INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ('t1','habilitar_servicio','Ingresado','2026-08-03T10:00:00Z')")
    const trazas = async () => (await db.query('SELECT 1 FROM ticket_transitions')).rows.length
    const entrada = async () => (await entradasActuales(db, [{ id: 't1', status: 'Ingresado' }], ['Ingresado'])).get('t1')?.toISOString()
    const antes = { n: await trazas(), entrada: await entrada() }
    expect(antes).toEqual({ n: 1, entrada: '2026-08-03T10:00:00.000Z' })
    expect((await ajustar(app, await adminCookie(), 't1', OK)).status).toBe(200)
    expect({ n: await trazas(), entrada: await entrada() }).toEqual(antes)
  })

  it('TC29-11 · el sync no pisa la prioridad ajustada: managed_by_app pasa a true y un upsertTicket con otra prioridad no la cambia', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); await ticketDe('t2', 9202, 'cli-1', 'Low'); const { app } = appWith()
    const filaZoho = (id: string, n: string, priority: string) => ticketRowFromZoho({ id, ticketNumber: n, subject: 'Top 5', status: 'Ingresado', statusType: 'Open', priority, customFields: {} })
    expect(await marcaApp('t1')).toBe(false)
    expect((await ajustar(app, await adminCookie(), 't1', { prioridad: 'High', motivo: 'Cliente clave' })).status).toBe(200)
    expect(await marcaApp('t1')).toBe(true)
    await upsertTicket(db, filaZoho('t1', '9201', 'Low'))
    expect(await prioridadDe('t1')).toBe('High')
    // Control: un ticket NO ajustado sí lo pisa el sincronizador, así que la prueba discrimina.
    await upsertTicket(db, filaZoho('t2', '9202', 'Medium'))
    expect(await prioridadDe('t2')).toBe('Medium')
  })

  it('TC29-12 · atómico (Plan B, pg-mem no revierte: transaccion.test.ts:25): si el INSERT de la traza falla, la secuencia es BEGIN, UPDATE, INSERT, ROLLBACK, sin COMMIT', async () => {
    const calls: string[] = []
    const ejecutar = (origen: string) => async (sql: string) => {
      const verbo = sql.trim().split(/\s+/)[0].toUpperCase()
      calls.push(`${origen}:${verbo}`)
      if (verbo === 'INSERT') throw new Error('boom (rastreador)')
      return { rows: [] }
    }
    // Se distingue el pool de la conexión de la transacción: un UPDATE por el pool quedaría FUERA de ella.
    const falso = { query: ejecutar('pool'), connect: async () => ({ query: ejecutar('tx'), release: () => {} }) } as unknown as Queryable
    await expect(ajustarPrioridad(falso, { ticketId: 't1', de: 'Low', prioridad: 'High', motivo: 'x', por: 'Op' })).rejects.toThrow('boom (rastreador)')
    expect(calls).toEqual(['tx:BEGIN', 'tx:UPDATE', 'tx:INSERT', 'tx:ROLLBACK'])
  })

  it('TC29-12b · la base rechaza un motivo vacío con el CHECK (D-7) y no deja traza', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low')
    await expect(ajustarPrioridad(db, { ticketId: 't1', de: 'Low', prioridad: 'High', motivo: '', por: 'Op' })).rejects.toThrow()
    expect(await ajustes()).toEqual([])
  })

  it('TC29-13 · el otro ticket del cliente conserva su prioridad', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); await ticketDe('t2', 9202, 'cli-1', 'Low'); const { app } = appWith()
    expect((await ajustar(app, await adminCookie(), 't1', OK)).status).toBe(200)
    expect([await prioridadDe('t1'), await prioridadDe('t2')]).toEqual(['Medium', 'Low'])
  })

  it('PM23-1 · diez sujetos con área Comercial sobre el POST: sólo Director Comercial y admin → 200', async () => {
    await cliente(); await marcarTop5('cli-1'); const { app } = appWith()
    const sujetos: [string, string][] = []
    let n = 100
    for (const c of CARGOS) sujetos.push([c, await sujeto(++n, ['Comercial'], c)])
    sujetos.push(['sin cargo', await sujeto(++n, ['Comercial'], null)])
    sujetos.push(['admin', await adminCookie()])
    expect(sujetos).toHaveLength(10)
    let aceptados = 0
    for (const [i, [nombre, cookie]] of sujetos.entries()) {
      await ticketDe(`p${i}`, 9300 + i, 'cli-1', 'Low')
      const res = await ajustar(app, cookie, `p${i}`, OK)
      expect(res.status, nombre).toBe(nombre === 'Director Comercial' || nombre === 'admin' ? 200 : 403)
      if (res.status === 200) aceptados += 1
    }
    expect(aceptados).toBe(2)
  })

  it('PM23-2/3 · Director Comercial sin Comercial y Compras + Director Comercial: 403', async () => {
    await cliente(); await marcarTop5('cli-1'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith()
    expect((await ajustar(app, await sujeto(1, ['Servicio Técnico'], 'Director Comercial'), 't1', OK)).status).toBe(403)
    expect((await ajustar(app, await sujeto(2, ['Compras'], 'Director Comercial'), 't1', OK)).status).toBe(403)
  })

  it('GET /api/tickets/:id/prioridad · devuelve la prioridad, el Top 5 del cliente y los ajustes; inexistente es 404 propio', async () => {
    await cliente(); await marcarTop5('cli-1', 'High'); await ticketDe('t1', 9201, 'cli-1', 'Low'); const { app } = appWith(); const admin = await adminCookie()
    await ajustar(app, admin, 't1', OK)
    const lector = await sujeto(1, ['Compras'], null)
    const res = await request(app).get('/api/tickets/t1/prioridad').set('Cookie', lector)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ticketId: 't1', prioridad: 'Medium', clientId: 'cli-1', top5: true, ajustes: [{ de: 'Low', a: 'Medium', motivo: 'Cliente estratégico' }] })
    const no = await request(app).get('/api/tickets/no-existe/prioridad').set('Cookie', lector)
    expect(no.status).toBe(404)
    expect(no.body.error).toBe('Ticket no encontrado')
  })

  it('el ajuste sin sesión es 401', async () => {
    const { app } = appWith()
    expect((await request(app).post('/api/tickets/t1/prioridad').send(OK)).status).toBe(401)
  })
})
