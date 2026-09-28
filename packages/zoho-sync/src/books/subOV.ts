import { clasificarOV, motivoCuarentena } from '@ambientalia/shared'
import type { Queryable } from '../db/migrate'

/**
 * Lista de cuarentena y saldo por lote de subOV (asociacion-ov-ticket, lote 5; `zoho-sync` RQ-ZS-14).
 *
 * La clasificación es de TS (`clasificarOV`): pg-mem, el motor de las pruebas, no tiene el operador `~`.
 *
 * Una subOV en cuarentena (`OV-2026-170-X9`) no tiene lote canónico según el clasificador, así que NUNCA
 * entra en el saldo de ningún lote: sólo cuentan las subOV canónicas del lote pedido. Se lista aparte.
 *
 * S-11: «creadas» son las subOV canónicas del lote con estado distinto de borrador y anulada.
 * HIPÓTESIS: los literales son 'draft' y 'void' (estados de una orden de venta de Zoho Books). Lo verificado
 * en el repositorio es `status NOT IN ('void','draft')` (`booksHub/salesRecords.ts:9`) y
 * `order_status = 'open'` (`books/repo.ts:171`); ningún fichero fija los literales de `order_status`, así
 * que se comprueban `order_status` y `status`.
 */
const ESTADOS_FUERA_DEL_SALDO = ['draft', 'void']

export interface OVCuarentena { id: string; number: string; customer_name: string | null; motivo: string }

export interface SaldoLote { lote: string; creadas: number; consumidas: number; libres: number; consumido: number }

/** Las órdenes de venta cuyo número está en cuarentena, por número. */
export async function listarCuarentena(db: Queryable): Promise<OVCuarentena[]> {
  const r = await db.query('SELECT id, number, customer_name FROM sales_orders ORDER BY number')
  return r.rows.flatMap((row) => {
    const motivo = motivoCuarentena(row.number)
    return motivo ? [{ id: String(row.id), number: String(row.number), customer_name: row.customer_name ?? null, motivo }] : []
  })
}

/** Creadas / consumidas (asociación vigente) / libres y `consumido` = consumidas / creadas, en %. NO es el «% ejecutado» de Gerencia (ejecutada = subOV con ticket FINALIZADO, `decision/anexo-53-contratos`; cambio 3 de F1B-11): ése no se implementa aquí. */
export async function saldoPorLote(db: Queryable, lote: string): Promise<SaldoLote> {
  const so = await db.query('SELECT id, number, status, order_status FROM sales_orders WHERE number LIKE $1', [`${lote}-%`])
  const creadas = so.rows.filter((row) => {
    const c = clasificarOV(row.number)
    if (c.tipo !== 'subov' || c.lote !== lote) return false
    return !ESTADOS_FUERA_DEL_SALDO.includes(String(row.order_status ?? '')) && !ESTADOS_FUERA_DEL_SALDO.includes(String(row.status ?? ''))
  })
  const v = await db.query('SELECT numero, salesorder_id FROM ov_asociaciones WHERE liberada_at IS NULL')
  const porNumero = new Set(v.rows.map((a) => String(a.numero)))
  const porId = new Set(v.rows.flatMap((a) => (a.salesorder_id ? [String(a.salesorder_id)] : [])))
  const consumidas = creadas.filter((row) => porNumero.has(String(row.number)) || porId.has(String(row.id))).length
  return {
    lote, creadas: creadas.length, consumidas, libres: creadas.length - consumidas,
    consumido: creadas.length === 0 ? 0 : Math.round((100 * consumidas) / creadas.length),
  }
}
