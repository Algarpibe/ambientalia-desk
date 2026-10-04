import { useEffect, useState } from 'react'
import { PRIORIDADES_ASIGNABLES, puedeFijarPrioridadTop5, type ClientLite, type PrioridadAsignable } from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { erroresDelServidor, fijarPrioridadDelCliente, listarTop5, searchClients, type ClienteTop5 } from '../api/client'

/**
 * Clientes Top 5 y su prioridad (prioridad-top5-cliente, F1B-07; `tickets-core` RQ-TC-27). Configuración → «Clientes Top 5 y prioridad».
 *
 * REGLA 13 — qué es comodidad y qué es guarda:
 *  - Los controles de edición sólo se ENSEÑAN si `puedeFijarPrioridadTop5(user)`, el MISMO predicado que usa el servidor
 *    (consumido de `shared`, no reescrito). La guarda es el 403 de `PUT /api/clients/:id/prioridad`.
 *  - El `<select>` ofrece `PRIORIDADES_ASIGNABLES` (de `shared`); la guarda de la lista es el 422 del mismo `PUT`.
 *  - El formulario NO valida nada: manda y enseña los `errors[]` del servidor tal cual.
 *  - La lista y su recuento («N clientes», sin tope) son lo que devuelve `GET /api/top5`; la lee cualquier usuario con sesión.
 */
export function Top5Panel({ onVolver }: { onVolver: () => void }) {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync<ClienteTop5[]>(() => listarTop5(), [])
  const puedeEditar = !!user && puedeFijarPrioridadTop5(user)
  const [errores, setErrores] = useState<string[]>([]); const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const lista = data ?? []

  async function mandar(clientId: string, cuerpo: { top5: boolean; prioridad: PrioridadAsignable | null }) {
    setEnviando(true); setErrores([]); setAviso('')
    try {
      const r = await fijarPrioridadDelCliente(clientId, cuerpo); const n = r.ticketsCambiados ?? 0; if (n > 0) setAviso(`${n} ${n === 1 ? 'ticket abierto actualizado' : 'tickets abiertos actualizados'}`)
      reload()
    } catch (e) {
      setErrores(erroresDelServidor(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onVolver} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Volver">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="text-[14px] font-semibold text-slate-700">Clientes Top 5 y prioridad</span>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-[#f4f5f7] flex flex-col gap-6">
        {puedeEditar && <AgregarTop5 enviando={enviando} onAgregar={(id, p) => void mandar(id, { top5: true, prioridad: p })} />}
        {errores.length > 0 && (
          <ul className="max-w-[820px] text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {errores.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}
        {aviso && <div className="max-w-[820px] text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2">{aviso}</div>}
        <section className="max-w-[820px] bg-white border border-slate-200 rounded-md p-5">
          <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
            Clientes Top 5{!error && !loading && ` · ${lista.length} ${lista.length === 1 ? 'cliente' : 'clientes'}`}
          </h2>
          {error && <div className="text-[12px] text-red-600">No se pudo cargar la lista: {error}</div>}
          {!error && !loading && lista.length === 0 && <div className="text-[12px] text-slate-400">Ningún cliente está marcado como Top 5.</div>}
          <table className="w-full text-[12px]">
            <tbody className="divide-y divide-slate-100">
              {lista.map((c) => (
                <tr key={c.clientId}>
                  <td className="py-2 font-bold text-slate-800">{c.name}</td>
                  <td className="py-2 text-slate-500">
                    {puedeEditar
                      ? <SelectorPrioridad valor={c.prioridad ?? ''} disabled={enviando} onChange={(p) => void mandar(c.clientId, { top5: true, prioridad: p })} />
                      : c.prioridad}
                  </td>
                  <td className="py-2 text-slate-400">{c.actualizadoPor ? `por ${c.actualizadoPor}` : ''}</td>
                  <td className="py-2 text-right">
                    {puedeEditar && <button disabled={enviando} onClick={() => void mandar(c.clientId, { top5: false, prioridad: null })} className="text-red-600 hover:underline disabled:opacity-50">Quitar Top 5</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function SelectorPrioridad({ valor, onChange, disabled }: { valor: string; onChange: (p: PrioridadAsignable) => void; disabled?: boolean }) {
  return (
    <select value={valor} disabled={disabled} onChange={(e) => onChange(e.target.value as PrioridadAsignable)} className="border border-slate-200 rounded px-2 py-1 text-[13px]">
      <option value="" disabled>Elegir…</option>
      {PRIORIDADES_ASIGNABLES.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  )
}

/** Buscador de Books (`searchClients`) para marcar un cliente nuevo; la prioridad se manda tal cual, el servidor decide si vale. */
function AgregarTop5({ onAgregar, enviando }: { onAgregar: (clientId: string, p: PrioridadAsignable | null) => void; enviando: boolean }) {
  const [q, setQ] = useState('')
  const [clientes, setClientes] = useState<ClientLite[]>([])
  const [cliente, setCliente] = useState<ClientLite | null>(null)
  const [prioridad, setPrioridad] = useState<PrioridadAsignable | ''>('')

  useEffect(() => {
    if (cliente || q.trim().length < 2) { setClientes([]); return }
    let vivo = true
    searchClients(q.trim()).then((r) => { if (vivo) setClientes(r) }).catch(() => {})
    return () => { vivo = false }
  }, [q, cliente])

  const campo = 'border border-slate-200 rounded px-2 py-1 text-[13px]'
  return (
    <section className="max-w-[820px] bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-3 text-[12px]">
      <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2">Marcar un cliente como Top 5</h2>
      <label className="flex flex-col gap-1">Cliente
        {cliente
          ? <span className="text-slate-800">{cliente.name} <button onClick={() => { setCliente(null); setQ('') }} className="text-blue-600 hover:underline ml-2">cambiar</button></span>
          : <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o NIT" className={campo} />}
        {!cliente && clientes.length > 0 && (
          <ul className="border border-slate-200 rounded max-h-40 overflow-auto">
            {clientes.map((c) => <li key={c.id}><button onClick={() => setCliente(c)} className="w-full text-left px-2 py-1 hover:bg-slate-50">{c.name}</button></li>)}
          </ul>
        )}
      </label>
      <label className="flex flex-col gap-1">Prioridad
        <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as PrioridadAsignable)} className={`${campo} w-[180px]`}>
          <option value="" disabled>Elegir…</option>
          {PRIORIDADES_ASIGNABLES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <div>
        <button disabled={enviando || !cliente} onClick={() => { if (cliente) { onAgregar(cliente.id, prioridad === '' ? null : prioridad); setCliente(null); setQ(''); setPrioridad('') } }} className="font-bold bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">Marcar Top 5</button>
      </div>
    </section>
  )
}
