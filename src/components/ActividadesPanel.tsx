import type { Activity } from '../../shared/types'

function fmtDate(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const ESTADOS: Record<string, string> = {
  'not started': 'No iniciada',
  'in progress': 'En proceso',
  'waiting on someone else': 'En espera',
  'waiting': 'En espera',
  'deferred': 'Aplazada',
  'completed': 'Completada',
}
function traducirEstado(s: string | null): string {
  if (!s) return '—'
  return ESTADOS[s.trim().toLowerCase()] ?? s
}

const PRIORIDADES: Record<string, string> = {
  highest: 'Muy alta',
  high: 'Alta',
  normal: 'Normal',
  low: 'Baja',
  lowest: 'Muy baja',
}
function traducirPrioridad(p: string): string {
  return PRIORIDADES[p.trim().toLowerCase()] ?? p
}

function statusClass(a: Activity): string {
  const t = (a.status ?? '').toLowerCase()
  if (a.statusType === 'Closed' || t.includes('complet')) return 'bg-green-50 text-green-600 border-green-200'
  if (t.includes('progress') || t.includes('proceso')) return 'bg-blue-50 text-blue-600 border-blue-200'
  if (t.includes('wait') || t.includes('espera')) return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-slate-50 text-slate-500 border-slate-200'
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
          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium shrink-0 ${statusClass(a)}`}>{traducirEstado(a.status)}</span>
          {a.owner && <span className="text-[11px] text-slate-500 w-[120px] truncate text-right shrink-0">{a.owner}</span>}
        </div>
      ))}
    </div>
  )
}
