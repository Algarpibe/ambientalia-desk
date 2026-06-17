import type { Ticket } from '@ambientalia/shared'
import { TicketCard } from './TicketCard'
import { visibleColumns } from '../board'

export function KanbanBoard({ columns, groups, hideEmpty, loading, onSelect, onOpenCliente, onToggleRead }: {
  columns: readonly { id: string; label: string }[]
  groups: Record<string, Ticket[]>
  hideEmpty: boolean
  loading: boolean
  onSelect: (id: string) => void
  onOpenCliente?: (kind: import('./ClienteLink').ClienteKind, id: string) => void
  onToggleRead?: (id: string, read: boolean) => void
}) {
  const counts = Object.fromEntries(columns.map((c) => [c.id, groups[c.id]?.length ?? 0]))
  return (
    <main className="flex-1 flex overflow-x-auto p-3 gap-2 bg-[#E9EDF2] dark:bg-slate-950">
      {visibleColumns(columns, counts, hideEmpty).map((column) => {
        const colTickets = groups[column.id] ?? []
        return (
          <section key={column.id} className="w-[280px] min-w-[280px] flex flex-col">
            <div className="px-1 py-2 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{column.label} ({colTickets.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 hide-scrollbar">
              {loading && <div className="h-20 rounded-lg bg-slate-200/60 animate-pulse" />}
              {!loading && colTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onClick={() => onSelect(ticket.id)} onOpenCliente={onOpenCliente} onToggleRead={onToggleRead} />
              ))}
              {!loading && colTickets.length === 0 && (
                <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center opacity-40">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Sin Tickets</span>
                </div>
              )}
            </div>
          </section>
        )
      })}
    </main>
  )
}
