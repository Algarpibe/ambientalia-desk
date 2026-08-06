import { useState } from 'react'
import type { SalesOrderLite } from '@ambientalia/shared'
import { searchSalesOrders } from '../api/client'

/**
 * Buscador de órdenes de venta de Books, acotado al cliente del ticket. Lo usan el formulario de
 * remisión y el de transición, así que vive aparte: son dos sitios donde se captura el MISMO dato.
 *
 * Se busca en vez de teclear porque el número de una OV vive en otro sistema, y escrito a mano es la
 * vía más corta a un dato que no casa con nada. El servidor devuelve solo las CONFIRMADAS, así que
 * las anuladas y las facturadas no aparecen.
 *
 * Devuelve la OV entera y no su número porque los dos consumidores necesitan cosas distintas: el
 * formulario de remisión manda el `id` —el servidor resuelve número y fecha contra Books— y el de
 * transición usa el `number` y la `date` para rellenar sus campos.
 *
 * Lo que NO puede hacer, aunque la especificación lo pedía: filtrar por número de serie. Books no lo
 * tiene —una línea de OV apunta a un artículo de catálogo, no a una unidad serializada— y sus líneas
 * ni siquiera se replican a esta base. Lo que sí hay es `ticketNumber`, del campo `cf_n_ticket` de la
 * OV: por eso cada resultado dice a qué ticket se refiere, que es la señal buena para reconocerla.
 */
export function BuscadorOrdenVenta({ clientId, elegida, onElegir, placeholder, disabled }: {
  clientId?: string | null
  elegida: SalesOrderLite | { number: string } | null
  onElegir: (ov: SalesOrderLite | null) => void
  placeholder?: string
  /** El formulario que lo contiene ya no admite cambios (p. ej. la remisión ya se creó). */
  disabled?: boolean
}) {
  const [q, setQ] = useState('')
  const [opciones, setOpciones] = useState<SalesOrderLite[] | null>(null)
  const [buscando, setBuscando] = useState(false)

  async function buscar(texto: string) {
    setQ(texto)
    setBuscando(true)
    try {
      // Solo las libres: una OV que ya usa otro ticket no es una opción, es una equivocación
      // esperando a que alguien la elija.
      setOpciones(await searchSalesOrders(texto, clientId ?? undefined, true))
    } catch {
      // Un fallo al buscar no puede dejar el campo inservible: se avisa con la lista vacía y el
      // usuario puede reintentar tecleando otra vez.
      setOpciones([])
    } finally {
      setBuscando(false)
    }
  }

  if (elegida) {
    return (
      <div className="flex items-center gap-2">
        <input value={elegida.number} disabled className="flex-1 border border-slate-200 rounded p-2 text-[13px] bg-slate-50 text-slate-600 cursor-default" />
        {!disabled && (
          <button type="button" onClick={() => { onElegir(null); setOpciones(null); setQ('') }} className="text-[12px] text-slate-500 underline shrink-0">
            Cambiar
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        value={q}
        onChange={(e) => void buscar(e.target.value)}
        // Al hacer clic ya se ven las del cliente, sin teclear: quien abre este campo casi nunca se
        // sabe el número de memoria, y una lista vacía hasta que aciertas una letra no ayuda.
        // Solo la primera vez: después manda lo que el usuario haya escrito.
        onFocus={() => { if (!opciones && !buscando) void buscar('') }}
        disabled={disabled}
        placeholder={placeholder ?? (clientId ? 'Buscar orden de venta del cliente…' : 'Buscar orden de venta…')}
        className="border border-slate-200 rounded p-2 text-[13px] w-full disabled:bg-slate-50 disabled:cursor-default"
      />
      {buscando && <span className="text-[11px] text-slate-400">Buscando…</span>}
      {opciones && opciones.length === 0 && !buscando && (
        <span className="text-[11px] text-slate-400">
          {q ? 'Sin órdenes de venta libres para esa búsqueda.' : 'Este cliente no tiene órdenes de venta libres.'}
        </span>
      )}
      {opciones && opciones.length > 0 && (
        <ul className="border border-slate-200 rounded max-h-[180px] overflow-auto">
          {opciones.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onElegir(o)}
                className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-blue-50 flex flex-col"
              >
                <span className="font-bold text-slate-700">
                  {o.number}
                  {/* Qué ticket dice la OV que le corresponde. Es lo que sustituye al filtro por
                      serial que Books no permite. */}
                  {o.ticketNumber && <span className="ml-2 text-[10px] font-bold text-blue-600">Ticket #{o.ticketNumber}</span>}
                </span>
                <span className="text-slate-400">{[o.customerName, o.date].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
