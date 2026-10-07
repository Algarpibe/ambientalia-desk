import { CLASES_ARTICULO, type ClaseArticulo } from './types'
import type { SujetoDePermiso } from './cargos'
import { puedeMantenerNovedades } from './mantenimientoNovedades'

// Accesorios de la remisión de entrada (F1B-04, RQ-RE-32, RQ-RE-33, RQ-RE-35). Dominio puro, apto para navegador: el
// servidor impone estas reglas en las rutas del catálogo y la pantalla las consume, nunca las reescribe (regla invariable 13).

export const CLASE_ACCESORIO: ClaseArticulo = 'accesorio'

/** Las clases que siguen admitiendo un artículo escrito a mano. La pantalla la consume para su desplegable. */
export const CLASES_TEXTO_LIBRE: readonly ClaseArticulo[] = CLASES_ARTICULO.filter((c) => c !== CLASE_ACCESORIO)

/**
 * Los textos de error de las rutas, en un solo sitio: las pruebas los comparan contra esta constante, no contra literales.
 * `modelo`, `faltaArticulo` y `noEnBooks` repiten a propósito los literales de `routes/catalogo.ts`, que no se tocan.
 */
export const MENSAJES_ACCESORIOS = {
  exigeBooks: 'Un accesorio tiene que ser un artículo de Zoho Books: búscalo y elígelo de la lista',
  cambioSinBooks: 'Este artículo no viene de Zoho Books y no puede pasar a accesorio',
  modelo: 'Modelo no encontrado',
  permiso: 'Añadir accesorios a la lista de un modelo requiere el área Servicio Técnico y el cargo Director Técnico',
  faltaArticulo: 'Falta el artículo',
  noEnBooks: 'Artículo no encontrado en Zoho Books',
}

/** Núcleo: clase `accesorio` Y sin artículo de Books. «Sin» es falsy, el mismo criterio con que la ruta del catálogo decide su rama de Books. */
export function accesorioSinBooks(clase: ClaseArticulo, itemId: string | null | undefined): boolean {
  return clase === CLASE_ACCESORIO && !itemId
}

/** Alta: `exigeBooks` o `null`. */
export function motivoAltaAccesorio(clase: ClaseArticulo, itemId: string | null | undefined): string | null {
  return accesorioSinBooks(clase, itemId) ? MENSAJES_ACCESORIOS.exigeBooks : null
}

/**
 * Cambio de clase: `cambioSinBooks` sólo si la clase NUEVA es accesorio, la ACTUAL no lo es y no hay `itemId`. La fila que
 * YA es accesorio da `null`: una fila de legado sin artículo se puede desactivar con un `PATCH` que repita su clase.
 */
export function motivoCambioAAccesorio(actual: { clase: ClaseArticulo; itemId?: string | null }, claseNueva: ClaseArticulo): string | null {
  if (actual.clase === CLASE_ACCESORIO) return null
  return accesorioSinBooks(claseNueva, actual.itemId) ? MENSAJES_ACCESORIOS.cambioSinBooks : null
}

/** Permiso del Director Técnico (S-3: sólo añade). Es `puedeMantenerNovedades` tal cual: no repite su lógica. */
export function puedeAnadirAccesorios(s: SujetoDePermiso): boolean {
  return puedeMantenerNovedades(s)
}

export type CuerpoAccesorio = { ok: true; itemId: string } | { ok: false; error: string }

/**
 * Cuerpo de la ruta del Director Técnico. Un solo error: `faltaArticulo` si no es objeto o `itemId` no es cadena no vacía
 * tras recortar. Ignora `clase`, `nombre` y `sku` del cuerpo sin rechazarlos: los fija el servidor desde Books. Que el
 * artículo exista en Books necesita la base y es de la ruta.
 */
export function accesorioDelCuerpo(v: unknown): CuerpoAccesorio {
  const cuerpo = typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const itemId = typeof cuerpo.itemId === 'string' ? cuerpo.itemId.trim() : ''
  return itemId === '' ? { ok: false, error: MENSAJES_ACCESORIOS.faltaArticulo } : { ok: true, itemId }
}

export interface ItemChecklist { nombre: string; sku: string | null }

/** Accesorios de la lista del modelo → detalle. Deduplica por nombre exacto; gana la primera aparición; `sku` vacío es `null`. */
export function detalleDeAccesorios(articulos: readonly { clase: ClaseArticulo; nombre: string; sku?: string | null }[]): ItemChecklist[] {
  const vistos = new Set<string>()
  const detalle: ItemChecklist[] = []
  for (const a of articulos) {
    if (a.clase !== CLASE_ACCESORIO || vistos.has(a.nombre)) continue
    vistos.add(a.nombre)
    detalle.push({ nombre: a.nombre, sku: a.sku || null })
  }
  return detalle
}

/** Lista por perfil → detalle sin SKU (el perfil no lo guarda), deduplicada igual. */
export function detalleSinSku(items: readonly string[]): ItemChecklist[] {
  return [...new Set(items)].map((nombre) => ({ nombre, sku: null }))
}
