import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertActivity, getActivities } from './activities'
import { activityRowFromZoho } from './mappers'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('activities repo', () => {
  it('upsert + getActivities filtra por ticket, ordena por due/created y resuelve owner', async () => {
    await db.query("INSERT INTO agents (id,name,source) VALUES ('g1','Ana P','zoho')")
    await upsertActivity(db, activityRowFromZoho({ id: 'a1', ticketId: 't1', subject: 'Vence después', dueDate: '2026-03-25T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', status: 'Not Started', ownerId: 'g1' }))
    await upsertActivity(db, activityRowFromZoho({ id: 'a2', ticketId: 't1', subject: 'Vence antes', dueDate: '2026-03-22T00:00:00Z', createdTime: '2026-03-20T00:00:00Z', status: 'In Progress', assignee: { firstName: 'Beto', lastName: '' } }))
    await upsertActivity(db, activityRowFromZoho({ id: 'a3', ticketId: 't2', subject: 'Otro ticket', dueDate: '2026-03-21T00:00:00Z', status: 'Completed' }))
    const acts = await getActivities(db, 't1')
    expect(acts.map((a) => a.id)).toEqual(['a2', 'a1'])
    expect(acts[1].owner).toBe('Ana P')   // a1: owner_name null → resuelto por agents
    expect(acts[0].owner).toBe('Beto')     // a2: owner_name del assignee
  })
})
