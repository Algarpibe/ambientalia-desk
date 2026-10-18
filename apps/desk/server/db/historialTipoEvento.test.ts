// F1C-04 lote 2 (RQ-TZ-21): el historial expone el tipo de evento de cada transición, derivado de `transition_id`
// y nunca de `values`. Molde de `eventoReasignacion.test.ts`: pg-mem, filas escritas a mano en `ticket_transitions`.
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getHistorialTicket } from './historial'

describe('getHistorialTicket · tipo de evento (RQ-TZ-21)', () => {
  let db: Queryable
  beforeEach(async () => {
    const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
    await db.query("INSERT INTO tickets (id,number,subject,status,classification) VALUES ('t1',1,'A','Ingresado','Servicio')")
  })
  const fila = (id: string, at: string, values: string | null = null, de = 'Ingresado') =>
    db.query(
      "INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('t1',$1,'Nombre cualquiera',$4,'Otro','Ana',$2,$3)",
      [id, at, values, de],
    )
  const transiciones = async () => (await getHistorialTicket(db, 't1')).eventos.filter((e) => e.eventName === 'AppTransition')

  it('una transición del catálogo trae su tipo: aprobacion → Decisional', async () => {
    await fila('aprobacion', '2026-08-02T10:00:00Z')
    expect((await transiciones())[0].tipoEvento).toBe('Decisional')
  })

  it('un `values` con otro tipo no lo cambia: manda el id de la transición', async () => {
    await fila('aprobacion', '2026-08-02T10:00:00Z', JSON.stringify({ tipoEvento: 'Administrativo' }))
    expect((await transiciones())[0].tipoEvento).toBe('Decisional')
  })

  it('los ids de migración no están en ningún catálogo: tipoEvento es null', async () => {
    await fila('migracion_f1c09_pendiente', '2026-08-02T10:00:00Z')
    await fila('migracion_f1f01_abiertos', '2026-08-03T10:00:00Z')
    const evs = await transiciones()
    expect(evs).toHaveLength(2)
    for (const e of evs) { expect('tipoEvento' in e).toBe(true); expect(e.tipoEvento).toBeNull() }
  })

  it('la fila anterior y la nueva con el mismo transition_id se clasifican igual, y como Decisional', async () => {
    await fila('aprobacion', '2026-01-01T10:00:00Z')
    await fila('aprobacion', '2026-08-02T10:00:00Z', JSON.stringify({ x: 1 }))
    const evs = await transiciones()
    expect(evs).toHaveLength(2)
    expect(evs[0].tipoEvento).toBe(evs[1].tipoEvento)
    expect(evs.map((e) => e.tipoEvento)).toEqual(['Decisional', 'Decisional'])
  })

  it('el evento de creación no lleva la propiedad tipoEvento', async () => {
    await fila('enviar', '2026-08-01T10:00:00Z', JSON.stringify({ marca: 'X' }), '(creación)')
    const { eventos } = await getHistorialTicket(db, 't1')
    const ev = eventos.find((e) => e.eventName === 'AppTicketCreado')!
    expect(ev).toBeDefined()
    expect('tipoEvento' in ev).toBe(false)
    expect(ev.tipoEvento).toBeUndefined()
  })
})
