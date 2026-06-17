import { randomUUID } from 'node:crypto'
import type { Queryable } from '../db/migrate'
import { AREAS } from '@ambientalia/shared'

export interface Role { id: string; name: string; areas: string[]; active: boolean }

function rowToRole(r: any): Role {
  return { id: r.id, name: r.name, areas: Array.isArray(r.areas) ? r.areas : [], active: r.active }
}
function validAreas(areas: unknown): string[] {
  if (!Array.isArray(areas)) return []
  return areas.filter((a): a is string => typeof a === 'string' && (AREAS as readonly string[]).includes(a))
}

export async function createRole(db: Queryable, input: { name: string; areas: string[] }): Promise<Role> {
  const r = await db.query(
    'INSERT INTO roles (id,name,areas,updated_at) VALUES ($1,$2,$3,now()) RETURNING id,name,areas,active',
    [randomUUID(), input.name.trim(), JSON.stringify(validAreas(input.areas))],
  )
  return rowToRole(r.rows[0])
}

export async function listRoles(db: Queryable): Promise<Role[]> {
  const r = await db.query('SELECT id,name,areas,active FROM roles ORDER BY name')
  return r.rows.map(rowToRole)
}

export async function getRole(db: Queryable, id: string): Promise<Role | null> {
  const r = await db.query('SELECT id,name,areas,active FROM roles WHERE id=$1', [id])
  return r.rows[0] ? rowToRole(r.rows[0]) : null
}

export async function updateRole(
  db: Queryable,
  id: string,
  patch: { name?: string; areas?: string[]; active?: boolean },
): Promise<void> {
  const sets: string[] = ['updated_at=now()']
  const params: unknown[] = [id]
  if (patch.name !== undefined) { params.push(patch.name.trim()); sets.push(`name=$${params.length}`) }
  if (patch.areas !== undefined) { params.push(JSON.stringify(validAreas(patch.areas))); sets.push(`areas=$${params.length}`) }
  if (patch.active !== undefined) { params.push(patch.active); sets.push(`active=$${params.length}`) }
  await db.query(`UPDATE roles SET ${sets.join(',')} WHERE id=$1`, params)
}
