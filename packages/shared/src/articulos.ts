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
  if (c.startsWith('c&r ')) return 'consumible'
  if (c.startsWith('opcional ')) return 'accesorio'
  return 'accesorio'
}
