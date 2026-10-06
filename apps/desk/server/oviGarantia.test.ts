import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { STATUS_TICKET_CREADO, transicionPorId, ordenesDeTransicion, type Cargo } from '@ambientalia/shared'
import { buildTransitionPlan } from './transitionExec'
import { db, instalarArnes, appWith, adminCookie, valoresValidos } from './testing/appHarness'
import { createUser } from './auth/users'; import { createSession } from './auth/sessions'; import { createRole } from './auth/roles'
import { asociarOV, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'; import { conRemisionVigente } from './testing/remisionDePrueba'
import { createManagedTicket } from './services/ticketService'

instalarArnes()

/**
 * OVI Y GARANTÍA POR CARGO en el alta y en las transiciones (F1B-03, `decision/e157-ovi-garantia-por-cargo`; lote 2).
 * Escalón B (`403`, cargo de la OVI que ENTRA) y C (`422`, Garantía sólo admite OVI) de la escalera de F1B-10.
 * Las pruebas POS-* fijan el ORDEN con las dos guardas activas a la vez (regla de mutación 1): cada una responde distinto
 * según cuál corra primero.
 */

let n = 0
/** Cookie de un usuario con las áreas y el cargo dados; email propio para poder tener varios en una prueba. */
async function usuario(areas: string[], cargo: Cargo | null = null): Promise<string> {
  n += 1
  const role = await createRole(db, { name: `Rol-ovi-${n}`, areas })
  const u = await createUser(db, { email: `u${n}@x.co`, name: `U${n}`, passwordHash: 'h', roleId: role.id, cargoPermiso: cargo })
  return `sid=${await createSession(db, u.id)}`
}
const sinCargo = () => usuario(['Comercial'])
const directorTecnico = () => usuario(['Comercial'], 'Director Técnico') // sin Servicio Técnico a propósito: el cargo basta

/** Books: el cliente, dos equipos (el segundo es de OTRO cliente) y las órdenes de cada caso. */
async function sembrar(): Promise<void> {
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.'), ('cli2','Otra S.A.')")
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','18A20070','Grimm','EDM180C','Monitor')")
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo, client_id) VALUES ('eq-2','18A20071','Grimm','EDM180C','Monitor','cli2')")
  for (const [id, num] of [['soOVI', 'OVI-2026-001'], ['soOV', 'OV-2026-001'], ['soX9', 'OV-2026-002-X9'], ['soOVI2', 'OVI-2026-002']]) {
    await db.query('INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date) VALUES ($1,$2,$3,$4)', [id, num, 'cli1', '2026-07-15'])
  }
}

const altaBase = { equipoId: 'eq-1', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio de mantenimiento', prefijo: 'MT' }
const alta = (cookie: string, extra: Record<string, unknown>) => request(appWith().app).post('/api/tickets').set('Cookie', cookie).send({ ...altaBase, ...extra })
const numeroDe = async (id: string) => (await db.query('SELECT orden_venta FROM tickets WHERE id=$1', [id])).rows[0]?.orden_venta
const totalTickets = async () => Number((await db.query('SELECT COUNT(*) AS c FROM tickets')).rows[0].c)

describe('OVI en el alta · el cargo (escalón B)', () => {
  it('AL-1 · una OVI por salesOrderId sin el cargo da 403 y no crea el ticket', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { salesOrderId: 'soOVI' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('La orden de venta OVI-2026-001 es una OVI: asociarla a un ticket sólo lo hace el cargo Director Técnico')
    expect(await totalTickets()).toBe(0)
  })

  it('AL-2 · el Director Técnico, aun sin el área de Servicio Técnico, la asocia: 201', async () => {
    await sembrar()
    expect((await alta(await directorTecnico(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('AL-3 · el administrador sin cargo la asocia: 201', async () => {
    await sembrar()
    expect((await alta(await adminCookie(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it.each([['OVI-2026-001'], [' ovi-2026-001 '], ['OVI-26-1']])('AL-4/AL-5 · la OVI tecleada «%s» en ordenVenta, sin cargo, da 403', async (tecleada) => {
    await sembrar()
    const res = await alta(await sinCargo(), { clientId: 'cli1', ordenVenta: tecleada })
    expect(res.status).toBe(403)
    expect(await totalTickets()).toBe(0)
  })

  it('AL-6 · ordenVenta «OV-…» tecleada con el salesOrderId de una OVI: se juzga la orden de Books, 403', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { ordenVenta: 'OV-2026-001', salesOrderId: 'soOVI' })
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('OVI-2026-001')
  })

  it('AL-7 · createManagedTicket sin sujeto (cuatro argumentos) y con una OVI da 403 (S-10)', async () => {
    await sembrar()
    await expect(createManagedTicket(db, { ...altaBase, salesOrderId: 'soOVI' }, 'App')).rejects.toMatchObject({ status: 403 })
  })

  it('AL-8 · CARACTERIZACIÓN · una OV ordinaria sin cargo sigue dando 201', async () => {
    await sembrar()
    expect((await alta(await sinCargo(), { salesOrderId: 'soOV' })).status).toBe(201)
  })
})

describe('OVI en el alta · posición del cargo frente a sus vecinas', () => {
  it('POS-AL-1 · CARACTERIZACIÓN · equipo inexistente + OVI sin cargo: gana «Equipo no registrado»', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { equipoId: 'no-existe', salesOrderId: 'soOVI' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Equipo no registrado')
  })

  it('POS-AL-2 · CARACTERIZACIÓN · salesOrderId inexistente + ordenVenta OVI sin cargo: gana «Orden de venta no encontrada» (A antes que B)', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { clientId: 'cli1', ordenVenta: 'OVI-2026-001', salesOrderId: 'no-existe' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Orden de venta no encontrada')
  })

  it('POS-AL-3 · OVI sin cargo + cliente distinto del equipo: gana el 403 de cargo (B antes que la guarda equipo↔cliente)', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { equipoId: 'eq-2', salesOrderId: 'soOVI' })
    expect(res.status).toBe(403)
  })

  it('POS-AL-4 · OVI sin cargo + faltan obligatorios: gana el 403 de cargo (B antes que los obligatorios)', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { salesOrderId: 'soOVI', tipoServicio: '' })
    expect(res.status).toBe(403)
  })
})

const GARANTIA = 'Garantía'
const TEXTO_GARANTIA = 'sólo admite una orden OVI'
/** Un ticket ajeno que ya tiene `OV-2026-001` por sus dos vías: la unicidad (D) responde 409 si llega a evaluarse. */
const ticketDeOtro = () => db.query("INSERT INTO tickets (id,number,subject,status,orden_venta,salesorder_id) VALUES ('t-dueno',7001,'Ajeno','Ingresado','OV-2026-001','soOV')")

describe('Garantía en el alta · sólo admite OVI (escalón C)', () => {
  it('GA-AL-1 · Garantía + OV ordinaria da 422 y no crea el ticket', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { tipoServicio: GARANTIA, salesOrderId: 'soOV' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('El ticket es de tipo de servicio Garantía y sólo admite una orden OVI: la orden de venta OV-2026-001 no lo es')
    expect(await totalTickets()).toBe(0)
  })

  it('GA-AL-2 · Garantía + OVI con el cargo da 201', async () => {
    await sembrar()
    expect((await alta(await directorTecnico(), { tipoServicio: GARANTIA, salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('GA-AL-3 · CARACTERIZACIÓN · Garantía sin orden nace igual (S-2): 201', async () => {
    await sembrar()
    expect((await alta(await sinCargo(), { tipoServicio: GARANTIA, clientId: 'cli1' })).status).toBe(201)
  })

  it('GA-AL-4 · OVI tecleada + salesOrderId de una OV en Garantía: se juzga la de Books, 422', async () => {
    await sembrar()
    const res = await alta(await directorTecnico(), { tipoServicio: GARANTIA, ordenVenta: 'OVI-2026-001', salesOrderId: 'soOV' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain(TEXTO_GARANTIA)
  })

  it('GA-AL-5 · CARACTERIZACIÓN · una OVI en un ticket que no es de Garantía se admite con el cargo (fuera de alcance, E-157 pto. 7)', async () => {
    await sembrar()
    expect((await alta(await directorTecnico(), { tipoServicio: 'Mantenimiento', salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('POS-AL-5 · Garantía + OV ya asociada a otro ticket: gana el 422 de garantía (C), no el 409 (D)', async () => {
    await sembrar(); await ticketDeOtro()
    const res = await alta(await sinCargo(), { tipoServicio: GARANTIA, salesOrderId: 'soOV' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain(TEXTO_GARANTIA)
  })

  it('POS-AL-6 · CARACTERIZACIÓN · Garantía + OV con sufijo no canónico: gana la cuarentena, no la de garantía (S-9)', async () => {
    await sembrar()
    const res = await alta(await sinCargo(), { tipoServicio: GARANTIA, salesOrderId: 'soX9' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('sufijo')
  })
})

// ── Transiciones ────────────────────────────────────────────────────────────────────────────────────────────────────
const HS = 'habilitar_servicio'
const ZOHO = 'zoho-1' // sin PREFIJO_TICKET_APP: venido de Zoho (`transitions.ts:124`)
const DE_LA_APP = 'app-t1'
/** Un ticket listo para la transición pedida: «Ticket creado» (con remisión vigente) para HS, «Notificación cliente» para las aprobaciones. */
async function ticket(id: string, extra: { orden?: string | null; tipo?: string | null; estado?: string; numero?: number; sinRemision?: boolean } = {}): Promise<void> {
  const estado = extra.estado ?? STATUS_TICKET_CREADO
  await db.query('INSERT INTO tickets (id,number,subject,status,orden_venta,tipo_servicio,equipo_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, extra.numero ?? 8001, 'T', estado, extra.orden ?? null, extra.tipo ?? null, 'eq-1'])
  if (!extra.sinRemision && estado === STATUS_TICKET_CREADO) await conRemisionVigente(db, id)
}
const estadoDe = async (id: string) => (await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0].status
/** POST de la transición con los valores mínimos válidos del arnés y lo que cada caso cambie (`undefined` quita el campo). */
function transicionar(cookie: string, id: string, transitionId: string, over: Record<string, unknown>) {
  const values: Record<string, unknown> = { ...valoresValidos(transicionPorId(transitionId)!, 1), Serial: '18A20070', ...over }
  for (const k of Object.keys(values)) if (values[k] === undefined) delete values[k]
  return request(appWith().app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId: transitionId, values })
}
const hs = (cookie: string, id: string, orden: string, over: Record<string, unknown> = {}) => transicionar(cookie, id, HS, { 'Orden de Venta': orden, ...over })
const adicional = (cookie: string, id: string, transitionId: string, orden: string, over: Record<string, unknown> = {}) => transicionar(cookie, id, transitionId, { 'OV adicional': orden, ...over })
const SOLO_CARGO = 'sólo lo hace el cargo Director Técnico'

describe('OVI en las transiciones · el cargo (escalón B)', () => {
  it.each([
    ['TR-1 · Habilitar Servicio', HS], ['TR-3 · Aprobación (OV adicional)', 'aprobacion'], ['TR-5 · Aprobación y S. Repuestos (OV adicional)', 'aprobacion_y_repuestos'],
  ])('%s: una OVI nueva sin cargo da 403 y el ticket no se mueve', async (_t, tid) => {
    await sembrar(); await ticket('app-t1', { estado: tid === HS ? STATUS_TICKET_CREADO : 'Notificación cliente' })
    const sin = await sinCargo()
    const res = tid === HS ? await hs(sin, 'app-t1', 'OVI-2026-001') : await adicional(sin, 'app-t1', tid, 'OVI-2026-001')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain(SOLO_CARGO)
    expect(await estadoDe('app-t1')).toBe(tid === HS ? STATUS_TICKET_CREADO : 'Notificación cliente')
  })

  it.each([
    ['TR-2 · Habilitar Servicio', HS], ['TR-4 · Aprobación', 'aprobacion'], ['TR-6 · Aprobación y S. Repuestos', 'aprobacion_y_repuestos'],
  ])('%s: con el cargo (sin Servicio Técnico) o como administrador la OVI pasa: 200', async (_t, tid) => {
    await sembrar(); await ticket('app-t1', { estado: tid === HS ? STATUS_TICKET_CREADO : 'Notificación cliente' })
    const llamar = (c: string, o: string) => (tid === HS ? hs(c, 'app-t1', o) : adicional(c, 'app-t1', tid, o))
    expect((await llamar(await directorTecnico(), 'OVI-2026-001')).status).toBe(200)
    await db.query("UPDATE tickets SET status=$1 WHERE id='app-t1'", [tid === HS ? STATUS_TICKET_CREADO : 'Notificación cliente'])
    await db.query("DELETE FROM ov_asociaciones; UPDATE tickets SET orden_venta=NULL WHERE id='app-t1'")
    expect((await llamar(await adminCookie(), 'OVI-2026-002')).status).toBe(200)
  })
})

describe('OVI en las transiciones · reconfirmar no es asociar', () => {
  it('RC-1 · un ticket venido de ZOHO que ya trae su OVI la reconfirma en Habilitar Servicio sin el cargo: 200', async () => {
    await sembrar(); await ticket(ZOHO, { orden: 'OVI-2026-001' })
    expect((await hs(await sinCargo(), ZOHO, 'OVI-2026-001')).status).toBe(200)
    expect(await numeroDe(ZOHO)).toBe('OVI-2026-001')
  })

  it('RC-2 · lo mismo en un ticket de la app: 200', async () => {
    await sembrar(); await ticket(DE_LA_APP, { orden: 'OVI-2026-001' })
    expect((await hs(await sinCargo(), DE_LA_APP, 'OVI-2026-001')).status).toBe(200)
  })

  it('RC-3 · una OVI vigente sólo en ov_asociaciones también cuenta como «ya la traía»: 200', async () => {
    await sembrar(); await ticket(DE_LA_APP)
    await asociarOV(db, { ticketId: DE_LA_APP, numero: 'OVI-2026-001', salesorderId: null, origen: 'alta', actor: 'x', fechaOrdenCompra: null })
    expect((await hs(await sinCargo(), DE_LA_APP, 'OVI-2026-001')).status).toBe(200)
  })

  it('RC-4 · cambiarla por OTRA OVI sin cargo da 403', async () => {
    await sembrar(); await ticket(ZOHO, { orden: 'OVI-2026-001' })
    expect((await hs(await sinCargo(), ZOHO, 'OVI-2026-002')).status).toBe(403)
  })

  it('RC-5 · reasociar una OVI que se liberó da 403', async () => {
    await sembrar(); await ticket(DE_LA_APP)
    const a = await asociarOV(db, { ticketId: DE_LA_APP, numero: 'OVI-2026-001', salesorderId: null, origen: 'alta', actor: 'x', fechaOrdenCompra: null })
    await liberarAsociacion(db, a.id, 'x', 'prueba')
    expect((await hs(await sinCargo(), DE_LA_APP, 'OVI-2026-001')).status).toBe(403)
  })

  it('RC-6 · la misma OVI en otra caja ya no es «la misma»: 403 (falla cerrado)', async () => {
    await sembrar(); await ticket(ZOHO, { orden: 'OVI-2026-001' })
    expect((await hs(await sinCargo(), ZOHO, 'ovi-2026-001')).status).toBe(403)
  })

  it('RC-7 · una OV adicional que ya traía el ticket tampoco pide el cargo (aprobación): 200', async () => {
    await sembrar(); await ticket(ZOHO, { estado: 'Notificación cliente' })
    await asociarOV(db, { ticketId: ZOHO, numero: 'OVI-2026-002', salesorderId: null, origen: 'aprobacion', actor: 'x', fechaOrdenCompra: null })
    expect((await adicional(await sinCargo(), ZOHO, 'aprobacion', 'OVI-2026-002')).status).toBe(200)
  })
})

describe('OVI en las transiciones · posición del cargo frente a sus vecinas', () => {
  it('POS-TR-1 · CARACTERIZACIÓN · estado que no aplica + OVI sin cargo: gana el 409 de estado (A/B antes que el cargo)', async () => {
    await sembrar(); await ticket(DE_LA_APP, { estado: 'Ingresado' })
    expect((await hs(await sinCargo(), DE_LA_APP, 'OVI-2026-001')).status).toBe(409)
  })

  it('POS-TR-2 · CARACTERIZACIÓN · Servicio Técnico sin cargo + OVI: gana el 403 del ÁREA, no el del cargo', async () => {
    await sembrar(); await ticket(DE_LA_APP)
    const res = await hs(await usuario(['Servicio Técnico']), DE_LA_APP, 'OVI-2026-001')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Tu rol no tiene permiso')
  })

  it('POS-TR-3 · OVI nueva sin cargo y sin remisión vigente: gana el 403 de cargo, no el 422 de la remisión', async () => {
    await sembrar(); await ticket(DE_LA_APP, { sinRemision: true })
    const res = await hs(await sinCargo(), DE_LA_APP, 'OVI-2026-001')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain(SOLO_CARGO)
  })

  it('POS-TR-3b · OVI nueva sin cargo y equipo pendiente de validar: gana el 403 de cargo, no el 422 del alta pendiente', async () => {
    await sembrar(); await ticket(DE_LA_APP); await db.query("UPDATE equipos SET pendiente_validar=true WHERE id='eq-1'")
    const res = await hs(await sinCargo(), DE_LA_APP, 'OVI-2026-001')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain(SOLO_CARGO)
  })

  it('POS-TR-4 · aprobacion_y_repuestos: OVI adicional sin cargo + falta una fecha obligatoria: gana el 403 de cargo, no el 422 de obligatorios', async () => {
    await sembrar(); await ticket(DE_LA_APP, { estado: 'Notificación cliente' })
    const res = await adicional(await sinCargo(), DE_LA_APP, 'aprobacion_y_repuestos', 'OVI-2026-001', { 'Fecha Orden de Compra': undefined })
    expect(res.status).toBe(403)
  })

  it('POS-TR-5 · OVI que ya es de otro ticket y sin cargo: gana el 403 de cargo (B), no el 409 de unicidad (D)', async () => {
    await sembrar(); await ticket(DE_LA_APP)
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta) VALUES ('t-dueno',7001,'Ajeno','Ingresado','OVI-2026-001')")
    const res = await hs(await sinCargo(), DE_LA_APP, 'OVI-2026-001')
    expect(res.status).toBe(403)
  })

  it('POS-TR-5b · la OV adicional comparte la puerta: OVI de otro ticket + sin cargo en aprobación da 403, no 409', async () => {
    await sembrar(); await ticket(DE_LA_APP, { estado: 'Notificación cliente' })
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta) VALUES ('t-dueno',7001,'Ajeno','Ingresado','OVI-2026-001')")
    expect((await adicional(await sinCargo(), DE_LA_APP, 'aprobacion', 'OVI-2026-001')).status).toBe(403)
  })

  it.each([[HS, { 'Orden de Venta': 'OV-2026-001', 'Fecha Orden De Venta': '2026-07-15' }], ['aprobacion', { 'OV adicional': 'OV-2026-001' }], ['aprobacion_y_repuestos', { 'OV adicional': 'OV-2026-001' }]])(
    'EQ-1 · ordenesDeTransicion de %s es lo que el plan guarda como orden', (tid, valores) => {
      const t = transicionPorId(tid)!
      const v = { ...valoresValidos(t, 1), ...valores }
      const plan = buildTransitionPlan(t, v)
      expect(ordenesDeTransicion(t, v)).toEqual([plan.columns.orden_venta, plan.ovAdicional].filter((x) => typeof x === 'string' && x))
      expect(ordenesDeTransicion(t, v).length).toBeGreaterThan(0)
    })
})

describe('Garantía en las transiciones · sólo admite OVI (escalón C)', () => {
  const errores = (res: { body: { errors?: string[] } }) => (res.body.errors ?? []).filter((e) => e.includes(TEXTO_GARANTIA))

  it('GA-TR-1 · Habilitar Servicio en Garantía con una OV nueva da 422 y el ticket no se mueve', async () => {
    await sembrar(); await ticket(DE_LA_APP, { tipo: GARANTIA })
    const res = await hs(await sinCargo(), DE_LA_APP, 'OV-2026-001')
    expect(res.status).toBe(422)
    expect(errores(res)).toEqual(['El ticket es de tipo de servicio Garantía y sólo admite una orden OVI: la orden de venta OV-2026-001 no lo es'])
    expect(await estadoDe(DE_LA_APP)).toBe(STATUS_TICKET_CREADO)
  })

  it('GA-TR-2 · la «OV adicional» de la aprobación, en Garantía y con una OV, da 422 (S-5)', async () => {
    await sembrar(); await ticket(DE_LA_APP, { tipo: GARANTIA, estado: 'Notificación cliente' })
    const res = await adicional(await sinCargo(), DE_LA_APP, 'aprobacion', 'OV-2026-001')
    expect(res.status).toBe(422)
    expect(errores(res)).toHaveLength(1)
  })

  it('GA-TR-3 · CARACTERIZACIÓN · una Garantía que reconfirma su propia OV ordinaria no se bloquea (S-1): 200', async () => {
    await sembrar(); await ticket(ZOHO, { tipo: GARANTIA, orden: 'OV-2026-001' })
    expect((await hs(await sinCargo(), ZOHO, 'OV-2026-001')).status).toBe(200)
  })

  it('GA-TR-4 · Garantía + OVI con el cargo: 200', async () => {
    await sembrar(); await ticket(DE_LA_APP, { tipo: GARANTIA })
    expect((await hs(await directorTecnico(), DE_LA_APP, 'OVI-2026-001')).status).toBe(200)
  })

  it('POS-TR-6 · Garantía + OV que ya usa otro ticket: gana el 422 de garantía (C), no el 409 (D)', async () => {
    await sembrar(); await ticket(DE_LA_APP, { tipo: GARANTIA }); await ticketDeOtro()
    const res = await hs(await sinCargo(), DE_LA_APP, 'OV-2026-001')
    expect(res.status).toBe(422)
    expect(errores(res)).toHaveLength(1)
  })

  it('POS-TR-7 · Garantía + OV + falta un obligatorio: el 422 trae los DOS textos (la garantía va DENTRO del agregado)', async () => {
    await sembrar(); await ticket(DE_LA_APP, { tipo: GARANTIA })
    const res = await hs(await sinCargo(), DE_LA_APP, 'OV-2026-001', { Serial: undefined })
    expect(res.status).toBe(422)
    expect(res.body.errors).toHaveLength(2)
    expect(errores(res)).toHaveLength(1)
  })
})

describe('Garantía · posición frente al contrato vencido (los dos son escalón C)', () => {
  const subOvVencida = async () => {
    await db.query("INSERT INTO contratos (client_id, lote, fecha_inicio, fecha_fin, creado_por) VALUES ('cli1', 'OV-2026-170', '2020-01-01', '2020-12-31', 'x')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date) VALUES ('soVenc','OV-2026-170-01','cli1','2026-07-15')")
  }

  it('POS-AL-7 · Garantía + subOV de un contrato vencido: en el alta gana el vencido (se evalúa ANTES que la garantía)', async () => {
    await sembrar(); await subOvVencida()
    const res = await alta(await sinCargo(), { tipoServicio: GARANTIA, salesOrderId: 'soVenc' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('venció')
  })

  it('POS-TR-8 · Garantía + subOV de un contrato vencido: en la transición gana la garantía (va DENTRO del agregado, antes del vencido)', async () => {
    await sembrar(); await subOvVencida(); await ticket(DE_LA_APP, { tipo: GARANTIA })
    const res = await hs(await sinCargo(), DE_LA_APP, 'OV-2026-170-01')
    expect(res.status).toBe(422)
    expect(res.body.errors).toHaveLength(1)
    expect(res.body.errors[0]).toContain(TEXTO_GARANTIA)
  })
})
