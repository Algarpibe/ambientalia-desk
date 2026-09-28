import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { asociarOV, liberarAsociacion } from '../db/ovAsociaciones'
import { searchSalesOrders } from './repo'
import { listarCuarentena, saldoPorLote } from './subOV'

/**
 * Saldo por lote y lista de cuarentena (asociacion-ov-ticket, lote 5; `zoho-sync` RQ-ZS-14).
 *
 * Supuesto del orquestador (2026-09-28): el escenario «5 creadas, 2, 2, 40 %» de la spec era incoherente
 * (libres = creadas − consumidas). Se fija: cinco subOV canónicas —dos vigentes, tres libres— y una SEXTA en
 * cuarentena → 5 / 2 / 3 / 40 %, la de cuarentena fuera del recuento y dentro de `listarCuarentena`.
 * Una subOV en cuarentena (`OV-2026-170-X9`) no tiene lote canónico según SUBOV: nunca entra en el saldo
 * de ningún lote, porque sólo cuentan las subOV canónicas del lote pedido.
 *
 * HIPÓTESIS: 'draft' y 'void' como literales de `order_status` de Zoho Books para borrador y anulada. Lo
 * verificado en el repositorio es `status NOT IN ('void','draft')` (`booksHub/salesRecords.ts:9`) y
 * `order_status = 'open'` (`books/repo.ts:171`); ningún fichero fija los literales de `order_status`.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

const LOTE = 'OV-2026-170'
async function ov(id: string, number: string, estado = 'open'): Promise<void> {
  await db.query(
    "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,customer_name,date,total,status,raw) VALUES ($1,$2,'cliA','Corola','2026-06-01',200,$3,$4)",
    [id, number, estado, JSON.stringify({ order_status: estado })],
  )
}
const asociar = (ticketId: string, numero: string, salesorderId: string | null) =>
  asociarOV(db, { ticketId, numero, salesorderId, origen: 'alta', actor: 't', fechaOrdenCompra: null })

async function lote5ConCuarentena(): Promise<void> {
  for (const n of ['01', '02', '03', '04', '05']) await ov(`s${n}`, `${LOTE}-${n}`)
  await ov('sq', `${LOTE}-X9`) // cuarentena
  await asociar('t1', `${LOTE}-01`, 's01')
  await asociar('t2', `${LOTE}-02`, 's02')
}

describe('saldoPorLote', () => {
  it('cinco subOV canónicas (2 vigentes, 3 libres) y una sexta en cuarentena → 5/2/3/40, cuarentena fuera', async () => {
    await lote5ConCuarentena()
    expect(await saldoPorLote(db, LOTE)).toEqual({ lote: LOTE, creadas: 5, consumidas: 2, libres: 3, consumido: 40 })
  })

  it('S-11: una subOV en borrador y otra anulada no cuentan como creadas', async () => {
    await lote5ConCuarentena()
    await ov('sd', `${LOTE}-06`, 'draft')
    await ov('sv', `${LOTE}-07`, 'void')
    expect(await saldoPorLote(db, LOTE)).toEqual({ lote: LOTE, creadas: 5, consumidas: 2, libres: 3, consumido: 40 })
  })

  it('una asociación liberada cuenta como libre, no como consumida', async () => {
    await lote5ConCuarentena()
    const a = await asociar('t3', `${LOTE}-03`, 's03')
    expect((await saldoPorLote(db, LOTE)).consumidas).toBe(3)
    await liberarAsociacion(db, a.id, 'Comercial', 'error de tecleo')
    expect(await saldoPorLote(db, LOTE)).toEqual({ lote: LOTE, creadas: 5, consumidas: 2, libres: 3, consumido: 40 })
  })

  it('una asociación sin salesorder_id se reconoce por número', async () => {
    await ov('s01', `${LOTE}-01`)
    await asociar('t1', `${LOTE}-01`, null)
    expect(await saldoPorLote(db, LOTE)).toMatchObject({ creadas: 1, consumidas: 1, libres: 0, consumido: 100 })
  })

  it('un lote sin subOV da ceros, sin dividir por cero, y no mezcla otros lotes', async () => {
    await ov('s1', 'OV-2026-171-01')
    expect(await saldoPorLote(db, LOTE)).toEqual({ lote: LOTE, creadas: 0, consumidas: 0, libres: 0, consumido: 0 })
  })
})

describe('cuarentena fuera del buscador y del saldo, dentro de su lista (RQ-ZS-14, escenario 2)', () => {
  it('la subOV OV-2026-170-X9 no sale en soloLibres ni en el saldo, y sí en listarCuarentena', async () => {
    await lote5ConCuarentena()
    const libres = (await searchSalesOrders(db, 'OV-2026-170', undefined, 20, true)).map((s) => s.number)
    expect(libres).not.toContain(`${LOTE}-X9`)
    expect(libres).toContain(`${LOTE}-03`)
    expect((await saldoPorLote(db, LOTE)).creadas).toBe(5)
    const cuarentena = await listarCuarentena(db)
    expect(cuarentena.map((c) => c.number)).toEqual([`${LOTE}-X9`])
    expect(cuarentena[0].motivo).toContain(`${LOTE}-X9`)
  })
})
