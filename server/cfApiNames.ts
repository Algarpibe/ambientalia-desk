// Mapa ETIQUETA de customField (la que ve el usuario) → api-name `cf_*` que espera updateTicket.
// Extraído del volcado real de un ticket (getTicket incluye `customFields` con etiquetas y `cf`
// con api-names). Algunos pueden necesitar ajuste; se validan en la prueba de escritura real.
export const CF_API_NAMES: Record<string, string> = {
  'Orden de Venta': 'cf_orden_de_venta',
  'Fecha Orden De Venta': 'cf_fecha_orden_de_venta',
  'Fecha de Cotización': 'cf_fecha_de_cotizacion',
  'Fecha Orden de Compra': 'cf_fecha_orden_de_compra',
  'Fecha Orden de Compra Final': 'cf_fecha_orden_de_compra_final',
  'Cumple condiciones comerciales': 'cf_cumple_condiciones_comerciales',
  'Código Servicio': 'cf_codigo_servicio',
  'Fecha creación ticket': 'cf_fecha_de_ingreso',
  'Fecha Remisión Entrada': 'cf_fecha_remision_entreda',
  'Días de entrega': 'cf_dias_de_entrega',
  'Fecha Recepción de repuestos': 'cf_fecha_recepcion_de_repuestos',
  'Fecha Notificación por garantía': 'cf_fecha_notificacion_por_garantia',
  'Fecha solicitud SKU': 'cf_fecha_solicitud_sku',
  'Fecha Revisión Informe': 'cf_fecha_revision_informe',
  'Fecha Finalización ST': 'cf_fecha_finalizacion_st',
  'Equipo y/o partes listas para entrega al cliente?': 'cf_equipo_y_o_partes_listas_para_entrega_al_cliente',
  'Archivo de trazabilidad Actualizado?': 'cf_archivo_de_trazabilidad_actualizado',
  'Documentacion Almacenada en el Drive?': 'cf_documentacion_almacenada_en_el_drive',
  'H. V Actualizada?': 'cf_h_v_actualizada_en_lab_control',
  'Fecha Salida Servicio externo': 'cf_fecha_salida_servicio_externo',
  'Fecha Entrada de servicio externo': 'cf_fecha_entrada_de_servicio_externo',
  'Conformidad': 'cf_conformidad',
  'Fecha De Factura': 'cf_fecha_de_factura',
  'Fecha Remisión de Salida': 'cf_fecha_remision_de_salida',
  'Liberación del ticket sin facturar': 'cf_liberacion_del_ticket_sin_facturar',
}

export function cfApiName(label: string): string | undefined {
  return CF_API_NAMES[label]
}
