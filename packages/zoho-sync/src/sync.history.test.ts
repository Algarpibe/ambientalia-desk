import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('syncTicketHistory', () => {
  it('pagina y hace upsert del historial de Zoho', async () => {
    const ev = { eventName: 'CommentAdded', eventTime: '2026-06-04T10:00:00Z', actor: { name: 'Ana', type: 'Agent' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] }
    const zohoFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [ev] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })
    await sync.syncTicketHistory('t1')
    const n = (await db.query("SELECT count(*)::int AS c FROM ticket_history WHERE ticket_id='t1'")).rows[0]
    expect(n.c).toBe(1)
    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/t1/History')
  })
})

/**
 * El endpoint de historia NO acepta el mismo tamaño de página que el resto: `limit` está acotado a
 * 1-50 y con 100 Zoho responde 422 «exceeds the range of 1-50». Es lo que hacía `syncTicketHistory`
 * desde el primer día, así que la historia de Zoho NUNCA llegó a poblarse: la ruta se traga el error
 * con un `warn` y enseña el histórico de `ticket_transitions`, que en un ticket venido de Zoho está
 * casi vacío. Un fallo que no se parecía a un fallo.
 */
describe('syncTicketHistory · tamaño de página', () => {
  const paginaVacia = () => new Response(JSON.stringify({ data: [] }), { status: 200 })

  it('no pide más de 50 eventos por página, que es el máximo del endpoint', async () => {
    const zohoFetch = vi.fn().mockResolvedValue(paginaVacia())
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    await sync.syncTicketHistory('t1')

    const limit = Number(new URL(String(zohoFetch.mock.calls[0][0]), 'https://x').searchParams.get('limit'))
    expect(limit).toBeGreaterThan(0)
    expect(limit).toBeLessThanOrEqual(50)
  })

  /**
   * El avance tiene que ir atado al tamaño de página. Si se corrige el `limit` y se deja el salto en
   * 100, cada página se saltaría la mitad de los eventos — y el resultado seguiría pareciendo correcto
   * porque nadie sabe cuántos eventos debía traer ese ticket.
   */
  it('la página siguiente empieza justo donde acabó la anterior', async () => {
    const lleno = (n: number) => Array.from({ length: n }, () => ({ eventName: 'CommentAdded', eventTime: '2024-01-04T16:00:29Z', actor: { name: 'Ana' }, eventInfo: [] }))
    let primera = true
    const zohoFetch = vi.fn().mockImplementation(async () => {
      if (!primera) return paginaVacia()
      primera = false
      const url = zohoFetch.mock.calls[0][0] as string
      const limit = Number(new URL(url, 'https://x').searchParams.get('limit'))
      return new Response(JSON.stringify({ data: lleno(limit) }), { status: 200 })
    })
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    await sync.syncTicketHistory('t1')

    const params = (i: number) => new URL(String(zohoFetch.mock.calls[i][0]), 'https://x').searchParams
    const from0 = Number(params(0).get('from')), limit0 = Number(params(0).get('limit'))
    expect(zohoFetch).toHaveBeenCalledTimes(2)
    expect(Number(params(1).get('from'))).toBe(from0 + limit0)
  })
})
