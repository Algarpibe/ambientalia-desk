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
  tipoServicio: string
  clasificaciones: string
  tipoEquipo: string
  marca: string
  modelo: string
  serie: string
  prefijo: string
  ordenVenta?: string
  prioridad?: string
  subject?: string
  codigoServicio?: string
}
