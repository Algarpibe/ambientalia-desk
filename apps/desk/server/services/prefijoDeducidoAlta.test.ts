import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { HttpError } from '../util/httpError'
import { createManagedTicket } from './ticketService'

/**
 * El alta DEDUCE el prefijo y lo IMPONE el servidor (RQ-TC-61, RQ-TC-62, RQ-TC-63; F1B-03).
 *
 * Tres cosas se fijan aquí, y las tres con el alta REAL sobre pg-mem, leyendo lo guardado con
 * `SELECT codigo_servicio, subject FROM tickets` (el detalle no expone `codigo_servicio`):
 *
 *   1. las cuatro ramas de la deducción y el día civil de Bogotá (RQ-TC-61);
 *   2. que el cuerpo NO decide prefijo, código ni asunto: se ignoran, no se rechazan (RQ-TC-62);
 *   3. que la deducción NO movió la escalera de guardas A < B < C < D (regla de mutación 1): tres
 *      pruebas que activan DOS condiciones a la vez, con un `prefijo` inválido en el cuerpo. Nacen
 *      verdes —la guarda del prefijo no existe—; su rojo sale por mutación (una guarda inventada
 *      en cada posición), no de forma natural.
 *
 * El día se fija sólo con `Date` falso (`toFake: ['Date']`), para no tocar los temporizadores de pg-mem.
 */

let db: Queryable

beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-14T12:00:00-05:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

async function fallo(fn: () => Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    await fn()
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: e.body as Record<string, unknown> }
    throw e
  }
  throw new Error('se esperaba un HttpError y la llamada no lanzó ninguno')
}

async function equipo(id = 'eq-1', serial = '18A20070', modelo = 'EDM180C'): Promise<void> {
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ($1,$2,'Grimm',$3,'Monitor')", [id, serial, modelo])
}

async function equipoConCliente(id: string, clientId: string): Promise<void> {
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo, client_id) VALUES ($1,'18A20070','Grimm','EDM180C','Monitor',$2)", [id, clientId])
}

async function cliente(id = 'cli-1'): Promise<void> {
  await db.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ($1,'Gecelca S.A. E.S.P.')", [id])
}

async function modeloCatalogo(id: string, marca: string, nombreModelo: string): Promise<void> {
  await db.query('INSERT INTO catalogo_marcas (id,nombre) VALUES ($1,$2)', [`${id}-marca`, marca])
  await db.query('INSERT INTO catalogo_tipos (id,nombre) VALUES ($1,$2)', [`${id}-tipo`, 'Monitor'])
  await db.query('INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ($1,$2,$3,$4)', [id, `${id}-marca`, nombreModelo, `${id}-tipo`])
}

/** Lo que el alta GUARDÓ: es lo que el servidor impone, no lo que el cuerpo pidió. */
async function guardado(): Promise<{ codigo_servicio: string; subject: string }> {
  return (await db.query('SELECT codigo_servicio, subject FROM tickets')).rows[0]
}

const MANT = 'Equipo para servicio de mantenimiento'
const CUERPO = { equipoId: 'eq-1', clientId: 'cli-1', clasificaciones: MANT, tipoServicio: 'Mantenimiento' }
const NUEVO = {
  clasificaciones: 'Equipo nuevo', tipoServicio: 'Mantenimiento', clientId: 'cli-1',
  equipoNuevo: { serial: 'SN-NUEVO-1', modeloId: 'mo-1', fechaFacturaCompra: '2026-01-15' },
}

describe('el alta deduce el prefijo (RQ-TC-61)', () => {
  it('Equipo nuevo → HV_', async () => {
    await modeloCatalogo('mo-1', 'Grimm', 'EDM180C'); await cliente()
    await createManagedTicket(db, NUEVO, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('HV_SN-NUEVO-1_EDM180C_261014')
  })

  it('Soporte remoto → SR_', async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, { ...CUERPO, clasificaciones: 'Soporte remoto' }, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('SR_18A20070_EDM180C_261014')
  })

  it('mantenimiento + Calibración → CG_', async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, { ...CUERPO, tipoServicio: 'Calibración' }, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('CG_18A20070_EDM180C_261014')
  })

  it('mantenimiento + Reparación → MT_', async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, { ...CUERPO, tipoServicio: 'Reparación' }, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('MT_18A20070_EDM180C_261014')
  })

  it('mantenimiento + Protocolo → PRO_S1_M1_261014', async () => {
    await equipo('eq-1', 'S1', 'M1'); await cliente()
    await createManagedTicket(db, { ...CUERPO, tipoServicio: 'Protocolo' }, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('PRO_S1_M1_261014')
  })

  it('el día es el de Bogotá a las 20:00-05:00 (en UTC ya es el 15) y a las 00:30-05:00', async () => {
    await equipo(); await cliente()
    vi.setSystemTime(new Date('2026-10-14T20:00:00-05:00'))
    await createManagedTicket(db, CUERPO, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('MT_18A20070_EDM180C_261014')
    await db.query('DELETE FROM tickets')
    vi.setSystemTime(new Date('2026-10-14T00:30:00-05:00'))
    await createManagedTicket(db, CUERPO, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('MT_18A20070_EDM180C_261014')
  })
})

describe('el cuerpo no decide prefijo, código ni asunto (RQ-TC-62)', () => {
  it('el prefijo del cuerpo se ignora: Equipo nuevo con prefijo CG da HV_', async () => {
    await modeloCatalogo('mo-1', 'Grimm', 'EDM180C'); await cliente()
    await createManagedTicket(db, { ...NUEVO, prefijo: 'CG' }, 'Admin')
    expect((await guardado()).codigo_servicio).toMatch(/^HV_/)
  })

  it('el código del cuerpo se ignora: se guarda el construido por el servidor', async () => {
    await modeloCatalogo('mo-1', 'Grimm', 'EDM180C'); await cliente()
    await createManagedTicket(db, { ...NUEVO, codigoServicio: 'CG_X_Y_260101' }, 'Admin')
    expect((await guardado()).codigo_servicio).toBe('HV_SN-NUEVO-1_EDM180C_261014')
  })

  it('el asunto del cuerpo se ignora: el guardado no contiene el texto tecleado', async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, { ...CUERPO, subject: 'Asunto tecleado a mano', codigoServicio: 'CG_X_Y_260101' }, 'Admin')
    const g = await guardado()
    expect(g.subject).not.toContain('Asunto tecleado a mano')
    expect(g.subject).toBe('Servicio Técnico Gecelca S.A. E.S.P. Monitor MT_18A20070_EDM180C_261014')
  })

  it('un prefijo inválido en el cuerpo ya no se rechaza: crea con el deducido', async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, { ...CUERPO, prefijo: 'XX' }, 'Admin')
    expect((await guardado()).codigo_servicio).toMatch(/^MT_/)
  })

  it('sin prefijo, crea; y sin cliente, tipo ni clasificaciones el 422 no dice «prefijo»', async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, CUERPO, 'Admin')
    expect((await guardado()).codigo_servicio).toMatch(/^MT_/)
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones')
    expect(String(r.body.error)).not.toContain('prefijo')
  })

  it('un cliente con los tres campos viejos sobre Soporte remoto crea con SR_', async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, {
      ...CUERPO, clasificaciones: 'Soporte remoto', prefijo: 'MT', codigoServicio: 'MT_a_b_260101', subject: 'x',
    }, 'Admin')
    expect((await guardado()).codigo_servicio).toMatch(/^SR_/)
  })
})

// La deducción no lanza y no mueve ninguna guarda (regla de mutación 1): cada prueba activa DOS
// condiciones a la vez, con un `prefijo` inválido que sólo una guarda inventada podría notar.
describe('la deducción no mueve la escalera de guardas (posición, M-17)', () => {
  it('(a) prefijo inválido + equipo↔cliente discrepante: gana el 422 de equipo↔cliente', async () => {
    await equipoConCliente('eq-1', 'cli-A'); await cliente('cli-B')
    const r = await fallo(() => createManagedTicket(db, { ...CUERPO, clientId: 'cli-B', prefijo: 'XX' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toContain('cli-A')
  })

  it('(b) prefijo inválido + obligatorios que faltan: el 422 exacto, sin «prefijo»', async () => {
    await equipo()
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', prefijo: 'XX' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones')
  })

  it('(c) prefijo inválido + OV ya asociada a otro ticket, el resto válido: 409', async () => {
    await equipo(); await cliente()
    await db.query("INSERT INTO tickets (id, number, subject, status, orden_venta) VALUES ('ocupado', 8101, 'x', 'Ingresado', 'OV-DUP')")
    const r = await fallo(() => createManagedTicket(db, { ...CUERPO, ordenVenta: 'OV-DUP', prefijo: 'XX' }, 'Admin'))
    expect(r.status).toBe(409)
  })

  // Refuerzo hallado por M-17.2: (b) sola no distingue una guarda puesta ENTRE los obligatorios y el
  // cliente (ya se habría lanzado el 422 de obligatorios). Con obligatorios completos y un cliente que
  // no está en Books, el que contesta es «Cliente no encontrado», no un prefijo.
  it('(b2) prefijo inválido + cliente que no está en Books: «Cliente no encontrado»', async () => {
    await equipo()
    const r = await fallo(() => createManagedTicket(db, { ...CUERPO, prefijo: 'XX' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Cliente no encontrado')
  })
})
