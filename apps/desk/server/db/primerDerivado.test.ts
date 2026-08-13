import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { primerDerivado } from './primerDerivado'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const registrar = (ticketId: string, cuando: string, values: Record<string, unknown>) =>
  db.query(
    'INSERT INTO ticket_transitions (ticket_id, transition_id, values, performed_at) VALUES ($1,$2,$3,$4)',
    [ticketId, 'x', JSON.stringify(values), new Date(cuando)],
  )

describe('primerDerivado', () => {
  it('un ticket sin transiciones no tiene primero', async () => {
    expect(await primerDerivado(db, 't1')).toBeNull()
  })

  it('devuelve a quien se derivó primero', async () => {
    await registrar('t1', '2026-08-01T15:00:00.000Z', { derivado_a: 'u-tecnico' })
    await registrar('t1', '2026-08-05T15:00:00.000Z', { derivado_a: 'u-comercial' })
    expect(await primerDerivado(db, 't1')).toBe('u-tecnico')
  })

  /**
   * El PRIMERO, y por eso hay que saltarse las etapas de antes: el ticket nace y pasa por «Habilitar
   * Servicio» sin derivar a nadie, así que las primeras filas traen `values` sin la clave. Mirando
   * solo la fila más vieja, el resultado sería `null` en todos los tickets del mundo real.
   */
  it('se salta las etapas que no derivaron a nadie', async () => {
    await registrar('t1', '2026-08-01T15:00:00.000Z', { orden_venta: 'OV-1' })
    await registrar('t1', '2026-08-02T15:00:00.000Z', { comment: 'sin derivar' })
    await registrar('t1', '2026-08-03T15:00:00.000Z', { derivado_a: 'u-tecnico' })
    expect(await primerDerivado(db, 't1')).toBe('u-tecnico')
  })

  /**
   * Vaciar la casilla es des-derivar, y se guarda como cadena vacía. Contarla como derivación daría un
   * id vacío que el desplegable no encontraría: la casilla se pintaría en blanco y confirmar la etapa
   * borraría la derivación sin que nadie lo pidiera.
   */
  it('des-derivar no cuenta como derivar', async () => {
    await registrar('t1', '2026-08-01T15:00:00.000Z', { derivado_a: '' })
    await registrar('t1', '2026-08-02T15:00:00.000Z', { derivado_a: 'u-tecnico' })
    expect(await primerDerivado(db, 't1')).toBe('u-tecnico')
  })

  it('no mira las transiciones de otro ticket', async () => {
    await registrar('t2', '2026-08-01T15:00:00.000Z', { derivado_a: 'u-otro' })
    expect(await primerDerivado(db, 't1')).toBeNull()
  })

  // `values` es `jsonb`: pg lo entrega parseado y pg-mem como texto. Sin el lector común, uno de los
  // dos caminos falla — y el que falla es producción.
  it('lee el jsonb venga parseado o como texto', async () => {
    await db.query(
      'INSERT INTO ticket_transitions (ticket_id, values, performed_at) VALUES ($1,$2,$3)',
      ['t1', JSON.stringify({ derivado_a: 'u-tecnico' }), new Date('2026-08-01T15:00:00.000Z')],
    )
    expect(await primerDerivado(db, 't1')).toBe('u-tecnico')
  })
})
