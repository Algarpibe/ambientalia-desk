import { useState } from 'react'
import { puedeMantenerNovedades, type NovedadCatalogo } from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { cambiarNovedadRemision, crearNovedadRemision, erroresDelServidor, listarNovedadesTodas } from '../api/client'

/**
 * Lista de novedades de la remisión de entrada (F1B-04, `remisiones` RQ-RE-29). Configuración → «Lista de novedades de entrada».
 *
 * REGLA 13 — qué es comodidad y qué es guarda (la tabla completa está en el `tasks.md` del cambio):
 *  - La entrada del menú la ve cualquiera, como la del Top 5; los controles sólo se ENSEÑAN si `puedeMantenerNovedades(user)`, el MISMO predicado del servidor,
 *    consumido de `shared`. La guarda es el 403 de las tres rutas de `apps/desk/server/routes/novedades.ts`.
 *  - El formulario NO valida nada: manda y enseña lo que responda el servidor (422 contenido, 409 repetida).
 *  - No hay botón de borrar porque no hay ruta que borre: retirar es `activo = false`.
 *  - «Sin novedad» no muestra el botón de retirar; la guarda es el 422 del `PATCH` (`cambioNovedadDelCuerpo`).
 */
export function NovedadesPanel({ onVolver }: { onVolver: () => void }) {
  const { user } = useAuth()
  const puede = !!user && puedeMantenerNovedades(user)
  const { data, loading, error, reload } = useAsync<NovedadCatalogo[]>(() => (puede ? listarNovedadesTodas() : Promise.resolve([])), [puede])
  const [errores, setErrores] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [nueva, setNueva] = useState({ clave: '', etiqueta: '', exigeTexto: false })
  const lista = data ?? []

  async function hacer(accion: () => Promise<unknown>) {
    setEnviando(true); setErrores([])
    try { await accion(); reload() } catch (e) { setErrores(erroresDelServidor(e)) } finally { setEnviando(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onVolver} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Volver">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="text-[14px] font-semibold text-slate-700">Lista de novedades de entrada</span>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-[#f4f5f7]">
        <section className="max-w-[760px] bg-white border border-slate-200 rounded-md p-5 space-y-4">
          {!puede && <p className="text-[13px] text-slate-600">La lista la mantiene el Director Técnico de Servicio Técnico.</p>}
          {puede && loading && <p className="text-[13px] text-slate-500">Cargando…</p>}
          {puede && error && <p className="text-[13px] text-red-600">No se pudo cargar la lista. <button onClick={reload} className="underline">Reintentar</button></p>}
          {errores.length > 0 && <ul className="text-[13px] text-red-600 list-disc pl-5">{errores.map((e) => <li key={e}>{e}</li>)}</ul>}
          {puede && !loading && (
            <>
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-slate-500 border-b"><th className="py-1">Orden</th><th>Etiqueta</th><th>Clave</th><th>Exige texto</th><th>Estado</th><th /></tr></thead>
                <tbody>
                  {lista.map((n) => (
                    <tr key={n.clave} className={`border-b ${n.activo ? '' : 'text-slate-400'}`}>
                      <td className="py-1 w-[70px]">
                        <input type="number" defaultValue={n.orden} disabled={enviando} className="w-[60px] border rounded px-1"
                          onBlur={(e) => { const v = Number(e.target.value); if (v !== n.orden) void hacer(() => cambiarNovedadRemision(n.clave, { orden: v })) }} />
                      </td>
                      <td>
                        <input defaultValue={n.etiqueta} disabled={enviando} className="w-full border rounded px-1"
                          onBlur={(e) => { if (e.target.value !== n.etiqueta) void hacer(() => cambiarNovedadRemision(n.clave, { etiqueta: e.target.value })) }} />
                      </td>
                      <td className="font-mono text-[12px]">{n.clave}</td>
                      <td>
                        <input type="checkbox" checked={n.exigeTexto} disabled={enviando}
                          onChange={(e) => void hacer(() => cambiarNovedadRemision(n.clave, { exigeTexto: e.target.checked }))} />
                      </td>
                      <td>{n.activo ? 'Activa' : 'Retirada'}{n.excluyeDemas ? ' · excluye a las demás' : ''}</td>
                      <td className="text-right">
                        {!n.excluyeDemas && (
                          <button disabled={enviando} className="text-[12px] underline" onClick={() => void hacer(() => cambiarNovedadRemision(n.clave, { activo: !n.activo }))}>
                            {n.activo ? 'Retirar' : 'Reactivar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <form className="flex flex-wrap items-end gap-2 border-t pt-3"
                onSubmit={(e) => { e.preventDefault(); void hacer(async () => { await crearNovedadRemision(nueva); setNueva({ clave: '', etiqueta: '', exigeTexto: false }) }) }}>
                <label className="text-[12px] text-slate-600">Clave<input value={nueva.clave} onChange={(e) => setNueva({ ...nueva, clave: e.target.value })} className="block border rounded px-1 font-mono" placeholder="tapa_suelta" /></label>
                <label className="text-[12px] text-slate-600 flex-1">Etiqueta<input value={nueva.etiqueta} onChange={(e) => setNueva({ ...nueva, etiqueta: e.target.value })} className="block w-full border rounded px-1" placeholder="Tapa suelta" /></label>
                <label className="text-[12px] text-slate-600 flex items-center gap-1"><input type="checkbox" checked={nueva.exigeTexto} onChange={(e) => setNueva({ ...nueva, exigeTexto: e.target.checked })} />Exige texto</label>
                <button type="submit" disabled={enviando} className="bg-[#2C7BE5] text-white px-3 py-1 rounded text-[13px] font-bold">Añadir</button>
              </form>
              <p className="text-[12px] text-slate-500">Una novedad no se borra: se retira, y sigue legible en las remisiones que ya la marcaron.</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
