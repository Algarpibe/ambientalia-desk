import type { Ticket, TicketDetail, Message, UserPublic, ClientLite, SalesOrderLite, EquipoLite, EquipoFull, EquipoHistorial, CreateTicketPayload, Analisis, Activity, Resolution, ResolutionAttachment, HistoryEvent, ContactLite, AccountLite, ContactDetail, AccountDetail, ActivityListItem, RemisionNueva, Remision, RemisionFoto, RemisionListado } from '@ambientalia/shared'

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

export function fetchActiveTickets(): Promise<Ticket[]> {
  return fetch('/api/tickets', { credentials: 'include' }).then((r) => json<Ticket[]>(r))
}

export interface ClosedPage { items: Ticket[]; total: number; page: number; pageSize: number }

export function fetchClosedTickets(page: number): Promise<ClosedPage> {
  return fetch(`/api/tickets?scope=closed&page=${page}`, { credentials: 'include' }).then((r) => json<ClosedPage>(r))
}

/** Previsión del número del próximo ticket (no lo reserva). */
export function fetchNextTicketNumber(): Promise<{ number: number }> {
  return fetch('/api/tickets/next-number', { credentials: 'include' }).then((r) => json<{ number: number }>(r))
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

export function updateUser(id: string, patch: Partial<{ name: string; isAdmin: boolean; active: boolean; password: string; roleId: string | null; cargo: string | null; empresa: string | null }>): Promise<UserPublic> {
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

/** `soloLibres`: deja fuera las órdenes que ya usa otro ticket de Desk. */
export function searchSalesOrders(q: string, clientId?: string, soloLibres = false): Promise<SalesOrderLite[]> {
  const p = new URLSearchParams({ search: q })
  if (clientId) p.set('clientId', clientId)
  if (soloLibres) p.set('soloLibres', '1')
  return fetch(`/api/sales-orders?${p.toString()}`, { credentials: 'include' }).then((r) => json<SalesOrderLite[]>(r))
}

/** `clientId` acota la búsqueda a los equipos de ese cliente; omitirlo busca en todos. */
export function searchEquipos(q: string, clientId?: string | null): Promise<EquipoLite[]> {
  const p = new URLSearchParams({ search: q })
  if (clientId) p.set('clientId', clientId)
  return fetch(`/api/equipos?${p.toString()}`, { credentials: 'include' }).then((r) => json<EquipoLite[]>(r))
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

/** `tiposPorModelo`: los tipos que el inventario ha visto para cada modelo. Uno solo ⇒ se deduce. */
export interface EquipoFacets { marcas: string[]; byMarca: Record<string, { modelos: string[]; tipos: string[]; tiposPorModelo: Record<string, string[]> }> }
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

export function fetchActivities(ticketId: string): Promise<Activity[]> {
  return fetch(`/api/tickets/${ticketId}/activities`, { credentials: 'include' }).then((r) => json<Activity[]>(r))
}

export function fetchResolution(id: string): Promise<Resolution> {
  return fetch(`/api/tickets/${id}/resolution`, { credentials: 'include' }).then((r) => json<Resolution>(r))
}
export async function saveResolution(id: string, html: string): Promise<void> {
  const res = await fetch(`/api/tickets/${id}/resolution`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
export async function uploadResolutionImage(id: string, file: File): Promise<ResolutionAttachment> {
  const fd = new FormData(); fd.append('file', file)
  const res = await fetch(`/api/tickets/${id}/resolution/attachments`, { method: 'POST', credentials: 'include', body: fd })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json() as Promise<ResolutionAttachment>
}
export async function deleteResolutionImage(id: string, attId: string): Promise<void> {
  const res = await fetch(`/api/tickets/${id}/resolution/attachments/${attId}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
export async function deleteResolution(id: string): Promise<void> {
  const res = await fetch(`/api/tickets/${id}/resolution`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export function fetchHistory(id: string): Promise<HistoryEvent[]> {
  return fetch(`/api/tickets/${id}/history`, { credentials: 'include' }).then((r) => json<HistoryEvent[]>(r))
}

export function fetchContacts(): Promise<ContactLite[]> {
  return fetch('/api/contacts', { credentials: 'include' }).then((r) => json<ContactLite[]>(r))
}
export function fetchAccounts(): Promise<AccountLite[]> {
  return fetch('/api/accounts', { credentials: 'include' }).then((r) => json<AccountLite[]>(r))
}

export function fetchContactDetail(id: string): Promise<ContactDetail> {
  return fetch(`/api/contacts/${id}`, { credentials: 'include' }).then((r) => json<ContactDetail>(r))
}
export function fetchAccountDetail(id: string): Promise<AccountDetail> {
  return fetch(`/api/accounts/${id}`, { credentials: 'include' }).then((r) => json<AccountDetail>(r))
}

export function fetchAllActivities(filter: string, search: string): Promise<ActivityListItem[]> {
  const p = new URLSearchParams({ filter, search })
  return fetch(`/api/activities?${p.toString()}`, { credentials: 'include' }).then((r) => json<ActivityListItem[]>(r))
}

export function fetchRemisionNueva(ticketId: string): Promise<RemisionNueva> {
  return fetch(`/api/remisiones/nueva?ticketId=${encodeURIComponent(ticketId)}`, { credentials: 'include' }).then((r) => json<RemisionNueva>(r))
}

export type RemisionConFotos = Remision & { fotos: RemisionFoto[] }

export function fetchRemisiones(ticketId: string): Promise<RemisionConFotos[]> {
  return fetch(`/api/remisiones?ticketId=${encodeURIComponent(ticketId)}`, { credentials: 'include' }).then((r) => json<RemisionConFotos[]>(r))
}

/** Una remisión concreta con sus fotos. La usa el sondeo que espera el desenlace de n8n tras enviar. */
export function fetchRemision(id: string): Promise<RemisionConFotos> {
  return fetch(`/api/remisiones/${encodeURIComponent(id)}`, { credentials: 'include' }).then((r) => json<RemisionConFotos>(r))
}

/**
 * Todas las remisiones (históricas + app), para la sección "Remisiones" de la cabecera.
 * `incluirAnuladas` es lo que activa el interruptor "Ver anuladas" (solo administradores); por
 * defecto se quedan fuera, igual que en el servidor.
 */
export function fetchRemisionesListado(incluirAnuladas = false): Promise<RemisionListado[]> {
  const qs = incluirAnuladas ? '?incluirAnuladas=1' : ''
  return fetch(`/api/remisiones/listado${qs}`, { credentials: 'include' }).then((r) => json<RemisionListado[]>(r))
}

/**
 * Anula la remisión: no se borra, se marca (ver el comentario en `db/remisiones.ts`). Reversible con
 * `restaurarRemision`. Solo administradores — el servidor responde 403 si no lo es.
 */
export async function anularRemision(id: string): Promise<void> {
  const res = await fetch(`/api/remisiones/${id}/anular`, { method: 'POST', credentials: 'include' })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
}

/** Deshace una anulación: la remisión vuelve a aparecer en el listado y en el panel del ticket. */
export async function restaurarRemision(id: string): Promise<void> {
  const res = await fetch(`/api/remisiones/${id}/restaurar`, { method: 'POST', credentials: 'include' })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
}

export interface CrearRemisionPayload {
  ticketId: string
  fecha: string
  incluye: string[]
  observaciones?: string
  /**
   * Que el humano confirmó crear una segunda remisión sin desenlace en este ticket. Sin esto el
   * servidor responde 409, que es lo que cierra el duplicado accidental: el servidor no puede
   * distinguir por su cuenta un reintento de red de una decisión deliberada.
   */
  permitirSegunda?: boolean
  /**
   * Orden de venta que el técnico eligió en el formulario, cuando el ticket no la traía. Viaja el ID
   * y no el número: el servidor resuelve número y fecha contra Books, que es donde vive el dato.
   */
  salesOrderId?: string
}

export async function crearRemision(payload: CrearRemisionPayload): Promise<Remision> {
  const res = await fetch('/api/remisiones', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json() as Promise<Remision>
}

/** Envía la remisión al flujo de n8n. Va después de subir las fotos, que viajan en el payload. */
export async function enviarRemision(id: string): Promise<void> {
  const res = await fetch(`/api/remisiones/${id}/enviar`, { method: 'POST', credentials: 'include' })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string; detalle?: string }; throw new Error(b.detalle || b.error || `HTTP ${res.status}`) }
}

export async function subirFotoRemision(id: string, file: File): Promise<RemisionFoto> {
  const fd = new FormData(); fd.append('file', file)
  const res = await fetch(`/api/remisiones/${id}/fotos`, { method: 'POST', credentials: 'include', body: fd })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json() as Promise<RemisionFoto>
}

export function setTicketRead(id: string, read: boolean): Promise<void> {
  return fetch(`/api/tickets/${id}/read`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ read }),
  }).then(() => undefined)
}
