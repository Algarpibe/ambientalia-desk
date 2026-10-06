import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { hoyEnZona, sumarDias, type Cargo } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'
import { createUser } from './auth/users'; import { createSession } from './auth/sessions'; import { createRole } from './auth/roles'
import { asociarOV } from '@ambientalia/zoho-sync/db/ovAsociaciones'; import { crearContrato } from './db/contratos'

instalarArnes()

/**
 * OVI Y GARANTÍA POR CARGO en la remisión de entrada (F1B-03, `decision/e157-ovi-garantia-por-cargo`; lote 3).
 * Escalón B (`403`, cargo de la OVI que ENTRA) y C (`422`, Garantía sólo admite OVI) dentro del bloque de la orden de venta.
 * La ruta de remisión sólo pide sesión (`requireAuth`, `routes/remision.ts:120`): ni área ni cargo para entrar; el cargo se
 * exige únicamente cuando la orden es una OVI. Las pruebas POS-* fijan el ORDEN con las dos guardas activas a la vez.
 */

let n = 0
/** Cookie de un usuario con las áreas y el cargo dados; email propio para poder tener varios en una prueba. */
async function usuario(areas: string[], cargo: Cargo | null = null): Promise<string> {
  n += 1
  const role = await createRole(db, { name: `Rol-ovir-${n}`, areas })
  const u = await createUser(db, { email: `r${n}@x.co`, name: `R${n}`, passwordHash: 'h', roleId: role.id, cargoPermiso: cargo })
  return `sid=${await createSession(db, u.id)}`
}
const sinCargo = () => usuario(['Comercial'])
const directorTecnico = () => usuario(['Comercial'], 'Director Técnico') // sin Servicio Técnico a propósito: el cargo basta
const GARANTIA = 'Garantía'
const TEXTO_GARANTIA = 'sólo admite una orden OVI'
const TEXTO_CARGO = 'sólo lo hace el cargo Director Técnico'
const dias = (d: number): string => sumarDias(hoyEnZona(), d)

/** Books: cliente, equipo y las órdenes de cada caso (la remisión recibe el ID y el número sale de Books). */
async function sembrar(): Promise<void> {
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','18A20070','Grimm','EDM180C','Monitor')")
  for (const [id, num] of [['soOVI', 'OVI-2026-001'], ['soOV', 'OV-2026-001'], ['soX9', 'OV-2026-002-X9'], ['soOVIX9', 'OVI-2026-003-X9'], ['soOVI2', 'OVI-2026-002'], ['soVenc', 'OV-2026-170-01']]) {
    await db.query('INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date) VALUES ($1,$2,$3,$4)', [id, num, 'cli1', '2026-07-15'])
  }
}
/** El ticket destino de la remisión, con serial por su equipo; `extra` fija lo que el caso necesita ya tener. */
async function ticket(extra: { orden?: string | null; salesorderId?: string | null; tipo?: string } = {}): Promise<void> {
  await db.query("INSERT INTO tickets (id,number,subject,status,client_id,equipo_id,tipo_servicio,orden_venta,salesorder_id) VALUES ('t-r1',9001,'T','Ticket creado','cli1','eq-1',$1,$2,$3)",
    [extra.tipo ?? 'Mantenimiento', extra.orden ?? null, extra.salesorderId ?? null])
}
const remitir = (cookie: string, extra: Record<string, unknown>) =>
  request(appWith().app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't-r1', fecha: '2026-08-03', incluye: [], ...extra })
const ordenDe = async () => (await db.query("SELECT orden_venta FROM tickets WHERE id='t-r1'")).rows[0].orden_venta
const totalRemisiones = async () => Number((await db.query("SELECT COUNT(*) AS c FROM remisiones WHERE ticket_id='t-r1'")).rows[0].c)

describe('OVI en la remisión de entrada · el cargo (escalón B)', () => {
  it('RE-1 · una OVI por salesOrderId sin el cargo da 403 y no escribe ni la orden ni la remisión', async () => {
    await sembrar(); await ticket()
    const res = await remitir(await sinCargo(), { salesOrderId: 'soOVI' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('La orden de venta OVI-2026-001 es una OVI: asociarla a un ticket sólo lo hace el cargo Director Técnico')
    expect(await ordenDe()).toBeNull()
    expect(await totalRemisiones()).toBe(0)
  })

  it('RE-2 · el Director Técnico, aun sin el área de Servicio Técnico, la asocia: 201', async () => {
    await sembrar(); await ticket()
    expect((await remitir(await directorTecnico(), { salesOrderId: 'soOVI' })).status).toBe(201)
    expect(await ordenDe()).toBe('OVI-2026-001')
  })

  it('RE-3 · el administrador sin cargo la asocia: 201', async () => {
    await sembrar(); await ticket()
    expect((await remitir(await adminCookie(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('RE-4 · CARACTERIZACIÓN · reenviar la OVI que el ticket ya tiene en orden_venta, sin cargo: 201 (ya la traía)', async () => {
    await sembrar(); await ticket({ orden: 'OVI-2026-001' })
    expect((await remitir(await sinCargo(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('RE-5 · CARACTERIZACIÓN · orden_venta vacía y salesorder_id vivo (IV-11): reenviar ESA orden, sin cargo, da 201', async () => {
    await sembrar(); await ticket({ salesorderId: 'soOVI' })
    expect((await remitir(await sinCargo(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('RE-5b · CARACTERIZACIÓN · una asociación vigente de ov_asociaciones también cuenta como «ya la traía»: 201', async () => {
    await sembrar(); await ticket()
    await asociarOV(db, { ticketId: 't-r1', numero: 'OVI-2026-001', salesorderId: 'soOVI', origen: 'alta', actor: 'x', fechaOrdenCompra: null })
    expect((await remitir(await sinCargo(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('RE-6 · el ticket ya tiene OTRA orden y llega una OVI sin cargo: 403 (S-8)', async () => {
    await sembrar(); await ticket({ orden: 'OV-2026-001', salesorderId: 'soOV' })
    const res = await remitir(await sinCargo(), { salesOrderId: 'soOVI' })
    expect(res.status).toBe(403)
    expect(res.body.error).toContain(TEXTO_CARGO)
  })

  it('RE-7 · CARACTERIZACIÓN · una OV ordinaria sin cargo sigue dando 201', async () => {
    await sembrar(); await ticket()
    expect((await remitir(await sinCargo(), { salesOrderId: 'soOV' })).status).toBe(201)
  })
})

describe('OVI en la remisión de entrada · posición del cargo frente a sus vecinas', () => {
  it('POS-RE-0 · CARACTERIZACIÓN · salesOrderId inexistente y sin cargo: gana «Orden de venta no encontrada» (A; el cargo necesita el número de Books)', async () => {
    await sembrar(); await ticket()
    const res = await remitir(await sinCargo(), { salesOrderId: 'no-existe' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Orden de venta no encontrada')
  })

  it('POS-RE-1 · OVI con sufijo no canónico sin cargo: gana el 403 de cargo (B), no la cuarentena (C); con cargo, la cuarentena', async () => {
    await sembrar(); await ticket()
    const sin = await remitir(await sinCargo(), { salesOrderId: 'soOVIX9' })
    expect(sin.status).toBe(403)
    expect(sin.body.error).toContain(TEXTO_CARGO)
    const con = await remitir(await directorTecnico(), { salesOrderId: 'soOVIX9' })
    expect(con.status).toBe(422)
    expect(con.body.error).toContain('sufijo')
  })

  it('POS-RE-2 · OVI ya asociada a otro ticket y sin cargo: gana el 403 de cargo (B), no el 409 (D)', async () => {
    await sembrar(); await ticket()
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta,salesorder_id) VALUES ('t-dueno',7001,'Ajeno','Ingresado','OVI-2026-001','soOVI')")
    const res = await remitir(await sinCargo(), { salesOrderId: 'soOVI' })
    expect(res.status).toBe(403)
    expect(res.body.error).toContain(TEXTO_CARGO)
    // Control de población: con el cargo la misma petición SÍ llega a la unicidad (409), así que las dos guardas estaban activas.
    expect((await remitir(await directorTecnico(), { salesOrderId: 'soOVI' })).status).toBe(409)
  })

  it('POS-RE-3 · CARACTERIZACIÓN (IV-12, punto 4) · remisión pendiente + OVI sin cargo: gana el 409 de la pendiente (D), que corre ANTES del 403', async () => {
    await sembrar(); await ticket()
    expect((await remitir(await adminCookie(), {})).status).toBe(201) // queda `pendiente`
    const res = await remitir(await sinCargo(), { salesOrderId: 'soOVI' })
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('remisión sin desenlace')
    expect(await ordenDe()).toBeNull()
  })

  it('POS-RE-4 · CARACTERIZACIÓN (IV-12, punto 4) · ítem fuera del checklist + OVI sin cargo: gana el 422 del checklist (C), que corre ANTES del 403', async () => {
    await sembrar(); await ticket()
    const res = await remitir(await sinCargo(), { salesOrderId: 'soOVI', incluye: ['Cosa que no existe'] })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('Ítems fuera del checklist')
  })

  it('POS-RE-8 · CARACTERIZACIÓN · el contrato vencido no se cruza con el cargo: una OVI nunca es subOV (su sufijo va a cuarentena, S-8)', async () => {
    await sembrar(); await ticket()
    await crearContrato(db, { clientId: 'cli1', lote: 'OV-2026-170', fechaInicio: dias(-100), fechaFin: dias(-10), creadoPor: 'Comercial' })
    // La subOV vencida sin cargo: el cargo no interviene (no es OVI) y responde el vencido.
    const res = await remitir(await sinCargo(), { salesOrderId: 'soVenc' })
    expect(res.status).toBe(422)
    expect(res.body.error).not.toContain(TEXTO_CARGO)
  })
})

describe('Garantía en la remisión de entrada · sólo admite OVI (escalón C)', () => {
  it('GA-RE-1 · Garantía + OV ordinaria da 422 y no escribe la orden', async () => {
    await sembrar(); await ticket({ tipo: GARANTIA })
    const res = await remitir(await sinCargo(), { salesOrderId: 'soOV' })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe('El ticket es de tipo de servicio Garantía y sólo admite una orden OVI: la orden de venta OV-2026-001 no lo es')
    expect(await ordenDe()).toBeNull()
  })

  it('GA-RE-2 · Garantía + OVI con el cargo da 201', async () => {
    await sembrar(); await ticket({ tipo: GARANTIA })
    expect((await remitir(await directorTecnico(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('GA-RE-3 · CARACTERIZACIÓN · Garantía sin orden se remisiona igual (S-2): 201', async () => {
    await sembrar(); await ticket({ tipo: GARANTIA })
    expect((await remitir(await sinCargo(), {})).status).toBe(201)
  })

  it('GA-RE-4 · CARACTERIZACIÓN · Garantía que reenvía la OV que ya traía: 201 (S-1, no entra)', async () => {
    await sembrar(); await ticket({ tipo: GARANTIA, orden: 'OV-2026-001', salesorderId: 'soOV' })
    expect((await remitir(await sinCargo(), { salesOrderId: 'soOV' })).status).toBe(201)
  })

  it('GA-RE-5 · CARACTERIZACIÓN · una OVI en un ticket que no es de Garantía se admite con el cargo (fuera de alcance, E-157 pto. 7)', async () => {
    await sembrar(); await ticket({ tipo: 'Mantenimiento' })
    expect((await remitir(await directorTecnico(), { salesOrderId: 'soOVI' })).status).toBe(201)
  })

  it('POS-RE-5 · Garantía + OV ya asociada a otro ticket: gana el 422 de garantía (C), no el 409 (D)', async () => {
    await sembrar(); await ticket({ tipo: GARANTIA })
    await db.query("INSERT INTO tickets (id,number,subject,status,orden_venta,salesorder_id) VALUES ('t-dueno',7001,'Ajeno','Ingresado','OV-2026-001','soOV')")
    const res = await remitir(await sinCargo(), { salesOrderId: 'soOV' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain(TEXTO_GARANTIA)
  })

  it('POS-RE-6 · CARACTERIZACIÓN · Garantía + OV con sufijo no canónico: gana la cuarentena, no la de garantía (S-9)', async () => {
    await sembrar(); await ticket({ tipo: GARANTIA })
    const res = await remitir(await sinCargo(), { salesOrderId: 'soX9' })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('sufijo')
  })

  it('POS-RE-7 · Garantía + subOV vencida: gana el contrato vencido (C), antes que la garantía (C)', async () => {
    await sembrar(); await ticket({ tipo: GARANTIA })
    await crearContrato(db, { clientId: 'cli1', lote: 'OV-2026-170', fechaInicio: dias(-100), fechaFin: dias(-10), creadoPor: 'Comercial' })
    const res = await remitir(await sinCargo(), { salesOrderId: 'soVenc' })
    expect(res.status).toBe(422)
    expect(res.body.error).not.toContain(TEXTO_GARANTIA)
  })

})
