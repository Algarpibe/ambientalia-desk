import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertHistoryEvent, getZohoHistoryEvents } from './history'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('history repo', () => {
  it('upsert idempotente + getZohoHistoryEvents mapea y ordena', async () => {
    const ev = { eventName: 'CommentAdded', eventTime: '2026-06-04T10:00:00Z', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] }
    await upsertHistoryEvent(db, 't1', ev)
    await upsertHistoryEvent(db, 't1', ev)
    const n = (await db.query("SELECT count(*)::int AS c FROM ticket_history WHERE ticket_id='t1'")).rows[0]
    expect(n.c).toBe(1)
    const h = await getZohoHistoryEvents(db, 't1')
    expect(h[0]).toMatchObject({ title: 'Ana ha publicado un comentario' })
  })
})
