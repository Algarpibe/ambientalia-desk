import { useState } from 'react'
import type { ActivityListItem } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchAllActivities } from '../api/client'
import { traducirEstado, traducirPrioridad, estadoBadgeClass } from '../lib/actividades'

function fmtFecha(s: string | null): string { if (!s) return ''; const d = new Date(s); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }

const VISTAS: { key: string; label: string }[] = [
  { key: 'todas', label: 'Todas las Actividades' },
  { key: 'abiertas', label: 'Abiertas' },
  { key: 'vencidas', label: 'Vencidas' },
]

export function ActividadesPage({ onClose, onSelectTicket }: { onClose: () => void; onSelectTicket: (id: string) => void }) {
  const [filter, setFilter] = useState('todas')
  const [q, setQ] = useState('')
  const { data, loading } = useAsync<ActivityListItem[]>(() => fetchAllActivities(filter, q), [filter, q])
  const items = data ?? []
  const vista = VISTAS.find((v) => v.key === filter)?.label ?? 'Actividades'

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Actividades</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[220px] border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 pt-3 text-[11px] font-bold text-slate-400">VISTAS CON ESTRELLAS</div>
          {VISTAS.map((v) => (
            <button key={v.key} onClick={() => setFilter(v.key)} className={`text-left px-4 py-2 text-[13px] ${filter === v.key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{v.label}</button>
          ))}
          <div className="mt-auto border-t border-slate-200 px-4 py-2 text-[12px] text-blue-600 font-bold">Tareas</div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-slate-200 px-4 py-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-amber-400">star</span>
            <h2 className="text-[14px] font-semibold text-slate-700">{vista}</h2>
            <span className="text-[12px] text-slate-400">{items.length}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="ml-auto border border-slate-200 rounded px-3 py-1 text-[13px] w-[260px]" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && !data && <div className="p-4 text-[13px] text-slate-400">Cargando…</div>}
            {!loading && items.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin actividades.</div>}
            {items.map((a) => (
              <button key={a.id} onClick={() => a.ticketId && onSelectTicket(a.ticketId)} className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                <span className="material-symbols-outlined text-slate-300 text-[20px]">task_alt</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-800 truncate">{a.subject}</div>
                  <div className="text-[11px] text-slate-400 truncate">{[a.ticketNumber, a.owner, traducirPrioridad(a.priority), fmtFecha(a.dueDate)].filter(Boolean).join(' · ')}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded border shrink-0 ${estadoBadgeClass(a.status, a.statusType)}`}>{traducirEstado(a.status)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
