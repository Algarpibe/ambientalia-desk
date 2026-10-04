import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { validarRecepcion, type RecepcionValidada } from '@ambientalia/shared'
import { listNovedades } from '../db/novedades'

/**
 * Resuelve la recepción del alta (`recepcion-rotulacion-foto-entrada`, RQ-RE-23, RQ-RE-24, RQ-RE-27).
 *
 * `null` = remisión de LEGADO: el cuerpo no trae la clave `novedades` y no se lee la base. Cualquier valor
 * distinto de `undefined` —incluido un `null` explícito— es formulario nuevo y pasa por `validarRecepcion`,
 * que lo rechaza si no es una lista contestada. El catálogo se lee entero en cada alta: la regla la decide
 * `packages/shared` por sus marcas, así que quitar una novedad con SQL surte efecto sin redesplegar.
 */
export async function resolverRecepcion(
  db: Queryable, cuerpo: Record<string, unknown>,
): Promise<null | { error: string } | RecepcionValidada> {
  if (cuerpo.novedades === undefined) return null
  const r = validarRecepcion(await listNovedades(db), cuerpo as { novedades: unknown; novedadOtro?: unknown; rotulado?: unknown })
  return r.ok ? r.valor : { error: r.error }
}
