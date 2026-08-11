/**
 * Mueve un elemento de una lista a la posición de otro, como espera quien arrastra.
 *
 * Sale de `moverColumna`, que hacía justo esto para las cabeceras de la tabla del catálogo. Se
 * generalizó al hacer reordenables los artículos de un modelo: son el mismo gesto sobre otra lista, y
 * dos copias del mismo desfase de índices se habrían desincronizado a la primera corrección.
 */
export function moverEnLista<T>(lista: readonly T[], desde: T, hasta: T): T[] {
  if (desde === hasta) return [...lista]
  const destino = lista.indexOf(hasta)
  if (destino < 0 || lista.indexOf(desde) < 0) return [...lista]
  // El índice se toma de la lista ORIGINAL y se inserta en la lista ya sin `desde`. Ese desfase de uno
  // es justo lo que hace que arrastrar hacia abajo deje el elemento DESPUÉS del destino y hacia arriba
  // ANTES, que es lo que espera quien arrastra. Buscar el índice en la lista recortada lo dejaba
  // siempre delante.
  const sinEl = lista.filter((c) => c !== desde)
  return [...sinEl.slice(0, destino), desde, ...sinEl.slice(destino)]
}
