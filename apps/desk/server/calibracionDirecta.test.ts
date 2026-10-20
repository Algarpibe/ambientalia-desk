import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { transicionPorId, calcularIndicadores, type Cargo, type PasoDelHistorial } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'
import { createUser } from './auth/users'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { createRole } from './auth/roles'

instalarArnes()

/**
 * CALIBRACIÓN DIRECTA (F1C-08), contra el servidor. El atajo `calibracion_directa` (`Ingresado` → `En Proceso`) y su escape
 * `falla_calibracion` (`En Proceso` → `Rev./Diagnostico`) cuelgan de `CONTROL_CALIDAD_LIBERACION`. Las guardas van en
 * `ticketService.ts:128` (interruptor y condición (1), escalón B, `409`) y `:134` (descripción en blanco, escalón C, `422`).
 * Cada prueba de posición (CD-1..CD-6) activa DOS guardas a la vez (regla de mutación 1).
 */
const ATAJO = 'calibracion_directa'
const ESCAPE = 'falla_calibracion'
const DESC = 'Descripción de la falla'
const encendido = () => appWith({ controlCalidadLiberacion: true }).app
const apagado = () => appWith({ controlCalidadLiberacion: false }).app

let numero = 9500
async function ticket(id: string, o: { status?: string; tipo?: string | null; ov?: string | null; so?: string | null } = {}) {
  numero += 1
  const tipo = 'tipo' in o ? o.tipo : 'Calibración'
  await db.query('INSERT INTO tickets (id, number, subject, status, tipo_servicio, orden_venta, salesorder_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, numero, 'Calibración directa', o.status ?? 'Ingresado', tipo ?? null, o.ov ?? null, o.so ?? null])
}
const conOV = (id: string, o: { status?: string; tipo?: string | null } = {}) => ticket(id, { ...o, ov: `OV-${id}` })
const ejecutar = (app: ReturnType<typeof encendido>, cookie: string, id: string, transitionId: string, values?: Record<string, unknown>) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values: values ?? valoresValidos(transicionPorId(transitionId)!, 1) })
const falla = (extra: Record<string, unknown> = {}) => ({ comment: 'x', ...extra })
const estadoDe = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status
const trazas = async (id: string) => (await db.query('SELECT * FROM ticket_transitions WHERE ticket_id=$1 ORDER BY id', [id])).rows as Array<Record<string, unknown>>
const jsonDe = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v ?? {}) as Record<string, unknown>
const texto = (r: { body: { error?: string; errors?: string[] } }) => r.body.error ?? (r.body.errors ?? []).join(' | ')

describe('interruptor (RQ-TS-53, RQ-PM-38): apagado, las dos dan 409 y no escriben', () => {
  it('apagado, el atajo da 409 de interruptor, distinto del de estado, y el ticket no se mueve', async () => {
    await conOV('a1')
    const res = await ejecutar(apagado(), await adminCookie(), 'a1', ATAJO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('control de calidad, que está apagado')
    expect(res.body.error).not.toContain('no aplica desde')
    expect(await estadoDe('a1')).toBe('Ingresado')
    expect(await trazas('a1')).toHaveLength(0)
  })

  it('apagado, el escape da 409 y el ticket no se mueve', async () => {
    await conOV('a2', { status: 'En Proceso' })
    const res = await ejecutar(apagado(), await adminCookie(), 'a2', ESCAPE, falla({ [DESC]: 'se descalibró' }))
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('control de calidad, que está apagado')
    expect(await estadoDe('a2')).toBe('En Proceso')
    expect(await trazas('a2')).toHaveLength(0)
  })

  it('CARACTERIZACIÓN · apagado, la ruta de hoy sigue igual: ingreso_a_servicio pasa a Rev./Diagnostico', async () => {
    await ticket('a3')
    const res = await ejecutar(apagado(), await adminCookie(), 'a3', 'ingreso_a_servicio')
    expect(res.status).toBe(200)
    expect(await estadoDe('a3')).toBe('Rev./Diagnostico')
  })

  it('encendido, el atajo deja el ticket en En Proceso con su fila de traza', async () => {
    await conOV('a4')
    const res = await ejecutar(encendido(), await adminCookie(), 'a4', ATAJO)
    expect(res.status).toBe(200)
    expect(await estadoDe('a4')).toBe('En Proceso')
    const f = await trazas('a4')
    expect(f).toHaveLength(1)
    expect(f[0]).toMatchObject({ transition_id: ATAJO, from_status: 'Ingresado', to_status: 'En Proceso', area: 'Servicio Técnico' })
  })

  it('apagar con un ticket ya en el atajo no lo vara: diagnostico_complementario y notif_recotizacion pasan', async () => {
    await conOV('a5')
    const admin = await adminCookie()
    expect((await ejecutar(encendido(), admin, 'a5', ATAJO)).status).toBe(200)
    const d = await ejecutar(apagado(), admin, 'a5', 'diagnostico_complementario')
    expect(d.status).toBe(200)
    expect(await estadoDe('a5')).toBe('Continuación del proceso')
    const n = await ejecutar(apagado(), admin, 'a5', 'notif_recotizacion')
    expect(n.status).toBe(200)
    expect(await estadoDe('a5')).toBe('Notificación Comercial')
  })
})

describe('condición (1) del atajo (RQ-TS-54, RQ-PM-38): tipo Calibración y orden de venta, por el servidor', () => {
  it('sin OV por ninguna vía el atajo da 409 y el ticket no se mueve (M1)', async () => {
    await ticket('b1')
    const res = await ejecutar(encendido(), await adminCookie(), 'b1', ATAJO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('orden de venta')
    expect(await estadoDe('b1')).toBe('Ingresado')
    expect(await trazas('b1')).toHaveLength(0)
  })

  it('la OV por cualquiera de las tres vías cuenta (M1b): sólo orden_venta, sólo salesorder_id, sólo asociación vigente', async () => {
    const admin = await adminCookie()
    await ticket('b2', { ov: 'OV-SOLO-COLUMNA' })
    await ticket('b3', { so: 'SO-9001' })
    await ticket('b4'); await db.query(`INSERT INTO ov_asociaciones (ticket_id, numero, salesorder_id, origen) VALUES ('b4','OV-ASOC-B4',NULL,'alta')`)
    for (const id of ['b2', 'b3', 'b4']) {
      const res = await ejecutar(encendido(), admin, id, ATAJO)
      expect([id, res.status]).toEqual([id, 200])
      expect(await estadoDe(id)).toBe('En Proceso')
    }
  })

  it('una asociación LIBERADA no cuenta: 409', async () => {
    await ticket('b5'); await db.query(`INSERT INTO ov_asociaciones (ticket_id, numero, salesorder_id, origen, liberada_at) VALUES ('b5','OV-ASOC-B5',NULL,'alta', now())`)
    const res = await ejecutar(encendido(), await adminCookie(), 'b5', ATAJO)
    expect(res.status).toBe(409)
    expect(await estadoDe('b5')).toBe('Ingresado')
  })

  it('otro tipo no pasa (M5): Mantenimiento, Garantía, sin tipo y «calibración» en minúscula dan 409', async () => {
    const admin = await adminCookie()
    const casos: Array<[string, string | null]> = [['c1', 'Mantenimiento'], ['c2', 'Garantía'], ['c3', null], ['c4', 'calibración']]
    for (const [id, tipo] of casos) {
      await conOV(id, { tipo })
      const res = await ejecutar(encendido(), admin, id, ATAJO)
      expect([id, res.status]).toEqual([id, 409])
      expect(res.body.error).toContain('tipo de servicio Calibración')
      expect(await estadoDe(id)).toBe('Ingresado')
    }
  })

  it('el servidor no lee el contenido de la OV (S-2): una OV que no es de calibración no impide el atajo', async () => {
    await ticket('c5', { ov: 'OV-DE-OTRA-COSA-QUE-NO-EXISTE-EN-BOOKS' })
    const res = await ejecutar(encendido(), await adminCookie(), 'c5', ATAJO)
    expect(res.status).toBe(200)
  })
})

describe('escape falla_calibracion (RQ-TS-55, RQ-PM-40)', () => {
  it('con descripción: queda en Rev./Diagnostico, la descripción va a la traza y NO al ticket (S-15)', async () => {
    await conOV('d1', { status: 'En Proceso' })
    const res = await ejecutar(encendido(), await adminCookie(), 'd1', ESCAPE, falla({ [DESC]: 'derivó fuera de tolerancia' }))
    expect(res.status).toBe(200)
    expect(await estadoDe('d1')).toBe('Rev./Diagnostico')
    const f = await trazas('d1')
    expect(f).toHaveLength(1)
    expect(f[0]).toMatchObject({ transition_id: ESCAPE, from_status: 'En Proceso', to_status: 'Rev./Diagnostico' })
    expect(jsonDe(f[0].values)[DESC]).toBe('derivó fuera de tolerancia')
    const cf = jsonDe(((await db.query('SELECT custom_fields FROM tickets WHERE id=$1', ['d1'])).rows[0] as { custom_fields: unknown }).custom_fields)
    expect(cf).not.toHaveProperty(DESC)
  })

  it('descripción ausente, vacía o de sólo espacios: 422 que nombra «Descripción de la falla» y el ticket no se mueve (M7)', async () => {
    const admin = await adminCookie()
    const variantes: Array<[string, Record<string, unknown>]> = [['ausente', falla()], ['vacía', falla({ [DESC]: '' })], ['en blanco', falla({ [DESC]: '   ' })]]
    let i = 0
    for (const [nombre, values] of variantes) {
      i += 1
      await conOV(`d2-${i}`, { status: 'En Proceso' })
      const res = await ejecutar(encendido(), admin, `d2-${i}`, ESCAPE, values)
      expect([nombre, res.status]).toEqual([nombre, 422])
      expect(texto(res)).toContain(DESC)
      expect(await estadoDe(`d2-${i}`)).toBe('En Proceso')
      expect(await trazas(`d2-${i}`)).toHaveLength(0)
    }
  })

  it('el 422 es UNO y trae sólo su error: sin segundo obligatorio en la falla, la descripción en blanco es la única entrada del agregado', async () => {
    await conOV('d3', { status: 'En Proceso' })
    const res = await ejecutar(encendido(), await adminCookie(), 'd3', ESCAPE, falla({ [DESC]: '   ' }))
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual([`"${DESC}" no puede estar en blanco`])
  })

  it('el escape sin tomar el atajo (S-4): un ticket Calibración llegado a En Proceso por otro camino pasa', async () => {
    await ticket('d4', { status: 'En Proceso' })   // sin OV: el escape no la exige
    const res = await ejecutar(encendido(), await adminCookie(), 'd4', ESCAPE, falla({ [DESC]: 'falló' }))
    expect(res.status).toBe(200)
    expect(await estadoDe('d4')).toBe('Rev./Diagnostico')
  })

  it('otro tipo de servicio: el escape da 409', async () => {
    await ticket('d5', { status: 'En Proceso', tipo: 'Mantenimiento' })
    const res = await ejecutar(encendido(), await adminCookie(), 'd5', ESCAPE, falla({ [DESC]: 'falló' }))
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('tipo de servicio Calibración')
    expect(await estadoDe('d5')).toBe('En Proceso')
  })

  it('el destino lleva a cotizar: escalado_a_revision, escalado_a_comercial y notif_cliente_comercial pasan en cadena', async () => {
    await conOV('d6', { status: 'En Proceso' })
    const admin = await adminCookie()
    expect((await ejecutar(encendido(), admin, 'd6', ESCAPE, falla({ [DESC]: 'falló' }))).status).toBe(200)
    const pasos: Array<[string, string]> = [['escalado_a_revision', 'Notificado'], ['escalado_a_comercial', 'Notificación Comercial'], ['notif_cliente_comercial', 'Notificación cliente']]
    for (const [id, destino] of pasos) {
      const res = await ejecutar(encendido(), admin, 'd6', id)
      expect([id, res.status, res.body.error ?? res.body.errors]).toEqual([id, 200, undefined])
      expect(await estadoDe('d6')).toBe(destino)
    }
  })
})

describe('condición (3) por HTTP (RQ-TS-56): el atajo no se salta el control de calidad', () => {
  const COORD: Cargo = 'Coordinador Técnico'
  it('atajo → envio_control_calidad → aprobacion_control_calidad llega a Por Facturar; finalizacion_servicio da 409', async () => {
    await conOV('e1')
    const admin = await adminCookie()
    expect((await ejecutar(encendido(), admin, 'e1', ATAJO)).status).toBe(200)
    const fin = await ejecutar(encendido(), admin, 'e1', 'finalizacion_servicio')
    expect(fin.status).toBe(409)
    expect(await estadoDe('e1')).toBe('En Proceso')
    expect((await ejecutar(encendido(), admin, 'e1', 'envio_control_calidad')).status).toBe(200)
    expect(await estadoDe('e1')).toBe('Control de calidad')
    const rol = await createRole(db, { name: 'R-Coord', areas: ['Servicio Técnico'] })
    const u = await createUser(db, { email: 'coord@x.co', name: 'Coord', passwordHash: await hashPassword('password123'), roleId: rol.id, cargoPermiso: COORD })
    const coord = `sid=${await createSession(db, u.id)}`
    const ap = await ejecutar(encendido(), coord, 'e1', 'aprobacion_control_calidad')
    expect([ap.status, texto(ap)]).toEqual([200, ''])
    expect(await estadoDe('e1')).toBe('Por Facturar')
  })
})

describe('posición de las guardas (regla de mutación 1): cada prueba activa DOS a la vez', () => {
  it('CD-1 · estado equivocado Y interruptor apagado: contesta el 409 de estado', async () => {
    await conOV('p1', { status: 'En Proceso' })   // el atajo sale de Ingresado
    const res = await ejecutar(apagado(), await adminCookie(), 'p1', ATAJO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('no aplica desde')
  })

  it('CD-2 · interruptor apagado Y condición (1) incumplida: contesta el del interruptor', async () => {
    await ticket('p2', { tipo: 'Mantenimiento' })   // sin OV y otro tipo
    const res = await ejecutar(apagado(), await adminCookie(), 'p2', ATAJO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('apagado')
  })

  it('CD-3 · condición (1) incumplida Y sin el área: contesta el 409, no el 403', async () => {
    await ticket('p3')   // sin OV
    const res = await ejecutar(encendido(), await userCookie(['Comercial']), 'p3', ATAJO)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('orden de venta')
  })

  it('CD-4 · tipo del escape incumplido Y descripción en blanco: contesta el 409, no el 422', async () => {
    await ticket('p4', { status: 'En Proceso', tipo: 'Garantía' })
    const res = await ejecutar(encendido(), await adminCookie(), 'p4', ESCAPE, falla({ [DESC]: '   ' }))
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('tipo de servicio Calibración')
  })

  it('CD-5 · sin el área Y descripción en blanco: contesta el 403, no el 422', async () => {
    await conOV('p5', { status: 'En Proceso' })
    const res = await ejecutar(encendido(), await userCookie(['Comercial']), 'p5', ESCAPE, falla({ [DESC]: '   ' }))
    expect(res.status).toBe(403)
  })

  it('CD-6 · interruptor apagado Y descripción en blanco: contesta el 409, no el 422', async () => {
    await conOV('p6', { status: 'En Proceso' })
    const res = await ejecutar(apagado(), await adminCookie(), 'p6', ESCAPE, falla({ [DESC]: '   ' }))
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('apagado')
  })

  it('control · todo en regla y sin el área sigue siendo 403; todo en regla y descripción en blanco sigue siendo 422', async () => {
    await conOV('p7')
    expect((await ejecutar(encendido(), await userCookie(['Comercial']), 'p7', ATAJO)).status).toBe(403)
    await conOV('p8', { status: 'En Proceso' })
    expect((await ejecutar(encendido(), await adminCookie(), 'p8', ESCAPE, falla({ [DESC]: ' ' }))).status).toBe(422)
  })
})

describe('S-16 · caracterización: el atajo no es marca de ingreso, el indicador 49 queda sin dato', () => {
  const fila = (transitionId: string, f: Record<string, unknown>): PasoDelHistorial => ({ transitionId, performedAt: String(f.performed_at), values: jsonDe(f.values) })
  const base = { id: 'x', numero: 1, estado: 'En Proceso', codigoServicio: null, creadoEn: null, diasEntrega: null, camposZoho: {} }
  const i49 = (t: Parameters<typeof calcularIndicadores>[0], h: PasoDelHistorial[]) => calcularIndicadores(t, h, { cierres: new Set<string>() }).find((i) => i.columna === '49')!

  it('un ticket que tomó el atajo no tiene marca de ingreso: el 49 es sin_dato (bodegaje.ts:94, indicadores.ts:133)', async () => {
    await conOV('s1')
    expect((await ejecutar(encendido(), await adminCookie(), 's1', ATAJO)).status).toBe(200)
    const h = (await trazas('s1')).map((f) => fila(String(f.transition_id), f))
    expect(i49({ ...base, fechas: { 'Fecha Revisión Informe': '2026-12-10', 'Fecha creación ticket': '2026-12-01' } }, h).valor.tipo).toBe('sin_dato')
  })

  it('contraste · con la marca de ingreso_a_servicio y la misma revisión, el 49 sí es un valor', () => {
    const h: PasoDelHistorial[] = [{ transitionId: 'ingreso_a_servicio', performedAt: '2026-12-02T15:00:00Z', values: {} }]
    expect(i49({ ...base, fechas: { 'Fecha Revisión Informe': '2026-12-10', 'Fecha creación ticket': '2026-12-01' } }, h).valor.tipo).toBe('valor')
  })
})
