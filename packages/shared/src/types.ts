import type { PerfilChecklist } from './remision'

/** Shape consumido por el frontend (tarjeta y tablero). */
export interface Ticket {
  id: string
  number: string        // "#864"
  title: string
  company: string
  time: string          // texto ya formateado para mostrar
  status: string        // status crudo de Zoho, p.ej. "Notificación cliente"
  /** El propietario en ZOHO. Viene del sync y está vacío en todo ticket nacido en la app. */
  assignee?: {
    name: string
    avatar?: string
    initials?: string
    type?: string
  }
  /**
   * La persona de la APP a la que se derivó el trabajo, o `null` si no se ha derivado.
   *
   * Es informativa: dice de quién es el trabajo, pero NUNCA da ni quita permisos ni oculta el ticket
   * a nadie (`docs/modelo-autorizacion.md`).
   */
  derivado?: { id: string; nombre: string; cargo: string | null; initials: string } | null
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
  /**
   * Segunda línea de la tarjeta, ya formateada. De un adjunto de Zoho es el tamaño ("701.7 KB");
   * de uno del hilo generado es el TIPO ("PDF", "Carpeta"), porque de un fichero de Drive no
   * sabemos el tamaño y la línea tiene que decir algo.
   */
  size: string
  path: string
  /**
   * Enlace externo, cuando el adjunto no vive en Zoho. Los del hilo generado apuntan a Google Drive,
   * que la app no puede servir por el proxy porque no tiene credenciales de Google. Si está, el panel
   * enlaza directo; si no, sigue pasando por `/api/attachment`.
   */
  url?: string
  /**
   * El panel pinta una miniatura en vez de la ficha de fichero. Lo marca quien compone el adjunto y
   * NO se deduce del nombre: de los enlaces de Drive no se sabe qué hay al otro lado, y adivinarlo
   * por la extensión pondría un `<img>` roto en cuanto alguien suba un `.pdf` llamado `foto.jpg`.
   * Solo lo ponen las fotos de la remisión, que la app sirve ella misma y sabe que son imágenes.
   */
  isImage?: boolean
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
  /** El cliente de Books, para acotar los buscadores del detalle (las órdenes de venta, hoy). */
  clientId?: string | null
  /**
   * Instante ISO del ÚLTIMO «Escalado a Revisión», o `null` si no consta.
   *
   * Viaja con el detalle porque es lo que la pantalla propone como «Fecha Revisión Informe» dos etapas
   * más adelante, y sale de `ticket_transitions`: pedir el historial entero para sacar una fecha sería
   * traerse el relato completo del ticket cada vez que alguien abre el formulario. Instante y no día
   * porque el día hay que calcularlo en la zona de quien mira.
   */
  escaladoARevisionAt?: string | null
  /**
   * A quién se derivó el ticket la PRIMERA vez, o `null` si nunca se derivó.
   *
   * Viaja por lo mismo que `escaladoARevisionAt`: es lo que «Aprobación» propone en la casilla, y sale
   * de recorrer `ticket_transitions` — un trabajo que no puede rehacerse en el navegador sin traerse
   * la historia entera del ticket cada vez que alguien abre el formulario.
   */
  primerDerivado?: string | null
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

/**
 * Un aviso dentro de la app. Hoy solo los genera derivar un ticket.
 *
 * No es un correo: no existe canal interno todavía —lo único que sale es `sendReply` de Zoho, que
 * escribe al CLIENTE—. La tabla que los guarda es además la cola de ese correo para cuando llegue.
 */
export interface Aviso {
  id: string
  /** El ticket al que lleva el aviso, si lo hay. */
  ticketId: string | null
  texto: string
  leido: boolean
  createdAt: string | null
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
  /** Cargo y empresa del técnico: los imprime el documento de remisión. */
  cargo?: string | null
  empresa?: string | null
}

/**
 * Para qué sirve un artículo dentro de un modelo.
 *
 * Consumible y repuesto van juntos, por decisión del usuario (2026-08-10) y porque Zoho Books tampoco
 * los separa — los agrupa bajo la categoría `C&R …`. Separarlos obligaba a clasificar a mano una
 * distinción que ni el catálogo de origen hace.
 *
 * El accesorio se verifica al recibir y devolver el equipo (es el checklist «Incluye» de la remisión);
 * el consumible/repuesto se repone o se cambia durante el servicio; la **mano de obra** no es una cosa
 * que viaje con el equipo sino el trabajo que se le hace, y por eso queda fuera de ese checklist
 * (`checklistRemision.ts` filtra accesorios).
 *
 * El orden de este array es el de las secciones en la ficha técnica.
 */
export const CLASES_ARTICULO = ['accesorio', 'consumible_repuesto', 'mano_obra'] as const
export type ClaseArticulo = (typeof CLASES_ARTICULO)[number]

/** De dónde sale un artículo de la lista de un modelo. */
export type OrigenArticulo = 'categoria' | 'manual'

/**
 * Un artículo que lleva un modelo.
 *
 * La mayoría se **derivan** de las categorías de Books asignadas al modelo (`origen: 'categoria'`), y
 * por eso se actualizan solos: un artículo nuevo en `C&R AP Series` aparece en todos los AP sin que
 * nadie toque Desk. Los `manual` son los añadidos a mano — típicamente lo que no existe en Books, como
 * «Repuestos reemplazados», que es una casilla de verificación y no algo que se venda.
 */
export interface ArticuloModelo {
  /** Id en `catalogo_articulos` si es manual; el `item_id` de Books si viene de una categoría. */
  id: string
  clase: ClaseArticulo
  origen: OrigenArticulo
  /** `books.items.item_id`. Ausente solo en los manuales de texto libre. */
  itemId?: string
  sku?: string
  nombre: string
  /** La categoría de Books de la que salió. Solo en los derivados. */
  categoria?: string
  orden: number
  activo: boolean
}

/** Una categoría de Books asignada a un modelo: la regla que deriva su lista de artículos. */
export interface CategoriaModelo {
  id: string
  clase: ClaseArticulo
  categoria: string
  /** Cuántos artículos activos de Books tiene hoy esa categoría. */
  articulos: number
}

/**
 * Un artículo del catálogo de Zoho Books, reducido a lo que la app enseña al elegirlo.
 *
 * Vive en `books.items`, replicada del hub. La `categoria` viaja porque es la que dice a qué familia
 * de equipos pertenece el artículo (`C&R EDM 180`, `Opcional AP Series`…) y con eso se filtra la lista.
 */
export interface ArticuloLite {
  /** `item_id` de Books. */
  id: string
  sku: string
  nombre: string
  categoria?: string
}

export interface ClientLite {
  id: string
  name: string
  nit?: string
  email?: string
  companyName?: string
  /** Datos de facturación; los imprime el documento de remisión. Vienen del detalle de Books. */
  direccion?: string
  ciudad?: string
  telefono?: string
  personaContacto?: string
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
  /**
   * FK al cliente de Books. Ausente —no vacía— en los equipos que el backfill no pudo casar: el
   * formulario necesita distinguir «no se sabe de quién es» de «es del cliente X» para avisar.
   *
   * Subió de `EquipoFull` a `EquipoLite` en F1B-01. Sin esto, resolver el cliente desde el serial
   * sólo podía hacerse POR NOMBRE, que es el apaño que el servidor abandonó el 2026-08-09
   * (`apps/desk/server/db/equipos.ts:45-53`). Es además lo que deja al serial abrir las órdenes de
   * venta activas del cliente, la mitad de `R08.1.md:1048` que faltaba.
   */
  clientId?: string
  /** FK al catálogo maestro (`catalogo_modelos`); ausente en equipos que la siembra no pudo casar. */
  modeloId?: string
}

export interface EquipoFull extends EquipoLite {
  active: boolean
}

export interface CatalogoTipo { id: string; nombre: string; activo: boolean }
export interface CatalogoMarca { id: string; nombre: string; activo: boolean }
export interface CatalogoModelo {
  id: string
  marcaId: string
  nombre: string
  tipoId: string | null
  /** Denormalizado para que la pantalla no tenga que cruzar listas. */
  tipoNombre: string | null
  /** La siembra lo enciende cuando el inventario daba más de un tipo para este modelo. */
  revisar: boolean
  activo: boolean
  /** Referencia al artículo de Zoho Books que ES este equipo. Puede no estar puesto. */
  sku: string | null
  /**
   * Nombre y categoría del artículo de Books con ese SKU. Se resuelven AL LEER y no se guardan: son
   * de Books, y duplicarlos aquí abriría una divergencia sin dueño. `null` si no hay SKU o si no casa
   * con ningún artículo — que no es un error, solo un dato que falta.
   */
  articuloNombre: string | null
  articuloCategoria: string | null
  /**
   * Id del documento `tipo='foto'` de la ficha, para pintar la miniatura. `null` si el modelo no tiene
   * foto. Se reutiliza la foto de referencia que ya guarda la ficha en vez de traer la imagen de Books,
   * que exigiría descargar y almacenar ficheros de Zoho.
   */
  fotoId: string | null
}
export interface Catalogo { tipos: CatalogoTipo[]; marcas: CatalogoMarca[]; modelos: CatalogoModelo[] }

/** Los tipos de documento que admite la ficha. Lista blanca en el código y no un CHECK del esquema:
 *  añadir uno nuevo no debería exigir una migración. */
export const TIPOS_DOCUMENTO = ['foto', 'manual', 'instructivo', 'guia'] as const
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

/**
 * Un documento de la ficha. **Nunca lleva el `content_b64`**: el fichero se pide aparte por el proxy
 * (`/api/catalogo/modelos/:id/documentos/:docId/contenido`), así una ficha con diez documentos no
 * arrastra diez ficheros cada vez que alguien la abre.
 *
 * `url` con valor ⇒ es un enlace. `url` nulo ⇒ es un fichero subido. Nunca las dos cosas.
 */
export interface DocumentoModelo {
  id: string
  tipo: TipoDocumento
  nombre: string
  url: string | null
  contentType: string | null
  size: number | null
}

/** La foto va SEPARADA de `documentos` aunque en la tabla sea una fila más con `tipo='foto'`: la
 *  pantalla la trata distinto, y separarla aquí ahorra que cada consumidor la filtre por su cuenta. */
export interface FichaModelo {
  modeloId: string
  sku: string | null
  /**
   * El artículo de Books que lleva ese SKU, o `null` si ninguno lo lleva (y también cuando no hay SKU).
   * Lo resuelve el servidor para que la comparación exacta viva en un solo sitio; la pantalla solo
   * decide si lo enseña o avisa de que el código no corresponde a ningún artículo.
   */
  skuArticulo: ArticuloLite | null
  foto: DocumentoModelo | null
  documentos: DocumentoModelo[]
}

/** Un modelo que el inventario declara con más de un tipo, con el reparto real que lo demuestra. */
export interface ConflictoModelo {
  modeloId: string
  marca: string
  modelo: string
  tipoActual: string | null
  reparto: Array<{ tipo: string; equipos: number }>
}
export interface Conflictos { modelos: ConflictoModelo[]; equiposSinModelo: number }

export interface HistorialTransition {
  transitionName: string | null
  fromStatus: string | null
  toStatus: string | null
  area: string | null
  performedBy: string | null
  performedAt: string | null
  /**
   * Lo que se escribió al ejecutar la etapa, en TEXTO plano y recortado.
   *
   * Solo lo traen las etapas reconstruidas desde la historia de Zoho: las de Desk guardan el
   * comentario aparte, como conversación propia del ticket. Texto y no HTML a propósito — la tarjeta
   * lo pinta como texto y React lo escapa, así que no hay nada que sanear.
   */
  comentario?: string
  /** Nombres de los ficheros que acompañaban a ese comentario (informes, protocolos). */
  adjuntos?: string[]
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
  /**
   * Todo lo que le pasó al ticket, en una sola línea de tiempo y por orden.
   *
   * Etapas y remisiones van MEZCLADAS y al mismo nivel a propósito: para quien lee una hoja de vida,
   * recibir el equipo es un paso del servicio igual que diagnosticarlo. Enseñar las remisiones en
   * tarjetas aparte las hacía parecer otra cosa, de otro rango.
   */
  pasos: PasoHojaDeVida[]
}

/** Un paso de la vida de un ticket: una etapa del flujo o una remisión. */
export type PasoHojaDeVida =
  | { clase: 'etapa'; etapa: HistorialTransition }
  | { clase: 'remision'; remision: HistorialRemision }
/** Una remisión tal como la cuenta la hoja de vida del equipo. */
export interface HistorialRemision {
  id: string
  /**
   * El día del SERVICIO, que es el que le importa al técnico. NO es el instante de registro: por eso
   * la cronología se ORDENA por otro campo —`created_at`, que el histórico ya trae corregido a su
   * día de servicio— y esto solo se muestra.
   */
  fecha: string | null
  /** 'entrada' | 'salida'. La rama de salida está en el roadmap, así que no se da por supuesto. */
  tipo: string
  tipoServicio: string | null
  tecnico: string | null
  observaciones: string | null
  incluye: string[]
  empresa: string | null
  /** 'app' | 'historico'. Una histórica no pasó por n8n: no tiene enlaces ni fotos. */
  origen: string
  estado: string
  ticketId: string | null
  /** Ya con almohadilla ("#1000042"), o null: 56 de las históricas no casaron con ningún ticket. */
  ticketNumero: string | null
  /**
   * Que la remisión se colgó de un ticket ADIVINANDO por fecha, porque no consta de cuál es.
   *
   * Pasa con las históricas cuyo número de ticket de Zoho ya no existe en la base: se enlazaron al
   * equipo por el serial y nada más. Si el equipo tuvo dos servicios seguidos, la suposición puede ser
   * la equivocada.
   *
   * Hoy NO se pinta —el usuario pidió quitar el aviso de la hoja de vida—, pero se sigue calculando y
   * viaja con la remisión: es lo único que distingue una asociación cierta de una supuesta, y
   * recalcularla más tarde exigiría rehacer el emparejamiento entero.
   */
  asociadaPorFecha?: boolean
  adjuntos: Attachment[]
}

/**
 * Una parada de la cronología del equipo. Es una unión y no dos listas porque la hoja de vida es UNA
 * línea de tiempo: el técnico que recibe un equipo quiere leer en orden lo que le ha pasado, no
 * cruzar dos inventarios por fecha.
 */
export type EntradaHojaDeVida =
  | { clase: 'ticket'; ticket: HistorialTicket }
  | { clase: 'remision'; remision: HistorialRemision }

export interface EquipoHistorial {
  equipo: EquipoFull
  /** Más reciente primero, ya mezclada y ordenada en el servidor. */
  cronologia: EntradaHojaDeVida[]
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

export interface RemisionFoto { id: string; filename: string; contentType: string; size: number }

/** Un paso del flujo de n8n que no salió bien, ya redactado para enseñárselo al técnico. */
export interface RemisionPasoFallido { paso: string; mensaje?: string }

/**
 * Detalle que `Code Resumen Entrada` del flujo n8n adjunta al callback. Todos los campos son
 * opcionales a propósito: las remisiones anteriores a este cambio guardaron otra forma, y una
 * remisión vieja no debe romper la pantalla que la muestra.
 */
export interface RemisionResultado {
  carpetaId?: string | null
  carpetaUrl?: string | null
  docId?: string | null
  pdfId?: string | null
  /**
   * Id en Drive de la etiqueta `.dymo`. El callback lo manda desde el 2026-08-05: las remisiones
   * anteriores no lo tienen, y las 149 históricas no tienen `resultado` en absoluto.
   */
  dymoId?: string | null
  fotos?: { recibidas: number; subidas: number }
  avisos?: RemisionPasoFallido[]
  fallos?: RemisionPasoFallido[]
  ejecucionId?: string | null
}

/**
 * Una tabla del barrido que borra un ticket.
 *
 * Salen SIEMPRE las diez, con `borradas: 0` incluidas: el cero es la prueba de que se miró esa tabla.
 * Sin claves foráneas, lo que no se barre queda huérfano en silencio, así que la cobertura es el dato.
 * `tabla` es la clave estable (tests y registro); `etiqueta` es lo que lee la persona.
 */
export interface FilaBorrada { tabla: string; etiqueta: string; borradas: number }

/**
 * Los punteros a Google Drive de UNA remisión que va a desaparecer.
 *
 * La app **no puede borrar en Drive** —no tiene credenciales de Google— así que estos documentos
 * sobreviven al ticket y esta lista es lo único que permite encontrarlos después. Ya se perdieron
 * cuatro carpetas por no guardarla (`debt.md:438`).
 */
export interface RastroDrive {
  remisionId: string
  /** «Remisión de entrada del 2026-03-04»: legible sin cruzar nada con la base. */
  etiqueta: string
  carpetaUrl: string | null
  documentoUrl: string | null
  pdfUrl: string | null
  dymoUrl: string | null
}

/**
 * Lo que se va al borrar un ticket. Es la vista previa Y el recibo: la misma estructura, con los
 * mismos números, la devuelve el simulacro y la ejecución real — lo único que cambia es si escribe.
 */
export interface ResumenEliminacion {
  ticket: { id: string; numero: number; asunto: string | null; estado: string }
  /** Las diez tablas en ORDEN DE BORRADO, `tickets` la última. */
  filas: FilaBorrada[]
  /** Suma de `filas`, el propio ticket incluido. */
  total: number
  /** Remisiones con al menos un puntero a Drive. Vacío = no hay nada que rescatar. */
  drive: RastroDrive[]
  /** Remisiones sin ningún puntero (las históricas, con `resultado` NULL). */
  remisionesSinRastro: number
  /**
   * Filas de `activities` que quedarían apuntando al ticket muerto. No se borran nunca: están
   * replicadas del hub y tocarlas diverge la réplica. Con el guardia del prefijo `app-` esto es 0
   * siempre —las actividades solo existen para tickets de Zoho—, y verlo en pantalla lo convierte en
   * un hecho comprobable en vez de una suposición.
   */
  actividadesQueQuedan: number
  dryRun: boolean
}

/**
 * Remisión de entrada registrada en la app. `estado` refleja el desenlace del flujo n8n:
 * `pendiente` mientras no ha contestado, y `ok_con_avisos` cuando la remisión se generó pero falló
 * algún aviso (correo o Telegram) — eso cuenta como creada, no como fallo.
 *
 * `ticketId` es NULL-able porque el histórico importado de la hoja de Google trae remisiones que no
 * casan con ningún ticket de Zoho — un estado legítimo, no un dato que falta. `empresa` y
 * `personaContacto` llegan como texto libre del histórico; `origen` distingue lo creado en la app
 * (`app`) de lo importado de la hoja (`historico`), porque una remisión histórica no tiene fotos ni
 * carpeta de Drive y la pantalla debe poder tratarla distinto.
 *
 * `anuladaAt` es NULL mientras la remisión está vigente. Anular es reversible A PROPÓSITO: el
 * documento y el PDF pueden ya existir en Drive y haberse mandado a un cliente, así que se marca en
 * vez de borrarse, y `anuladaPor` deja constancia de quién lo hizo.
 */
export interface Remision {
  id: string
  ticketId: string | null
  tipo: string
  fecha: string
  tipoServicio: string | null
  perfil: string | null
  equipoId: string | null
  serial: string | null
  incluye: string[]
  observaciones: string | null
  creadoPor: string | null
  estado: 'pendiente' | 'ok' | 'ok_con_avisos' | 'error'
  resultado: RemisionResultado | null
  createdAt: string
  empresa: string | null
  personaContacto: string | null
  origen: string
  anuladaAt: string | null
  anuladaPor: string | null
}

/** Datos con los que el formulario de remisión de entrada llega prellenado desde el ticket. */
export interface RemisionNueva {
  ticketId: string
  ticketNumber: string
  cliente: string | null
  /** El cliente de Books, para acotar el buscador de órdenes de venta al del ticket. */
  clientId: string | null
  equipo: { id: string | null; serial: string | null; marca: string | null; modelo: string | null; tipo: string | null }
  tipoServicio: string | null
  /**
   * La orden de venta que el ticket ya tiene, o null. Si la trae, el formulario la enseña en gris; si
   * no, ofrece buscarla —opcional, porque cuando el equipo entra la venta puede no existir todavía—.
   */
  ordenVenta: string | null
  /**
   * Perfil resuelto con `perfilChecklist(marca, modelo)`. Desde la fase 2 solo decide el checklist
   * cuando el ticket NO tiene equipo enlazado; con equipo manda la lista del modelo. Sigue viajando
   * porque la remisión lo guarda como parte del documento.
   */
  perfil: PerfilChecklist
  /** Ítems del checklist "Incluye". Vacío es legítimo, pero significa cosas distintas según `origenChecklist`. */
  incluye: string[]
  /**
   * De dónde salió `incluye`: de la lista de accesorios del **modelo** del equipo, o del **perfil** de
   * siempre cuando el ticket no tiene equipo enlazado. La pantalla lo necesita para redactar el vacío:
   * «este modelo aún no tiene lista» empuja a completarla, «no lleva accesorios» afirma algo que nadie
   * ha comprobado.
   */
  origenChecklist: 'modelo' | 'perfil'
  /**
   * Si el catálogo de checklists llegó a sembrarse. Solo tiene sentido con `origenChecklist: 'perfil'`:
   * ahí distingue un perfil que de verdad no tiene lista (Kunak) de la tabla aún vacía, que dejan
   * `incluye` vacío por igual.
   */
  catalogoCargado: boolean
}

/**
 * Fila de la vista tabular de remisiones (sección "Remisiones" de la cabecera): la que tenía la
 * hoja de Google, ahora con históricas y de la app juntas. `marca`/`modelo` no viven en
 * `remisiones` —el importador solo los usó para calcular `perfil`— así que salen de un `LEFT JOIN`
 * a `equipos`; `ticketNumero` de un `LEFT JOIN` a `tickets`. Ambos son NULL-able: una remisión
 * puede no tener equipo enlazado, y 59 históricas no tienen ticket.
 *
 * `anuladaAt`/`anuladaPor` solo llegan pobladas cuando el listado se pidió con las anuladas
 * incluidas (por defecto se quedan fuera, ver `listRemisionesListado`).
 */
export interface RemisionListado {
  id: string
  fecha: string
  /**
   * Cuándo se creó la fila. Es la ÚNICA hora que existe: `fecha` es un `date` sin hora. Solo
   * significa "cuándo se hizo la remisión" en las de la app; en una histórica es el instante de la
   * importación, así que la pantalla no la enseña ahí.
   */
  createdAt: string
  tecnico: string | null
  empresa: string | null
  personaContacto: string | null
  marca: string | null
  modelo: string | null
  serial: string | null
  incluye: string[]
  tipoServicio: string | null
  observaciones: string | null
  ticketId: string | null
  /** Con el `#` ya puesto, igual que `ActivityListItem.ticketNumber`. */
  ticketNumero: string | null
  estado: 'pendiente' | 'ok' | 'ok_con_avisos' | 'error'
  origen: string
  anuladaAt: string | null
  anuladaPor: string | null
}
