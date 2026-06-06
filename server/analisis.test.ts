import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { getAnalisisRows, rangeToFromTo } from './analisis'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('getAnalisisRows', () => {
  it('finalizadoAt = fecha_finalizacion_st ?? closed_time; diasEntrega numérico; técnico por join', async () => {
    await db.query("INSERT INTO agents (id,name,source) VALUES ('g1','Ana','zoho')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time,fecha_finalizacion_st,dias_entrega,marca,assignee_id,tipo_servicio,classification) VALUES ('t1',1,'A','Finalizado','Closed','2026-05-01T00:00:00Z','2026-05-06',5,'Grimm','g1','Mantenimiento','Equipo para servicio')")
    const rows = await getAnalisisRows(db)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ status: 'Finalizado', statusType: 'Closed', diasEntrega: 5, marca: 'Grimm', tecnico: 'Ana', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio' })
    expect(rows[0].finalizadoAt?.slice(0, 10)).toBe('2026-05-06')
    expect(rows[0].createdAt?.slice(0, 10)).toBe('2026-05-01')
  })
})

describe('rangeToFromTo', () => {
  it('mapea rangos; "todo" sin cota inferior', () => {
    const now = new Date('2026-06-05T00:00:00Z')
    expect(rangeToFromTo('todo', now).from).toBeNull()
    expect(rangeToFromTo('todo', now).to).toBe(now)
    expect(rangeToFromTo('mes', now).from).not.toBeNull()
    expect(rangeToFromTo('xxx', now).from).toBeNull()
  })
})
