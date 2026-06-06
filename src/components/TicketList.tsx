import type { Ticket } from '../../shared/types'
import { ClienteLink, type ClienteKind } from './ClienteLink'

function StatusBadge({ status }: { status: string }) {
  return <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">{status}</span>
}

export function TicketList({ tickets, dense, onSelect, onOpenCliente }: { tickets: Ticket[]; dense?: boolean; onSelect: (id: string) => void; onOpenCliente?: (kind: ClienteKind, id: string) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-white">
      <ul className="divide-y divide-slate-100">
        {tickets.map((t) => (
          <li key={t.id}>
            <button onClick={() => onSelect(t.id)} className={`w-full text-left flex items-center gap-3 hover:bg-slate-50 ${dense ? 'px-4 py-1.5' : 'px-4 py-3'}`}>
              <span className="material-symbols-outlined text-[18px] text-slate-300 shrink-0">mail</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-slate-800 truncate ${dense ? 'text-[12px]' : 'text-[13px]'}`}>{t.title}</div>
                {!dense && (
                  <div className="text-[11px] text-slate-500 truncate">
                    <span className="font-bold text-slate-400">{t.number}</span> · {t.assignee?.name} · <ClienteLink label={t.contactName} kind="contacto" id={t.contactId} onOpen={onOpenCliente} />{t.contactName && t.company ? ' · ' : ''}<ClienteLink label={t.company} kind="empresa" id={t.accountId} onOpen={onOpenCliente} /> · {t.time}
                  </div>
                )}
              </div>
              {dense && <span className="text-[11px] text-slate-400 shrink-0">{t.number}</span>}
              <StatusBadge status={t.status} />
            </button>
          </li>
        ))}
        {tickets.length === 0 && <li className="px-4 py-6 text-[13px] text-slate-400">Sin tickets.</li>}
      </ul>
    </div>
  )
}
