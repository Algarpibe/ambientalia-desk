import { ETIQUETA_RESULTADO_RECLAMACION, RESULTADOS_RECLAMACION } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { getMedicionGarantias } from '../api/client'

/**
 * Medición de las garantías con el proveedor, por marca (F1B-13, `medicion-garantias-por-marca`; `tickets-core` RQ-TC-68).
 *
 * REGLA 13 — este fichero sólo PINTA, y no decide nada: qué fichas cuentan, la agrupación, las sumas, el cociente, el orden
 * y qué es una falla repetida llegan ya calculados por `medirGarantias` (`packages/shared/src/medicionGarantias.ts`) vía
 * `GET /api/medicion-garantia-proveedor`, y la sesión (`401`) y el permiso (`403`, `puedeVerMedicionGarantias`) los exige
 * el servidor. Sin umbrales, sin colores de alerta, sin escrituras. Lo único que se hace con un número es darle formato
 * (`toLocaleString`, «#996»: presentación). El número del ticket llega del servidor; el id interno no llega.
 * Los `.tsx` de `apps/desk/src` están fuera de la red de pruebas por decisión de Gerencia (F0-00): sin rojo previo.
 */

const fmtValor = (v: number, moneda: string) => `${v.toLocaleString('es-CO')} ${moneda}`
/** El cociente llega calculado; `null` (nada reclamado) se enseña «—» sin comparar nada. */
const fmtCociente = (c: number | null) => (c === null ? '—' : c.toLocaleString('es-CO', { style: 'percent', maximumFractionDigits: 1 }))
const SIN_MARCA = 'Sin fabricante'
/** `null`: el ticket de la ficha ya no existe en la base. */
const fmtNumeroTicket = (n: number | null) => (n === null ? 'ticket ya no existe' : `#${n}`)

const TH = 'px-3 py-2 text-left text-[11px] font-bold uppercase text-slate-500'
const TD = 'px-3 py-2 text-[12px] text-slate-700'

export function MedicionGarantias({ onClose }: { onClose: () => void }) {
  const { data, loading, error } = useAsync(getMedicionGarantias, [])

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200 shrink-0">
        <h2 className="text-[14px] font-bold text-slate-800">Garantías con el proveedor, por marca</h2>
        <button onClick={onClose} title="Cerrar" className="p-1.5 text-slate-500 hover:text-slate-800">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {loading && <div className="text-[12px] text-slate-400">Cargando…</div>}
        {error && <div className="text-[12px] text-slate-600">No se pudo cargar la medición. {error}</div>}
        {data && data.porFabricante.length === 0 && data.fallasRepetidas.length === 0 && (
          <div className="text-[12px] text-slate-400">Sin reclamaciones.</div>
        )}
        {data && data.porFabricante.length > 0 && (
          <section>
            <h3 className="text-[12px] font-bold text-slate-700 mb-2">Recuperado frente a reclamado</h3>
            <table className="w-full border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className={TH}>Fabricante</th>
                  <th className={TH}>Fichas</th>
                  <th className={TH}>Sin resolver</th>
                  <th className={TH}>Sin valor</th>
                  <th className={TH}>Reclamado</th>
                  <th className={TH}>Recuperado</th>
                  <th className={TH}>Recuperado / reclamado</th>
                  {RESULTADOS_RECLAMACION.map((r) => <th key={r} className={TH}>{ETIQUETA_RESULTADO_RECLAMACION[r]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.porFabricante.map((g) => (
                  <tr key={g.fabricante ?? ''}>
                    <td className={TD}>{g.fabricante ?? SIN_MARCA}</td>
                    <td className={TD}>{g.fichas}</td>
                    <td className={TD}>{g.sinResolver}</td>
                    <td className={TD}>{g.sinValorReclamado}</td>
                    <td className={TD}>{fmtValor(g.reclamado, g.moneda)}</td>
                    <td className={TD}>{fmtValor(g.recuperado, g.moneda)}</td>
                    <td className={TD}>{fmtCociente(g.cociente)}</td>
                    {RESULTADOS_RECLAMACION.map((r) => <td key={r} className={TD}>{g.resultados[r]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {data && data.fallasRepetidas.length > 0 && (
          <section>
            <h3 className="text-[12px] font-bold text-slate-700 mb-2">Fallas repetidas</h3>
            <table className="w-full border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className={TH}>Fabricante</th>
                  <th className={TH}>Referencia de la pieza</th>
                  <th className={TH}>Fichas</th>
                  <th className={TH}>Tickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.fallasRepetidas.map((f) => (
                  <tr key={`${f.fabricante ?? ''}|${f.piezaReferencia}`}>
                    <td className={TD}>{f.fabricante ?? SIN_MARCA}</td>
                    <td className={TD}>{f.piezaReferencia}</td>
                    <td className={TD}>{f.fichas}</td>
                    <td className={TD}>{f.numerosTicket.map(fmtNumeroTicket).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  )
}
