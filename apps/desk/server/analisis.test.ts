import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getAnalisisRows, getAnalisisRowsCached, clearAnalisisCache, rangeToFromTo } from './analisis'

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

describe('getAnalisisRowsCached', () => {
  beforeEach(() => { clearAnalisisCache() })

  it('cachea por TTL (5 min) y refetch al expirar', async () => {
    const fakeDb = { query: vi.fn().mockResolvedValue({ rows: [
      { status: 'Ingresado', status_type: 'Open', created_time: '2026-05-01T00:00:00Z', closed_time: null, fecha_finalizacion_st: null, dias_entrega: null, marca: null, tipo_servicio: null, classification: null, cliente: null, tecnico: null },
    ] }) } as unknown as Queryable & { query: ReturnType<typeof vi.fn> }

    // 1ª llamada: consulta la BD
    const r1 = await getAnalisisRowsCached(fakeDb, 1000)
    expect(fakeDb.query).toHaveBeenCalledTimes(1)
    expect(r1).toHaveLength(1)

    // 2ª llamada dentro del TTL: NO consulta de nuevo (caché), mismas filas
    const r2 = await getAnalisisRowsCached(fakeDb, 1000 + 60_000)
    expect(fakeDb.query).toHaveBeenCalledTimes(1)
    expect(r2).toBe(r1)

    // 3ª llamada pasado el TTL: refetch
    const r3 = await getAnalisisRowsCached(fakeDb, 1000 + 6 * 60_000)
    expect(fakeDb.query).toHaveBeenCalledTimes(2)
    expect(r3).toHaveLength(1)
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
