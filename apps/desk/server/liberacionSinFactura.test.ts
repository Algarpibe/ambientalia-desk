import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { CLAVE_MOTIVO_LIBERACION as MOTIVO, CLAVE_FECHA_PREVISTA_FACTURACION as FECHA, CLAVE_TEXTO_AUTORIZACION as TEXTO } from '@ambientalia/shared'
import { ticketRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { upsertTicket } from '@ambientalia/zoho-sync/db/repo'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * liberacion-sin-factura-motivo-fecha (F1C-05), lote 2 · «Liberación sin factura» por HTTP.
 *
 * Orden de precedencia A < B < C < D: el 409 de estado y los 403 de área y de cargo (escalón B) van ANTES del 422
 * agregado (escalón C, `apps/desk/server/services/ticketService.ts:134`), y dentro del 422 la presencia va delante de
 * la lista y de la fecha. Las pruebas de POSICIÓN (PL-1 a PL-4) llevan las dos guardas activas a la vez: con una sola,
 * mover la guarda no rompería nada (regla de mutación 1). PL-3 (lista contra «persona derivada inexistente») NO
 * existe: esta transición no declara el campo de derivación, así que esa guarda no puede dispararse y no hay par.
 */
const A = 'Fecha de corte de facturación del cliente'
const B = 'Servicio incluido en contrato con facturación periódica'
const C = 'Autorización excepcional de Dirección Comercial'
const M_LISTA = `El motivo debe ser uno de: ${A} · ${B} · ${C}`
const M_FECHA = `Fecha inválida en el campo: ${FECHA}`
const M_TEXTO = `Falta el texto de la autorización: es obligatorio con el motivo «${C}»`
const F_MOTIVO = 'Falta el campo obligatorio: Motivo'
const F_FECHA = `Falta el campo obligatorio: ${FECHA}`

const buenos = (extra: Record<string, unknown> = {}) => ({ comment: 'liberado', [MOTIVO]: A, [FECHA]: '2026-10-10', ...extra })
async function ticket(id = 't1', number = 4200, status = 'Por Facturar') {
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [id, number, 'Liberación', status])
}
async function liberar(values: Record<string, unknown>, cookie?: string, id = 't1') {
  const { app } = appWith()
  return request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie ?? await adminCookie()).send({ transitionId: 'liberacion_sin_factura', values })
}
type Fila = { status: string; liberacion_motivo: string | null; fecha_prevista_facturacion: Date | null; liberacion_sin_facturar: boolean | null; custom_fields: Record<string, unknown> }
const fila = async (id = 't1') => (await db.query('SELECT status, liberacion_motivo, fecha_prevista_facturacion, liberacion_sin_facturar, custom_fields FROM tickets WHERE id=$1', [id])).rows[0] as Fila
const dia = (d: Date | null) => new Date(d as Date).toISOString().slice(0, 10)
const trazas = async () => (await db.query("SELECT values FROM ticket_transitions WHERE transition_id='liberacion_sin_factura' ORDER BY id")).rows as { values: Record<string, unknown> }[]

describe('presencia, lista y fecha', () => {
  it('sin motivo y sin fecha: 422 con la presencia de cada uno, y el ticket no se mueve', async () => {
    await ticket()
    const res = await liberar({ comment: 'x' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([F_MOTIVO, F_FECHA])
    expect((await fila()).status).toBe('Por Facturar')
  })
  it.each([['fuera de la lista', 'Otro motivo'], ['mayúsculas, igualdad exacta', A.toUpperCase()]])('motivo %s: 422 con el mensaje de la lista', async (_n, motivo) => {
    await ticket()
    const res = await liberar(buenos({ [MOTIVO]: motivo }))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([M_LISTA])
  })
  it.each(['2026-02-30', '04/10/2026', '2026-10-10T08:00:00Z'])('fecha %s: 422 con la fecha inválida', async (fecha) => {
    await ticket()
    const res = await liberar(buenos({ [FECHA]: fecha }))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([M_FECHA])
  })
  it('una fecha pasada se acepta (E-nueva-1: la fecha futura no se exige)', async () => {
    await ticket()
    expect((await liberar(buenos({ [FECHA]: '2020-01-01' }))).status).toBe(200)
  })
})

describe('el texto de la autorización', () => {
  it.each([['ausente', {}], ['de sólo espacios', { [TEXTO]: '   ' }]])('el tercer motivo con texto %s: 422', async (_n, extra) => {
    await ticket()
    const res = await liberar(buenos({ [MOTIVO]: C, ...extra }))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([M_TEXTO])
  })
  it('el tercer motivo con texto: 200 y el texto recortado queda en custom_fields', async () => {
    await ticket()
    expect((await liberar(buenos({ [MOTIVO]: C, [TEXTO]: '  Autoriza la Dirección  ' }))).status).toBe(200)
    expect((await fila()).custom_fields[TEXTO]).toBe('Autoriza la Dirección')
  })
  it.each([A, B])('el motivo «%s» no exige texto', async (motivo) => {
    await ticket()
    expect((await liberar(buenos({ [MOTIVO]: motivo }))).status).toBe(200)
  })
})

describe('qué se escribe', () => {
  it('motivo y fecha a sus columnas, texto a custom_fields, los tres a la traza; la casilla histórica no se toca', async () => {
    await ticket()
    expect((await liberar(buenos({ [MOTIVO]: C, [TEXTO]: 'ok' }))).status).toBe(200)
    const f = await fila()
    expect(f.status).toBe('Por Entregar / Sin facturar')
    expect(f.liberacion_motivo).toBe(C)
    expect(dia(f.fecha_prevista_facturacion)).toBe('2026-10-10')
    expect(f.custom_fields[TEXTO]).toBe('ok')
    expect(f.liberacion_sin_facturar).toBeNull()
    expect((await trazas())[0].values).toMatchObject({ [MOTIVO]: C, [FECHA]: '2026-10-10', [TEXTO]: 'ok' })
  })
  it('una segunda liberación por otro motivo y sin texto deja custom_fields con null (D7) y suma otra fila de traza', async () => {
    await ticket()
    const admin = await adminCookie()
    await liberar(buenos({ [MOTIVO]: C, [TEXTO]: 'primera' }), admin)
    await db.query("UPDATE tickets SET status='Por Facturar' WHERE id='t1'")
    expect((await liberar(buenos({ [MOTIVO]: B, [FECHA]: '2026-11-01' }), admin)).status).toBe(200)
    const f = await fila()
    expect(f.custom_fields[TEXTO]).toBeNull()
    expect(f.liberacion_motivo).toBe(B)
    expect(dia(f.fecha_prevista_facturacion)).toBe('2026-11-01')
    expect((await trazas()).map((t) => t.values[MOTIVO])).toEqual([C, B])
  })
  it('una pasada del sincronizador con custom_fields vacío no borra el texto de una fila de la app', async () => {
    await ticket()
    await liberar(buenos({ [MOTIVO]: C, [TEXTO]: 'sobrevive' }))
    await upsertTicket(db, ticketRowFromZoho({ id: 't1', ticketNumber: '4200', status: 'Por Facturar', statusType: 'Open', subject: 'Zoho', customFields: {} } as never))
    const f = await fila()
    expect(f.custom_fields[TEXTO]).toBe('sobrevive')
    expect(f.liberacion_motivo).toBe(C)
  })
})

describe('posición de las guardas (regla de mutación 1), con motivo y fecha presentes y «Otro motivo»', () => {
  const malos = buenos({ [MOTIVO]: 'Otro motivo' })
  it('PL-1 · el 403 de cargo gana al 422 de la lista; el control con administrador sí recibe el 422', async () => {
    await ticket()
    const sinCargo = await liberar(malos, await userCookie(['Comercial']))
    expect(sinCargo.status).toBe(403)
    expect(sinCargo.body.error).toContain('Director Comercial')
    const control = await liberar(malos)
    expect(control.status).toBe(422)
    expect(control.body.errors).toEqual([M_LISTA])
  })
  it('PL-1 bis · el 403 de área gana al 422 de la lista (diferencia spec/diseño: sólo la spec lo pide)', async () => {
    await ticket()
    const res = await liberar(malos, await userCookie(['Servicio Técnico'], 'Director Comercial'))
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área')
  })
  it('PL-2 · CARACTERIZACIÓN: el 409 de estado gana al 422 de la lista', async () => {
    await ticket('t1', 4200, 'En Proceso')
    expect((await liberar(malos)).status).toBe(409)
  })
  it('PL-4 · sin fecha y fuera de lista: un solo 422 con la presencia DELANTE de la lista', async () => {
    await ticket()
    const res = await liberar({ comment: 'x', [MOTIVO]: 'Otro motivo' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([F_FECHA, M_LISTA])
  })
})
