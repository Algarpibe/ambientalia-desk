import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createManagedTicket } from './services/ticketService'
import { crearContrato } from './db/contratos'
import { db, instalarArnes, appWith } from './testing/appHarness'
import { createUser } from './auth/users'
import { createRole } from './auth/roles'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'

instalarArnes()

/**
 * El borde de la vigencia en la prioridad al nacer, por el servicio real (prioridad-tres-niveles, F1B-07, L1;
 * `tickets-core` RQ-TC-24). CARACTERIZACIÓN con un ROJO esperado: «el día siguiente da Medium» cae mientras el alta lea
 * la prioridad del cuerpo, que aquí no se manda. La ampliación se hace por la ruta real, no con un `UPDATE`.
 * Reloj: sólo `Date`, como `ampliacionContratoPuertas.test.ts`. El alta no lleva orden de venta.
 */
const FIN = '2026-06-30'
const FIN_NUEVO = '2026-09-30'
const EL_DIA_DEL_FIN = '2026-06-30T15:00:00Z'
const EL_DIA_SIGUIENTE = '2026-07-01T15:00:00Z'
/** En UTC ya es el 1 de julio; en Bogotá (UTC-5) son las 22:00 del 30 de junio: la zona cuenta. */
const UTC_SIGUIENTE_MISMO_DIA_EN_ZONA = '2026-07-01T03:00:00Z'

afterEach(() => { vi.useRealTimers() })
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(EL_DIA_DEL_FIN)) })

const en = (instante: string) => vi.setSystemTime(new Date(instante))
const prioridad = async (): Promise<unknown> => (await db.query('SELECT priority FROM tickets')).rows[0].priority

async function sembrar(): Promise<number> {
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','18A20070','Grimm','EDM180C','Monitor')")
  await db.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ('cli-1','Gecelca S.A. E.S.P.')")
  return (await crearContrato(db, { clientId: 'cli-1', lote: 'OV-2026-170', fechaInicio: '2026-01-01', fechaFin: FIN, creadoPor: 'Comercial' })).id
}
const alta = () => createManagedTicket(db, { equipoId: 'eq-1', clientId: 'cli-1', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT' }, 'Admin')

/** El escritor REAL: la ruta HTTP de ampliación, con un usuario de Comercial y una sesión abierta con el reloj vigente. */
async function ampliar(contratoId: number): Promise<void> {
  const role = await createRole(db, { name: 'Comercial-vigencia', areas: ['Comercial'] })
  const u = await createUser(db, { email: 'com@x.co', name: 'Com', passwordHash: await hashPassword('password123'), roleId: role.id })
  const res = await request(appWith().app).post(`/api/contratos/${contratoId}/ampliar`).set('Cookie', `sid=${await createSession(db, u.id)}`)
    .send({ fechaFin: FIN_NUEVO, motivo: 'Prórroga acordada' })
  expect(res.status).toBe(200)
}

describe('prioridad al nacer · borde de la vigencia a través de createManagedTicket', () => {
  it('el día del fin nace High', async () => {
    await sembrar(); en(EL_DIA_DEL_FIN)
    await alta()
    expect(await prioridad()).toBe('High')
  })

  it('el día siguiente nace Medium', async () => {
    await sembrar(); en(EL_DIA_SIGUIENTE)
    await alta()
    expect(await prioridad()).toBe('Medium')
  })

  it('un instante que en UTC ya es el día siguiente y en la zona sigue siendo el del fin nace High', async () => {
    await sembrar(); en(UTC_SIGUIENTE_MISMO_DIA_EN_ZONA)
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-07-01') // en UTC ya es el día siguiente
    await alta()
    expect(await prioridad()).toBe('High')
  })

  it('con el fin movido por la ruta real, el día siguiente al fin original nace High', async () => {
    const id = await sembrar(); en(EL_DIA_DEL_FIN)
    await ampliar(id)
    en(EL_DIA_SIGUIENTE)
    await alta()
    expect(await prioridad()).toBe('High')
  })
})
