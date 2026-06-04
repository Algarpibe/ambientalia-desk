import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { upsertAccount, upsertTicket, getTicketRow, countTickets } from './repo'
import { getActiveTickets, getTicketWithRefs, nextTicketNumber, insertTransition } from './repo'
import { applyTransition, createTicket } from './repo'
import { upsertClient } from '../books/repo'
import { clientFromBooks } from '../books/mappers'
import { reseedTicketNumber } from './migrate'
import { ticketRowFromZoho, accountRowFromZoho } from './mappers'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

function zTicket(id: string, number: number, status = 'Ingresado') {
  return ticketRowFromZoho({ id, ticketNumber: String(number), status, statusType: 'Open', customFields: {} } as any)
}

describe('repo upserts', () => {
  it('upsertTicket inserta y actualiza', async () => {
    await upsertTicket(db, zTicket('1', 941))
    await upsertTicket(db, { ...zTicket('1', 941, 'En Proceso') })
    expect(await countTickets(db)).toBe(1)
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso')
  })

  it('upsertTicket NO sobrescribe si managed_by_app=true', async () => {
    await upsertTicket(db, { ...zTicket('1', 941), managed_by_app: true, status: 'En Proceso' })
    await upsertTicket(db, { ...zTicket('1', 941, 'Ingresado') }) // viene del sync
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('En Proceso') // preservado
    expect(r!.managed_by_app).toBe(true)
  })

  it('upsertAccount inserta', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'Gecelca' } as any))
    const r = await db.query('SELECT name FROM accounts WHERE id=$1', ['a1'])
    expect(r.rows[0].name).toBe('Gecelca')
  })
})

describe('repo queries', () => {
  it('getActiveTickets excluye cerrados y junta empresa/agente', async () => {
    await upsertAccount(db, accountRowFromZoho({ id: 'a1', accountName: 'Gecelca' } as any))
    await upsertTicket(db, { ...zTicket('1', 1, 'Ingresado'), account_id: 'a1' })
    await upsertTicket(db, { ...zTicket('2', 2, 'Finalizado'), status_type: 'Closed' })
    const list = await getActiveTickets(db)
    expect(list.map((x) => x.row.id)).toEqual(['1'])
    expect(list[0].refs.accountName).toBe('Gecelca')
  })

  it('nextTicketNumber continúa desde el máximo', async () => {
    await upsertTicket(db, zTicket('1', 953))
    await reseedTicketNumber(db)
    expect(await nextTicketNumber(db)).toBe(954)
  })

  it('insertTransition registra el historial', async () => {
    await upsertTicket(db, zTicket('1', 1))
    await insertTransition(db, { ticketId: '1', transitionId: 'aprobacion', transitionName: 'Aprobación', fromStatus: 'Notificación cliente', toStatus: 'En Proceso', area: 'Comercial', performedBy: 'app', values: { comment: 'ok' }, commentId: null })
    const r = await db.query('SELECT to_status FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(r.rows[0].to_status).toBe('En Proceso')
  })
})

describe('applyTransition', () => {
  it('actualiza ticket (managed), inserta comentario e historial', async () => {
    await upsertTicket(db, ticketRowFromZoho({ id: '1', ticketNumber: '5', status: 'OV asignada', statusType: 'Open', customFields: {} } as any))
    await applyTransition(
      db, '1', 'OV asignada',
      { id: 'habilitar_servicio', name: 'Habilitar Servicio', area: 'Comercial' },
      { status: 'Ingresado', statusType: 'Open', columns: { orden_venta: 'OV-1', fecha_cotizacion: '2026-05-19' }, customFields: {}, comment: 'ok' },
      'Equipo Técnico', { comment: 'ok' },
    )
    const r = await getTicketRow(db, '1')
    expect(r!.status).toBe('Ingresado')
    expect(r!.managed_by_app).toBe(true)
    expect(r!.orden_venta).toBe('OV-1')
    const conv = await db.query('SELECT count(*)::int AS n FROM conversations WHERE ticket_id=$1', ['1'])
    expect(conv.rows[0].n).toBe(1)
    const hist = await db.query('SELECT to_status, from_status, performed_by FROM ticket_transitions WHERE ticket_id=$1', ['1'])
    expect(hist.rows[0].to_status).toBe('Ingresado')
    expect(hist.rows[0].from_status).toBe('OV asignada')
    expect(hist.rows[0].performed_by).toBe('Equipo Técnico')
  })
})

describe('createTicket (Subsistema C)', () => {
  it('crea un ticket gestionado en "OV asignada" con número de secuencia + transición #1', async () => {
    await upsertClient(db, clientFromBooks({ contact_id: 'cli1', contact_name: 'Gecelca S.A. E.S.P.', last_modified_time: '2024-01-01T00:00:00Z' } as any))
    const id = await createTicket(db, {
      subject: 'Servicio Técnico Gecelca S.A. E.S.P. Monitor MT_18A20070_EDM180C_260604',
      codigoServicio: 'MT_18A20070_EDM180C_260604', classification: 'Equipo para servicio de mantenimiento',
      tipoServicio: 'Mantenimiento', equipo: 'Monitor de partículas', marca: 'Grimm', modelo: 'EDM180C',
      serial: '18A20070', ordenVenta: 'OV-2026-200', priority: null, clientId: 'cli1', salesorderId: 'so1', actor: 'Admin',
    })
    expect(id).toMatch(/^app-/)
    const row = (await db.query('SELECT number, status, status_type, managed_by_app, source, client_id, salesorder_id, orden_venta FROM tickets WHERE id=$1', [id])).rows[0]
    expect(row.status).toBe('OV asignada')
    expect(row.status_type).toBe('Open')
    expect(row.managed_by_app).toBe(true)
    expect(row.source).toBe('app')
    expect(row.client_id).toBe('cli1')
    expect(row.salesorder_id).toBe('so1')
    expect(row.orden_venta).toBe('OV-2026-200')
    expect(Number(row.number)).toBeGreaterThan(0)
    const tr = (await db.query('SELECT to_status, transition_name, area, performed_by FROM ticket_transitions WHERE ticket_id=$1', [id])).rows[0]
    expect(tr).toMatchObject({ to_status: 'OV asignada', transition_name: 'Enviar', area: 'Comercial', performed_by: 'Admin' })
    const active = await getActiveTickets(db)
    expect(active.find((t) => t.row.id === id)?.refs.accountName).toBe('Gecelca S.A. E.S.P.')
    const detail = await getTicketWithRefs(db, id)
    expect(detail?.refs.accountName).toBe('Gecelca S.A. E.S.P.')
  })
})
