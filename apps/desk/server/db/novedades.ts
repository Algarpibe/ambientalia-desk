import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { NovedadCatalogo } from '@ambientalia/shared'

/**
 * Acceso a `public.catalogo_novedades` (`recepcion-rotulacion-foto-entrada`, F1B-04; `remisiones` RQ-RE-21).
 *
 * Devuelve TODAS las filas, activas o no, por `orden` y `clave`: filtrar `activo` es una regla de dominio y
 * vive en `novedadesActivas` de `@ambientalia/shared`, no aquí. Una novedad retirada con `activo = false`
 * tiene que seguir siendo legible para las remisiones que ya la marcaron.
 */
export async function listNovedades(db: Queryable): Promise<NovedadCatalogo[]> {
  const r = await db.query(
    'SELECT clave, etiqueta, orden, activo, excluye_demas, exige_texto FROM public.catalogo_novedades ORDER BY orden, clave',
  )
  return r.rows.map((f) => ({
    clave: String(f.clave),
    etiqueta: String(f.etiqueta),
    orden: Number(f.orden),
    activo: f.activo === true,
    excluyeDemas: f.excluye_demas === true,
    exigeTexto: f.exige_texto === true,
  }))
}
