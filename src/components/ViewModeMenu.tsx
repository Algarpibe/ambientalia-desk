import { useState } from 'react'
import type { ViewMode } from '../viewSettings'

const VISTAS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'clasica', label: 'Vista clásica', icon: 'view_agenda' },
  { id: 'compacta', label: 'Vista compacta', icon: 'view_headline' },
  { id: 'tabla', label: 'Vista de tabla', icon: 'table_rows' },
]
const MODOS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'estado', label: 'Modo de estado', icon: 'flag' },
  { id: 'prioridad', label: 'Modo de prioridad', icon: 'priority_high' },
  { id: 'cuenta-regresiva', label: 'Modo de cuenta regresiva', icon: 'timer' },
]
const ALL = [...VISTAS, ...MODOS]

function MenuItem({ item, active, onPick }: { item: { label: string; icon: string }; active: boolean; onPick: () => void }) {
  return (
    <button onClick={onPick} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50">
      <span className="material-symbols-outlined text-[18px] text-slate-400">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {active && <span className="material-symbols-outlined text-[18px] text-blue-600">check</span>}
    </button>
  )
}

export function ViewModeMenu({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const [open, setOpen] = useState(false)
  const current = ALL.find((x) => x.id === mode) ?? MODOS[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 border border-slate-200 rounded px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50">
        <span className="material-symbols-outlined text-[18px] text-slate-400">{current.icon}</span>
        {current.label}
        <span className="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-[250px] bg-white border border-slate-200 rounded-md shadow-lg z-[61] py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vistas</div>
            {VISTAS.map((v) => <MenuItem key={v.id} item={v} active={mode === v.id} onPick={() => { onChange(v.id); setOpen(false) }} />)}
            <div className="px-3 py-1 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-t border-slate-100">Modos de trabajo</div>
            {MODOS.map((v) => <MenuItem key={v.id} item={v} active={mode === v.id} onPick={() => { onChange(v.id); setOpen(false) }} />)}
          </div>
        </>
      )}
    </div>
  )
}
