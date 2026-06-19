import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getTicketWithRefs, createTicket, applyTransition } from '@ambientalia/zoho-sync/db/repo'
import { rowToTicketDetail } from '@ambientalia/zoho-sync/db/mappers'
import { getClient, getSalesOrder } from '@ambientalia/zoho-sync/books/repo'
import { getEquipo } from '../db/equipos'
import { buildSubject, buildCodigoServicio, PREFIJOS } from '@ambientalia/shared'
import { transitionById, canExecuteTransition } from '@ambientalia/shared'
import { buildTransitionPlan } from '../transitionExec'
import { TRANSITION_ACTOR } from '../transitionActor'
import { HttpError } from '../util/httpError'

// Crea un ticket gestionado por la app en "OV asignada" (Subsistema C). Pivota opcionalmente en una OV de Books.
export async function createManagedTicket(db: Queryable, body: unknown, actorName: string): Promise<unknown> {
  const b = (body ?? {}) as Record<string, unknown>
  const equipoId = b.equipoId ? String(b.equipoId) : ''
  if (!equipoId) throw new HttpError(422, { error: 'Falta el equipo' })
  const equipo = await getEquipo(db, equipoId)
  if (!equipo) throw new HttpError(422, { error: 'Equipo no registrado' })

  let clientId: string | null = b.clientId ? String(b.clientId) : null
  let ordenVenta: string | null = b.ordenVenta ? String(b.ordenVenta) : null
  let salesorderId: string | null = null
  if (b.salesOrderId) {
    const ov = await getSalesOrder(db, String(b.salesOrderId))
    if (!ov) throw new HttpError(422, { error: 'Orden de venta no encontrada' })
    salesorderId = ov.id
    clientId = clientId ?? ov.clientId ?? null
    ordenVenta = ordenVenta ?? ov.number ?? null
  }
  const tipoServicio = b.tipoServicio ? String(b.tipoServicio) : ''
  const clasificaciones = b.clasificaciones ? String(b.clasificaciones) : ''
  const prefijo = b.prefijo ? String(b.prefijo) : ''
  const missing: string[] = []
  if (!clientId) missing.push('cliente')
  if (!tipoServicio) missing.push('tipo de servicio')
  if (!clasificaciones) missing.push('clasificaciones')
  if (!prefijo || !(PREFIJOS as readonly string[]).includes(prefijo)) missing.push('prefijo')
  if (missing.length) throw new HttpError(422, { error: `Faltan campos obligatorios: ${missing.join(', ')}` })
  const cliente = await getClient(db, clientId!)
  if (!cliente) throw new HttpError(422, { error: 'Cliente no encontrado' })
  const codigoServicio = b.codigoServicio ? String(b.codigoServicio) : buildCodigoServicio({ prefijo, serie: equipo.serial, modelo: equipo.modelo ?? '', fecha: new Date() })
  const subject = b.subject ? String(b.subject) : buildSubject({ cliente: cliente.name, tipoEquipo: equipo.tipo ?? '', codigo: codigoServicio })
  const id = await createTicket(db, {
    subject, codigoServicio, classification: clasificaciones, tipoServicio, equipo: equipo.tipo ?? null,
    marca: equipo.marca ?? null, modelo: equipo.modelo ?? null, serial: equipo.serial,
    ordenVenta, priority: b.prioridad ? String(b.prioridad) : null,
    clientId: clientId!, salesorderId, equipoId: equipo.id, actor: actorName,
  })
  const created = await getTicketWithRefs(db, id)
  return created ? rowToTicketDetail(created.row, created.refs) : {}
}

// Ejecuta una transición del Blueprint escribiendo en Postgres (Subsistema B).
export async function executeTransition(
  db: Queryable,
  id: string,
  body: unknown,
  user: { areas: string[]; isAdmin: boolean; name?: string },
): Promise<unknown> {
  const b = (body ?? {}) as Record<string, unknown>
  const t = transitionById(String(b.transitionId))
  if (!t) throw new HttpError(400, { error: 'Transición desconocida' })
  const current = await getTicketWithRefs(db, id)
  if (!current) throw new HttpError(404, { error: 'Ticket no encontrado' })
  if (!t.from.includes(current.row.status)) {
    throw new HttpError(409, { error: `La transición "${t.name}" no aplica desde el estado "${current.row.status}"` })
  }
  if (!canExecuteTransition(user.areas, user.isAdmin, t.area)) {
    throw new HttpError(403, { error: `Tu rol no tiene permiso para esta transición (área: ${t.area})` })
  }
  const values = (b.values ?? {}) as Record<string, unknown>
  const plan = buildTransitionPlan(t, values)
  if (plan.errors.length) throw new HttpError(422, { errors: plan.errors })
  const actor = user.name ?? TRANSITION_ACTOR
  await applyTransition(db, id, current.row.status, { id: t.id, name: t.name, area: t.area }, plan, actor, values)
  const updated = await getTicketWithRefs(db, id)
  return updated ? rowToTicketDetail(updated.row, updated.refs) : {}
}
