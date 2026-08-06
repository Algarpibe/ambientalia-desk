import type { Attachment } from '@ambientalia/shared'

/**
 * Los adjuntos de una entrada, con la misma forma en el hilo del ticket y en la hoja de vida del
 * equipo. Vive aparte porque las dos reglas no son evidentes y copiarlas mal no rompe nada visible:
 *
 * - `url` manda sobre `path`. Los adjuntos que no viven en Zoho —los enlaces de Drive, las fotos que
 *   sirve la propia app— no pueden pasar por el proxy `/api/attachment`, y `path` solo es el respaldo
 *   para los de Zoho.
 * - Solo se pinta miniatura de lo que viene marcado como imagen, nunca adivinando por la extensión:
 *   de un enlace de Drive no sabemos qué hay al otro lado.
 */
export function Adjuntos({ items }: { items: Attachment[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((att) => {
        // La `key` sale del enlace y no de `path`: los adjuntos generados son enlaces externos y
        // varios comparten entrada, así que la unicidad tiene que venir de ahí.
        const key = att.url ?? att.path
        const href = att.url ?? `/api/attachment?path=${encodeURIComponent(att.path)}`
        return att.isImage ? (
          <a key={key} href={href} target="_blank" rel="noreferrer" title={att.name}>
            <img
              src={href}
              alt={att.name}
              className="h-16 w-16 object-cover rounded border border-slate-200 hover:border-blue-400"
            />
          </a>
        ) : (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded w-[200px] hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-slate-400">description</span>
            <div className="flex-1 overflow-hidden">
              <div className="text-[11px] font-bold text-slate-700 truncate">{att.name}</div>
              <div className="text-[10px] text-slate-400 uppercase">{att.size}</div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">download</span>
          </a>
        )
      })}
    </div>
  )
}
