import { randomUUID } from 'node:crypto'
import type { Queryable } from './migrate'
import type { EquipoRow } from './seedEquipos'
import type { EquipoLite, EquipoFull } from '../../shared/types'

const J = (v: unknown) => JSON.stringify(v ?? null)

export async function upsertEquipo(db: Queryable, r: EquipoRow): Promise<void> {
  await db.query(
    `INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,source,active,raw,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,now())
     ON CONFLICT (id) DO UPDATE SET serial=EXCLUDED.serial,marca=EXCLUDED.marca,modelo=EXCLUDED.modelo,
       tipo=EXCLUDED.tipo,cliente_nombre=EXCLUDED.cliente_nombre,source=EXCLUDED.source,raw=EXCLUDED.raw,updated_at=now()`,
    [r.id, r.serial, r.marca, r.modelo, r.tipo, r.cliente_nombre, r.source, J(r.raw)],
  )
}

function toLite(r: any): EquipoLite {
  return { id: r.id, serial: r.serial, marca: r.marca ?? undefined, modelo: r.modelo ?? undefined, tipo: r.tipo ?? undefined, clienteNombre: r.cliente_nombre ?? undefined }
}

export async function searchEquipos(db: Queryable, q: string, limit = 20): Promise<EquipoLite[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,serial,marca,modelo,tipo,cliente_nombre FROM equipos
     WHERE active = true AND (LOWER(serial) LIKE $1 OR LOWER(COALESCE(cliente_nombre,'')) LIKE $1
       OR LOWER(COALESCE(marca,'')) LIKE $1 OR LOWER(COALESCE(modelo,'')) LIKE $1 OR LOWER(COALESCE(tipo,'')) LIKE $1)
     ORDER BY serial LIMIT $2`,
    [like, limit],
  )
  return r.rows.map(toLite)
}

export async function getEquipo(db: Queryable, id: string): Promise<EquipoLite | null> {
  const r = await db.query('SELECT id,serial,marca,modelo,tipo,cliente_nombre FROM equipos WHERE id=$1', [id])
  return r.rows[0] ? toLite(r.rows[0]) : null
}

export async function countEquipos(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM equipos')
  return r.rows[0].n as number
}

export interface EquipoInput {
  serial: string
  marca: string | null
  modelo: string | null
  tipo: string | null
  clienteNombre: string | null
  clientId: string | null
}

function toFull(r: any): EquipoFull {
  return {
    id: r.id, serial: r.serial, marca: r.marca ?? undefined, modelo: r.modelo ?? undefined,
    tipo: r.tipo ?? undefined, clienteNombre: r.cliente_nombre ?? undefined,
    active: r.active === true, clientId: r.client_id ?? undefined,
  }
}

export async function createEquipo(db: Queryable, input: EquipoInput): Promise<string> {
  const id = 'eq-' + randomUUID()
  await db.query(
    `INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,client_id,source,active,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'app',true,now())`,
    [id, input.serial, input.marca, input.modelo, input.tipo, input.clienteNombre, input.clientId],
  )
  return id
}

export async function updateEquipo(db: Queryable, id: string, patch: Partial<EquipoInput>): Promise<void> {
  const sets = ['updated_at=now()']
  const params: unknown[] = [id]
  const add = (col: string, val: unknown) => { params.push(val); sets.push(`${col}=$${params.length}`) }
  if (patch.serial !== undefined) add('serial', patch.serial)
  if (patch.marca !== undefined) add('marca', patch.marca)
  if (patch.modelo !== undefined) add('modelo', patch.modelo)
  if (patch.tipo !== undefined) add('tipo', patch.tipo)
  if (patch.clienteNombre !== undefined) add('cliente_nombre', patch.clienteNombre)
  if (patch.clientId !== undefined) add('client_id', patch.clientId)
  await db.query(`UPDATE equipos SET ${sets.join(',')} WHERE id=$1`, params)
}

export async function setEquipoActive(db: Queryable, id: string, active: boolean): Promise<void> {
  await db.query('UPDATE equipos SET active=$2, updated_at=now() WHERE id=$1', [id, active])
}

/** Borrado físico (solo super administrador). Los tickets conservan sus datos de equipo denormalizados. */
export async function deleteEquipo(db: Queryable, id: string): Promise<void> {
  await db.query('DELETE FROM equipos WHERE id=$1', [id])
}

export async function getEquipoFull(db: Queryable, id: string): Promise<EquipoFull | null> {
  const r = await db.query('SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,active FROM equipos WHERE id=$1', [id])
  return r.rows[0] ? toFull(r.rows[0]) : null
}

export async function listEquiposManage(db: Queryable, q: string, limit = 50, offset = 0): Promise<EquipoFull[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,active FROM equipos
     WHERE LOWER(serial) LIKE $1 OR LOWER(COALESCE(cliente_nombre,'')) LIKE $1
       OR LOWER(COALESCE(marca,'')) LIKE $1 OR LOWER(COALESCE(modelo,'')) LIKE $1 OR LOWER(COALESCE(tipo,'')) LIKE $1
     ORDER BY serial LIMIT $2 OFFSET $3`,
    [like, limit, offset],
  )
  return r.rows.map(toFull)
}

/** Facetas para los desplegables en cascada: por cada marca, sus modelos y tipos distintos. */
export async function equipoFacets(db: Queryable): Promise<{ marcas: string[]; byMarca: Record<string, { modelos: string[]; tipos: string[] }> }> {
  const r = await db.query("SELECT DISTINCT marca, modelo, tipo FROM equipos WHERE COALESCE(marca,'') <> '' ORDER BY marca")
  const acc: Record<string, { modelos: Set<string>; tipos: Set<string> }> = {}
  for (const row of r.rows as any[]) {
    const marca = row.marca as string
    if (!acc[marca]) acc[marca] = { modelos: new Set(), tipos: new Set() }
    if (row.modelo) acc[marca].modelos.add(row.modelo)
    if (row.tipo) acc[marca].tipos.add(row.tipo)
  }
  const marcas = Object.keys(acc).sort()
  const byMarca: Record<string, { modelos: string[]; tipos: string[] }> = {}
  for (const m of marcas) byMarca[m] = { modelos: [...acc[m].modelos].sort(), tipos: [...acc[m].tipos].sort() }
  return { marcas, byMarca }
}
