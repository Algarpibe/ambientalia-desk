import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Cargo, RespuestaReclamacion } from '@ambientalia/shared'
import { MENSAJE_SIN_CARGO_RECLAMACION, motivoPasoNoPermitido } from '@ambientalia/shared'
import { asociarOV, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { db, instalarArnes, appWith, adminCookie } from '../testing/appHarness'
import { createUser } from '../auth/users'
import { createSession } from '../auth/sessions'
import { createRole } from '../auth/roles'
import { asociacionPorId, registrarRespuesta, reclamacionPorId, avanzarFicha } from '../db/garantiaProveedor'

instalarArnes()

/**
 * Rutas de la reclamación de garantía al fabricante (F1B-13, lote 1b; `tickets-core` RQ-TC-44, RQ-TC-46 a RQ-TC-48 y
 * `permissions` RQ-PM-26). Las pruebas POS-* fijan el ORDEN de las guardas con las dos activas a la vez (regla de
 * mutación 1): cada una responde distinto según cuál corra primero. G1 a G14 son los ids de `design.md` §6.
 */

let n = 0
/** Cookie de un usuario con las áreas y el cargo dados; email propio para poder tener varios en una prueba. */
async function usuario(areas: string[], cargo: Cargo | null = null): Promise<string> {
  n += 1
  const role = await createRole(db, { name: `Rol-gp-${n}`, areas })
  const u = await createUser(db, { email: `gp${n}@x.co`, name: `U${n}`, passwordHash: 'h', roleId: role.id, cargoPermiso: cargo })
  return `sid=${await createSession(db, u.id)}`
}
const sinCargo = () => usuario(['Comercial'])
// Sólo el área Comercial a propósito: el cargo basta para gestionar, y esa área deja liberar una orden.
const directorTecnico = () => usuario(['Comercial'], 'Director Técnico')

const si: RespuestaReclamacion = { reclama: true, fabricante: 'Acme', piezaReferencia: 'P-1', piezaSerial: 'S-9', valorReclamado: 800000 }
const no: RespuestaReclamacion = { reclama: false, motivo: 'mal_uso' }

async function asociar(numero: string, ticketId = 't1'): Promise<number> {
  const a = await asociarOV(db, { ticketId, numero, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  return Number(a.id)
}
/** Una respuesta ya guardada, escrita por la capa de datos para no gastar la sesión de la prueba. */
async function sembrarRespuesta(numero: string, respuesta: RespuestaReclamacion) {
  const id = await asociar(numero)
  return registrarRespuesta(db, { asociacion: (await asociacionPorId(db, id))!, respuesta, por: 'semilla' })
}
async function sembrarFicha(estado: 'abierta' | 'enviada' | 'resuelta' = 'abierta', numero = 'OVI-1') {
  const f = await sembrarRespuesta(numero, si)
  if (estado !== 'abierta') await avanzarFicha(db, f.id, 'abierta', { a: 'enviada' })
  if (estado === 'resuelta') await avanzarFicha(db, f.id, 'enviada', { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })
  return (await reclamacionPorId(db, f.id))!
}

const app = () => appWith().app
const responder = (cookie: string, id: number | string, cuerpo: unknown) =>
  request(app()).post(`/api/ov-asociaciones/${id}/garantia-proveedor`).set('Cookie', cookie).send(cuerpo as object)
const editar = (cookie: string, id: number | string, cuerpo: unknown) =>
  request(app()).put(`/api/garantia-proveedor/${id}`).set('Cookie', cookie).send(cuerpo as object)
const avanzar = (cookie: string, id: number | string, cuerpo: unknown) =>
  request(app()).post(`/api/garantia-proveedor/${id}/avanzar`).set('Cookie', cookie).send(cuerpo as object)
const leer = (cookie: string, ticket = 't1') => request(app()).get(`/api/tickets/${ticket}/garantia-proveedor`).set('Cookie', cookie)

const datos = { fabricante: 'Acme', piezaReferencia: 'P-1', piezaSerial: 'S-9', rma: 'RMA-1', valorReclamado: 5 }

describe('responder (RQ-TC-44, RQ-PM-26)', () => {
  it('un «sí» abre la ficha en abierta con 201 y origen manual', async () => {
    const id = await asociar('OVI-1')
    const res = await responder(await directorTecnico(), id, si)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ reclama: true, estado: 'abierta', fabricante: 'Acme', valorReclamado: 800000, origenValorReclamado: 'manual', ticketId: 't1', oviNumero: 'OVI-1' })
  })

  it('un «no» con motivo da 201 y no abre ficha', async () => {
    const id = await asociar('OVI-1')
    const res = await responder(await directorTecnico(), id, no)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ reclama: false, motivoNoReclama: 'mal_uso', estado: null })
  })

  it('un «no» sin motivo y con motivo fuera de lista dan 422', async () => {
    const id = await asociar('OVI-1')
    const c = await directorTecnico()
    expect((await responder(c, id, { reclama: false })).status).toBe(422)
    expect((await responder(c, id, { reclama: false, motivo: 'porque_si' })).status).toBe(422)
  })

  it('un «sí» sin fabricante o con fabricante de sólo espacios da 422', async () => {
    const id = await asociar('OVI-1')
    const c = await directorTecnico()
    expect((await responder(c, id, { reclama: true })).status).toBe(422)
    expect((await responder(c, id, { reclama: true, fabricante: '   ' })).status).toBe(422)
  })

  it('una segunda respuesta da 409 y la guardada sigue siendo la primera (S-10)', async () => {
    const id = await asociar('OVI-1')
    const c = await directorTecnico()
    expect((await responder(c, id, si)).status).toBe(201)
    const segunda = await responder(c, id, no)
    expect(segunda.status).toBe(409)
    expect(segunda.body.error).toContain('ya tiene respuesta')
    expect((await leer(c)).body.ovis[0].respuesta).toMatchObject({ reclama: true, fabricante: 'Acme' })
  })

  it('la carrera de dos respuestas da un 201 y un 409, nunca un 500', async () => {
    const id = await asociar('OVI-1')
    const c = await directorTecnico()
    const [a, b] = await Promise.all([responder(c, id, si), responder(c, id, no)])
    expect([a.status, b.status].sort()).toEqual([201, 409])
  })

  it('una asociación OV- ordinaria da 422, una inexistente y un id no numérico 404, una liberada 409 y sin cargo 403', async () => {
    const c = await directorTecnico()
    expect((await responder(c, await asociar('OV-2026-5'), si)).status).toBe(422)
    expect((await responder(c, 9999, si)).status).toBe(404)
    expect((await responder(c, 'abc', si)).status).toBe(404)
    const lib = await asociar('OVI-2')
    await liberarAsociacion(db, lib, 'c', 'error')
    expect((await responder(c, lib, si)).status).toBe(409)
    const s = await sinCargo()
    const res = await responder(s, await asociar('OVI-3'), si)
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJE_SIN_CARGO_RECLAMACION)
  })
})

describe('avanzar y editar (RQ-TC-46, RQ-TC-47)', () => {
  it('abierta → enviada sin más datos, y enviada → resuelta con reposición y valor 800000', async () => {
    const f = await sembrarFicha()
    const c = await directorTecnico()
    const e = await avanzar(c, f.id, { a: 'enviada' })
    expect(e.status).toBe(200)
    expect(e.body).toMatchObject({ estado: 'enviada' })
    expect(e.body.enviadaAt).toMatch(/^\d{4}-/)
    const r = await avanzar(c, f.id, { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 800000 })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ estado: 'resuelta', resultado: 'reposicion', valorRecuperado: 800000 })
  })

  it('«rechazada» sin valor guarda 0 y con valor distinto de 0 da 422', async () => {
    const f = await sembrarFicha('enviada')
    const c = await directorTecnico()
    expect((await avanzar(c, f.id, { a: 'resuelta', resultado: 'rechazada', valorRecuperado: 5 })).status).toBe(422)
    const r = await avanzar(c, f.id, { a: 'resuelta', resultado: 'rechazada' })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ resultado: 'rechazada', valorRecuperado: 0 })
  })

  it('«reposición» y «nota crédito» sin valor, no numérico o negativo dan 422', async () => {
    const f = await sembrarFicha('enviada')
    const c = await directorTecnico()
    for (const resultado of ['reposicion', 'nota_credito']) {
      for (const valorRecuperado of [undefined, 'abc', -1]) {
        expect((await avanzar(c, f.id, { a: 'resuelta', resultado, valorRecuperado })).status).toBe(422)
      }
    }
    expect((await reclamacionPorId(db, f.id))!.estado).toBe('enviada')
  })

  it('saltar, retroceder y avanzar una resuelta dan 409', async () => {
    const c = await directorTecnico()
    const abierta = await sembrarFicha('abierta', 'OVI-1')
    expect((await avanzar(c, abierta.id, { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })).status).toBe(409)
    const enviada = await sembrarFicha('enviada', 'OVI-2')
    expect((await avanzar(c, enviada.id, { a: 'abierta' })).status).toBe(409)
    const resuelta = await sembrarFicha('resuelta', 'OVI-3')
    expect((await avanzar(c, resuelta.id, { a: 'enviada' })).status).toBe(409)
  })

  it('una ficha inexistente, un id no numérico y una respuesta «no» dan 404 (G7 y G11, M-RT-1)', async () => {
    const c = await directorTecnico()
    const n1 = await sembrarRespuesta('OVI-1', no)
    expect((await avanzar(c, 9999, { a: 'enviada' })).status).toBe(404)
    expect((await avanzar(c, 'abc', { a: 'enviada' })).status).toBe(404)
    expect((await avanzar(c, n1.id, { a: 'enviada' })).status).toBe(404)
    expect((await editar(c, 9999, datos)).status).toBe(404)
    expect((await editar(c, 'abc', datos)).status).toBe(404)
    expect((await editar(c, n1.id, datos)).status).toBe(404)
  })

  it('sin cargo, avanzar y editar dan 403', async () => {
    const f = await sembrarFicha()
    const s = await sinCargo()
    expect((await avanzar(s, f.id, { a: 'enviada' })).status).toBe(403)
    expect((await editar(s, f.id, datos)).status).toBe(403)
    expect((await reclamacionPorId(db, f.id))!.estado).toBe('abierta')
  })

  it('editar el RMA de una «enviada» no cambia el estado ni las fechas', async () => {
    const f = await sembrarFicha('enviada')
    const c = await directorTecnico()
    const res = await editar(c, f.id, { ...datos, rma: 'RMA-77' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ rma: 'RMA-77', estado: 'enviada', enviadaAt: f.enviadaAt, resueltaAt: null })
  })

  it('editar con fabricante vacío, valor -1 o «abc» da 422; una ficha resuelta da 409; el estado del cuerpo se ignora', async () => {
    const f = await sembrarFicha()
    const c = await directorTecnico()
    expect((await editar(c, f.id, { ...datos, fabricante: ' ' })).status).toBe(422)
    expect((await editar(c, f.id, { ...datos, valorReclamado: -1 })).status).toBe(422)
    expect((await editar(c, f.id, { ...datos, valorReclamado: 'abc' })).status).toBe(422)
    const ok = await editar(c, f.id, { ...datos, estado: 'resuelta' })
    expect(ok.status).toBe(200)
    expect(ok.body.estado).toBe('abierta')
    const r = await sembrarFicha('resuelta', 'OVI-2')
    expect((await editar(c, r.id, datos)).status).toBe(409)
  })
})

describe('matriz por rol y lectura (RQ-PM-26, RQ-TC-48, RQ-TC-49)', () => {
  it('sin sesión las cuatro rutas dan 401', async () => {
    const a = app()
    expect((await request(a).get('/api/tickets/t1/garantia-proveedor')).status).toBe(401)
    expect((await request(a).post('/api/ov-asociaciones/1/garantia-proveedor').send(si)).status).toBe(401)
    expect((await request(a).put('/api/garantia-proveedor/1').send(datos)).status).toBe(401)
    expect((await request(a).post('/api/garantia-proveedor/1/avanzar').send({ a: 'enviada' })).status).toBe(401)
  })

  it('sin cargo: 403 en las tres escrituras y 200 en la lectura', async () => {
    const f = await sembrarFicha()
    const id2 = await asociar('OVI-2')
    const s = await sinCargo()
    expect((await responder(s, id2, si)).status).toBe(403)
    expect((await editar(s, f.id, datos)).status).toBe(403)
    expect((await avanzar(s, f.id, { a: 'enviada' })).status).toBe(403)
    expect((await leer(s)).status).toBe(200)
  })

  it('el Director Técnico con sólo el área Comercial y el administrador sin cargo pasan; el Director Comercial no', async () => {
    const id = await asociar('OVI-1')
    expect((await responder(await usuario(['Comercial'], 'Director Comercial'), id, si)).status).toBe(403)
    expect((await responder(await adminCookie(), id, si)).status).toBe(201)
    const id2 = await asociar('OVI-2')
    expect((await responder(await directorTecnico(), id2, si)).status).toBe(201)
  })

  it('el servidor rechaza con 403 lo que el panel ocultaría y con 409 el paso que no ofrecería', async () => {
    const f = await sembrarFicha()
    expect((await avanzar(await sinCargo(), f.id, { a: 'enviada' })).status).toBe(403)
    expect((await avanzar(await directorTecnico(), f.id, { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })).status).toBe(409)
  })

  it('la lectura: OVI vigente sin respuesta pendiente, «no» no, OV- nunca, liberada sin respuesta fuera (S-11)', async () => {
    const pendiente = await asociar('OVI-1')
    await sembrarRespuesta('OVI-2', no)
    await asociar('OV-2026-5')
    await liberarAsociacion(db, await asociar('OVI-3'), 'c', 'error')
    const res = await leer(await sinCargo())
    expect(res.status).toBe(200)
    const ovis = res.body.ovis as Array<{ numero: string; pendiente: boolean; respuesta: unknown }>
    expect(ovis.map((o) => o.numero)).toEqual(['OVI-1', 'OVI-2'])
    expect(ovis.find((o) => o.numero === 'OVI-1')).toMatchObject({ asociacionId: pendiente, pendiente: true, respuesta: null })
    expect(ovis.find((o) => o.numero === 'OVI-2')!.pendiente).toBe(false)
  })

  it('una OVI anterior al cambio sale pendiente sin fila (S-11, CARACTERIZACIÓN)', async () => {
    await db.query("INSERT INTO ov_asociaciones (ticket_id, numero, salesorder_id, origen) VALUES ('t1', 'OVI-VIEJA', NULL, 'alta')")
    const res = await leer(await sinCargo())
    expect(res.body.ovis).toHaveLength(1)
    expect(res.body.ovis[0]).toMatchObject({ numero: 'OVI-VIEJA', pendiente: true, respuesta: null })
    expect((await db.query('SELECT COUNT(*)::int AS n FROM garantia_proveedor')).rows[0].n).toBe(0)
  })

  it('liberar la asociación (Comercial, con motivo) deja la ficha intacta, editable y avanzable (S-8)', async () => {
    const f = await sembrarFicha()
    const c = await directorTecnico()
    const lib = await request(app()).put(`/api/ov-asociaciones/${f.asociacionId}/liberar`).set('Cookie', c).send({ motivo: 'error de alta' })
    expect(lib.status).toBe(200)
    const g = await leer(c)
    expect(g.body.ovis[0]).toMatchObject({ liberada: true, pendiente: false, respuesta: { id: f.id, estado: 'abierta' } })
    expect((await editar(c, f.id, { ...datos, rma: 'RMA-9' })).body.rma).toBe('RMA-9')
    expect((await avanzar(c, f.id, { a: 'enviada' })).status).toBe(200)
  })

  it('camino feliz: responder, editar, enviar, resolver, y la lectura lo refleja', async () => {
    const id = await asociar('OVI-1')
    const c = await directorTecnico()
    expect((await leer(c)).body.ovis[0].pendiente).toBe(true)
    const f = (await responder(c, id, si)).body
    expect((await editar(c, f.id, { ...datos, rma: 'RMA-1' })).status).toBe(200)
    expect((await avanzar(c, f.id, { a: 'enviada' })).status).toBe(200)
    expect((await avanzar(c, f.id, { a: 'resuelta', resultado: 'nota_credito', valorRecuperado: 300 })).status).toBe(200)
    const g = await leer(c)
    expect(g.body.ovis[0]).toMatchObject({ pendiente: false, respuesta: { estado: 'resuelta', resultado: 'nota_credito', valorRecuperado: 300, rma: 'RMA-1' } })
  })

  it('el fabricante propuesto es la marca del ticket', async () => {
    await db.query("INSERT INTO tickets (id, number, subject, status, marca) VALUES ('t1', 1, 's', 'Ingresado', 'Acme')")
    expect((await leer(await sinCargo())).body.fabricantePropuesto).toBe('Acme')
  })
})

describe('POSICIÓN de las guardas (regla de mutación 1)', () => {
  it('POS-RS-1 · G1 < G2: asociación inexistente y sin cargo → 404', async () => {
    expect((await responder(await sinCargo(), 9999, si)).status).toBe(404)
  })

  it('POS-RS-2 · G2 < G3: asociación liberada y sin cargo → 403', async () => {
    const id = await asociar('OVI-1')
    await liberarAsociacion(db, id, 'c', 'error')
    expect((await responder(await sinCargo(), id, si)).status).toBe(403)
  })

  it('POS-RS-3 · G3 < G4: liberada y OV- ordinaria, con cargo → 409', async () => {
    const id = await asociar('OV-2026-5')
    await liberarAsociacion(db, id, 'c', 'error')
    const res = await responder(await directorTecnico(), id, si)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('liberada')
  })

  it('POS-RS-4 · G4 < G5: OV- ordinaria y cuerpo inválido → 422 con «no es una OVI»', async () => {
    const res = await responder(await directorTecnico(), await asociar('OV-2026-5'), { reclama: true })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('no es una OVI')
  })

  it('POS-RS-5 · G5 < G6: ya respondida y cuerpo inválido → 422', async () => {
    const f = await sembrarRespuesta('OVI-1', no)
    expect((await responder(await directorTecnico(), f.asociacionId, { reclama: true })).status).toBe(422)
  })

  it('POS-RS-6 · G2 < G6: ya respondida y sin cargo → 403', async () => {
    const f = await sembrarRespuesta('OVI-1', no)
    expect((await responder(await sinCargo(), f.asociacionId, si)).status).toBe(403)
  })

  it('POS-RS-7 · G3 < G6: liberada y ya respondida, con cargo → 409 con el texto de «liberada»', async () => {
    const f = await sembrarRespuesta('OVI-1', no)
    await liberarAsociacion(db, f.asociacionId, 'c', 'error')
    const res = await responder(await directorTecnico(), f.asociacionId, si)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('liberada')
  })

  it('POS-AV-1 · G7 < G8: id inexistente, y una respuesta «no», sin cargo → 404', async () => {
    const s = await sinCargo()
    const n1 = await sembrarRespuesta('OVI-1', no)
    expect((await avanzar(s, 9999, { a: 'enviada' })).status).toBe(404)
    expect((await avanzar(s, n1.id, { a: 'enviada' })).status).toBe(404)
  })

  it('POS-AV-2 · G8 < G9: sin cargo y paso no permitido → 403', async () => {
    const f = await sembrarFicha()
    expect((await avanzar(await sinCargo(), f.id, { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })).status).toBe(403)
  })

  it('POS-AV-3 · G9 < G10: ficha abierta, a «resuelta» con resultado fuera de lista → 409', async () => {
    const f = await sembrarFicha()
    expect((await avanzar(await directorTecnico(), f.id, { a: 'resuelta', resultado: 'otro' })).status).toBe(409)
  })

  it('POS-ED-1 · G11 < G12: id inexistente, y una respuesta «no», sin cargo → 404', async () => {
    const s = await sinCargo()
    const n1 = await sembrarRespuesta('OVI-1', no)
    expect((await editar(s, 9999, datos)).status).toBe(404)
    expect((await editar(s, n1.id, datos)).status).toBe(404)
  })

  it('POS-ED-2 · G12 < G13: ficha resuelta y sin cargo → 403', async () => {
    const f = await sembrarFicha('resuelta')
    expect((await editar(await sinCargo(), f.id, datos)).status).toBe(403)
  })

  it('POS-ED-3 · G13 < G14: ficha resuelta y fabricante vacío → 409', async () => {
    const f = await sembrarFicha('resuelta')
    expect((await editar(await directorTecnico(), f.id, { ...datos, fabricante: '' })).status).toBe(409)
  })
})

// ── Cierre del verify: W-1 (quién respondió), W-3 (las ramas de carrera) y S-7 (el rechazo no escribe nada) ──
/** Cuántas filas hay en `garantia_proveedor`: la usan los 403 y 422 de responder para probar que no se escribió nada (S-7). */
async function filasEscritas(): Promise<number> {
  return (await db.query('SELECT COUNT(*)::int AS n FROM garantia_proveedor')).rows[0].n
}

/**
 * Una base que, justo antes de la sentencia que casa con `patron`, hace que otra persona se adelante (`efecto`): así la
 * ficha cambia de estado ENTRE la lectura de la ruta y su escritura. Con `descartar`, la escritura no encuentra fila.
 */
function conCarrera(patron: RegExp, efecto: () => Promise<unknown>, descartar = false): typeof db {
  const base = db
  return {
    query: (async (sql: string, params?: unknown[]) => {
      if (patron.test(sql)) {
        await efecto()
        if (descartar) return { rows: [] }
      }
      return base.query(sql, params)
    }) as typeof db.query,
  }
}
const appCon = (d: typeof db) => appWith({}, d).app

describe('cierre · quién respondió y las carreras de editar y avanzar', () => {
  it('«respondidaPor» guarda el nombre de quien responde, en la respuesta y en la lectura (W-1)', async () => {
    const rol = await createRole(db, { name: 'Rol-w1', areas: ['Comercial'] })
    const u = await createUser(db, { email: 'w1@x.co', name: 'Marta Pérez', passwordHash: 'h', roleId: rol.id, cargoPermiso: 'Director Técnico' })
    const cookie = `sid=${await createSession(db, u.id)}`
    const res = await responder(cookie, await asociar('OVI-1'), si)
    expect(res.status).toBe(201)
    expect(res.body.respondidaPor).toBe('Marta Pérez')
    expect((await leer(cookie)).body.ovis[0].respuesta.respondidaPor).toBe('Marta Pérez')
  })

  it('editar: si la ficha se resuelve entre la lectura y la escritura, 409 con el texto de «resuelta» y la ficha no cambia (W-3)', async () => {
    const f = await sembrarFicha('abierta')
    const d = conCarrera(/UPDATE garantia_proveedor SET fabricante/, async () => {
      await avanzarFicha(db, f.id, 'abierta', { a: 'enviada' })
      await avanzarFicha(db, f.id, 'enviada', { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })
    })
    const res = await request(appCon(d)).put(`/api/garantia-proveedor/${f.id}`).set('Cookie', await directorTecnico()).send({ ...datos, fabricante: 'Otro' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('La reclamación está resuelta y ya no se edita')
    expect((await reclamacionPorId(db, f.id))).toMatchObject({ estado: 'resuelta', fabricante: 'Acme' })
  })

  it('avanzar: si otra persona movió la ficha entre la lectura y la escritura, 409 con el texto del paso que ya no vale (W-3)', async () => {
    const f = await sembrarFicha('abierta')
    const d = conCarrera(/UPDATE garantia_proveedor SET estado = 'enviada'/, () => avanzarFicha(db, f.id, 'abierta', { a: 'enviada' }))
    const res = await request(appCon(d)).post(`/api/garantia-proveedor/${f.id}/avanzar`).set('Cookie', await directorTecnico()).send({ a: 'enviada' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe(motivoPasoNoPermitido('enviada', 'enviada'))
    expect((await reclamacionPorId(db, f.id))!.estado).toBe('enviada')
  })

  it('avanzar: si la escritura no encuentra fila y el estado releído sigue permitiendo el paso, 409 con el texto de recarga (W-3)', async () => {
    const f = await sembrarFicha('abierta')
    const d = conCarrera(/UPDATE garantia_proveedor SET estado = 'enviada'/, async () => undefined, true)
    const res = await request(appCon(d)).post(`/api/garantia-proveedor/${f.id}/avanzar`).set('Cookie', await directorTecnico()).send({ a: 'enviada' })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('La reclamación ya cambió de estado: recarga e inténtalo de nuevo')
    expect((await reclamacionPorId(db, f.id))!.estado).toBe('abierta')
  })

  it('el 403, el 422 y el 404 de responder no escriben ninguna fila (S-7)', async () => {
    const id = await asociar('OVI-1')
    const c = await directorTecnico()
    expect((await responder(await sinCargo(), id, si)).status).toBe(403)
    expect((await responder(c, id, { reclama: true })).status).toBe(422)
    expect((await responder(c, await asociar('OV-2026-5'), si)).status).toBe(422)
    expect((await responder(c, 9999, si)).status).toBe(404)
    expect(await filasEscritas()).toBe(0)
  })
})
