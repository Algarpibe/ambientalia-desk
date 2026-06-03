import type { Column } from './types'

// Estados REALES del portal Zoho Desk de Ambientalia (modo de estado del tablero nativo).
// Orden = el del tablero de Zoho. `statuses` lleva el string EXACTO que devuelve Zoho.
// Los marcados "(sin tickets ahora)" existen en Zoho pero están vacíos al momento de mapear;
// si algún ticket no cae en su columna, verifica la ortografía exacta del status en Zoho.
export const COLUMNS: Column[] = [
  { id: 'ingresado', label: 'Ingresado', statuses: ['Ingresado'] },
  { id: 'pendiente', label: 'Pendiente', statuses: ['Pendiente'] }, // sin tickets ahora
  { id: 'revision', label: 'Rev./Diagnóstico', statuses: ['Rev./Diagnostico'] },
  { id: 'proceso', label: 'En Proceso', statuses: ['En Proceso'] },
  { id: 'espera_repuestos', label: 'En Espera de Repuestos', statuses: ['En Espera de Repuestos'] },
  { id: 'notificado', label: 'Notificado', statuses: ['Notificado'] }, // sin tickets ahora
  { id: 'notif_cliente', label: 'Notificación cliente', statuses: ['Notificación cliente'] },
  { id: 'notif_comercial', label: 'Notificación Comercial', statuses: ['Notificación Comercial'] }, // sin tickets ahora
  { id: 'comercial', label: 'Liberación Comercial', statuses: ['Liberación Comercial'] },
  { id: 'por_facturar', label: 'Por Facturar', statuses: ['Por Facturar'] },
  { id: 'entregar_sin_facturar', label: 'Por Entregar / Sin facturar', statuses: ['Por Entregar / Sin facturar'] }, // sin tickets ahora
  { id: 'por_entregar', label: 'Por Entregar', statuses: ['Por Entregar'] },
]

const STATUS_TO_COLUMN: Record<string, string> = Object.fromEntries(
  COLUMNS.flatMap((c) => c.statuses.map((s) => [s, c.id])),
)

/** Devuelve el id de columna para un status de Zoho, o null si no aplica al tablero. */
export function columnForStatus(status: string): string | null {
  return STATUS_TO_COLUMN[status] ?? null
}
