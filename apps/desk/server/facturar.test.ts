import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { CLAVE_NUMERO_FACTURA as NUMERO, CLAVE_FECHA_FACTURA as FECHA, EXCEPCIONES_POR_CARGO } from '@ambientalia/shared'
import { PROMOTED_COLUMNS } from '@ambientalia/zoho-sync/db/rows'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * facturar-dos-ramas (F1C-02), lote 1 · «Facturar» por HTTP (RQ-TS-42, `design.md` D3).
 *
 * Orden de precedencia de F1B-10: el `409` de estado y el `403` de área (escalón B) van ANTES del `422` agregado
 * (escalón C, `apps/desk/server/services/ticketService.ts:134`), y dentro del `422` la presencia va delante del
 * contenido. Las pruebas de POSICIÓN llevan dos guardas activas a la vez: con una sola, mover la guarda no rompería
 * nada (regla de mutación 1).
 */
const M_NUMERO = 'Falta el número de factura: no puede quedar en blanco'
const M_FECHA = `Fecha inválida en el campo: ${FECHA}`
const F_NUMERO = `Falta el campo obligatorio: ${NUMERO}`
const F_FECHA = `Falta el campo obligatorio: ${FECHA}`

const buenos = (extra: Record<string, unknown> = {}) => ({ comment: 'facturado', [NUMERO]: 'FV-1234', [FECHA]: '2027-01-20', ...extra })
async function ticket(status = 'Pendiente de facturar', id = 't1') {
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [id, 4300, 'Facturar', status])
}
async function facturar(values: Record<string, unknown>, cookie?: string, id = 't1') {
  const { app } = appWith()
  return request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie ?? await adminCookie()).send({ transitionId: 'facturar', values })
}
type Fila = { status: string; status_type: string; fecha_factura: Date | null; custom_fields: Record<string, unknown> }
const fila = async (id = 't1') => (await db.query('SELECT status, status_type, fecha_factura, custom_fields FROM tickets WHERE id=$1', [id])).rows[0] as Fila
const dia = (d: Date | null) => new Date(d as Date).toISOString().slice(0, 10)

describe('«Facturar» registra la factura y su fecha y cierra el ticket', () => {
  it('la fecha va a la columna fecha_factura y el número no tiene columna (S-1)', () => {
    expect(PROMOTED_COLUMNS.find((p) => p.label === FECHA)?.col).toBe('fecha_factura')
    expect(PROMOTED_COLUMNS.some((p) => p.label === NUMERO)).toBe(false)
  })
  it('Comercial factura: 200, Finalizado y Closed, fecha_factura y el número en custom_fields y en la traza', async () => {
    await ticket()
    const res = await facturar(buenos(), await userCookie(['Comercial']))
    expect(res.status).toBe(200)
    const f = await fila()
    expect([f.status, f.status_type, dia(f.fecha_factura), f.custom_fields[NUMERO]]).toEqual(['Finalizado', 'Closed', '2027-01-20', 'FV-1234'])
    const traza = (await db.query("SELECT from_status, to_status, area, values FROM ticket_transitions WHERE transition_id='facturar'")).rows as Array<{ from_status: string; to_status: string; area: string; values: Record<string, unknown> }>
    expect(traza).toHaveLength(1)
    expect([traza[0]!.from_status, traza[0]!.to_status, traza[0]!.area, traza[0]!.values[NUMERO], traza[0]!.values[FECHA]])
      .toEqual(['Pendiente de facturar', 'Finalizado', 'Comercial', 'FV-1234', '2027-01-20'])
  })
})

describe('«Facturar» sin factura o sin fecha no pasa', () => {
  it.each([
    ['sin número', { [NUMERO]: undefined }, [F_NUMERO]],
    ['con número vacío', { [NUMERO]: '' }, [F_NUMERO]],
    ['con número de sólo espacios', { [NUMERO]: '   ' }, [M_NUMERO]],
    ['sin fecha', { [FECHA]: undefined }, [F_FECHA]],
    ['con fecha imposible', { [FECHA]: '2027-02-30' }, [M_FECHA]],
    ['con fecha que no es fecha', { [FECHA]: '20/01/2027' }, [M_FECHA]],
  ])('%s: 422 y el ticket no se mueve', async (_n, extra, errores) => {
    await ticket()
    const res = await facturar(buenos(extra))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual(errores)
    expect((await fila()).status).toBe('Pendiente de facturar')
  })
})

describe('área y cargo', () => {
  it('Servicio Técnico no factura: 403 de área y el ticket no se mueve', async () => {
    await ticket()
    const res = await facturar(buenos(), await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Comercial')
    expect((await fila()).status).toBe('Pendiente de facturar')
  })
  it('no tiene excepción de cargo: Comercial sin cargo factura (S-2)', async () => {
    expect(Object.hasOwn(EXCEPCIONES_POR_CARGO.transiciones, 'facturar')).toBe(false)
    await ticket()
    expect((await facturar(buenos(), await userCookie(['Comercial'], null))).status).toBe(200)
  })
})

describe('posición de las guardas (F1B-10, regla de mutación 1)', () => {
  it('desde otro estado, Servicio Técnico sin número: 409 de estado, antes que el 403 y el 422', async () => {
    await ticket('Por Facturar')
    const res = await facturar(buenos({ [NUMERO]: '  ' }), await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('no aplica desde el estado "Por Facturar"')
  })
  it('en Pendiente de facturar, Servicio Técnico con número de espacios: 403 de área, antes que el 422', async () => {
    await ticket()
    const res = await facturar(buenos({ [NUMERO]: '  ' }), await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(403)
  })
  it('Comercial sin fecha y con número de espacios: un solo 422, la presencia de la fecha antes que el contenido del número', async () => {
    await ticket()
    const res = await facturar(buenos({ [NUMERO]: '  ', [FECHA]: undefined }), await userCookie(['Comercial']))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([F_FECHA, M_NUMERO])
  })
})
