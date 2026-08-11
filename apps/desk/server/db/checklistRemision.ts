import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { listarArticulosDeModelo } from './catalogoArticulos'
import { getChecklist } from './remisionChecklist'

export interface ChecklistRemision {
  /** Lo que el técnico verifica al recibir el equipo, en el orden definido en la ficha del modelo. */
  items: string[]
  /**
   * De dónde salió la lista. Lo consume la pantalla para redactar el vacío: «este modelo aún no tiene
   * lista» (accionable) no es lo mismo que «este tipo de equipo no lleva accesorios» (una afirmación
   * que nadie ha comprobado).
   */
  origen: 'modelo' | 'perfil'
}

/**
 * El checklist «Incluye» de una remisión de entrada.
 *
 * **Sale de la lista de ACCESORIOS del modelo del equipo**, que es el cambio de la fase 2. Antes salía
 * de `remision_checklist`, indexada por un perfil que agrupaba familias enteras —todos los `ap*` de
 * Horiba compartían lista—, así que un APMA y un APSA recibían lo mismo aunque no lleven lo mismo.
 *
 * Solo los **accesorios**: «Incluye» es lo que ACOMPAÑA al equipo cuando entra, y un filtro o una bomba
 * de repuesto no vienen con él. Y solo los activos, en el orden de la ficha, que se eligió pensando en
 * cómo se recorre el equipo de verdad.
 *
 * **Sin modelo se cae al perfil de siempre.** Un ticket sin equipo enlazado —los ~79 históricos que
 * nunca se pudieron enlazar— no tiene modelo del que colgar la lista, y dejarlo sin nada sería quitarle
 * lo que ya tenía. `remision_checklist` sigue viva justamente como esa red.
 */
export async function checklistDeRemision(
  db: Queryable,
  opts: { modeloId: string | null; perfil: string },
): Promise<ChecklistRemision> {
  if (!opts.modeloId) {
    return { items: await getChecklist(db, opts.perfil), origen: 'perfil' }
  }
  const articulos = await listarArticulosDeModelo(db, opts.modeloId)
  return {
    items: articulos.filter((a) => a.clase === 'accesorio').map((a) => a.nombre),
    origen: 'modelo',
  }
}
