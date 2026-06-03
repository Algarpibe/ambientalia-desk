import type { Column } from './types'

// Estados REALES del portal Zoho Desk de Ambientalia (confirmados con datos en vivo).
// `statuses` debe contener el string EXACTO que devuelve Zoho (con acentos/espacios).
export const COLUMNS: Column[] = [
  { id: 'ingresado', label: 'Ingresado', statuses: ['Ingresado'] },
  { id: 'revision', label: 'Rev./Diagnóstico', statuses: ['Rev./Diagnostico'] },
  { id: 'comercial', label: 'Liberación Comercial', statuses: ['Liberación Comercial', 'Notificación Comercial'] },
  { id: 'proceso', label: 'En Proceso', statuses: ['En Proceso'] },
  { id: 'notif_cliente', label: 'Notificación cliente', statuses: ['Notificación cliente'] },
  { id: 'por_facturar', label: 'Por Facturar', statuses: ['Por Facturar'] },
  { id: 'entregar_sin_facturar', label: 'Por Entregar / Sin facturar', statuses: ['Por Entregar / Sin facturar'] },
  { id: 'por_entregar', label: 'Por Entregar', statuses: ['Por Entregar'] },
  { id: 'espera_repuestos', label: 'En Espera de Repuestos', statuses: ['En Espera de Repuestos'] },
]

const STATUS_TO_COLUMN: Record<string, string> = Object.fromEntries(
  COLUMNS.flatMap((c) => c.statuses.map((s) => [s, c.id])),
)

/** Devuelve el id de columna para un status de Zoho, o null si no aplica al tablero. */
export function columnForStatus(status: string): string | null {
  return STATUS_TO_COLUMN[status] ?? null
}
