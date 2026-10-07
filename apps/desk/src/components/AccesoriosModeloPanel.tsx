import { useEffect, useMemo, useState } from 'react'
import { puedeAnadirAccesorios, type ArticuloLite, type ArticuloModelo, type Catalogo } from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { anadirAccesorioModelo, buscarArticulos, erroresDelServidor, getArticulosModelo, getCatalogo } from '../api/client'

/**
 * Accesorios por modelo (F1B-04, `remisiones` RQ-RE-33). Configuración → «Accesorios por modelo».
 *
 * REGLA 13 — qué es comodidad y qué es guarda (la tabla completa está en el `tasks.md` del cambio):
 *  - La entrada del menú la ve cualquiera; los controles sólo se ENSEÑAN si `puedeAnadirAccesorios(user)`, el MISMO predicado
 *    del servidor, consumido de `shared`. La guarda es el 403 de `apps/desk/server/routes/accesoriosModelo.ts`.
 *  - Sólo se ofrecen artículos de Books y no se pide clase ni nombre: el servidor fija clase, nombre y SKU desde Books y
 *    rechaza lo que no esté en Books (422).
 *  - No ofrece lo que ya está en la lista (comodidad); la guarda es el 409 de la misma ruta.
 *  - No hay retirar, reordenar ni copiar: el Director Técnico sólo añade (S-3).
 *  - Los errores del servidor (403, 422, 409) se enseñan tal cual, sin mensajes propios.
 */
export function AccesoriosModeloPanel({ onVolver }: { onVolver: () => void }) {
  const { user } = useAuth()
  const puede = !!user && puedeAnadirAccesorios(user)
  const catalogo = useAsync<Catalogo>(() => (puede ? getCatalogo() : Promise.resolve({ tipos: [], marcas: [], modelos: [] })), [puede])
  const [modeloId, setModeloId] = useState('')
  const lista = useAsync<ArticuloModelo[]>(() => (modeloId ? getArticulosModelo(modeloId) : Promise.resolve([])), [modeloId])
  const [errores, setErrores] = useState<string[]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<ArticuloLite[]>([])

  const marcas = useMemo(() => new Map((catalogo.data?.marcas ?? []).map((m) => [m.id, m.nombre])), [catalogo.data])
  const modelos = useMemo(
    () => (catalogo.data?.modelos ?? []).filter((m) => m.activo).map((m) => ({ id: m.id, texto: `${marcas.get(m.marcaId) ?? ''} ${m.nombre}`.trim() })).sort((a, b) => a.texto.localeCompare(b.texto)),
    [catalogo.data, marcas],
  )
  const accesorios = (lista.data ?? []).filter((a) => a.clase === 'accesorio' && a.activo)
  const yaEnLista = new Set(accesorios.map((a) => a.itemId ?? a.id))

  // Desde 2 caracteres, y `alive` para que una respuesta lenta no pise a otra más reciente (mismo criterio que el catálogo).
  useEffect(() => {
    if (q.trim().length < 2) { setResultados([]); return }
    let alive = true
    buscarArticulos(q).then((r) => { if (alive) setResultados(r) }).catch(() => {})
    return () => { alive = false }
  }, [q])

  async function anadir(a: ArticuloLite) {
    setEnviando(true); setErrores([]); setMensaje(null)
    try {
      await anadirAccesorioModelo(modeloId, a.id)
      setMensaje(`«${a.nombre}» añadido a la lista.`); setQ(''); setResultados([]); lista.reload()
    } catch (e) { setErrores(erroresDelServidor(e)) } finally { setEnviando(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onVolver} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Volver">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="text-[14px] font-semibold text-slate-700">Accesorios por modelo</span>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-[#f4f5f7]">
        <section className="max-w-[760px] bg-white border border-slate-200 rounded-md p-5 space-y-4">
          {!puede && <p className="text-[13px] text-slate-600">La lista de accesorios de cada modelo la completa el Director Técnico de Servicio Técnico.</p>}
          {puede && catalogo.loading && <p className="text-[13px] text-slate-500">Cargando…</p>}
          {puede && catalogo.error && <p className="text-[13px] text-red-600">No se pudo cargar el catálogo. <button onClick={catalogo.reload} className="underline">Reintentar</button></p>}
          {errores.length > 0 && <ul className="text-[13px] text-red-600 list-disc pl-5">{errores.map((e) => <li key={e}>{e}</li>)}</ul>}
          {mensaje && <p className="text-[13px] text-green-700">{mensaje}</p>}
          {puede && !catalogo.loading && (
            <>
              <label className="block text-[12px] text-slate-600">Modelo
                <select value={modeloId} onChange={(e) => { setModeloId(e.target.value); setErrores([]); setMensaje(null); setQ(''); setResultados([]) }} className="block w-full border rounded px-1 py-1 text-[13px]">
                  <option value="">Elige un modelo…</option>
                  {modelos.map((m) => <option key={m.id} value={m.id}>{m.texto}</option>)}
                </select>
              </label>
              {modeloId && (
                <>
                  {lista.loading && <p className="text-[13px] text-slate-500">Cargando…</p>}
                  {lista.error && <p className="text-[13px] text-red-600">No se pudo cargar la lista. <button onClick={lista.reload} className="underline">Reintentar</button></p>}
                  {!lista.loading && !lista.error && (
                    accesorios.length === 0
                      ? <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">Este modelo aún no tiene accesorios en su lista.</p>
                      : (
                        <table className="w-full text-[13px]">
                          <thead><tr className="text-left text-slate-500 border-b"><th className="py-1">SKU</th><th>Accesorio</th></tr></thead>
                          <tbody>
                            {accesorios.map((a) => (
                              <tr key={a.id} className="border-b">
                                <td className="py-1 w-[160px] font-mono text-[12px]">{a.sku ?? '—'}</td>
                                <td>{a.nombre}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                  )}
                  <div className="relative border-t pt-3">
                    <input className="border border-slate-200 rounded px-2 py-1 text-[12px] w-full" placeholder="+ accesorio de Zoho Books: código o nombre" value={q} disabled={enviando} onChange={(e) => setQ(e.target.value)} />
                    {resultados.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
                        {resultados.map((a) => {
                          const ya = yaEnLista.has(a.id)
                          return (
                            <li key={a.id}>
                              <button type="button" disabled={ya || enviando} onClick={() => void anadir(a)}
                                className={`w-full text-left px-2 py-1.5 text-[12px] ${ya ? 'text-slate-400 cursor-default' : 'hover:bg-slate-100'}`}>
                                <span className="font-bold">{a.sku}</span> · {a.nombre}
                                {a.categoria ? <span className="text-slate-400"> · {a.categoria}</span> : null}
                                {ya ? <span className="text-slate-400"> · ya está en la lista</span> : null}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500">Sólo se añade: el accesorio es un artículo de Zoho Books y el nombre y el SKU salen de allí. Un accesorio que no esté en la lista se anota en la remisión como novedad.</p>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
