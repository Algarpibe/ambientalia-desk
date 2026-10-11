import type { EstadoGarantia } from '@ambientalia/shared'
import { distintivoGarantia } from '../lib/distintivoGarantia'

/** «En garantía» / «Garantía sin dato» (F1B-18, RQ-VT-15). Sin marca útil no pinta nada. */
export function DistintivoGarantia({ estado, tamano = 'sm' }: { estado?: EstadoGarantia | null; tamano?: 'sm' | 'md' }) {
  const d = distintivoGarantia(estado)
  if (!d) return null
  const t = tamano === 'md' ? 'text-[11px] px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5'
  return <span title={d.titulo} className={`shrink-0 font-bold rounded border whitespace-nowrap ${t} ${d.clase}`}>{d.texto}</span>
}
