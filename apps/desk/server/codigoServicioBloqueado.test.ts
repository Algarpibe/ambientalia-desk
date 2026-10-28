import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { CLAVE_CODIGO_SERVICIO, CLAVE_CODIGO_SERVICIO_ANTERIOR, MENSAJE_CODIGO_BLOQUEADO, transicionPorId } from '@ambientalia/shared'
import { PROMOTED_COLUMNS } from '@ambientalia/zoho-sync/db/rows'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'
import { etiquetaCampo } from './db/ticketFuentes'

instalarArnes()

/**
 * CÓDIGO DE SERVICIO BLOQUEADO (`codigo-servicio-bloqueado`), contra el servidor: con código ya fijado, sólo un administrador lo
 * cambia (`transitions-st` RQ-TS-65), con traza del previo (RQ-TS-66). La guarda va en `ticketService.ts:131`, tras la de
 * prioridad; las cinco pruebas PCS-1..PCS-5 activan DOS guardas a la vez (regla de mutación 1, RQ-TS-67).
 */
const ING = 'ingreso_a_servicio'
const ATAJO = 'calibracion_directa'
const ANTERIOR = 'MT_A_B_261001'
const OTRO = 'MT_A_C_261001'
const TEC = ['Servicio Técnico']
const encendido = () => appWith({ controlCalidadLiberacion: true }).app
const apagado = () => appWith({ controlCalidadLiberacion: false }).app

let numero = 9700
async function ticket(id: string, o: { codigo?: string | null; status?: string; tipo?: string | null; ov?: string | null } = {}) {
  numero += 1
  await db.query('INSERT INTO tickets (id, number, subject, status, tipo_servicio, orden_venta, codigo_servicio) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, numero, 'Código de servicio', o.status ?? 'Ingresado', 'tipo' in o ? o.tipo ?? null : 'Calibración', o.ov === undefined ? `OV-${id}` : o.ov, o.codigo === undefined ? ANTERIOR : o.codigo])
}
/** Valores que pasan los obligatorios de las dos transiciones; `Fecha Remisión Entrada` sale de las fechas del arnés. */
const valores = (transitionId: string, codigo: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> =>
  ({ ...valoresValidos(transicionPorId(transitionId)!, 1), [CLAVE_CODIGO_SERVICIO]: codigo, ...extra })
const ejecutar = (app: ReturnType<typeof encendido>, cookie: string, id: string, transitionId: string, values: Record<string, unknown>) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values })
const fila = async (id: string) => (await db.query('SELECT status, codigo_servicio, managed_by_app FROM tickets WHERE id=$1', [id])).rows[0] as { status: string; codigo_servicio: string | null; managed_by_app: boolean | null }
const trazas = async (id: string) => (await db.query('SELECT * FROM ticket_transitions WHERE ticket_id=$1 ORDER BY id', [id])).rows as Array<Record<string, unknown>>
const jsonDe = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v ?? {}) as Record<string, unknown>
const texto = (r: { body: { error?: string; errors?: string[] } }) => r.body.error ?? (r.body.errors ?? []).join(' | ')

describe('CB-1 (RQ-TS-65): un no administrador no cambia el código; 403 y nada escrito', () => {
  it.each([[ING], [ATAJO]])('%s: código distinto → 403 con el mensaje; estado y columna intactos, 0 trazas', async (tid) => {
    await ticket('c1')
    const res = await ejecutar(encendido(), await userCookie(TEC), 'c1', tid, valores(tid, OTRO))
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJE_CODIGO_BLOQUEADO)
    expect(await fila('c1')).toMatchObject({ status: 'Ingresado', codigo_servicio: ANTERIOR })
    expect(await trazas('c1')).toHaveLength(0)
  })

  it('un cargo de dirección no exime', async () => {
    await ticket('c2')
    const res = await ejecutar(encendido(), await userCookie(TEC, 'Director Técnico'), 'c2', ING, valores(ING, OTRO))
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJE_CODIGO_BLOQUEADO)
  })
})

describe('CB-2 (RQ-TS-65): el mismo valor, con espacios alrededor, pasa', () => {
  it('reenviar el código prellenado con espacios da 200 y no hay previo en la traza', async () => {
    await ticket('c3')
    const res = await ejecutar(encendido(), await userCookie(TEC), 'c3', ING, valores(ING, `  ${ANTERIOR}  `))
    expect(res.status).toBe(200)
    expect((await fila('c3')).status).toBe('Rev./Diagnostico')
    expect(jsonDe((await trazas('c3'))[0].values)[CLAVE_CODIGO_SERVICIO_ANTERIOR]).toBeUndefined()
  })
})

describe('CB-3 (RQ-TC-81): un ticket sin código acepta el primero, sea cual sea', () => {
  it.each([[null], [''], ['   ']])('código guardado %j: un no administrador lo fija con 200', async (guardado) => {
    await ticket('c4', { codigo: guardado })
    const res = await ejecutar(encendido(), await userCookie(TEC), 'c4', ING, valores(ING, OTRO))
    expect(res.status).toBe(200)
    expect((await fila('c4')).codigo_servicio).toBe(OTRO)
    expect(jsonDe((await trazas('c4'))[0].values)[CLAVE_CODIGO_SERVICIO_ANTERIOR]).toBeUndefined()
  })
})

describe('CB-4 (RQ-TS-65, RQ-TS-66): el administrador cambia el código y la traza guarda previo y nuevo', () => {
  it.each([[ING], [ATAJO]])('%s: 200, columna nueva, traza con previo y nuevo', async (tid) => {
    await ticket('c5')
    const res = await ejecutar(encendido(), await adminCookie(), 'c5', tid, valores(tid, OTRO))
    expect(res.status).toBe(200)
    expect((await fila('c5')).codigo_servicio).toBe(OTRO)
    const v = jsonDe((await trazas('c5'))[0].values)
    expect(v[CLAVE_CODIGO_SERVICIO]).toBe(OTRO)
    expect(v[CLAVE_CODIGO_SERVICIO_ANTERIOR]).toBe(ANTERIOR)
  })

  it('el administrador que reenvía el mismo valor, con espacios, no deja previo', async () => {
    await ticket('c6')
    const res = await ejecutar(encendido(), await adminCookie(), 'c6', ING, valores(ING, `  ${ANTERIOR}  `))
    expect(res.status).toBe(200)
    expect(jsonDe((await trazas('c6'))[0].values)[CLAVE_CODIGO_SERVICIO_ANTERIOR]).toBeUndefined()
  })
})

describe('CB-5 (RQ-TS-66): el previo es del servidor, no del cliente', () => {
  it('una clave «Código Servicio anterior» inyectada en un primer código no llega a la traza', async () => {
    await ticket('c7', { codigo: null })
    const res = await ejecutar(encendido(), await userCookie(TEC), 'c7', ING, valores(ING, OTRO, { [CLAVE_CODIGO_SERVICIO_ANTERIOR]: 'FALSO' }))
    expect(res.status).toBe(200)
    expect(jsonDe((await trazas('c7'))[0].values)[CLAVE_CODIGO_SERVICIO_ANTERIOR]).toBeUndefined()
  })

  it('el administrador que inyecta un previo falso deja el del ticket', async () => {
    await ticket('c8')
    const res = await ejecutar(encendido(), await adminCookie(), 'c8', ING, valores(ING, OTRO, { [CLAVE_CODIGO_SERVICIO_ANTERIOR]: 'FALSO' }))
    expect(res.status).toBe(200)
    expect(jsonDe((await trazas('c8'))[0].values)[CLAVE_CODIGO_SERVICIO_ANTERIOR]).toBe(ANTERIOR)
  })
})

describe('CB-6 (RQ-TS-65): vacío es obligatorio (422); sólo espacios es un cambio (403)', () => {
  it("«''» con código: 422 «Falta el campo obligatorio: Código Servicio», no 403", async () => {
    await ticket('c9')
    const res = await ejecutar(encendido(), await userCookie(TEC), 'c9', ING, valores(ING, ''))
    expect(res.status).toBe(422)
    expect(texto(res)).toContain('Falta el campo obligatorio: Código Servicio')
  })

  it('CB-6b · sólo espacios con código: 403 y el código guardado no cambia', async () => {
    await ticket('c10')
    const res = await ejecutar(encendido(), await userCookie(TEC), 'c10', ING, valores(ING, '   '))
    expect(res.status).toBe(403)
    expect((await fila('c10')).codigo_servicio).toBe(ANTERIOR)
    expect(await trazas('c10')).toHaveLength(0)
  })
})

describe('CB-7: la clave de la traza se enseña como etiqueta, y la guarda no toca otras transiciones', () => {
  it('CLAVE_CODIGO_SERVICIO es la label de codigo_servicio y etiquetaCampo deja intacta la clave anterior', () => {
    expect(PROMOTED_COLUMNS.find((c) => c.col === 'codigo_servicio')?.label).toBe(CLAVE_CODIGO_SERVICIO)
    expect(etiquetaCampo(CLAVE_CODIGO_SERVICIO_ANTERIOR)).toBe(CLAVE_CODIGO_SERVICIO_ANTERIOR)
  })

  it('una transición que no lleva el campo ignora la clave como hoy: 200 y el código no cambia', async () => {
    await ticket('c11', { status: 'Rev./Diagnostico' })
    const res = await ejecutar(encendido(), await userCookie(TEC), 'c11', 'escalado_a_revision', valores('escalado_a_revision', OTRO))
    expect(res.status).toBe(200)
    expect((await fila('c11')).codigo_servicio).toBe(ANTERIOR)
  })
})

describe('posición (RQ-TS-67, regla de mutación 1): cada prueba activa DOS guardas a la vez', () => {
  it('PCS-1 · el 403 de área gana al del código', async () => {
    await ticket('p1')
    const res = await ejecutar(encendido(), await userCookie(['Comercial']), 'p1', ING, valores(ING, OTRO))
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Tu rol no tiene permiso para esta transición')
    expect(res.body.error).not.toBe(MENSAJE_CODIGO_BLOQUEADO)
  })

  it('PCS-2 · el 403 del código gana al 422 del agregado (falta Fecha Remisión Entrada)', async () => {
    await ticket('p2')
    const sinFecha = valores(ING, OTRO); delete sinFecha['Fecha Remisión Entrada']
    const tec = await userCookie(TEC)
    const res = await ejecutar(encendido(), tec, 'p2', ING, sinFecha)
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(MENSAJE_CODIGO_BLOQUEADO)
    // contraste: con el mismo hueco, el administrador, o el código igual, responden el 422
    const admin = await ejecutar(encendido(), await adminCookie(), 'p2', ING, sinFecha)
    expect(admin.status).toBe(422)
    expect(texto(admin)).toContain('Fecha Remisión Entrada')
    const igual = valores(ING, ANTERIOR); delete igual['Fecha Remisión Entrada']
    const mismo = await ejecutar(encendido(), tec, 'p2', ING, igual)
    expect(mismo.status).toBe(422)
  })

  it('PCS-3 · el 409 de la condición (1) de calibracion_directa gana al 403 del código', async () => {
    await ticket('p3', { tipo: 'Mantenimiento' })
    const tec = await userCookie(TEC)
    const tipo = await ejecutar(encendido(), tec, 'p3', ATAJO, valores(ATAJO, OTRO))
    expect(tipo.status).toBe(409)
    expect(tipo.body.error).toContain('tipo de servicio Calibración')
    await ticket('p3b', { ov: null })
    const sinOV = await ejecutar(encendido(), tec, 'p3b', ATAJO, valores(ATAJO, OTRO))
    expect(sinOV.status).toBe(409)
    expect(sinOV.body.error).toContain('orden de venta')
    // con la condición cumplida, responde el 403 del código
    await ticket('p3c')
    expect((await ejecutar(encendido(), tec, 'p3c', ATAJO, valores(ATAJO, OTRO))).status).toBe(403)
  })

  it('PCS-4 · el 409 de estado gana al 403 del código', async () => {
    await ticket('p4', { status: 'Rev./Diagnostico' })
    const res = await ejecutar(encendido(), await userCookie(TEC), 'p4', ING, valores(ING, OTRO))
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('no aplica desde')
  })

  it('PCS-5 · el 409 del interruptor del atajo gana al 403 del código', async () => {
    await ticket('p5')
    const res = await ejecutar(apagado(), await userCookie(TEC), 'p5', ATAJO, valores(ATAJO, OTRO))
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('control de calidad, que está apagado')
  })
})
