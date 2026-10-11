import type { EstadoGarantia } from '@ambientalia/shared'

export interface DistintivoGarantiaVista { texto: string; clase: string; titulo?: string }

/**
 * Traduce la marca de garantía que manda el servidor (`Ticket.garantia`, F1B-18) a lo que se pinta.
 * No la calcula: el cálculo vive en `@ambientalia/shared` (`estadoGarantia`). Verde y gris a propósito:
 * el ámbar es de las esperas y de lo que alerta (RQ-VT-15). `vencida` y marca ausente no pintan nada.
 */
export function distintivoGarantia(estado: EstadoGarantia | null | undefined): DistintivoGarantiaVista | null {
  if (estado === 'en_garantia') return { texto: 'En garantía', clase: 'bg-green-50 text-green-700 border-green-200' }
  if (estado === 'sin_dato') {
    return {
      texto: 'Garantía sin dato',
      clase: 'bg-slate-100 text-slate-600 border-slate-300',
      titulo: 'El equipo no tiene registrado el fin de garantía: Comercial lo completa en la hoja de vida del equipo.',
    }
  }
  return null
}
