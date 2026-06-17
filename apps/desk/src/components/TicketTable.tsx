import type { Ticket } from '@ambientalia/shared'
import { ClienteLink, type ClienteKind } from './ClienteLink'
import { ReadToggle } from './ReadToggle'

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const COLS = ['#', 'Asunto', 'Cliente', 'Contacto', 'Estado', 'Prioridad', 'Propietario', 'Creado', 'Vencimiento', 'Días entrega', 'Canal']

export function TicketTable({ tickets, onSelect, onOpenCliente, onToggleRead }: { tickets: Ticket[]; onSelect: (id: string) => void; onOpenCliente?: (kind: ClienteKind, id: string) => void; onToggleRead?: (id: string, read: boolean) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full text-[12px]">
        <thead className="sticky top-0 bg-slate-50 text-slate-500 uppercase text-[11px]">
          <tr className="text-left border-b border-slate-200">
            {COLS.map((c) => <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} onClick={() => onSelect(t.id)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
              <td className="px-3 py-2 font-bold text-slate-400 whitespace-nowrap">{t.number}</td>
              <td className="px-3 py-2 max-w-[360px] truncate">
                <ReadToggle read={t.read} onToggle={(r) => onToggleRead?.(t.id, r)} className="text-[15px] align-middle mr-1" />
                <span className={t.read ? 'text-slate-600' : 'font-bold text-slate-800'}>{t.title}</span>
              </td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.company ? <ClienteLink label={t.company} kind="empresa" id={t.accountId} onOpen={onOpenCliente} /> : '—'}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.contactName ? <ClienteLink label={t.contactName} kind="contacto" id={t.contactId} onOpen={onOpenCliente} /> : '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap"><span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">{t.status}</span></td>
              <td className="px-3 py-2 text-slate-600">{t.priority ?? '—'}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{t.assignee?.name ?? '—'}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
              <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{fmtDate(t.dueDate)}</td>
              <td className="px-3 py-2 text-slate-600">{t.diasEntrega ?? '—'}</td>
              <td className="px-3 py-2 text-slate-600">{t.channel ?? '—'}</td>
            </tr>
          ))}
          {tickets.length === 0 && <tr><td colSpan={COLS.length} className="px-3 py-6 text-slate-400">Sin tickets.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
