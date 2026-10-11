import { diaEnZona } from './fechasDerivadas'
import { diasHabilesEntre, type DiaCivil } from './calendarioLaboral'

/** Días hábiles que un ticket lleva en su estado: los POSTERIORES al día de entrada y hasta hoy inclusive (T1). `null` sin entrada legible (T3). */
export function diasHabilesEnEstado(desde: Date | string | null | undefined, ahora: Date, cierres: ReadonlySet<DiaCivil>): number | null {
  const entrada = diaEnZona(desde), hoy = diaEnZona(ahora)
  return entrada === null || hoy === null ? null : diasHabilesEntre(entrada, hoy, cierres)
}

/** El texto del distintivo (T2, T3). Campo AUSENTE (`undefined`) → `null`: nada que pintar (T5). */
export function textoTiempoEnEstado(dias: number | null | undefined): string | null {
  if (dias === undefined) return null
  if (dias === null) return 'Sin fecha de entrada'
  return dias < 1 ? 'Menos de 1 día hábil' : dias === 1 ? '1 día hábil' : `${dias} días hábiles`
}
