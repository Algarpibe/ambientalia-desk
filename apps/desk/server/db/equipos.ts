import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { EquipoRow } from './seedEquipos'
import type { EquipoLite, EquipoFull } from '@ambientalia/shared'
import type { EquipoHistorial, HistorialTicket, HistorialTransition } from '@ambientalia/shared'

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

/** Cliente por el que acotar la búsqueda de equipos. Ambas señales son opcionales. */
export interface EquipoClienteFilter { id?: string | null; name?: string | null }

/**
 * Busca equipos activos, opcionalmente acotados a un cliente.
 *
 * El vínculo equipo↔cliente NO puede apoyarse solo en `client_id`: la semilla (~352 equipos) lo
 * deja NULL y solo guarda `cliente_nombre`, texto libre del CSV cuya grafía difiere de la de Books
 * ("AMBIENTALIA" vs "Ambientalia S.A.S."). Por eso se aceptan tres coincidencias: por `client_id`
 * (equipos dados de alta en la app), por nombre contenido, y por nombre contenido a la inversa —
 * esta última cubre el caso del CSV abreviado, con un mínimo de 4 caracteres para no disparar
 * falsos positivos con nombres muy cortos.
 *
 * Sin cliente devuelve todos: es la salida de emergencia del formulario cuando el vínculo falla.
 */
export async function searchEquipos(db: Queryable, q: string, cliente?: EquipoClienteFilter | null, limit = 20): Promise<EquipoLite[]> {
  const like = `%${q.toLowerCase()}%`
  const params: unknown[] = [like]
  const cid = cliente?.id ?? ''
  const cname = (cliente?.name ?? '').toLowerCase().trim()
  const ors: string[] = []
  if (cid) { params.push(cid); ors.push(`client_id = $${params.length}`) }
  if (cname) {
    params.push(`%${cname}%`)
    ors.push(`LOWER(COALESCE(cliente_nombre,'')) LIKE $${params.length}`)
    params.push(cname)
    // `LIKE '____%'` = al menos 4 caracteres. Se usa en vez de length() porque pg-mem no la
    // implementa, y el patrón es equivalente y portable.
    ors.push(`(COALESCE(cliente_nombre,'') LIKE '____%' AND $${params.length} LIKE '%' || LOWER(cliente_nombre) || '%')`)
  }
  const clienteFilter = ors.length ? `AND (${ors.join(' OR ')})` : ''
  params.push(limit)
  const r = await db.query(
    `SELECT id,serial,marca,modelo,tipo,cliente_nombre FROM equipos
     WHERE active = true AND (LOWER(serial) LIKE $1 OR LOWER(COALESCE(cliente_nombre,'')) LIKE $1
       OR LOWER(COALESCE(marca,'')) LIKE $1 OR LOWER(COALESCE(modelo,'')) LIKE $1 OR LOWER(COALESCE(tipo,'')) LIKE $1)
     ${clienteFilter}
     ORDER BY serial LIMIT $${params.length}`,
    params,
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

/** El serial como token delimitado por caracteres no alfanuméricos (evita falsos positivos por subcadena). */
function serialBoundaryRegex(serial: string): RegExp {
  const esc = serial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^A-Za-z0-9])${esc}([^A-Za-z0-9]|$)`)
}

export async function getEquipoHistorial(db: Queryable, id: string): Promise<EquipoHistorial | null> {
  const equipo = await getEquipoFull(db, id)
  if (!equipo) return null
  const serial = equipo.serial
  // Históricos de Zoho: el serial vive solo en el asunto (no en serial/codigo_servicio).
  // Filtramos ampliamente en SQL y refinamos en JS con guarda de token.
  const tk = await db.query(
    `SELECT t.id, t.number, t.subject, t.status, t.status_type, t.created_time, t.codigo_servicio, t.tipo_servicio,
            t.serial AS t_serial, t.equipo_id AS t_equipo_id, g.name AS agent_name
     FROM tickets t LEFT JOIN agents g ON t.assignee_id=g.id
     WHERE t.equipo_id=$1
        OR (COALESCE(t.serial,'') <> '' AND t.serial=$2)
        OR (COALESCE(t.subject,'') <> '' AND LOWER(t.subject) LIKE LOWER($3))
     ORDER BY t.created_time DESC NULLS LAST`,
    [id, serial, `%${serial}%`],
  )
  const re = serialBoundaryRegex(serial)
  const rows = (tk.rows as any[]).filter(
    (r) => r.t_equipo_id === id || (r.t_serial && r.t_serial === serial) || re.test(r.subject ?? ''),
  )
  const ids = rows.map((r) => r.id)
  const byTicket = new Map<string, HistorialTransition[]>()
  if (ids.length) {
    const ph = ids.map((_, i) => `$${i + 1}`).join(',')
    const tr = await db.query(
      `SELECT ticket_id, transition_name, from_status, to_status, area, performed_by, performed_at
       FROM ticket_transitions WHERE ticket_id IN (${ph}) ORDER BY performed_at`,
      ids,
    )
    for (const r of tr.rows as any[]) {
      const list = byTicket.get(r.ticket_id) ?? []
      list.push({
        transitionName: r.transition_name ?? null, fromStatus: r.from_status ?? null, toStatus: r.to_status ?? null,
        area: r.area ?? null, performedBy: r.performed_by ?? null, performedAt: r.performed_at ?? null,
      })
      byTicket.set(r.ticket_id, list)
    }
  }
  const tickets: HistorialTicket[] = rows.map((r) => ({
    id: r.id, number: `#${r.number}`, subject: r.subject ?? '', status: r.status, statusType: r.status_type ?? null,
    createdAt: r.created_time ?? null, tecnico: r.agent_name ?? null, codigoServicio: r.codigo_servicio ?? null,
    tipoServicio: r.tipo_servicio ?? null, transitions: byTicket.get(r.id) ?? [],
  }))
  return { equipo, tickets }
}
