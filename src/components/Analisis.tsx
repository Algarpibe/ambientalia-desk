import { useState } from 'react'
import type { Analisis as AnalisisData, AnalisisPunto, AnalisisMes } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchAnalisis } from '../api/client'

const RANGOS: { key: string; label: string }[] = [
  { key: 'mes', label: 'Último mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'anio', label: 'Año' },
  { key: 'todo', label: 'Todo' },
]

function Kpi({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-4">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className="text-[24px] font-bold text-slate-800">{value == null ? '—' : value}{value != null && suffix ? <span className="text-[14px] font-normal text-slate-400"> {suffix}</span> : null}</div>
    </div>
  )
}

function BarList({ title, data, unit }: { title: string; data: AnalisisPunto[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <section className="bg-white border border-slate-200 rounded-md p-4">
      <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h3>
      {data.length === 0 && <div className="text-[12px] text-slate-400">Sin datos.</div>}
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-[12px]">
            <span className="w-[170px] truncate text-slate-600" title={d.label}>{d.label}</span>
            <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden"><div className="bg-blue-400 h-3" style={{ width: `${(d.value / max) * 100}%` }} /></div>
            <span className="w-12 text-right font-bold text-slate-700">{d.value}{unit ? ` ${unit}` : ''}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Tendencia({ data }: { data: AnalisisMes[] }) {
  const max = Math.max(1, ...data.flatMap((m) => [m.creados, m.finalizados]))
  return (
    <section className="bg-white border border-slate-200 rounded-md p-4">
      <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Tendencia mensual (creados vs finalizados)</h3>
      {data.length === 0 ? <div className="text-[12px] text-slate-400">Sin datos.</div> : (
        <>
          <div className="flex items-end gap-3 h-[150px]">
            {data.map((m) => (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="flex items-end gap-1 flex-1 w-full justify-center">
                  <div className="w-3 bg-blue-400 rounded-t" style={{ height: `${(m.creados / max) * 100}%` }} title={`Creados: ${m.creados}`} />
                  <div className="w-3 bg-emerald-400 rounded-t" style={{ height: `${(m.finalizados / max) * 100}%` }} title={`Finalizados: ${m.finalizados}`} />
                </div>
                <span className="text-[10px] text-slate-400">{m.mes.slice(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-sm" />Creados</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm" />Finalizados</span>
          </div>
        </>
      )}
    </section>
  )
}

export function Analisis({ onClose }: { onClose: () => void }) {
  const [range, setRange] = useState('trimestre')
  const { data, loading, error } = useAsync<AnalisisData>(() => fetchAnalisis(range), [range])

  return (
    <div className="fixed inset-0 z-[70] bg-[#f4f5f7] flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Análisis</h1>
        <div className="ml-auto flex gap-1">
          {RANGOS.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} className={`px-3 py-1 rounded text-[12px] ${range === r.key ? 'bg-white text-slate-800 font-bold' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>{r.label}</button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-6">
        {loading && !data && <div className="text-center text-slate-400 text-[13px]">Cargando…</div>}
        {data && (
          <div className="max-w-[1100px] mx-auto flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi label="Activos (ahora)" value={data.activos} />
              <Kpi label="Creados (periodo)" value={data.creados} />
              <Kpi label="Finalizados (periodo)" value={data.finalizados} />
              <Kpi label="Tiempo prom. servicio" value={data.tiempoPromedioDias} suffix="días" />
              <Kpi label="Cumplimiento promesa" value={data.cumplimientoPct} suffix="%" />
            </div>
            <Tendencia data={data.tendencia} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BarList title="Por estado (activos)" data={data.porEstado} />
              <BarList title="Por técnico (periodo)" data={data.porTecnico} />
              <BarList title="Por cliente (periodo)" data={data.porCliente} />
              <BarList title="Por marca (periodo)" data={data.porMarca} />
              <BarList title="Por tipo de servicio (periodo)" data={data.porTipoServicio} />
              <BarList title="Por clasificación (periodo)" data={data.porClasificacion} />
            </div>
            <BarList title="Tiempo de gestión por estado (días, activos)" data={data.gestionPorEstado} unit="d" />
          </div>
        )}
      </div>
    </div>
  )
}
