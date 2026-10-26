// ficha-garantia-proveedor (F1B-13), lote 1a: la capa de datos de `public.garantia_proveedor`.
// Molde de `contratos.test.ts:12-13` (pg-mem con `migrate`).
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { asociarOV, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import type { RespuestaReclamacion } from '@ambientalia/shared'
import {
  ReclamacionYaRespondidaError, asociacionPorId, respuestaDeAsociacion, registrarRespuesta, reclamacionPorId,
  editarFicha, avanzarFicha, garantiaDelTicket, fichasSinResolverNiAvisar, fotoDeLaOVI,
} from './garantiaProveedor'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const si: RespuestaReclamacion = { reclama: true, fabricante: 'Acme', piezaReferencia: 'P-1', piezaSerial: 'S-9' }
const no: RespuestaReclamacion = { reclama: false, motivo: 'mal_uso' }

async function ticket(id = 't1', marca: string | null = 'Acme'): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, subject, status, marca) VALUES ($1, 1, $2, $3, $4)', [id, 's', 'Ingresado', marca])
}
async function asociar(numero: string, ticketId = 't1') {
  const a = await asociarOV(db, { ticketId, numero, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  return (await asociacionPorId(db, a.id))!
}

describe('registrarRespuesta y sus lecturas (RQ-TC-44, RQ-TC-45)', () => {
  it('ida y vuelta de un «sí»: nace abierta, origen manual, valores numéricos como Number e instantes ISO (H-2)', async () => {
    await ticket()
    const f = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'dt@x' })
    expect(f).toMatchObject({
      reclama: true, motivoNoReclama: null, ticketId: 't1', oviNumero: 'OVI-1', respondidaPor: 'dt@x',
      fabricante: 'Acme', piezaReferencia: 'P-1', piezaSerial: 'S-9', rma: null, valorReclamado: null,
      origenValorReclamado: 'manual', estado: 'abierta', resultado: null, valorRecuperado: null,
      enviadaAt: null, resueltaAt: null, aviso60At: null,
    })
    expect(typeof f.id).toBe('number')
    expect(typeof f.asociacionId).toBe('number')
    expect(f.moneda).toBe('USD')
    expect(f.respondidaAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(await reclamacionPorId(db, f.id)).toEqual(f)
    expect(await respuestaDeAsociacion(db, f.asociacionId)).toEqual(f)
  })

  it('ida y vuelta de un «no»: sin estado ni fabricante, con su motivo', async () => {
    await ticket()
    const f = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: no, por: 'dt@x' })
    expect(f).toMatchObject({ reclama: false, motivoNoReclama: 'mal_uso', estado: null, fabricante: null, valorReclamado: null, origenValorReclamado: null })
  })

  it('sin foto el valor reclamado queda null y el origen es manual (CARACTERIZACIÓN)', async () => {
    await ticket()
    const f = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'dt@x' })
    expect(f).toMatchObject({ valorReclamado: null, origenValorReclamado: 'manual' })
    expect(await reclamacionPorId(db, 999)).toBeNull()
  })

  it('una segunda respuesta a la misma asociación → ReclamacionYaRespondidaError (el 23505 traducido) y se conserva la primera', async () => {
    await ticket()
    const a = await asociar('OVI-1')
    const primera = await registrarRespuesta(db, { asociacion: a, respuesta: no, por: 'a' })
    await expect(registrarRespuesta(db, { asociacion: a, respuesta: si, por: 'b' })).rejects.toBeInstanceOf(ReclamacionYaRespondidaError)
    expect(await respuestaDeAsociacion(db, a.id)).toEqual(primera)
  })

  it('asociacionPorId: la vigente no está liberada, la liberada sí, y lo que no existe es null', async () => {
    await ticket()
    const a = await asociar('OVI-1')
    expect(a).toEqual({ id: a.id, ticketId: 't1', numero: 'OVI-1', liberada: false })
    await liberarAsociacion(db, a.id, 'c', 'error')
    expect((await asociacionPorId(db, a.id))!.liberada).toBe(true)
    expect(await asociacionPorId(db, 999)).toBeNull()
  })
})

describe('numeric de node-postgres llega como TEXTO (H-2)', () => {
  it('el mapeador convierte a number los valores que la base entrega como texto', async () => {
    const fila = {
      id: '7', asociacion_id: '3', ticket_id: 't1', ovi_numero: 'OVI-1', reclama: true, motivo_no_reclama: null, respondida_por: 'x',
      respondida_at: new Date('2026-10-01T10:00:00Z'), fabricante: 'Acme', pieza_referencia: null, pieza_serial: null, rma: null,
      valor_reclamado: '800000.50', origen_valor_reclamado: 'manual', estado: 'resuelta', resultado: 'reposicion',
      valor_recuperado: '300', enviada_at: null, resuelta_at: null, aviso_60_at: null,
    }
    const falsa = { query: async () => ({ rows: [fila] }) } as unknown as Queryable
    const f = (await reclamacionPorId(falsa, 7))!
    expect(f.valorReclamado).toBe(800000.5)
    expect(f.valorRecuperado).toBe(300)
    expect(typeof f.id).toBe('number')
    expect(f.respondidaAt).toBe('2026-10-01T10:00:00.000Z')
  })
})

describe('la base respalda la coherencia sí/no (CHECK, H-1)', () => {
  const base = "INSERT INTO public.garantia_proveedor (asociacion_id, ticket_id, ovi_numero, reclama, motivo_no_reclama, estado, fabricante, respondida_por)"
  it('«sí» con motivo, «no» sin motivo y «no» con estado se rechazan; «sí» abierta y «no» con motivo pasan', async () => {
    await expect(db.query(`${base} VALUES (1, 't', 'OVI-1', true, 'mal_uso', 'abierta', 'A', 'x')`)).rejects.toThrow()
    await expect(db.query(`${base} VALUES (2, 't', 'OVI-2', false, NULL, NULL, NULL, 'x')`)).rejects.toThrow()
    await expect(db.query(`${base} VALUES (3, 't', 'OVI-3', false, 'mal_uso', 'abierta', NULL, 'x')`)).rejects.toThrow()
    await db.query(`${base} VALUES (4, 't', 'OVI-4', true, NULL, 'abierta', 'A', 'x')`)
    await db.query(`${base} VALUES (5, 't', 'OVI-5', false, 'mal_uso', NULL, NULL, 'x')`)
  })
})

describe('editarFicha, condicionada (RQ-TC-45)', () => {
  it('reemplaza los cinco datos de una ficha abierta; null si resuelta o si es un «no»', async () => {
    await ticket()
    const f = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'x' })
    const e = await editarFicha(db, f.id, { fabricante: 'Otro', piezaReferencia: null, piezaSerial: 'S-2', rma: 'RMA-7', valorReclamado: 5 }, 'manual')
    expect(e).toMatchObject({ fabricante: 'Otro', piezaReferencia: null, piezaSerial: 'S-2', rma: 'RMA-7', valorReclamado: 5, estado: 'abierta' })
    await avanzarFicha(db, f.id, 'abierta', { a: 'enviada' })
    await avanzarFicha(db, f.id, 'enviada', { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })
    expect(await editarFicha(db, f.id, { fabricante: 'X', piezaReferencia: null, piezaSerial: null, rma: null, valorReclamado: null }, 'manual')).toBeNull()

    const n = await registrarRespuesta(db, { asociacion: await asociar('OVI-2'), respuesta: no, por: 'x' })
    expect(await editarFicha(db, n.id, { fabricante: 'X', piezaReferencia: null, piezaSerial: null, rma: null, valorReclamado: null }, 'manual')).toBeNull()
    expect(await editarFicha(db, 999, { fabricante: 'X', piezaReferencia: null, piezaSerial: null, rma: null, valorReclamado: null }, 'manual')).toBeNull()
  })
})

describe('avanzarFicha, condicionada al estado leído (RQ-TC-46, RQ-TC-47)', () => {
  it('abierta → enviada pone enviada_at; enviada → resuelta pone resuelta_at, resultado y valor', async () => {
    await ticket()
    const f = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'x' })
    const e = (await avanzarFicha(db, f.id, 'abierta', { a: 'enviada' }))!
    expect(e.estado).toBe('enviada')
    expect(e.enviadaAt).toMatch(/^\d{4}-/)
    expect(e.resueltaAt).toBeNull()
    const r = (await avanzarFicha(db, f.id, 'enviada', { a: 'resuelta', resultado: 'nota_credito', valorRecuperado: 300 }))!
    expect(r).toMatchObject({ estado: 'resuelta', resultado: 'nota_credito', valorRecuperado: 300 })
    expect(r.resueltaAt).toMatch(/^\d{4}-/)
    expect(r.enviadaAt).toBe(e.enviadaAt)
  })

  it('con el estado viejo no toca nada y devuelve null', async () => {
    await ticket()
    const f = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'x' })
    await avanzarFicha(db, f.id, 'abierta', { a: 'enviada' })
    expect(await avanzarFicha(db, f.id, 'abierta', { a: 'enviada' })).toBeNull()
    expect(await avanzarFicha(db, f.id, 'abierta', { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })).toBeNull()
    expect((await reclamacionPorId(db, f.id))).toMatchObject({ estado: 'enviada', resultado: null, resueltaAt: null })
  })
})

describe('garantiaDelTicket (RQ-TC-48, RQ-TC-49)', () => {
  it('una OVI vigente sin respuesta sale pendiente; la OV ordinaria no sale; el fabricante propuesto es la marca del ticket', async () => {
    await ticket('t1', 'Acme')
    const a = await asociar('OVI-1')
    await asociar('OV-2026-5')
    expect(await garantiaDelTicket(db, 't1')).toEqual({
      fabricantePropuesto: 'Acme',
      ovis: [{ asociacionId: a.id, numero: 'OVI-1', liberada: false, respuesta: null, pendiente: true }],
    })
  })

  it('con respuesta ya no es pendiente y trae su ficha', async () => {
    await ticket()
    const f = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'x' })
    const g = await garantiaDelTicket(db, 't1')
    expect(g.ovis).toHaveLength(1)
    expect(g.ovis[0]).toMatchObject({ pendiente: false, respuesta: f })
  })

  it('liberada SIN respuesta no sale; liberada CON respuesta sale con su ficha intacta (S-8, S-11)', async () => {
    await ticket()
    const sin = await asociar('OVI-1')
    const con = await asociar('OVI-2')
    const f = await registrarRespuesta(db, { asociacion: con, respuesta: si, por: 'x' })
    await liberarAsociacion(db, sin.id, 'c', 'error')
    await liberarAsociacion(db, con.id, 'c', 'error')
    const g = await garantiaDelTicket(db, 't1')
    expect(g.ovis.map((o) => o.numero)).toEqual(['OVI-2'])
    expect(g.ovis[0]).toMatchObject({ liberada: true, pendiente: false, respuesta: f })
  })

  it('un ticket sin marca no propone fabricante, y uno sin OVI devuelve la lista vacía', async () => {
    await ticket('t1', null)
    expect(await garantiaDelTicket(db, 't1')).toEqual({ fabricantePropuesto: null, ovis: [] })
    expect(await garantiaDelTicket(db, 'no-existe')).toEqual({ fabricantePropuesto: null, ovis: [] })
  })
})

describe('fichasSinResolverNiAvisar (lote 2)', () => {
  it('trae las abiertas y enviadas sin marca; no las resueltas, ni los «no», ni las ya marcadas', async () => {
    await ticket()
    const a = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'x' })
    const b = await registrarRespuesta(db, { asociacion: await asociar('OVI-2'), respuesta: si, por: 'x' })
    await avanzarFicha(db, b.id, 'abierta', { a: 'enviada' })
    const c = await registrarRespuesta(db, { asociacion: await asociar('OVI-3'), respuesta: si, por: 'x' })
    await avanzarFicha(db, c.id, 'abierta', { a: 'enviada' })
    await avanzarFicha(db, c.id, 'enviada', { a: 'resuelta', resultado: 'rechazada', valorRecuperado: 0 })
    await registrarRespuesta(db, { asociacion: await asociar('OVI-4'), respuesta: no, por: 'x' })
    const d = await registrarRespuesta(db, { asociacion: await asociar('OVI-5'), respuesta: si, por: 'x' })
    await db.query('UPDATE public.garantia_proveedor SET aviso_60_at = now() WHERE id = $1', [d.id])
    expect((await fichasSinResolverNiAvisar(db)).map((f) => f.id)).toEqual([a.id, b.id])
  })
})

// valor-reclamado-usd (F1B-13), lote L2: la foto del valor reclamado (RQ-TC-78), el origen al editar (RQ-TC-79) y la
// moneda (RQ-TC-80). Fixtures de Books con pg-mem: `raw` serializado como en `packages/zoho-sync/src/books/subOV.test.ts:31-32`.
const LINEAS_BASE = [{ item_id: 'a1', quantity: 2 }, { item_id: 'a2', quantity: 1 }]
const COSTOS_BASE: Array<[string, number | null]> = [['a1', 150.54], ['a2', 10]]
const SIN_FOTO_ESPERADA = { valorReclamado: null, origenValorReclamado: 'manual' }

/** Una OVI asociada a una orden de Books (si `orden`) con su catálogo de costos; devuelve el id de la asociación. */
async function oviConOrden(o: { numero?: string; raw?: unknown; costos?: Array<[string, number | null]>; salesorderId?: string | null; orden?: boolean } = {}): Promise<number> {
  const { numero = 'OVI-1', raw = { line_items: LINEAS_BASE }, costos = COSTOS_BASE, salesorderId = 'so-1', orden = true } = o
  await ticket()
  if (orden) await db.query('INSERT INTO books.sales_orders (salesorder_id, salesorder_number, raw) VALUES ($1, $2, $3)', ['so-1', 'OV-1', JSON.stringify(raw)])
  for (const [id, costo] of costos) await db.query('INSERT INTO books.items (item_id, name, purchase_rate) VALUES ($1, $2, $3)', [id, `Art ${id}`, costo])
  const a = await asociarOV(db, { ticketId: 't1', numero, salesorderId, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  return Number(a.id)
}

describe('fotoDeLaOVI: la foto del valor reclamado (RQ-TC-78)', () => {
  it('2 × 150,54 + 1 × 10 = 311,08 con origen ovi, y se guarda y se lee con ese valor', async () => {
    const id = await oviConOrden()
    const foto = await fotoDeLaOVI(db, id)
    expect(foto).toEqual({ valorReclamado: 311.08, origenValorReclamado: 'ovi' })
    const f = await registrarRespuesta(db, { asociacion: (await asociacionPorId(db, id))!, respuesta: si, por: 'x', foto })
    expect(f).toMatchObject({ valorReclamado: 311.08, origenValorReclamado: 'ovi', moneda: 'USD' })
    expect(typeof f.valorReclamado).toBe('number')
    expect(await reclamacionPorId(db, f.id)).toEqual(f)
  })

  it('un artículo repetido en dos líneas cuenta dos veces: 2 × 1 × 20 = 40', async () => {
    const id = await oviConOrden({ raw: { line_items: [{ item_id: 'a1', quantity: 1 }, { item_id: 'a1', quantity: 1 }] }, costos: [['a1', 20]] })
    expect(await fotoDeLaOVI(db, id)).toEqual({ valorReclamado: 40, origenValorReclamado: 'ovi' })
  })

  it('una asociación que no existe da SIN_FOTO aunque haya una orden y un catálogo completos', async () => {
    await oviConOrden()
    expect(await fotoDeLaOVI(db, 9999)).toEqual(SIN_FOTO_ESPERADA)
  })

  const HUECOS: Array<[string, Parameters<typeof oviConOrden>[0]]> = [
    ['asociación sin salesorder_id', { salesorderId: null }],
    ['sin fila de la orden en books.sales_orders', { orden: false }],
    ['orden sin line_items', { raw: { order_status: 'open' } }],
    ['line_items vacía', { raw: { line_items: [] } }],
    ['una línea sin item_id', { raw: { line_items: [{ item_id: 'a1', quantity: 2 }, { quantity: 1 }] } }],
    ['cantidad 0', { raw: { line_items: [{ item_id: 'a1', quantity: 0 }, { item_id: 'a2', quantity: 1 }] } }],
    ['cantidad en texto', { raw: { line_items: [{ item_id: 'a1', quantity: '2' }, { item_id: 'a2', quantity: 1 }] } }],
    ['artículo ausente de books.items', { costos: [['a1', 150.54]] }],
    ['costo NULL', { costos: [['a1', 150.54], ['a2', null]] }],
    ['costo 0', { costos: [['a1', 150.54], ['a2', 0]] }],
  ]
  it.each(HUECOS)('hueco · %s: SIN_FOTO (null y manual)', async (_t, o) => {
    const id = await oviConOrden(o)
    expect(await fotoDeLaOVI(db, id)).toEqual(SIN_FOTO_ESPERADA)
  })

  it('nunca parcial: una línea de costo 100 y otra con artículo ausente dan null, no 100', async () => {
    const id = await oviConOrden({ raw: { line_items: [{ item_id: 'a1', quantity: 1 }, { item_id: 'a2', quantity: 1 }] }, costos: [['a1', 100]] })
    expect(await fotoDeLaOVI(db, id)).toEqual(SIN_FOTO_ESPERADA)
  })

  it('la foto no se recalcula: si el costo del catálogo cambia después, la ficha conserva 311,08 (S-11)', async () => {
    const id = await oviConOrden()
    const f = await registrarRespuesta(db, { asociacion: (await asociacionPorId(db, id))!, respuesta: si, por: 'x', foto: await fotoDeLaOVI(db, id) })
    await db.query('UPDATE books.items SET purchase_rate = 999 WHERE item_id = $1', ['a1'])
    expect((await reclamacionPorId(db, f.id))!.valorReclamado).toBe(311.08)
    expect((await fotoDeLaOVI(db, id)).valorReclamado).toBe(2 * 999 + 10)
  })

  it('con node-postgres el costo llega como TEXTO y el raw como TEXTO: cuenta igual, con ids sin repetir y sin jsonb en SQL (H-2, D-8)', async () => {
    const consultas: Array<{ sql: string; params: unknown[] }> = []
    const falsa = {
      query: async (sql: string, params: unknown[] = []) => {
        consultas.push({ sql, params })
        if (/FROM ov_asociaciones/.test(sql)) return { rows: [{ salesorder_id: 'so-9' }] }
        if (/FROM books\.sales_orders/.test(sql)) {
          return { rows: [{ raw: JSON.stringify({ line_items: [{ item_id: 'i1', quantity: 1 }, { item_id: 'i1', quantity: 1 }] }) }] }
        }
        if (/FROM books\.items/.test(sql)) return { rows: [{ item_id: 'i1', purchase_rate: '150.54' }] }
        return { rows: [] }
      },
    } as unknown as Queryable
    expect(await fotoDeLaOVI(falsa, 7)).toEqual({ valorReclamado: 301.08, origenValorReclamado: 'ovi' })
    const items = consultas.find((c) => /books\.items/.test(c.sql))!
    expect(items.params).toEqual(['i1'])
    expect(consultas.map((c) => c.sql).join(' ')).not.toMatch(/jsonb|->/i)
  })
})

describe('origen y moneda de la ficha (RQ-TC-79, RQ-TC-80)', () => {
  const datos = { fabricante: 'Acme', piezaReferencia: null, piezaSerial: null, rma: null, valorReclamado: 311.08 }

  it('editarFicha escribe el origen que recibe: ovi se conserva, manual lo cambia', async () => {
    const id = await oviConOrden()
    const f = await registrarRespuesta(db, { asociacion: (await asociacionPorId(db, id))!, respuesta: si, por: 'x', foto: await fotoDeLaOVI(db, id) })
    expect(await editarFicha(db, f.id, { ...datos, rma: 'R-1' }, 'ovi')).toMatchObject({ valorReclamado: 311.08, origenValorReclamado: 'ovi', rma: 'R-1' })
    expect(await editarFicha(db, f.id, { ...datos, valorReclamado: 300 }, 'manual')).toMatchObject({ valorReclamado: 300, origenValorReclamado: 'manual' })
    expect(await reclamacionPorId(db, f.id)).toMatchObject({ valorReclamado: 300, origenValorReclamado: 'manual' })
  })

  it('aGarantia pone moneda USD en toda ficha leída: «sí», «no», por id, por asociación y por ticket', async () => {
    await ticket()
    const a = await registrarRespuesta(db, { asociacion: await asociar('OVI-1'), respuesta: si, por: 'x' })
    const b = await registrarRespuesta(db, { asociacion: await asociar('OVI-2'), respuesta: no, por: 'x' })
    expect(a.moneda).toBe('USD')
    expect(b.moneda).toBe('USD')
    expect((await reclamacionPorId(db, a.id))!.moneda).toBe('USD')
    expect((await respuestaDeAsociacion(db, b.asociacionId))!.moneda).toBe('USD')
    expect((await garantiaDelTicket(db, 't1')).ovis.map((o) => o.respuesta!.moneda)).toEqual(['USD', 'USD'])
  })

  it('una ficha previa (valor 1500, origen manual, sin columna de moneda) sale en USD sin reescribir ningún dato', async () => {
    await ticket()
    await db.query(
      `INSERT INTO public.garantia_proveedor (asociacion_id, ticket_id, ovi_numero, reclama, respondida_por, fabricante, valor_reclamado, origen_valor_reclamado, estado)
       VALUES (1, 't1', 'OVI-1', true, 'x', 'Acme', 1500, 'manual', 'abierta')`,
    )
    const antes = (await db.query('SELECT * FROM public.garantia_proveedor')).rows
    const f = (await respuestaDeAsociacion(db, 1))!
    expect(f).toMatchObject({ moneda: 'USD', valorReclamado: 1500, origenValorReclamado: 'manual' })
    expect((await db.query('SELECT * FROM public.garantia_proveedor')).rows).toEqual(antes)
  })
})
