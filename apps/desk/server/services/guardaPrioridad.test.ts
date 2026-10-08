import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { MENSAJE_PRIORIDAD_BLOQUEADA, type Cargo } from '@ambientalia/shared'
import { HttpError } from '../util/httpError'
import { executeTransition } from './ticketService'

/**
 * GUARDA DE PRIORIDAD DEL TÉCNICO (F1B-07, lote 2a; `transitions-st` RQ-TS-20, RQ-TS-21, RQ-TS-22), a nivel de unidad.
 *
 * `priority` deja de ser obligatorio en `escalado_a_revision` y `devolucion_a_correccion` y el técnico ya no puede
 * CAMBIARLA ahí: quien no cumple `puedeFijarPrioridadTop5` recibe `403` con `MENSAJE_PRIORIDAD_BLOQUEADA`.
 *
 * Las pruebas de POSICIÓN (TS22-1 a TS22-3) activan DOS guardas a la vez, a propósito: con una sola, mover la guarda de
 * sitio no rompería nada (regla de mutación 1). El orden entre esta 403 y la 403 de cargo es inobservable: la única
 * excepción de cargo (`liberacion_sin_factura`) no tiene campo de prioridad.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

type Sujeto = { areas: string[]; isAdmin: boolean; cargoPermiso?: Cargo | null; name: string; id: string }
const ADMIN: Sujeto = { areas: [], isAdmin: true, name: 'Admin', id: 'u-admin' }
const SERVICIO: Sujeto = { areas: ['Servicio Técnico'], isAdmin: false, name: 'Tec', id: 'u-tec' }
const COMERCIAL: Sujeto = { areas: ['Comercial'], isAdmin: false, name: 'Com', id: 'u-com' }
const DC_AMBAS: Sujeto = { areas: ['Servicio Técnico', 'Comercial'], isAdmin: false, cargoPermiso: 'Director Comercial', name: 'DC', id: 'u-dc' }
const DC_SOLO_COMERCIAL: Sujeto = { areas: ['Comercial'], isAdmin: false, cargoPermiso: 'Director Comercial', name: 'DCc', id: 'u-dcc' }

const ESCALADO = 'escalado_a_revision' // Rev./Diagnostico → Notificado, Servicio Técnico
const DEVOLUCION = 'devolucion_a_correccion' // Notificado → Rev./Diagnostico, Servicio Técnico
const AREA_ST = 'Tu rol no tiene permiso para esta transición (área: Servicio Técnico)'

async function fallo(fn: () => Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  try { await fn() } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: e.body as Record<string, unknown> }
    throw e
  }
  throw new Error('se esperaba un HttpError y la llamada no lanzó ninguno')
}
async function ticket(estado: string, priority: string | null): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, subject, status, priority) VALUES ($1,$2,$3,$4,$5)', ['t1', 8200, 'Guarda de prioridad', estado, priority])
}
const estado = async () => ((await db.query("SELECT status, priority FROM tickets WHERE id='t1'")).rows[0] as { status: string; priority: string | null })
const trazas = async () => (await db.query("SELECT 1 FROM ticket_transitions WHERE ticket_id='t1'")).rows.length

describe('RQ-TS-21 · el técnico no cambia la prioridad', () => {
  it.each([[ESCALADO, 'Rev./Diagnostico', { 'Días de entrega': 5 }], [DEVOLUCION, 'Notificado', {}]])(
    'TS21-1/2 · %s: Low → High sin permiso es 403 y no cambia estado, prioridad ni traza', async (tid, desde, extra) => {
      await ticket(desde, 'Low')
      const r = await fallo(() => executeTransition(db, 't1', { transitionId: tid, values: { priority: 'High', ...extra } }, SERVICIO))
      expect(r.status).toBe(403)
      expect(r.body.error).toBe(MENSAJE_PRIORIDAD_BLOQUEADA)
      expect(await estado()).toEqual({ status: desde, priority: 'Low' })
      expect(await trazas()).toBe(0)
    })

  it('TS21-3 · la MISMA prioridad pasa', async () => {
    await ticket('Rev./Diagnostico', 'Low')
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'Low', 'Días de entrega': 5 } }, SERVICIO)
    expect(await estado()).toEqual({ status: 'Notificado', priority: 'Low' })
  })

  it('TS21-4 · sin el campo pasa', async () => {
    await ticket('Rev./Diagnostico', 'Low')
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: { 'Días de entrega': 5 } }, SERVICIO)
    expect((await estado()).status).toBe('Notificado')
  })

  it('TS21-5 · ticket sin prioridad y el técnico manda Medium: 403', async () => {
    await ticket('Rev./Diagnostico', null)
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'Medium', 'Días de entrega': 5 } }, SERVICIO))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe(MENSAJE_PRIORIDAD_BLOQUEADA)
  })

  it('TS21-6 · el administrador cambia la prioridad', async () => {
    await ticket('Rev./Diagnostico', 'Low')
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, ADMIN)
    expect(await estado()).toEqual({ status: 'Notificado', priority: 'High' })
  })

  it('TS21-7 · Servicio Técnico + Comercial + Director Comercial cambia la prioridad', async () => {
    await ticket('Rev./Diagnostico', 'Low')
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, DC_AMBAS)
    expect((await estado()).priority).toBe('High')
  })

  it('TS21-8 · Director Comercial SÓLO con Comercial: 403 de ÁREA, no el de prioridad', async () => {
    await ticket('Rev./Diagnostico', 'Low')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, DC_SOLO_COMERCIAL))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe(AREA_ST)
  })

  it('TS21-9 · base sin ningún cargo asignado: el técnico sigue bloqueado y el administrador cambia', async () => {
    await ticket('Rev./Diagnostico', 'Low')
    expect((await db.query('SELECT 1 FROM users WHERE cargo_permiso IS NOT NULL')).rows).toEqual([])
    expect((await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, SERVICIO))).status).toBe(403)
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, ADMIN)
    expect((await estado()).priority).toBe('High')
  })

  it('TS21-10 · en una transición sin campo de prioridad, un priority en el cuerpo no interviene', async () => {
    await ticket('Ingresado', 'Low')
    await executeTransition(db, 't1', { transitionId: 'ingreso_a_servicio', values: { priority: 'High', 'Código Servicio': 'CG_A123_260812', 'Fecha creación ticket': '2026-08-12', 'Fecha Remisión Entrada': '2026-08-12' } }, SERVICIO)
    expect((await estado()).status).toBe('Rev./Diagnostico')
  })
})

describe('RQ-TS-20 · sin prioridad no hay error', () => {
  it.each([[ESCALADO, 'Rev./Diagnostico', { 'Días de entrega': 5 }, 'Notificado'], [DEVOLUCION, 'Notificado', {}, 'Rev./Diagnostico']])(
    'TS20-1/2 · %s sin priority se ejecuta', async (tid, desde, values, hasta) => {
      await ticket(desde, 'Low')
      await executeTransition(db, 't1', { transitionId: tid, values }, SERVICIO)
      expect((await estado()).status).toBe(hasta)
    })
})

describe('RQ-TS-22 · POSICIÓN de la guarda de prioridad: cada prueba activa DOS guardas', () => {
  it('TS22-1 · área gana: sin Servicio Técnico Y con prioridad distinta, el 403 NOMBRA EL ÁREA', async () => {
    await ticket('Rev./Diagnostico', 'Low')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, COMERCIAL))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe(AREA_ST)
  })

  it('TS22-2 · la guarda gana al 422: técnico con priority distinta Y sin «Días de entrega» recibe el 403 de prioridad', async () => {
    await ticket('Rev./Diagnostico', 'High')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'Low' } }, SERVICIO))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe(MENSAJE_PRIORIDAD_BLOQUEADA)
  })

  it('TS22-3 · estado gana: ticket en Ingresado Y técnico con priority distinta → 409', async () => {
    await ticket('Ingresado', 'Low')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, SERVICIO))
    expect(r.status).toBe(409)
  })
})

describe('prioridad-tres-niveles · el Director Técnico cambia la prioridad en la transición y la lista se impone (D9, S-K)', () => {
  const DT_ST: Sujeto = { areas: ['Servicio Técnico'], isAdmin: false, cargoPermiso: 'Director Técnico', name: 'DT', id: 'u-dt' }
  const DT_SIN_ST: Sujeto = { areas: ['Comercial'], isAdmin: false, cargoPermiso: 'Director Técnico', name: 'DTc', id: 'u-dtc' }
  const TECNICO: Sujeto = { ...SERVICIO, cargoPermiso: 'Técnico' }
  const LISTA = 'La prioridad debe ser una de: High, Medium'

  it.each([[ESCALADO, 'Rev./Diagnostico', { 'Días de entrega': 5 }, 'Notificado'], [DEVOLUCION, 'Notificado', {}, 'Rev./Diagnostico']])(
    'el Director Técnico (con Servicio Técnico) cambia la prioridad en %s', async (tid, desde, extra, hasta) => {
      await ticket(desde, 'Medium')
      await executeTransition(db, 't1', { transitionId: tid, values: { priority: 'High', ...extra } }, DT_ST)
      expect(await estado()).toEqual({ status: hasta, priority: 'High' })
    })

  it('un técnico (cargo Técnico) recibe 403 con el mensaje nuevo y nada cambia', async () => {
    await ticket('Rev./Diagnostico', 'Medium')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, TECNICO))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe('La prioridad del ticket la ajustan el Director Comercial o el Director Técnico: tu cargo no puede cambiarla en esta etapa')
    expect(await estado()).toEqual({ status: 'Rev./Diagnostico', priority: 'Medium' })
  })

  it('T4 · POSICIÓN área < prioridad · Director Técnico SIN Servicio Técnico Y prioridad distinta: 403 que NOMBRA EL ÁREA', async () => {
    await ticket('Rev./Diagnostico', 'Medium')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High', 'Días de entrega': 5 } }, DT_SIN_ST))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe(AREA_ST)
  })

  it('T5 · POSICIÓN prioridad < 422 · Director Técnico con prioridad distinta Y sin «Días de entrega»: 422, no 403', async () => {
    await ticket('Rev./Diagnostico', 'Medium')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'High' } }, DT_ST))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual(expect.any(Array)) // el 422 agregado, no el 403 de prioridad
  })

  it.each(['Low', 'Urgent'])('D9 · %s pedida por quien tiene permiso (administrador) es 422 con la lista, y nada cambia', async (mala) => {
    await ticket('Rev./Diagnostico', 'High')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: mala, 'Días de entrega': 5 } }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toContain(LISTA)
    expect(await estado()).toEqual({ status: 'Rev./Diagnostico', priority: 'High' })
    expect(await trazas()).toBe(0)
  })

  it.each(['Low', 'Urgent'])('D9 · reenviar la MISMA prioridad heredada %s pasa (el formulario la devuelve tal cual)', async (heredada) => {
    await ticket('Rev./Diagnostico', heredada)
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: heredada, 'Días de entrega': 5 } }, ADMIN)
    expect(await estado()).toEqual({ status: 'Notificado', priority: heredada })
  })
})

describe('prioridad-tres-niveles · POSICIÓN de D9: el permiso (B) gana a la lista (C)', () => {
  it('técnico sin permiso Y prioridad fuera de la lista: 403 de prioridad, no 422', async () => {
    await ticket('Rev./Diagnostico', 'High')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: { priority: 'Low', 'Días de entrega': 5 } }, SERVICIO))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe(MENSAJE_PRIORIDAD_BLOQUEADA)
  })
})
