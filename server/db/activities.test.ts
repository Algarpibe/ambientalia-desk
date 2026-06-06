import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertActivity, getActivities, getAllActivities } from './activities'
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

describe('getAllActivities', () => {
  it('lista con ticketNumber + owner; filtros abiertas/vencidas; search', async () => {
    await db.query("INSERT INTO agents (id,name,source) VALUES ('g1','Ana','zoho')")
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',55,'T','Ingresado')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,priority,due_date,created_time,owner_id) VALUES ('a1','t1','Informe','In Progress','Open','High','2026-12-31T00:00:00Z','2026-01-01T00:00:00Z','g1')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,due_date,created_time) VALUES ('a2','t1','Cerrada','Completed','Closed','2020-01-01T00:00:00Z','2020-01-01T00:00:00Z')")
    await db.query("INSERT INTO activities (id,ticket_id,subject,status,status_type,due_date,created_time) VALUES ('a3','t1','Vieja abierta','Not Started','Open','2020-01-01T00:00:00Z','2019-01-01T00:00:00Z')")
    const all = await getAllActivities(db, { filter: 'todas', search: '', limit: 100 })
    expect(all).toHaveLength(3)
    expect(all.find((x) => x.id === 'a1')).toMatchObject({ subject: 'Informe', owner: 'Ana', ticketNumber: '#55', priority: 'High' })
    expect((await getAllActivities(db, { filter: 'abiertas', search: '', limit: 100 })).map((x) => x.id).sort()).toEqual(['a1', 'a3'])
    expect((await getAllActivities(db, { filter: 'vencidas', search: '', limit: 100 })).map((x) => x.id)).toEqual(['a3'])
    expect((await getAllActivities(db, { filter: 'todas', search: 'informe', limit: 100 })).map((x) => x.id)).toEqual(['a1'])
  })
})
