import { EXCEPCIONES_POR_CARGO, esCargo, puedeEjecutarTransicion, type Cargo, type SujetoDePermiso } from './cargos'
import { tipoEventoDeTransicion } from './tipoEvento'; import { IDS_FIRMA_CC } from './camposControlCalidad' // en la línea de otro import: uno nuevo desplazaría las citas del fichero (regla de mutación 4)

/**
 * Decisionales por cargo (F1C-05, RQ-PM-29; `decision/c10-permisos-cargo` y `decision/f1c05-decisionales-por-cargo`): una
 * transición Decisional sólo la ejecuta el Director o el Coordinador del área de la decisión. Regla pura y única para
 * servidor y cliente; sólo restringe, y sólo con el contexto encendido (`DECISIONALES_POR_CARGO`, que nace cerrado).
 */
export type AreaDeDecision = 'Servicio Técnico' | 'Comercial'

export interface ContextoDecisionales { activo: boolean; coordinadorTecnicoVacante: boolean }

export const DECISIONALES_APAGADO: ContextoDecisionales = Object.freeze({ activo: false, coordinadorTecnicoVacante: false })

/** Las de área mixta, por el área del estado de origen; `rechazo_garantia` es excepción expresa de Gerencia (su origen es de Compras). */
export const AREA_DE_DECISION_MIXTAS: Readonly<Record<string, AreaDeDecision>> = {
  rechazo_revision: 'Servicio Técnico', rechazo_comercial: 'Comercial', rechazo_garantia: 'Comercial',
}

/** El área que decide la transición: la de la tabla de mixtas o su `area` cuando es una de las dos; si no, `null`. */
export function areaDeDecision(t: { id: string; area: string }): AreaDeDecision | null {
  if (Object.hasOwn(AREA_DE_DECISION_MIXTAS, t.id)) return AREA_DE_DECISION_MIXTAS[t.id]
  return t.area === 'Servicio Técnico' || t.area === 'Comercial' ? t.area : null
}

/** Los cargos que ejecutan las Decisionales de un área. El Especialista técnico, sólo con el Coordinador Técnico vacante (S-1). */
export function cargosDecisionales(area: AreaDeDecision, coordinadorTecnicoVacante: boolean): readonly Cargo[] {
  if (area === 'Comercial') return ['Director Comercial', 'Coordinador Comercial']
  return coordinadorTecnicoVacante
    ? ['Director Técnico', 'Coordinador Técnico', 'Especialista técnico']
    : ['Director Técnico', 'Coordinador Técnico']
}

/**
 * Los cargos que ejecutan la Decisional cuando el sujeto no tiene ninguno; `null` si no restringe: contexto apagado,
 * administrador, tipo distinto de Decisional (resuelto por id) o transición de la lista corta, que decide
 * `cargoQueFaltaParaTransicion`. Sin área de decisión, `[]`: falla cerrada (S-6).
 */
export function cargosQueFaltanParaDecisional(
  t: { id: string; area: string },
  s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>,
  ctx: ContextoDecisionales,
): readonly Cargo[] | null {
  if (!ctx.activo || s.isAdmin) return null
  if (tipoEventoDeTransicion(t.id) !== 'Decisional') return null
  if (Object.hasOwn(EXCEPCIONES_POR_CARGO.transiciones, t.id) || IDS_FIRMA_CC.has(t.id)) return null // F1C-07 (RQ-PM-35): las dos de firma de control de calidad tienen regla propia, más estricta
  const area = areaDeDecision(t)
  const permitidos = area ? cargosDecisionales(area, ctx.coordinadorTecnicoVacante) : []
  return esCargo(s.cargoPermiso) && permitidos.includes(s.cargoPermiso) ? null : permitidos
}

/** Compuesta: área y lista corta (`puedeEjecutarTransicion`, intacta) Y la regla de Decisionales. Nunca amplía. */
export function puedeEjecutarTransicionConDecisionales(s: SujetoDePermiso, t: { id: string; area: string }, ctx: ContextoDecisionales): boolean {
  return puedeEjecutarTransicion(s, t) && cargosQueFaltanParaDecisional(t, s, ctx) === null
}

/** El texto del `403` de Decisionales. */
export function mensajeDecisional(nombreTransicion: string, cargos: readonly Cargo[]): string {
  return cargos.length === 0
    ? `La transición "${nombreTransicion}" es Decisional y no tiene área de decisión asignada`
    : `La transición "${nombreTransicion}" es Decisional: sólo la ejecutan los cargos ${cargos.join(', ')}`
}
