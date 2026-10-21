import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { transicionPorId } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * SALIDAS DE LAS ESPERAS (F1C-03), contra el servidor. Lote I3a: sólo el interruptor `SALIDAS_ESPERAS` (RQ-TS-61, RQ-TS-64 SE-0 y SE-1).
 * La guarda va en `ticketService.ts:128`, junto a la de control de calidad: escalón B, `409`, tras el estado y ANTES del área.
 * La regla del ejecutor (persona a cargo / respaldo, RQ-PM-42..45) y el motivo del respaldo son del lote I4.
 * Cada prueba de posición activa DOS guardas a la vez (regla de mutación 1).
 */
const COBRO = 'cobro_diagnostico_espera'
const SIN_PIEZA = 'sin_pieza_en_almacen'
const encendido = () => appWith({ salidasEsperas: true }).app
const apagado = () => appWith({ salidasEsperas: false }).app

let numero = 9700
async function ticket(id: string, status: string) {
  numero += 1
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [id, numero, 'Espera', status])
}
const ejecutar = (app: ReturnType<typeof encendido>, cookie: string, id: string, transitionId: string) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values: valoresValidos(transicionPorId(transitionId)!, 1) })
const estadoDe = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status
const trazas = async (id: string) => (await db.query('SELECT * FROM ticket_transitions WHERE ticket_id=$1 ORDER BY id', [id])).rows as Array<Record<string, unknown>>

describe('interruptor (RQ-TS-61): apagado, las dos dan 409 y no escriben', () => {
  it('apagado, el cobro desde Servicio externo da 409 de interruptor, distinto del de estado, y el ticket no se mueve', async () => {
    await ticket('a1', 'Servicio externo')
    const res = await ejecutar(apagado(), await adminCookie(), 'a1', COBRO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('SALIDAS_ESPERAS')
    expect(res.body.error).not.toContain('no aplica desde')
    expect(await estadoDe('a1')).toBe('Servicio externo')
    expect(await trazas('a1')).toHaveLength(0)
  })

  it('apagado, sin_pieza_en_almacen desde Solicitado da 409 y el ticket no se mueve', async () => {
    await ticket('a2', 'Solicitado')
    const res = await ejecutar(apagado(), await adminCookie(), 'a2', SIN_PIEZA)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('SALIDAS_ESPERAS')
    expect(await estadoDe('a2')).toBe('Solicitado')
    expect(await trazas('a2')).toHaveLength(0)
  })

  it('CARACTERIZACIÓN · apagado, anulacion desde En Espera de Repuestos sigue la regla de hoy', async () => {
    await ticket('a3', 'En Espera de Repuestos')
    const res = await request(apagado()).post('/api/tickets/a3/transition').set('Cookie', await adminCookie())
      .send({ transitionId: 'anulacion', values: valoresValidos(transicionPorId('anulacion')!, 1) })
    expect(res.status).toBe(200)
    expect(await estadoDe('a3')).toBe('Anulado')
  })
})

describe('encendido: pasan por la guarda de área como hoy (RQ-TS-61)', () => {
  it('el administrador ejecuta el cobro desde En Espera de Repuestos: Por Facturar y una fila de traza', async () => {
    await ticket('e1', 'En Espera de Repuestos')
    const res = await ejecutar(encendido(), await adminCookie(), 'e1', COBRO)
    expect(res.status).toBe(200)
    expect(await estadoDe('e1')).toBe('Por Facturar')
    expect(await trazas('e1')).toHaveLength(1)
  })

  it('el administrador ejecuta sin_pieza_en_almacen desde Solicitado: En Espera de Repuestos y una fila de traza', async () => {
    await ticket('e2', 'Solicitado')
    const res = await ejecutar(encendido(), await adminCookie(), 'e2', SIN_PIEZA)
    expect(res.status).toBe(200)
    expect(await estadoDe('e2')).toBe('En Espera de Repuestos')
    expect(await trazas('e2')).toHaveLength(1)
  })

  it('encendido, quien no es del área sigue recibiendo el 403 de área', async () => {
    await ticket('e3', 'Servicio externo')
    const res = await ejecutar(encendido(), await userCookie(['Servicio Técnico']), 'e3', COBRO)
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Comercial')
    expect(await estadoDe('e3')).toBe('Servicio externo')
  })
})

describe('posición de las guardas (RQ-TS-64, regla de mutación 1)', () => {
  it('SE-0 · estado < interruptor: apagado y el cobro desde Solicitado → el 409 de estado, no el del interruptor', async () => {
    await ticket('p1', 'Solicitado')
    const res = await ejecutar(apagado(), await adminCookie(), 'p1', COBRO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('no aplica desde')
    expect(res.body.error).not.toContain('SALIDAS_ESPERAS')
  })

  it('SE-1 · interruptor < área: apagado y un usuario sin Comercial → 409 del interruptor, no el 403 de área', async () => {
    await ticket('p2', 'Servicio externo')
    const res = await ejecutar(apagado(), await userCookie(['Servicio Técnico']), 'p2', COBRO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('SALIDAS_ESPERAS')
  })
})
