import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { DECISIONALES_APAGADO, type ContextoDecisionales } from '@ambientalia/shared'
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
