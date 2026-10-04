import { describe, it, expect } from 'vitest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { upsertTicket } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { ID_TRANSICION_MIGRACION, ACTOR_MIGRACION } from '@ambientalia/shared'
import { db, instalarArnes } from '../testing/appHarness'
import { migrarTicketsAbiertos } from './migracionTicketsAbiertos'
import { entradasActuales } from './sla'

instalarArnes()

/**
 * migracion-tickets-abiertos (F1F-01), `zoho-sync` RQ-ZS-17: el ejecutor sobre pg-mem. El orden de las escrituras, la
 * ausencia de `BEGIN` en seco y la negativa total se fijan por el ESPÍA de SQL, no por el `ROLLBACK` de pg-mem, que no
 * revierte de verdad (`apps/desk/server/routes/altaManual.test.ts:158`).
 */
const CORTE = new Date('2026-12-01T05:00:00Z')
const ANTES = '2026-10-01T10:00:00Z'
type Opt = { st?: string | null; cls?: string | null; managed?: boolean; creado?: string | null; closed?: string | null }
async function tk(id: string, number: number, status: string, o: Opt = {}): Promise<void> {
  await db.query(
    `INSERT INTO tickets (id, number, subject, status, status_type, classification, managed_by_app, created_time, modified_time, closed_time, updated_at)
     VALUES ($1,$2,'Asunto',$3,$4,$5,$6,$7,'2026-09-01T00:00:00Z',$8,'2026-01-01T00:00:00Z')`,
    [id, number, status, o.st === undefined ? 'Open' : o.st, o.cls ?? null, o.managed ?? false, o.creado === undefined ? ANTES : o.creado, o.closed ?? null],
  )
}
const foto = async () => ({
  tickets: (await db.query('SELECT * FROM tickets ORDER BY id')).rows,
  marcas: (await db.query('SELECT * FROM ticket_transitions ORDER BY id')).rows,
})
const json = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v) as Record<string, unknown>

/** Un `Queryable` que apunta cada sentencia y deja intervenir en la antes de que corra. */
function espiar(antes?: (sql: string, params: unknown[]) => Promise<void> | void) {
  const sqls: string[] = []
  const pool = db as unknown as { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
  const envolver = (q: Queryable['query']): Queryable['query'] => (async (sql: string, p: unknown[] = []) => {
    sqls.push(sql.replace(/\s+/g, ' ').trim()); await antes?.(sql, p); return q(sql, p)
  }) as Queryable['query']
  const espia = { query: envolver(db.query.bind(db)), connect: async () => { const c = await pool.connect(); return { query: envolver(c.query.bind(c)), release: () => c.release() } } } as unknown as Queryable
  return { espia, sqls }
}
const verbos = (sqls: string[]) => sqls.map((s) => s.split(' ')[0].toUpperCase())
const escrituras = (sqls: string[]) => sqls.filter((s) => /^(INSERT|UPDATE|DELETE)/i.test(s))
const aplicar = (d: Queryable, extra: { aplicar?: boolean; corte?: Date } = {}) => migrarTicketsAbiertos(d, { corte: CORTE, actor: 'Admin', ...extra })

describe('seco', () => {
  it('con aplicar ausente y con false: ni BEGIN ni escrituras, filas idénticas y el informe trae todos sus campos', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('t2', 4200, 'OV asignada')
    const antes = await foto()
    for (const extra of [{}, { aplicar: false }]) {
      const { espia, sqls } = espiar()
      const inf = await aplicar(espia, extra)
      expect(verbos(sqls)).not.toContain('BEGIN')
      expect(escrituras(sqls)).toEqual([])
      expect(Object.keys(inf).sort()).toEqual(['abiertos', 'aplicado', 'aplicar', 'avisos', 'corte', 'migrables', 'negativa', 'numeracion', 'pendientes', 'porEstado', 'sinEquivalencia', 'sinRemisionVigente', 'trasElCorte', 'yaGobernados'])
      expect(inf).toMatchObject({ aplicar: false, aplicado: false, abiertos: 2, migrables: 2, negativa: null, corte: '2026-12-01T05:00:00.000Z' })
    }
    expect(await foto()).toEqual(antes)
  })
})

describe('aplicar', () => {
  it('marcador y UPDATE por ticket, dentro de una transacción y en ese orden (por el espía)', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('t2', 4200, 'Pendiente', { cls: 'Reparación' }); await tk('t3', 4300, 'OV asignada')
    const { espia, sqls } = espiar()
    const inf = await aplicar(espia, { aplicar: true })
    const seq = sqls.filter((s) => /^(BEGIN|COMMIT|ROLLBACK|INSERT INTO ticket_transitions|UPDATE tickets)/i.test(s)).map((s) => s.split(' ').slice(0, 2).join(' '))
    expect(seq).toEqual(['BEGIN', ...Array(3).fill(['INSERT INTO', 'UPDATE tickets']).flat(), 'COMMIT'])
    expect(inf).toMatchObject({ aplicar: true, aplicado: true })
  })

  it('el marcador lleva to_status NULL en identidad y el destino en las dos reglas que cambian el estado; la fila cambia lo justo', async () => {
    await tk('t1', 4100, 'Entregado', { closed: '2026-08-01T00:00:00Z' }); await tk('t2', 4200, 'Pendiente', { cls: 'Reparación' }); await tk('t3', 4300, 'En Proceso')
    const antes = (await foto()).tickets
    await aplicar(db, { aplicar: true })
    const m = (await db.query('SELECT * FROM ticket_transitions ORDER BY ticket_id')).rows as Array<Record<string, unknown>>
    expect(m.map((x) => [x.ticket_id, x.from_status, x.to_status])).toEqual([['t1', 'Entregado', 'Finalizado'], ['t2', 'Pendiente', 'En Proceso'], ['t3', 'En Proceso', null]])
    expect(m.every((x) => x.transition_id === ID_TRANSICION_MIGRACION && x.performed_by === ACTOR_MIGRACION && x.area === 'Servicio Técnico')).toBe(true)
    expect(json(m[2].values)).toEqual({ estado_previo: 'En Proceso', estado_destino: 'En Proceso', status_type_previo: 'Open', managed_by_app_previo: false, regla: 'identidad', corte: '2026-12-01T05:00:00.000Z', ejecutado_por: 'Admin' })
    const t = (await foto()).tickets as Array<Record<string, unknown> & { updated_at: Date }>
    expect(t.map((x) => [x.status, x.status_type, x.managed_by_app])).toEqual([['Finalizado', 'Closed', true], ['En Proceso', 'Open', true], ['En Proceso', 'Open', true]])
    t.forEach((x, i) => {
      const a = antes[i] as Record<string, unknown> & { updated_at: Date }
      expect([x.modified_time, x.source, x.closed_time]).toEqual([a.modified_time, a.source, a.closed_time])
      expect(x.updated_at.getTime()).toBeGreaterThan(a.updated_at.getTime())
    })
  })
})

describe('negativa', () => {
  it('con un sin equivalencia el ÚLTIMO de la lista y aplicar=true no se escribe nada, ni de los que sí migraban', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('t2', 4200, 'OV asignada'); await tk('t9', 4900, 'Estado raro')
    const { espia, sqls } = espiar()
    const inf = await aplicar(espia, { aplicar: true })
    expect(escrituras(sqls)).toEqual([])
    expect(inf).toMatchObject({ aplicado: false, negativa: { motivo: 'estados-sin-equivalencia', estados: ['Estado raro'] } })
  })

  it('un sin equivalencia ya gobernado o posterior al corte no bloquea y esos tickets no se tocan (D-8)', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('g1', 4200, 'Raro A', { managed: true }); await tk('p1', 4300, 'Raro B', { creado: '2026-12-02T00:00:00Z' })
    const inf = await aplicar(db, { aplicar: true })
    expect(inf.negativa).toBeNull()
    expect((await db.query("SELECT id, status, managed_by_app FROM tickets ORDER BY id")).rows).toEqual([
      { id: 'g1', status: 'Raro A', managed_by_app: true }, { id: 'p1', status: 'Raro B', managed_by_app: false }, { id: 't1', status: 'Finalizado', managed_by_app: true },
    ])
  })
})

describe('frontera e idempotencia', () => {
  it('segunda pasada sin marcador ni UPDATE nuevos; cerrados, posteriores al corte y gobernados quedan idénticos', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('c1', 4200, 'Finalizado', { st: 'Closed' }); await tk('p1', 4300, 'En Proceso', { creado: '2026-12-02T00:00:00Z' }); await tk('g1', 4400, 'Ingresado', { managed: true })
    const fuera = async () => (await db.query("SELECT * FROM tickets WHERE id <> 't1' ORDER BY id")).rows
    const antes = await fuera()
    await aplicar(db, { aplicar: true })
    expect(await fuera()).toEqual(antes)
    const { espia, sqls } = espiar()
    await aplicar(espia, { aplicar: true })
    expect(escrituras(sqls)).toEqual([])
    expect((await db.query('SELECT 1 FROM ticket_transitions')).rows).toHaveLength(1)
  })

  it('upsertTicket posterior no altera la fila migrada y sí la de un ticket sin migrar', async () => {
    await tk('1', 4100, 'Entregado'); await tk('2', 4200, 'En Proceso', { creado: '2026-12-02T00:00:00Z' })
    await aplicar(db, { aplicar: true })
    for (const [id, n] of [['1', 4100], ['2', 4200]] as const) await upsertTicket(db, ticketRowFromZoho({ id, ticketNumber: String(n), status: 'Ingresado', statusType: 'Open', customFields: {} } as never))
    expect((await db.query('SELECT id, status FROM tickets ORDER BY id')).rows).toEqual([{ id: '1', status: 'Finalizado' }, { id: '2', status: 'Ingresado' }])
  })
})

describe('el resto del informe y los fallos', () => {
  it('el marcador de identidad no mueve entradasActuales; el de «Pendiente» de servicio sí', async () => {
    await tk('t1', 4100, 'En Proceso'); await tk('t2', 4200, 'Pendiente', { cls: null })
    await aplicar(db, { aplicar: true })
    const m = await entradasActuales(db, [{ id: 't1', status: 'En Proceso' }, { id: 't2', status: 'En Proceso' }], ['En Proceso'])
    expect([...m.keys()]).toEqual(['t2'])
  })

  it('sinRemisionVigente con y sin remisión de entrada, y sin crear ninguna', async () => {
    await tk('t1', 4100, 'OV asignada'); await tk('t2', 4200, 'Ticket creado'); await tk('t3', 4300, 'En Proceso')
    await db.query("INSERT INTO remisiones (id, ticket_id, tipo, fecha) VALUES ('r1','t2','entrada','2026-10-02')")
    const { espia, sqls } = espiar()
    const inf = await aplicar(espia, { aplicar: true })
    expect(inf.sinRemisionVigente).toEqual([{ numero: 4100, estado: 'OV asignada' }])
    expect(sqls.filter((s) => /remisiones/i.test(s) && /^(INSERT|UPDATE|DELETE)/i.test(s))).toEqual([])
    expect((await db.query('SELECT id FROM remisiones')).rows).toEqual([{ id: 'r1' }])
  })

  it('numeracion.arrastra es falso en 9999 y verdadero en 10000', async () => {
    await tk('t1', 9999, 'OV asignada')
    expect((await aplicar(db)).numeracion).toEqual({ masAltoAMarcar: 9999, base: 10000, arrastra: false })
    await db.query("UPDATE tickets SET number = 10000 WHERE id = 't1'")
    const inf = await aplicar(db)
    expect(inf.numeracion).toEqual({ masAltoAMarcar: 10000, base: 10000, arrastra: true })
    expect(inf.avisos.some((a) => /10000/.test(a))).toBe(true)
  })

  it('un UPDATE que no devuelve fila (la fila pasó a gobernada entre lectura y escritura) lanza y la transacción acaba en ROLLBACK', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('t2', 4200, 'OV asignada')
    let intervenido = false
    const { espia, sqls } = espiar(async (sql, p) => {
      if (!intervenido && /^UPDATE tickets SET status/i.test(sql.trim()) && p[0] === 't2') { intervenido = true; await db.query("UPDATE tickets SET managed_by_app = true WHERE id = 't2'") }
    })
    await expect(aplicar(espia, { aplicar: true })).rejects.toThrow()
    expect(verbos(sqls).at(-1)).toBe('ROLLBACK')
    expect(verbos(sqls)).not.toContain('COMMIT')
  })

  it('un fallo forzado en el segundo UPDATE acaba en ROLLBACK, sin COMMIT', async () => {
    await tk('t1', 4100, 'Entregado'); await tk('t2', 4200, 'OV asignada')
    let n = 0
    const { espia, sqls } = espiar((sql) => { if (/^UPDATE tickets SET status/i.test(sql.trim()) && ++n === 2) throw new Error('fallo forzado') })
    await expect(aplicar(espia, { aplicar: true })).rejects.toThrow('fallo forzado')
    expect(verbos(sqls).at(-1)).toBe('ROLLBACK')
    expect(verbos(sqls)).not.toContain('COMMIT')
  })
})
