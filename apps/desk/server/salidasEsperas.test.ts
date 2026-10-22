import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { transicionPorId, CLAVE_MOTIVO_COBRO, CLAVE_DERIVACION, cargoQueFaltaParaTransicion, IDS_FIRMA_CC, IDS_CALIBRACION_DIRECTA, type Cargo } from '@ambientalia/shared'
import { createUser } from './auth/users'
import { createRole } from './auth/roles'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * SALIDAS DE LAS ESPERAS (F1C-03), contra el servidor. Lote I3a: el interruptor `SALIDAS_ESPERAS` (RQ-TS-61, RQ-TS-64 SE-0 y SE-1).
 * La guarda va en `ticketService.ts:128`, junto a la de control de calidad: escalón B, `409`, tras el estado y ANTES del área.
 * Corrección `decision/f1c03-quien-ejecuta-salidas`: el `403` del ejecutor (sólo el cargo comercial en las esperas externas) en `:131` y el
 * motivo del cobro en blanco en `:134` (`422`, agregado). Cada prueba de posición activa DOS guardas a la vez (regla de mutación 1).
 */
const COBRO = 'cobro_diagnostico_espera'
const SIN_PIEZA = 'sin_pieza_en_almacen'
const encendido = () => appWith({ salidasEsperas: true }).app
const apagado = () => appWith({ salidasEsperas: false }).app
const conDpc = (salidasEsperas: boolean) => appWith({ salidasEsperas, decisionalesPorCargo: true }).app

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
const ejecutar = (app: ReturnType<typeof encendido>, cookie: string, id: string, transitionId: string) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values: valoresValidos(transicionPorId(transitionId)!, 1) })
const estadoDe = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status
const trazas = async (id: string) => (await db.query('SELECT * FROM ticket_transitions WHERE ticket_id=$1 ORDER BY id', [id])).rows as Array<Record<string, unknown>>
const SOLO_CARGO = 'la ejecutan sólo el Director Comercial o la Coordinadora Comercial'
const EXTERNAS = ['En Espera de Repuestos', 'Servicio externo']

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
    const res = await ejecutar(apagado(), await adminCookie(), 'a3', 'anulacion')
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

describe('el ejecutor de las salidas de las esperas externas: sólo el Director Comercial o la Coordinadora Comercial (decision/f1c03-quien-ejecuta-salidas)', () => {
  it('el Director Comercial cobra desde Servicio externo: el motivo llega a la traza y NO a custom_fields', async () => {
    const d = await persona(['Comercial'], 'Director Comercial')
    await ticket('x1', 'Servicio externo')
    const res = await enviar(encendido(), d.cookie, 'x1', COBRO, { [CLAVE_MOTIVO_COBRO]: 'El cliente rechaza la cotización' })
    expect(res.status).toBe(200)
    expect(await estadoDe('x1')).toBe('Por Facturar')
    const filas = await trazas('x1')
    expect(filas).toHaveLength(1)
    expect(filas[0].performed_by_id).toBe(d.id)
    expect(JSON.stringify(filas[0].values)).toContain('El cliente rechaza la cotización')
    const cf = ((await db.query('SELECT custom_fields FROM tickets WHERE id=$1', ['x1'])).rows[0] as { custom_fields: unknown }).custom_fields
    expect(JSON.stringify(cf ?? {})).not.toContain(CLAVE_MOTIVO_COBRO)
  })

  it('la Coordinadora Comercial y el administrador ejecutan el cobro y la anulación desde las dos externas', async () => {
    const c = await persona(['Comercial'], 'Coordinador Comercial')
    const admin = await adminCookie()
    let n = 0
    for (const cookie of [c.cookie, admin]) for (const t of [COBRO, 'anulacion']) for (const o of EXTERNAS) {
      n += 1
      await ticket(`x2-${n}`, o)
      expect((await enviar(encendido(), cookie, `x2-${n}`, t)).status, `${t} ${o}`).toBe(200)
    }
  })

  it('un Comercial sin cargo recibe 403 del ejecutor en el cobro y en la anulación desde las dos externas, y el ticket no se mueve', async () => {
    const e = await persona(['Comercial'])
    let n = 0
    for (const t of [COBRO, 'anulacion']) for (const o of EXTERNAS) {
      n += 1
      await ticket(`x3-${n}`, o)
      const res = await enviar(encendido(), e.cookie, `x3-${n}`, t)
      expect(res.status, `${t} ${o}`).toBe(403)
      expect(res.body.error).toContain(SOLO_CARGO)
      expect(await estadoDe(`x3-${n}`)).toBe(o)
    }
  })

  it('el Asistente Comercial y el Director Técnico con el área Comercial también reciben el 403', async () => {
    for (const cargo of ['Asistente Comercial', 'Director Técnico'] as const) {
      const p = await persona(['Comercial'], cargo)
      await ticket(`x4-${cargo}`, 'Servicio externo')
      expect((await enviar(encendido(), p.cookie, `x4-${cargo}`, COBRO)).status, cargo).toBe(403)
    }
  })

  it('derivado_a YA NO decide: el derivado sin cargo recibe 403, aunque mande un «Motivo del respaldo»', async () => {
    const p = await persona(['Comercial'])
    for (const t of [COBRO, 'anulacion']) {
      await ticket(`x5-${t}`, 'Servicio externo', p.id)
      const res = await enviar(encendido(), p.cookie, `x5-${t}`, t, { 'Motivo del respaldo': 'Soy la persona a cargo' })
      expect(res.status, t).toBe(403)
      expect(res.body.error).toContain(SOLO_CARGO)
    }
  })

  it('el cobro sin motivo, o con el motivo sólo de espacios, da 422 que lo nombra, y el ticket no se mueve', async () => {
    const d = await persona(['Comercial'], 'Director Comercial')
    await ticket('x6', 'En Espera de Repuestos')
    const sin = await enviar(encendido(), d.cookie, 'x6', COBRO, {}, { comment: 'sin motivo' })
    expect(sin.status).toBe(422)
    expect(sin.body.errors.join(' | ')).toContain(CLAVE_MOTIVO_COBRO)
    const blanco = await enviar(encendido(), d.cookie, 'x6', COBRO, { [CLAVE_MOTIVO_COBRO]: '   ' })
    expect(blanco.status).toBe(422)
    expect(blanco.body.errors).toEqual([`"${CLAVE_MOTIVO_COBRO}" no puede estar en blanco`])
    expect(await estadoDe('x6')).toBe('En Espera de Repuestos')
  })

  it('la anulación conserva su motivo de lista de F1C-01: sin él, 422 aun para el Director Comercial', async () => {
    const d = await persona(['Comercial'], 'Director Comercial')
    await ticket('x7', 'Servicio externo')
    const res = await enviar(encendido(), d.cookie, 'x7', 'anulacion', {}, { comment: 'sin motivo de anulación' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual(['Falta el campo obligatorio: Motivo'])
  })

  it('la anulación desde Rev./Diagnostico, Notificación Comercial y Notificación cliente NO entra en la regla: el Comercial sin cargo anula', async () => {
    const e = await persona(['Comercial'])
    for (const [i, o] of ['Rev./Diagnostico', 'Notificación Comercial', 'Notificación cliente'].entries()) {
      await ticket(`x8-${i}`, o)
      expect((await enviar(encendido(), e.cookie, `x8-${i}`, 'anulacion')).status, o).toBe(200)
    }
  })

  it('desde Rev./Diagnostico, con DPC encendido, sigue Decisional por cargo: el Comercial sin cargo 403 de Decisionales; el Director pasa', async () => {
    const com = await persona(['Comercial'])
    await ticket('x9', 'Rev./Diagnostico')
    const res = await enviar(conDpc(true), com.cookie, 'x9', 'anulacion')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Decisional')
    const dir = await persona(['Comercial'], 'Director Comercial')
    await ticket('x10', 'Rev./Diagnostico')
    expect((await enviar(conDpc(true), dir.cookie, 'x10', 'anulacion')).status).toBe(200)
  })

  it('apagado el interruptor, la regla no opina: el Comercial sin cargo anula desde las dos externas (F1C-01)', async () => {
    const com = await persona(['Comercial'])
    for (const o of EXTERNAS) {
      await ticket(`x11-${o}`, o)
      expect((await enviar(apagado(), com.cookie, `x11-${o}`, 'anulacion')).status, o).toBe(200)
    }
  })

  it('apagado el interruptor y DPC encendido, la anulación desde las externas es Decisional por cargo: el Comercial sin cargo 403 de Decisionales', async () => {
    const com = await persona(['Comercial'])
    await ticket('x12', 'Servicio externo')
    const res = await enviar(conDpc(false), com.cookie, 'x12', 'anulacion')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Decisional')
    expect(res.body.error).not.toContain(SOLO_CARGO)
  })

  it('DPC encendido: el Director Comercial cobra; rechazo_comercial sigue pidiendo cargo a quien no lo tiene', async () => {
    const d = await persona(['Comercial'], 'Director Comercial')
    await ticket('x13', 'Servicio externo')
    expect((await enviar(conDpc(true), d.cookie, 'x13', COBRO)).status).toBe(200)
    const p = await persona(['Comercial'])
    await ticket('x14', 'Notificación Comercial')
    const res = await enviar(conDpc(true), p.cookie, 'x14', 'rechazo_comercial')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Decisional')
  })

  it('sin_pieza_en_almacen no tiene regla de ejecutor: la ejecuta Servicio Técnico sin cargo ni derivado; Comercial recibe el 403 de área', async () => {
    const tec = await persona(['Servicio Técnico'])
    await ticket('x15', 'Solicitado')
    expect((await enviar(encendido(), tec.cookie, 'x15', SIN_PIEZA)).status).toBe(200)
    expect(await estadoDe('x15')).toBe('En Espera de Repuestos')
    const com = await persona(['Comercial'], 'Director Comercial')
    await ticket('x16', 'Solicitado')
    const res = await enviar(encendido(), com.cookie, 'x16', SIN_PIEZA)
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Servicio Técnico')
  })
})

describe('posición del ejecutor y del motivo del cobro (RQ-PM-45, RQ-TS-64, regla de mutación 1): cada par activa DOS guardas', () => {
  it('SE-2 · área < ejecutor: un usuario de Servicio Técnico sin cargo en el cobro → 403 de ÁREA, no el del ejecutor', async () => {
    const tec = await persona(['Servicio Técnico'])
    await ticket('s2', 'Servicio externo')
    const res = await enviar(encendido(), tec.cookie, 's2', COBRO)
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Comercial')
    expect(res.body.error).not.toContain(SOLO_CARGO)
  })

  it('SE-2b · ejecutor < Decisionales: DPC encendido, Comercial sin cargo en el cobro → el mensaje del EJECUTOR, no el de Decisionales', async () => {
    const e = await persona(['Comercial'])
    await ticket('s2b', 'Servicio externo')
    const res = await enviar(conDpc(true), e.cookie, 's2b', COBRO)
    expect(res.status).toBe(403)
    expect(res.body.error).toContain(SOLO_CARGO)
    expect(res.body.error).not.toContain('es Decisional')
  })

  it('SE-3 · ejecutor < 422: un Comercial sin cargo que anula sin «Motivo de anulación» o cobra sin motivo → el 403 del ejecutor, sin 422', async () => {
    const e = await persona(['Comercial'])
    for (const [t, base] of [['anulacion', { comment: 'sin motivo de anulación' }], [COBRO, { comment: 'x', [CLAVE_MOTIVO_COBRO]: '   ' }]] as const) {
      await ticket(`s3-${t}`, 'Servicio externo')
      const res = await enviar(encendido(), e.cookie, `s3-${t}`, t, {}, base)
      expect(res.status, t).toBe(403)
      expect(res.body.error).toContain(SOLO_CARGO)
      expect(res.body.errors).toBeUndefined()
    }
  })

  it('SE-5 · agregado < persona derivada: el cobro con motivo en blanco y derivado inexistente → sólo el 422 del motivo', async () => {
    const d = await persona(['Comercial'], 'Director Comercial')
    await ticket('s5', 'En Espera de Repuestos')
    const res = await enviar(encendido(), d.cookie, 's5', COBRO, { [CLAVE_MOTIVO_COBRO]: '  ', [CLAVE_DERIVACION]: 'no-existe' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([`"${CLAVE_MOTIVO_COBRO}" no puede estar en blanco`])
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

  it('sólo el interruptor: { activo: false } apagado y { activo: true } encendido', async () => {
    const cookie = await adminCookie()
    const res = await pedir(apagado(), cookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ activo: false })
    expect((await pedir(encendido(), cookie)).body).toEqual({ activo: true })
  })
})

/**
 * Pares SIN prueba posible, declarados (D3): el ejecutor frente a la lista corta (`cargoFalta`), a la firma de control de calidad y a la prioridad, y el
 * interruptor frente a `exigirInterruptorControlCalidad` y `exigirCalibracionDirecta`, son conjuntos de transiciones DISJUNTOS (ninguna transición activa
 * las dos guardas). La disjunción de ids está fijada en `packages/shared/src/salidasEsperas.test.ts`. El motivo del cobro frente a otro `422` del
 * MISMO agregado tampoco tiene prueba posible: el cobro no activa ninguna otra guarda de contenido de `:134`.
 */
