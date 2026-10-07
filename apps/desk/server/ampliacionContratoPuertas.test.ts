import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { STATUS_TICKET_CREADO } from '@ambientalia/shared'
import { HttpError } from './util/httpError'
import { createManagedTicket, executeTransition } from './services/ticketService'
import { crearContrato } from './db/contratos'
import { upsertEquipo } from './db/equipos'
import { conRemisionVigente } from './testing/remisionDePrueba'
import { db, instalarArnes, appWith, equipoRow } from './testing/appHarness'
import { createUser } from './auth/users'
import { createRole } from './auth/roles'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'

instalarArnes()

/**
 * Efecto de ampliar un contrato en las TRES puertas de la subOV vencida (ampliacion-contrato, F1B-11;
 * `tickets-core` RQ-TC-55): alta de ticket, transición `habilitar_servicio` y remisión de entrada.
 *
 * CARACTERIZACIÓN: estas pruebas nacen verdes porque el efecto es consecuencia de lo ya construido (la ruta
 * `POST /api/contratos/:id/ampliar` escribe `fecha_fin` y las puertas ya leen el contrato). Discriminan porque se
 * mutan el escritor, la comparación y la zona (ver apply-progress del lote 4). La ampliación se hace SIEMPRE por la
 * ruta real, por HTTP y con un usuario de Comercial; nunca con un `UPDATE` a mano.
 *
 * Reloj: sólo `Date` (`toFake: ['Date']`), fechas absolutas de un mismo año. La sesión caduca contra `now()` de la
 * base (hipótesis b), así que cada salto de reloj abre una sesión nueva.
 */
const FIN = '2026-06-30'
const FIN_NUEVO = '2026-09-30'
const OV = 'OV-2026-170-01'
/** Sobre el tope del año del vencimiento (31/12), así que la ruta no cierra el plazo. */
const VENCIDO_EL = '2026-07-15T15:00:00Z'
const ANTES = '2026-09-15T15:00:00Z'
const MISMO_DIA = '2026-09-30T15:00:00Z'
/** En UTC ya es el 1 de octubre; en Bogotá (UTC-5) son las 22:00 del 30 de septiembre: la zona cuenta. */
const MISMO_DIA_UTC_SIGUIENTE = '2026-10-01T03:00:00Z'
const DIA_SIGUIENTE = '2026-10-01T15:00:00Z'

afterEach(() => { vi.useRealTimers() })
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(VENCIDO_EL)) })

let usuarios: { comercial: string; admin: string }
beforeEach(async () => {
  const role = await createRole(db, { name: 'Comercial-lote4', areas: ['Comercial'] })
  const pw = await hashPassword('password123')
  usuarios = {
    comercial: (await createUser(db, { email: 'com@x.co', name: 'Com', passwordHash: pw, roleId: role.id })).id,
    admin: (await createUser(db, { email: 'adm@x.co', name: 'Admin', passwordHash: pw, isAdmin: true })).id,
  }
})
/** Sesión nueva con el reloj actual: la anterior caduca contra `now()` de la base. */
const cookieDe = async (quien: 'comercial' | 'admin'): Promise<string> => `sid=${await createSession(db, usuarios[quien])}`
const en = (instante: string) => vi.setSystemTime(new Date(instante))

let contratoId = 0
const contratoVencido = async () => { contratoId = (await crearContrato(db, { clientId: 'cli-1', lote: 'OV-2026-170', fechaInicio: '2026-01-01', fechaFin: FIN, creadoPor: 'Comercial' })).id }
/** El escritor REAL: la ruta HTTP, con Comercial y el reloj vigente. */
const ampliar = async () => {
  const res = await request(appWith().app).post(`/api/contratos/${contratoId}/ampliar`).set('Cookie', await cookieDe('comercial'))
    .send({ fechaFin: FIN_NUEVO, motivo: 'Prórroga acordada' })
  expect(res.status).toBe(200)
}

type Resultado = { status: number; mensaje: string }
const deHttpError = async (fn: () => Promise<unknown>): Promise<Resultado> => {
  try { await fn() } catch (e) {
    if (e instanceof HttpError) return { status: e.status, mensaje: JSON.stringify(e.body) }
    throw e
  }
  return { status: 200, mensaje: '' }
}

/** Alta de ticket: `createManagedTicket` con la subOV del lote. */
const puertaAlta = async (): Promise<Resultado> => {
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','18A20070','Grimm','EDM180C','Monitor')")
  await db.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ('cli-1','Gecelca S.A. E.S.P.')")
  return deHttpError(() => createManagedTicket(db, { equipoId: 'eq-1', clientId: 'cli-1', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT', ordenVenta: OV }, 'Admin'))
}

/** Transición `habilitar_servicio` con la subOV del lote. */
const puertaTransicion = async (): Promise<Resultado> => {
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', ['t-1', 8611, 'Puerta de transición', STATUS_TICKET_CREADO])
  await conRemisionVigente(db, 't-1')
  return deHttpError(() => executeTransition(db, 't-1', { transitionId: 'habilitar_servicio', values: { Serial: '18A20070', 'Orden de Venta': OV } }, { areas: [], isAdmin: true, name: 'Admin', id: 'u-admin' }))
}

/** Remisión de entrada: `POST /api/remisiones` con una fecha coherente con el reloj (hipótesis c). */
const puertaRemision = async (): Promise<Resultado> => {
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli-1','Gecelca S.A. E.S.P.')")
  await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date) VALUES ('so-1',$1,'cli-1','Gecelca S.A. E.S.P.','2026-07-15')", [OV])
  await upsertEquipo(db, equipoRow('eq-rc', '18A20070'))
  await db.query("INSERT INTO tickets (id,number,subject,status,client_id,equipo_id) VALUES ('t-dest',7901,'La quiere','Ticket creado','cli-1','eq-rc')")
  const fecha = new Date().toISOString().slice(0, 10)
  const res = await request(appWith().app).post('/api/remisiones').set('Cookie', await cookieDe('admin'))
    .send({ ticketId: 't-dest', fecha, incluye: [], salesOrderId: 'so-1' })
  return { status: res.status, mensaje: JSON.stringify(res.body) }
}

const PUERTAS: [string, () => Promise<Resultado>, number][] = [
  ['alta de ticket', puertaAlta, 422],
  ['transición habilitar_servicio', puertaTransicion, 422],
  ['remisión de entrada', puertaRemision, 422],
]

describe.each(PUERTAS)('ampliación de contrato · puerta de %s (RQ-TC-55)', (_nombre, puerta) => {
  it('CONTROL · con el contrato vencido la puerta bloquea con el 422 de contrato vencido', async () => {
    await contratoVencido()
    const r = await puerta()
    expect(r.status).toBe(422)
    expect(r.mensaje).toContain(`venció el ${FIN}`)
  })

  it('tras ampliar con la ruta real, antes de la fecha nueva la misma puerta deja pasar', async () => {
    await contratoVencido(); await ampliar()
    en(ANTES)
    const r = await puerta()
    expect(r.mensaje).not.toContain('venció')
    expect(r.status).toBeLessThan(300)
  })

  it('el MISMO día de la fecha nueva todavía deja pasar (el extremo está incluido)', async () => {
    await contratoVencido(); await ampliar()
    en(MISMO_DIA)
    const r = await puerta()
    expect(r.mensaje).not.toContain('venció')
    expect(r.status).toBeLessThan(300)
  })

  it('la zona cuenta: a las 03:00Z del 1 de octubre en Bogotá sigue siendo la fecha nueva y deja pasar', async () => {
    await contratoVencido(); await ampliar()
    en(MISMO_DIA_UTC_SIGUIENTE)
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-10-01') // en UTC ya es el día siguiente
    const r = await puerta()
    expect(r.mensaje).not.toContain('venció')
    expect(r.status).toBeLessThan(300)
  })

  it('pasada la fecha nueva la puerta vuelve a bloquear, y el mensaje nombra la fecha NUEVA', async () => {
    await contratoVencido(); await ampliar()
    en(DIA_SIGUIENTE)
    const r = await puerta()
    expect(r.status).toBe(422)
    expect(r.mensaje).toContain(`venció el ${FIN_NUEVO}`)
    expect(r.mensaje).not.toContain(`venció el ${FIN}`)
  })
})
