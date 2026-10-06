import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { CambiosNovedad, NovedadCatalogo } from '@ambientalia/shared'

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

/**
 * Alta de una novedad (F1B-04, RQ-RE-29). La validación —clave, etiqueta, unicidad— la hace `altaNovedadDelCuerpo` de
 * `@ambientalia/shared` antes de llegar aquí; esto sólo escribe.
 */
export async function crearNovedad(db: Queryable, n: NovedadCatalogo): Promise<void> {
  await db.query(
    'INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, activo, excluye_demas, exige_texto) VALUES ($1, $2, $3, $4, $5, $6)',
    [n.clave, n.etiqueta, n.orden, n.activo, n.excluyeDemas, n.exigeTexto],
  )
}

/** Cambio de una novedad: sólo las columnas que vienen. No hay borrado: una novedad se retira con `activo = false`. */
export async function actualizarNovedad(db: Queryable, clave: string, cambios: CambiosNovedad): Promise<void> {
  const columnas: Record<keyof CambiosNovedad, string> = { etiqueta: 'etiqueta', orden: 'orden', activo: 'activo', exigeTexto: 'exige_texto' }
  const pares = (Object.keys(cambios) as (keyof CambiosNovedad)[]).map((k, i) => [`${columnas[k]} = $${i + 2}`, cambios[k]] as const)
  if (pares.length === 0) return
  await db.query(`UPDATE public.catalogo_novedades SET ${pares.map(([c]) => c).join(', ')} WHERE clave = $1`, [clave, ...pares.map(([, v]) => v)])
}
