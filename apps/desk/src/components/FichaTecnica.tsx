import { useEffect, useState } from 'react'
import type { FichaModelo } from '@ambientalia/shared'
import { getFichaModelo, urlDocumento } from '../api/client'

/**
 * La ficha de un modelo, en solo lectura. La usan la hoja de vida y el panel del ticket, por eso vive
 * aparte de las dos: es el mismo dato enseñado en dos sitios, y duplicarlo garantizaría que uno de
 * los dos se quedara atrás.
 *
 * `compacto` es para el panel de propiedades del ticket, que es estrecho y ya va cargado: ahí la foto
 * va pequeña y los documentos como una lista de enlaces, sin cabecera propia.
 *
 * Un modelo sin ficha **no pinta nada**, ni siquiera un bloque vacío: en el ticket sería ruido en una
 * pantalla que ya tiene bastante.
 */
export function FichaTecnica({ modeloId, compacto = false }: { modeloId: string; compacto?: boolean }) {
  const [ficha, setFicha] = useState<FichaModelo | null>(null)

  useEffect(() => {
    let vivo = true
    getFichaModelo(modeloId).then((f) => { if (vivo) setFicha(f) }).catch(() => {})
    return () => { vivo = false }
  }, [modeloId])

  if (!ficha) return null
  const vacia = !ficha.foto && ficha.documentos.length === 0 && !ficha.sku
  if (vacia) return null

  // Un documento —la foto incluida— es un enlace o un fichero. Si tiene `url` se abre esa; si no, se
  // pide por el proxy autenticado. La foto sigue la misma regla: también puede haberse dado de alta
  // como enlace, y asumir siempre el proxy la dejaría rota.
  const enlaceDe = (d: FichaModelo['documentos'][number]) => d.url ?? urlDocumento(modeloId, d.id)

  return (
    <section className={compacto ? 'flex flex-col gap-2' : 'border border-slate-200 rounded p-3 flex gap-4'}>
      {ficha.foto && (
        <img
          src={enlaceDe(ficha.foto)}
          alt={ficha.foto.nombre}
          className={compacto ? 'w-full max-h-[120px] object-contain rounded border border-slate-200' : 'w-[140px] h-[140px] object-contain rounded border border-slate-200 shrink-0'}
        />
      )}
      <div className="flex-1 min-w-0">
        {!compacto && <h3 className="text-[13px] font-bold text-slate-700 mb-1">Ficha técnica</h3>}
        {ficha.sku && <div className="text-[12px] text-slate-500 mb-1">SKU: <span className="text-slate-700">{ficha.sku}</span></div>}
        {ficha.documentos.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {ficha.documentos.map((d) => (
              <li key={d.id}>
                <a href={enlaceDe(d)} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-600 hover:underline">
                  {d.nombre}
                </a>
                <span className="text-[11px] text-slate-400 ml-1">· {d.tipo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
