import { useState } from 'react'
import { puedeReasignar, etiquetaPersona, type PersonaLite } from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { erroresDelServidor, getPersonas, reasignarTicket } from '../api/client'
import { opcionesReasignacion, puedeEnviarReasignacion } from '../lib/reasignacion'

/**
 * Reasignar la persona a cargo del ticket sin cambiar de estado (reasignacion-con-motivo, F1B-05; `tickets-core` RQ-TC-52).
 * Plegado por defecto.
 *
 * REGLA 13 — qué es comodidad y qué es guarda:
 *  - El panel sólo se ENSEÑA si `puedeReasignar(user, ticket)`, el MISMO predicado del servidor (consumido de `shared`). La guarda
 *    es el 403 de `POST /api/tickets/:id/reasignar`.
 *  - El desplegable no ofrece a la persona a cargo ni «Sin derivar» y sólo trae personas activas; el botón se desactiva con el
 *    mismo validador de `shared` que usa la ruta (`puedeEnviarReasignacion`). La guarda es el 422 de la ruta.
 *  - Los errores son los que dice el servidor (`erroresDelServidor`), no uno propio.
 */
export function PanelReasignar({ ticketId, status, clasificacion, derivadoActual, onCambio }: {
  ticketId: string; status: string; clasificacion: string | null; derivadoActual: PersonaLite | null; onCambio?: () => void
}) {
  const { user } = useAuth()
  const { data: personas } = useAsync<PersonaLite[]>(() => getPersonas(), [])
  const [abierto, setAbierto] = useState(false)
  const [destino, setDestino] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  if (!user || !puedeReasignar(user, { status, classification: clasificacion })) return null
  const actualId = derivadoActual?.id ?? null

  async function reasignar() {
    setEnviando(true); setErrores([])
    try {
      await reasignarTicket(ticketId, { destino, motivo })
      setAbierto(false); setDestino(''); setMotivo('')
      onCambio?.()
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
        {abierto ? '▾' : '▸'} Reasignar · a cargo de: {derivadoActual ? etiquetaPersona(derivadoActual) : 'sin derivar'}
      </button>
      {abierto && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <div className="flex gap-2 items-center">
            <select value={destino} onChange={(e) => setDestino(e.target.value)} className={campo}>
              <option value="" disabled>Elegir…</option>
              {opcionesReasignacion(personas ?? [], actualId).map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la reasignación" className={`${campo} flex-1`} />
          </div>
          {errores.length > 0 && <ul className="text-red-600">{errores.map((m) => <li key={m}>{m}</li>)}</ul>}
          <div className="flex gap-3">
            <button disabled={enviando || !puedeEnviarReasignacion(destino, motivo, actualId)} onClick={() => void reasignar()} className="font-bold bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">Reasignar</button>
            <button disabled={enviando} onClick={() => { setAbierto(false); setErrores([]) }} className="text-slate-500 hover:underline">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
