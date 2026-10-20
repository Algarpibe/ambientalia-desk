import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { transicionPorId, TRANSITIONS, CLAVES_SOLO_TRAZA_CC, CLAVE_MOTIVO_FIRMA_ADMIN, CLAVE_MOTIVO_RECHAZO_CC, CLAVE_GAS_CC, contarRetrabajos, type Cargo } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { createRole } from './auth/roles'
import { veredictoFirmaControlCalidad } from './services/controlCalidad'

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

/**
 * Segunda parte (lote 2b): quién firma, qué contenido exige la firma y dónde cae cada guarda. La firma es de
 * `aprobacion_control_calidad` y `rechazo_control_calidad`; el `403` de firmante va en `ticketService.ts:131` (tras el de
 * Decisionales, antes de la prioridad y de todo 422) y el `422` de contenido dentro del agregado de `:134`.
 */
const APROBACION = 'aprobacion_control_calidad'
const RECHAZO = 'rechazo_control_calidad'
const COORD: Cargo = 'Coordinador Técnico'
const ESPEC: Cargo = 'Especialista técnico'

interface Persona { id: string; nombre: string; cookie: string }
async function persona(nombre: string, o: { cargo?: Cargo | null; admin?: boolean; activo?: boolean; areas?: string[] } = {}): Promise<Persona> {
  const rol = o.admin ? null : await createRole(db, { name: `R-${nombre}`, areas: o.areas ?? ['Servicio Técnico'] })
  const u = await createUser(db, { email: `${nombre.toLowerCase()}@x.co`, name: nombre, passwordHash: await hashPassword('password123'), isAdmin: o.admin === true, roleId: rol?.id ?? null, cargoPermiso: o.cargo ?? null })
  if (o.activo === false) await db.query('UPDATE users SET active=false WHERE id=$1', [u.id])
  return { id: u.id, nombre, cookie: `sid=${await createSession(db, u.id)}` }
}
let numero = 9300
async function ticketCC(id: string, o: { derivadoA?: string; equipoId?: string; status?: string } = {}) {
  numero += 1
  await db.query('INSERT INTO tickets (id, number, subject, status, derivado_a, equipo_id) VALUES ($1,$2,$3,$4,$5,$6)', [id, numero, 'QA', o.status ?? 'Control de calidad', o.derivadoA ?? null, o.equipoId ?? null])
}
async function trazaDe(ticketId: string, transitionId: string, quien: Persona) {
  await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, performed_by, performed_by_id) VALUES ($1,$2,$3,$4,$5)', [ticketId, transitionId, transitionId, quien.nombre, quien.id])
}
const firmar = (cookie: string, id: string, transitionId: string, values?: Record<string, unknown>) =>
  request(encendido().app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values: values ?? valoresValidos(transicionPorId(transitionId)!, 1) })
const aprobacionCon = (extra: Record<string, unknown>) => ({ ...valoresValidos(transicionPorId(APROBACION)!, 1), ...extra })
const textoDe = (r: { body: { error?: string; errors?: string[] } }) => r.body.error ?? (r.body.errors ?? []).join(' | ')
const jsonDe = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v ?? {}) as Record<string, unknown>
const customFieldsDe = async (id: string) => jsonDe((await db.query('SELECT custom_fields FROM tickets WHERE id=$1', [id])).rows[0].custom_fields)
const valoresDeTraza = async (id: string, t: string) => jsonDe((await db.query('SELECT values FROM ticket_transitions WHERE ticket_id=$1 AND transition_id=$2 ORDER BY id DESC LIMIT 1', [id, t])).rows[0].values)

describe('quién firma (RQ-PM-33, RQ-PM-36): 403 de firmante, por HTTP', () => {
  it('el Coordinador Técnico que no intervino aprueba; la traza guarda su id', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('f1')
    const res = await firmar(c.cookie, 'f1', APROBACION)
    expect(res.status).toBe(200)
    expect(await estadoDe('f1')).toBe('Por Facturar')
    expect((await db.query('SELECT performed_by_id FROM ticket_transitions WHERE ticket_id=$1', ['f1'])).rows[0].performed_by_id).toBe(c.id)
  })

  it('M3 · el técnico asignado (derivado_a) no firma: 403 y no se mueve nada', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('f2', { derivadoA: c.id })
    const res = await firmar(c.cookie, 'f2', APROBACION)
    expect(res.status).toBe(403)
    expect(textoDe(res)).toContain('intervinieron')
    expect(await estadoDe('f2')).toBe('Control de calidad')
    expect((await db.query('SELECT 1 FROM ticket_transitions WHERE ticket_id=$1', ['f2'])).rows).toHaveLength(0)
  })

  it('M4 · quien envió a control de calidad (fila Operativa) no firma', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('f3'); await trazaDe('f3', ENVIO, c)
    const res = await firmar(c.cookie, 'f3', RECHAZO, { comment: 'x', [CLAVE_MOTIVO_RECHAZO_CC]: 'no cierra' })
    expect(res.status).toBe(403)
    expect(await estadoDe('f3')).toBe('Control de calidad')
  })

  it('una fila Decisional, de Compras / Logístico o Administrativa NO cuenta como intervención', async () => {
    const compras = TRANSITIONS.find((t) => t.tipoEvento === 'Compras / Logístico')!.id
    const c = await persona('Coord', { cargo: COORD })
    for (const [i, id] of [RECHAZO, compras, 'facturar'].entries()) {
      await ticketCC(`f4-${i}`); await trazaDe(`f4-${i}`, id, c)
      expect((await firmar(c.cookie, `f4-${i}`, APROBACION)).status, id).toBe(200)
    }
  })

  it('con un Coordinador activo, el Especialista no firma', async () => {
    await persona('Coord', { cargo: COORD }); const e = await persona('Espec', { cargo: ESPEC }); await ticketCC('f5')
    const res = await firmar(e.cookie, 'f5', APROBACION)
    expect(res.status).toBe(403)
    expect(textoDe(res)).toContain('Coordinador Técnico')
  })

  it('con el Coordinador inactivo la plaza está vacante y firma el Especialista', async () => {
    await persona('Coord', { cargo: COORD, activo: false }); const e = await persona('Espec', { cargo: ESPEC }); await ticketCC('f6')
    expect((await firmar(e.cookie, 'f6', APROBACION)).status).toBe(200)
  })

  it('M7 · un Técnico no firma, ni con la plaza vacante', async () => {
    const t = await persona('Tec', { cargo: 'Técnico' }); await ticketCC('f7')
    const res = await firmar(t.cookie, 'f7', APROBACION)
    expect(res.status).toBe(403)
    expect(textoDe(res)).toContain('Director Técnico')
  })

  it('M8 · el administrador no firma habiendo otro habilitado libre', async () => {
    await persona('Coord', { cargo: COORD }); const a = await persona('Jefa', { admin: true }); await ticketCC('f8')
    const res = await firmar(a.cookie, 'f8', APROBACION, aprobacionCon({ [CLAVE_MOTIVO_FIRMA_ADMIN]: 'de respaldo' }))
    expect(res.status).toBe(403)
    expect(textoDe(res)).toContain('administrador')
    expect(await estadoDe('f8')).toBe('Control de calidad')
  })

  it('el administrador firma de respaldo si el único Coordinador intervino', async () => {
    const c = await persona('Coord', { cargo: COORD }); const a = await persona('Jefa', { admin: true }); await ticketCC('f9', { derivadoA: c.id })
    expect((await firmar(a.cookie, 'f9', APROBACION, aprobacionCon({ [CLAVE_MOTIVO_FIRMA_ADMIN]: 'el Coordinador la trabajó' }))).status).toBe(200)
  })

  it('el administrador que intervino no firma ni de respaldo', async () => {
    const a = await persona('Jefa', { admin: true }); await ticketCC('f10'); await trazaDe('f10', ENVIO, a)
    expect((await firmar(a.cookie, 'f10', APROBACION, aprobacionCon({ [CLAVE_MOTIVO_FIRMA_ADMIN]: 'x' }))).status).toBe(403)
  })

  it('un administrador habilitado (Coordinador) que no intervino firma sin motivo extra', async () => {
    const a = await persona('Jefa', { admin: true, cargo: COORD }); await ticketCC('f11')
    expect((await firmar(a.cookie, 'f11', APROBACION)).status).toBe(200)
  })

  it('el usuario de Servicio Técnico sin cargo no firma el rechazo', async () => {
    const t = await persona('Sin'); await persona('Coord', { cargo: COORD }); await ticketCC('f12')
    expect((await firmar(t.cookie, 'f12', RECHAZO, { comment: 'x', [CLAVE_MOTIVO_RECHAZO_CC]: 'no' })).status).toBe(403)
  })

  it('M14 · con Decisionales por cargo encendido el 403 es el de firmante, no el de «es Decisional» (RQ-PM-35)', async () => {
    await persona('Coord', { cargo: COORD }); const t = await persona('Tec', { cargo: 'Técnico' }); await ticketCC('f13')
    const res = await request(appWith({ controlCalidadLiberacion: true, decisionalesPorCargo: true }).app).post('/api/tickets/f13/transition').set('Cookie', t.cookie)
      .send({ transitionId: APROBACION, values: valoresValidos(transicionPorId(APROBACION)!, 1) })
    expect(res.status).toBe(403)
    expect(textoDe(res)).toContain('la firma es de Coordinador Técnico')
    expect(textoDe(res)).not.toContain('Decisional')
  })

  it('sólo se consulta para las dos de firma: el envío no toca la base', async () => {
    const quemada = { query: () => { throw new Error('no debía consultar') } } as unknown as Queryable
    expect(await veredictoFirmaControlCalidad(quemada, transicionPorId(ENVIO)!, 'x', { id: 'u', name: 'U', isAdmin: false })).toBeNull()
  })
})

describe('contenido de la firma (RQ-PM-34, RQ-TS-48): 422 de escalón C', () => {
  it('M9 · el administrador de respaldo sin motivo (o con espacios) da 422 y no se mueve', async () => {
    const a = await persona('Jefa', { admin: true }); await ticketCC('c1'); await ticketCC('c2')
    for (const [id, v] of [['c1', { [CLAVE_MOTIVO_FIRMA_ADMIN]: '' }], ['c2', { [CLAVE_MOTIVO_FIRMA_ADMIN]: '   ' }]] as const) {
      const res = await firmar(a.cookie, id, APROBACION, aprobacionCon(v))
      expect(res.status, id).toBe(422)
      expect(textoDe(res)).toContain(CLAVE_MOTIVO_FIRMA_ADMIN)
      expect(await estadoDe(id)).toBe('Control de calidad')
    }
  })

  it('el administrador de respaldo con motivo firma; el motivo vive en la traza (RQ-TZ-23)', async () => {
    const a = await persona('Jefa', { admin: true }); await ticketCC('c3')
    const res = await firmar(a.cookie, 'c3', APROBACION, aprobacionCon({ [CLAVE_MOTIVO_FIRMA_ADMIN]: 'no hay habilitado' }))
    expect(res.status).toBe(200)
    expect((await valoresDeTraza('c3', APROBACION))[CLAVE_MOTIVO_FIRMA_ADMIN]).toBe('no hay habilitado')
  })

  it('las claves del acto no se escriben en tickets.custom_fields (aprobación y rechazo, S-17)', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('c4'); await ticketCC('c5')
    expect((await firmar(c.cookie, 'c4', APROBACION, aprobacionCon({ [CLAVE_GAS_CC]: true }))).status).toBe(200)
    const cf = await customFieldsDe('c4')
    for (const k of CLAVES_SOLO_TRAZA_CC) expect(cf, k).not.toHaveProperty(k)
    expect((await valoresDeTraza('c4', APROBACION))[CLAVE_GAS_CC]).toBe(true)
    expect((await firmar(c.cookie, 'c5', RECHAZO, { comment: 'x', [CLAVE_MOTIVO_RECHAZO_CC]: 'no cierra' })).status).toBe(200)
    expect(await customFieldsDe('c5')).not.toHaveProperty(CLAVE_MOTIVO_RECHAZO_CC)
    expect((await valoresDeTraza('c5', RECHAZO))[CLAVE_MOTIVO_RECHAZO_CC]).toBe('no cierra')
    expect(await estadoDe('c5')).toBe('En Proceso')
  })

  it('el rechazo con el motivo en blanco da 422; ausente, también', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('c6'); await ticketCC('c7')
    const blanco = await firmar(c.cookie, 'c6', RECHAZO, { comment: 'x', [CLAVE_MOTIVO_RECHAZO_CC]: '   ' })
    expect(blanco.status).toBe(422); expect(textoDe(blanco)).toContain(CLAVE_MOTIVO_RECHAZO_CC)
    expect((await firmar(c.cookie, 'c7', RECHAZO, { comment: 'x' })).status).toBe(422)
    expect(await estadoDe('c6')).toBe('Control de calidad')
  })

  async function equipoConGas(vigente: boolean) {
    await db.query("INSERT INTO equipos (id, serial, compuesto) VALUES ('eq1','SER-1','SO₂')")
    await db.query('INSERT INTO public.gases_patron (cilindro, compuesto, disponible, vence, registrado_por) VALUES ($1,$2,$3,$4,$5)', ['CIL-1', 'SO₂', true, vigente ? '2099-01-01' : '2020-01-01', 'director'])
  }
  it('M15 · con patrón vigente la casilla de gas se exige; marcada, pasa', async () => {
    await equipoConGas(true); const c = await persona('Coord', { cargo: COORD }); await ticketCC('g1', { equipoId: 'eq1' }); await ticketCC('g2', { equipoId: 'eq1' })
    const sin = await firmar(c.cookie, 'g1', APROBACION)
    expect(sin.status).toBe(422); expect(textoDe(sin)).toContain(CLAVE_GAS_CC)
    expect((await firmar(c.cookie, 'g2', APROBACION, aprobacionCon({ [CLAVE_GAS_CC]: true }))).status).toBe(200)
  })

  it('M15 · sin patrón vigente (vencido), sin equipo, o en el rechazo, la casilla de gas no se exige', async () => {
    await equipoConGas(false); const c = await persona('Coord', { cargo: COORD }); await ticketCC('g3', { equipoId: 'eq1' }); await ticketCC('g4'); await ticketCC('g5', { equipoId: 'eq1' })
    expect((await firmar(c.cookie, 'g3', APROBACION)).status).toBe(200)
    expect((await firmar(c.cookie, 'g4', APROBACION)).status).toBe(200)
    await db.query("UPDATE public.gases_patron SET vence='2099-01-01'")
    expect((await firmar(c.cookie, 'g5', RECHAZO, { comment: 'x', [CLAVE_MOTIVO_RECHAZO_CC]: 'no' })).status).toBe(200)
  })

  it('los errores van juntos: casilla sin marcar, gas y motivo en una sola respuesta', async () => {
    await equipoConGas(true); const a = await persona('Jefa', { admin: true }); await ticketCC('j1', { equipoId: 'eq1' })
    const v = aprobacionCon({ [CLAVE_MOTIVO_FIRMA_ADMIN]: '' }); delete v['Funcionamiento verificado']
    const res = await firmar(a.cookie, 'j1', APROBACION, v)
    expect(res.status).toBe(422)
    expect(res.body.errors).toHaveLength(3)
  })
})

describe('posición de las guardas nuevas (regla de mutación 1): cada prueba activa las dos a la vez', () => {
  it('CC-3 · sin el área Y sin ser firmante: contesta el 403 de área, no el de firmante', async () => {
    const c = await persona('Com', { areas: ['Comercial'] }); await persona('Coord', { cargo: COORD }); await ticketCC('x1')
    const res = await firmar(c.cookie, 'x1', APROBACION)
    expect(res.status).toBe(403)
    expect(textoDe(res)).toContain('Tu rol no tiene permiso')
  })

  it('CC-4 · no firmante Y checklist sin marcar: gana el 403 de firmante al 422', async () => {
    const t = await persona('Sin'); await persona('Coord', { cargo: COORD }); await ticketCC('x2')
    const v = aprobacionCon({}); delete v['Funcionamiento verificado']
    const res = await firmar(t.cookie, 'x2', APROBACION, v)
    expect(res.status).toBe(403)
    expect(textoDe(res)).toContain('Coordinador Técnico')
  })

  it('CC-5 · estado equivocado Y contenido inválido: contesta el 409 de estado', async () => {
    const a = await persona('Jefa', { admin: true }); await ticketCC('x3', { status: 'En Proceso' })
    expect((await firmar(a.cookie, 'x3', APROBACION, aprobacionCon({ [CLAVE_MOTIVO_FIRMA_ADMIN]: '', 'Funcionamiento verificado': false }))).status).toBe(409)
  })

  it('CC-6 · interruptor apagado Y cuerpo inválido (envío): contesta el 409, no el 422', async () => {
    const a = await persona('Jefa', { admin: true }); await ticketCC('x4', { status: 'En Proceso' })
    const res = await request(apagado().app).post('/api/tickets/x4/transition').set('Cookie', a.cookie).send({ transitionId: ENVIO, values: {} })
    expect(res.status).toBe(409)
  })
})

/**
 * Tercera parte (lote 2c): la prioridad tras el rechazo (RQ-TS-49), el aviso a los administradores (RQ-AV-24, S-12, S-13, S-18)
 * y la ruta del interruptor (RQ-PM-37). La prioridad se fija en `ticketService.ts:133`, en el mismo `UPDATE` de la transición;
 * el aviso sale tras escribir (`:155`), fuera de la transacción, y nunca tumba el envío.
 */
const prioridadDe = async (id: string) => ((await db.query('SELECT priority FROM tickets WHERE id=$1', [id])).rows[0] as { priority: string | null }).priority
const conPrioridad = (id: string, p: string) => db.query('UPDATE tickets SET priority=$1 WHERE id=$2', [p, id])
const motivoRechazo = { comment: 'x', [CLAVE_MOTIVO_RECHAZO_CC]: 'no cierra' }
const avisosDe = async (ticketId: string) => (await db.query('SELECT user_id, texto, enviado_at FROM avisos WHERE ticket_id=$1', [ticketId])).rows as Array<{ user_id: string; texto: string; enviado_at: unknown }>

describe('prioridad y retrabajo (RQ-TS-49, RQ-TZ-24)', () => {
  it('aprobado lleva a Por Facturar, con la fila de aprobación en la traza', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('r0')
    expect((await firmar(c.cookie, 'r0', APROBACION)).status).toBe(200)
    expect(await estadoDe('r0')).toBe('Por Facturar')
    expect((await db.query('SELECT 1 FROM ticket_transitions WHERE ticket_id=$1 AND transition_id=$2', ['r0', APROBACION])).rows).toHaveLength(1)
  })

  it('M11a · el rechazo sube la prioridad a High, con y sin priority en el cuerpo', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('r1'); await ticketCC('r2')
    await conPrioridad('r1', 'Medium'); await conPrioridad('r2', 'Medium')
    expect((await firmar(c.cookie, 'r1', RECHAZO, motivoRechazo)).status).toBe(200)
    expect((await firmar(c.cookie, 'r2', RECHAZO, { ...motivoRechazo, priority: 'Medium' })).status).toBe(200)
    for (const id of ['r1', 'r2']) { expect(await estadoDe(id), id).toBe('En Proceso'); expect(await prioridadDe(id), id).toBe('High') }
  })

  it('M11a · el rechazo sube también desde Low y desde una prioridad vacía', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('r3'); await ticketCC('r4')
    await conPrioridad('r3', 'Low')
    expect((await firmar(c.cookie, 'r3', RECHAZO, motivoRechazo)).status).toBe(200)
    expect((await firmar(c.cookie, 'r4', RECHAZO, motivoRechazo)).status).toBe(200)
    expect(await prioridadDe('r3')).toBe('High'); expect(await prioridadDe('r4')).toBe('High')
  })

  it('el firmante sin permiso de ajustar la prioridad puede rechazar: no hay 403 de prioridad y queda High', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('r5'); await conPrioridad('r5', 'Medium')
    const res = await firmar(c.cookie, 'r5', RECHAZO, motivoRechazo)
    expect(res.status).toBe(200); expect(await prioridadDe('r5')).toBe('High')
  })

  it('Urgent no se rebaja al rechazar', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('r6'); await conPrioridad('r6', 'Urgent')
    expect((await firmar(c.cookie, 'r6', RECHAZO, motivoRechazo)).status).toBe(200)
    expect(await prioridadDe('r6')).toBe('Urgent')
  })

  it('la aprobación no toca la prioridad', async () => {
    const c = await persona('Coord', { cargo: COORD }); await ticketCC('r7'); await conPrioridad('r7', 'Medium')
    expect((await firmar(c.cookie, 'r7', APROBACION)).status).toBe(200)
    expect(await prioridadDe('r7')).toBe('Medium')
  })

  it('el retrabajo queda en la traza y contarRetrabajos lo cuenta (envío, rechazo, envío, rechazo, envío, aprobación = 2)', async () => {
    const c = await persona('Coord', { cargo: COORD }); const a = await persona('Jefa', { admin: true }); await ticketCC('r8', { status: 'En Proceso' })
    for (const [quien, t, v] of [[a, ENVIO, undefined], [c, RECHAZO, motivoRechazo], [a, ENVIO, undefined], [c, RECHAZO, motivoRechazo], [a, ENVIO, undefined], [c, APROBACION, undefined]] as const) {
      expect((await firmar(quien.cookie, 'r8', t, v)).status, t).toBe(200)
    }
    const filas = (await db.query('SELECT transition_id FROM ticket_transitions WHERE ticket_id=$1 ORDER BY id', ['r8'])).rows as Array<{ transition_id: string }>
    expect(filas.map((f) => f.transition_id)).toEqual([ENVIO, RECHAZO, ENVIO, RECHAZO, ENVIO, APROBACION])
    expect(contarRetrabajos(filas.map((f) => ({ transitionId: f.transition_id })))).toBe(2)
    expect(await estadoDe('r8')).toBe('Por Facturar')
  })
})

describe('aviso a los administradores (RQ-AV-24, S-12, S-13, S-18)', () => {
  it('M10 · sin firmante libre: avisan los administradores ACTIVOS, no el actor, no el Director Técnico; sólo bandeja', async () => {
    const c = await persona('Coord', { cargo: COORD }); const actor = await persona('Actor', { admin: true })
    const otro = await persona('Otro', { admin: true }); await persona('Baja', { admin: true, activo: false }); await persona('Dir', { cargo: 'Director Técnico' })
    await ticketCC('v1', { status: 'En Proceso', derivadoA: c.id })
    expect((await firmar(actor.cookie, 'v1', ENVIO)).status).toBe(200)
    const avisos = await avisosDe('v1')
    expect(avisos.map((x) => x.user_id)).toEqual([otro.id])
    expect(avisos[0].texto).toContain('Control de calidad'); expect(avisos[0].texto).toContain('no queda nadie que pueda firmarlo')
    expect(avisos[0].enviado_at).toBeNull()
  })

  it('M10 · el aviso no va a nadie por ser Director Técnico, aunque sea el único con ese cargo', async () => {
    const c = await persona('Coord', { cargo: COORD }); const actor = await persona('Actor', { admin: true }); await persona('Dir', { cargo: 'Director Técnico' })
    await ticketCC('v2', { status: 'En Proceso', derivadoA: c.id })
    expect((await firmar(actor.cookie, 'v2', ENVIO)).status).toBe(200)
    expect(await avisosDe('v2')).toHaveLength(0)
  })

  it('con un habilitado libre que no intervino, no se avisa a nadie', async () => {
    await persona('Coord', { cargo: COORD }); const actor = await persona('Actor', { admin: true }); await persona('Otro', { admin: true })
    await ticketCC('v3', { status: 'En Proceso' })
    expect((await firmar(actor.cookie, 'v3', ENVIO)).status).toBe(200)
    expect(await avisosDe('v3')).toHaveLength(0)
  })

  it('sólo el envío avisa: el rechazo y la aprobación no crean el aviso de sin firmante', async () => {
    const c = await persona('Coord', { cargo: COORD }); await persona('Otro', { admin: true }); await ticketCC('v4'); await ticketCC('v5')
    await db.query('UPDATE tickets SET derivado_a=$1', [c.id])
    const a = await persona('Jefa', { admin: true })
    expect((await firmar(a.cookie, 'v4', APROBACION, aprobacionCon({ [CLAVE_MOTIVO_FIRMA_ADMIN]: 'respaldo' }))).status).toBe(200)
    expect((await firmar(a.cookie, 'v5', RECHAZO, { ...motivoRechazo })).status).toBe(200)
    for (const id of ['v4', 'v5']) expect((await avisosDe(id)).filter((x) => x.texto.includes('no queda nadie')), id).toHaveLength(0)
  })

  it('S-18 · si el aviso falla, el envío responde 200 y la transición queda escrita', async () => {
    const c = await persona('Coord', { cargo: COORD }); const actor = await persona('Actor', { admin: true }); await persona('Otro', { admin: true })
    await ticketCC('v6', { status: 'En Proceso', derivadoA: c.id })
    const rota: Queryable = { query: (sql, params) => (/INSERT INTO avisos/.test(sql) ? Promise.reject(new Error('avisos caída')) : db.query(sql, params)) }
    const res = await request(appWith({ controlCalidadLiberacion: true }, rota).app).post('/api/tickets/v6/transition').set('Cookie', actor.cookie)
      .send({ transitionId: ENVIO, values: valoresValidos(transicionPorId(ENVIO)!, 1) })
    expect(res.status).toBe(200)
    expect(await estadoDe('v6')).toBe('Control de calidad')
    expect(await avisosDe('v6')).toHaveLength(0)
  })
})

describe('ruta del interruptor (RQ-PM-37)', () => {
  it('devuelve { activo } igual a la configuración; sin sesión, 401', async () => {
    const cookie = await adminCookie()
    const pedir = (activo: boolean) => request(appWith({ controlCalidadLiberacion: activo }).app).get('/api/permisos/control-calidad').set('Cookie', cookie)
    const apagadoRes = await pedir(false); expect(apagadoRes.status).toBe(200); expect(apagadoRes.body).toEqual({ activo: false })
    const encendidoRes = await pedir(true); expect(encendidoRes.status).toBe(200); expect(encendidoRes.body).toEqual({ activo: true })
    expect((await request(encendido().app).get('/api/permisos/control-calidad')).status).toBe(401)
  })
})
