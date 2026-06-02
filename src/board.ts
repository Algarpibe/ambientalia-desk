import type { Ticket } from '../shared/types'
import { COLUMNS, columnForStatus } from '../shared/columns'

export type ColumnGroups = Record<string, Ticket[]>

export function groupTicketsByColumn(tickets: Ticket[]): ColumnGroups {
  const groups: ColumnGroups = Object.fromEntries(COLUMNS.map((c) => [c.id, []]))
  for (const ticket of tickets) {
    const col = columnForStatus(ticket.status)
    if (col) groups[col].push(ticket)
  }
  return groups
}
