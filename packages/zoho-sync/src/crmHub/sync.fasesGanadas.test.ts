import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '../db/migrate'
import { migrateCrm } from './migrate'
import { createCrmSync, FASES_GANADAS } from './sync'
import { byTable } from './modules'
import type { AppConfig } from '../config'

const config = {} as AppConfig
const GANADO = 'Cerrado ganado'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db); await migrateCrm(db) })

/** Un trato del hub con su fase, su `modified_time` y, si se da, la marca de la última ficha leída. */
const trato = (id: string, stage: string, modificado: string | null, leido: string | null = null) =>
  db.query(
    'INSERT INTO crm.deals (id, deal_name, stage, modified_time, stage_detail_synced_at) VALUES ($1,$2,$3,$4,$5)',
    [id, `Trato ${id}`, stage, modificado ? new Date(modificado) : null, leido ? new Date(leido) : null],
  )

const fila = async (id: string): Promise<{ stage_modified_time: Date | null; stage_detail_synced_at: Date | null }> =>
  (await db.query('SELECT stage_modified_time, stage_detail_synced_at FROM crm.deals WHERE id = $1', [id])).rows[0]

describe('esquema · stage_detail_synced_at', () => {
  it('crm.deals tiene la columna y nace nula', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    expect((await fila('d1')).stage_detail_synced_at).toBeNull()
  })
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('listado de tratos · stage_modified_time', () => {
  it('el módulo Deals ya no pide Stage_Modified_Time ni lo mapea', () => {
    const m = byTable('deals')
    expect(m.fields.split(',')).not.toContain('Stage_Modified_Time')
    expect(m.toRow({ id: 'd1', Stage_Modified_Time: '2026-08-31T14:33:09-05:00', Modified_Time: '2026-08-31T19:40:00Z' }))
      .not.toHaveProperty('stage_modified_time')
  })

  /**
   * `upsertRow` actualiza con EXCLUDED todas las columnas del `row`. Si `stage_modified_time` siguiera
   * en él, cada pasada del listado escribiría el nulo que da Zoho y borraría la hora de la ficha.
   */
  it('sincronizar un trato por el listado conserva su stage_modified_time y su marca', async () => {
    await trato('d1', GANADO, '2026-08-31T19:40:00Z', '2026-08-31T19:40:00Z')
    await db.query('UPDATE crm.deals SET stage_modified_time = $1 WHERE id = $2', [new Date('2026-08-31T19:33:09Z'), 'd1'])
    const crmFetch = vi.fn().mockImplementation(async (path: string) =>
      path.startsWith('/Deals?')
        // Así responde el listado de Zoho: Stage_Modified_Time siempre nulo.
        ? json({ data: [{ id: 'd1', Deal_Name: 'Trato d1', Stage: GANADO, Stage_Modified_Time: null, Modified_Time: '2026-09-01T15:00:00Z' }], info: { more_records: false } })
        : json({ data: [], info: { more_records: false } }))
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncRecent()

    expect(r.deals).toBe(1)
    const f = await fila('d1')
    expect(f.stage_modified_time?.toISOString()).toBe('2026-08-31T19:33:09.000Z')
    expect(f.stage_detail_synced_at?.toISOString()).toBe('2026-08-31T19:40:00.000Z')
  })
})

/** Zoho: la ficha de cada trato trae su `Stage_Modified_Time`, con desfase de Bogotá como en producción. Un id sin hora da 404. */
const fichas = (horas: Record<string, string>) => vi.fn().mockImplementation(async (path: string) => {
  const id = path.split('/')[2]
  return id in horas ? json({ data: [{ id, Stage: GANADO, Stage_Modified_Time: horas[id] }] }) : json({}, 404)
})

/** Los ids de trato cuya ficha se pidió, en el orden en que se pidieron. */
const pedidos = (crmFetch: ReturnType<typeof vi.fn>) => crmFetch.mock.calls.map((c) => String(c[0]).split('/')[2])

const sinPausa = { pausaMs: 0 }

describe('syncPendingWonStages', () => {
  /** Tiene que coincidir con WON_DEAL_STAGES de SalesTracker, que es quien cuenta los tratos ganados. */
  it('las fases ganadas son las de SalesTracker', () => {
    expect(FASES_GANADAS).toEqual(['Cerrado ganado'])
  })

  it('elige los ganados nunca leídos o modificados después, e ignora los no ganados y los que están al día', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    await trato('d2', GANADO, '2026-09-02T15:00:00Z', '2026-08-20T15:00:00Z')
    await trato('d3', GANADO, '2026-08-10T15:00:00Z', '2026-08-10T15:00:00Z')
    await trato('d4', 'Negociacion', '2026-09-03T15:00:00Z')
    const crmFetch = fichas({ d1: '2026-08-01T09:00:00-05:00', d2: '2026-09-02T09:00:00-05:00', d3: '2026-08-10T09:00:00-05:00', d4: '2026-09-03T09:00:00-05:00' })
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    expect(r).toEqual({ intentados: 2, poblados: 2, fallidos: 0 })
    expect(pedidos(crmFetch).sort()).toEqual(['d1', 'd2'])
  })

  /**
   * La hora es la de la ficha, como instante: 14:33:09 en Bogotá son las 19:33:09 UTC. La marca es el
   * `modified_time` LEÍDO al elegir el trato, no la hora de la pasada.
   */
  it('guarda la hora de la ficha y marca con el modified_time leído', async () => {
    await trato('d1', GANADO, '2026-08-31T19:40:00Z')
    const sync = createCrmSync({ crmFetch: fichas({ d1: '2026-08-31T14:33:09-05:00' }), db, config })

    await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    const f = await fila('d1')
    expect(f.stage_modified_time?.toISOString()).toBe('2026-08-31T19:33:09.000Z')
    expect(f.stage_detail_synced_at?.toISOString()).toBe('2026-08-31T19:40:00.000Z')
  })

  it('un trato que cambia mientras se lee su ficha vuelve a salir en la pasada siguiente', async () => {
    await trato('d1', GANADO, '2026-08-31T19:40:00Z')
    const base = fichas({ d1: '2026-08-31T14:33:09-05:00' })
    const crmFetch = vi.fn().mockImplementation(async (path: string) => {
      // El listado lo modifica justo mientras se pide su ficha.
      await db.query('UPDATE crm.deals SET modified_time = $1 WHERE id = $2', [new Date('2026-08-31T20:00:00Z'), 'd1'])
      return base(path)
    })
    const sync = createCrmSync({ crmFetch, db, config })

    await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1, poblados: 1 })
  })

  /**
   * El invariante de la pasada: un fallo NO corta los demás, y el trato fallido NO se marca, así que
   * la pasada siguiente lo vuelve a intentar sin hacer nada especial.
   */
  it('un fallo de Zoho en un trato no corta la pasada y ese trato queda sin marcar', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    await trato('d2', GANADO, '2026-09-01T15:00:00Z')
    const crmFetch = fichas({ d2: '2026-09-01T09:00:00-05:00' })
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    expect(r).toMatchObject({ intentados: 2, poblados: 1, fallidos: 1 })
    expect(r.motivoPrimerFallo).toBe('CRM /Deals/d1 404')
    expect((await fila('d1')).stage_detail_synced_at).toBeNull()
    expect((await fila('d2')).stage_modified_time?.toISOString()).toBe('2026-09-01T14:00:00.000Z')

    crmFetch.mockClear()
    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1 })
    expect(pedidos(crmFetch)).toEqual(['d1'])
  })

  /**
   * Un trato ganado sin hora en la ficha es una anomalía: se cuenta como fallo y NO se marca, para que
   * se vea en el log y en la consulta de seguimiento en vez de quedar nulo en silencio.
   */
  it('una ficha sin Stage_Modified_Time cuenta como fallo y no se marca', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    const crmFetch = vi.fn().mockImplementation(async () => json({ data: [{ id: 'd1', Stage: GANADO, Stage_Modified_Time: null }] }))
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    expect(r).toMatchObject({ intentados: 1, poblados: 0, fallidos: 1, motivoPrimerFallo: 'CRM /Deals/d1 sin Stage_Modified_Time' })
    expect(await fila('d1')).toEqual({ stage_modified_time: null, stage_detail_synced_at: null })
  })

  it('respeta el límite y empieza por los modificados más recientemente', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    await trato('d2', GANADO, '2026-09-20T15:00:00Z')
    await trato('d3', GANADO, '2026-09-01T15:00:00Z')
    const crmFetch = fichas({ d1: '2026-08-01T09:00:00-05:00', d2: '2026-09-20T09:00:00-05:00', d3: '2026-09-01T09:00:00-05:00' })
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 2 })

    expect(r).toMatchObject({ intentados: 2, poblados: 2 })
    expect(pedidos(crmFetch)).toEqual(['d2', 'd3'])
    expect((await fila('d1')).stage_detail_synced_at).toBeNull()
  })

  /**
   * Sin `modified_time` no hay valor leído que guardar, y marcarlo con nulo lo haría salir en TODAS
   * las pasadas. Se marca con el epoch: se lee una vez y no vuelve hasta que Zoho le ponga fecha.
   */
  it('un trato sin modified_time se lee una vez y no vuelve a salir', async () => {
    await trato('d1', GANADO, null)
    const sync = createCrmSync({ crmFetch: fichas({ d1: '2026-08-01T09:00:00-05:00' }), db, config })

    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1, poblados: 1 })
    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 0 })
  })
})
