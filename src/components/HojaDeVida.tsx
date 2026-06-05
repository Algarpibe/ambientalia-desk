import type { EquipoHistorial } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchEquipoHistorial } from '../api/client'

function fmtFecha(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function HojaDeVida({ equipoId, onClose }: { equipoId: string; onClose: () => void }) {
  const { data, loading, error } = useAsync<EquipoHistorial>(() => fetchEquipoHistorial(equipoId), [equipoId])
  const eq = data?.equipo

  return (
    <div className="fixed inset-0 z-[75] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Hoja de vida</h1>
        {eq && <span className="text-[13px] text-white/70 truncate">· {eq.serial} · {eq.marca} {eq.modelo}</span>}
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto bg-[#f4f5f7] p-6">
        {loading && !eq && <div className="text-center text-slate-400 text-[13px]">Cargando…</div>}
        {eq && data && (
          <div className="max-w-[900px] mx-auto">
            <section className="bg-white border border-slate-200 rounded-md p-4 mb-4">
              <h2 className="text-[16px] font-bold text-slate-800">{eq.marca} {eq.modelo} <span className="text-slate-400 font-normal">· {eq.tipo}</span></h2>
              <div className="text-[13px] text-slate-500 mt-1">Serie <b className="text-slate-700">{eq.serial}</b> · Cliente {eq.clienteNombre ?? '—'} · {eq.active ? 'Activo' : 'Inactivo'}</div>
              <div className="text-[12px] text-slate-400 mt-1">{data.tickets.length} ticket(s) en el historial</div>
            </section>

            {data.tickets.length === 0 && <div className="text-[13px] text-slate-400">Este equipo aún no tiene tickets.</div>}

            <div className="flex flex-col gap-3">
              {data.tickets.map((t) => (
                <div key={t.id} className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[14px] font-bold text-slate-800">{t.subject}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5">
                    {t.number} · {t.status} · {t.tecnico ?? 'Sin asignar'}{t.codigoServicio ? ` · ${t.codigoServicio}` : ''}{t.createdAt ? ` · ${fmtFecha(t.createdAt)}` : ''}
                  </div>
                  {t.transitions.length > 0 && (
                    <ol className="mt-3 border-l-2 border-slate-100 pl-4 flex flex-col gap-2">
                      {t.transitions.map((x, i) => (
                        <li key={i} className="text-[12px] text-slate-600 relative">
                          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-400" />
                          <b>{x.transitionName ?? 'Transición'}</b> · {x.fromStatus} → {x.toStatus}
                          <span className="text-slate-400"> · {x.area ?? ''} · {x.performedBy ?? ''} · {fmtFecha(x.performedAt)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
