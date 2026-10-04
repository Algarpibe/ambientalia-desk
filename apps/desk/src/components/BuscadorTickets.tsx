import { useState, useEffect } from 'react'
import { BUSQUEDA_MAX } from '@ambientalia/shared'
import { aplazar, ESPERA_BUSQUEDA_MS } from '../lib/busquedaTickets'

/**
 * Caja de búsqueda del listado por número de ticket o por serial (RQ-VT-11). Sin lógica de dominio:
 * envía el texto tal cual, tras una espera, y el servidor lo recorta, lo normaliza y lo valida. El
 * `maxLength` es comodidad; el límite lo impone el servidor con `422`.
 */
export function BuscadorTickets({ onBuscar }: { onBuscar: (q: string) => void }) {
  const [texto, setTexto] = useState('')
  useEffect(() => aplazar(() => onBuscar(texto), ESPERA_BUSQUEDA_MS), [texto, onBuscar])
  return (
    <div className="relative">
      <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
      <input
        type="search"
        value={texto}
        maxLength={BUSQUEDA_MAX}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar por número o serial"
        aria-label="Buscar por número de ticket o por serial"
        className="w-56 pl-8 pr-2 py-1.5 border border-slate-200 rounded text-[13px] text-slate-700 bg-white focus:outline-none focus:border-blue-400"
      />
    </div>
  )
}
