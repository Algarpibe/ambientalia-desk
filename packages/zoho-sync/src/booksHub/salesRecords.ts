import type { Queryable } from '../db/migrate'

export interface AggRow { category_name: string; record_type: string; record_month: number; record_year: number; amount_usd: number }

/** Agregación desde books.* (copiada literal del workflow n8n "Transform to sales_records"). */
export const AGGREGATE_SQL = `WITH ord AS (
  SELECT s.salesorder_id, s.date, (s.raw->>'invoiced_status') st, sum(l.bcy_rate*l.quantity) gross
  FROM books.salesorder_line_items l JOIN books.sales_orders s ON s.salesorder_id=l.salesorder_id
  WHERE s.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND s.status NOT IN ('void','draft')
  GROUP BY 1,2,3
),
oi AS (
  SELECT i.salesorder_id, sum(li.bcy_rate*li.quantity) inv
  FROM books.invoice_line_items li JOIN books.invoices i ON i.invoice_id=li.invoice_id
  WHERE i.salesorder_id IS NOT NULL AND i.salesorder_id<>'' AND li.bcy_rate IS NOT NULL AND i.status NOT IN ('void','draft')
  GROUP BY 1
),
frac AS (
  SELECT o.salesorder_id, o.date,
    CASE WHEN o.st='not_invoiced' THEN 1
         WHEN o.st='partially_invoiced' AND o.gross>0 THEN greatest(0,(o.gross-coalesce(oi.inv,0))/o.gross)
         ELSE 0 END f
  FROM ord o LEFT JOIN oi ON oi.salesorder_id=o.salesorder_id
),
lines AS (
  SELECT it.category_name cat,'INVOICE' rt, extract(year from i.date)::int yy, extract(month from i.date)::int mm,
    l.bcy_rate*l.quantity * COALESCE(1 - COALESCE((i.raw->>'bcy_discount_total')::numeric,0)/NULLIF(i.bcy_sub_total,0),1) amt
  FROM books.invoice_line_items l JOIN books.invoices i ON i.invoice_id=l.invoice_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE i.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND i.status NOT IN ('void','draft')
  UNION ALL
  SELECT it.category_name,'SALES_ORDER', extract(year from s.date)::int, extract(month from s.date)::int,
    l.bcy_rate*l.quantity * COALESCE(1 - COALESCE((s.raw->>'bcy_discount_total')::numeric,0)/NULLIF(s.bcy_sub_total,0),1)
  FROM books.salesorder_line_items l JOIN books.sales_orders s ON s.salesorder_id=l.salesorder_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE s.date IS NOT NULL AND l.bcy_rate IS NOT NULL AND s.status NOT IN ('void','draft')
  UNION ALL
  SELECT it.category_name,'BACKLOG', extract(year from f.date)::int, extract(month from f.date)::int,
    l.bcy_rate*l.quantity * f.f
  FROM books.salesorder_line_items l JOIN frac f ON f.salesorder_id=l.salesorder_id LEFT JOIN books.items it ON it.item_id=l.item_id
  WHERE l.bcy_rate IS NOT NULL AND f.f > 0
)
SELECT cat AS category_name, rt AS record_type, mm AS record_month, yy AS record_year, round(sum(amt),2) AS amount_usd
FROM lines WHERE cat IS NOT NULL GROUP BY cat, rt, mm, yy`

const UPSERT_SQL = `INSERT INTO sales_records (company_id, category_id, record_type, amount_usd, record_month, record_year)
SELECT c.company_id, c.id, $1::record_type, $2::numeric, $3::int, $4::int
FROM categories c WHERE lower(c.name)=lower($5)
ON CONFLICT (company_id, category_id, record_type, record_month, record_year)
DO UPDATE SET amount_usd=EXCLUDED.amount_usd, updated_at=now()`

export async function runAggregate(hub: Queryable): Promise<AggRow[]> {
  const r = await hub.query(AGGREGATE_SQL)
  return r.rows as AggRow[]
}

/**
 * Reemplaza el workflow n8n: agrega books.* (hub) y reescribe sales_records (sales-tracker) en una transacción.
 * `salesTracker` DEBE ser una conexión única (un client de pool), no el pool, para que BEGIN/COMMIT sean atómicos.
 */
export async function deriveSalesRecords(deps: {
  hub: Queryable
  salesTracker: Queryable
  aggregate?: (hub: Queryable) => Promise<AggRow[]>
}): Promise<{ rows: number }> {
  const { hub, salesTracker, aggregate = runAggregate } = deps
  const rows = await aggregate(hub)
  await salesTracker.query('BEGIN')
  try {
    await salesTracker.query('DELETE FROM sales_records WHERE record_year >= 2020')
    for (const r of rows) {
      await salesTracker.query(UPSERT_SQL, [r.record_type, r.amount_usd, r.record_month, r.record_year, r.category_name])
    }
    await salesTracker.query('COMMIT')
  } catch (e) {
    await salesTracker.query('ROLLBACK').catch(() => {}) // no enmascarar el error original si el ROLLBACK falla
    throw e
  }
  return { rows: rows.length }
}
