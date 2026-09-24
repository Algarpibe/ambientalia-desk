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

/** Un trato del hub con su fase, su `modified_time` y, si se da, la marca del último historial leído. */
const trato = (id: string, stage: string, modificado: string | null, leido: string | null = null) =>
  db.query(
    'INSERT INTO crm.deals (id, deal_name, stage, modified_time, stage_history_synced_at) VALUES ($1,$2,$3,$4,$5)',
    [id, `Trato ${id}`, stage, modificado ? new Date(modificado) : null, leido ? new Date(leido) : null],
  )

const fila = async (id: string): Promise<{ stage_modified_time: Date | null; stage_history_synced_at: Date | null }> =>
  (await db.query('SELECT stage_modified_time, stage_history_synced_at FROM crm.deals WHERE id = $1', [id])).rows[0]

describe('esquema · stage_history_synced_at', () => {
  it('crm.deals tiene la columna y nace nula', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    expect((await fila('d1')).stage_history_synced_at).toBeNull()
  })

  /** `migrateCrm` no aborta ante una sentencia que falla: la omite y lo dice en el log. */
  it('la migración añade la columna sin omitir ninguna sentencia', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const pg = newDb().adapters.createPg()
      const limpia: Queryable = new pg.Pool()
      await migrate(limpia)
      await migrateCrm(limpia)
      expect(error.mock.calls.map((c) => String(c[0]))).not.toContain('migrateCrm: sentencia omitida:')
    } finally { error.mockRestore() }
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
   * en él, cada pasada del listado escribiría el nulo que da Zoho y borraría la hora del historial.
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
    expect(f.stage_history_synced_at?.toISOString()).toBe('2026-08-31T19:40:00.000Z')
  })
})

type Entrada = { Stage: string; Modified_Time: string }
const RUTA_HISTORIAL = /^\/Deals\/([^/?]+)\/Stage_History\?fields=Stage,Modified_Time&per_page=200$/

/**
 * Zoho: el historial de fases de cada trato, con desfase de Bogotá como en producción. Una ruta que no
 * sea la del historial, o un id sin historial, da 404.
 */
const historiales = (porTrato: Record<string, Entrada[]>) => vi.fn().mockImplementation(async (path: string) => {
  const id = RUTA_HISTORIAL.exec(path)?.[1]
  return id && id in porTrato
    ? json({ data: porTrato[id].map((e, i) => ({ ...e, id: `h${i}` })), info: { more_records: false } })
    : json({}, 404)
})

/** Un historial con una sola entrada, en la fase ganada. */
const ganadoA = (hora: string): Entrada[] => [{ Stage: GANADO, Modified_Time: hora }]

/** Los ids de trato cuyo historial se pidió, en el orden en que se pidieron. */
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
    const crmFetch = historiales({
      d1: ganadoA('2026-08-01T09:00:00-05:00'), d2: ganadoA('2026-09-02T09:00:00-05:00'),
      d3: ganadoA('2026-08-10T09:00:00-05:00'), d4: ganadoA('2026-09-03T09:00:00-05:00'),
    })
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    expect(r).toEqual({ intentados: 2, poblados: 2, fallidos: 0 })
    expect(pedidos(crmFetch).sort()).toEqual(['d1', 'd2'])
  })

  /**
   * La garantía de que se recalculan TODOS los ganados que se rellenaron desde la ficha: la marca de
   * la ficha (`stage_detail_synced_at`) ya no cuenta, solo la del historial.
   */
  it('un trato con la marca de la ficha pero sin la del historial vuelve a elegirse', async () => {
    await db.query(
      'INSERT INTO crm.deals (id, deal_name, stage, modified_time, stage_detail_synced_at, stage_modified_time) VALUES ($1,$2,$3,$4,$5,$6)',
      ['d1', 'Trato d1', GANADO, new Date('2026-03-06T15:00:00Z'), new Date('2026-03-06T15:00:00Z'), new Date('2026-03-06T14:00:00Z')],
    )
    const sync = createCrmSync({ crmFetch: historiales({ d1: ganadoA('2025-11-05T15:06:00-05:00') }), db, config })

    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1, poblados: 1 })
    expect((await fila('d1')).stage_modified_time?.toISOString()).toBe('2025-11-05T20:06:00.000Z')
  })

  /**
   * La hora es la del historial, como instante: 14:33:09 en Bogotá son las 19:33:09 UTC. La marca es el
   * `modified_time` LEÍDO al elegir el trato, no la hora de la pasada.
   */
  it('guarda la hora del historial y marca con el modified_time leído', async () => {
    await trato('d1', GANADO, '2026-08-31T19:40:00Z')
    const sync = createCrmSync({ crmFetch: historiales({ d1: ganadoA('2026-08-31T14:33:09-05:00') }), db, config })

    await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    const f = await fila('d1')
    expect(f.stage_modified_time?.toISOString()).toBe('2026-08-31T19:33:09.000Z')
    expect(f.stage_history_synced_at?.toISOString()).toBe('2026-08-31T19:40:00.000Z')
  })

  /**
   * Un trato ganado, reabierto y ganado otra vez: cuenta la ÚLTIMA entrada en la fase ganada, por
   * instante y no por su posición en la respuesta. Las entradas en otras fases no cuentan aunque sean
   * posteriores.
   */
  it('elige la última entrada en la fase ganada sin fiarse del orden, e ignora las demás fases', async () => {
    await trato('d1', GANADO, '2026-08-31T19:40:00Z')
    const crmFetch = historiales({
      d1: [
        { Stage: 'Fase Cierre', Modified_Time: '2026-09-10T08:00:00-05:00' },
        { Stage: GANADO, Modified_Time: '2025-11-05T15:06:00-05:00' },
        { Stage: GANADO, Modified_Time: '2026-08-31T14:33:09-05:00' },
        { Stage: 'Negociacion', Modified_Time: '2026-01-15T10:00:00-05:00' },
        { Stage: GANADO, Modified_Time: '2026-02-01T09:00:00-05:00' },
      ],
    })
    const sync = createCrmSync({ crmFetch, db, config })

    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ poblados: 1, fallidos: 0 })
    expect((await fila('d1')).stage_modified_time?.toISOString()).toBe('2026-08-31T19:33:09.000Z')
  })

  it('un trato que cambia mientras se lee su historial vuelve a salir en la pasada siguiente', async () => {
    await trato('d1', GANADO, '2026-08-31T19:40:00Z')
    const base = historiales({ d1: ganadoA('2026-08-31T14:33:09-05:00') })
    const crmFetch = vi.fn().mockImplementation(async (path: string) => {
      // El listado lo modifica justo mientras se pide su historial.
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
    const crmFetch = historiales({ d2: ganadoA('2026-09-01T09:00:00-05:00') })
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    expect(r).toMatchObject({ intentados: 2, poblados: 1, fallidos: 1 })
    expect(r.motivoPrimerFallo).toBe('CRM /Deals/d1/Stage_History 404')
    expect((await fila('d1')).stage_history_synced_at).toBeNull()
    expect((await fila('d2')).stage_modified_time?.toISOString()).toBe('2026-09-01T14:00:00.000Z')

    crmFetch.mockClear()
    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1 })
    expect(pedidos(crmFetch)).toEqual(['d1'])
  })

  /**
   * Un trato ganado sin entrada ganada en su historial es una anomalía: se cuenta como fallo y NO se
   * marca, para que se vea en el log y en la consulta de seguimiento en vez de quedar nulo en silencio.
   */
  it('un historial sin entrada en la fase ganada cuenta como fallo y no se marca', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    const crmFetch = historiales({ d1: [{ Stage: 'Fase Cierre', Modified_Time: '2026-07-30T09:00:00-05:00' }] })
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })

    expect(r).toMatchObject({ intentados: 1, poblados: 0, fallidos: 1, motivoPrimerFallo: 'CRM /Deals/d1/Stage_History sin entrada en Cerrado ganado' })
    expect(await fila('d1')).toEqual({ stage_modified_time: null, stage_history_synced_at: null })
  })

  /** Zoho responde 204 sin cuerpo cuando una lista relacionada está vacía. */
  it('un historial vacío (204) cuenta como fallo y no se marca', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    const crmFetch = vi.fn().mockImplementation(async () => new Response(null, { status: 204 }))
    const sync = createCrmSync({ crmFetch, db, config })

    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ poblados: 0, fallidos: 1 })
    expect((await fila('d1')).stage_history_synced_at).toBeNull()
  })

  it('respeta el límite y empieza por los modificados más recientemente', async () => {
    await trato('d1', GANADO, '2026-08-01T15:00:00Z')
    await trato('d2', GANADO, '2026-09-20T15:00:00Z')
    await trato('d3', GANADO, '2026-09-01T15:00:00Z')
    const crmFetch = historiales({
      d1: ganadoA('2026-08-01T09:00:00-05:00'), d2: ganadoA('2026-09-20T09:00:00-05:00'), d3: ganadoA('2026-09-01T09:00:00-05:00'),
    })
    const sync = createCrmSync({ crmFetch, db, config })

    const r = await sync.syncPendingWonStages({ ...sinPausa, limite: 2 })

    expect(r).toMatchObject({ intentados: 2, poblados: 2 })
    expect(pedidos(crmFetch)).toEqual(['d2', 'd3'])
    expect((await fila('d1')).stage_history_synced_at).toBeNull()
  })

  /**
   * Sin `modified_time` no hay valor leído que guardar, y marcarlo con nulo lo haría salir en TODAS
   * las pasadas. Se marca con el epoch: se lee una vez y no vuelve hasta que Zoho le ponga fecha.
   */
  it('un trato sin modified_time se lee una vez y no vuelve a salir', async () => {
    await trato('d1', GANADO, null)
    const sync = createCrmSync({ crmFetch: historiales({ d1: ganadoA('2026-08-01T09:00:00-05:00') }), db, config })

    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1, poblados: 1 })
    expect(await sync.syncPendingWonStages({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 0 })
    expect((await fila('d1')).stage_history_synced_at?.toISOString()).toBe('1970-01-01T00:00:00.000Z')
  })
})
