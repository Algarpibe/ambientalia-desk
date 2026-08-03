// Tipos de fila de Postgres (esquema híbrido) + mapa columna↔etiqueta de Zoho.

export interface AccountRow {
  id: string; name: string; nit: string | null; email: string | null
  phone: string | null; website: string | null; city: string | null
  address: string | null; industry: string | null
  source: string; managed_by_app: boolean; raw: unknown
}

export interface ContactRow {
  id: string; first_name: string | null; last_name: string | null
  email: string | null; phone: string | null; mobile: string | null
  account_id: string | null; modified_time: string | null; source: string; managed_by_app: boolean; raw: unknown
}

export interface AgentRow {
  id: string; name: string | null; email: string | null; role: string | null
  source: string; raw: unknown
}

export interface TicketRow {
  id: string; number: number; subject: string | null; status: string
  status_type: string | null; priority: string | null; classification: string | null
  channel: string | null; description: string | null
  contact_id: string | null; account_id: string | null; assignee_id: string | null
  created_time: string | null; modified_time: string | null; closed_time: string | null
  onhold_time: string | null; due_date: string | null
  codigo_servicio: string | null; tipo_servicio: string | null; equipo: string | null
  marca: string | null; modelo: string | null; serial: string | null; codigo_interno: string | null
  encargado: string | null; correo_encargado: string | null; nit: string | null; ciudad: string | null
  direccion: string | null; telefono: string | null; orden_venta: string | null; conformidad: string | null
  dias_entrega: number | null; cumple_condiciones_comerciales: boolean | null
  fecha_creacion_ticket: string | null; fecha_remision_entrada: string | null
  fecha_revision_informe: string | null; fecha_cotizacion: string | null
  fecha_orden_compra: string | null; fecha_orden_venta: string | null
  fecha_recepcion_repuestos: string | null; fecha_finalizacion_st: string | null
  fecha_factura: string | null; fecha_remision_salida: string | null
  fecha_salida_servicio_externo: string | null; fecha_entrada_servicio_externo: string | null
  fecha_notificacion_garantia: string | null; fecha_solicitud_sku: string | null
  fecha_orden_compra_final: string | null; fecha_orden_venta_final: string | null
  equipo_partes_listas: boolean | null; archivo_trazabilidad_actualizado: boolean | null
  doc_almacenada_drive: boolean | null; hv_actualizada: boolean | null
  liberacion_sin_facturar: boolean | null; servicio_in_situ: boolean | null
  custom_fields: Record<string, string | null>; managed_by_app: boolean; source: string; raw: unknown
  // Columnas añadidas después por ALTER (subsistemas C/E y resolución). Son OPCIONALES porque las
  // escribe la app, no el sync: `ticketRowFromZoho` construye filas sin ellas, mientras que un
  // `SELECT *` sí las trae.
  client_id?: string | null; salesorder_id?: string | null; equipo_id?: string | null
  resolution_html?: string | null; resolution_at?: string | null; resolution_by?: string | null
}

export interface ConversationRow {
  id: string; ticket_id: string; kind: string; author_name: string | null
  author_type: string | null; is_public: boolean | null; content: string | null
  content_type: string | null; commented_time: string | null; source: string; raw: unknown
}

export interface AttachmentRow {
  id: string; conversation_id: string | null; ticket_id: string
  name: string | null; size: number | null; content_type: string | null
  zoho_href: string | null; storage_path: string | null; raw: unknown
}

export interface ActivityRow {
  id: string
  ticket_id: string | null
  subject: string | null
  status: string | null
  status_type: string | null
  priority: string | null
  due_date: string | null
  created_time: string | null
  modified_time: string | null
  completed_time: string | null
  owner_id: string | null
  owner_name: string | null
  raw: unknown
}

/** Columna tipada ↔ etiqueta de customField de Zoho (para parseo y para reconstruir la UI). */
export const PROMOTED_COLUMNS: Array<{ col: keyof TicketRow; label: string; kind: 'text' | 'date' | 'bool' | 'int' }> = [
  { col: 'codigo_servicio', label: 'Código Servicio', kind: 'text' },
  { col: 'tipo_servicio', label: 'Tipo de Servicio', kind: 'text' },
  { col: 'equipo', label: 'Equipo', kind: 'text' },
  { col: 'marca', label: 'Marca', kind: 'text' },
  { col: 'modelo', label: 'Modelo de equipo', kind: 'text' },
  { col: 'serial', label: 'Serial', kind: 'text' },
  { col: 'codigo_interno', label: 'Código Interno', kind: 'text' },
  { col: 'encargado', label: 'Encargado', kind: 'text' },
  { col: 'correo_encargado', label: 'Correo Encargado', kind: 'text' },
  { col: 'nit', label: 'NIT.', kind: 'text' },
  { col: 'ciudad', label: 'Ciudad', kind: 'text' },
  { col: 'direccion', label: 'Dirección', kind: 'text' },
  { col: 'telefono', label: 'Número de teléfono', kind: 'text' },
  { col: 'orden_venta', label: 'Orden de Venta', kind: 'text' },
  { col: 'conformidad', label: 'Conformidad', kind: 'text' },
  { col: 'dias_entrega', label: 'Días de entrega', kind: 'int' },
  { col: 'cumple_condiciones_comerciales', label: 'Cumple condiciones comerciales', kind: 'bool' },
  { col: 'fecha_creacion_ticket', label: 'Fecha creación ticket', kind: 'date' },
  { col: 'fecha_remision_entrada', label: 'Fecha Remisión Entrada', kind: 'date' },
  { col: 'fecha_revision_informe', label: 'Fecha Revisión Informe', kind: 'date' },
  { col: 'fecha_cotizacion', label: 'Fecha de Cotización', kind: 'date' },
  { col: 'fecha_orden_compra', label: 'Fecha Orden de Compra', kind: 'date' },
  { col: 'fecha_orden_venta', label: 'Fecha Orden De Venta', kind: 'date' },
  { col: 'fecha_recepcion_repuestos', label: 'Fecha Recepción de repuestos', kind: 'date' },
  { col: 'fecha_finalizacion_st', label: 'Fecha Finalización ST', kind: 'date' },
  { col: 'fecha_factura', label: 'Fecha De Factura', kind: 'date' },
  { col: 'fecha_remision_salida', label: 'Fecha Remisión de Salida', kind: 'date' },
  { col: 'fecha_salida_servicio_externo', label: 'Fecha Salida Servicio externo', kind: 'date' },
  { col: 'fecha_entrada_servicio_externo', label: 'Fecha Entrada de servicio externo', kind: 'date' },
  { col: 'fecha_notificacion_garantia', label: 'Fecha Notificación por garantía', kind: 'date' },
  { col: 'fecha_solicitud_sku', label: 'Fecha solicitud SKU', kind: 'date' },
  { col: 'fecha_orden_compra_final', label: 'Fecha Orden de Compra Final', kind: 'date' },
  { col: 'fecha_orden_venta_final', label: 'Fecha Orden de Venta Final', kind: 'date' },
  { col: 'equipo_partes_listas', label: 'Equipo y/o partes listas para entrega al cliente?', kind: 'bool' },
  { col: 'archivo_trazabilidad_actualizado', label: 'Archivo de trazabilidad Actualizado?', kind: 'bool' },
  { col: 'doc_almacenada_drive', label: 'Documentacion Almacenada en el Drive?', kind: 'bool' },
  { col: 'hv_actualizada', label: 'H. V Actualizada?', kind: 'bool' },
  { col: 'liberacion_sin_facturar', label: 'Liberación del ticket sin facturar', kind: 'bool' },
  { col: 'servicio_in_situ', label: 'Servicio ejecutado in Situ!', kind: 'bool' },
]
