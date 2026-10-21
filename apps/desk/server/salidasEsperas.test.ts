import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { transicionPorId, CLAVE_MOTIVO_RESPALDO, cargoQueFaltaParaTransicion, IDS_FIRMA_CC, IDS_CALIBRACION_DIRECTA, type Cargo } from '@ambientalia/shared'
import { createUser } from './auth/users'
import { createRole } from './auth/roles'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * SALIDAS DE LAS ESPERAS (F1C-03), contra el servidor. Lote I3a: el interruptor `SALIDAS_ESPERAS` (RQ-TS-61, RQ-TS-64 SE-0 y SE-1).
 * La guarda va en `ticketService.ts:128`, junto a la de control de calidad: escalón B, `409`, tras el estado y ANTES del área.
 * Lote I4: la regla del ejecutor (persona a cargo / respaldo, RQ-PM-42..45) en `:131` y el motivo del respaldo en `:134` (`422`, agregado).
 * Cada prueba de posición activa DOS guardas a la vez (regla de mutación 1).
 */
const COBRO = 'cobro_diagnostico_espera'
const SIN_PIEZA = 'sin_pieza_en_almacen'
const encendido = () => appWith({ salidasEsperas: true }).app
const apagado = () => appWith({ salidasEsperas: false }).app

let numero = 9700
async function ticket(id: string, status: string, derivadoA: string | null = null) {
  numero += 1
  await db.query('INSERT INTO tickets (id, number, subject, status, derivado_a) VALUES ($1,$2,$3,$4,$5)', [id, numero, 'Espera', status, derivadoA])
}
let seq = 0
/** Una persona de prueba con su sesión: el `id` hace falta para sembrar `derivado_a` y para leer `performed_by_id`. */
async function persona(areas: string[], cargoPermiso: Cargo | null = null) {
  seq += 1
  const role = await createRole(db, { name: `Rol-se-${seq}`, areas })
  const u = await createUser(db, { email: `se${seq}@x.co`, name: `Se${seq}`, passwordHash: await hashPassword('password123'), roleId: role.id, cargoPermiso })
  return { id: u.id, cookie: `sid=${await createSession(db, u.id)}` }
}
const enviar = (app: ReturnType<typeof encendido>, cookie: string, id: string, transitionId: string, extra: Record<string, unknown> = {}, base?: Record<string, unknown>) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values: { ...(base ?? valoresValidos(transicionPorId(transitionId)!, 1)), ...extra } })
const MOTIVO = { [CLAVE_MOTIVO_RESPALDO]: 'Cubro a la persona a cargo, que está de vacaciones' }
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
  it('el administrador (respaldo, con motivo) ejecuta el cobro desde En Espera de Repuestos: Por Facturar y una fila de traza', async () => {
    await ticket('e1', 'En Espera de Repuestos')
    const res = await enviar(encendido(), await adminCookie(), 'e1', COBRO, MOTIVO)
    expect(res.status).toBe(200)
    expect(await estadoDe('e1')).toBe('Por Facturar')
    expect(await trazas('e1')).toHaveLength(1)
  })

  it('el administrador (respaldo, con motivo) ejecuta sin_pieza_en_almacen desde Solicitado: En Espera de Repuestos y una fila de traza', async () => {
    await ticket('e2', 'Solicitado')
    const res = await enviar(encendido(), await adminCookie(), 'e2', SIN_PIEZA, MOTIVO)
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

describe('el ejecutor de la salida (RQ-PM-42, RQ-PM-44): persona a cargo o respaldo con motivo', () => {
  it('la persona a cargo ejecuta el cobro SIN motivo: pasa y la traza lleva su id en performed_by_id', async () => {
    const p = await persona(['Comercial'])
    await ticket('x1', 'Servicio externo', p.id)
    const res = await enviar(encendido(), p.cookie, 'x1', COBRO)
    expect(res.status).toBe(200)
    expect(await estadoDe('x1')).toBe('Por Facturar')
    const filas = await trazas('x1')
    expect(filas).toHaveLength(1)
    expect(filas[0].performed_by_id).toBe(p.id)
  })

  it('la persona a cargo de Servicio Técnico ejecuta sin_pieza_en_almacen sin motivo', async () => {
    const p = await persona(['Servicio Técnico'])
    await ticket('x2', 'Solicitado', p.id)
    const res = await enviar(encendido(), p.cookie, 'x2', SIN_PIEZA)
    expect(res.status).toBe(200)
    expect(await estadoDe('x2')).toBe('En Espera de Repuestos')
  })

  it('anulacion desde En Espera de Repuestos: la persona a cargo sin motivo pasa', async () => {
    const p = await persona(['Comercial'])
    await ticket('x3', 'En Espera de Repuestos', p.id)
    const res = await enviar(encendido(), p.cookie, 'x3', 'anulacion')
    expect(res.status).toBe(200)
    expect(await estadoDe('x3')).toBe('Anulado')
  })

  it('el respaldo (Director Comercial) sin motivo: 422 que nombra el motivo, y el ticket no se mueve', async () => {
    const r = await persona(['Comercial'], 'Director Comercial')
    await ticket('x4', 'Servicio externo')
    const res = await enviar(encendido(), r.cookie, 'x4', 'anulacion')
    expect(res.status).toBe(422)
    expect(res.body.errors.join(' | ')).toContain(CLAVE_MOTIVO_RESPALDO)
    expect(await estadoDe('x4')).toBe('Servicio externo')
  })

  it('el respaldo con motivo pasa; el texto llega a la traza y NO a custom_fields (S-13)', async () => {
    const r = await persona(['Comercial'], 'Coordinador Comercial')
    await ticket('x5', 'Servicio externo')
    const res = await enviar(encendido(), r.cookie, 'x5', 'anulacion', MOTIVO)
    expect(res.status).toBe(200)
    const filas = await trazas('x5')
    expect(JSON.stringify(filas[0].values)).toContain('Cubro a la persona a cargo')
    expect(filas[0].performed_by_id).toBe(r.id)
    const cf = ((await db.query('SELECT custom_fields FROM tickets WHERE id=$1', ['x5'])).rows[0] as { custom_fields: unknown }).custom_fields
    expect(JSON.stringify(cf ?? {})).not.toContain(CLAVE_MOTIVO_RESPALDO)
  })

  it('el administrador que no es la persona a cargo es respaldo: sin motivo 422, con motivo pasa', async () => {
    await ticket('x6', 'En Espera de Repuestos')
    const admin = await adminCookie()
    expect((await enviar(encendido(), admin, 'x6', COBRO)).status).toBe(422)
    expect((await enviar(encendido(), admin, 'x6', COBRO, MOTIVO)).status).toBe(200)
  })

  it('S-14 · la persona a cargo que manda motivo recibe 422 (no se descarta en silencio)', async () => {
    const p = await persona(['Comercial'])
    await ticket('x7', 'Servicio externo', p.id)
    const res = await enviar(encendido(), p.cookie, 'x7', COBRO, MOTIVO)
    expect(res.status).toBe(422)
    expect(res.body.errors.join(' | ')).toContain('sólo lo da el respaldo')
    expect(await estadoDe('x7')).toBe('Servicio externo')
  })

  it('un extraño del área (ni persona a cargo ni cargo) recibe 403 con el mensaje del ejecutor', async () => {
    const e = await persona(['Comercial'])
    await ticket('x8', 'Servicio externo')
    const res = await enviar(encendido(), e.cookie, 'x8', COBRO)
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('la ejecuta la persona a cargo del ticket')
    expect(await estadoDe('x8')).toBe('Servicio externo')
  })

  it('S-2 · el derivado de otra área no es persona a cargo: el de Comercial sin cargo recibe 403', async () => {
    const tec = await persona(['Servicio Técnico'])
    const com = await persona(['Comercial'])
    await ticket('x9', 'Servicio externo', tec.id)
    expect((await enviar(encendido(), com.cookie, 'x9', COBRO)).status).toBe(403)
  })

  it('S-21 · con el Coordinador Técnico vacante, el Especialista técnico es respaldo de sin_pieza_en_almacen; con uno activo, 403', async () => {
    const esp = await persona(['Servicio Técnico'], 'Especialista técnico')
    await ticket('x10', 'Solicitado')
    expect((await enviar(encendido(), esp.cookie, 'x10', SIN_PIEZA)).status).toBe(422) // respaldo sin motivo: pasó el 403
    expect((await enviar(encendido(), esp.cookie, 'x10', SIN_PIEZA, MOTIVO)).status).toBe(200)
    await persona(['Servicio Técnico'], 'Coordinador Técnico')
    await ticket('x11', 'Solicitado')
    expect((await enviar(encendido(), esp.cookie, 'x11', SIN_PIEZA, MOTIVO)).status).toBe(403)
  })

  it('anulacion desde Rev./Diagnostico NO es salida de espera: sigue Decisional por cargo (DPC) y no pide motivo del respaldo', async () => {
    const com = await persona(['Comercial'])
    await ticket('x12', 'Rev./Diagnostico', com.id)
    const app = appWith({ salidasEsperas: true, decisionalesPorCargo: true }).app
    const res = await enviar(app, com.cookie, 'x12', 'anulacion')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Decisional')
    const dir = await persona(['Comercial'], 'Director Comercial')
    await ticket('x13', 'Rev./Diagnostico')
    expect((await enviar(app, dir.cookie, 'x13', 'anulacion')).status).toBe(200)
  })

  it('RQ-PM-43 · DPC encendido: la persona a cargo sin cargo ejecuta el cobro; rechazo_comercial sigue pidiendo cargo', async () => {
    const app = appWith({ salidasEsperas: true, decisionalesPorCargo: true }).app
    const p = await persona(['Comercial'])
    await ticket('x14', 'Servicio externo', p.id)
    expect((await enviar(app, p.cookie, 'x14', COBRO)).status).toBe(200)
    await ticket('x15', 'Notificación Comercial', p.id)
    const res = await enviar(app, p.cookie, 'x15', 'rechazo_comercial')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Decisional')
  })

  it('apagado el interruptor, anulacion desde ER no mira al ejecutor ni pide motivo del respaldo (hoy)', async () => {
    const com = await persona(['Comercial'])
    await ticket('x16', 'En Espera de Repuestos')
    expect((await enviar(apagado(), com.cookie, 'x16', 'anulacion')).status).toBe(200)
  })
})

describe('posición del ejecutor y del motivo (RQ-PM-45, RQ-TS-64, regla de mutación 1): cada par activa DOS guardas', () => {
  it('SE-2 · área < ejecutor: un usuario de Servicio Técnico que no es la persona a cargo del cobro → 403 de ÁREA, no el del ejecutor', async () => {
    const tec = await persona(['Servicio Técnico'])
    await ticket('s2', 'Servicio externo')
    const res = await enviar(encendido(), tec.cookie, 's2', COBRO)
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Comercial')
    expect(res.body.error).not.toContain('persona a cargo')
  })

  it('SE-2b · ejecutor < Decisionales: DPC encendido, Comercial sin cargo ni derivado en el cobro → el mensaje del EJECUTOR, no el de Decisionales', async () => {
    const e = await persona(['Comercial'])
    await ticket('s2b', 'Servicio externo')
    const res = await enviar(appWith({ salidasEsperas: true, decisionalesPorCargo: true }).app, e.cookie, 's2b', COBRO)
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('persona a cargo del ticket')
    expect(res.body.error).not.toContain('es Decisional')
  })

  it('SE-3 · ejecutor < 422: un extraño que además manda el motivo y falla el de anulación → el 403 del ejecutor, sin 422', async () => {
    const e = await persona(['Comercial'])
    await ticket('s3', 'Servicio externo')
    const res = await enviar(encendido(), e.cookie, 's3', 'anulacion', MOTIVO, { comment: 'sin motivo de anulación' })
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('persona a cargo del ticket')
    expect(res.body.errors).toBeUndefined()
  })

  it('SE-5 · un único 422: anulacion sin «Motivo de anulación» y sin motivo del respaldo devuelve LOS DOS errores a la vez', async () => {
    const r = await persona(['Comercial'], 'Director Comercial')
    await ticket('s5', 'En Espera de Repuestos')
    const res = await enviar(encendido(), r.cookie, 's5', 'anulacion', {}, { comment: 'nada más' })
    expect(res.status).toBe(422)
    const juntos = res.body.errors.join(' | ')
    expect(juntos).toContain('Falta el campo obligatorio: Motivo')   // el de anulacion, del plan (escalón C)
    expect(res.body.errors).toHaveLength(2)
    expect(juntos).toContain(CLAVE_MOTIVO_RESPALDO)
  })
})

describe('pares sin prueba posible: los conjuntos de transiciones son disjuntos (D3)', () => {
  it('ninguna de las tres salidas está en la lista corta de cargos, ni en las de firma de control de calidad, ni son de calibración directa o de envío a control de calidad', () => {
    for (const id of [COBRO, SIN_PIEZA, 'anulacion']) {
      expect(cargoQueFaltaParaTransicion(id, { isAdmin: false, cargoPermiso: null }), `${id} y la lista corta`).toBeNull()
      expect(IDS_FIRMA_CC.has(id), `${id} y la firma de control de calidad`).toBe(false)
      expect(IDS_CALIBRACION_DIRECTA.has(id), `${id} y la calibración directa`).toBe(false)
      expect(id === 'envio_control_calidad' || id === 'finalizacion_servicio', `${id} y el interruptor de control de calidad`).toBe(false)
    }
  })
})

describe('GET /api/permisos/salidas-esperas (RQ-PM-45): el contexto para el cliente, la misma función que la guarda', () => {
  const pedir = (app: ReturnType<typeof encendido>, cookie?: string) => { const r = request(app).get('/api/permisos/salidas-esperas'); return cookie ? r.set('Cookie', cookie) : r }

  it('sin sesión, 401', async () => {
    expect((await pedir(encendido())).status).toBe(401)
  })

  it('apagado: { activo: false, coordinadorTecnicoVacante: false } aunque no haya Coordinador Técnico', async () => {
    const res = await pedir(apagado(), await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ activo: false, coordinadorTecnicoVacante: false })
  })

  it('encendido, sin Coordinador Técnico activo: vacante; con uno activo: no vacante (S-21)', async () => {
    const cookie = await adminCookie()
    expect((await pedir(encendido(), cookie)).body).toEqual({ activo: true, coordinadorTecnicoVacante: true })
    await persona(['Servicio Técnico'], 'Coordinador Técnico')
    expect((await pedir(encendido(), cookie)).body).toEqual({ activo: true, coordinadorTecnicoVacante: false })
  })
})

/**
 * Pares SIN prueba posible, declarados (D3): el ejecutor frente a la lista corta (`cargoFalta`), a la firma de control de calidad y a la prioridad, y el
 * interruptor frente a `exigirInterruptorControlCalidad` y `exigirCalibracionDirecta`, son conjuntos de transiciones DISJUNTOS (ninguna transición activa
 * las dos guardas). La disjunción de ids está fijada en `packages/shared/src/salidasEsperas.test.ts`.
 */
