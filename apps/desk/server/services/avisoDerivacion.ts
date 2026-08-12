export interface CambioDerivacion {
  /** A quién estaba derivado el ticket ANTES de esta transición. */
  anterior: string | null
  /** A quién queda derivado. `null` = se vació. */
  nuevo: string | null
  actorId: string
  actorNombre: string
  ticketNumero: number
  transicion: string
}

export interface AvisoNuevo {
  /** A quién se le avisa. */
  userId: string
  texto: string
}

/**
 * Si una transición debe generar un aviso, y con qué texto.
 *
 * Es función pura y vive aparte de la escritura porque las tres reglas son el grueso de la
 * funcionalidad, y son justo lo que se rompe en silencio: un aviso de más no falla nada, solo
 * convierte la campana en ruido que la gente aprende a ignorar.
 *
 * - **La persona no cambia** → nada. La casilla llega PRELLENADA en cada etapa, así que confirmar
 *   cinco transiciones seguidas sin tocarla reenviaría el mismo aviso cinco veces.
 * - **Derivarse a uno mismo** → nada. Ya lo sabe: acaba de hacerlo.
 * - **Vaciar la derivación** → nada. No le da trabajo a nadie.
 */
export function avisoDerivacion(c: CambioDerivacion): AvisoNuevo | null {
  if (!c.nuevo) return null
  if (c.nuevo === c.anterior) return null
  if (c.nuevo === c.actorId) return null
  return {
    userId: c.nuevo,
    texto: `${c.actorNombre} te derivó el ticket #${c.ticketNumero} en «${c.transicion}»`,
  }
}
