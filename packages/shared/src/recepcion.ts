/**
 * Recepción de la remisión de entrada: lista de novedades como dato, y categorías de foto
 * (`recepcion-rotulacion-foto-entrada`, F1B-04; `remisiones` RQ-RE-21, RQ-RE-22).
 *
 * Puro, sin base ni red: el catálogo entra como ARGUMENTO. El servidor lo lee de `public.catalogo_novedades`
 * y el cliente de `GET /api/novedades-remision`; las reglas se deciden por las marcas (`excluyeDemas`,
 * `exigeTexto`, `activo`) y nunca por la clave ni por la etiqueta.
 */

/** Una fila del catálogo de novedades, tal como la sirve la ruta de lectura (camelCase, como el resto de la API). */
export interface NovedadCatalogo {
  clave: string
  etiqueta: string
  orden: number
  activo: boolean
  excluyeDemas: boolean
  exigeTexto: boolean
}

/** Categorías con que se etiqueta cada foto de la remisión de entrada. */
export const CATEGORIAS_FOTO = ['equipo', 'accesorios', 'embalaje', 'novedad'] as const
export type CategoriaFoto = (typeof CATEGORIAS_FOTO)[number]

/** Las tres que se exigen siempre en el formulario nuevo; la de `novedad` depende de lo marcado. */
export const CATEGORIAS_FOTO_MINIMAS = ['equipo', 'accesorios', 'embalaje'] as const

/** Novedades que se pueden marcar hoy: las activas, por `orden` (y por `clave` si empatan). No muta la entrada. */
export function novedadesActivas(catalogo: readonly NovedadCatalogo[]): NovedadCatalogo[] {
  return catalogo
    .filter((n) => n.activo)
    .sort((a, b) => a.orden - b.orden || a.clave.localeCompare(b.clave))
}
