/** Shape consumido por el frontend (tarjeta y tablero). */
export interface Ticket {
  id: string
  number: string        // "#864"
  title: string
  company: string
  time: string          // texto ya formateado para mostrar
  status: string        // status crudo de Zoho, p.ej. "Notificación cliente"
  assignee?: {
    name: string
    avatar?: string
    initials?: string
    type?: string
  }
  urgent?: boolean
  messages?: number
  description?: string
  priority?: string | null
  statusType?: string | null
  dueDate?: string | null
  createdAt?: string | null
  channel?: string | null
  diasEntrega?: string | null
  contactName?: string | null
  contactId?: string | null
  accountId?: string | null
  read?: boolean
}

/** Adjunto de una conversación. `path` se usa con el proxy /api/attachment. */
export interface Attachment {
  name: string
  size: string   // ya formateado, p.ej. "701.7 KB"
  path: string
}

/** Un mensaje del hilo de conversación en el detalle. */
export interface Message {
  id: string
  author: string
  type: 'Público' | 'Privado'
  time: string
  content: string
  isHtml?: boolean
  attachments?: Attachment[]
}

/** Definición de una columna del tablero Kanban. */
export interface Column {
  id: string
  label: string
  statuses: string[]    // status de Zoho que caen en esta columna
}

/** Subconjunto del ticket crudo de Zoho que usamos. */
export interface ZohoTicketRaw {
  id: string
  ticketNumber: string
  subject: string
  status: string
  statusType: string    // "Open" | "Closed" | "On Hold"
  priority?: string | null
  createdTime: string
  commentCount?: string
  threadCount?: string
  contactId?: string | null
  // OJO: el endpoint de LISTA de Zoho devuelve accountId=null; solo el de detalle lo trae.
  // Por eso el sync resuelve la empresa vía contactId → contacto.accountId → cuenta.
  accountId?: string | null
  // Nombre de la empresa/cuenta. Zoho no lo trae en el ticket; el sync lo inyecta.
  accountName?: string | null
  contact?: {
    firstName?: string | null
    lastName?: string | null
    accountName?: string | null
    email?: string | null
    phone?: string | null
  } | null
  assignee?: {
    firstName?: string | null
    lastName?: string | null
    photoURL?: string | null
  } | null
  // Campos extra presentes solo en el endpoint de DETALLE (getTicket):
  email?: string | null
  phone?: string | null
  channel?: string | null
  classification?: string | null
  onholdTime?: string | null
  customFields?: Record<string, string | null>
}

/** Detalle completo del ticket para el panel de propiedades. */
export interface TicketDetail extends Ticket {
  contactName?: string
  email?: string
  phone?: string
  ownerName?: string
  onholdSince?: string
  classification?: string
  priority?: string
  channel?: string
  equipoId?: string | null
  customFields: Record<string, string | null>
}

/** Subconjunto de un item de /conversations. */
export interface ZohoConversationRaw {
  id: string
  type?: string         // "thread" | "comment"
  content?: string | null
  summary?: string | null
  isPublic?: boolean | string
  visibility?: string   // "public" | "private"
  commenterName?: string | null
  authorName?: string | null
  author?: { name?: string | null } | null
  commenter?: { name?: string | null } | null
  contentType?: string | null   // "html" | "text/html" | "plainText"
  attachments?: Array<{ name?: string | null; size?: string | number | null; href?: string | null }>
  commentedTime?: string | null
  createdTime?: string | null
}

export interface Account {
  id: string
  name: string
  nit?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
}

export interface Contact {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  accountId?: string | null
}

export interface Agent {
  id: string
  name: string
  email?: string | null
}

export interface UserPublic {
  id: string
  email: string
  name: string
  isAdmin: boolean
  active: boolean
  roleId?: string | null
  roleName?: string | null
  areas: string[]
}

export interface ClientLite {
  id: string
  name: string
  nit?: string
  email?: string
  companyName?: string
}

export interface SalesOrderLite {
  id: string
  number: string
  clientId?: string
  customerName?: string
  date?: string
  total?: number
  status?: string
  ticketNumber?: string
  potentialName?: string
}

export interface CreateTicketPayload {
  salesOrderId?: string
  clientId?: string
  equipoId: string
  tipoServicio: string
  clasificaciones: string
  prefijo: string
  ordenVenta?: string
  prioridad?: string
  subject?: string
  codigoServicio?: string
}

export interface EquipoLite {
  id: string
  serial: string
  marca?: string
  modelo?: string
  tipo?: string
  clienteNombre?: string
}

export interface EquipoFull extends EquipoLite {
  active: boolean
  clientId?: string
}

export interface HistorialTransition {
  transitionName: string | null
  fromStatus: string | null
  toStatus: string | null
  area: string | null
  performedBy: string | null
  performedAt: string | null
}
export interface HistorialTicket {
  id: string
  number: string
  subject: string
  status: string
  statusType?: string | null
  createdAt?: string | null
  tecnico?: string | null
  codigoServicio?: string | null
  tipoServicio?: string | null
  transitions: HistorialTransition[]
}
export interface EquipoHistorial {
  equipo: EquipoFull
  tickets: HistorialTicket[]
}
export interface AnalisisPunto { label: string; value: number }
export interface AnalisisMes { mes: string; creados: number; finalizados: number }
export interface Analisis {
  activos: number
  creados: number
  finalizados: number
  tiempoPromedioDias: number | null
  cumplimientoPct: number | null
  porEstado: AnalisisPunto[]
  porTecnico: AnalisisPunto[]
  porCliente: AnalisisPunto[]
  porMarca: AnalisisPunto[]
  porTipoServicio: AnalisisPunto[]
  porClasificacion: AnalisisPunto[]
  gestionPorEstado: AnalisisPunto[]
  tendencia: AnalisisMes[]
}
export interface AnalisisRow {
  status: string
  statusType: string | null
  createdAt: string | null
  finalizadoAt: string | null
  diasEntrega: number | null
  marca: string | null
  cliente: string | null
  tecnico: string | null
  tipoServicio: string | null
  clasificaciones: string | null
}

export interface Activity {
  id: string
  ticketId: string | null
  subject: string
  status: string
  statusType: string | null
  priority: string | null
  dueDate: string | null
  createdAt: string | null
  completedAt: string | null
  owner: string | null
}

export interface ResolutionAttachment { id: string; filename: string; contentType: string; size: number }
export interface Resolution { html: string | null; updatedAt: string | null; updatedBy: string | null; attachments: ResolutionAttachment[] }

export interface HistoryDetail { label: string; value: string; html?: boolean }
export interface HistoryEvent { eventName: string; time: string | null; actor: string; title: string; details: HistoryDetail[] }

export interface ContactLite { id: string; name: string; company: string | null; companyId: string | null; email: string | null; phone: string | null }
export interface AccountLite { id: string; name: string; nit: string | null; email: string | null; phone: string | null; city: string | null }

export interface TicketLite { id: string; number: string; subject: string; status: string; statusType: string | null; channel: string | null; createdAt: string | null; closedAt: string | null; dueDate: string | null }
export interface ContactDetail { id: string; name: string; email: string | null; phone: string | null; mobile: string | null; company: string | null; companyId: string | null; owner: string | null; createdAt: string | null; tickets: TicketLite[] }
export interface AccountDetail { id: string; name: string; nit: string | null; email: string | null; phone: string | null; city: string | null; address: string | null; website: string | null; owner: string | null; createdAt: string | null; tickets: TicketLite[]; contacts: ContactLite[] }

export interface ActivityListItem { id: string; subject: string; status: string; statusType: string | null; priority: string | null; dueDate: string | null; owner: string | null; ticketId: string | null; ticketNumber: string | null }
