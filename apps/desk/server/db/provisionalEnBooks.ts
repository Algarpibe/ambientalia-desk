import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * Lecturas del aviso de provisional ya en Books (`nit-exentos-aviso-provisional`, F1B-19; `derivacion-avisos` RQ-AV-21).
 * SÓLO lecturas: la marca la escribe `services/avisoProvisionalEnBooks.ts` dentro de su transacción. Decidir si dos NIT
 * casan, y si uno es exento, es regla de dominio y vive en `@ambientalia/shared`; aquí no se compara nada.
 */
export interface ProvisionalSinEnlazar { id: string; razonSocial: string; nit: string }
export interface ContactoConNit { id: string; name: string; nit: string | null }

/** Provisionales que siguen sin enlazar, por id. Todo con el esquema calificado: la tabla es de `public`. */
export async function provisionalesSinEnlazar(db: Queryable): Promise<ProvisionalSinEnlazar[]> {
  const r = await db.query('SELECT id, razon_social, nit FROM public.clientes_provisionales WHERE enlazado_a IS NULL ORDER BY id')
  return (r.rows as Array<{ id: string; razon_social: string; nit: string }>).map((f) => ({ id: f.id, razonSocial: f.razon_social, nit: f.nit }))
}

/** Todos los contactos de Books con su NIT (la vista `public.clients`); el nombre cae al id si no lo tiene, como `clientesBooksPorNit`. */
export async function contactosDeBooks(db: Queryable): Promise<ContactoConNit[]> {
  const r = await db.query('SELECT id, name, nit FROM clients')
  return (r.rows as Array<{ id: string; name: string | null; nit: string | null }>).map((c) => ({ id: c.id, name: c.name ?? c.id, nit: c.nit ?? null }))
}

/** Parejas de `provisionalIds` ya avisadas, como claves `${provisionalId}|${contactoId}`. Sin ids no consulta. */
export async function parejasYaAvisadas(db: Queryable, provisionalIds: string[]): Promise<Set<string>> {
  if (provisionalIds.length === 0) return new Set()
  const marcas = provisionalIds.map((_, i) => `$${i + 1}`).join(', ')
  const r = await db.query(`SELECT provisional_id, contacto_id FROM public.provisional_books_avisados WHERE provisional_id IN (${marcas})`, provisionalIds)
  return new Set((r.rows as Array<{ provisional_id: string; contacto_id: string }>).map((f) => `${f.provisional_id}|${f.contacto_id}`))
}
