import { ORIGEN_VALOR_MANUAL, ORIGEN_VALOR_OVI, type GarantiaProveedor, type OrigenValorReclamado } from './garantiaProveedor'

/**
 * Valor reclamado de la ficha al proveedor (F1B-13, `valor-reclamado-usd`, `decision/f1b13-valor-reclamado-usd`).
 * Reglas puras: el servidor lee la orden y el catálogo y se las pasa; el cliente sólo pinta lo que llega
 * (regla invariable 13). El importe es siempre USD (`MONEDA_GARANTIA_PROVEEDOR`).
 */

export interface LineaOVI { itemId: string; cantidad: number }

export interface ValorReclamadoConOrigen {
  valorReclamado: number | null
  origenValorReclamado: OrigenValorReclamado
}

/** Sin foto (S-3): el valor queda vacío y, si alguien lo escribe después, es a mano. */
export const SIN_FOTO: ValorReclamadoConOrigen = { valorReclamado: null, origenValorReclamado: ORIGEN_VALOR_MANUAL }

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Líneas de la orden de venta (`raw.line_items`), o `null` ante cualquier hueco (S-4): `raw` que no es objeto ni
 * texto que parsea a objeto, sin lista o vacía, línea sin `item_id` de texto no vacío, o cantidad que no sea un
 * número finito mayor que 0 (una cantidad en texto es hueco). `raw` llega como objeto (pg-mem) o como texto (D-8).
 */
export function lineasDeLaOVI(raw: unknown): LineaOVI[] | null {
  let orden: unknown = raw
  if (typeof raw === 'string') {
    try { orden = JSON.parse(raw) } catch { return null }
  }
  if (!esObjeto(orden)) return null
  const items = orden.line_items
  if (!Array.isArray(items) || items.length === 0) return null
  const lineas: LineaOVI[] = []
  for (const it of items) {
    if (!esObjeto(it)) return null
    const itemId = it.item_id
    const cantidad = it.quantity
    if (typeof itemId !== 'string' || itemId === '') return null
    if (typeof cantidad !== 'number' || !Number.isFinite(cantidad) || cantidad <= 0) return null
    lineas.push({ itemId, cantidad })
  }
  return lineas
}

/**
 * Foto del valor reclamado (S-4 y S-6): Σ cantidad × costo de catálogo, redondeada a 2 decimales UNA vez al final.
 * Todo o nada: si falta el costo de alguna línea (ausente, `null`, no finito o ≤ 0) no hay foto, nunca una suma parcial.
 * Un artículo repetido en dos líneas cuenta dos veces.
 */
export function fotoValorReclamado(
  lineas: readonly LineaOVI[] | null,
  costos: ReadonlyMap<string, number | null>,
): ValorReclamadoConOrigen {
  if (lineas === null || lineas.length === 0) return SIN_FOTO
  let suma = 0
  for (const l of lineas) {
    const costo = costos.get(l.itemId)
    if (typeof costo !== 'number' || !Number.isFinite(costo) || costo <= 0) return SIN_FOTO
    suma += l.cantidad * costo
  }
  return { valorReclamado: Math.round(suma * 100) / 100, origenValorReclamado: ORIGEN_VALOR_OVI }
}

/**
 * Origen del valor reclamado tras editar (S-5), comparando por número: igual (NULL→NULL, X→X) conserva el origen
 * anterior; X→NULL, NULL→X y X→Y lo pasan a manual.
 */
export function origenTrasEditar(
  antes: Pick<GarantiaProveedor, 'valorReclamado' | 'origenValorReclamado'>,
  nuevo: number | null,
): string | null {
  return antes.valorReclamado === nuevo ? antes.origenValorReclamado : ORIGEN_VALOR_MANUAL
}

/** Etiqueta de presentación del origen (S-7). */
export const ETIQUETA_ORIGEN_VALOR: Record<OrigenValorReclamado, string> = {
  ovi: 'calculado de la OVI',
  manual: 'a mano',
}

/** `null` si no hay valor o el origen no es de la lista; si no, su etiqueta. */
export function etiquetaOrigenValor(valor: number | null, origen: unknown): string | null {
  if (valor === null) return null
  return typeof origen === 'string' && Object.hasOwn(ETIQUETA_ORIGEN_VALOR, origen)
    ? ETIQUETA_ORIGEN_VALOR[origen as OrigenValorReclamado]
    : null
}
