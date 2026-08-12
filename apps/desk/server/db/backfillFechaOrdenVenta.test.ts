import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { backfillFechaOrdenVenta } from './backfillFechaOrdenVenta'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

const ov = (id: string, numero: string, fecha: string | null) =>
  db.query('INSERT INTO books.sales_orders (salesorder_id, salesorder_number, date) VALUES ($1,$2,$3)', [id, numero, fecha])

const ticket = (id: string, numero: number, soId: string | null, fecha: string | null) =>
  db.query('INSERT INTO tickets (id, number, status, salesorder_id, orden_venta, fecha_orden_venta) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, numero, 'Ingresado', soId, soId ? 'OV-' + numero : null, fecha])

/** El día en ISO. `String(new Date(...))` da «Wed Jul 15 2026», que no es lo que se quiere comparar. */
const fechaDe = async (id: string): Promise<string | null> => {
  const f = ((await db.query('SELECT fecha_orden_venta AS f FROM tickets WHERE id=$1', [id])).rows[0] as Record<string, unknown>).f
  if (f == null) return null
  return f instanceof Date ? f.toISOString().slice(0, 10) : String(f).slice(0, 10)
}

describe('backfillFechaOrdenVenta', () => {
  it('trae la fecha desde Books a los tickets que la tienen vacía', async () => {
    await ov('so1', 'OV-1', '2026-07-15')
    await ticket('app-1', 10000, 'so1', null)

    const r = await backfillFechaOrdenVenta(db)

    expect(r.actualizados).toBe(1)
    expect(r.detalle).toEqual([{ numero: 10000, ordenVenta: 'OV-10000', fecha: '2026-07-15' }])
    expect(await fechaDe('app-1')).toBe('2026-07-15')
  })

  // Una fecha ya puesta manda sobre la de Books: puede haberla corregido una persona a mano.
  it('no pisa una fecha que ya estaba', async () => {
    await ov('so1', 'OV-1', '2026-07-15')
    await ticket('app-1', 10000, 'so1', '2026-01-01')

    const r = await backfillFechaOrdenVenta(db)

    expect(r.actualizados).toBe(0)
    expect(await fechaDe('app-1')).toBe('2026-01-01')
  })

  it('cuenta aparte las órdenes que tampoco tienen fecha en Books', async () => {
    await ov('so1', 'OV-1', null)
    await ticket('app-1', 10000, 'so1', null)

    const r = await backfillFechaOrdenVenta(db)

    expect(r).toMatchObject({ actualizados: 0, sinFechaEnBooks: 1 })
    expect(await fechaDe('app-1')).toBeNull()
  })

  // Un ticket sin orden enlazada no tiene de dónde sacarla; el JOIN lo deja fuera.
  it('ignora los tickets sin orden de venta', async () => {
    await ticket('app-1', 10000, null, null)
    expect(await backfillFechaOrdenVenta(db)).toMatchObject({ actualizados: 0, sinFechaEnBooks: 0 })
  })

  it('el simulacro cuenta lo mismo pero no escribe', async () => {
    await ov('so1', 'OV-1', '2026-07-15')
    await ticket('app-1', 10000, 'so1', null)

    const seco = await backfillFechaOrdenVenta(db, { dryRun: true })

    expect(seco.actualizados).toBe(1)
    expect(await fechaDe('app-1')).toBeNull()
    expect(await backfillFechaOrdenVenta(db)).toEqual(seco)
  })
})
