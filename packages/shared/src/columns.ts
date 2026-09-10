import type { Column } from './types'
import { STATUS_OV_ASIGNADA, STATUS_REMISION_CREADA, STATUS_TICKET_CREADO } from './transitions'

// Columnas del tablero = estados del Blueprint de Servicio Técnico, en orden de flujo.
// Cada estado del Blueprint tiene su columna, para que un ticket caiga exactamente en su estado.
// 'Finalizado' (cierre) no tiene columna propia: cae en la columna de seguridad 'Otros' cuando
// aparece (p. ej. en la vista 'Todos', que sí trae cerrados).
// La última columna 'Otros' es una red de seguridad: recoge cualquier estado sin columna propia
// para que ningún ticket desaparezca del tablero. El tablero la oculta si está vacía.
export const COLUMNS: Column[] = [
  // Las dos primeras son la MISMA fase con dos nombres: 'OV asignada' es como la llama Zoho y llega
  // así en todo lo que sincroniza; 'Ticket creado' es como nacen los tickets de la app. Conviven a
  // propósito y no se fusionan en una columna para que se vea de dónde viene cada ticket.
  { id: 'ov_asignada', label: 'OV asignada', statuses: [STATUS_OV_ASIGNADA] },
  { id: 'ticket_creado', label: 'Ticket creado', statuses: [STATUS_TICKET_CREADO] },
  { id: 'remision_creada', label: 'Remisión creada', statuses: [STATUS_REMISION_CREADA] },
  { id: 'ingresado', label: 'Ingresado', statuses: ['Ingresado'] },
  { id: 'revision', label: 'Rev./Diagnóstico', statuses: ['Rev./Diagnostico'] },
  { id: 'notificado', label: 'Notificado', statuses: ['Notificado'] },
  { id: 'proceso', label: 'En Proceso', statuses: ['En Proceso'] },
  { id: 'solicitado', label: 'Solicitado', statuses: ['Solicitado'] },
  { id: 'espera_repuestos', label: 'En Espera de Repuestos', statuses: ['En Espera de Repuestos'] },
  { id: 'espera_sku', label: 'En espera de SKU inventario', statuses: ['En espera de SKU inventario'] },
  { id: 'notif_compras', label: 'Notificación a Compras', statuses: ['Notificación a Compras'] },
  { id: 'continuacion', label: 'Continuación del proceso', statuses: ['Continuación del proceso'] },
  { id: 'servicio_externo', label: 'Servicio externo', statuses: ['Servicio externo'] },
  { id: 'pendiente', label: 'Pendiente', statuses: ['Pendiente'] },
  { id: 'notif_cliente', label: 'Notificación cliente', statuses: ['Notificación cliente'] },
  { id: 'notif_comercial', label: 'Notificación Comercial', statuses: ['Notificación Comercial'] },
  { id: 'comercial', label: 'Liberación Comercial', statuses: ['Liberación Comercial'] },
  { id: 'por_facturar', label: 'Por Facturar', statuses: ['Por Facturar'] },
  { id: 'entregar_sin_facturar', label: 'Por Entregar / Sin facturar', statuses: ['Por Entregar / Sin facturar'] },
  { id: 'por_entregar', label: 'Por Entregar', statuses: ['Por Entregar'] },
  { id: 'otros', label: 'Otros', statuses: [] },
]

/** Id de la columna de seguridad que recoge estados sin columna propia. */
export const FALLBACK_COLUMN_ID = 'otros'

const STATUS_TO_COLUMN: Record<string, string> = Object.fromEntries(
  COLUMNS.flatMap((c) => c.statuses.map((s) => [s, c.id])),
)

/** Devuelve el id de columna para un status del Blueprint; 'otros' si no tiene columna propia. */
export function columnForStatus(status: string): string {
  return STATUS_TO_COLUMN[status] ?? FALLBACK_COLUMN_ID
}
