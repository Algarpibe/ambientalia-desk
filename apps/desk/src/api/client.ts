import type { Ticket, TicketDetail, Message, UserPublic, ClientLite, SalesOrderLite, EquipoLite, EquipoFull, EquipoHistorial, CreateTicketPayload, Analisis, Activity, Resolution, ResolutionAttachment, HistoryEvent, ContactLite, AccountLite, ContactDetail, AccountDetail, ActivityListItem, RemisionNueva, Remision, RemisionFoto, RemisionListado, Catalogo, Conflictos, FichaModelo, TipoDocumento, ArticuloLite, ArticuloModelo, ClaseArticulo, CategoriaModelo, PersonaLite, Aviso, ResumenEliminacion } from '@ambientalia/shared'

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

export interface NewUser { email: string; name: string; password: string; isAdmin: boolean; roleId: string | null; cargo: string; empresa: string; cargoPermiso: string }
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

export function updateUser(id: string, patch: Partial<{ name: string; email: string; isAdmin: boolean; active: boolean; password: string; roleId: string | null; cargo: string | null; empresa: string | null; cargoPermiso: string | null }>): Promise<UserPublic> {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<UserPublic>(r))
}

/*
 * El borrado de un ticket, en dos funciones con nombre sobre la MISMA ruta.
 *
 * Son dos y no una con un booleano a propósito: el parámetro que separa «enséñame qué se iría» de
 * «bórralo» es una cadena en una query, y nadie debería estar en posición de olvidarla. Quien lee
 * `eliminarTicket(id)` en un componente sabe exactamente lo que va a pasar.
 */
async function pedirBorrado(id: string, dryRun: boolean): Promise<ResumenEliminacion> {
  const res = await fetch(`/api/tickets/${id}${dryRun ? '?dryRun=true' : ''}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<ResumenEliminacion>
}

/** Qué se borraría. No escribe nada. */
export const previsualizarEliminarTicket = (id: string): Promise<ResumenEliminacion> => pedirBorrado(id, true)
/** Lo borra. Sin vuelta atrás; devuelve el recibo de lo que se fue. */
export const eliminarTicket = (id: string): Promise<ResumenEliminacion> => pedirBorrado(id, false)

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
}

export interface Role { id: string; name: string; areas: string[]; active: boolean; recibeAvisos: boolean }

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

export function updateRole(id: string, patch: Partial<{ name: string; areas: string[]; active: boolean; recibeAvisos: boolean }>): Promise<Role> {
  return fetch(`/api/roles/${id}`, {
    method: 'PATCH', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<Role>(r))
}

export function searchClients(q: string, provisionales = false): Promise<ClientLite[]> {
  return fetch(`/api/clients?search=${encodeURIComponent(q)}${provisionales ? '&provisionales=1' : ''}`, { credentials: 'include' }).then((r) => json<ClientLite[]>(r))
}

/**
 * El cliente por su id, resuelto en el servidor (`routes/directory.ts`). Quien ya conoce el id —el
 * equipo elegido, la orden de venta— no necesita el buscador por texto: evita el `LIKE` que no pliega
 * acentos ni puntuación y el `LIMIT 20` que podía dejar fuera al cliente correcto.
 */
export function getClient(id: string): Promise<ClientLite | null> {
  return fetch(`/api/clients/${encodeURIComponent(id)}`, { credentials: 'include' }).then((r) => {
    if (r.status === 404) return null
    return json<ClientLite>(r)
  })
}

/** Los avisos de quien tiene la sesión abierta. El destinatario lo pone el servidor, no se manda. */
export function getAvisos(): Promise<Aviso[]> {
  return fetch('/api/avisos', { credentials: 'include' }).then((r) => json<Aviso[]>(r))
}

export async function marcarAvisosLeidos(ids: string[]): Promise<void> {
  const r = await fetch('/api/avisos/leidos', {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }),
  })
  if (!r.ok) await json(r)
}

/**
 * Las personas a las que se puede derivar un ticket: usuarios ACTIVOS, con su cargo para reconocerlas.
 * No es `/api/users` —eso es administración—: esta la puede pedir cualquiera con sesión.
 */
export function getPersonas(): Promise<PersonaLite[]> {
  return fetch('/api/personas', { credentials: 'include' }).then((r) => json<PersonaLite[]>(r))
}

/** Artículos de Zoho Books por SKU o nombre. Solo activos y solo los que tienen SKU. */
export function buscarArticulos(q: string): Promise<ArticuloLite[]> {
  return fetch(`/api/articulos?search=${encodeURIComponent(q)}`, { credentials: 'include' }).then((r) => json<ArticuloLite[]>(r))
}

/** Accesorios, consumibles y repuestos de un modelo, incluidos los desactivados (es la gestión). */
export function getArticulosModelo(modeloId: string): Promise<ArticuloModelo[]> {
  return fetch(`/api/catalogo/modelos/${modeloId}/articulos`, { credentials: 'include' }).then((r) => json<ArticuloModelo[]>(r))
}

/** Con `itemId` el servidor toma sku y nombre de Books; sin él, es un ítem de texto libre. */
export function crearArticuloModelo(modeloId: string, body: { clase: ClaseArticulo; itemId?: string; nombre?: string }): Promise<{ id: string }> {
  return fetch(`/api/catalogo/modelos/${modeloId}/articulos`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then((r) => json<{ id: string }>(r))
}

export function actualizarArticuloModelo(id: string, patch: { clase?: ClaseArticulo; activo?: boolean; orden?: number }): Promise<{ ok: true }> {
  return fetch(`/api/catalogo/articulos/${id}`, {
    method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
  }).then((r) => json<{ ok: true }>(r))
}

export async function borrarArticuloModelo(id: string): Promise<void> {
  const r = await fetch(`/api/catalogo/articulos/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!r.ok) await json(r)
}

/** Todas las categorías de Books con artículos activos: lo que se puede asignar a un modelo. */
export function getCategoriasDisponibles(): Promise<Array<{ categoria: string; articulos: number }>> {
  return fetch('/api/articulos/categorias', { credentials: 'include' })
    .then((r) => json<Array<{ categoria: string; articulos: number }>>(r))
}

export function getCategoriasModelo(modeloId: string): Promise<CategoriaModelo[]> {
  return fetch(`/api/catalogo/modelos/${modeloId}/categorias`, { credentials: 'include' }).then((r) => json<CategoriaModelo[]>(r))
}

export function asignarCategoriaModelo(modeloId: string, clase: ClaseArticulo, categoria: string): Promise<{ id: string }> {
  return fetch(`/api/catalogo/modelos/${modeloId}/categorias`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clase, categoria }),
  }).then((r) => json<{ id: string }>(r))
}

export async function quitarCategoriaModelo(id: string): Promise<void> {
  const r = await fetch(`/api/catalogo/categorias/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!r.ok) await json(r)
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

export async function createTicket(payload: CreateTicketPayload & CuerpoAltaManual): Promise<TicketDetail> {
  const res = await fetch('/api/tickets', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; candidatos?: CandidatoNit[] }
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), body.candidatos ? { candidatos: body.candidatos } : {}) // el 409 de P-B lleva los candidatos
  }
  return res.json() as Promise<TicketDetail>
}

/** `modeloId` apunta al catálogo maestro, que es quien escribe marca/modelo/tipo en el servidor: por
 *  eso esos tres textos ya no viajan desde aquí (el endpoint los ignoraría de todos modos).
 *  Los seis campos comerciales de la hoja de vida (F1B-02) son opcionales y el servidor los valida
 *  entero antes de escribir nada (`camposHojaDeVida`, `routes/equipos.ts`); el cliente sólo los pasa. */
export interface EquipoInput {
  serial: string; modeloId: string; clientId?: string
  fechaAdquisicion?: string | null; fechaFacturaCompra?: string | null; finGarantia?: string | null
  codigoInterno?: string | null; mantenedorId?: string | null; driveUrl?: string | null
}

export function listEquiposManage(search: string, page = 1): Promise<{ items: EquipoFull[]; page: number }> {
  return fetch(`/api/equipos/manage?search=${encodeURIComponent(search)}&page=${page}`, { credentials: 'include' }).then((r) => json<{ items: EquipoFull[]; page: number }>(r))
}

// ---- Catálogo maestro de equipos ----

/** `incluir` trae además ese modelo aunque esté desactivado: sin él, editar un equipo cuyo modelo se
 *  retiró dejaría el campo en blanco y obligaría a cambiárselo para poder guardar. */
export function getCatalogo(incluir?: string | null): Promise<Catalogo> {
  const p = new URLSearchParams()
  if (incluir) p.set('incluir', incluir)
  const qs = p.toString()
  return fetch(`/api/catalogo${qs ? `?${qs}` : ''}`, { credentials: 'include' }).then((r) => json<Catalogo>(r))
}

export function getConflictosCatalogo(): Promise<Conflictos> {
  return fetch('/api/catalogo/conflictos', { credentials: 'include' }).then((r) => json<Conflictos>(r))
}

/**
 * Toda escritura del catálogo pasa por aquí. Lanza `Error` con el mensaje EXACTO del servidor: es
 * como el 409 de nombre repetido y el de entrada en uso —que ya vienen redactados en español y con
 * el conteo— llegan a la pantalla sin que esta tenga que reescribirlos ni adivinar la causa.
 */
async function escribirCatalogo<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(b.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const crearTipoCatalogo = (nombre: string) => escribirCatalogo<{ id: string }>('/api/catalogo/tipos', 'POST', { nombre })
export const crearMarcaCatalogo = (nombre: string) => escribirCatalogo<{ id: string }>('/api/catalogo/marcas', 'POST', { nombre })
export const crearModeloCatalogo = (input: { marcaId: string; nombre: string; tipoId: string | null }) =>
  escribirCatalogo<{ id: string }>('/api/catalogo/modelos', 'POST', input)

export const actualizarTipoCatalogo = (id: string, patch: { nombre?: string; activo?: boolean }) =>
  escribirCatalogo<{ ok: true }>(`/api/catalogo/tipos/${id}`, 'PATCH', patch)
/** La marca no se renombra: `perfilChecklist` decide el checklist de la remisión leyendo su TEXTO. */
export const actualizarMarcaCatalogo = (id: string, patch: { activo: boolean }) =>
  escribirCatalogo<{ ok: true }>(`/api/catalogo/marcas/${id}`, 'PATCH', patch)
/** Devuelve cuántos equipos declaran otro tipo, se hayan corregido o no. `sku` es el de la ficha
 *  técnica: el servidor ya lo acepta en este mismo PATCH, no hace falta una ruta aparte. */
export const actualizarModeloCatalogo = (id: string, patch: { tipoId?: string | null; activo?: boolean; corregirEquipos?: boolean; sku?: string | null }) =>
  escribirCatalogo<{ discrepan: number }>(`/api/catalogo/modelos/${id}`, 'PATCH', patch)

export const borrarEntradaCatalogo = (entidad: 'tipos' | 'marcas' | 'modelos', id: string) =>
  escribirCatalogo<{ ok: true }>(`/api/catalogo/${entidad}/${id}`, 'DELETE')

// ---- Ficha técnica del modelo ----

export function getFichaModelo(modeloId: string): Promise<FichaModelo> {
  return fetch(`/api/catalogo/modelos/${modeloId}/ficha`, { credentials: 'include' }).then((r) => json<FichaModelo>(r))
}

/** La URL con la que se pinta un fichero (`<img src>`) o se descarga. Los enlaces usan su `url`. */
export const urlDocumento = (modeloId: string, docId: string): string =>
  `/api/catalogo/modelos/${modeloId}/documentos/${docId}/contenido`

export const crearEnlaceDocumento = (modeloId: string, input: { tipo: TipoDocumento; nombre: string; url: string }) =>
  escribirCatalogo<{ id: string }>(`/api/catalogo/modelos/${modeloId}/documentos`, 'POST', input)

/** Subida multipart: NO pasa por `escribirCatalogo`, que manda JSON. */
export async function subirDocumento(modeloId: string, tipo: TipoDocumento, nombre: string, archivo: File): Promise<{ id: string }> {
  const fd = new FormData()
  fd.append('tipo', tipo)
  fd.append('nombre', nombre)
  fd.append('archivo', archivo)
  // Sin cabecera Content-Type a propósito: el navegador la genera con el boundary del multipart.
  // Ponerla a mano rompe la subida en silencio.
  const res = await fetch(`/api/catalogo/modelos/${modeloId}/documentos`, { method: 'POST', credentials: 'include', body: fd })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(b.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<{ id: string }>
}

export const borrarDocumentoModelo = (modeloId: string, docId: string) =>
  escribirCatalogo<{ ok: true }>(`/api/catalogo/modelos/${modeloId}/documentos/${docId}`, 'DELETE')

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

/** El equipo con su `modeloId`, para resolver la ficha técnica del modelo desde el panel del ticket. */
export function fetchEquipo(id: string): Promise<EquipoFull> {
  return fetch(`/api/equipos/${id}`, { credentials: 'include' }).then((r) => json<EquipoFull>(r))
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
  /** RQ-RE-17. Sin contestar viaja `undefined`, y el servidor lo guarda como `null` — sin declarar. */
  hayNovedad?: boolean
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

/**
 * Fija el orden de una clase de golpe. Es el orden con el que el técnico verá los accesorios al hacer
 * los checks de la remisión de entrada.
 */
export async function reordenarArticulosModelo(
  modeloId: string,
  body: { clase: ClaseArticulo; ids: string[] },
): Promise<void> {
  const r = await fetch(`/api/catalogo/modelos/${modeloId}/articulos/orden`, {
    method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!r.ok) await json(r)
}

/**
 * Copia los artículos de una clase de este modelo a otros. Es una COPIA, no un vínculo: cada modelo
 * diverge después. Pensado para los accesorios comunes a las variantes de una serie.
 */
export function copiarArticulosModelo(
  modeloId: string,
  body: { clase: ClaseArticulo; destinos: string[] },
): Promise<{ copiados: number; omitidos: number; porModelo: Array<{ modeloId: string; copiados: number }> }> {
  return fetch(`/api/catalogo/modelos/${modeloId}/copiar-articulos`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then((r) => json(r))
}

/** Excluye un artículo derivado de ESTE modelo, sin renunciar a su categoría. */
export async function ocultarArticuloModelo(modeloId: string, itemId: string): Promise<void> {
  const r = await fetch(`/api/catalogo/modelos/${modeloId}/articulos-ocultos`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
  })
  if (!r.ok) await json(r)
}

export async function mostrarArticuloModelo(modeloId: string, itemId: string): Promise<void> {
  const r = await fetch(`/api/catalogo/modelos/${modeloId}/articulos-ocultos/${itemId}`, {
    method: 'DELETE', credentials: 'include',
  })
  if (!r.ok) await json(r)
}

/** Una fila de `public.ov_asociaciones` tal como la devuelve el servidor (`routes/ovAsociaciones.ts`). */
export interface OvAsociacion {
  id: number
  ticket_id: string
  numero: string
  salesorder_id: string | null
  origen: string
  asociada_at: string
  asociada_por: string | null
  fecha_orden_compra: string | null
  liberada_at: string | null
  liberada_por: string | null
  motivo_liberacion: string | null
}

export interface OvCuarentena { id: string; number: string; customer_name: string | null; motivo: string }

export interface SaldoLote { lote: string; creadas: number; consumidas: number; libres: number; consumido: number }

/** Las OV de un ticket, vigentes y liberadas (`liberada_at` distingue unas de otras). */
export function listarOvAsociaciones(ticketId: string): Promise<OvAsociacion[]> {
  return fetch(`/api/tickets/${ticketId}/ov-asociaciones`, { credentials: 'include' }).then((r) => json<OvAsociacion[]>(r))
}

/**
 * Libera una asociación con su motivo. La decisión es del servidor: si responde 403, 404, 409 o 422 el
 * error sube tal cual y la pantalla lo enseña, sin repetir la comprobación en el cliente.
 */
export function liberarOvAsociacion(id: number, motivo: string): Promise<OvAsociacion> {
  return fetch(`/api/ov-asociaciones/${id}/liberar`, {
    method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motivo }),
  }).then((r) => json<OvAsociacion>(r))
}

/** Órdenes de venta cuyo número está en cuarentena (formato de subOV no reconocido). */
export function listarCuarentena(): Promise<OvCuarentena[]> {
  return fetch('/api/ov-asociaciones/cuarentena', { credentials: 'include' }).then((r) => json<OvCuarentena[]>(r))
}

/** Saldo de un lote de subOV (`OV-AAAA-NNN`): creadas, consumidas, libres y % consumido. */
export function saldoPorLote(lote: string): Promise<SaldoLote> {
  return fetch(`/api/ov-asociaciones/saldo/${encodeURIComponent(lote)}`, { credentials: 'include' }).then((r) => json<SaldoLote>(r))
}

/**
 * `json()` lanza `HTTP 422: {"error":"…"}`. Las pantallas de OV enseñan sólo el mensaje del servidor:
 * la decisión (403, 409, 422) es suya y aquí no se reescribe.
 */
export function mensajeDelServidor(e: unknown): string {
  const texto = e instanceof Error ? e.message : String(e)
  const m = /^HTTP \d+: ([\s\S]*)$/.exec(texto)
  if (!m) return texto
  try {
    const cuerpo = JSON.parse(m[1]) as { error?: unknown }
    return typeof cuerpo.error === 'string' ? cuerpo.error : texto
  } catch {
    return texto
  }
}

/*
 * Contratos (registro-contrato, lote 6; `tickets-core` RQ-TC-21/23, `zoho-sync` RQ-ZS-15). El cliente sólo pide y
 * enseña: el permiso (403), el contenido (422), la unicidad (409), la marca «de contrato» y todas las cifras del
 * informe las decide el servidor. Los errores se enseñan con `mensajeDelServidor`.
 */
type Contrato = import('@ambientalia/shared').Contrato
type InformeContrato = import('@ambientalia/shared').InformeContrato

export interface FichaContrato { contrato: Contrato; estado: InformeContrato['estado']; saldo: SaldoLote }
export interface TicketDeContrato { deContrato: boolean; contrato?: Contrato; subOV?: string }
export interface AltaContrato { clientId: string; lote: string; fechaInicio: string; fechaFin: string }

export function listarContratos(): Promise<Contrato[]> {
  return fetch('/api/contratos', { credentials: 'include' }).then((r) => json<Contrato[]>(r))
}

export function crearContrato(alta: AltaContrato): Promise<Contrato> {
  return fetch('/api/contratos', {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alta),
  }).then((r) => json<Contrato>(r))
}

export function contratoPorId(id: number): Promise<FichaContrato> {
  return fetch(`/api/contratos/${id}`, { credentials: 'include' }).then((r) => json<FichaContrato>(r))
}

export function informeDeContrato(id: number): Promise<InformeContrato> {
  return fetch(`/api/contratos/${id}/informe`, { credentials: 'include' }).then((r) => json<InformeContrato>(r))
}

export function contratoDelTicket(ticketId: string): Promise<TicketDeContrato> {
  return fetch(`/api/tickets/${encodeURIComponent(ticketId)}/contrato`, { credentials: 'include' }).then((r) => json<TicketDeContrato>(r))
}

/*
 * Prioridad del cliente, Top 5 y ajuste por ticket (prioridad-top5-cliente, F1B-07; `tickets-core` RQ-TC-27, RQ-TC-29).
 * El cliente sólo pide y enseña: el permiso (403), el estado (409) y el contenido (422) los decide el servidor
 * (`routes/prioridad.ts`) y se enseñan con `mensajeDelServidor`. «Mis tickets» llega ordenado del servidor.
 */
type PrioridadAsignable = import('@ambientalia/shared').PrioridadAsignable

export interface PrioridadDelCliente { clientId: string; top5: boolean; prioridad: string | null; actualizadoPor: string | null; actualizadoAt: string | null }
export interface ClienteTop5 extends PrioridadDelCliente { name: string }
export interface AjusteDePrioridad { de: string | null; a: string; motivo: string; ajustadoPor: string; ajustadoAt: string }
export interface PrioridadDelTicket { ticketId: string; prioridad: string | null; clientId: string | null; top5: boolean; prioridadTop5: string | null; ajustes: AjusteDePrioridad[] }

export function listarTop5(): Promise<ClienteTop5[]> {
  return fetch('/api/top5', { credentials: 'include' }).then((r) => json<ClienteTop5[]>(r))
}

export function prioridadDelCliente(clientId: string): Promise<PrioridadDelCliente> {
  return fetch(`/api/clients/${encodeURIComponent(clientId)}/prioridad`, { credentials: 'include' }).then((r) => json<PrioridadDelCliente>(r))
}

export function fijarPrioridadDelCliente(clientId: string, cuerpo: { top5: boolean; prioridad: PrioridadAsignable | null }): Promise<PrioridadDelCliente> {
  return fetch(`/api/clients/${encodeURIComponent(clientId)}/prioridad`, {
    method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
  }).then((r) => json<PrioridadDelCliente>(r))
}

export function prioridadDelTicket(ticketId: string): Promise<PrioridadDelTicket> {
  return fetch(`/api/tickets/${encodeURIComponent(ticketId)}/prioridad`, { credentials: 'include' }).then((r) => json<PrioridadDelTicket>(r))
}

export function ajustarPrioridadDelTicket(ticketId: string, cuerpo: { prioridad: string; motivo: string }): Promise<PrioridadDelTicket> {
  return fetch(`/api/tickets/${encodeURIComponent(ticketId)}/prioridad`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
  }).then((r) => json<PrioridadDelTicket>(r))
}

/** «Mis tickets»: los abiertos derivados al usuario, en el orden de la cola del taller que fija el servidor. */
export function fetchMisTickets(): Promise<Ticket[]> {
  return fetch('/api/mis-tickets', { credentials: 'include' }).then((r) => json<Ticket[]>(r))
}

/** Todos los errores del servidor (`errors[]` del 422); si no vienen, el mensaje único. No decide nada: sólo los separa para enseñarlos. */
export function erroresDelServidor(e: unknown): string[] {
  const m = /^HTTP \d+: ([\s\S]*)$/.exec(e instanceof Error ? e.message : String(e))
  if (m) {
    try {
      const cuerpo = JSON.parse(m[1]) as { errors?: unknown }
      if (Array.isArray(cuerpo.errors) && cuerpo.errors.length > 0 && cuerpo.errors.every((x) => typeof x === 'string')) return cuerpo.errors as string[]
    } catch { /* cae al mensaje único */ }
  }
  return [mensajeDelServidor(e)]
}

/** PDF del certificado de fábrica de una liberación (F1A-03, RQ-EN-11). Sólo comodidad: el servidor decide tipo, tamaño y estado. */
export interface CertificadoFabricaMeta { id: string; filename: string; size: number; transicionId: number }
export async function subirCertificadoFabrica(ticketId: string, file: File): Promise<CertificadoFabricaMeta> {
  const fd = new FormData(); fd.append('file', file)
  const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/certificado-fabrica`, { method: 'POST', credentials: 'include', body: fd })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json() as Promise<CertificadoFabricaMeta>
}
export function listarCertificadosFabrica(ticketId: string): Promise<CertificadoFabricaMeta[]> {
  return fetch(`/api/tickets/${encodeURIComponent(ticketId)}/certificado-fabrica`, { credentials: 'include' }).then((r) => json<CertificadoFabricaMeta[]>(r))
}
export const urlCertificadoFabrica = (ticketId: string, pdfId: string): string =>
  `/api/tickets/${encodeURIComponent(ticketId)}/certificado-fabrica/${encodeURIComponent(pdfId)}`

/** Alta manual de equipo y cliente desconocidos (F1B-15). Sólo transporte: lo que se exige y se rechaza lo decide el servidor. */
export interface CandidatoNit { id: string; name: string }
export interface CuerpoAltaManual {
  clienteManual?: { razonSocial: string; nit: string; contacto: string; telefono: string; correo: string; motivo: string }
  equipoManual?: { serial: string; confirmacionSerial: string; modeloId?: string; marca?: string; modeloTexto?: string; tipo?: string; motivo: string; fechaFacturaCompra?: string }
}

/** Los candidatos de Books que el servidor adjunta al 409 de P-B (el NIT ya está en Books); vacío si el error no los trae. */
export function candidatosDelError(e: unknown): CandidatoNit[] {
  const c = (e as { candidatos?: unknown } | null)?.candidatos
  return Array.isArray(c) ? (c as CandidatoNit[]) : []
}

/** Enlaza un cliente provisional con un contacto de Books (RQ-TC-32). El permiso lo impone el servidor. */
export async function enlazarClienteProvisional(provisionalId: string, contactId: string): Promise<void> {
  const res = await fetch(`/api/clientes-provisionales/${encodeURIComponent(provisionalId)}/enlace`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactId }) })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
}

/** Valida un equipo de alta manual (RQ-HV-18). El permiso lo impone el servidor. */
export async function validarEquipoManual(equipoId: string): Promise<void> {
  const res = await fetch(`/api/equipos/${encodeURIComponent(equipoId)}/validacion`, { method: 'POST', credentials: 'include' })
  if (!res.ok) { const b = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(b.error || `HTTP ${res.status}`) }
}
