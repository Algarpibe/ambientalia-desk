import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { instanteUltimaTransicion } from './fechasTicket'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const registrar = (ticketId: string, transitionId: string, cuando: string) =>
  db.query(
    'INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5,$6)',
    [ticketId, transitionId, transitionId, 'Rev./Diagnostico', 'Notificado', new Date(cuando)],
  )

describe('instanteUltimaTransicion', () => {
  it('sin transiciones devuelve null: no hay fecha que proponer', async () => {
    expect(await instanteUltimaTransicion(db, 't1', 'escalado_a_revision')).toBeNull()
  })

  it('devuelve el instante de la transición pedida', async () => {
    await registrar('t1', 'escalado_a_revision', '2026-08-10T15:00:00.000Z')
    expect(await instanteUltimaTransicion(db, 't1', 'escalado_a_revision')).toBe('2026-08-10T15:00:00.000Z')
  })

  /**
   * El caso que justifica el «última»: el informe se devolvió a corrección y se volvió a escalar. La
   * fecha que vale es la del ÚLTIMO escalado —el informe aprobado es ese—, no la del primero, que
   * describe una revisión que quedó anulada.
   */
  it('con varias, gana la más reciente', async () => {
    await registrar('t1', 'escalado_a_revision', '2026-08-01T15:00:00.000Z')
    await registrar('t1', 'devolucion_a_correccion', '2026-08-05T15:00:00.000Z')
    await registrar('t1', 'escalado_a_revision', '2026-08-09T15:00:00.000Z')
    expect(await instanteUltimaTransicion(db, 't1', 'escalado_a_revision')).toBe('2026-08-09T15:00:00.000Z')
  })

  it('no confunde etapas ni tickets', async () => {
    await registrar('t1', 'devolucion_a_correccion', '2026-08-05T15:00:00.000Z')
    await registrar('t2', 'escalado_a_revision', '2026-08-09T15:00:00.000Z')
    expect(await instanteUltimaTransicion(db, 't1', 'escalado_a_revision')).toBeNull()
  })

  /**
   * `performed_at` es `timestamptz`: pg lo entrega como `Date` y pg-mem como texto. Devolver
   * `String(v)` pasaría todos los tests y mandaría «Mon Aug 10 2026…» a la pantalla — la trampa que ya
   * costó un bug con las fechas del ticket.
   */
  it('devuelve un ISO, venga la columna como Date o como texto', async () => {
    await db.query(
      'INSERT INTO ticket_transitions (ticket_id, transition_id, performed_at) VALUES ($1,$2,$3)',
      ['t1', 'escalado_a_revision', '2026-08-10T15:00:00.000Z'],
    )
    expect(await instanteUltimaTransicion(db, 't1', 'escalado_a_revision')).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
