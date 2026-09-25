import { canExecuteTransition } from './permissions'
import type { CambioEquipo, CampoComercial } from './types'

/** Los seis campos comerciales de la hoja de vida del equipo (F1B-02, RQ-HV-01). */
export const CAMPOS_COMERCIALES: readonly CampoComercial[] = [
  'fechaAdquisicion', 'fechaFacturaCompra', 'finGarantia', 'codigoInterno', 'mantenedorId', 'driveUrl',
]

/**
 * Los tres campos que sólo puede CAMBIAR el área Comercial o un administrador (RQ-HV-09,
 * `decision/edicion-datos-comerciales-equipo`, `openspec/config.yaml:2775-2790`). Los otros tres
 * (adquisición, código interno, Drive) los puede cambiar cualquier sesión.
 */
export const CAMPOS_COMERCIALES_RESTRINGIDOS: readonly CampoComercial[] = ['fechaFacturaCompra', 'finGarantia', 'mantenedorId']

/** Etiqueta legible de cada campo comercial, para la sección «Cambios» de la hoja de vida. */
export const ETIQUETA_CAMPO_COMERCIAL: Record<CampoComercial, string> = {
  fechaAdquisicion: 'Fecha de adquisición',
  fechaFacturaCompra: 'Fecha de factura de compra',
  finGarantia: 'Fin de garantía',
  codigoInterno: 'Código interno',
  mantenedorId: 'Mantenedor',
  driveUrl: 'Enlace de Drive',
}

/**
 * ¿Puede esta sesión cambiar los tres campos comerciales restringidos? (D1). Consume la regla de área
 * ya existente (`canExecuteTransition`) sin cambiar su contrato: el administrador ya recibe las tres
 * áreas (`apps/desk/server/auth/users.ts:27`), así que `isAdmin` pasa igual por esa vía.
 */
export function puedeEditarCamposRestringidos(areas: string[], isAdmin: boolean): boolean {
  return canExecuteTransition(areas, isAdmin, 'Comercial')
}

/** Un cambio pendiente de registrar: el campo y sus dos valores, antes de saber quién ni cuándo. */
export type CambioComercial = Pick<CambioEquipo, 'campo' | 'anterior' | 'nuevo'>

/**
 * Compara los seis campos comerciales entre lo guardado y lo entrante (D2), y devuelve un cambio por
 * cada campo cuyo valor normalizado difiere. Omite la clave si `entrante` no la trae — una clave
 * ausente no cuenta como cambio, mismo criterio que ya sigue `camposHojaDeVida`
 * (`apps/desk/server/routes/equipos.ts:155-157`: `undefined` no entra en `campos`). Un valor presente
 * vacío o `null` normaliza a `null` (vaciar el campo). Sin `trim` ni validación de formato: sólo
 * compara cadenas, igual que hoy `camposHojaDeVida`.
 */
export function cambiosComerciales(guardado: Record<string, unknown>, entrante: Record<string, unknown>): CambioComercial[] {
  const cambios: CambioComercial[] = []
  for (const campo of CAMPOS_COMERCIALES) {
    if (entrante[campo] === undefined) continue
    const nuevo = entrante[campo] ? String(entrante[campo]) : null
    const anterior = guardado[campo] ? String(guardado[campo]) : null
    if (anterior !== nuevo) cambios.push({ campo, anterior, nuevo })
  }
  return cambios
}
