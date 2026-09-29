import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { asociarOV, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { STATUS_TICKET_CREADO } from '@ambientalia/shared'; import { searchSalesOrders } from '@ambientalia/zoho-sync/books/repo'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()

/**
 * API de `ov_asociaciones` (asociacion-ov-ticket, lote 5; `tickets-core` RQ-TC-19 y RQ-TC-20).
 *
 * Escalera de precedencia de liberar (F1B-10): A `404` inexistente < B `403` sin Comercial / `409` ya liberada
 * < C `422` motivo vacío. Las lecturas las puede pedir cualquier usuario con sesión (supuesto reversible:
 * leer no decide nada y la ficha la ve también Servicio Técnico).
 */
const asociar = (ticketId: string, numero: string) =>
  asociarOV(db, { ticketId, numero, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
const fila = async (id: number) => (await db.query('SELECT * FROM ov_asociaciones WHERE id = $1', [id])).rows[0]
const cuantas = async () => Number((await db.query('SELECT count(*) AS n FROM ov_asociaciones')).rows[0].n)

// Cada rol es una fila: [nombre, cookie (null = sin sesión), estado esperado al liberar, estado esperado al leer].
type Rol = [string, (() => Promise<string>) | null, number, number]
const ROLES: Rol[] = [
  ['sin sesión', null, 401, 401],
  ['Servicio Técnico', () => userCookie(['Servicio Técnico']), 403, 200],
  ['Compras sola', () => userCookie(['Compras']), 403, 200],
  ['Comercial', () => userCookie(['Comercial']), 200, 200],
  ['Comercial + Compras', () => userCookie(['Comercial', 'Compras']), 200, 200],
  ['administrador', () => adminCookie(), 200, 200],
]

describe('PUT /api/ov-asociaciones/:id/liberar · matriz por área', () => {
  it.each(ROLES)('%s', async (_n, cookie, esperadoLiberar) => {
    const a = await asociar('t1', 'OV-2026-001')
    const { app } = appWith()
    const rq = request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).send({ motivo: 'error de tecleo' })
    const res = cookie ? await rq.set('Cookie', await cookie()) : await rq
    expect(res.status).toBe(esperadoLiberar)
    if (esperadoLiberar === 200) {
      expect(res.body).toMatchObject({ id: a.id, motivo_liberacion: 'error de tecleo' })
      expect(res.body.liberada_at).toBeTruthy()
    } else {
      const f = await fila(a.id)
      expect(f.liberada_at).toBeNull()
      expect(f.motivo_liberacion).toBeNull()
    }
  })
})

describe.each([
  ['GET /api/tickets/:id/ov-asociaciones', '/api/tickets/t1/ov-asociaciones'],
  ['GET /api/ov-asociaciones/cuarentena', '/api/ov-asociaciones/cuarentena'],
  ['GET /api/ov-asociaciones/saldo/:lote', '/api/ov-asociaciones/saldo/OV-2026-170'],
])('%s · matriz por área', (_n, url) => {
  it.each(ROLES)('%s', async (_r, cookie, _liberar, esperadoLectura) => {
    const { app } = appWith()
    const rq = request(app).get(url)
    const res = cookie ? await rq.set('Cookie', await cookie()) : await rq
    expect(res.status).toBe(esperadoLectura)
  })
})

describe('GET /api/tickets/:id/ov-asociaciones', () => {
  it('devuelve las vigentes y las liberadas, distinguibles por liberada_at', async () => {
    const v = await asociar('t1', 'OV-2026-001')
    const l = await asociar('t1', 'OV-2026-002')
    await liberarAsociacion(db, l.id, 'Comercial', 'duplicada')
    await asociar('t2', 'OV-2026-003')
    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/ov-asociaciones').set('Cookie', await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const por = Object.fromEntries(res.body.map((r: { numero: string }) => [r.numero, r]))
    expect(por['OV-2026-001'].liberada_at).toBeNull()
    expect(por['OV-2026-002'].liberada_at).toBeTruthy()
    expect(por['OV-2026-001'].id).toBe(v.id)
  })
})

describe('PUT /api/ov-asociaciones/:id/liberar · escalera A < B < C', () => {
  it('liberar conserva la fila (el recuento no cambia) y guarda quién y por qué', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    await asociar('t2', 'OV-2026-002')
    const antes = await cuantas()
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Comercial'])).send({ motivo: '  ticket duplicado  ' })
    expect(res.status).toBe(200)
    expect(await cuantas()).toBe(antes)
    expect(await fila(a.id)).toMatchObject({ liberada_por: 'Op', motivo_liberacion: 'ticket duplicado' })
  })

  it('A: inexistente → 404 aunque el usuario no sea Comercial (A antes que B)', async () => {
    const { app } = appWith()
    const res = await request(app).put('/api/ov-asociaciones/9999/liberar').set('Cookie', await userCookie(['Servicio Técnico'])).send({ motivo: '' })
    expect(res.status).toBe(404)
  })

  // Regla de mutación 1: las dos guardas activas a la vez. B (403) antes que C (422).
  it('sin Comercial Y motivo vacío → 403, no 422', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Servicio Técnico'])).send({ motivo: '   ' })
    expect(res.status).toBe(403)
    expect((await fila(a.id)).liberada_at).toBeNull()
  })

  it('ya liberada Y motivo vacío (Comercial) → 409, no 422', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    await liberarAsociacion(db, a.id, 'Comercial', 'primera')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Comercial'])).send({})
    expect(res.status).toBe(409)
    expect((await fila(a.id)).motivo_liberacion).toBe('primera')
  })

  it('sin Comercial Y ya liberada → 403, no 409', async () => {
    const a = await asociar('t1', 'OV-2026-001')
    await liberarAsociacion(db, a.id, 'Comercial', 'primera')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Servicio Técnico'])).send({ motivo: 'x' })
    expect(res.status).toBe(403)
  })

  it.each([[{ motivo: '' }], [{ motivo: '   ' }], [{}], [{ motivo: 7 }]])('C: motivo %j → 422 y la fila no cambia', async (body) => {
    const a = await asociar('t1', 'OV-2026-001')
    const { app } = appWith()
    const res = await request(app).put(`/api/ov-asociaciones/${a.id}/liberar`).set('Cookie', await userCookie(['Comercial'])).send(body)
    expect(res.status).toBe(422)
    expect((await fila(a.id)).liberada_at).toBeNull()
  })
})

describe('GET /api/ov-asociaciones/cuarentena y /saldo/:lote', () => {
  const ov = (id: string, n: string) => db.query(
    "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ($1,$2,'c','Corola','2026-06-01',1,'open',$3)",
    [id, n, JSON.stringify({ order_status: 'open' })])

  it('cuarentena devuelve listarCuarentena', async () => {
    await ov('s1', 'OV-2026-170-01'); await ov('s2', 'OV-2026-170-X9')
    const { app } = appWith()
    const res = await request(app).get('/api/ov-asociaciones/cuarentena').set('Cookie', await userCookie(['Comercial']))
    expect(res.body.map((c: { number: string }) => c.number)).toEqual(['OV-2026-170-X9'])
  })

  it('saldo devuelve saldoPorLote', async () => {
    await ov('s1', 'OV-2026-170-01'); await ov('s2', 'OV-2026-170-02')
    await asociarOV(db, { ticketId: 't1', numero: 'OV-2026-170-01', salesorderId: 's1', origen: 'alta', actor: 't', fechaOrdenCompra: null })
    const { app } = appWith()
    const res = await request(app).get('/api/ov-asociaciones/saldo/OV-2026-170').set('Cookie', await userCookie(['Comercial']))
    expect(res.body).toEqual({ lote: 'OV-2026-170', creadas: 2, consumidas: 1, libres: 1, consumido: 50 })
  })

  it('un lote con formato inválido → 422', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/ov-asociaciones/saldo/OV-2026-170-01').set('Cookie', await userCookie(['Comercial']))
    expect(res.status).toBe(422)
  })
})

/**
 * RQ-TC-19 «Tras liberar, la OV es reasociable» (remediación del verify): liberar limpia las columnas
 * `orden_venta`/`salesorder_id`/`fecha_orden_venta` del ticket, que son la vía que las tres puertas y el
 * buscador leen ADEMÁS de la asociación. Sin limpiarlas la OV seguía «ocupada» por su antiguo ticket.
 */
async function ovLiberada(ticketColumnas = "'OV-2026-300','soX','2026-07-15'"): Promise<void> {
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,status,raw) VALUES ('soX','OV-2026-300','cli1','2026-07-15','open','{\"order_status\":\"open\"}')")
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','18A20070','Grimm','EDM180C','Monitor')")
  await db.query(`INSERT INTO tickets (id,number,subject,status,orden_venta,salesorder_id,fecha_orden_venta) VALUES ('t-lib',8001,'El que libera','Ingresado',${ticketColumnas})`)
  await db.query("INSERT INTO tickets (id,number,subject,status,equipo_id,client_id) VALUES ('t-nuevo',8002,'El que la quiere',$1,'eq-1','cli1')", [STATUS_TICKET_CREADO])
  await asociarOV(db, { ticketId: 't-lib', numero: 'OV-2026-300', salesorderId: 'soX', origen: 'alta', actor: 't', fechaOrdenCompra: null })
}
type AppHttp = ReturnType<typeof appWith>['app']
const liberarPorRuta = async (app: AppHttp) => {
  const id = (await db.query("SELECT id FROM ov_asociaciones WHERE numero = 'OV-2026-300'")).rows[0].id
  return request(app).put(`/api/ov-asociaciones/${id}/liberar`).set('Cookie', await userCookie(['Comercial'])).send({ motivo: 'error de tecleo' })
}

describe('RQ-TC-19 · tras liberar, la OV es reasociable por las tres puertas y el buscador', () => {
  const PUERTAS: [string, (a: AppHttp, c: string) => request.Test, number][] = [
    ['puerta 1 · alta', (a, c) => request(a).post('/api/tickets').set('Cookie', c).send({ equipoId: 'eq-1', salesOrderId: 'soX', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo', prefijo: 'MT' }), 201],
    ['puerta 2 · habilitar_servicio', (a, c) => request(a).post('/api/tickets/t-nuevo/transition').set('Cookie', c).send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-2026-300', Serial: '18A20070' } }), 200],
    ['puerta 3 · remisión de entrada', (a, c) => request(a).post('/api/remisiones').set('Cookie', c).send({ ticketId: 't-nuevo', fecha: '2026-08-03', incluye: [], salesOrderId: 'soX' }), 201],
  ]
  it.each(PUERTAS)('%s', async (_n, puerta, esperado) => {
    await ovLiberada()
    const { app } = appWith()
    expect((await liberarPorRuta(app)).status).toBe(200)
    const res = await puerta(app, await adminCookie())
    expect(res.status, JSON.stringify(res.body)).toBe(esperado)
  })

  it('el buscador soloLibres la vuelve a ofrecer y el ticket liberador queda sin OV y con la marca de fila', async () => {
    await ovLiberada()
    expect((await searchSalesOrders(db, 'OV-2026', null, 20, true)).map((s) => s.id)).toEqual([]) // control: antes de liberar, ocupada...
    expect((await searchSalesOrders(db, 'OV-2026', null, 20, false)).map((s) => s.id)).toEqual(['soX']) // ...y sin soloLibres sí existe
    expect((await liberarPorRuta(appWith().app)).status).toBe(200)
    expect((await searchSalesOrders(db, 'OV-2026', null, 20, true)).map((s) => s.id)).toEqual(['soX'])
    const t = (await db.query("SELECT orden_venta, salesorder_id, fecha_orden_venta, ov_elegida_en_app_at FROM tickets WHERE id='t-lib'")).rows[0]
    expect([t.orden_venta, t.salesorder_id, t.fecha_orden_venta]).toEqual([null, null, null])
    expect(t.ov_elegida_en_app_at).toBeTruthy()
  })

  it('un ticket cuyas columnas guardan OTRA OV no se limpia al liberar una adicional', async () => {
    await ovLiberada("'OV-2026-999','soY','2026-06-01'")
    expect((await liberarPorRuta(appWith().app)).status).toBe(200)
    const t = (await db.query("SELECT orden_venta, salesorder_id FROM tickets WHERE id='t-lib'")).rows[0]
    expect([t.orden_venta, t.salesorder_id]).toEqual(['OV-2026-999', 'soY'])
  })
})

/**
 * Prueba ESTRUCTURAL de las transacciones (pg-mem no honra el ROLLBACK, así que la atomicidad en sí no se
 * puede probar aquí): lo que se prueba es que las dos sentencias comparten UN cliente entre BEGIN y COMMIT.
 */
type Reg = { c: number; sql: string }
function grabador(antesDe?: (sql: string) => Promise<void>) {
  const log: Reg[] = []
  let n = 0
  const raw = db as unknown as { connect: () => Promise<{ query: (s: string, p?: unknown[]) => Promise<unknown>; release: () => void }> }
  const reg = (c: number, s: string) => { log.push({ c, sql: s }); return antesDe ? antesDe(s) : Promise.resolve() }
  const proxy = {
    query: async (s: string, p?: unknown[]) => { await reg(0, s); return db.query(s, p) },
    connect: async () => {
      const cl = await raw.connect(); const c = ++n
      return { query: async (s: string, p?: unknown[]) => { await reg(c, s); return cl.query(s, p) }, release: () => cl.release() }
    },
  }
  return { log, proxy: proxy as unknown as typeof db }
}
function mismoClienteEntreBeginYCommit(log: Reg[], patrones: RegExp[]) {
  const c = log.find((e) => e.c > 0 && patrones[0].test(e.sql))?.c
  expect(c, 'la primera sentencia debe ir por un cliente de transacción').toBeGreaterThan(0)
  const propias = log.filter((e) => e.c === c).map((e) => e.sql)
  expect(propias[0]).toBe('BEGIN')
  expect(propias.at(-1)).toBe('COMMIT')
  for (const p of patrones) expect(propias.some((s) => p.test(s)), String(p)).toBe(true)
}

describe('transacciones: las dos sentencias comparten cliente entre BEGIN y COMMIT', () => {
  it('liberar: UPDATE ov_asociaciones y UPDATE tickets', async () => {
    await ovLiberada()
    const { log, proxy } = grabador()
    expect((await liberarPorRuta(appWith({}, proxy).app)).status).toBe(200)
    mismoClienteEntreBeginYCommit(log, [/UPDATE ov_asociaciones/, /UPDATE tickets/])
  })

  it('remisión de entrada: UPDATE tickets SET orden_venta e INSERT INTO ov_asociaciones', async () => {
    await ovLiberada(); await db.query('UPDATE ov_asociaciones SET liberada_at = now()'); await db.query('UPDATE tickets SET orden_venta = NULL, salesorder_id = NULL')
    const { log, proxy } = grabador()
    const res = await request(appWith({}, proxy).app).post('/api/remisiones').set('Cookie', await adminCookie()).send({ ticketId: 't-nuevo', fecha: '2026-08-03', incluye: [], salesOrderId: 'soX' })
    expect(res.status).toBe(201)
    mismoClienteEntreBeginYCommit(log, [/UPDATE tickets SET orden_venta/, /INSERT INTO ov_asociaciones/])
  })

  it('carrera en la remisión: otro commit se cuela entre la guarda y el INSERT → 409 con el mensaje de las puertas, no 500', async () => {
    await ovLiberada(); await db.query('UPDATE ov_asociaciones SET liberada_at = now()'); await db.query('UPDATE tickets SET orden_venta = NULL, salesorder_id = NULL')
    let colado = false
    const { proxy } = grabador(async (s) => {
      if (colado || !/INSERT INTO ov_asociaciones/.test(s)) return
      colado = true
      await db.query("INSERT INTO ov_asociaciones (ticket_id, numero, salesorder_id, origen) VALUES ('t-rival','OV-2026-300','soX','alta')")
    })
    const res = await request(appWith({}, proxy).app).post('/api/remisiones').set('Cookie', await adminCookie()).send({ ticketId: 't-nuevo', fecha: '2026-08-03', incluye: [], salesOrderId: 'soX' })
    expect(res.status, JSON.stringify(res.body)).toBe(409)
    expect(res.body.error).toBe('La orden de venta OV-2026-300 ya está asociada a otro ticket')
  })
})
