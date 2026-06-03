import type { Ticket, TicketDetail, Message } from '../../shared/types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export function fetchTickets(): Promise<Ticket[]> {
  return fetch('/api/tickets').then((r) => json<Ticket[]>(r))
}

export function fetchTicket(id: string): Promise<TicketDetail> {
  return fetch(`/api/tickets/${id}`).then((r) => json<TicketDetail>(r))
}

export function fetchConversations(id: string): Promise<Message[]> {
  return fetch(`/api/tickets/${id}/conversations`).then((r) => json<Message[]>(r))
}

export function updateTicketStatus(id: string, status: string): Promise<Ticket> {
  return fetch(`/api/tickets/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then((r) => json<Ticket>(r))
}

export function replyTicket(id: string, content: string, to?: string): Promise<unknown> {
  return fetch(`/api/tickets/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, to }),
  }).then((r) => json<unknown>(r))
}

/** Ejecuta una transición del Blueprint. Lanza con los errores de validación si los hay. */
export async function executeTransition(
  id: string,
  transitionId: string,
  values: Record<string, unknown>,
): Promise<TicketDetail> {
  const res = await fetch(`/api/tickets/${id}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transitionId, values }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string }
    throw new Error(body.errors ? body.errors.join(' · ') : body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<TicketDetail>
}
