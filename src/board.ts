import type { Ticket } from '../shared/types'
import { COLUMNS, columnForStatus } from '../shared/columns'

export type ColumnGroups = Record<string, Ticket[]>

export function groupTicketsByColumn(tickets: Ticket[]): ColumnGroups {
  const groups: ColumnGroups = Object.fromEntries(COLUMNS.map((c) => [c.id, []]))
  for (const ticket of tickets) {
    const col = columnForStatus(ticket.status)
    if (groups[col]) groups[col].push(ticket)
  }
  return groups
}

/**
 * Columnas a mostrar en el tablero. 'otros' siempre se oculta si está vacía.
 * Con `hideEmpty`, también se ocultan las columnas del Blueprint sin tickets (0).
 */
export function visibleColumns<T extends { id: string }>(
  columns: readonly T[],
  counts: Record<string, number>,
  hideEmpty: boolean,
): T[] {
  return columns.filter((c) => {
    const n = counts[c.id] ?? 0
    if (c.id === 'otros') return n > 0
    return hideEmpty ? n > 0 : true
  })
}
