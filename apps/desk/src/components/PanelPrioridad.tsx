import { useState } from 'react'
import { PRIORIDADES_ASIGNABLES, puedeFijarPrioridadTop5 } from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { ajustarPrioridadDelTicket, erroresDelServidor, prioridadDelTicket, type PrioridadDelTicket } from '../api/client'

/**
 * Prioridad del ticket en su ficha (prioridad-top5-cliente, F1B-07; `tickets-core` RQ-TC-29). Plegado por defecto.
 *
 * REGLA 13 — qué es comodidad y qué es guarda:
 *  - «Ajustar» sólo se ENSEÑA si el cliente del ticket es Top 5 (dato del servidor, `top5`) y `puedeFijarPrioridadTop5(user)`,
 *    el MISMO predicado del servidor (consumido de `shared`). La guarda es el 409 y el 403 de `POST /api/tickets/:id/prioridad`.
 *  - NO valida el motivo ni que la prioridad cambie: manda y enseña los `errors[]` del 422 del servidor (`ajusteDelCuerpo`).
 *  - La prioridad, el Top 5 y los ajustes salen sólo de `GET /api/tickets/:id/prioridad`; aquí no se calcula nada.
 */
export function PanelPrioridad({ ticketId, onCambio }: { ticketId: string; onCambio?: () => void }) {
  const { user } = useAuth()
  const { data, error, reload } = useAsync<PrioridadDelTicket>(() => prioridadDelTicket(ticketId), [ticketId])
  const [abierto, setAbierto] = useState(false)
  const [ajustando, setAjustando] = useState(false)
  const [prioridad, setPrioridad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  if (error || !data) return null
  const puedeAjustar = data.top5 && !!user && puedeFijarPrioridadTop5(user)

  async function ajustar() {
    setEnviando(true); setErrores([])
    try {
      await ajustarPrioridadDelTicket(ticketId, { prioridad, motivo })
      setAjustando(false); setPrioridad(''); setMotivo('')
      reload(); onCambio?.()
    } catch (e) {
      setErrores(erroresDelServidor(e))
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'border border-slate-200 rounded px-2 py-1 text-[13px]'
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 shrink-0">
      <button onClick={() => setAbierto((a) => !a)} className="font-bold text-slate-600">
        {abierto ? '▾' : '▸'} Prioridad: {data.prioridad ?? 'sin prioridad'}{data.top5 ? ` · cliente Top 5 (${data.prioridadTop5})` : ''}
      </button>
      {abierto && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {data.ajustes.length === 0
            ? <span className="text-slate-400">Sin ajustes a mano.</span>
            : (
              <ul className="flex flex-col gap-0.5">
                {data.ajustes.map((a) => (
                  <li key={`${a.ajustadoAt}|${a.a}`}>{a.ajustadoAt.slice(0, 10)} · {a.ajustadoPor}: {a.de ?? 'sin prioridad'} → {a.a} — {a.motivo}</li>
                ))}
              </ul>
            )}
          {puedeAjustar && !ajustando && (
            <button onClick={() => setAjustando(true)} className="self-start font-bold text-blue-600 hover:underline">Ajustar</button>
          )}
          {puedeAjustar && ajustando && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2 items-center">
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={campo}>
                  <option value="" disabled>Elegir…</option>
                  {PRIORIDADES_ASIGNABLES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo del ajuste" className={`${campo} flex-1`} />
              </div>
              {errores.length > 0 && <ul className="text-red-600">{errores.map((m) => <li key={m}>{m}</li>)}</ul>}
              <div className="flex gap-3">
                <button disabled={enviando} onClick={() => void ajustar()} className="font-bold bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">Guardar ajuste</button>
                <button disabled={enviando} onClick={() => { setAjustando(false); setErrores([]) }} className="text-slate-500 hover:underline">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
