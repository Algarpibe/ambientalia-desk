import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { nitCoincide } from '@ambientalia/shared'
import { enTransaccion } from './transaccion'

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

/** Contacto de Books que casa con un NIT: lo que el `409` de P-B ofrece para usar en vez del provisional. */
export interface ClienteBooksPorNit { id: string; name: string }

/**
 * Contactos de Books cuyo NIT casa con `nit` (P-B, RQ-TC-30), todos y en orden determinista: nombre y luego id.
 * Lee la vista `public.clients` como `getClient` (`packages/zoho-sync/src/books/repo.ts:127-130`) y decide en JS con
 * `nitCoincide`, no en SQL: la guarda del vacío vive en esa función pura y el SQL no filtra nada por NIT (ni
 * siquiera los nulos), así que no puede esconderla. Hipótesis: recorrer los contactos es aceptable en un alta manual,
 * que es excepcional.
 */
export async function clientesBooksPorNit(db: Queryable, nit: string): Promise<ClienteBooksPorNit[]> {
  const r = await db.query('SELECT id, name, nit FROM clients')
  return (r.rows as Array<{ id: string; name: string | null; nit: string | null }>)
    .filter((c) => nitCoincide(nit, c.nit))
    .map((c) => ({ id: c.id, name: c.name ?? c.id }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es') || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** Quién enlaza: id y nombre de la sesión, que quedan en el provisional (RQ-TC-32). */
export interface PersonaEnlace { id: string; nombre: string }

/**
 * Enlace del provisional con un contacto de Books (D10, RQ-TC-32), en UNA transacción: marca el provisional (sólo si sigue
 * sin enlazar: `WHERE enlazado_a IS NULL … RETURNING`, que cierra la carrera del doble enlace), reescribe `client_id` de
 * todos sus tickets y de todos sus equipos (con `cliente_nombre`) y deja una fila `clientId` por equipo en
 * `public.equipos_cambios`. Devuelve `null` si otro enlace se adelantó (la ruta responde `409`); nada queda a medias si
 * cualquier escritura falla. No escribe en `books.*` ni en Zoho.
 */
export async function enlazarProvisional(
  db: Queryable, id: string, contacto: { id: string; name: string }, persona: PersonaEnlace,
): Promise<{ tickets: number; equipos: number } | null> {
  return enTransaccion(db, async (q) => {
    const marcado = await q.query(
      `UPDATE public.clientes_provisionales
          SET enlazado_a = $2, enlazado_por_id = $3, enlazado_por_nombre = $4, enlazado_at = now()
        WHERE id = $1 AND enlazado_a IS NULL RETURNING id`,
      [id, contacto.id, persona.id, persona.nombre],
    )
    if (!marcado.rows[0]) return null
    const tickets = await q.query('UPDATE tickets SET client_id = $2 WHERE client_id = $1 RETURNING id', [id, contacto.id])
    const propios = await q.query('SELECT id FROM equipos WHERE client_id = $1', [id])
    await q.query('UPDATE equipos SET client_id = $2, cliente_nombre = $3 WHERE client_id = $1', [id, contacto.id, contacto.name])
    for (const e of propios.rows as Array<{ id: string }>) {
      await q.query(
        `INSERT INTO public.equipos_cambios (equipo_id, campo, valor_anterior, valor_nuevo, usuario_id, usuario_nombre)
         VALUES ($1, 'clientId', $2, $3, $4, $5)`,
        [e.id, id, contacto.id, persona.id, persona.nombre],
      )
    }
    return { tickets: tickets.rows.length, equipos: propios.rows.length }
  })
}
