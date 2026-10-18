import { describe, it, expect } from 'vitest'
import { ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION } from '@ambientalia/shared'
import { db, instalarArnes } from './testing/appHarness'
import { getAccountDetail, getContactDetail } from './db/directory'

instalarArnes()

/**
 * tiempos-ficha-cliente (F1F-03, `tickets-core` RQ-TC-70): el detalle de contacto y de cuenta trae la media de resolución
 * de los últimos seis meses antes del `ahora` que recibe, sin el cierre que puso la migración (RQ-TC-69).
 */
const AHORA = new Date('2027-06-15T12:00:00.000Z')
const HORA = 3600000

let n = 7000
async function ticket(id: string, createdTime: string, closedTime: string, account: string, contact: string | null = null) {
  await db.query(
    `INSERT INTO tickets (id, number, subject, status, status_type, created_time, closed_time, account_id, contact_id)
     VALUES ($1, $2, 's', 'Finalizado', 'Closed', $3, $4, $5, $6)`,
    [id, ++n, createdTime, closedTime, account, contact],
  )
}
async function marcadorMigracion(ticketId: string, destino: string) {
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values, performed_at)
     VALUES ($1, $2, $3, 'Entregado', 'Finalizado', 'Servicio Técnico', $4, $5, $6)`,
    [ticketId, ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION,
      JSON.stringify({ regla: 'entregado-a-finalizado', closed_time_previo: null, closed_time_destino: destino, cierre_origen: 'migracion' }), destino],
  )
}

describe('ficha de cliente: ventana de seis meses (RQ-TC-70)', () => {
  it('el detalle de cuenta y de contacto cuenta sólo los cierres de la ventana, y no el de la migración', async () => {
    await db.query("INSERT INTO accounts (id, name) VALUES ('acc-v', 'Cliente')")
    await db.query("INSERT INTO contacts (id, first_name, account_id) VALUES ('ct-v', 'Ana', 'acc-v')")
    await ticket('dentro', '2027-03-01T10:00:00Z', '2027-03-01T12:00:00Z', 'acc-v', 'ct-v')
    await ticket('fuera', '2026-12-01T00:00:00Z', '2026-12-01T06:00:00Z', 'acc-v', 'ct-v')
    await ticket('m', '2027-01-01T00:00:00Z', '2027-05-01T15:00:00.000Z', 'acc-v', 'ct-v'); await marcadorMigracion('m', '2027-05-01T15:00:00.000Z')
    expect((await getAccountDetail(db, 'acc-v', AHORA))!.resolucionPromedioMs).toBe(2 * HORA)
    expect((await getContactDetail(db, 'ct-v', AHORA))!.resolucionPromedioMs).toBe(2 * HORA)
  })
  it('sin cierres en la ventana, null', async () => {
    await db.query("INSERT INTO accounts (id, name) VALUES ('acc-f', 'Antiguo')")
    await ticket('viejo', '2026-12-01T00:00:00Z', '2026-12-01T06:00:00Z', 'acc-f')
    expect((await getAccountDetail(db, 'acc-f', AHORA))!.resolucionPromedioMs).toBeNull()
  })
})
