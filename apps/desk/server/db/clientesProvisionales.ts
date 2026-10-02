import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * Lecturas de `public.clientes_provisionales` (F1B-15, D1, RQ-TC-34). Es la SEGUNDA consulta con la que
 * `services/clientes.ts` resuelve un cliente: la vista `public.clients` y `books/repo.ts` no cambian.
 * Todo va con el esquema calificado: esta tabla es de `public`, no de `desk`.
 */
export interface ProvisionalRow {
  id: string
  razonSocial: string
  nit: string
  contacto: string
  telefono: string
  correo: string
  /** Contacto de Books al que se enlazó, o `null` si sigue sin enlazar. */
  enlazadoA: string | null
}

const COLUMNAS = 'id, razon_social, nit, contacto, telefono, correo, enlazado_a'

function aProvisional(r: Record<string, string | null>): ProvisionalRow {
  return { id: r.id!, razonSocial: r.razon_social!, nit: r.nit!, contacto: r.contacto!, telefono: r.telefono!, correo: r.correo!, enlazadoA: r.enlazado_a ?? null }
}

export async function getProvisional(db: Queryable, id: string): Promise<ProvisionalRow | null> {
  const r = await db.query(`SELECT ${COLUMNAS} FROM public.clientes_provisionales WHERE id = $1`, [id])
  return r.rows[0] ? aProvisional(r.rows[0]) : null
}

/** Provisionales NO enlazados cuya razón social o NIT contienen `q` (un enlazado ya se resuelve por Books). */
export async function searchProvisionales(db: Queryable, q: string, limit = 20): Promise<ProvisionalRow[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT ${COLUMNAS} FROM public.clientes_provisionales
     WHERE enlazado_a IS NULL AND (LOWER(razon_social) LIKE $1 OR LOWER(nit) LIKE $1)
     ORDER BY razon_social LIMIT $2`,
    [like, limit],
  )
  return r.rows.map(aProvisional)
}

/**
 * Nombre de cada provisional NO enlazado entre `ids`, para rellenar el listado de tickets. Un id que no es
 * provisional, no existe o ya está enlazado no aparece en el mapa.
 */
export async function nombresProvisionales(db: Queryable, ids: string[]): Promise<Map<string, string>> {
  const distintos = [...new Set(ids)]
  if (distintos.length === 0) return new Map()
  const marcas = distintos.map((_, i) => `$${i + 1}`).join(',')
  const r = await db.query(
    `SELECT id, razon_social FROM public.clientes_provisionales WHERE enlazado_a IS NULL AND id IN (${marcas})`,
    distintos,
  )
  return new Map(r.rows.map((x: { id: string; razon_social: string }) => [x.id, x.razon_social]))
}
