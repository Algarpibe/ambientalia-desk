import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

let numero = 0
const ticket = (id: string, creado: string) =>
  db.query('INSERT INTO tickets (id, number, subject, status, created_time) VALUES ($1,$2,$3,$4,$5)',
    [id, ++numero, 'A', 'Finalizado', new Date(creado)])

const evento = (nombre = 'CommentAdded') =>
  ({ eventName: nombre, eventTime: '2024-01-04T16:00:29Z', actor: { name: 'Ana', type: 'Agent' }, eventInfo: [] })

/** Una página con un evento y después vacío: es lo que hace `syncTicketHistory` por cada ticket. */
const unaPagina = () => vi.fn()
  .mockImplementation(async (url: string) =>
    url.includes('from=1')
      ? new Response(JSON.stringify({ data: [evento()] }), { status: 200 })
      : new Response(JSON.stringify({ data: [] }), { status: 200 }))

const sinPausa = { pausaMs: 0 }

describe('backfillTicketHistory', () => {
  it('puebla la historia de los tickets de Zoho que no la tienen', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    await ticket('200', '2024-02-04T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    const r = await sync.backfillTicketHistory(sinPausa)

    expect(r).toMatchObject({ intentados: 2, poblados: 2, fallidos: 0, restantes: 0 })
    expect((await db.query('SELECT count(*)::int AS c FROM ticket_history')).rows[0].c).toBe(2)
  })

  /**
   * Un ticket NACIDO en la app no existe en Zoho: preguntarle por su historia es un 404 por cabeza, y
   * en un barrido de cientos eso es ruido que además gasta cuota. La suya ya la cuenta
   * `ticket_transitions`, que es lo que el compositor une con la de Zoho.
   */
  it('se salta los tickets nacidos en la app', async () => {
    await ticket('app-abc', '2026-08-01T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    expect(await sync.backfillTicketHistory(sinPausa)).toMatchObject({ intentados: 0, poblados: 0 })
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  /**
   * Saltarse lo ya poblado es lo que hace el barrido REANUDABLE: si se corta a medias —por cuota, por
   * un redespliegue— volver a lanzarlo sigue por donde iba en vez de empezar de cero.
   */
  it('se salta los que ya tienen historia', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    await db.query("INSERT INTO ticket_history (id,ticket_id,event_name) VALUES ('h1','100','CommentAdded')")
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    expect(await sync.backfillTicketHistory(sinPausa)).toMatchObject({ intentados: 0, poblados: 0 })
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  /**
   * El invariante del barrido: un ticket que falla NO corta los demás. Sin esto, un solo 404 o un 429
   * a mitad de camino dejaría sin historia a los cientos que venían detrás, y el resultado sería
   * indistinguible de «Zoho no tiene esos datos».
   */
  it('un ticket que falla no corta el barrido', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    await ticket('200', '2024-02-04T16:00:00Z')
    const zohoFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/tickets/100/')) return new Response('nope', { status: 404 })
      return url.includes('from=1')
        ? new Response(JSON.stringify({ data: [evento()] }), { status: 200 })
        : new Response(JSON.stringify({ data: [] }), { status: 200 })
    })
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    const r = await sync.backfillTicketHistory(sinPausa)

    expect(r).toMatchObject({ intentados: 2, poblados: 1, fallidos: 1 })
    expect((await db.query("SELECT count(*)::int AS c FROM ticket_history WHERE ticket_id='200'")).rows[0].c).toBe(1)
  })

  /**
   * El límite existe para poder hacer una primera pasada corta contra Zoho de verdad antes de soltar
   * el barrido entero: `zohoFetch` no reintenta ante un 429, así que la cautela la pone quien lanza.
   * `restantes` es lo que dice cuánto queda por delante.
   */
  it('el límite acota el barrido y dice cuántos quedan', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    await ticket('200', '2024-02-04T16:00:00Z')
    await ticket('300', '2024-03-04T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    const r = await sync.backfillTicketHistory({ ...sinPausa, limite: 1 })

    expect(r).toMatchObject({ intentados: 1, poblados: 1, restantes: 2 })
  })

  // Los más nuevos primero: si el barrido se corta, lo que queda sin historia es lo más viejo, que es
  // lo que menos se abre.
  it('empieza por los tickets más recientes', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    await ticket('300', '2026-03-04T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    await sync.backfillTicketHistory({ ...sinPausa, limite: 1 })

    expect(String(zohoFetch.mock.calls[0][0])).toContain('/tickets/300/History')
  })
})

/**
 * `limite: 0` es el conteo, y no un caso degenerado que quedara por accidente: es la única forma de
 * preguntar «¿cuántos faltan?» sin gastar una sola llamada a Zoho, y es lo que hace la ruta admin
 * cuando responde esperando en vez de lanzar el barrido al fondo.
 */
describe('backfillTicketHistory · conteo', () => {
  it('con límite 0 cuenta los pendientes sin llamar a Zoho', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    await ticket('200', '2024-02-04T16:00:00Z')
    await ticket('app-abc', '2026-08-01T16:00:00Z')
    const zohoFetch = unaPagina()
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    expect(await sync.backfillTicketHistory({ limite: 0 })).toEqual({
      intentados: 0, poblados: 0, fallidos: 0, restantes: 2,
    })
    expect(zohoFetch).not.toHaveBeenCalled()
  })
})

/**
 * Contar los fallos no basta: «747 fallidos» no se distingue de «Zoho no tiene esos datos», y esa
 * ambigüedad ya costó una tarde —el endpoint devolvía 422 por un `limit` fuera de rango y el número
 * no lo decía—. El motivo del PRIMERO llega hasta el log, que es donde se mira.
 */
describe('backfillTicketHistory · por qué falló', () => {
  it('devuelve el motivo del primer fallo, no solo cuántos', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    const zohoFetch = vi.fn().mockResolvedValue(new Response('nope', { status: 422 }))
    const sync = createSync({ zohoFetch, db, config: { departmentId: 'D1' } as AppConfig })

    const r = await sync.backfillTicketHistory(sinPausa)

    expect(r.fallidos).toBe(1)
    expect(r.motivoPrimerFallo).toContain('422')
  })

  // Sin fallos no hay motivo que dar: un campo con texto siempre sería ruido en el log del caso bueno.
  it('sin fallos no hay motivo', async () => {
    await ticket('100', '2024-01-04T16:00:00Z')
    const sync = createSync({ zohoFetch: unaPagina(), db, config: { departmentId: 'D1' } as AppConfig })

    expect((await sync.backfillTicketHistory(sinPausa)).motivoPrimerFallo).toBeUndefined()
  })
})
