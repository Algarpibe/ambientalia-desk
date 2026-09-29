import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ticketsEsperandoAprobacionCliente } from './alarmasAvisadas'
import { ALARMAS_SLA } from '@ambientalia/shared'
import { logger } from '../util/logger'

/**
 * alarmas-horas-habiles (F1B-08, lote 4) · RQ-VT-07: la marca de tablero «esperando aprobación del cliente».
 *
 * La calcula el SERVIDOR (regla invariable 13) leyendo la MARCA de la alarma, no el calendario: un ticket la lleva si
 * está en un estado cuya alarma tiene `marcaTablero` (hoy sólo `Notificación cliente`) y existe marca en
 * `public.alarmas_avisadas` para su entrada ACTUAL a ese estado. Es una marca de vista, no un estado: leerla no
 * escribe nada. Nunca lanza: una marca no puede tumbar el tablero.
 */
let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })
afterEach(() => { vi.restoreAllMocks() })

const E1 = '2026-09-09T13:00:00.000Z'
const E2 = '2026-09-17T13:00:00.000Z'
const ticket = (id: string, status: string) =>
  db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [id, Number(id.replace(/\D/g, '') || 1), 'T', status])
const entro = (id: string, estado: string, at: string) =>
  db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ($1,$2,$3,$4)', [id, 'x', estado, new Date(at)])
const marca = (id: string, estado: string, at: string) =>
  db.query('INSERT INTO public.alarmas_avisadas (ticket_id, estado, entrada_at, avisos_creados) VALUES ($1,$2,$3,1)', [id, estado, new Date(at)])
const marcados = async () => [...await ticketsEsperandoAprobacionCliente(db)].sort()

describe('ticketsEsperandoAprobacionCliente', () => {
  it('S39: en Notificación cliente con marca de su entrada actual, lo señala; y leer no escribe en el historial', async () => {
    await ticket('t1', 'Notificación cliente'); await entro('t1', 'Notificación cliente', E1); await marca('t1', 'Notificación cliente', E1)
    const antes = Number((await db.query('SELECT count(*) AS n FROM ticket_transitions')).rows[0].n)
    expect(await marcados()).toEqual(['t1'])
    expect(Number((await db.query('SELECT count(*) AS n FROM ticket_transitions')).rows[0].n)).toBe(antes)
  })

  it('S40: en Notificación cliente sin marca (no ha vencido), no', async () => {
    await ticket('t2', 'Notificación cliente'); await entro('t2', 'Notificación cliente', E2)
    expect(await marcados()).toEqual([])
  })

  it('S41: al salir del estado deja de señalarlo, aunque la fila de la marca siga ahí', async () => {
    await ticket('t3', 'Aprobado'); await entro('t3', 'Notificación cliente', E1); await marca('t3', 'Notificación cliente', E1)
    await entro('t3', 'Aprobado', E2)
    expect(await marcados()).toEqual([])
  })

  it('S42: al reentrar no hereda la marca de la entrada anterior', async () => {
    await ticket('t4', 'Notificación cliente'); await entro('t4', 'Notificación cliente', E1); await marca('t4', 'Notificación cliente', E1)
    await entro('t4', 'Notificación cliente', E2)
    expect(await marcados()).toEqual([])
  })

  it('S43: una marca de otro estado vencido (Notificado, Remisión creada) no produce la señal', async () => {
    await ticket('t5', 'Notificado'); await entro('t5', 'Notificado', E1); await marca('t5', 'Notificado', E1)
    await ticket('t6', 'Remisión creada'); await entro('t6', 'Remisión creada', E1); await marca('t6', 'Remisión creada', E1)
    expect(await marcados()).toEqual([])
  })

  /**
   * Con DOS estados que marcan el tablero, la marca de uno no vale para el otro aunque el instante coincida. Hoy sólo
   * `Notificación cliente` marca, y sin esta prueba la comparación del estado sería código muerto (mutación 4.6b).
   */
  it('con dos estados que marcan, la marca de un estado no señala a un ticket que está en el otro', async () => {
    const alarma = ALARMAS_SLA['Remisión creada']!
    try {
      alarma.marcaTablero = true
      await ticket('t7', 'Remisión creada'); await entro('t7', 'Remisión creada', E1); await marca('t7', 'Notificación cliente', E1)
      expect(await marcados()).toEqual([])
    } finally {
      delete alarma.marcaTablero
    }
  })

  it('ante un error de la base, deja un warn y devuelve el conjunto vacío: nunca lanza', async () => {
    const warn = vi.spyOn(logger, 'warn')
    const rota: Queryable = { query: (() => { throw new Error('base caída') }) as Queryable['query'] }
    await expect(ticketsEsperandoAprobacionCliente(rota)).resolves.toEqual(new Set())
    expect(warn).toHaveBeenCalled()
  })
})
