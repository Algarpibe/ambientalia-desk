import { textoTiempoEnEstado } from '@ambientalia/shared'

/** Tiempo en el estado, en días hábiles (F1B-07, RQ-VT-16). Sólo pinta: el número viene del servidor y el texto de `shared`. Gris siempre (T4): informa, no alarma. */
export function DistintivoTiempoEnEstado({ dias }: { dias?: number | null }) {
  const texto = textoTiempoEnEstado(dias)
  if (!texto) return null
  return <span className="shrink-0 font-bold rounded border whitespace-nowrap text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 border-slate-300">{texto}</span>
}
