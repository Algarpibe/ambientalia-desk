import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * anulado-con-motivo (F1C-01), lote 1 · «Anulación» por HTTP, en los tres flujos.
 *
 * Orden de precedencia A < B < C < D: el 409 de estado y los 403 de área y de cargo (escalón B) van ANTES del 422
 * agregado (escalón C, `apps/desk/server/services/ticketService.ts:134`), y dentro del 422 la presencia va delante de
 * la lista. La prueba de POSICIÓN (PA-1) lleva las dos guardas activas a la vez —un usuario sin Comercial y un motivo
 * fuera de la lista—: con una sola, mover la guarda no rompería nada (regla de mutación 1). Molde:
 * `liberacionSinFactura.test.ts`, PL-1 bis. Las claves y los motivos van escritos a mano a propósito: así la prueba
 * no depende de las constantes que está vigilando.
 */
const MOTIVO = 'Motivo de anulación'
const DETALLE = 'Detalle del motivo de anulación'
const M1 = 'El cliente no aprueba o se echa atrás'
const M2 = 'Sin solución técnica'
const M3 = 'Repuesto no disponible'
const M4 = 'Caducidad de espera: el cliente no responde ni retira el equipo'
const OTRO = 'Otro'
const M_LISTA = `El motivo debe ser uno de: ${M1} · ${M2} · ${M3} · ${M4} · ${OTRO}`
const M_DETALLE = 'Falta el detalle del motivo: es obligatorio con el motivo «Otro»'
const F_MOTIVO = 'Falta el campo obligatorio: Motivo'

async function ticket(id: string, number: number, status: string, classification: string | null = null) {
  await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)', [id, number, 'Anulación', status, classification])
}
async function anular(id: string, transitionId: string, values: Record<string, unknown>, cookie?: string) {
  const { app } = appWith()
  return request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie ?? await adminCookie()).send({ transitionId, values })
}
type Fila = { status: string; status_type: string | null; custom_fields: Record<string, unknown> | null }
const fila = async (id: string) => (await db.query('SELECT status, status_type, custom_fields FROM tickets WHERE id=$1', [id])).rows[0] as Fila
const trazas = async (id: string) => (await db.query('SELECT transition_id, to_status, values FROM ticket_transitions WHERE ticket_id=$1 ORDER BY id', [id])).rows as { transition_id: string; to_status: string; values: Record<string, unknown> }[]
const bueno = (extra: Record<string, unknown> = {}) => ({ comment: 'cliente no responde', [MOTIVO]: M2, ...extra })

describe('servicio · `anulacion` con un motivo de la lista', () => {
  it('Comercial anula desde Notificación cliente: 200, Anulado, status_type Closed, la traza y el custom_field llevan el motivo', async () => {
    await ticket('t1', 5100, 'Notificación cliente')
    const res = await anular('t1', 'anulacion', bueno(), await userCookie(['Comercial']))
    expect(res.status).toBe(200)
    const f = await fila('t1')
    expect(f.status).toBe('Anulado')
    expect(f.status_type).toBe('Closed')
    expect(f.custom_fields?.[MOTIVO]).toBe(M2)
    const t = await trazas('t1')
    expect(t).toHaveLength(1)
    expect(t[0]).toMatchObject({ transition_id: 'anulacion', to_status: 'Anulado' })
    expect(t[0].values).toMatchObject({ [MOTIVO]: M2 })
  })
  it.each(['En Espera de Repuestos', 'Servicio externo', 'Rev./Diagnostico', 'Notificación Comercial', 'Notificación cliente'])('se anula desde %s', async (origen) => {
    await ticket('t1', 5101, origen)
    expect((await anular('t1', 'anulacion', bueno())).status).toBe(200)
    expect((await fila('t1')).status).toBe('Anulado')
  })
  it.each([M1, M2, M3, M4])('el motivo «%s» pasa sin detalle', async (motivo) => {
    await ticket('t1', 5102, 'Servicio externo')
    expect((await anular('t1', 'anulacion', bueno({ [MOTIVO]: motivo }))).status).toBe(200)
  })
  it('«Otro» con detalle: 200 y el detalle queda en la traza', async () => {
    await ticket('t1', 5103, 'Rev./Diagnostico')
    expect((await anular('t1', 'anulacion', bueno({ [MOTIVO]: OTRO, [DETALLE]: 'El cliente se mudó' }))).status).toBe(200)
    expect((await trazas('t1'))[0].values).toMatchObject({ [MOTIVO]: OTRO, [DETALLE]: 'El cliente se mudó' })
  })
})

describe('servicio · el 422 del motivo, y el ticket no se mueve', () => {
  it('sin motivo: 422 con la presencia, y el ticket sigue donde estaba', async () => {
    await ticket('t1', 5110, 'En Espera de Repuestos')
    const res = await anular('t1', 'anulacion', { comment: 'x' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([F_MOTIVO])
    const f = await fila('t1')
    expect(f.status).toBe('En Espera de Repuestos')
    expect(await trazas('t1')).toEqual([])
  })
  it.each([['fuera de la lista', 'Creado por error'], ['duplicado', 'Duplicado'], ['mayúsculas, igualdad exacta', M2.toUpperCase()]])('motivo %s: 422 con la lista de motivos válidos', async (_n, motivo) => {
    await ticket('t1', 5111, 'Servicio externo')
    const res = await anular('t1', 'anulacion', bueno({ [MOTIVO]: motivo }))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([M_LISTA])
    expect((await fila('t1')).status).toBe('Servicio externo')
  })
  it.each([['ausente', {}], ['de sólo espacios', { [DETALLE]: '   ' }]])('«Otro» con detalle %s: 422', async (_n, extra) => {
    await ticket('t1', 5112, 'Rev./Diagnostico')
    const res = await anular('t1', 'anulacion', bueno({ [MOTIVO]: OTRO, ...extra }))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([M_DETALLE])
    expect((await fila('t1')).status).toBe('Rev./Diagnostico')
  })
})

describe('servicio · quién y desde dónde', () => {
  it('un usuario sin el área Comercial recibe 403 aunque el motivo sea válido', async () => {
    await ticket('t1', 5120, 'Notificación Comercial')
    const res = await anular('t1', 'anulacion', bueno(), await userCookie(['Servicio Técnico']))
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área')
    expect((await fila('t1')).status).toBe('Notificación Comercial')
  })
  it.each(['Solicitado', 'En espera de SKU inventario'])('desde %s no se anula: 409', async (origen) => {
    await ticket('t1', 5121, origen)
    const res = await anular('t1', 'anulacion', bueno())
    expect(res.status).toBe(409)
    expect((await fila('t1')).status).toBe(origen)
  })
  it('un anulado no tiene salida: ninguna transición aplica desde Anulado (409)', async () => {
    await ticket('t1', 5122, 'Notificación cliente')
    const admin = await adminCookie()
    await anular('t1', 'anulacion', bueno(), admin)
    expect((await anular('t1', 'anulacion', bueno(), admin)).status).toBe(409)
    expect((await anular('t1', 'rechazo_cliente', { comment: 'x' }, admin)).status).toBe(409)
  })
})

describe('posición de las guardas (regla de mutación 1), con el motivo fuera de la lista', () => {
  it('PA-1 · el 403 de área gana al 422 del motivo; el control con Comercial sí recibe el 422', async () => {
    await ticket('t1', 5130, 'Notificación Comercial')
    const malo = bueno({ [MOTIVO]: 'Creado por error' })
    const sinArea = await anular('t1', 'anulacion', malo, await userCookie(['Servicio Técnico']))
    expect(sinArea.status).toBe(403)
    expect(sinArea.body.error).toContain('área')
    const control = await anular('t1', 'anulacion', malo, await adminCookie())
    expect(control.status).toBe(422)
    expect(control.body.errors).toEqual([M_LISTA])
  })
  it('PA-2 · el 409 de estado gana al 422 del motivo', async () => {
    await ticket('t1', 5131, 'Solicitado')
    expect((await anular('t1', 'anulacion', bueno({ [MOTIVO]: 'Creado por error' }))).status).toBe(409)
  })
  it('PA-3 · sin motivo y «Otro» sin detalle no se mezclan: la presencia sola, un único 422', async () => {
    await ticket('t1', 5132, 'Servicio externo')
    const res = await anular('t1', 'anulacion', { comment: 'x', [DETALLE]: '' })
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([F_MOTIVO])
  })
})

describe('una anulación por cada flujo', () => {
  it('equipo nuevo · anulacion_equipo_nuevo desde Verificación: 200, Anulado, Closed, con el motivo en la traza', async () => {
    await ticket('en1', 5140, 'Verificación', 'Equipo nuevo')
    const res = await anular('en1', 'anulacion_equipo_nuevo', bueno({ [MOTIVO]: M3 }), await userCookie(['Comercial']))
    expect(res.status).toBe(200)
    const f = await fila('en1')
    expect(f.status).toBe('Anulado')
    expect(f.status_type).toBe('Closed')
    expect((await trazas('en1'))[0].values).toMatchObject({ [MOTIVO]: M3 })
  })
  it.each(['Ingresado', 'En Proceso', 'Notificado', 'Verificación'])('equipo nuevo · se anula desde %s', async (origen) => {
    await ticket('en1', 5141, origen, 'Equipo nuevo')
    expect((await anular('en1', 'anulacion_equipo_nuevo', bueno())).status).toBe(200)
  })
  it('equipo nuevo · el 403 de área gana al 422 del motivo, y un motivo fuera de la lista da 422', async () => {
    await ticket('en1', 5142, 'En Proceso', 'Equipo nuevo')
    const malo = bueno({ [MOTIVO]: 'Duplicado' })
    expect((await anular('en1', 'anulacion_equipo_nuevo', malo, await userCookie(['Servicio Técnico']))).status).toBe(403)
    const res = await anular('en1', 'anulacion_equipo_nuevo', malo)
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([M_LISTA])
  })
  it('soporte remoto · anulacion_soporte desde Pendiente: 200, Anulado, Closed, con el motivo en la traza', async () => {
    await ticket('sr1', 5150, 'Pendiente', 'Soporte remoto')
    const res = await anular('sr1', 'anulacion_soporte', bueno({ [MOTIVO]: M1 }), await userCookie(['Comercial']))
    expect(res.status).toBe(200)
    const f = await fila('sr1')
    expect(f.status).toBe('Anulado')
    expect(f.status_type).toBe('Closed')
    expect((await trazas('sr1'))[0].values).toMatchObject({ [MOTIVO]: M1 })
  })
  it('soporte remoto · se anula desde En Proceso; desde Solicitud Soporte no (S-3): 409', async () => {
    await ticket('sr1', 5151, 'En Proceso', 'Soporte remoto')
    const admin = await adminCookie()
    expect((await anular('sr1', 'anulacion_soporte', bueno(), admin)).status).toBe(200)
    await ticket('sr2', 5152, 'Solicitud Soporte', 'Soporte remoto')
    expect((await anular('sr2', 'anulacion_soporte', bueno(), admin)).status).toBe(409)
  })
  it('soporte remoto · el 403 de área gana al 422 del motivo, y «Otro» sin detalle da 422', async () => {
    await ticket('sr1', 5153, 'En Proceso', 'Soporte remoto')
    const malo = bueno({ [MOTIVO]: 'Duplicado' })
    expect((await anular('sr1', 'anulacion_soporte', malo, await userCookie(['Servicio Técnico']))).status).toBe(403)
    const res = await anular('sr1', 'anulacion_soporte', bueno({ [MOTIVO]: OTRO }))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([M_DETALLE])
  })
  it('una transición de servicio no anula un equipo nuevo: la guarda de flujo da 409', async () => {
    await ticket('en1', 5154, 'En Proceso', 'Equipo nuevo')
    expect((await anular('en1', 'anulacion', bueno())).status).toBe(409)
  })
})
