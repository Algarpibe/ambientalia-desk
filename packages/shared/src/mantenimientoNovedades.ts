import { canExecuteTransition } from './permissions'
import { esCargo, type Cargo, type SujetoDePermiso } from './cargos'
import type { NovedadCatalogo } from './recepcion'

/**
 * Mantenimiento de la lista de novedades de entrada (F1B-04, `remisiones` RQ-RE-29; `decision/f1b04-desplegables`:
 * «después, los cambios los hace el Director Técnico»). Regla pura: el servidor la impone y la pantalla la consume.
 *
 * El cargo no está en `EXCEPCIONES_POR_CARGO` de `cargos.ts`, que sería su sitio: añadirlo desplazaría ese fichero,
 * citado línea a línea en medio repositorio (regla de mutación 4). Tiene la misma forma que `puedeCrearOVIGarantia`.
 */
export const CARGO_MANTIENE_NOVEDADES: Cargo = 'Director Técnico'

/** Área Servicio Técnico Y cargo Director Técnico; el admin pasa. Supuesto S-1: el área del acto es Servicio Técnico. */
export function puedeMantenerNovedades(s: SujetoDePermiso): boolean {
  return canExecuteTransition(s.areas, s.isAdmin, 'Servicio Técnico')
    && (s.isAdmin || (esCargo(s.cargoPermiso) && s.cargoPermiso === CARGO_MANTIENE_NOVEDADES))
}

/** `contenido` → 422; `unicidad` → 409 (escalones C y D de F1B-10, en ese orden). */
export type RechazoNovedad = { ok: false; tipo: 'contenido' | 'unicidad'; error: string }
export type CambiosNovedad = Partial<Pick<NovedadCatalogo, 'etiqueta' | 'orden' | 'activo' | 'exigeTexto'>>

const CLAVE = /^[a-z0-9_]{2,40}$/
const contenido = (error: string): RechazoNovedad => ({ ok: false, tipo: 'contenido', error })
const unicidad = (error: string): RechazoNovedad => ({ ok: false, tipo: 'unicidad', error })
const normal = (s: string) => s.trim().toLocaleLowerCase('es')
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function etiquetaValida(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length >= 1 && t.length <= 80 ? t : null
}
const ordenValido = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 9999

export function altaNovedadDelCuerpo(cuerpo: unknown, catalogo: readonly NovedadCatalogo[]): { ok: true; novedad: NovedadCatalogo } | RechazoNovedad {
  if (!esObjeto(cuerpo)) return contenido('El cuerpo tiene que ser un objeto')
  const { clave, orden, exigeTexto, excluyeDemas } = cuerpo
  if (typeof clave !== 'string' || !CLAVE.test(clave)) return contenido('La clave tiene que tener entre 2 y 40 caracteres: minúsculas, números o guion bajo')
  const etiqueta = etiquetaValida(cuerpo.etiqueta)
  if (etiqueta === null) return contenido('La etiqueta es obligatoria y no puede pasar de 80 caracteres')
  if (orden !== undefined && !ordenValido(orden)) return contenido('El orden tiene que ser un entero entre 1 y 9999')
  if (exigeTexto !== undefined && typeof exigeTexto !== 'boolean') return contenido('«Exige texto» tiene que ser sí o no')
  if (excluyeDemas !== undefined && excluyeDemas !== false) return contenido('Sólo «Sin novedad» excluye a las demás')
  if (catalogo.some((n) => n.clave === clave)) return unicidad(`Ya existe una novedad con la clave ${clave}`)
  if (catalogo.some((n) => normal(n.etiqueta) === normal(etiqueta))) return unicidad(`Ya existe una novedad con la etiqueta «${etiqueta}»`)
  const ultimo = Math.max(0, ...catalogo.map((n) => n.orden))
  return { ok: true, novedad: { clave, etiqueta, orden: orden ?? ultimo + 10, activo: true, excluyeDemas: false, exigeTexto: exigeTexto ?? false } }
}

export function cambioNovedadDelCuerpo(cuerpo: unknown, actual: NovedadCatalogo, catalogo: readonly NovedadCatalogo[]): { ok: true; cambios: CambiosNovedad } | RechazoNovedad {
  if (!esObjeto(cuerpo)) return contenido('El cuerpo tiene que ser un objeto')
  if (cuerpo.clave !== undefined && cuerpo.clave !== actual.clave) return contenido('La clave de una novedad no se cambia')
  if (cuerpo.excluyeDemas !== undefined && cuerpo.excluyeDemas !== actual.excluyeDemas) return contenido('Sólo «Sin novedad» excluye a las demás, y no deja de hacerlo')
  const cambios: CambiosNovedad = {}
  if (cuerpo.etiqueta !== undefined) {
    const etiqueta = etiquetaValida(cuerpo.etiqueta)
    if (etiqueta === null) return contenido('La etiqueta es obligatoria y no puede pasar de 80 caracteres')
    cambios.etiqueta = etiqueta
  }
  if (cuerpo.orden !== undefined) {
    if (!ordenValido(cuerpo.orden)) return contenido('El orden tiene que ser un entero entre 1 y 9999')
    cambios.orden = cuerpo.orden
  }
  if (cuerpo.activo !== undefined) {
    if (typeof cuerpo.activo !== 'boolean') return contenido('«Activa» tiene que ser sí o no')
    if (!cuerpo.activo && actual.excluyeDemas) return contenido('«Sin novedad» no se retira: es la respuesta cuando el equipo llega bien')
    cambios.activo = cuerpo.activo
  }
  if (cuerpo.exigeTexto !== undefined) {
    if (typeof cuerpo.exigeTexto !== 'boolean') return contenido('«Exige texto» tiene que ser sí o no')
    cambios.exigeTexto = cuerpo.exigeTexto
  }
  if (Object.keys(cambios).length === 0) return contenido('No hay nada que cambiar')
  const etiqueta = cambios.etiqueta
  if (etiqueta !== undefined && catalogo.some((n) => n.clave !== actual.clave && normal(n.etiqueta) === normal(etiqueta))) {
    return unicidad(`Ya existe una novedad con la etiqueta «${etiqueta}»`)
  }
  return { ok: true, cambios }
}
