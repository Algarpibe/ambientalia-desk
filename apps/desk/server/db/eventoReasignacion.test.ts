// reasignacion-con-motivo (F1B-05), lote 2: la cuarta fuente del historial (trazas RQ-TZ-20, RQ-TZ-06, RQ-TZ-17). Molde de
// `traspaso.test.ts`: compositor puro aparte y `getHistorialTicket` con pg-mem y el espía de sentencias.
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { eventoReasignacion, eventosReasignacion } from './eventoReasignacion'
import { getHistorialTicket } from './historial'
import type { Reasignacion } from './reasignaciones'

const NOMBRES = new Map([['u-ana', 'Ana'], ['u-beto', 'Beto']])
const T = '2026-08-05T10:00:00.000Z'
const dato = (extra: Partial<Reasignacion> = {}): Reasignacion => ({ de: 'u-ana', a: 'u-beto', motivo: 'vacaciones', reasignadoPor: 'Carla', reasignadoAt: T, ...extra })

describe('eventoReasignacion · el evento puro (RQ-TZ-20)', () => {
  it('«Reasignación: Ana → Beto» con De, A, Motivo y Reasignado por, a la hora de la reasignación', () => {
    expect(eventoReasignacion(dato(), NOMBRES)).toEqual({
      eventName: 'AppReasignacion', time: T, actor: 'Carla', title: 'Reasignación: Ana → Beto',
      details: [{ label: 'De', value: 'Ana' }, { label: 'A', value: 'Beto' }, { label: 'Motivo', value: 'vacaciones' }, { label: 'Reasignado por', value: 'Carla' }],
    })
  })

  it('origen nulo se lee «Sin derivar»', () => {
    const ev = eventoReasignacion(dato({ de: null }), NOMBRES)
    expect(ev.title).toBe('Reasignación: Sin derivar → Beto')
    expect(ev.details[0]).toEqual({ label: 'De', value: 'Sin derivar' })
  })

  // Si el id no resuelve se enseña crudo, a propósito: verlo es lo único que permite diagnosticarlo (`ticketFuentes.ts`).
  it('un id que no resuelve se enseña crudo, en el origen y en el destino', () => {
    const ev = eventoReasignacion(dato({ de: 'u-fantasma', a: 'u-otro' }), NOMBRES)
    expect(ev.title).toBe('Reasignación: u-fantasma → u-otro')
  })
})

describe('getHistorialTicket · la reasignación entra en la línea de tiempo (RQ-TZ-06)', () => {
  let db: Queryable
  beforeEach(async () => {
    const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
    await db.query("INSERT INTO users (id,email,name,password_hash) VALUES ('u-ana','a@x.co','Ana','h'), ('u-beto','b@x.co','Beto','h')")
  })
  const ticket = (id: string) => db.query("INSERT INTO tickets (id,number,subject,status,classification) VALUES ($1,1,'A','Ingresado','Servicio')", [id])
  const reasignacion = (id: string, at = T, de: string | null = 'u-ana') =>
    db.query("INSERT INTO reasignaciones (ticket_id, de, a, motivo, reasignado_por, reasignado_at) VALUES ($1,$2,'u-beto','vacaciones','Carla',$3)", [id, de, at])
  const transicion = (id: string, at: string) =>
    db.query("INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ($1,'habilitar','Habilitar Servicio','OV asignada','Ingresado','Ana',$2)", [id, at])
  const espiar = () => {
    const sqls: string[] = []
    return { sqls, espia: { query: (sql: string, p?: unknown[]) => { sqls.push(sql.replace(/\s+/g, ' ').trim()); return db.query(sql, p) } } as unknown as Queryable }
  }

  it('una transición y una reasignación salen de la más reciente a la más antigua', async () => {
    await ticket('t1'); await transicion('t1', '2026-08-02T10:00:00Z'); await reasignacion('t1', '2026-08-05T10:00:00Z')
    const { eventos } = await getHistorialTicket(db, 't1')
    expect(eventos.map((e) => e.title)).toEqual(['Reasignación: Ana → Beto', 'Traspaso: Ana → Servicio Técnico', 'Transición: Habilitar Servicio'])
    // Y al revés: si la reasignación es anterior a la transición, baja.
    await db.query("UPDATE reasignaciones SET reasignado_at = '2026-08-01T10:00:00Z'")
    expect((await getHistorialTicket(db, 't1')).eventos.map((e) => e.eventName)).toEqual(['AppTraspaso', 'AppTransition', 'AppReasignacion'])
  })

  it('la reasignación aparece una sola vez y ninguna línea de traspaso procede de ella', async () => {
    await ticket('t2'); await reasignacion('t2')
    const { eventos } = await getHistorialTicket(db, 't2')
    expect(eventos.map((e) => e.eventName)).toEqual(['AppReasignacion'])
    expect(eventos.some((e) => e.eventName === 'AppTraspaso')).toBe(false)
  })

  it('un ajuste de `prioridad_ajustes` no entra aunque haya reasignaciones', async () => {
    await ticket('t3'); await reasignacion('t3')
    await db.query("INSERT INTO prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por, ajustado_at) VALUES ('t3','Normal','Alta','x','Ana','2026-08-06T10:00:00Z')")
    expect((await getHistorialTicket(db, 't3')).eventos.map((e) => e.eventName)).toEqual(['AppReasignacion'])
  })

  it('sin reasignaciones no se piden los usuarios por esta vía, y con ellas se piden una vez', async () => {
    await ticket('t4')
    const sin = espiar()
    expect(await eventosReasignacion(sin.espia, 't4')).toEqual([])
    expect(sin.sqls.filter((s) => /FROM users/i.test(s))).toEqual([])
    await reasignacion('t4')
    const con = espiar()
    expect(await eventosReasignacion(con.espia, 't4')).toHaveLength(1)
    expect(con.sqls.filter((s) => /FROM users/i.test(s))).toHaveLength(1)
  })

  it('abrir el historial dos veces no emite INSERT, UPDATE ni DELETE y no crea avisos', async () => {
    await ticket('t5'); await transicion('t5', '2026-08-02T10:00:00Z'); await reasignacion('t5', '2026-08-05T10:00:00Z', null)
    const filas = async () => [(await db.query('SELECT * FROM avisos')).rows, (await db.query('SELECT * FROM reasignaciones')).rows]
    const antes = await filas()
    const { espia, sqls } = espiar()
    await getHistorialTicket(espia, 't5'); await getHistorialTicket(espia, 't5')
    expect(sqls.length).toBeGreaterThan(0)
    expect(sqls.filter((s) => /^(INSERT|UPDATE|DELETE)/i.test(s))).toEqual([])
    expect(await filas()).toEqual(antes)
  })
})
