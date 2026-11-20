import { describe, it, expect } from 'vitest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { entradaDelMarcador } from '@ambientalia/shared'
import { db, instalarArnes } from '../testing/appHarness'
import { migrarTicketsAbiertos } from './migracionTicketsAbiertos'
import { entradasActuales, etapasDeZohoPorTicket } from './sla'
import { json } from './ticketFuentes'

instalarArnes()

/**
 * pasada-en-seco-sin-fecha-zoho (F1F-01), `zoho-sync` RQ-ZS-68 a RQ-ZS-70: el campo `sinFechaDeZoho` del informe de la migración, sobre pg-mem.
 * El orden de las lecturas y escrituras se fija por el ESPÍA de SQL, como en `migracionTicketsAbiertos.test.ts`.
 */
const CORTE = new Date('2026-12-01T05:00:00Z')
const ANTES = '2026-10-01T10:00:00Z'
type Opt = { cls?: string | null; managed?: boolean; creado?: string | null; closed?: string | null }
async function tk(id: string, number: number, status: string, o: Opt = {}): Promise<void> {
  await db.query(
    `INSERT INTO tickets (id, number, subject, status, status_type, classification, managed_by_app, created_time, modified_time, closed_time, updated_at)
     VALUES ($1,$2,'Asunto',$3,'Open',$4,$5,$6,'2026-09-01T00:00:00Z',$7,'2026-01-01T00:00:00Z')`,
    [id, number, status, o.cls ?? null, o.managed ?? false, o.creado === undefined ? ANTES : o.creado, o.closed ?? null],
  )
}
let nHistoria = 0
const cambioDeZoho = (ticketId: string, de: string, hacia: string, cuando: string) => db.query(
  'INSERT INTO ticket_history (id, ticket_id, event_name, event_time, raw) VALUES ($1,$2,$3,$4,$5)',
  [`h-sf-${++nHistoria}`, ticketId, 'TicketUpdated', cuando, JSON.stringify({
    eventName: 'TicketUpdated', eventTime: cuando, actor: { id: 'bp', name: 'Blueprint', type: 'Blueprint' },
    eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: de, updatedValue: hacia, type: 'Text' }, propertyType: 'ValueTransition' }], actorInfo: [],
  })],
)

function espiar() {
  const sqls: string[] = []
  const pool = db as unknown as { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
  const envolver = (q: Queryable['query']): Queryable['query'] => (async (sql: string, p: unknown[] = []) => {
    sqls.push(sql.replace(/\s+/g, ' ').trim()); return q(sql, p)
  }) as Queryable['query']
  const espia = { query: envolver(db.query.bind(db)), connect: async () => { const c = await pool.connect(); return { query: envolver(c.query.bind(c)), release: () => c.release() } } } as unknown as Queryable
  return { espia, sqls }
}
const verbos = (sqls: string[]) => sqls.map((s) => s.split(' ')[0].toUpperCase())
const escrituras = (sqls: string[]) => sqls.filter((s) => /^(INSERT|UPDATE|DELETE)/i.test(s))
const lecturasDeHistoria = (sqls: string[]) => sqls.filter((s) => s.includes('FROM ticket_history'))
const correr = (d: Queryable, aplicar?: boolean) => migrarTicketsAbiertos(d, { corte: CORTE, actor: 'Admin', aplicar })

async function fixture(): Promise<void> {
  await tk('t4100', 4100, 'Entregado')
  await tk('t4200', 4200, 'Entregado', { closed: '2026-11-30T15:00:00Z' })
  await tk('t4300', 4300, 'Pendiente', { cls: 'Reparación' })
  await cambioDeZoho('t4300', 'Pendiente', 'Ingresado', '2026-10-10T10:00:00Z') // sale de «Pendiente», no entra
  await tk('t4400', 4400, 'Pendiente', { cls: 'Reparación' })
  await cambioDeZoho('t4400', 'Ingresado', 'Pendiente', '2026-10-20T14:00:00Z')
  await tk('t4500', 4500, 'En Proceso')
  await tk('t4600', 4600, 'Pendiente', { cls: 'Soporte remoto' })
  await tk('t4700', 4700, 'Pendiente', { cls: 'Reparación', managed: true })
  await tk('t4800', 4800, 'Pendiente', { cls: 'Reparación', creado: '2026-12-02T10:00:00Z' })
}
const ESPERADO = {
  tickets: 2,
  porRegla: [
    { regla: 'entregado-a-finalizado', tickets: 1, numeros: [4100] },
    { regla: 'pendiente-servicio-a-en-proceso', tickets: 1, numeros: [4300] },
  ],
}
const VACIO = { tickets: 0, porRegla: [] }

describe('sinFechaDeZoho del informe de la migración', () => {
  it('P1 · en seco: dos sin fecha por regla, con sus números; ni BEGIN ni escrituras y UNA lectura de ticket_history', async () => {
    await fixture()
    const { espia, sqls } = espiar()
    const inf = await correr(espia)
    expect(inf.sinFechaDeZoho).toEqual(ESPERADO)
    expect(verbos(sqls)).not.toContain('BEGIN')
    expect(escrituras(sqls)).toEqual([])
    expect(lecturasDeHistoria(sqls)).toHaveLength(1)
  })

  it('P2 · «entregado-a-finalizado» coincide con cierres.conFechaDeMigracion y da sus números (H5)', async () => {
    await fixture()
    const inf = await correr(db)
    const g = inf.sinFechaDeZoho.porRegla.find((x) => x.regla === 'entregado-a-finalizado')
    expect(g?.tickets).toBe(inf.cierres.conFechaDeMigracion)
    expect(g?.tickets).toBe(1)
    expect(g?.numeros).toEqual([4100])
  })

  it('P3 · con aplicar=true, el mismo campo que en seco y la lectura de ticket_history antes del primer marcador', async () => {
    await fixture()
    const seco = await correr(db)
    const { espia, sqls } = espiar()
    const inf = await correr(espia, true)
    expect(inf.sinFechaDeZoho).toEqual(seco.sinFechaDeZoho)
    expect(inf.aplicado).toBe(true)
    const lectura = sqls.findIndex((s) => s.includes('FROM ticket_history'))
    const primero = sqls.findIndex((s) => s.startsWith('INSERT INTO ticket_transitions'))
    expect(lectura).toBeGreaterThan(-1)
    expect(primero).toBeGreaterThan(-1)
    expect(lectura).toBeLessThan(primero)
  })

  it('P4 · la predicción en seco es la realidad tras aplicar', async () => {
    await fixture()
    const seco = await correr(db)
    await correr(db, true)
    const marcas = (await db.query('SELECT ticket_id, transition_id, from_status, to_status, values FROM ticket_transitions')).rows as Array<Record<string, unknown> & { ticket_id: string }>
    const etapas = await etapasDeZohoPorTicket(db, marcas.map((m) => m.ticket_id))
    const numeros = new Map((await db.query('SELECT id, number FROM tickets')).rows.map((r: { id: string; number: number }) => [String(r.id), Number(r.number)]))
    const reales: number[] = []
    for (const m of marcas) {
      const e = entradaDelMarcador({ ...m, values: json(m.values) }, etapas.get(m.ticket_id) ?? [])
      if (e !== null && e.tipo === 'entrada' && e.desde === null) reales.push(numeros.get(m.ticket_id) as number)
    }
    expect(reales.length).toBeGreaterThan(0)
    expect(reales.sort((a, b) => a - b)).toEqual(seco.sinFechaDeZoho.porRegla.flatMap((g) => g.numeros).sort((a, b) => a - b))
  })

  it('P5 · con negativa y aplicar=true trae el campo, aplicado false y ninguna escritura', async () => {
    await fixture(); await tk('t4900', 4900, 'Estado raro')
    const { espia, sqls } = espiar()
    const inf = await correr(espia, true)
    expect(inf.sinFechaDeZoho).toEqual(ESPERADO)
    expect(inf.negativa).not.toBeNull()
    expect(inf.aplicado).toBe(false)
    expect(escrituras(sqls)).toEqual([])
  })

  it('P6 · sin migrables: { tickets: 0, porRegla: [] } y ninguna lectura de ticket_history', async () => {
    await tk('t4700', 4700, 'Pendiente', { cls: 'Reparación', managed: true })
    await tk('t4800', 4800, 'Pendiente', { cls: 'Reparación', creado: '2026-12-02T10:00:00Z' })
    const { espia, sqls } = espiar()
    const inf = await correr(espia)
    expect(inf.sinFechaDeZoho).toEqual(VACIO)
    expect(lecturasDeHistoria(sqls)).toEqual([])
  })

  it('P7 · una regla con todos fechados figura con tickets 0 y numeros vacíos', async () => {
    await tk('t4200', 4200, 'Entregado', { closed: '2026-11-30T15:00:00Z' })
    await tk('t4400', 4400, 'Pendiente', { cls: 'Reparación' })
    await cambioDeZoho('t4400', 'Ingresado', 'Pendiente', '2026-10-20T14:00:00Z')
    const inf = await correr(db)
    expect(inf.sinFechaDeZoho).toEqual({
      tickets: 0,
      porRegla: [{ regla: 'entregado-a-finalizado', tickets: 0, numeros: [] }, { regla: 'pendiente-servicio-a-en-proceso', tickets: 0, numeros: [] }],
    })
  })

  it('caracterización · el resto del informe no cambia: cierres, negativa, aplicado y avisos', async () => {
    await fixture()
    const inf = await correr(db)
    expect(inf.cierres).toEqual({ conFechaDeZoho: 1, conFechaDeMigracion: 1 })
    expect(inf.negativa).toBeNull()
    expect(inf.aplicado).toBe(false)
    expect(inf.avisos).toEqual(['Antes de aplicar: copia de la base y sincronización completa reciente (S-7).'])
  })

  it('caracterización · entradasActuales tras aplicar: con fecha entra, sin fecha e identidad no; sin marcadores no lee ticket_history', async () => {
    await fixture()
    await correr(db, true)
    const m = await entradasActuales(db, [{ id: 't4300', status: 'En Proceso' }, { id: 't4400', status: 'En Proceso' }, { id: 't4500', status: 'En Proceso' }], ['En Proceso'])
    expect([...m.keys()]).toEqual(['t4400'])
    expect(m.get('t4400')).toEqual(new Date('2026-10-20T14:00:00Z'))
    const { espia, sqls } = espiar()
    const sin = await entradasActuales(espia, [{ id: 't4700', status: 'Pendiente' }, { id: 't4800', status: 'Pendiente' }], ['Pendiente'])
    expect(sin.size).toBe(0)
    expect(lecturasDeHistoria(sqls)).toEqual([])
  })
})
