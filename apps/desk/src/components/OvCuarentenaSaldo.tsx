import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { listarCuarentena, saldoPorLote, mensajeDelServidor, type OvCuarentena, type SaldoLote } from '../api/client'

/**
 * Cuarentena de subOV y saldo por lote, para Comercial (asociacion-ov-ticket, lote 6; RQ-TC-18, RQ-ZS-14).
 * Sólo lectura: la pantalla enseña lo que responden `GET /api/ov-asociaciones/cuarentena` y
 * `GET /api/ov-asociaciones/saldo/:lote`. El formato del lote lo valida el servidor (422), no esta pantalla.
 * «Consumido» es consumidas / creadas; el «% ejecutado» de Gerencia (subOV con ticket finalizado) es del
 * cambio 3 de F1B-11 y no se enseña aquí.
 */
export function OvCuarentenaSaldo({ onVolver }: { onVolver: () => void }) {
  const { data: cuarentena, loading, error, reload } = useAsync<OvCuarentena[]>(() => listarCuarentena(), [])
  const [lote, setLote] = useState('')
  const [saldo, setSaldo] = useState<SaldoLote | null>(null)
  const [errorSaldo, setErrorSaldo] = useState<string | null>(null)

  async function consultar() {
    setErrorSaldo(null)
    setSaldo(null)
    try {
      setSaldo(await saldoPorLote(lote.trim()))
    } catch (e) {
      setErrorSaldo(mensajeDelServidor(e))
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onVolver} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Volver">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="text-[14px] font-semibold text-slate-700">Órdenes de venta · cuarentena y saldo por lote</span>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-[#f4f5f7] flex flex-col gap-6">
        <section className="max-w-[820px] bg-white border border-slate-200 rounded-md p-5">
          <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">Saldo por lote</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void consultar() }}
              placeholder="OV-AAAA-NNN"
              className="border border-slate-200 rounded px-2 py-1 text-[13px] w-[180px]"
            />
            <button onClick={() => void consultar()} className="text-[12px] font-bold bg-blue-600 text-white px-3 py-1 rounded">Consultar</button>
          </div>
          {errorSaldo && <div className="mt-2 text-[12px] text-red-600">{errorSaldo}</div>}
          {saldo && (
            <dl className="mt-3 grid grid-cols-4 gap-3 text-[13px]">
              <div><dt className="text-[11px] text-slate-400">Creadas</dt><dd className="font-bold text-slate-800">{saldo.creadas}</dd></div>
              <div><dt className="text-[11px] text-slate-400">Consumidas</dt><dd className="font-bold text-slate-800">{saldo.consumidas}</dd></div>
              <div><dt className="text-[11px] text-slate-400">Libres</dt><dd className="font-bold text-slate-800">{saldo.libres}</dd></div>
              <div><dt className="text-[11px] text-slate-400">% consumido</dt><dd className="font-bold text-slate-800">{saldo.consumido} %</dd></div>
            </dl>
          )}
        </section>

        <section className="max-w-[820px] bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Órdenes de venta en cuarentena</h2>
            <button onClick={reload} className="text-[11px] text-blue-600 hover:underline">Actualizar</button>
          </div>
          {error && <div className="text-[12px] text-red-600">No se pudo cargar la cuarentena: {error}</div>}
          {!error && !loading && (cuarentena ?? []).length === 0 && <div className="text-[12px] text-slate-400">No hay órdenes de venta en cuarentena.</div>}
          <ul className="divide-y divide-slate-100">
            {(cuarentena ?? []).map((o) => (
              <li key={o.id} className="py-2 text-[12px]">
                <span className="font-bold text-slate-800">{o.number}</span>
                <span className="text-slate-500"> · {o.customer_name ?? 'Sin cliente'}</span>
                <div className="text-slate-500">{o.motivo}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
