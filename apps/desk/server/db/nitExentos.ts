import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * Acceso a `public.nit_exentos` (`nit-exentos-aviso-provisional`, F1B-19; `tickets-core` RQ-TC-57).
 *
 * Sólo los NIT ACTIVOS: una fila retirada con `activo = false` deja de eximir. Decidir si un NIT casa con la lista
 * es regla de dominio y vive en `esNitExento` de `@ambientalia/shared`; aquí sólo se lee.
 */
export async function nitExentosActivos(db: Queryable): Promise<string[]> {
  const r = await db.query('SELECT nit FROM public.nit_exentos WHERE activo = true ORDER BY nit')
  return (r.rows as Array<{ nit: string }>).map((f) => String(f.nit))
}
