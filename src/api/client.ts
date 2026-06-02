import type { Ticket, Message } from '../../shared/types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export function fetchTickets(): Promise<Ticket[]> {
  return fetch('/api/tickets').then((r) => json<Ticket[]>(r))
}

export function fetchTicket(id: string): Promise<Ticket> {
  return fetch(`/api/tickets/${id}`).then((r) => json<Ticket>(r))
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
