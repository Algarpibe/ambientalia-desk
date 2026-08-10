/**
 * Las columnas de la tabla de modelos del catálogo, y la preferencia del usuario sobre ellas.
 *
 * Vive aparte del componente porque es la única parte de esta pantalla que se puede probar: no hay
 * harness de componentes React en el proyecto, así que la lógica que puede romperse en silencio
 * —sanear lo que viene de `localStorage`, mover una columna— se aísla aquí con sus tests.
 */
export const COLUMNAS_CATALOGO = ['marca', 'modelo', 'tipo', 'articuloNombre', 'articuloCategoria', 'sku', 'estado'] as const
export type ColumnaCatalogo = (typeof COLUMNAS_CATALOGO)[number]

export const ETIQUETA_COLUMNA: Record<ColumnaCatalogo, string> = {
  marca: 'Marca',
  modelo: 'Modelo',
  tipo: 'Tipo',
  articuloNombre: 'Nombre',
  articuloCategoria: 'Categoría',
  sku: 'SKU',
  estado: 'Estado',
}

export interface PrefColumnas {
  /** Todas las columnas, en el orden elegido. Incluye también las ocultas. */
  orden: ColumnaCatalogo[]
  ocultas: ColumnaCatalogo[]
}

/**
 * `estado` sale oculta: el catálogo solo lista modelos ACTIVOS, así que esa columna diría «Activo» en
 * todas las filas. Se deja disponible para quien la quiera en vez de retirarla, porque la lista podría
 * incluir inactivos más adelante.
 */
export const PREF_POR_DEFECTO: PrefColumnas = {
  orden: [...COLUMNAS_CATALOGO],
  ocultas: ['estado'],
}

const esColumna = (v: unknown): v is ColumnaCatalogo => (COLUMNAS_CATALOGO as readonly unknown[]).includes(v)

/**
 * Sanea lo leído de `localStorage`.
 *
 * Las dos direcciones importan y las dos son fallos silenciosos si no se cubren: una columna **nueva**
 * en el código tiene que aparecerle también a quien ya tuviera un orden guardado (si no, la novedad
 * sería invisible justo para los que más usan la pantalla), y una columna **retirada** no puede
 * quedarse en el guardado, o la tabla intentaría pintar una cabecera que ya no existe.
 */
export function normalizarPref(guardado: unknown): PrefColumnas {
  if (!guardado || typeof guardado !== 'object') return PREF_POR_DEFECTO
  const g = guardado as { orden?: unknown; ocultas?: unknown }
  const orden = Array.isArray(g.orden) ? g.orden.filter(esColumna) : []
  if (!orden.length) return PREF_POR_DEFECTO
  // Las que el guardado no conocía van al final, en el orden en que están declaradas.
  for (const c of COLUMNAS_CATALOGO) if (!orden.includes(c)) orden.push(c)
  const ocultas = Array.isArray(g.ocultas) ? g.ocultas.filter(esColumna) : []
  return { orden, ocultas }
}

/** Coloca `desde` en la posición que ocupa `hasta`, corriendo el resto. */
export function moverColumna(
  orden: ColumnaCatalogo[], desde: ColumnaCatalogo, hasta: ColumnaCatalogo,
): ColumnaCatalogo[] {
  if (desde === hasta) return orden
  const destino = orden.indexOf(hasta)
  if (destino < 0 || orden.indexOf(desde) < 0) return orden
  // El índice se toma de la lista ORIGINAL y se inserta en la lista ya sin `desde`. Ese desfase de uno
  // es justo lo que hace que arrastrar a la derecha deje la columna DESPUÉS del destino y a la
  // izquierda ANTES, que es lo que espera quien arrastra. Buscar el índice en la lista recortada la
  // dejaba siempre delante.
  const sinLa = orden.filter((c) => c !== desde)
  return [...sinLa.slice(0, destino), desde, ...sinLa.slice(destino)]
}

/** Las columnas que se pintan, en orden. */
export function columnasVisibles(pref: PrefColumnas): ColumnaCatalogo[] {
  return pref.orden.filter((c) => !pref.ocultas.includes(c))
}
