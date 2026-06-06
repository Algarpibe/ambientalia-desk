import type { Ticket } from '../../shared/types'

export interface BoardViewDef { key: string; label: string }

// Fuente de verdad de las vistas funcionales (orden = el de la imagen del Sidebar).
export const FUNCTIONAL_VIEWS: BoardViewDef[] = [
  { key: 'todos', label: 'Todos los Tickets' },
  { key: 'abiertos', label: 'Tickets abiertos' },
  { key: 'cerrados', label: 'Tickets cerrados' },
  { key: 'espera', label: 'Tickets en espera' },
  { key: 'vencidos', label: 'Tickets vencidos' },
]

// label -> key, para que el Sidebar sepa qué ítems son funcionales.
export const FUNCTIONAL_BY_LABEL: Record<string, string> =
  Object.fromEntries(FUNCTIONAL_VIEWS.map((v) => [v.label, v.key]))

export function viewLabel(key: string): string {
  return FUNCTIONAL_VIEWS.find((v) => v.key === key)?.label ?? 'Todos los Tickets'
}

export function applyBoardView(tickets: Ticket[], key: string, now: Date): Ticket[] {
  const enEspera = (t: Ticket) => /espera/i.test(t.status ?? '')
  switch (key) {
    case 'cerrados': return tickets.filter((t) => t.statusType === 'Closed')
    case 'abiertos': return tickets.filter((t) => t.statusType !== 'Closed' && !enEspera(t))
    case 'espera': return tickets.filter((t) => t.statusType !== 'Closed' && enEspera(t))
    case 'vencidos': return tickets.filter((t) => {
      if (t.statusType === 'Closed' || !t.dueDate) return false
      const d = new Date(t.dueDate); return !isNaN(d.getTime()) && d.getTime() < now.getTime()
    })
    case 'todos':
    default: return tickets.filter((t) => t.statusType !== 'Closed')
  }
}
