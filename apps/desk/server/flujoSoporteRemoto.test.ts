import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { db, instalarArnes, equipoRow, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'
import { CATALOGO_POR_FLUJO, TRANSITIONS_SOPORTE_REMOTO, transicionPorId } from '@ambientalia/shared'

instalarArnes()

const SERVICIO = ['Servicio Técnico']
const COMERCIAL = ['Comercial']
const todas = Object.values(CATALOGO_POR_FLUJO).flat()

/**
 * SOPORTE REMOTO en el servidor (F1B-06, cambio 2 · `blueprint-soporte-remoto`, lote 2). Molde:
 * `flujoEquipoNuevo.test.ts`. Serie P = ejecución (guarda 3, estado, área), serie A = alta
 * (`POST /api/tickets`: nacimiento, `modalidad` y la POSICIÓN de su guarda), serie R = `modalidad` es de
 * sólo lectura tras el alta: cada vía del servidor que escribe campos de un ticket, con su prueba.
 */
async function ticket(id: string, number: number, status: string, classification: string | null, modalidad: string | null = null) {
  await db.query(
    'INSERT INTO tickets (id, number, subject, status, classification, modalidad) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, number, 'Soporte', status, classification, modalidad],
  )
}
const fila = async (id: string) => (await db.query('SELECT status, modalidad FROM tickets WHERE id = $1', [id])).rows[0] as { status: string; modalidad: string | null }
const ejecutar = (app: ReturnType<typeof appWith>['app'], cookie: string, id: string, transitionId: string, n: number, extra: Record<string, unknown> = {}) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
    .send({ transitionId, values: { ...valoresValidos(transicionPorId(transitionId)!, n), ...extra } })

describe('serie P · ejecución del flujo de soporte remoto (guarda 3, estado y área)', () => {
  it('P1 · SR en Solicitud Soporte, usuario de Servicio Técnico, asignacion_soporte → 200 y En Proceso', async () => {
    await ticket('sr-1', 92001, 'Solicitud Soporte', 'Soporte remoto')
    const { app } = appWith()
    const res = await ejecutar(app, await userCookie(SERVICIO), 'sr-1', 'asignacion_soporte', 1)
    expect(res.status).toBe(200)
    expect((await fila('sr-1')).status).toBe('En Proceso')
  })

  it('P2 · un usuario sólo de Comercial recibe 403 en las cuatro transiciones, desde su estado de origen', async () => {
    const cookie = await userCookie(COMERCIAL)
    const { app } = appWith()
    let n = 0
    for (const t of TRANSITIONS_SOPORTE_REMOTO) {
      n += 1
      await ticket(`sr-p2-${n}`, 92100 + n, t.from[0], 'Soporte remoto')
      const res = await ejecutar(app, cookie, `sr-p2-${n}`, t.id, n)
      expect(res.status, `${t.id} desde ${t.from[0]} debería responder 403 a Comercial`).toBe(403)
    }
    expect(n, 'transiciones recorridas').toBe(4)
  })

  it('P3 · soporte_pendiente y luego continuacion_soporte → 200 y 200: Pendiente y de vuelta a En Proceso', async () => {
    await ticket('sr-3', 92003, 'En Proceso', 'Soporte remoto')
    const cookie = await userCookie(SERVICIO)
    const { app } = appWith()
    expect((await ejecutar(app, cookie, 'sr-3', 'soporte_pendiente', 3)).status).toBe(200)
    expect((await fila('sr-3')).status).toBe('Pendiente')
    expect((await ejecutar(app, cookie, 'sr-3', 'continuacion_soporte', 3)).status).toBe(200)
    expect((await fila('sr-3')).status).toBe('En Proceso')
  })

  it('P4 · ejecutar_soporte lleva a Finalizado, y una segunda ejecución no procede (409 por estado)', async () => {
    await ticket('sr-4', 92004, 'En Proceso', 'Soporte remoto')
    const cookie = await userCookie(SERVICIO)
    const { app } = appWith()
    expect((await ejecutar(app, cookie, 'sr-4', 'ejecutar_soporte', 4)).status).toBe(200)
    expect((await fila('sr-4')).status).toBe('Finalizado')
    const otra = await ejecutar(app, cookie, 'sr-4', 'ejecutar_soporte', 4)
    expect(otra.status).toBe(409)
    expect(otra.body.error).toContain('no aplica desde el estado')
  })

  it('P5 · diagnostico_complementario (de servicio) sobre un SR en En Proceso → 409 que nombra «soporte remoto»', async () => {
    await ticket('sr-5', 92005, 'En Proceso', 'Soporte remoto')
    const { app } = appWith()
    const res = await ejecutar(app, await userCookie(SERVICIO), 'sr-5', 'diagnostico_complementario', 5)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('soporte remoto')
    expect((await fila('sr-5')).status).toBe('En Proceso')
  })

  // P6 — POSICIÓN (M4, regla de mutación 1): la guarda de flujo (:125) corre ANTES que la de estado (:126-128).
  it('P6 · posición — servicio en Rev./Diagnostico + asignacion_soporte → 409 de FLUJO, no «no aplica desde el estado»', async () => {
    await ticket('sv-6', 92006, 'Rev./Diagnostico', null)
    const { app } = appWith()
    const res = await ejecutar(app, await userCookie(SERVICIO), 'sv-6', 'asignacion_soporte', 6)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('soporte remoto')
    expect(res.body.error).not.toContain('no aplica desde el estado')
  })

  it('P7 · un SR heredado en Rev./Diagnostico ejecuta una transición de TRANSITIONS → 200', async () => {
    await ticket('sr-7', 92007, 'Rev./Diagnostico', 'Soporte remoto')
    const { app } = appWith()
    const res = await ejecutar(app, await adminCookie(), 'sr-7', 'escalado_a_revision', 7)
    expect(res.status).toBe(200)
    expect((await fila('sr-7')).status).toBe('Notificado')
  })

  it('P8 · un SR en Solicitud Soporte, con Servicio Técnico: de TODAS las transiciones de los tres catálogos sólo asignacion_soporte da 200', async () => {
    const cookie = await userCookie(SERVICIO)
    const { app } = appWith()
    const ok: string[] = []
    let n = 0
    for (const t of todas) {
      n += 1
      await ticket(`sr-p8-${n}`, 92200 + n, 'Solicitud Soporte', 'Soporte remoto')
      const res = await ejecutar(app, cookie, `sr-p8-${n}`, t.id, n)
      if (res.status === 200) ok.push(t.id)
      else expect(res.status, `${t.id} desde Solicitud Soporte`).toBe(409)
    }
    expect(n, 'transiciones recorridas (31 + 6 + 4 = 41)').toBe(41)
    expect(ok).toEqual(['asignacion_soporte'])
  }, 60_000)

  // P9 — RQ-SR-10: `modalidad` no es campo de ninguna transición.
  it('P9 · ejecutar_soporte con values.modalidad «en sitio» sobre un SR con «remoto» → 200 y la fila conserva «remoto»', async () => {
    await ticket('sr-9', 92009, 'En Proceso', 'Soporte remoto', 'remoto')
    const { app } = appWith()
    const res = await ejecutar(app, await userCookie(SERVICIO), 'sr-9', 'ejecutar_soporte', 9, { modalidad: 'en sitio' })
    expect(res.status).toBe(200)
    expect(await fila('sr-9')).toEqual({ status: 'Finalizado', modalidad: 'remoto' })
  })
})

describe('serie A · alta de soporte remoto y guarda de modalidad (escalón C)', () => {
  const sembrar = async () => {
    await upsertEquipo(db, equipoRow('eq-sr', '18A20070'))
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli-sr','Gecelca S.A. E.S.P.')")
  }
  const CUERPO = { clientId: 'cli-sr', equipoId: 'eq-sr', tipoServicio: 'Soporte', clasificaciones: 'Soporte remoto', prefijo: 'CG', prioridad: 'Media' }
  let galleta: string | undefined // un solo usuario por prueba: `adminCookie()` inserta uno con correo único
  beforeEach(() => { galleta = undefined })
  const alta = async (extra: Record<string, unknown>) => {
    const { app } = appWith()
    galleta ??= await adminCookie()
    return request(app).post('/api/tickets').set('Cookie', galleta).send({ ...CUERPO, ...extra })
  }
  const cuenta = async (tabla: string) => (await db.query(`SELECT COUNT(*)::int AS n FROM ${tabla}`)).rows[0].n as number
  const foto = async (id: string) => (await db.query('SELECT to_status, transition_id FROM ticket_transitions WHERE ticket_id = $1', [id])).rows

  it('A1 · SR + equipo + «en sitio» → 201: nace en Solicitud Soporte, con modalidad, y la foto #1 dice lo mismo', async () => {
    await sembrar()
    const res = await alta({ modalidad: 'en sitio' })
    expect(res.status).toBe(201)
    expect(await fila(res.body.id)).toEqual({ status: 'Solicitud Soporte', modalidad: 'en sitio' })
    expect(await foto(res.body.id)).toEqual([{ to_status: 'Solicitud Soporte', transition_id: 'enviar' }])
  })

  it('A2 · SR sin modalidad → 201 y «remoto» por defecto', async () => {
    await sembrar()
    const res = await alta({})
    expect(res.status).toBe(201)
    expect(await fila(res.body.id)).toEqual({ status: 'Solicitud Soporte', modalidad: 'remoto' })
  })

  it.each([['presencial'], [''], ['Remoto'], [null]])('A3 · SR con modalidad %j → 422 que nombra modalidad, sin ticket, sin foto y sin equipo nuevo', async (valor) => {
    await sembrar()
    const res = await alta({ modalidad: valor })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('modalidad')
    expect([await cuenta('tickets'), await cuenta('ticket_transitions'), await cuenta('equipos')]).toEqual([0, 0, 1])
  })

  // Regresión del nacimiento (requisito 1 de supervisión): las otras dos clasificaciones nacen como hoy.
  it('A4 · mantenimiento y Equipo nuevo sin modalidad → 201, modalidad NULL y nacen en Ticket creado (fila y foto)', async () => {
    await sembrar()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m1','Grimm')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t1','Monitor')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo1','m1','EDM180C','t1')")
    const mant = await alta({ clasificaciones: 'Equipo para servicio de mantenimiento' })
    const nuevo = await alta({ clasificaciones: 'Equipo nuevo', equipoId: undefined, equipoNuevo: { serial: 'SN-SR-1', modeloId: 'mo1', fechaFacturaCompra: '2026-01-15' } })
    for (const res of [mant, nuevo]) {
      expect(res.status).toBe(201)
      expect(await fila(res.body.id)).toEqual({ status: 'Ticket creado', modalidad: null })
      expect(await foto(res.body.id)).toEqual([{ to_status: 'Ticket creado', transition_id: 'enviar' }])
    }
  })

  it('A5 · Equipo nuevo con modalidad «remoto» y mantenimiento con «en sitio» → 422 (RQ-SR-09), sin escribir nada', async () => {
    await sembrar()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m1','Grimm')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t1','Monitor')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo1','m1','EDM180C','t1')")
    const nuevo = await alta({ clasificaciones: 'Equipo nuevo', equipoId: undefined, modalidad: 'remoto', equipoNuevo: { serial: 'SN-SR-2', modeloId: 'mo1', fechaFacturaCompra: '2026-01-15' } })
    const mant = await alta({ clasificaciones: 'Equipo para servicio de mantenimiento', modalidad: 'en sitio' })
    for (const res of [nuevo, mant]) {
      expect(res.status).toBe(422)
      expect(res.body.error).toContain('modalidad')
    }
    expect([await cuenta('tickets'), await cuenta('equipos')]).toEqual([0, 1])
  })

  it('A6 · SR sin equipoId → 422 «Falta el equipo» y cero filas', async () => {
    await sembrar()
    const res = await alta({ equipoId: undefined })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Falta el equipo')
    expect([await cuenta('tickets'), await cuenta('ticket_transitions')]).toEqual([0, 0])
  })

  // POSICIONES (regla de mutación 1): cada caso activa la guarda de modalidad Y la vecina a la vez; el control
  // demuestra que la vecina estaba activa (con la modalidad válida, GANA ella).
  it('A7 · posición M3 — SR + modalidad inválida + OV ya asociada a otro ticket → 422 de modalidad, NO el 409 (D)', async () => {
    await sembrar()
    await ticket('t-dueno', 92301, 'Ingresado', null); await db.query("UPDATE tickets SET orden_venta = 'OV-2026-100-01' WHERE id = 't-dueno'")
    const res = await alta({ ordenVenta: 'OV-2026-100-01', modalidad: 'presencial' })
    expect(res.status, 'modalidad (C) precede a la unicidad (D)').toBe(422)
    expect(res.body.error).toContain('modalidad')
    const control = await alta({ ordenVenta: 'OV-2026-100-01', modalidad: 'remoto' })
    expect(control.status, 'control: con modalidad válida la OV ya usada sí responde 409').toBe(409)
  })

  it('A8 · posición M2 — SR + modalidad inválida + OV en cuarentena (OV-2026-170-X9) → 422 de modalidad, no el de la cuarentena', async () => {
    await sembrar()
    const res = await alta({ ordenVenta: 'OV-2026-170-X9', modalidad: 'presencial' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('modalidad')
    expect(res.body.error).not.toContain('OV-2026-170-X9')
    const control = await alta({ ordenVenta: 'OV-2026-170-X9', modalidad: 'remoto' })
    expect(control.status).toBe(422)
    expect(control.body.error, 'control: con modalidad válida contesta la cuarentena').toContain('OV-2026-170-X9')
  })

  it('A9 · posición M1 — Equipo nuevo + fecha opcional inválida + modalidad «remoto» → 422 del equipo nuevo (F1B-02), no el de modalidad', async () => {
    await sembrar()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m1','Grimm')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t1','Monitor')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo1','m1','EDM180C','t1')")
    const nuevoEn = (fechaAdquisicion: string) => ({ clasificaciones: 'Equipo nuevo', equipoId: undefined, modalidad: 'remoto', equipoNuevo: { serial: 'SN-SR-9', modeloId: 'mo1', fechaFacturaCompra: '2026-01-15', fechaAdquisicion } })
    const res = await alta(nuevoEn('no-es-fecha'))
    expect(res.status).toBe(422)
    expect(res.body.error).not.toContain('modalidad')
    const control = await alta(nuevoEn('2026-01-16'))
    expect(control.status).toBe(422)
    expect(control.body.error, 'control: con los opcionales válidos contesta modalidad').toContain('modalidad')
  })

  it('A10 · GET de la ficha trae modalidad («en sitio») y null cuando el ticket no la tiene', async () => {
    await ticket('sr-a10', 92310, 'Solicitud Soporte', 'Soporte remoto', 'en sitio'); await ticket('sv-a10', 92311, 'Ticket creado', null)
    const { app } = appWith()
    const cookie = await adminCookie()
    expect((await request(app).get('/api/tickets/sr-a10').set('Cookie', cookie)).body.modalidad).toBe('en sitio')
    expect((await request(app).get('/api/tickets/sv-a10').set('Cookie', cookie)).body.modalidad).toBeNull()
  })
})

/**
 * serie R · `modalidad` es de SÓLO LECTURA tras el alta, y lo impone el SERVIDOR (regla invariable 13, punto 2).
 * Las vías que escriben campos de `tickets` después del alta (barrido de `UPDATE tickets` en `apps/` y
 * `packages/`): la transición (`applyTransition`, `plan.columns`), la resolución (`PUT …/resolution`), la
 * liberación de una OV (`PUT /api/ov-asociaciones/:id/liberar`), la remisión de entrada (`POST /api/remisiones`)
 * y el sincronizador (`repo.test.ts`, «no pisa»). Cada una recibe `modalidad` en el cuerpo y no la cambia.
 */
describe('serie R · ninguna vía del servidor cambia modalidad después del alta', () => {
  const modalidadDe = async (id: string) => (await fila(id)).modalidad

  it('R1 · las cuatro transiciones de soporte remoto ignoran modalidad en values y en la raíz del cuerpo', async () => {
    const cookie = await userCookie(SERVICIO)
    const { app } = appWith()
    let n = 0
    for (const t of TRANSITIONS_SOPORTE_REMOTO) {
      n += 1
      await ticket(`sr-r1-${n}`, 92400 + n, t.from[0], 'Soporte remoto', 'remoto')
      const res = await request(app).post(`/api/tickets/sr-r1-${n}/transition`).set('Cookie', cookie)
        .send({ transitionId: t.id, modalidad: 'en sitio', values: { ...valoresValidos(t, n), modalidad: 'en sitio' } })
      expect(res.status, t.id).toBe(200)
      expect(await modalidadDe(`sr-r1-${n}`), `${t.id} no debe cambiar la modalidad`).toBe('remoto')
    }
    expect(n).toBe(4)
  })

  it('R2 · PUT /api/tickets/:id/resolution con modalidad en el cuerpo la ignora', async () => {
    await ticket('sr-r2', 92402, 'En Proceso', 'Soporte remoto', 'remoto')
    const { app } = appWith()
    const res = await request(app).put('/api/tickets/sr-r2/resolution').set('Cookie', await adminCookie()).send({ html: '<p>listo</p>', modalidad: 'en sitio' })
    expect(res.status).toBe(200)
    expect((await db.query('SELECT resolution_html FROM tickets WHERE id = $1', ['sr-r2'])).rows[0].resolution_html).toContain('listo')
    expect(await modalidadDe('sr-r2')).toBe('remoto')
  })

  it('R3 · PUT /api/ov-asociaciones/:id/liberar con modalidad en el cuerpo la ignora (y la liberación sí ocurre)', async () => {
    await ticket('sr-r3', 92403, 'En Proceso', 'Soporte remoto', 'remoto')
    await db.query("UPDATE tickets SET orden_venta = 'OV-2026-100-03' WHERE id = 'sr-r3'")
    await db.query("INSERT INTO ov_asociaciones (ticket_id, numero, salesorder_id, origen) VALUES ('sr-r3', 'OV-2026-100-03', 'so-r3', 'alta')")
    const idAsoc = (await db.query("SELECT id FROM ov_asociaciones WHERE ticket_id = 'sr-r3'")).rows[0].id
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${idAsoc}/liberar`).set('Cookie', await adminCookie()).send({ motivo: 'se libera', modalidad: 'en sitio' })
    expect(res.status).toBe(200)
    expect((await db.query('SELECT orden_venta FROM tickets WHERE id = $1', ['sr-r3'])).rows[0].orden_venta).toBeNull()
    expect(await modalidadDe('sr-r3')).toBe('remoto')
  })

  it('R4 · POST /api/remisiones (su UPDATE de tickets al fijar la OV) con modalidad en el cuerpo no la cambia', async () => {
    await upsertEquipo(db, equipoRow('eq-r4', '18A20070'))
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli-r4','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,raw) VALUES ('so-r4','OV-2026-300','cli-r4','2026-07-15','{\"order_status\":\"open\"}')")
    await db.query("INSERT INTO tickets (id, number, status, classification, managed_by_app, client_id, tipo_servicio, equipo_id, modalidad) VALUES ('sr-r4', 92404, 'Solicitud Soporte', 'Soporte remoto', true, 'cli-r4', 'Soporte', 'eq-r4', 'remoto')")
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', await adminCookie())
      .send({ ticketId: 'sr-r4', fecha: '2026-08-03', incluye: [], salesOrderId: 'so-r4', modalidad: 'en sitio' })
    expect(res.status).toBe(201)
    expect((await db.query('SELECT orden_venta FROM tickets WHERE id = $1', ['sr-r4'])).rows[0].orden_venta, 'el UPDATE sí corrió').toBe('OV-2026-300')
    expect(await modalidadDe('sr-r4')).toBe('remoto')
  })
})
