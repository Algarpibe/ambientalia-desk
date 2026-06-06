import type { Activity } from '../../shared/types'
import { traducirEstado, traducirPrioridad, estadoBadgeClass } from '../lib/actividades'

function fmtDate(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ActividadesPanel({ items }: { items: Activity[] }) {
  if (items.length === 0) return <div className="text-[13px] text-slate-400 p-4">Este ticket no tiene actividades.</div>
  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {items.map((a) => (
        <div key={a.id} className="flex items-center gap-4 py-3 px-2">
          <span className="material-symbols-outlined text-slate-300 text-[20px]">task_alt</span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-800 truncate">{a.subject || '—'}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
              {a.priority && <span>{traducirPrioridad(a.priority)}</span>}
              {a.dueDate && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">flag</span>{fmtDate(a.dueDate)}</span>}
            </div>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium shrink-0 ${estadoBadgeClass(a.status, a.statusType)}`}>{traducirEstado(a.status)}</span>
          {a.owner && <span className="text-[11px] text-slate-500 w-[120px] truncate text-right shrink-0">{a.owner}</span>}
        </div>
      ))}
    </div>
  )
}
