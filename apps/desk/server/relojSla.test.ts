import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { FROM_STATUS_CREACION, instanteDeJornada, type HistorialTransition } from '@ambientalia/shared'
import { secuenciaDelReloj, tiemposDelRelojPorTicket } from './db/relojSla'

/**
 * LECTURA DEL RELOJ DEL SLA (F1C-06; RQ-TC-75). El servidor arma, por ticket, la secuencia de estados
 * juntando las dos épocas —`ticket_transitions` de la app y `ticket_history` de Zoho— y se la da a la
 * regla pura de `packages/shared/src/relojSla.ts`. Los instantes salen de `instanteDeJornada`: la semana
 * es la del lunes 26/10/2026, sin festivos ni cierres, con jornada de 8 a 17 h (9 horas por día).
 */

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const lun = '2026-10-26', mar = '2026-10-27', mie = '2026-10-28'
const a = (dia: string, hora: number): Date => instanteDeJornada(dia, hora)
const AHORA = a(mie, 17)

let contador = 0
const ticket = (id: string, status: string, statusType: string, creado: Date | null = a(lun, 8)) =>
  db.query('INSERT INTO tickets (id, number, subject, status, status_type, created_time) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, ++contador, 'Reloj', status, statusType, creado])

const deApp = (ticketId: string, de: string, hacia: string, cuando: Date) =>
  db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)',
    [ticketId, 'x', de, hacia, cuando])

// Un `TicketUpdated` de Zoho con la forma real (`etapasDesdeHistoria.test.ts:10-16`).
const cambioDeZoho = (de: string, hacia: string, cuando: Date) => ({
  eventName: 'TicketUpdated',
  eventTime: cuando.toISOString(),
  actor: { id: 'bp1', name: ' Blueprint estado del Servicio', type: 'Blueprint' },
  eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: de, updatedValue: hacia, type: 'Text' }, propertyType: 'ValueTransition' }],
  actorInfo: [],
})
let evento = 0
const deZoho = (ticketId: string, de: string, hacia: string, cuando: Date) =>
  db.query('INSERT INTO ticket_history (id, ticket_id, event_name, event_time, raw) VALUES ($1,$2,$3,$4,$5)',
    [`h${++evento}`, ticketId, 'TicketUpdated', cuando, JSON.stringify(cambioDeZoho(de, hacia, cuando))])

const fila = (id: string, status: string, statusType: string, creado: Date | null = a(lun, 8)) =>
  ({ id, status, status_type: statusType, created_time: creado })

describe('RQ-TC-75 · secuenciaDelReloj, la secuencia de un ticket', () => {
  const etapa = (de: string, hacia: string, cuando: Date): HistorialTransition => ({
    transitionName: null, fromStatus: de, toStatus: hacia, area: null, performedBy: null, performedAt: cuando.toISOString(),
  })

  it('la foto de creación da el estado inicial y NO es una entrada', () => {
    const foto = { id: 1, from_status: FROM_STATUS_CREACION, to_status: 'En Proceso', performed_at: a(lun, 8) }
    const pasos = secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, [foto, { id: 2, from_status: 'En Proceso', to_status: 'Finalizado', performed_at: a(mar, 17) }], [])
    expect(pasos).toEqual([{ estado: 'En Proceso', desde: a(lun, 8) }, { estado: 'Finalizado', desde: a(mar, 17) }])
  })

  it('sin foto, el estado inicial es el de origen de la entrada más antigua', () => {
    const pasos = secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, [], [etapa('Ingresado', 'Servicio externo', a(lun, 12)), etapa('Servicio externo', 'Finalizado', a(mar, 12))])
    expect(pasos).toEqual([{ estado: 'Ingresado', desde: a(lun, 8) }, { estado: 'Servicio externo', desde: a(lun, 12) }, { estado: 'Finalizado', desde: a(mar, 12) }])
  })

  it('se juntan las dos épocas, ordenadas, aunque lleguen al revés', () => {
    const app = [{ id: 7, from_status: 'Servicio externo', to_status: 'Finalizado', performed_at: a(mar, 17) }]
    const pasos = secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, app, [etapa('Ingresado', 'Servicio externo', a(lun, 17))])
    expect(pasos?.map((p) => p.estado)).toEqual(['Ingresado', 'Servicio externo', 'Finalizado'])
  })

  it('a igual instante, las de la app se ordenan por id', () => {
    const mismo = a(lun, 12)
    const app = [
      { id: 9, from_status: 'Solicitado', to_status: 'Finalizado', performed_at: mismo },
      { id: 8, from_status: 'Ingresado', to_status: 'Solicitado', performed_at: mismo },
    ]
    expect(secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, app, [])?.map((p) => p.estado)).toEqual(['Ingresado', 'Solicitado', 'Finalizado'])
  })

  it('si el último estado no es el actual, no hay secuencia', () => {
    expect(secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, [], [etapa('Ingresado', 'Servicio externo', a(lun, 12))])).toBeNull()
  })

  it('sin entradas, sin creación o sin estado inicial no hay secuencia', () => {
    expect(secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, [], [])).toBeNull()
    expect(secuenciaDelReloj({ status: 'Finalizado', createdAt: null }, [], [etapa('Ingresado', 'Finalizado', a(lun, 12))])).toBeNull()
    expect(secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, [], [etapa(null as unknown as string, 'Finalizado', a(lun, 12))])).toBeNull()
  })

  it('una foto sola cuyo estado es el actual deja un solo paso', () => {
    const foto = { id: 1, from_status: FROM_STATUS_CREACION, to_status: 'Finalizado', performed_at: a(lun, 8) }
    expect(secuenciaDelReloj({ status: 'Finalizado', createdAt: a(lun, 8) }, [foto], [])).toEqual([{ estado: 'Finalizado', desde: a(lun, 8) }])
  })
})

describe('RQ-TC-75 · tiemposDelRelojPorTicket sobre la base', () => {
  it('junta las dos épocas: Zoho antes, la app después', async () => {
    await ticket('z1', 'Finalizado', 'Closed')
    await deZoho('z1', 'Ingresado', 'Notificación cliente', a(lun, 17)) // Ingresado corre 9 h; luego pausa
    await deApp('z1', 'Notificación cliente', 'Finalizado', a(mar, 17)) // la pausa dura otras 9 h
    const mapa = await tiemposDelRelojPorTicket(db, [fila('z1', 'Finalizado', 'Closed')], AHORA)
    expect(mapa.get('z1')).toEqual({ slaHoras: 9, totalHoras: 18 })
  })

  it('la foto de creación es el estado inicial de un ticket nacido en la app', async () => {
    await ticket('app-1', 'Finalizado', 'Closed')
    await deApp('app-1', FROM_STATUS_CREACION, 'Servicio externo', a(lun, 8))
    await deApp('app-1', 'Servicio externo', 'Finalizado', a(mar, 17))
    const mapa = await tiemposDelRelojPorTicket(db, [fila('app-1', 'Finalizado', 'Closed')], AHORA)
    expect(mapa.get('app-1')).toEqual({ slaHoras: 0, totalHoras: 18 })
  })

  it('una historia que no llega al estado actual no da dato (S-5)', async () => {
    await ticket('h1', 'Finalizado', 'Closed')
    await deZoho('h1', 'Ingresado', 'Servicio externo', a(lun, 12))
    const mapa = await tiemposDelRelojPorTicket(db, [fila('h1', 'Finalizado', 'Closed')], AHORA)
    expect(mapa.has('h1')).toBe(true)
    expect(mapa.get('h1')).toBeNull()
  })

  it('un ticket sin ninguna entrada no da dato', async () => {
    await ticket('s1', 'Finalizado', 'Closed')
    const mapa = await tiemposDelRelojPorTicket(db, [fila('s1', 'Finalizado', 'Closed')], AHORA)
    expect(mapa.get('s1')).toBeNull()
  })

  it('un cerrado cuyo estado no es terminal no da dato aunque su historia llegue (S-D2)', async () => {
    await ticket('d2', 'Servicio externo', 'Closed')
    await deApp('d2', 'Ingresado', 'Servicio externo', a(lun, 12))
    const mapa = await tiemposDelRelojPorTicket(db, [fila('d2', 'Servicio externo', 'Closed')], AHORA)
    expect(mapa.get('d2')).toBeNull()
  })

  it('un ticket abierto no se calcula (S-D1) y lleva null', async () => {
    await ticket('o1', 'Servicio externo', 'Open')
    await deApp('o1', 'Ingresado', 'Servicio externo', a(lun, 12))
    const mapa = await tiemposDelRelojPorTicket(db, [fila('o1', 'Servicio externo', 'Open')], AHORA)
    expect(mapa.get('o1')).toBeNull()
  })
  it('un Anulado también es terminal', async () => {
    await ticket('n1', 'Anulado', 'Closed')
    await deApp('n1', 'Ingresado', 'Anulado', a(lun, 17))
    const mapa = await tiemposDelRelojPorTicket(db, [fila('n1', 'Anulado', 'Closed')], AHORA)
    expect(mapa.get('n1')).toEqual({ slaHoras: 9, totalHoras: 9 })
  })

  it('los cierres de empresa de la base no cuentan', async () => {
    await db.query("INSERT INTO calendario_cierres (fecha, motivo, registrado_por) VALUES ($1,'cierre de prueba','prueba')", [mar])
    await ticket('c1', 'Finalizado', 'Closed')
    await deApp('c1', 'Ingresado', 'Finalizado', a(mar, 17)) // lunes 9 h; el martes está cerrado
    const mapa = await tiemposDelRelojPorTicket(db, [fila('c1', 'Finalizado', 'Closed')], AHORA)
    expect(mapa.get('c1')).toEqual({ slaHoras: 9, totalHoras: 9 })
  })

  it('sin ningún cerrado no se hace ninguna consulta', async () => {
    let consultas = 0
    const contando = { query: (...args: Parameters<Queryable['query']>) => { consultas++; return db.query(...args) } } as Queryable
    await tiemposDelRelojPorTicket(contando, [fila('o2', 'Ingresado', 'Open')], AHORA)
    expect(consultas).toBe(0)
  })

  /** La lectura es de número FIJO de consultas: si fuera una por ticket, cien tickets costarían cien veces más. */
  it('hace las mismas consultas con 10 que con 100 tickets', async () => {
    const consultasCon = async (n: number): Promise<number> => {
      const pg = newDb().adapters.createPg(); const base: Queryable = new pg.Pool(); await migrate(base)
      const filas = []
      for (let i = 0; i < n; i++) {
        const id = `m${n}-${i}`
        await base.query('INSERT INTO tickets (id, number, subject, status, status_type, created_time) VALUES ($1,$2,$3,$4,$5,$6)', [id, 10_000 * n + i, 'x', 'Finalizado', 'Closed', a(lun, 8)])
        await base.query('INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)', [id, 'x', 'Ingresado', 'Finalizado', a(mar, 17)])
        filas.push(fila(id, 'Finalizado', 'Closed'))
      }
      let consultas = 0
      const contando = { query: (...args: Parameters<Queryable['query']>) => { consultas++; return base.query(...args) } } as Queryable
      const mapa = await tiemposDelRelojPorTicket(contando, filas, AHORA)
      expect(mapa.size).toBe(n)
      expect(mapa.get(`m${n}-0`)).toEqual({ slaHoras: 18, totalHoras: 18 })
      return consultas
    }
    const con10 = await consultasCon(10)
    const con100 = await consultasCon(100)
    expect(con10).toBe(3)
    expect(con100).toBe(con10)
  })
})

describe('RQ-TC-76 · getAnalisisRows lleva los dos tiempos a cada fila', () => {
  it('un cerrado con historia trae slaHoras y totalHoras; un abierto, null', async () => {
    await ticket('g1', 'Finalizado', 'Closed')
    await deZoho('g1', 'Ingresado', 'Notificación cliente', a(lun, 17))
    await deApp('g1', 'Notificación cliente', 'Finalizado', a(mar, 17))
    await ticket('g2', 'Ingresado', 'Open')
    const { getAnalisisRows } = await import('./analisis')
    const filas = await getAnalisisRows(db, AHORA)
    expect(filas).toHaveLength(2)
    expect(filas.find((f) => f.status === 'Finalizado')).toMatchObject({ slaHoras: 9, totalHoras: 18 })
    expect(filas.find((f) => f.status === 'Ingresado')).toMatchObject({ slaHoras: null, totalHoras: null })
  })
})
