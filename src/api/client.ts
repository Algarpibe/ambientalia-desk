import type { Ticket, TicketDetail, Message, UserPublic, ClientLite, SalesOrderLite, EquipoLite, EquipoFull, EquipoHistorial, CreateTicketPayload, Analisis } from '../../shared/types'

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

export function fetchTickets(scope?: 'all'): Promise<Ticket[]> {
  const qs = scope === 'all' ? '?scope=all' : ''
  return fetch(`/api/tickets${qs}`, { credentials: 'include' }).then((r) => json<Ticket[]>(r))
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

export function updateUser(id: string, patch: Partial<{ name: string; isAdmin: boolean; active: boolean; password: string; roleId: string | null }>): Promise<UserPublic> {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<UserPublic>(r))
}

export interface Role { id: string; name: string; areas: string[]; active: boolean }

export function listRoles(): Promise<Role[]> {
  return fetch('/api/roles', { credentials: 'include' }).then((r) => json<Role[]>(r))
}

export async function createRole(input: { name: string; areas: string[] }): Promise<Role> {
  const res = await fetch('/api/roles', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<Role>
}

export function updateRole(id: string, patch: Partial<{ name: string; areas: string[]; active: boolean }>): Promise<Role> {
  return fetch(`/api/roles/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<Role>(r))
}

export function searchClients(q: string): Promise<ClientLite[]> {
  return fetch(`/api/clients?search=${encodeURIComponent(q)}`, { credentials: 'include' }).then((r) => json<ClientLite[]>(r))
}

export function searchSalesOrders(q: string, clientId?: string): Promise<SalesOrderLite[]> {
  const p = new URLSearchParams({ search: q })
  if (clientId) p.set('clientId', clientId)
  return fetch(`/api/sales-orders?${p.toString()}`, { credentials: 'include' }).then((r) => json<SalesOrderLite[]>(r))
}

export function searchEquipos(q: string): Promise<EquipoLite[]> {
  return fetch(`/api/equipos?search=${encodeURIComponent(q)}`, { credentials: 'include' }).then((r) => json<EquipoLite[]>(r))
}

export async function createTicket(payload: CreateTicketPayload): Promise<TicketDetail> {
  const res = await fetch('/api/tickets', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<TicketDetail>
}

export interface EquipoInput { serial: string; marca: string | null; modelo: string | null; tipo: string | null; clientId?: string }

export function listEquiposManage(search: string, page = 1): Promise<{ items: EquipoFull[]; page: number }> {
  return fetch(`/api/equipos/manage?search=${encodeURIComponent(search)}&page=${page}`, { credentials: 'include' }).then((r) => json<{ items: EquipoFull[]; page: number }>(r))
}

export interface EquipoFacets { marcas: string[]; byMarca: Record<string, { modelos: string[]; tipos: string[] }> }
export function equipoFacets(): Promise<EquipoFacets> {
  return fetch('/api/equipos/facets', { credentials: 'include' }).then((r) => json<EquipoFacets>(r))
}

export async function createEquipo(input: EquipoInput): Promise<EquipoFull> {
  const res = await fetch('/api/equipos', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json() as Promise<EquipoFull>
}

export function updateEquipo(id: string, patch: Partial<EquipoInput> & { active?: boolean }): Promise<EquipoFull> {
  return fetch(`/api/equipos/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then((r) => json<EquipoFull>(r))
}

export function setEquipoActive(id: string, active: boolean): Promise<EquipoFull> {
  return updateEquipo(id, { active })
}

export async function deleteEquipo(id: string): Promise<void> {
  const res = await fetch(`/api/equipos/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
}

export function fetchEquipoHistorial(id: string): Promise<EquipoHistorial> {
  return fetch(`/api/equipos/${id}/historial`, { credentials: 'include' }).then((r) => json<EquipoHistorial>(r))
}

export function fetchAnalisis(range: string): Promise<Analisis> {
  return fetch(`/api/analisis?range=${encodeURIComponent(range)}`, { credentials: 'include' }).then((r) => json<Analisis>(r))
}
