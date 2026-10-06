import { EXCEPCIONES_POR_CARGO, puedeCrearOVIGarantia, type SujetoDePermiso } from './cargos'
import { esOVI } from './subOV'
import type { Transition } from './transitions'

/**
 * Asociar una orden OVI a un ticket (F1B-03, `decision/e157-ovi-garantia-por-cargo`; `permissions` RQ-PM-24 y RQ-PM-25,
 * `tickets-core` RQ-TC-43). Regla pura: la impone el servidor (regla invariable 13) y el cliente no decide nada.
 *
 * Una orden ENTRA a un ticket cuando éste no la traía ya; sólo las que entran se juzgan. Dos escalones de F1B-10:
 * el cargo es **B** (`403`) y «Garantía sólo con OVI» es **C** (`422`). «Es OVI» vive en `subOV.ts` (`esOVI`).
 */

/** Literal exacto de `TIPOS_SERVICIO` (`ticketCreate.ts`); S-7: no se pliega ni la caja ni la tilde. */
export const TIPO_SERVICIO_GARANTIA = 'Garantía'

/** Una orden que llega en la petición: el número tecleado o el que Books da a `salesorderId`. */
export interface OrdenRecibida { numero?: unknown; salesorderId?: unknown }
/** Lo que el ticket ya tiene: `orden_venta`, `salesorder_id` y las asociaciones vigentes. */
export interface OrdenesDelTicket { numeros: readonly unknown[]; salesorderIds: readonly unknown[] }
export type SujetoOVI = Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>

const texto = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')

/** Los números que la transición lleva en sus campos de orden de venta: lo mismo que el plan guarda como orden. */
export function ordenesDeTransicion(t: Pick<Transition, 'fields'>, valores: unknown): string[] {
  const v = (valores ?? {}) as Record<string, unknown>
  return t.fields.flatMap((f) => {
    if (f.kind !== 'ordenVenta') return []
    const x = v[f.key]
    return x === undefined || x === null || x === '' ? [] : [String(x)]
  })
}

/**
 * Las órdenes recibidas que el ticket NO traía: su número recortado (misma caja) no está en `numeros` y su
 * `salesorderId`, si lo hay, no está en `salesorderIds`. Devuelve los números recortados, sin vacíos ni repetidos.
 * Otra caja entra: ante la duda, falla cerrado.
 */
export function ordenesQueEntran(recibidas: readonly OrdenRecibida[], yaTiene: OrdenesDelTicket): string[] {
  const numeros = new Set(yaTiene.numeros.map(texto).filter(Boolean))
  const ids = new Set(yaTiene.salesorderIds.map(texto).filter(Boolean))
  const salida = new Set<string>()
  for (const r of recibidas) {
    const n = texto(r.numero)
    if (!n) continue
    const id = texto(r.salesorderId)
    if (numeros.has(n) || (id && ids.has(id))) continue
    salida.add(n)
  }
  return [...salida]
}

/** El motivo del `403`: la primera entrante que es OVI sin que el sujeto tenga el cargo; sujeto ausente = sin cargo (S-10). */
export function motivoCargoOVI(entrantes: readonly string[], sujeto: SujetoOVI | null | undefined): string | null {
  if (sujeto && puedeCrearOVIGarantia(sujeto)) return null
  const n = entrantes.find(esOVI)
  return n === undefined ? null : `La orden de venta ${n} es una OVI: asociarla a un ticket sólo lo hace el cargo ${EXCEPCIONES_POR_CARGO.crearOVIGarantia}`
}

/** Un texto por cada entrante que no es OVI, si el ticket es de Garantía. */
export function erroresGarantiaSinOVI(tipoServicio: unknown, entrantes: readonly string[]): string[] {
  if (tipoServicio !== TIPO_SERVICIO_GARANTIA) return []
  return entrantes.filter((n) => !esOVI(n)).map((n) => `El ticket es de tipo de servicio Garantía y sólo admite una orden OVI: la orden de venta ${n} no lo es`)
}

/** El primero de `erroresGarantiaSinOVI`, o `null` (mismo par que `motivoCuarentena`/`erroresCuarentena`). */
export const motivoGarantiaSinOVI = (tipoServicio: unknown, entrantes: readonly string[]): string | null =>
  erroresGarantiaSinOVI(tipoServicio, entrantes)[0] ?? null
