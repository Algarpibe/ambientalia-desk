import { useState } from 'react'
import { canExecuteTransition } from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { listarOvAsociaciones, liberarOvAsociacion, mensajeDelServidor, type OvAsociacion } from '../api/client'

/**
 * Las órdenes de venta de un ticket, vigentes y liberadas (asociacion-ov-ticket, lote 6; RQ-TC-20).
 *
 * REGLA 13 — qué es comodidad y qué es guarda:
 *  - El botón «Liberar» sólo se ENSEÑA a Comercial y administradores, con el MISMO predicado que usa el
 *    servidor (`canExecuteTransition`, consumido de `@ambientalia/shared`, no reescrito). La guarda es la
 *    ruta `PUT /api/ov-asociaciones/:id/liberar` (403).
 *  - El motivo obligatorio y la asociación ya liberada NO se comprueban aquí: se manda la petición y el
 *    error del servidor (403, 409, 422) se ENSEÑA tal cual. Duplicar esas comprobaciones en el cliente
 *    sería reescribir una regla que el servidor ya impone.
 */

const fmt = (iso: string | null) => (iso ? iso.slice(0, 10) : '—')

function Fila({ a, puedeLiberar, onCambio }: { a: OvAsociacion; puedeLiberar: boolean; onCambio: () => void }) {
  const [pidiendo, setPidiendo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const liberada = a.liberada_at != null

  async function liberar() {
    setEnviando(true)
    setError(null)
    try {
      await liberarOvAsociacion(a.id, motivo)
      setPidiendo(false)
      setMotivo('')
      onCambio()
    } catch (e) {
      setError(mensajeDelServidor(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <li className={`px-3 py-2 text-[12px] ${liberada ? 'bg-slate-50 text-slate-500' : 'text-slate-700'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-bold text-slate-800">{a.numero}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${liberada ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {liberada ? 'Liberada' : 'Vigente'}
        </span>
        <span>Origen: {a.origen}</span>
        <span>Asociada el {fmt(a.asociada_at)}{a.asociada_por ? ` por ${a.asociada_por}` : ''}</span>
        {!liberada && puedeLiberar && !pidiendo && (
          <button onClick={() => setPidiendo(true)} className="ml-auto text-[11px] font-bold text-blue-600 hover:underline">Liberar</button>
        )}
      </div>
      {liberada && (
        <div className="mt-1">
          Liberada el {fmt(a.liberada_at)}{a.liberada_por ? ` por ${a.liberada_por}` : ''} — motivo: {a.motivo_liberacion ?? '—'}
        </div>
      )}
      {pidiendo && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de la liberación"
            className="flex-1 min-w-[200px] border border-slate-200 rounded px-2 py-1 text-[12px]"
          />
          <button disabled={enviando} onClick={liberar} className="text-[11px] font-bold bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50">Confirmar</button>
          <button disabled={enviando} onClick={() => { setPidiendo(false); setError(null) }} className="text-[11px] text-slate-500 hover:underline">Cancelar</button>
        </div>
      )}
      {error && <div className="mt-1 text-red-600">{error}</div>}
    </li>
  )
}

export function PanelOvAsociaciones({ ticketId }: { ticketId: string }) {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync<OvAsociacion[]>(() => listarOvAsociaciones(ticketId), [ticketId])
  const [abierto, setAbierto] = useState(false)
  const puedeLiberar = !!user && canExecuteTransition(user.areas, user.isAdmin, 'Comercial')
  const filas = data ?? []
  const vigentes = filas.filter((a) => a.liberada_at == null).length

  return (
    <div className="border-t border-slate-200 bg-white shrink-0">
      <button onClick={() => setAbierto((v) => !v)} className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800">
        ÓRDENES DE VENTA ({loading ? '…' : `${vigentes} vigentes, ${filas.length - vigentes} liberadas`})
      </button>
      {abierto && (
        <div className="max-h-[220px] overflow-y-auto">
          {error && <div className="px-3 py-2 text-[12px] text-red-600">No se pudieron cargar las órdenes de venta: {error}</div>}
          {!error && filas.length === 0 && !loading && <div className="px-3 py-2 text-[12px] text-slate-400">Este ticket no tiene órdenes de venta asociadas.</div>}
          <ul className="divide-y divide-slate-100">
            {filas.map((a) => <Fila key={a.id} a={a} puedeLiberar={puedeLiberar} onCambio={reload} />)}
          </ul>
        </div>
      )}
    </div>
  )
}
