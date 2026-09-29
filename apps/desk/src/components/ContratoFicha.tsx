import { csvDelInforme, type InformeContrato } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { contratoPorId, informeDeContrato, type FichaContrato } from '../api/client'

const ESTADO: Record<string, string> = { no_iniciado: 'No iniciado', vigente: 'Vigente', vencido: 'Vencido' }

/**
 * Ficha de un contrato: datos, saldo del lote e informe trimestral (registro-contrato, lote 6; RQ-TC-21, RQ-ZS-15).
 *
 * REGLA 13: esta pantalla NO calcula ninguna cifra. Estado, saldo, % ejecutado, en curso, libres, días hasta el fin,
 * trimestres y servicios vienen tal cual de `GET /api/contratos/:id` y `GET /api/contratos/:id/informe`. El CSV lo arma
 * `csvDelInforme` de `shared` (probado en node, `contratos.test.ts`); aquí sólo se le pone el BOM y se descarga, con el
 * patrón de `RemisionesPage.tsx:107-115`.
 */
export function ContratoFicha({ id, onVolver }: { id: number; onVolver: () => void }) {
  const ficha = useAsync<FichaContrato>(() => contratoPorId(id), [id])
  const informe = useAsync<InformeContrato>(() => informeDeContrato(id), [id])
  const c = ficha.data?.contrato
  const inf = informe.data

  function exportar(i: InformeContrato) {
    const blob = new Blob([String.fromCharCode(0xfeff) + csvDelInforme(i)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contrato-${i.contrato.lote}-${i.hoy}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dato = (t: string, v: string | number) => (
    <div><dt className="text-[11px] text-slate-400">{t}</dt><dd className="font-bold text-slate-800">{v}</dd></div>
  )
  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onVolver} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Volver">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="text-[14px] font-semibold text-slate-700">Contrato {c ? `nº ${c.id} · ${c.lote}` : ''}</span>
        {inf && <button onClick={() => exportar(inf)} className="ml-auto text-[12px] font-bold bg-blue-600 text-white px-3 py-1 rounded">Exportar CSV</button>}
      </div>
      <div className="flex-1 overflow-auto p-6 bg-[#f4f5f7] flex flex-col gap-6 text-[12px]">
        {(ficha.error || informe.error) && <div className="text-red-600">No se pudo cargar el contrato: {ficha.error ?? informe.error}</div>}
        {c && ficha.data && (
          <section className="max-w-[900px] bg-white border border-slate-200 rounded-md p-5">
            <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">Datos y saldo del lote</h2>
            <dl className="grid grid-cols-4 gap-3 text-[13px]">
              {dato('Cliente', c.clientId)}{dato('Vigencia', `${c.fechaInicio} → ${c.fechaFin}`)}
              {dato('Estado', ESTADO[ficha.data.estado] ?? ficha.data.estado)}{dato('Registrado por', c.creadoPor)}
              {dato('SubOV creadas', ficha.data.saldo.creadas)}{dato('Consumidas', ficha.data.saldo.consumidas)}
              {dato('Libres', ficha.data.saldo.libres)}{dato('% consumido', `${ficha.data.saldo.consumido} %`)}
            </dl>
          </section>
        )}
        {inf && (
          <section className="max-w-[900px] bg-white border border-slate-200 rounded-md p-5">
            <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">Informe al {inf.hoy}</h2>
            <dl className="grid grid-cols-5 gap-3 text-[13px] mb-4">
              {dato('% ejecutado', `${inf.porcentajeEjecutado} %`)}{dato('Ejecutadas', inf.ejecutadas)}{dato('En curso', inf.enCurso)}
              {dato('Libres', inf.libres)}{dato('Días hasta el fin', inf.diasHastaFin)}
            </dl>
            {inf.trimestres.length === 0 && <div className="text-slate-400">El contrato aún no ha empezado: no hay trimestres que informar.</div>}
            {inf.trimestres.map((t) => (
              <div key={t.k} className="mb-4">
                <div className="font-bold text-slate-700">Trimestre {t.k} · {t.inicio} → {t.fin} · {t.porcentajeEjecutado} % ejecutado acumulado</div>
                {t.servicios.length === 0
                  ? <div className="text-slate-400">Sin servicios finalizados en este trimestre.</div>
                  : (
                    <table className="w-full mt-1">
                      <thead className="text-slate-400 text-left"><tr><th>SubOV</th><th>Ticket</th><th>Equipo</th><th>Serial</th><th>Tipo</th><th>Fecha</th><th>Informe</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {t.servicios.map((s) => (
                          <tr key={s.subOV}><td>{s.subOV}</td><td>#{s.ticketNumber ?? s.ticketId}</td><td>{s.equipo ?? '—'}</td><td>{s.serial ?? '—'}</td><td>{s.tipoServicio ?? '—'}</td><td>{s.fecha}</td><td className="text-slate-400">{s.informe}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            ))}
            {inf.sinFecha.length > 0 && <div className="text-slate-500">Ejecutadas sin fecha de finalización: {inf.sinFecha.map((s) => s.numero).join(', ')}</div>}
            <ul className="mt-3 text-slate-400 list-disc pl-4">{inf.huecos.map((h) => <li key={h}>{h}</li>)}</ul>
          </section>
        )}
      </div>
    </div>
  )
}
