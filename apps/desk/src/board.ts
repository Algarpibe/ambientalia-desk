import type { Ticket } from '@ambientalia/shared'
import { COLUMNS, columnForStatus } from '@ambientalia/shared'

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

export const PRIORITY_COLUMNS = [
  { id: 'High', label: 'High' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Low', label: 'Low' },
  { id: 'otra', label: 'Otra prioridad' },
] as const

export function groupByPriority(tickets: Ticket[]): ColumnGroups {
  const groups: ColumnGroups = { High: [], Medium: [], Low: [], otra: [] }
  for (const t of tickets) {
    const p = t.priority
    if (p === 'High' || p === 'Urgent') groups.High.push(t)
    else if (p === 'Medium') groups.Medium.push(t)
    else if (p === 'Low') groups.Low.push(t)
    else groups.otra.push(t)
  }
  return groups
}

export const DUEDATE_COLUMNS = [
  { id: 'vencidos', label: 'Vencidos' },
  { id: 'hoy', label: 'Vence hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'adelante', label: 'Más adelante' },
  { id: 'sinfecha', label: 'Sin fecha' },
] as const

export function groupByDueDate(tickets: Ticket[], now: Date): ColumnGroups {
  const groups: ColumnGroups = { vencidos: [], hoy: [], semana: [], adelante: [], sinfecha: [] }
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endToday = startToday + 24 * 3600 * 1000
  const endWeek = startToday + 7 * 24 * 3600 * 1000
  const t0 = now.getTime()
  for (const t of tickets) {
    if (!t.dueDate) { groups.sinfecha.push(t); continue }
    const d = new Date(t.dueDate).getTime()
    if (Number.isNaN(d)) { groups.sinfecha.push(t); continue }
    if (d < t0) groups.vencidos.push(t)
    else if (d < endToday) groups.hoy.push(t)
    else if (d < endWeek) groups.semana.push(t)
    else groups.adelante.push(t)
  }
  return groups
}
