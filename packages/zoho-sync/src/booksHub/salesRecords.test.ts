import { describe, it, expect } from 'vitest'
import { deriveSalesRecords, type AggRow } from './salesRecords'
import type { Queryable } from '../db/migrate'

function recorder(failOn?: string) {
  const calls: { verb: string; params?: unknown[] }[] = []
  const q: Queryable = {
    query: async (sql: string, params?: unknown[]) => {
      const verb = sql.trim().split(/\s+/)[0].toUpperCase()
      calls.push({ verb, params })
      if (failOn && verb === failOn) throw new Error('boom')
      return { rows: [] }
    },
  }
  return { q, calls }
}
const agg: AggRow[] = [{ category_name: 'Repuestos', record_type: 'INVOICE', record_month: 6, record_year: 2026, amount_usd: 1234.5 }]

describe('deriveSalesRecords', () => {
  it('hace BEGIN → DELETE → INSERT(params) → COMMIT', async () => {
    const st = recorder()
    const r = await deriveSalesRecords({ hub: {} as Queryable, salesTracker: st.q, aggregate: async () => agg })
    expect(r.rows).toBe(1)
    expect(st.calls.map((c) => c.verb)).toEqual(['BEGIN', 'DELETE', 'INSERT', 'COMMIT'])
    expect(st.calls[2].params).toEqual(['INVOICE', 1234.5, 6, 2026, 'Repuestos'])
  })

  it('si falla un INSERT hace ROLLBACK y propaga', async () => {
    const st = recorder('INSERT')
    await expect(deriveSalesRecords({ hub: {} as Queryable, salesTracker: st.q, aggregate: async () => agg })).rejects.toThrow('boom')
    expect(st.calls.map((c) => c.verb)).toEqual(['BEGIN', 'DELETE', 'INSERT', 'ROLLBACK'])
  })
})
