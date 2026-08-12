import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { UserPublic, PersonaLite } from '@ambientalia/shared'
import { AREAS } from '@ambientalia/shared'

/** Tipo interno para verificar credenciales (incluye el hash); NO se devuelve al cliente. */
export interface UserWithHash {
  id: string; email: string; name: string; isAdmin: boolean; active: boolean; passwordHash: string
}

const normalize = (email: string) => email.trim().toLowerCase()

// SELECT con LEFT JOIN al rol para resolver áreas.
const USER_SELECT = `SELECT u.id,u.email,u.name,u.is_admin,u.active,u.role_id,u.cargo,u.empresa,
  r.name AS role_name, r.areas AS role_areas, r.active AS role_active
  FROM users u LEFT JOIN roles r ON u.role_id = r.id`

/** Convierte una fila (con columnas role_*) en UserPublic resolviendo las áreas efectivas. */
export function rowToPublicUser(row: any): UserPublic {
  const isAdmin = row.is_admin === true
  const roleActive = row.role_active === true
  const roleAreas = Array.isArray(row.role_areas) ? row.role_areas : []
  return {
    id: row.id, email: row.email, name: row.name, isAdmin, active: row.active,
    roleId: row.role_id ?? null,
    roleName: roleActive ? row.role_name : null,
    areas: isAdmin ? [...AREAS] : (roleActive ? roleAreas : []),
    // Datos del técnico que imprime el documento de remisión (antes salían de la hoja `credenciales`).
    cargo: row.cargo ?? null,
    empresa: row.empresa ?? null,
  }
}

export async function createUser(
  db: Queryable,
  input: { email: string; name: string; passwordHash: string; isAdmin?: boolean; roleId?: string | null; cargo?: string | null; empresa?: string | null },
): Promise<UserPublic> {
  const id = randomUUID()
  await db.query(
    `INSERT INTO users (id,email,name,password_hash,is_admin,active,role_id,cargo,empresa,updated_at)
     VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,now())`,
    [id, normalize(input.email), input.name, input.passwordHash, input.isAdmin ?? false, input.roleId ?? null, input.cargo ?? null, input.empresa ?? null],
  )
  return (await getUserById(db, id))!
}

export async function getUserByEmail(db: Queryable, email: string): Promise<UserWithHash | null> {
  const r = await db.query('SELECT id,email,name,password_hash,is_admin,active FROM users WHERE email=$1', [normalize(email)])
  const row = r.rows[0]
  return row ? { id: row.id, email: row.email, name: row.name, isAdmin: row.is_admin, active: row.active, passwordHash: row.password_hash } : null
}

export async function getUserById(db: Queryable, id: string): Promise<UserPublic | null> {
  const r = await db.query(`${USER_SELECT} WHERE u.id=$1`, [id])
  return r.rows[0] ? rowToPublicUser(r.rows[0]) : null
}

export async function listUsers(db: Queryable): Promise<UserPublic[]> {
  const r = await db.query(`${USER_SELECT} ORDER BY u.created_at`)
  return r.rows.map(rowToPublicUser)
}

/**
 * Las personas a las que se le puede derivar un ticket.
 *
 * Es una consulta APARTE de `listUsers` y no un filtro sobre ella, porque son dos cosas distintas:
 * `listUsers` alimenta la consola de administración —trae correo, rol, áreas y los dados de baja— y
 * esto lo pide cualquiera que ejecute una transición. Reutilizarla publicaría el modelo de
 * autorización entero a todo el mundo por comodidad.
 *
 * Solo los ACTIVOS: derivar a quien ya no trabaja aquí deja el ticket con un responsable que nunca lo
 * va a abrir.
 */
export async function listPersonas(db: Queryable): Promise<PersonaLite[]> {
  const r = await db.query('SELECT id, name, cargo FROM users WHERE active = true ORDER BY name')
  return (r.rows as Array<Record<string, unknown>>).map((x) => ({
    id: String(x.id),
    nombre: String(x.name),
    cargo: (x.cargo as string | null) ?? null,
  }))
}

export async function updateUser(
  db: Queryable,
  id: string,
  patch: { name?: string; email?: string; isAdmin?: boolean; active?: boolean; roleId?: string | null; cargo?: string | null; empresa?: string | null },
): Promise<void> {
  const sets: string[] = ['updated_at=now()']
  const params: unknown[] = [id]
  if (patch.name !== undefined) { params.push(patch.name); sets.push(`name=$${params.length}`) }
  // Normalizado aquí igual que en el alta: el correo es la identidad de acceso y dos grafías del
  // mismo buzón serían dos usuarios distintos para `getUserByEmail`.
  if (patch.email !== undefined) { params.push(normalize(patch.email)); sets.push(`email=$${params.length}`) }
  if (patch.isAdmin !== undefined) { params.push(patch.isAdmin); sets.push(`is_admin=$${params.length}`) }
  if (patch.active !== undefined) { params.push(patch.active); sets.push(`active=$${params.length}`) }
  if (patch.roleId !== undefined) { params.push(patch.roleId); sets.push(`role_id=$${params.length}`) }
  if (patch.cargo !== undefined) { params.push(patch.cargo); sets.push(`cargo=$${params.length}`) }
  if (patch.empresa !== undefined) { params.push(patch.empresa); sets.push(`empresa=$${params.length}`) }
  await db.query(`UPDATE users SET ${sets.join(',')} WHERE id=$1`, params)
}

export async function setPassword(db: Queryable, id: string, passwordHash: string): Promise<void> {
  await db.query('UPDATE users SET password_hash=$2, updated_at=now() WHERE id=$1', [id, passwordHash])
}

export async function countUsers(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM users')
  return r.rows[0].n as number
}

/** Cuántos administradores activos hay (para no dejar el sistema sin admin). */
export async function countActiveAdmins(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM users WHERE is_admin = true AND active = true')
  return r.rows[0].n as number
}

/** Usuario con historial. Se traduce a 409 con el conteo delante, como `EntradaEnUso`. */
export class UsuarioEnUso extends Error {
  constructor(public readonly usos: number) {
    super(`En uso por ${usos}`)
    this.name = 'UsuarioEnUso'
  }
}

/**
 * Cuántas referencias POR ID tiene esta persona, que son las que romperían al borrarla.
 *
 * Dos, y la segunda es la que importa: el id de la derivación viaja dentro del `values` de cada
 * transición, que es el rastro de auditoría que enseña el panel de Historia. Borrar a alguien
 * derivado alguna vez deja ese panel mostrando un UUID crudo para siempre, y reescribir el `values`
 * para evitarlo sería falsificar la auditoría.
 *
 * Lo que guarda el NOMBRE (quién ejecutó la transición, quién firmó la remisión) no se cuenta: es
 * texto y sobrevive al borrado sin romperse.
 */
export async function usosDeUsuario(db: Queryable, id: string): Promise<number> {
  const t = await db.query('SELECT COUNT(*)::int AS n FROM tickets WHERE derivado_a = $1', [id])
  const tr = await db.query("SELECT COUNT(*)::int AS n FROM ticket_transitions WHERE values->>'derivado_a' = $1", [id])
  return Number((t.rows[0] as Record<string, unknown>).n) + Number((tr.rows[0] as Record<string, unknown>).n)
}

/**
 * Borrado físico, y solo si no tiene historial.
 *
 * El esquema no tiene claves foráneas: lo que no se barra aquí queda huérfano en silencio. Se llevan
 * sesiones, avisos y lecturas —estado personal, sin valor de auditoría— y la fila se borra LA ÚLTIMA:
 * sin transacción que pg-mem pueda probar, un fallo a medias deja a la persona existiendo con menos
 * estado personal, que es molesto pero nunca corrupto. Al revés dejaría justo los huérfanos que esto
 * viene a evitar.
 */
export async function borrarUsuario(db: Queryable, id: string): Promise<void> {
  const usos = await usosDeUsuario(db, id)
  if (usos > 0) throw new UsuarioEnUso(usos)
  await db.query('DELETE FROM sessions WHERE user_id = $1', [id])
  await db.query('DELETE FROM avisos WHERE user_id = $1', [id])
  await db.query('DELETE FROM ticket_reads WHERE user_id = $1', [id])
  await db.query('DELETE FROM users WHERE id = $1', [id])
}
