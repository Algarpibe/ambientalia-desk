import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { upsertTicket } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { entradasActuales } from './db/sla'
import { getActiveTickets } from './db/ticketsConCliente'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * PROPAGAR EL TOP 5 A LOS TICKETS ABIERTOS (F1B-07, L2a; `decision/cola-del-taller-los-tres-cabos`, punto 3).
 * Al marcar un cliente Top 5 sus tickets abiertos toman la prioridad, con traza por ticket; al desmarcarlo vuelven a la
 * calculada; los ajustes manuales con motivo no se tocan. La imposición es del servidor (`PUT /api/clients/:id/prioridad`).
 */
const cliente = async (id = 'cli-1') => { await db.query('INSERT INTO books.contacts (contact_id, contact_name) VALUES ($1,$2)', [id, `Cliente ${id}`]) }
const ticket = async (id: string, number: number, clientId: string | null, priority: string | null, statusType: string | null = 'Open') => {
  await db.query('INSERT INTO tickets (id, number, subject, status, status_type, client_id, priority) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, number, 'Top 5', 'Ingresado', statusType, clientId, priority])
}
const prio = async (id: string) => ((await db.query('SELECT priority FROM tickets WHERE id=$1', [id])).rows[0] as { priority: string | null }).priority
const fila = async (id: string) => (await db.query('SELECT priority, managed_by_app, prioridad_en_app_at, modified_time, status FROM tickets WHERE id=$1', [id])).rows[0] as Record<string, unknown>
const trazas = async () => (await db.query('SELECT ticket_id, de, a, motivo, ajustado_por, origen FROM public.prioridad_ajustes ORDER BY id')).rows as Record<string, unknown>[]
const manual = async (id: string, de: string, a: string) => { await db.query("INSERT INTO public.prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por) VALUES ($1,$2,$3,'a mano','Ana')", [id, de, a]) }
type App = ReturnType<typeof appWith>['app']
/** `adminCookie()` crea un usuario con correo fijo: se pide una sola vez por base (la base es nueva en cada prueba). */
const admins = new WeakMap<object, string>()
const admin = async () => { if (!admins.has(db)) admins.set(db, await adminCookie()); return admins.get(db)! }
const fijar = async (app: App, id: string, cuerpo: unknown, cookie?: string) => request(app).put(`/api/clients/${id}/prioridad`).set('Cookie', cookie ?? await admin()).send(cuerpo as object)
const marcar = (app: App, p: string, id = 'cli-1') => fijar(app, id, { top5: true, prioridad: p })
const desmarcar = (app: App, id = 'cli-1') => fijar(app, id, { top5: false })

describe('esquema · prioridad_ajustes admite a NULL y origen NULL tras migrate (hipótesis DROP NOT NULL, D9)', () => {
  it('acepta una fila con a NULL y otra con origen NULL', async () => {
    await db.query("INSERT INTO public.prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por, origen) VALUES ('t1','High',NULL,'m','x','top5_revertido')")
    await db.query("INSERT INTO public.prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por, origen) VALUES ('t1','Low','High','m','x',NULL)")
    expect((await trazas()).map((t) => [t.a, t.origen])).toEqual([[null, 'top5_revertido'], ['High', null]])
  })
})

describe('qué tickets se tocan (consultas 2 y 3)', () => {
  it('los cerrados y los de otro cliente quedan intactos; los sin client_id también', async () => {
    await cliente(); await cliente('cli-2'); const { app } = appWith()
    await ticket('abierto', 1, 'cli-1', 'Low'); await ticket('cerrado', 2, 'cli-1', 'Low', 'Closed'); await ticket('ajeno', 3, 'cli-2', 'Low'); await ticket('huerfano', 4, null, 'Low')
    expect((await marcar(app, 'High')).status).toBe(200)
    expect(await Promise.all(['abierto', 'cerrado', 'ajeno', 'huerfano'].map(prio))).toEqual(['High', 'Low', 'Low', 'Low'])
    expect((await trazas()).map((t) => t.ticket_id)).toEqual(['abierto'])
  })

  it('las esperas (On Hold) y el status_type nulo cuentan como abiertos', async () => {
    await cliente(); const { app } = appWith()
    await ticket('espera', 1, 'cli-1', 'Low', 'On Hold'); await ticket('nulo', 2, 'cli-1', 'Low', null)
    await marcar(app, 'High')
    expect([await prio('espera'), await prio('nulo')]).toEqual(['High', 'High'])
  })

  it('«abierto» es el de getActiveTickets sobre el mismo juego de datos (H5)', async () => {
    await cliente(); const { app } = appWith()
    await ticket('a', 1, 'cli-1', 'Low', 'Open'); await ticket('b', 2, 'cli-1', 'Low', 'On Hold'); await ticket('c', 3, 'cli-1', 'Low', null); await ticket('d', 4, 'cli-1', 'Low', 'Closed')
    const abiertos = (await getActiveTickets(db)).filter((t) => t.row.client_id === 'cli-1').map((t) => t.row.id).sort()
    await marcar(app, 'High')
    expect((await trazas()).map((t) => t.ticket_id).sort()).toEqual(abiertos)
    expect(await prio('d')).toBe('Low')
  })

  it('la exención va ANTES de nada más: cerrado con ajuste, abierto con ajuste y abierto sin ajuste (posición frente al filtro de abiertos)', async () => {
    await cliente(); const { app } = appWith()
    await ticket('cerrado-aj', 1, 'cli-1', 'Low', 'Closed'); await ticket('abierto-aj', 2, 'cli-1', 'Low'); await ticket('abierto-sin', 3, 'cli-1', 'Low')
    await manual('cerrado-aj', 'Medium', 'Low'); await manual('abierto-aj', 'Medium', 'Low')
    await marcar(app, 'High')
    expect(await Promise.all(['cerrado-aj', 'abierto-aj', 'abierto-sin'].map(prio))).toEqual(['Low', 'Low', 'High'])
    expect((await trazas()).filter((t) => t.origen === 'top5').map((t) => t.ticket_id)).toEqual(['abierto-sin'])
  })
})

describe('qué prioridad toma cada uno (cambioPorTop5 sobre prioridadAlNacer)', () => {
  it('con contrato vigente y un Top 5 Medium, el ticket Low queda High', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    await db.query("INSERT INTO contratos (client_id, lote, fecha_inicio, fecha_fin, creado_por) VALUES ('cli-1','OV-L2A','2020-01-01','2099-12-31','x')")
    await marcar(app, 'Medium')
    expect(await prio('t1')).toBe('High')
    expect(await trazas()).toMatchObject([{ de: 'Low', a: 'High', origen: 'top5' }])
  })

  it('sin contrato, un Top 5 más bajo baja el ticket (S-5)', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'High')
    await marcar(app, 'Medium')
    expect(await prio('t1')).toBe('Medium')
  })

  it('la misma prioridad: ni escritura, ni traza, ni marca; y desmarcar un ticket que ya era High lo deja como estaba', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'High')
    await marcar(app, 'High')
    expect((await fila('t1')).prioridad_en_app_at).toBeNull()
    expect((await desmarcar(app)).status).toBe(200)
    expect(await prio('t1')).toBe('High')
    expect(await trazas()).toEqual([])
  })

  it('cambiar la prioridad de un Top 5 propaga (S-6) y la base sigue siendo la original', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    await marcar(app, 'High'); await marcar(app, 'Medium')
    expect(await prio('t1')).toBe('Medium')
    await desmarcar(app)
    expect(await prio('t1')).toBe('Low')
    expect((await trazas()).map((t) => [t.de, t.a, t.origen])).toEqual([['Low', 'High', 'top5'], ['High', 'Medium', 'top5'], ['Medium', 'Low', 'top5_revertido']])
  })

  it('una prioridad escrita por una transición entre marcar y desmarcar no exime: se revierte a la base (S-4)', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    await marcar(app, 'High')
    await db.query("UPDATE tickets SET priority = 'Medium' WHERE id = 't1'")
    await desmarcar(app)
    expect(await prio('t1')).toBe('Low')
  })

  it('revertir a «sin prioridad»: un ticket sin prioridad vuelve a NULL y la traza lleva a NULL', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', null)
    await marcar(app, 'High'); expect(await prio('t1')).toBe('High')
    await desmarcar(app)
    expect(await prio('t1')).toBeNull()
    expect(await trazas()).toMatchObject([{ de: null, a: 'High', origen: 'top5' }, { de: 'High', a: null, origen: 'top5_revertido' }])
  })

  it('un ticket sin traza (previo al despliegue) no tiene base: al desmarcar no se toca (S-10); con traza al nacer sí vuelve: trazaTop5AlNacer.test.ts', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'High')
    await db.query("INSERT INTO public.cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ('cli-1', true, 'High', 'seed')")
    await desmarcar(app)
    expect(await prio('t1')).toBe('High')
    expect(await trazas()).toEqual([])
  })

  it('un Top 5 previo no se propaga solo: sólo al volver a guardarlo', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    await db.query("INSERT INTO public.cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ('cli-1', true, 'High', 'seed')")
    expect(await prio('t1')).toBe('Low')
    await marcar(app, 'High')
    expect(await prio('t1')).toBe('High')
  })
})

describe('los ajustes manuales no se tocan, y la marca frente al sincronizador', () => {
  it('con un ajuste manual el ticket no cambia al marcar ni recibe la marca; el vecino sí', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Medium'); await ticket('t2', 2, 'cli-1', 'Low')
    await manual('t1', 'Low', 'Medium')
    await marcar(app, 'High')
    expect(await prio('t1')).toBe('Medium')
    expect((await fila('t1')).prioridad_en_app_at).toBeNull()
    expect(await prio('t2')).toBe('High')
  })

  it('un origen desconocido y un origen vacío eximen (falla cerrado)', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low'); await ticket('t2', 2, 'cli-1', 'Low')
    await db.query("INSERT INTO public.prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por, origen) VALUES ('t1','Low','Low','m','x','otro')")
    await manual('t2', 'Low', 'Low')
    await marcar(app, 'High')
    expect([await prio('t1'), await prio('t2')]).toEqual(['Low', 'Low'])
  })

  it('no cambia managed_by_app, modified_time, el estado ni ticket_transitions; sí pone la marca', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    await db.query("INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ('t1','habilitar_servicio','Ingresado','2026-08-03T10:00:00Z')")
    const antes = await fila('t1')
    const entrada = async () => (await entradasActuales(db, [{ id: 't1', status: 'Ingresado' }], ['Ingresado'])).get('t1')?.toISOString()
    const e0 = await entrada()
    await marcar(app, 'High')
    const despues = await fila('t1')
    expect({ ...despues, priority: antes.priority, prioridad_en_app_at: null }).toEqual({ ...antes, prioridad_en_app_at: null })
    expect(despues.managed_by_app).toBe(false)
    expect(despues.prioridad_en_app_at).not.toBeNull()
    expect((await db.query('SELECT 1 FROM ticket_transitions')).rows).toHaveLength(1)
    expect(await entrada()).toBe(e0)
  })

  it('la prioridad propagada sobrevive a upsertTicket; la marca se conserva tras revertir', async () => {
    await cliente(); await cliente('cli-2'); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low'); await ticket('t2', 2, 'cli-2', 'Low')
    const zoho = (id: string, n: string, priority: string) => ticketRowFromZoho({ id, ticketNumber: n, subject: 'Top 5', status: 'Ingresado', statusType: 'Open', priority, customFields: {} })
    await marcar(app, 'High')
    await upsertTicket(db, zoho('t1', '1', 'Low')); await upsertTicket(db, zoho('t2', '2', 'Medium'))
    expect(await prio('t1')).toBe('High')
    expect(await prio('t2')).toBe('Medium')
    await desmarcar(app)
    expect(await prio('t1')).toBe('Low')
    expect((await fila('t1')).prioridad_en_app_at).not.toBeNull()
  })

  it('el ajuste manual (POST) pone prioridad_en_app_at, NO fija managed_by_app y deja origen NULL', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    await db.query("INSERT INTO public.cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ('cli-1', true, 'High', 'seed')")
    const res = await request(app).post('/api/tickets/t1/prioridad').set('Cookie', await admin()).send({ prioridad: 'Medium', motivo: 'Cliente clave' })
    expect(res.status).toBe(200)
    expect(await fila('t1')).toMatchObject({ priority: 'Medium', managed_by_app: false }); expect((await fila('t1')).prioridad_en_app_at).not.toBeNull()
    expect(await trazas()).toMatchObject([{ origen: null }])
  })
})

describe('la respuesta y la escalera del PUT', () => {
  it('devuelve ticketsCambiados (2 de 3) y la fila del cliente', async () => {
    await cliente(); const { app } = appWith()
    await ticket('t1', 1, 'cli-1', 'Low'); await ticket('t2', 2, 'cli-1', 'High'); await ticket('t3', 3, 'cli-1', 'Medium')
    const res = await marcar(app, 'High')
    expect(res.body).toMatchObject({ clientId: 'cli-1', top5: true, prioridad: 'High', ticketsCambiados: 2 })
  })

  it('el cuerpo no dirige la propagación: una lista de tickets o una prioridad por ticket se ignora', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low'); await ticket('t2', 2, 'cli-1', 'Low')
    const res = await fijar(app, 'cli-1', { top5: true, prioridad: 'High', tickets: ['t1'], prioridades: { t2: 'Medium' }, ticketId: 't2' })
    expect(res.status).toBe(200)
    expect([await prio('t1'), await prio('t2')]).toEqual(['High', 'High'])
  })

  it('403 con tickets que propagar: siguen Low y sin traza (posición de la guarda de permiso)', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    expect((await fijar(app, 'cli-1', { top5: true, prioridad: 'High' }, await userCookie(['Comercial'], 'Coordinador Comercial'))).status).toBe(403)
    expect(await prio('t1')).toBe('Low')
    expect(await trazas()).toEqual([])
  })

  it('422 y 404 no propagan ni dejan traza', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low')
    expect((await fijar(app, 'cli-1', { top5: true, prioridad: 'Urgent' })).status).toBe(422)
    expect((await fijar(app, 'no-existe', { top5: true, prioridad: 'High' })).status).toBe(404)
    expect(await prio('t1')).toBe('Low')
    expect(await trazas()).toEqual([])
  })
})

describe('desmarcar a quien nunca fue Top 5 (RQ-TC-36; S-3 del verify)', () => {
  // Caracterización: nace verde. El escenario de la spec no tenía prueba propia; lo más cercano eran la de «la misma prioridad» y la de S-10.
  it('sin fila en cliente_prioridad, top5: false responde 200 y el ticket no cambia ni recibe traza ni marca', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Medium')
    expect((await db.query("SELECT 1 FROM public.cliente_prioridad WHERE client_id = 'cli-1'")).rows).toEqual([])
    expect((await desmarcar(app)).status).toBe(200)
    expect(await prio('t1')).toBe('Medium')
    expect((await fila('t1')).prioridad_en_app_at).toBeNull()
    expect(await trazas()).toEqual([])
  })
})

describe('RQ-TC-56 · una fila Top 5 guardada con Low (remediación del verify, W3; caracterización: nacen verdes)', () => {
  const sembrarLow = () => db.query("INSERT INTO public.cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ('cli-1', true, 'Low', 'seed')")

  it('volver a guardarla con High impone y propaga: el ticket Low pasa a High con traza y los nuevos nacerán High', async () => {
    await cliente(); const { app } = appWith(); await ticket('t1', 1, 'cli-1', 'Low'); await sembrarLow()
    expect(await prio('t1')).toBe('Low')
    expect((await marcar(app, 'High')).status).toBe(200)
    expect(await prio('t1')).toBe('High')
    expect(await trazas()).toMatchObject([{ ticket_id: 't1', de: 'Low', a: 'High', origen: 'top5' }])
  })

  it('un PUT que la desmarca no alcanza a los tickets Low, Urgent ni sin prioridad: conservan su valor y no hay traza', async () => {
    await cliente(); const { app } = appWith()
    await ticket('t-low', 1, 'cli-1', 'Low'); await ticket('t-urg', 2, 'cli-1', 'Urgent'); await ticket('t-nul', 3, 'cli-1', null); await sembrarLow()
    expect((await desmarcar(app)).status).toBe(200)
    expect(await Promise.all(['t-low', 't-urg', 't-nul'].map(prio))).toEqual(['Low', 'Urgent', null])
    expect(await trazas()).toEqual([])
  })
})
