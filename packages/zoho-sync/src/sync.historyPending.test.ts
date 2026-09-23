import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

const config = { departmentId: 'D1' } as AppConfig

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

let numero = 0
/** Un ticket de Zoho con su `modified_time` y, si se da, la marca de la última historia traída. */
const ticket = (id: string, modificado: string | null, sincronizado: string | null = null) =>
  db.query(
    'INSERT INTO tickets (id, number, subject, status, modified_time, history_synced_at) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, ++numero, 'A', 'Finalizado', modificado ? new Date(modificado) : null, sincronizado ? new Date(sincronizado) : null],
  )

const marca = async (id: string): Promise<Date | null> =>
  (await db.query('SELECT history_synced_at FROM tickets WHERE id = $1', [id])).rows[0].history_synced_at

describe('esquema · history_synced_at', () => {
  it('tickets tiene la columna y nace nula', async () => {
    await ticket('900', '2026-01-01T10:00:00Z')
    expect(await marca('900')).toBeNull()
  })

  /**
   * `history_synced_at` no está en `TICKET_COLS`, así que el sync de tickets no la toca. Si la
   * pisara, cada `syncRecent` devolvería a la cola los tickets que acaba de actualizar.
   */
  it('el sync de un ticket desde Zoho no borra la marca', async () => {
    await ticket('100', '2026-01-04T16:00:00Z', '2026-01-04T16:00:00Z')
    const zohoFetch = vi.fn().mockImplementation(async (url: string) =>
      url.startsWith('/tickets/100?')
        ? new Response(JSON.stringify({ id: '100', ticketNumber: '1', subject: 'A', status: 'Finalizado', modifiedTime: '2026-01-04T16:00:00Z' }), { status: 200 })
        : new Response('{}', { status: 404 }))
    const sync = createSync({ zohoFetch, db, config })

    await sync.syncTicket('100')

    expect((await marca('100'))?.toISOString()).toBe('2026-01-04T16:00:00.000Z')
  })
})

const evento = () =>
  ({ eventName: 'TicketUpdated', eventTime: '2026-01-05T15:00:00Z', actor: { name: 'Agente', type: 'Agent' }, eventInfo: [] })

/** Una página con un evento y después vacío, para cualquier ticket. */
const unaPagina = () => vi.fn().mockImplementation(async (url: string) =>
  url.includes('from=1')
    ? new Response(JSON.stringify({ data: [evento()] }), { status: 200 })
    : new Response(JSON.stringify({ data: [] }), { status: 200 }))

/** Los ids de ticket cuya historia se pidió, en el orden en que se pidieron. */
const pedidos = (zohoFetch: ReturnType<typeof vi.fn>) =>
  zohoFetch.mock.calls.map((c) => String(c[0])).filter((u) => u.includes('from=1')).map((u) => u.split('/')[2])

const sinPausa = { pausaMs: 0 }

describe('syncPendingHistory', () => {
  it('elige los que nunca se trajeron y los modificados después de la última vez', async () => {
    await ticket('100', '2026-01-04T16:00:00Z')
    await ticket('200', '2026-02-04T16:00:00Z', '2026-01-10T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config })

    const r = await sync.syncPendingHistory({ ...sinPausa, limite: 50 })

    expect(r).toEqual({ intentados: 2, poblados: 2, fallidos: 0 })
    expect(pedidos(zohoFetch).sort()).toEqual(['100', '200'])
    expect((await db.query('SELECT count(*)::int AS c FROM ticket_history')).rows[0].c).toBe(2)
  })

  it('no elige los que ya están al día', async () => {
    await ticket('100', '2026-01-04T16:00:00Z', '2026-01-04T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config })

    expect(await sync.syncPendingHistory({ ...sinPausa, limite: 50 })).toEqual({ intentados: 0, poblados: 0, fallidos: 0 })
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  /**
   * La marca es el `modified_time` LEÍDO al elegir el ticket, no la hora de la pasada: con `now()`,
   * un ticket que Zoho cambia mientras se trae su historia quedaría marcado como al día sin estarlo.
   */
  it('marca history_synced_at con el modified_time leído', async () => {
    await ticket('100', '2026-01-04T16:00:00Z')
    const sync = createSync({ zohoFetch: unaPagina(), db, config })

    await sync.syncPendingHistory({ ...sinPausa, limite: 50 })

    expect((await marca('100'))?.toISOString()).toBe('2026-01-04T16:00:00.000Z')
  })

  it('un ticket que cambia mientras se trae su historia vuelve a salir en la pasada siguiente', async () => {
    await ticket('100', '2026-01-04T16:00:00Z')
    const base = unaPagina()
    const zohoFetch = vi.fn().mockImplementation(async (url: string) => {
      // Zoho lo modifica justo mientras se pide su historia, como haría un syncRecent entre medias.
      await db.query('UPDATE tickets SET modified_time = $1 WHERE id = $2', [new Date('2026-01-04T17:00:00Z'), '100'])
      return base(url)
    })
    const sync = createSync({ zohoFetch, db, config })

    await sync.syncPendingHistory({ ...sinPausa, limite: 50 })

    expect(await sync.syncPendingHistory({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1, poblados: 1 })
  })

  /**
   * El invariante de la pasada: un fallo NO corta los demás, y el ticket fallido NO se marca, así
   * que la pasada siguiente lo vuelve a intentar sin hacer nada especial.
   */
  it('un fallo de Zoho en un ticket no corta la pasada y ese ticket queda sin marcar', async () => {
    await ticket('100', '2026-01-04T16:00:00Z')
    await ticket('200', '2026-02-04T16:00:00Z')
    const base = unaPagina()
    const zohoFetch = vi.fn().mockImplementation(async (url: string) =>
      url.includes('/tickets/100/') ? new Response('nope', { status: 404 }) : base(url))
    const sync = createSync({ zohoFetch, db, config })

    const r = await sync.syncPendingHistory({ ...sinPausa, limite: 50 })

    expect(r).toMatchObject({ intentados: 2, poblados: 1, fallidos: 1 })
    expect(r.motivoPrimerFallo).toContain('404')
    expect(await marca('100')).toBeNull()
    expect((await marca('200'))?.toISOString()).toBe('2026-02-04T16:00:00.000Z')

    zohoFetch.mockClear()
    expect(await sync.syncPendingHistory({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1 })
    expect(pedidos(zohoFetch)).toEqual(['100'])
  })

  it('respeta el límite y empieza por los modificados más recientemente', async () => {
    await ticket('100', '2026-01-04T16:00:00Z')
    await ticket('200', '2026-03-04T16:00:00Z')
    await ticket('300', '2026-02-04T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config })

    const r = await sync.syncPendingHistory({ ...sinPausa, limite: 2 })

    expect(r).toMatchObject({ intentados: 2, poblados: 2 })
    expect(pedidos(zohoFetch)).toEqual(['200', '300'])
    expect(await marca('100')).toBeNull()
  })

  /** Zoho no conoce los tickets nacidos en la app: preguntarle sería un 404 por cabeza en cada ciclo. */
  it('excluye los tickets nacidos en la app', async () => {
    await ticket('app-0001', '2026-08-01T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config })

    expect(await sync.syncPendingHistory({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 0 })
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  /**
   * Sin `modified_time` no hay valor leído que guardar, y marcarlo con nulo lo haría salir en TODAS
   * las pasadas. Se marca con el epoch: se trae una vez y no vuelve hasta que Zoho le ponga fecha.
   */
  it('un ticket sin modified_time se trae una vez y no vuelve a salir', async () => {
    await ticket('100', null)
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config })

    expect(await sync.syncPendingHistory({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 1, poblados: 1 })
    expect(await sync.syncPendingHistory({ ...sinPausa, limite: 50 })).toMatchObject({ intentados: 0 })
  })
})
