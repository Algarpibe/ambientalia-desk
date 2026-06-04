import type { Ticket, TicketDetail, Message, UserPublic } from '../../shared/types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Sesión expirada/invalidada en una petición de datos → avisar para volver al login.
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export function fetchTickets(): Promise<Ticket[]> {
  return fetch('/api/tickets', { credentials: 'include' }).then((r) => json<Ticket[]>(r))
}

export function fetchTicket(id: string): Promise<TicketDetail> {
  return fetch(`/api/tickets/${id}`, { credentials: 'include' }).then((r) => json<TicketDetail>(r))
}

export function fetchConversations(id: string): Promise<Message[]> {
  return fetch(`/api/tickets/${id}/conversations`, { credentials: 'include' }).then((r) => json<Message[]>(r))
}

export function replyTicket(id: string, content: string, to?: string): Promise<unknown> {
  return fetch(`/api/tickets/${id}/reply`, {
    method: 'POST', credentials: 'include',
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
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transitionId, values }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string }
    throw new Error(body.errors ? body.errors.join(' · ') : body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<TicketDetail>
}

export async function authMe(): Promise<UserPublic | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (res.status === 401) return null
  return json<UserPublic>(res)
}

export async function authLogin(email: string, password: string): Promise<UserPublic> {
  const res = await fetch('/api/auth/login', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<UserPublic>
}

export async function authLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
}

export function listUsers(): Promise<UserPublic[]> {
  return fetch('/api/users', { credentials: 'include' }).then((r) => json<UserPublic[]>(r))
}

export interface NewUser { email: string; name: string; password: string; isAdmin: boolean }
export async function createUser(input: NewUser): Promise<UserPublic> {
  const res = await fetch('/api/users', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<UserPublic>
}

export function updateUser(id: string, patch: Partial<{ name: string; isAdmin: boolean; active: boolean; password: string }>): Promise<UserPublic> {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<UserPublic>(r))
}
