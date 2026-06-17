import DOMPurify from 'dompurify'
import type { HistoryEvent } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchHistory } from '../api/client'

function fmtDateHeader(s: string | null): string {
  if (!s) return 'Sin fecha'
  const d = new Date(s)
  return isNaN(d.getTime()) ? 'Sin fecha' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}
function fmtTime(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export function HistoriaPanel({ ticketId }: { ticketId: string }) {
  const { data, loading } = useAsync<HistoryEvent[]>(() => fetchHistory(ticketId), [ticketId])
  if (loading && !data) return <div className="p-4 text-[13px] text-slate-400">Cargando…</div>
  const events = data ?? []
  if (events.length === 0) return <div className="p-4 text-[13px] text-slate-400">Sin historial.</div>

  const groups: { date: string; items: HistoryEvent[] }[] = []
  for (const e of events) {
    const d = fmtDateHeader(e.time)
    const last = groups[groups.length - 1]
    if (last && last.date === d) last.items.push(e)
    else groups.push({ date: d, items: [e] })
  }

  return (
    <div className="p-4 max-w-[820px]">
      {groups.map((g, gi) => (
        <div key={gi} className="mb-5">
          <div className="text-[12px] font-bold text-slate-500 border-b border-slate-200 pb-1 mb-3">{g.date}</div>
          <div className="flex flex-col gap-4">
            {g.items.map((e, i) => (
              <div key={i} className="text-[12px]">
                <div className="text-[11px] text-slate-400">{fmtTime(e.time)}</div>
                <div className="font-semibold text-slate-700">{e.title}</div>
                {e.details.map((d, di) => (
                  <div key={di} className="text-slate-600 mt-0.5">
                    <span className="text-slate-400">{d.label}</span>{' '}
                    {d.html
                      ? <span className="inline [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(d.value) }} />
                      : <span>{d.value}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
