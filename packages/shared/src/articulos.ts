import type { ClaseArticulo } from './types'

/**
 * Qué clase proponer para un artículo, a partir de su categoría en Zoho Books.
 *
 * Es una **propuesta**, no una clasificación: quien da de alta el artículo la confirma o la cambia. La
 * asociación automática quedó descartada tras medirla —Books agrupa por familia y el catálogo nombra el
 * modelo—, y esto es lo único que sí se puede afirmar mirando la categoría.
 *
 * `C&R …` mete consumibles y repuestos en el mismo saco, así que de ahí solo sale «uno de los dos»: se
 * propone **consumible** por ser el caso frecuente y se cambia de un clic.
 *
 * Sin prefijo reconocible cae en **accesorio**, a propósito: es la lista que hoy se usa de verdad —el
 * checklist que el técnico verifica al recibir el equipo—, así que una clasificación equivocada se nota
 * antes ahí que escondida entre repuestos que nadie mira hasta que hacen falta.
 */
export function clasePropuesta(categoria: string | null | undefined): ClaseArticulo {
  const c = (categoria ?? '').trim().toLowerCase()
  if (c.startsWith('c&r ')) return 'consumible_repuesto'
  if (c.startsWith('opcional ')) return 'accesorio'
  return 'accesorio'
}

/**
 * ¿Esta clase se asigna por categorías de Zoho Books, o artículo a artículo?
 *
 * La categoría trae **bloques**: una de serie arrastra decenas de artículos, y eso solo compensa en
 * consumibles y repuestos, donde la lista es la misma para toda la serie. En accesorios se probó y se
 * retiró —la mayoría no aplicaba a la variante concreta y acababa desactivándose uno a uno—, y la mano
 * de obra nace ya con esa lección aprendida.
 *
 * Vive aquí, y no como un literal en cada sitio, porque la consultan DOS capas: la pantalla, para
 * mostrar el desplegable, y el servidor, para rechazar con 422 lo que llegue por la API a mano. Cuando
 * eran dos literales negados, cada clase nueva heredaba el desplegable sin que nadie lo decidiera.
 */
export function admiteCategorias(clase: ClaseArticulo): boolean {
  return clase === 'consumible_repuesto'
}
