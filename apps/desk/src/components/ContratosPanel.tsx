import { useEffect, useState } from 'react'
import { canExecuteTransition, type ClientLite, type Contrato } from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { crearContrato, listarContratos, mensajeDelServidor, searchClients } from '../api/client'
import { ContratoFicha } from './ContratoFicha'

/**
 * Contratos por lote (registro-contrato, lote 6; `tickets-core` RQ-TC-21). Configuración → «Contratos».
 *
 * REGLA 13 — qué es comodidad y qué es guarda:
 *  - El botón «Nuevo contrato» sólo se ENSEÑA a Comercial y administradores, con el MISMO predicado que usa el
 *    servidor (`canExecuteTransition`, consumido de `shared`). La guarda es `POST /api/contratos` (403).
 *  - El formulario NO valida nada: ni el formato del lote, ni las fechas, ni fin ≥ inicio, ni que el lote esté
 *    libre. Se manda y el 403/422/409 del servidor se ENSEÑA tal cual (`mensajeDelServidor`).
 *  - La lista no calcula el estado de ningún contrato: el estado lo trae la ficha, del servidor.
 *  - No hay edición ni borrado. La fecha de fin se amplía desde la ficha (ampliacion-contrato).
 */
export function ContratosPanel({ onVolver }: { onVolver: () => void }) {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync<Contrato[]>(() => listarContratos(), [])
  const [abierto, setAbierto] = useState<number | null>(null)
  const [alta, setAlta] = useState(false)
  const puedeCrear = !!user && canExecuteTransition(user.areas, user.isAdmin, 'Comercial')

  if (abierto != null) return <ContratoFicha id={abierto} onVolver={() => setAbierto(null)} />

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onVolver} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Volver">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="text-[14px] font-semibold text-slate-700">Contratos por lote</span>
        {puedeCrear && !alta && (
          <button onClick={() => setAlta(true)} className="ml-auto text-[12px] font-bold bg-blue-600 text-white px-3 py-1 rounded">Nuevo contrato</button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-6 bg-[#f4f5f7] flex flex-col gap-6">
        {alta && <AltaContrato onCancelar={() => setAlta(false)} onCreado={() => { setAlta(false); reload() }} />}
        <section className="max-w-[820px] bg-white border border-slate-200 rounded-md p-5">
          <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">Contratos registrados</h2>
          {error && <div className="text-[12px] text-red-600">No se pudieron cargar los contratos: {error}</div>}
          {!error && !loading && (data ?? []).length === 0 && <div className="text-[12px] text-slate-400">No hay contratos registrados.</div>}
          <table className="w-full text-[12px]">
            <tbody className="divide-y divide-slate-100">
              {(data ?? []).map((c) => (
                <tr key={c.id} onClick={() => setAbierto(c.id)} className="cursor-pointer hover:bg-slate-50">
                  <td className="py-2 font-bold text-slate-800">{c.lote}</td>
                  <td className="py-2 text-slate-500">Cliente {c.clientId}</td>
                  <td className="py-2 text-slate-500">{c.fechaInicio} → {c.fechaFin}</td>
                  <td className="py-2 text-slate-400">nº {c.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function AltaContrato({ onCancelar, onCreado }: { onCancelar: () => void; onCreado: () => void }) {
  const [q, setQ] = useState('')
  const [clientes, setClientes] = useState<ClientLite[]>([])
  const [cliente, setCliente] = useState<ClientLite | null>(null)
  const [lote, setLote] = useState('')
  const [fechaInicio, setInicio] = useState('')
  const [fechaFin, setFin] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cliente || q.trim().length < 2) { setClientes([]); return }
    let vivo = true
    searchClients(q.trim()).then((r) => { if (vivo) setClientes(r) }).catch(() => {})
    return () => { vivo = false }
  }, [q, cliente])

  async function guardar() {
    setEnviando(true); setError(null)
    try {
      await crearContrato({ clientId: cliente?.id ?? '', lote, fechaInicio, fechaFin })
      onCreado()
    } catch (e) {
      setError(mensajeDelServidor(e))
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'border border-slate-200 rounded px-2 py-1 text-[13px]'
  return (
    <section className="max-w-[820px] bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-3 text-[12px]">
      <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2">Nuevo contrato</h2>
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
      <label className="flex flex-col gap-1">Lote (OV madre)
        <input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="OV-AAAA-NNN" className={`${campo} w-[180px]`} />
      </label>
      <div className="flex gap-4">
        <label className="flex flex-col gap-1">Inicio<input type="date" value={fechaInicio} onChange={(e) => setInicio(e.target.value)} className={campo} /></label>
        <label className="flex flex-col gap-1">Fin<input type="date" value={fechaFin} onChange={(e) => setFin(e.target.value)} className={campo} /></label>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <div className="flex gap-3">
        <button disabled={enviando} onClick={() => void guardar()} className="font-bold bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">Registrar</button>
        <button disabled={enviando} onClick={onCancelar} className="text-slate-500 hover:underline">Cancelar</button>
      </div>
    </section>
  )
}
