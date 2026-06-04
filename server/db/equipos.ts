import type { Queryable } from './migrate'
import type { EquipoRow } from './seedEquipos'
import type { EquipoLite } from '../../shared/types'

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
