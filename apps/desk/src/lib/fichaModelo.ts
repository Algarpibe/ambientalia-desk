/**
 * Qué hay pendiente de guardar en la ficha técnica de un modelo.
 *
 * Vive aparte del componente por la razón de siempre en esta pantalla: no hay harness de componentes
 * React en el proyecto, así que la lógica que puede romperse en silencio se aísla aquí con sus tests.
 *
 * Lo que compara son los TRES campos de formulario de la ficha —tipo, foto y SKU—, que es lo que
 * cubre el botón «Guardar». Las categorías, los artículos y los documentos no pasan por aquí: cada uno
 * es una acción atómica con su propia confirmación, y diferirlos a un guardado en bloque los dejaría
 * a medias entre lo que se ve y lo que hay.
 */
export interface FichaGuardada {
  tipoId: string | null
  sku: string | null
}

export interface EdicionFicha {
  /** Lo que hay elegido en el desplegable. Cadena vacía = «Sin tipo». */
  tipoId: string
  /** Lo tecleado en el campo de SKU, sin recortar: recortarlo es cosa de aquí. */
  sku: string
  /** Hay una foto elegida y todavía sin subir. */
  fotoPendiente: boolean
}

/**
 * Solo lleva las claves que DE VERDAD cambiaron.
 *
 * La presencia de la clave es la señal, y por eso no se puede colapsar con el valor: `sku: null`
 * significa «bórralo» y la ausencia de `sku` significa «no lo toques». Confundir las dos cosas borra
 * el SKU de un modelo cada vez que alguien abre la ficha para cambiarle la foto.
 */
export interface CambiosFicha {
  tipoId?: string | null
  sku?: string | null
  foto?: true
}

/** Cadena vacía y `null` son lo mismo para el servidor: ninguno de los dos es un valor. */
const aNuloSiVacio = (v: string): string | null => (v.trim() ? v.trim() : null)

export function cambiosFicha(guardado: FichaGuardada, edicion: EdicionFicha): CambiosFicha {
  const c: CambiosFicha = {}
  const tipo = aNuloSiVacio(edicion.tipoId)
  if (tipo !== (guardado.tipoId ?? null)) c.tipoId = tipo
  const sku = aNuloSiVacio(edicion.sku)
  if (sku !== (guardado.sku ?? null)) c.sku = sku
  if (edicion.fotoPendiente) c.foto = true
  return c
}

export const hayCambios = (c: CambiosFicha): boolean => Object.keys(c).length > 0
