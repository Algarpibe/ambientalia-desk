import { useState } from 'react'
import type { ComparacionExportacion as RespuestaComparacion } from '@ambientalia/shared'
import { compararConExportacion } from '../api/client'
import { ACEPTA_EXPORTACION, puedeComparar, vistaComparacion } from '../lib/comparacionExportacion'

// F1F-05, RQ-KP-28. Sin prueba por decisión de Gerencia (F0-00): todo lo decidible está en `lib/comparacionExportacion.ts`.
// Regla invariable 13: este panel NO lee el fichero, NO cruza, NO calcula porcentajes ni valida el periodo; sube el fichero y pinta
// lo que devuelve el servidor, en tonos neutros y sin meta, semáforo ni veredicto. Sólo se monta a administradores (`Analisis.tsx`).
export function ComparacionExportacion() {
  const [file, setFile] = useState<File | null>(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [respuesta, setRespuesta] = useState<RespuestaComparacion | null>(null)

  const comparar = async () => {
    if (!file) return
    setEnviando(true); setError(null); setRespuesta(null)
    try { setRespuesta(await compararConExportacion(file, { desde, hasta })) }
    catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setEnviando(false) }
  }

  const v = respuesta ? vistaComparacion(respuesta) : null
  return (
    <section className="max-w-[1100px] mx-auto mb-4 bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3">
      <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Comparar con la exportación de Zoho</h3>
      <div className="flex flex-wrap items-end gap-3 text-[12px] text-slate-600">
        <label className="flex flex-col gap-1">Exportación de Zoho (.csv)
          <input type="file" accept={ACEPTA_EXPORTACION} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[12px]" />
        </label>
        <label className="flex flex-col gap-1">Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-[12px]" />
        </label>
        <label className="flex flex-col gap-1">Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-[12px]" />
        </label>
        <button onClick={comparar} disabled={!puedeComparar(file !== null, enviando)} className="px-3 py-1 rounded text-[12px] bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-40">{enviando ? 'Comparando…' : 'Comparar'}</button>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-3 py-2 rounded">{error}</div>}
      {v && (
        <div className="flex flex-col gap-3 text-[12px] text-slate-700">
          <div className="text-slate-500">{v.periodo}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {v.recuentos.map((f) => (
              <div key={f.etiqueta} className="border border-slate-200 rounded p-2"><div className="text-slate-500">{f.etiqueta}</div><div className="text-[18px] font-bold text-slate-800">{f.valor}</div></div>
            ))}
          </div>
          {v.mensaje && <div className="text-slate-600">{v.mensaje}</div>}
          <table className="w-full text-left">
            <thead><tr className="text-slate-500"><th className="py-1">Indicador</th><th>Comparados</th><th>Coinciden</th><th>Difieren</th><th>Sin comparar</th><th>Porcentaje</th></tr></thead>
            <tbody>
              {v.columnas.map((c) => (
                <tr key={c.nombre} className="border-t border-slate-100"><td className="py-1">{c.nombre}</td><td>{c.comparados}</td><td>{c.coincidentes}</td><td>{c.diferentes}</td><td>{c.sinComparar}</td><td>{c.porcentaje}</td></tr>
              ))}
              <tr className="border-t border-slate-200 font-bold"><td className="py-1">Tickets</td><td>{v.tickets.comparados}</td><td>{v.tickets.coincidentes}</td><td /><td /><td>{v.tickets.porcentaje}</td></tr>
            </tbody>
          </table>
          {v.listas.map((l) => (
            <details key={l.titulo}>
              <summary className="cursor-pointer text-slate-600">{l.titulo} ({l.total})</summary>
              {l.lineas.length === 0 ? <div className="text-slate-400 pl-4">Sin elementos.</div> : (
                <ul className="pl-4 mt-1 flex flex-col gap-0.5 font-mono text-[11px]">{l.lineas.map((t, i) => <li key={`${i}-${t}`}>{t}</li>)}</ul>
              )}
            </details>
          ))}
          <div className="text-slate-500">{v.nota}</div>
        </div>
      )}
    </section>
  )
}
