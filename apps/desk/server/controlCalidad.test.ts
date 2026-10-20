import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { transicionPorId } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * CONTROL DE CALIDAD ANTES DE LIBERAR (F1C-07), contra el servidor. Primera parte (lote 2a): el interruptor
 * `CONTROL_CALIDAD_LIBERACION` y la traza `performed_by_id`. La firma (2b) y la prioridad, el aviso y la ruta (2c) llegan
 * con sus lotes.
 *
 * Con el interruptor cerrado el servicio se finaliza como hoy (`finalizacion_servicio`) y el envío da 409; abierto, al revés.
 * El 409 va en `ticketService.ts:128`, DETRÁS del 409 de estado y DELANTE del 403 de área (regla de mutación 1: CC-1 y CC-2
 * activan las dos guardas a la vez).
 */
const ENVIO = 'envio_control_calidad'
const FINALIZACION = 'finalizacion_servicio'
const encendido = () => appWith({ controlCalidadLiberacion: true })
const apagado = () => appWith({ controlCalidadLiberacion: false })

async function ticket(id: string, status: string, number = 9200) {
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [id, number, 'Control de calidad', status])
}
const ejecutar = (app: ReturnType<typeof appWith>['app'], cookie: string, id: string, transitionId: string) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values: valoresValidos(transicionPorId(transitionId)!, 1) })
const estadoDe = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status

describe('apagado (RQ-PM-32): todo como hoy', () => {
  it('CARACTERIZACIÓN · finalizacion_servicio pasa a Por Facturar', async () => {
    await ticket('a1', 'En Proceso')
    const res = await ejecutar(apagado().app, await adminCookie(), 'a1', FINALIZACION)
    expect(res.status).toBe(200)
    expect(await estadoDe('a1')).toBe('Por Facturar')
  })

  it('RQ-TS-47 · apagado, el envío da 409 y el ticket no se mueve', async () => {
    await ticket('a2', 'En Proceso')
    const res = await ejecutar(apagado().app, await adminCookie(), 'a2', ENVIO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('apagado')
    expect(await estadoDe('a2')).toBe('En Proceso')
    expect((await db.query('SELECT 1 FROM ticket_transitions WHERE ticket_id=$1', ['a2'])).rows).toHaveLength(0)
  })
})

describe('encendido (RQ-TS-47)', () => {
  it('el envío pasa a Control de calidad', async () => {
    await ticket('e1', 'En Proceso')
    const res = await ejecutar(encendido().app, await adminCookie(), 'e1', ENVIO)
    expect(res.status).toBe(200)
    expect(await estadoDe('e1')).toBe('Control de calidad')
  })

  it('finalizacion_servicio da 409 y el ticket no se mueve', async () => {
    await ticket('e2', 'En Proceso')
    const res = await ejecutar(encendido().app, await adminCookie(), 'e2', FINALIZACION)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('control de calidad')
    expect(await estadoDe('e2')).toBe('En Proceso')
  })
})

describe('posición del 409 del interruptor (reglas de mutación 1)', () => {
  it('CC-1 · estado equivocado Y interruptor apagado: contesta el 409 de estado', async () => {
    await ticket('p1', 'Ingresado')
    const res = await ejecutar(apagado().app, await adminCookie(), 'p1', ENVIO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('no aplica desde')
  })

  it('CC-2 · sin área de Servicio Técnico Y interruptor apagado: contesta el 409, no el 403', async () => {
    await ticket('p2', 'En Proceso')
    const res = await ejecutar(apagado().app, await userCookie(['Comercial']), 'p2', ENVIO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('apagado')
  })

  it('control · encendido, sin el área sigue siendo 403', async () => {
    await ticket('p3', 'En Proceso')
    const res = await ejecutar(encendido().app, await userCookie(['Comercial']), 'p3', ENVIO)
    expect(res.status).toBe(403)
  })
})

describe('traza performed_by_id (RQ-PM-34)', () => {
  it('el envío guarda el id de quien lo ejecuta', async () => {
    await ticket('t1', 'En Proceso')
    const res = await ejecutar(encendido().app, await adminCookie(), 't1', ENVIO)
    expect(res.status).toBe(200)
    const u = (await db.query('SELECT id FROM users WHERE email=$1', ['admin@x.co'])).rows[0] as { id: string }
    const f = (await db.query('SELECT performed_by_id FROM ticket_transitions WHERE ticket_id=$1', ['t1'])).rows[0] as { performed_by_id: string | null }
    expect(f.performed_by_id).toBe(u.id)
  })
})
