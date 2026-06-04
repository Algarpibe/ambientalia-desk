import { useState } from 'react'
import { getHideEmptyColumns, setHideEmptyColumns } from '../boardSettings'

export function BoardConfig({ onClose }: { onClose: () => void }) {
  const [hideEmpty, setHide] = useState(getHideEmptyColumns)

  function toggleHideEmpty(value: boolean) {
    setHide(value)
    setHideEmptyColumns(value)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Configuración</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <section className="max-w-[640px]">
          <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-3">Tablero</h2>
          <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={hideEmpty}
              onChange={(e) => toggleHideEmpty(e.target.checked)}
            />
            <span>
              <span className="block text-[14px] font-medium text-slate-800">Ocultar columnas vacías</span>
              <span className="block text-[12px] text-slate-500">
                No mostrar en el tablero los estados que no tienen ningún ticket (0). Desactívalo para ver todas las columnas del flujo.
              </span>
            </span>
          </label>
          <p className="text-[11px] text-slate-400 mt-3">La preferencia se guarda en este navegador.</p>
        </section>
      </div>
    </div>
  )
}
