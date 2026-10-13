import { useState } from 'react'
import { confirmarRotulado, type RemisionConFotos } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { vistaRotulado } from '../lib/rotuladoVista'

/**
 * Rotulado de la remisión, tras el envío (rotulado-tras-enviar, RQ-RE-40 y RQ-RE-41). Sólo pinta lo que dice
 * `vistaRotulado` y llama a la acción; la condición y el permiso los decide el servidor. Informa, no alarma:
 * ni colores de error ni nada bloqueado. Si la acción falla, enseña el texto que mandó el servidor y no más.
 */
export function ConfirmarRotulado({ rem, onConfirmado }: { rem: RemisionConFotos; onConfirmado: (r: RemisionConFotos) => void }) {
  const { user } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const vista = vistaRotulado(rem, user)

  if (vista.tipo === 'nada') return null
  if (vista.tipo === 'confirmado') return <div className="text-[12px] text-slate-600">{vista.texto}</div>

  const confirmar = async () => {
    setEnviando(true); setAviso(null)
    try { onConfirmado(await confirmarRotulado(rem.id)) } catch (e) { setAviso(e instanceof Error ? e.message : 'No se pudo confirmar el rotulado.') } finally { setEnviando(false) }
  }

  return (
    <div className="text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded p-2 flex flex-col gap-1.5">
      <span><b>Pendiente de rotular</b></span>
      {vista.puedeConfirmar
        ? <button type="button" onClick={confirmar} disabled={enviando}
            className="w-fit text-[12px] font-bold text-[#2C7BE5] border border-[#2C7BE5] px-3 py-1 rounded hover:bg-blue-50 disabled:opacity-50">
            {enviando ? 'Confirmando…' : 'Confirmar rotulado y guardado'}
          </button>
        : <span className="text-slate-500">Lo confirma Servicio Técnico</span>}
      {aviso && <span className="text-slate-600">{aviso}</span>}
    </div>
  )
}
