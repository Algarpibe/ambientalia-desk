import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Aviso } from '@ambientalia/shared'

const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/** Da de alta un aviso para una persona. Devuelve su id, que es lo que hace falta para marcarlo leído. */
export async function crearAviso(
  db: Queryable,
  a: { userId: string; ticketId: string | null; texto: string },
): Promise<string> {
  const id = 'avi-' + randomUUID()
  await db.query(
    'INSERT INTO avisos (id, user_id, ticket_id, texto) VALUES ($1,$2,$3,$4)',
    [id, a.userId, a.ticketId, a.texto],
  )
  return id
}

/**
 * Los avisos de una persona, los no leídos primero.
 *
 * Ese orden no es cosmético: la campana existe para lo que falta por mirar, no para el archivo. El
 * límite evita que una bandeja vieja se traiga cientos de filas en cada apertura.
 */
export async function listarAvisos(db: Queryable, userId: string, limite = 50): Promise<Aviso[]> {
  const r = await db.query(
    `SELECT id, ticket_id, texto, leido_at, created_at FROM avisos
      WHERE user_id = $1
      ORDER BY leido_at NULLS FIRST, created_at DESC
      LIMIT $2`,
    [userId, limite],
  )
  return filas(r.rows).map((x) => ({
    id: String(x.id),
    ticketId: (x.ticket_id as string | null) ?? null,
    texto: String(x.texto),
    leido: x.leido_at != null,
    createdAt: x.created_at ? new Date(x.created_at as string).toISOString() : null,
  }))
}

/**
 * Marca avisos como leídos.
 *
 * El `user_id` va SIEMPRE en el `WHERE` junto al id: sin él, cualquiera con sesión podría vaciarle la
 * campana a otro mandando ids a mano. No es paranoia, es que el id es lo único que viaja del cliente.
 */
export async function marcarLeidos(db: Queryable, userId: string, ids: string[]): Promise<void> {
  // De uno en uno y no con `ANY($1)`: pg-mem no tipa los arrays enlazados, y son unos pocos ids.
  for (const id of ids) {
    await db.query('UPDATE avisos SET leido_at = now() WHERE id = $1 AND user_id = $2', [id, userId])
  }
}

/**
 * Quién debe enterarse de que un ticket entró en una fase de `area`.
 *
 * Dos grupos, sin repetidos: quien tenga un rol **marcado como receptor** cuyas áreas cubran esa área,
 * y **todos los administradores activos**, que reciben copia de los cambios de área por decisión del
 * usuario. El actor nunca se avisa a sí mismo: acaba de hacerlo.
 *
 * El cruce de áreas se hace en JS y no con `@>` en SQL porque `roles.areas` es `jsonb` y pg-mem no
 * resuelve la contención; el filtro barato (`recibe_avisos`, activos) sí va en SQL.
 */
export async function destinatariosDeArea(
  db: Queryable,
  area: string,
  actorId: string,
): Promise<Array<{ id: string; email: string; name: string }>> {
  const r = await db.query(
    `SELECT u.id, u.email, u.name, u.is_admin, r.areas AS role_areas
       FROM users u LEFT JOIN roles r ON u.role_id = r.id AND r.active = true AND r.recibe_avisos = true
      WHERE u.active = true`,
  )
  const porId = new Map<string, { id: string; email: string; name: string }>()
  for (const x of filas(r.rows)) {
    const id = String(x.id)
    if (id === actorId) continue
    const areas = Array.isArray(x.role_areas) ? (x.role_areas as string[]) : []
    if (x.is_admin !== true && !areas.includes(area)) continue
    porId.set(id, { id, email: String(x.email), name: String(x.name) })
  }
  return [...porId.values()]
}
