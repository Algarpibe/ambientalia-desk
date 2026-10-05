import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getHistorialTicket } from './historial'
import { eventosRestauracion } from './remisionRestaurada'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const insTicket = (id: string) =>
  db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,1,'A','Ingresado')", [id])

/** Remisión creada el 4/8 a las 14:00. `extra` pone las columnas de anulación y de restauración que haga falta. */
const insRemision = (id: string, ticket: string, extra: Record<string, string | null> = {}) => {
  const cols = Object.keys(extra)
  return db.query(
    `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at${cols.map((c) => `,${c}`).join('')})
     VALUES ($1,$2,'entrada','2026-08-04','Julián','ok','2026-08-04T14:00:00Z'${cols.map((_, i) => `,$${i + 3}`).join('')})`,
    [id, ticket, ...cols.map((c) => extra[c])],
  )
}

describe('eventosRestauracion · derivador puro (RQ-TZ-14)', () => {
  it('con `restaurada_at` nulo no deriva nada, aunque haya una anulación previa a medias', () => {
    expect(eventosRestauracion({ restaurada_at: null, anulacion_previa_at: new Date('2026-08-05T09:00:00Z'), anulacion_previa_por: 'Ana' })).toEqual([])
    expect(eventosRestauracion({})).toEqual([])
  })

  it('restaurada: la anulación previa y la restauración, cada una con su persona y su instante', () => {
    const eventos = eventosRestauracion({
      anulacion_previa_at: new Date('2026-08-05T09:00:00Z'), anulacion_previa_por: 'Ana',
      restaurada_at: new Date('2026-08-05T11:00:00Z'), restaurada_por: 'Beto',
    })
    expect(eventos).toEqual([
      { eventName: 'RemisionAnulada', time: '2026-08-05T09:00:00.000Z', actor: 'Ana', title: 'Remisión anulada', details: [{ label: 'Anulada por', value: 'Ana' }] },
      { eventName: 'RemisionRestaurada', time: '2026-08-05T11:00:00.000Z', actor: 'Beto', title: 'Remisión restaurada', details: [{ label: 'Restaurada por', value: 'Beto' }] },
    ])
  })

  it('sin `anulacion_previa_at` (restauración anterior al cambio, o a medias) sólo sale la restauración', () => {
    const eventos = eventosRestauracion({ restaurada_at: new Date('2026-08-05T11:00:00Z'), restaurada_por: 'Beto', anulacion_previa_at: null })
    expect(eventos.map((e) => e.title)).toEqual(['Remisión restaurada'])
    expect(eventos[0]).toMatchObject({ time: '2026-08-05T11:00:00.000Z', actor: 'Beto' })
  })
})

describe('getHistorialTicket · la restauración se lee de la remisión', () => {
  it('anulada, restaurada y anulada de nuevo: los tres hechos y la creación, de más reciente a más antigua', async () => {
    await insTicket('t1')
    await insRemision('r1', 't1', {
      anulacion_previa_at: '2026-08-05T09:00:00Z', anulacion_previa_por: 'Ana',
      restaurada_at: '2026-08-05T11:00:00Z', restaurada_por: 'Beto',
      anulada_at: '2026-08-06T09:00:00Z', anulada_por: 'Carla',
    })
    const { eventos } = await getHistorialTicket(db, 't1')
    expect(eventos.map((e) => [e.title, e.actor, e.time])).toEqual([
      ['Remisión anulada', 'Carla', '2026-08-06T09:00:00.000Z'],
      ['Remisión restaurada', 'Beto', '2026-08-05T11:00:00.000Z'],
      ['Remisión anulada', 'Ana', '2026-08-05T09:00:00.000Z'],
      ['Remisión de entrada creada', 'Julián', '2026-08-04T14:00:00.000Z'],
    ])
  })

  it('anulada y restaurada: la remisión ya no figura anulada y aun así el historial la cuenta', async () => {
    await insTicket('t2')
    await insRemision('r2', 't2', {
      anulacion_previa_at: '2026-08-05T09:00:00Z', anulacion_previa_por: 'Ana',
      restaurada_at: '2026-08-05T11:00:00Z', restaurada_por: 'Beto',
    })
    const { eventos } = await getHistorialTicket(db, 't2')
    expect(eventos.map((e) => e.title)).toEqual(['Remisión restaurada', 'Remisión anulada', 'Remisión de entrada creada'])
    expect(eventos[0].details).toContainEqual({ label: 'Restaurada por', value: 'Beto' })
    expect(eventos[1].details).toContainEqual({ label: 'Anulada por', value: 'Ana' })
  })

  it('nunca restaurada: los títulos de la anulación vigente no cambian', async () => {
    await insTicket('t3')
    await insRemision('r3', 't3', { anulada_at: '2026-08-05T09:00:00Z', anulada_por: 'Admin' })
    const { eventos } = await getHistorialTicket(db, 't3')
    expect(eventos.map((e) => e.title)).toEqual(['Remisión anulada', 'Remisión de entrada creada'])
    expect(eventos[0].details).toContainEqual({ label: 'Anulada por', value: 'Admin' })
  })

  it('abrir el historial dos veces no escribe: ni INSERT, ni UPDATE, ni DELETE', async () => {
    await insTicket('t4')
    await insRemision('r4', 't4', {
      anulacion_previa_at: '2026-08-05T09:00:00Z', anulacion_previa_por: 'Ana',
      restaurada_at: '2026-08-05T11:00:00Z', restaurada_por: 'Beto',
    })
    const sqls: string[] = []
    const espia = { query: (async (sql: string, p?: unknown[]) => { sqls.push(sql.replace(/\s+/g, ' ').trim()); return db.query(sql, p) }) as Queryable['query'] } as Queryable
    const primera = await getHistorialTicket(espia, 't4')
    const segunda = await getHistorialTicket(espia, 't4')
    expect(sqls.length).toBeGreaterThan(0)
    expect(sqls.filter((s) => /^(INSERT|UPDATE|DELETE)/i.test(s))).toEqual([])
    expect(segunda.eventos).toEqual(primera.eventos)
  })
})
