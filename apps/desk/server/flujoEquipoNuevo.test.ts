import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, transicionPorId } from '@ambientalia/shared'

const transitionsDeServicio = (id: string) => TRANSITIONS.find((t) => t.id === id)!

instalarArnes()

/**
 * GUARDA 3 EN `executeTransition` (F1B-06, RQ-EN-05, RQ-TS-06) — la tercera puerta del motor: la
 * transición pedida tiene que pertenecer al FLUJO del ticket, no sólo estar en `from`. Sin esta
 * guarda, un ticket `Equipo nuevo` podría ejecutar cualquier transición del catálogo de servicio
 * cuyo `from` coincida por nombre de estado, y viceversa.
 *
 * Los seis casos (P1-P6) son los de `design.md` §5 y `tasks.md` Fase 6. P3 es la prueba de POSICIÓN
 * (regla de mutación 1 de `CLAUDE.md`): fija que la guarda de flujo corre ANTES que la de estado.
 */
describe('guarda 3 · flujo aplicable del ticket', () => {
  async function ticket(id: string, number: number, status: string, classification: string | null) {
    await db.query(
      'INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)',
      [id, number, 'Guarda de flujo', status, classification],
    )
  }

  // P1 — ticket Equipo nuevo en Ingresado ejecuta su propia transición: 200, pasa a En Proceso.
  it('P1 · un ticket Equipo nuevo en Ingresado ejecuta Ingreso equipo nuevo y pasa a En Proceso', async () => {
    await ticket('en-1', 91001, 'Ingresado', 'Equipo nuevo')
    const cookie = await adminCookie()
    const { app } = appWith()
    const t = transicionPorId('ingreso_equipo_nuevo')!
    const res = await request(app).post('/api/tickets/en-1/transition').set('Cookie', cookie)
      .send({ transitionId: t.id, values: valoresValidos(t, 1) })
    expect(res.status).toBe(200)
    const fila = await db.query('SELECT status FROM tickets WHERE id = $1', ['en-1'])
    expect((fila.rows[0] as { status: string }).status).toBe('En Proceso')
  })

  // P2 — el mismo ticket, ya en Ingresado, intenta una transición de SERVICIO con el mismo origen.
  it('P2 · un ticket Equipo nuevo en Ingresado no puede ejecutar Ingreso a Servicio: 409 nombrando los dos flujos', async () => {
    await ticket('en-2', 91002, 'Ingresado', 'Equipo nuevo')
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/en-2/transition').set('Cookie', cookie)
      .send({ transitionId: 'ingreso_a_servicio', values: { comment: 'x' } })
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('equipo nuevo')
    expect(res.body.error).toContain('servicio técnico')
  })

  // P3 — POSICIÓN (regla de mutación 1): ticket de servicio, en un estado ausente del catálogo EN,
  // ejecuta una transición del catálogo EN cuyo `from` no incluye su estado. Debe ganar el mensaje de
  // FLUJO, no el de «no aplica desde el estado» — la guarda 3 corre antes que la guarda de estado.
  it('P3 · posición — la guarda de flujo gana a la de estado', async () => {
    await ticket('sv-3', 91003, 'Rev./Diagnostico', null)
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/sv-3/transition').set('Cookie', cookie)
      .send({ transitionId: 'ingreso_equipo_nuevo', values: { comment: 'x' } })
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('equipo nuevo')
    expect(res.body.error).not.toContain('no aplica desde el estado')
  })

  // P4 — la entrada compartida: habilitar_servicio funciona igual para Equipo nuevo.
  it('P4 · habilitar_servicio lleva a un ticket Equipo nuevo de Ticket creado a Ingresado', async () => {
    await ticket('en-4', 91004, 'Ticket creado', 'Equipo nuevo')
    const cookie = await adminCookie()
    const { app } = appWith()
    const t = transitionsDeServicio('habilitar_servicio')
    const res = await request(app).post('/api/tickets/en-4/transition').set('Cookie', cookie)
      .send({ transitionId: t.id, values: valoresValidos(t, 4) })
    expect(res.status).toBe(200)
    const fila = await db.query('SELECT status FROM tickets WHERE id = $1', ['en-4'])
    expect((fila.rows[0] as { status: string }).status).toBe('Ingresado')
  })

  // P5 — heredado (s5): ticket Equipo nuevo en un estado sólo de servicio sigue viendo/ejecutando las
  // transiciones de TRANSITIONS desde ese estado, sin 409 de flujo.
  it('P5 · un ticket Equipo nuevo heredado en Rev./Diagnostico sigue el flujo de servicio', async () => {
    await ticket('en-5', 91005, 'Rev./Diagnostico', 'Equipo nuevo')
    const cookie = await adminCookie()
    const { app } = appWith()
    const t = transitionsDeServicio('escalado_a_revision')
    const res = await request(app).post('/api/tickets/en-5/transition').set('Cookie', cookie)
      .send({ transitionId: t.id, values: valoresValidos(t, 5) })
    expect(res.status).toBe(200)
    const fila = await db.query('SELECT status FROM tickets WHERE id = $1', ['en-5'])
    expect((fila.rows[0] as { status: string }).status).toBe('Notificado')
  })

  // P6 — área: usuario de Comercial no puede ejecutar ninguna de las cinco transiciones EN.
  it('P6 · un usuario de Comercial no puede ejecutar ninguna transición de Equipo nuevo', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app } = appWith()
    let n = 0
    // D5 de `design.md`: se recorren TODOS los `from`, no sólo `t.from[0]` — 7 ejecuciones (F1A-03),
    // porque `liberacion` gana un segundo origen (`Verificación`).
    for (const t of TRANSITIONS_EQUIPO_NUEVO) {
      for (const origen of t.from) {
        n += 1
        const id = `en-p6-${n}`
        await ticket(id, 91100 + n, origen, 'Equipo nuevo')
        const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
          .send({ transitionId: t.id, values: valoresValidos(t, n) })
        expect(res.status, `${t.id} desde ${origen} debería responder 403 a Comercial`).toBe(403)
      }
    }
    expect(n, 'ejecuciones de P6').toBe(7)
  })

  // P7 — las dos salidas de Verificación (F1A-03, E1+E2): Liberación hacia Finalizado y Rechazo de
  // verificación hacia Notificado, cada una por separado, con un ticket Equipo nuevo sembrado ahí.
  it('P7 · un ticket Equipo nuevo en Verificación tiene sus dos salidas: Liberación y Rechazo de verificación', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()

    await ticket('en-p7-lib', 91201, 'Verificación', 'Equipo nuevo')
    const tLib = transicionPorId('liberacion')!
    const resLib = await request(app).post('/api/tickets/en-p7-lib/transition').set('Cookie', cookie)
      .send({ transitionId: tLib.id, values: valoresValidos(tLib, 1) })
    expect(resLib.status).toBe(200)
    const filaLib = await db.query('SELECT status FROM tickets WHERE id = $1', ['en-p7-lib'])
    expect((filaLib.rows[0] as { status: string }).status).toBe('Finalizado')

    await ticket('en-p7-rec', 91202, 'Verificación', 'Equipo nuevo')
    const tRec = transicionPorId('rechazo_verificacion')!
    const resRec = await request(app).post('/api/tickets/en-p7-rec/transition').set('Cookie', cookie)
      .send({ transitionId: tRec.id, values: valoresValidos(tRec, 2) })
    expect(resRec.status).toBe(200)
    const filaRec = await db.query('SELECT status FROM tickets WHERE id = $1', ['en-p7-rec'])
    expect((filaRec.rows[0] as { status: string }).status).toBe('Notificado')
  })
})
