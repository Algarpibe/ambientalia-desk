import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, userCookie } from './testing/appHarness'
import { remisionDePrueba } from './testing/remisionDePrueba'

instalarArnes()

/**
 * F1B-03 (remision-creada-sin-salida), criterio 6: el recorrido por las rutas que el botón ofrece en los tres orígenes de
 * `habilitar_servicio`. Caracterización: nace verde, porque el alta de remisión no lee el estado del ticket (`routes/remision.ts`
 * `POST /api/remisiones`). Sólo afirma los tres orígenes: lo que el alta hace en otros estados es el hueco H-1, fuera de alcance.
 */
const TEXTO_SIN_REMISION = 'No se puede habilitar el servicio: falta una remisión de entrada vigente. Crea la remisión de entrada desde el ticket.'
const ORIGENES = ['OV asignada', 'Ticket creado', 'Remisión creada']

async function recorrer(origen: string, sembrar?: () => Promise<unknown>) {
  const cookie = await userCookie(['Comercial'])
  await db.query("INSERT INTO tickets (id, number, status, managed_by_app, serial) VALUES ('t1', 10000, $1, true, 'S1')", [origen])
  await sembrar?.()
  const { app } = appWith()
  const habilitar = () => request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
    .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-SS-1', Serial: 'S1' } })
  const sinSalida = await habilitar()
  const alta = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-10-04', incluye: [] })
  const estadoTrasAlta = ((await db.query("SELECT status FROM tickets WHERE id = 't1'")).rows[0] as { status: string }).status
  const salida = await habilitar()
  return { sinSalida, alta, estadoTrasAlta, salida }
}

describe('sin entrada vigente, crear la remisión devuelve la salida (RQ-TS-33)', () => {
  it.each(ORIGENES)('desde «%s»: 422 con el texto único, alta 201, el ticket sigue en su origen y habilitar_servicio 200', async (origen) => {
    const r = await recorrer(origen)
    expect(r.sinSalida.status).toBe(422)
    expect(JSON.stringify(r.sinSalida.body)).toContain(TEXTO_SIN_REMISION)
    expect(r.alta.status).toBe(201)
    expect(r.estadoTrasAlta).toBe(origen)
    expect(r.salida.status).toBe(200)
    expect(((await db.query("SELECT status FROM tickets WHERE id = 't1'")).rows[0] as { status: string }).status).toBe('Ingresado')
  })

  // Variante del origen 3: un ticket en `Remisión creada` con una remisión de SALIDA no tiene entrada vigente (`tipo` filtra).
  it('desde «Remisión creada» con sólo una remisión de salida, el mismo recorrido', async () => {
    const r = await recorrer('Remisión creada', () => remisionDePrueba(db, 't1', { tipo: 'salida' }))
    expect(r.sinSalida.status).toBe(422)
    expect(JSON.stringify(r.sinSalida.body)).toContain(TEXTO_SIN_REMISION)
    expect(r.alta.status).toBe(201)
    expect(r.estadoTrasAlta).toBe('Remisión creada')
    expect(r.salida.status).toBe(200)
  })
})
