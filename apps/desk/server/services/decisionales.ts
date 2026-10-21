import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { DECISIONALES_APAGADO, SALIDAS_ESPERAS_APAGADO, type ContextoDecisionales, type ContextoSalidasEsperas } from '@ambientalia/shared'
import { destinatariosDeCargoPermiso } from '../db/avisos'

/**
 * El contexto de la regla de Decisionales (F1C-05, RQ-PM-30 y RQ-PM-31), el mismo para la guarda y para la ruta que lo
 * enseña al cliente. Apagado no consulta nada. Encendido, el Coordinador Técnico está vacante cuando ningún usuario
 * ACTIVO tiene ese `cargo_permiso` (S-1): nombrarlo quita al Especialista técnico sin tocar código.
 */
export async function contextoDecisionales(db: Queryable, activo: boolean): Promise<ContextoDecisionales> {
  if (!activo) return DECISIONALES_APAGADO
  return { activo: true, coordinadorTecnicoVacante: (await destinatariosDeCargoPermiso(db, 'Coordinador Técnico')).length === 0 }
}

/**
 * El contexto de las salidas de las esperas (F1C-03, RQ-PM-45), el mismo para la guarda de `ticketService.ts` y para la ruta que lo enseña
 * al cliente. Desde `decision/f1c03-quien-ejecuta-salidas` no consulta nada: la regla del ejecutor sólo mira el cargo de la sesión, así
 * que ya no lleva la vacante del Coordinador Técnico.
 */
export function contextoSalidasEsperas(activo: boolean): ContextoSalidasEsperas {
  return activo ? { activo: true } : SALIDAS_ESPERAS_APAGADO
}
