import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Remision, RemisionFoto } from '@ambientalia/shared'

const J = (v: unknown) => JSON.stringify(v ?? null)

function toRemision(r: Record<string, unknown>): Remision {
  return {
    id: String(r.id), ticketId: String(r.ticket_id), tipo: String(r.tipo),
    fecha: r.fecha instanceof Date ? r.fecha.toISOString().slice(0, 10) : String(r.fecha ?? ''),
    tipoServicio: (r.tipo_servicio as string) ?? null, perfil: (r.perfil as string) ?? null,
    equipoId: (r.equipo_id as string) ?? null, serial: (r.serial as string) ?? null,
    // `incluye` puede llegar como texto (pg-mem) o ya parseado (pg con jsonb).
    incluye: typeof r.incluye === 'string' ? JSON.parse(r.incluye) : ((r.incluye as string[]) ?? []),
    observaciones: (r.observaciones as string) ?? null, creadoPor: (r.creado_por as string) ?? null,
    estado: String(r.estado) as Remision['estado'],
    resultado: typeof r.resultado === 'string' ? JSON.parse(r.resultado) : ((r.resultado as Remision['resultado']) ?? null),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ''),
  }
}

export interface CreateRemisionInput {
  ticketId: string
  fecha: string
  tipoServicio: string | null
  perfil: string | null
  equipoId: string | null
  serial: string | null
  incluye: string[]
  observaciones: string | null
  creadoPor: string | null
}

/** Crea la remisión en estado `pendiente`: el flujo de n8n aún no ha respondido. */
export async function createRemision(db: Queryable, input: CreateRemisionInput): Promise<string> {
  const id = `rem-${randomUUID()}`
  await db.query(
    `INSERT INTO remisiones (id, ticket_id, tipo, fecha, tipo_servicio, perfil, equipo_id, serial, incluye, observaciones, creado_por, estado)
     VALUES ($1,$2,'entrada',$3,$4,$5,$6,$7,$8,$9,$10,'pendiente')`,
    [id, input.ticketId, input.fecha, input.tipoServicio, input.perfil, input.equipoId, input.serial,
      J(input.incluye), input.observaciones, input.creadoPor],
  )
  return id
}

export async function getRemision(db: Queryable, id: string): Promise<Remision | null> {
  const r = await db.query('SELECT * FROM remisiones WHERE id = $1', [id])
  return r.rows[0] ? toRemision(r.rows[0]) : null
}

/** Remisiones de un ticket, la más reciente primero. */
export async function listRemisionesByTicket(db: Queryable, ticketId: string): Promise<Remision[]> {
  const r = await db.query('SELECT * FROM remisiones WHERE ticket_id = $1 ORDER BY created_at DESC', [ticketId])
  return r.rows.map(toRemision)
}

/**
 * Registra el desenlace que informa n8n. `ok_con_avisos` es un éxito: la remisión se generó pero
 * falló algún aviso (correo o Telegram), y por decisión de producto eso NO invalida la remisión.
 */
export async function setResultadoRemision(
  db: Queryable,
  id: string,
  estado: 'ok' | 'ok_con_avisos' | 'error',
  resultado: unknown,
): Promise<void> {
  await db.query('UPDATE remisiones SET estado = $2, resultado = $3, resuelto_at = now() WHERE id = $1', [id, estado, J(resultado)])
}

/**
 * Devuelve la remisión a `pendiente` antes de un reenvío. El estado se escribe en literal y no como
 * parámetro porque pg-mem no tipa bien los `$n` en `SET`, y estos tests corren sobre pg-mem.
 */
export async function reiniciarRemision(db: Queryable, id: string): Promise<void> {
  await db.query("UPDATE remisiones SET estado = 'pendiente', resultado = NULL, resuelto_at = NULL WHERE id = $1", [id])
}

export async function addFoto(
  db: Queryable,
  input: { remisionId: string; filename: string; contentType: string; contentB64: string; size: number },
): Promise<RemisionFoto> {
  const id = `rf-${randomUUID()}`
  await db.query(
    'INSERT INTO remision_fotos (id, remision_id, filename, content_type, content_b64, size) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, input.remisionId, input.filename, input.contentType, input.contentB64, input.size],
  )
  return { id, filename: input.filename, contentType: input.contentType, size: input.size }
}

/** Metadatos de las fotos, sin el base64: devolverlo en los listados dispararía el peso de la respuesta. */
export async function listFotos(db: Queryable, remisionId: string): Promise<RemisionFoto[]> {
  const r = await db.query(
    'SELECT id, filename, content_type, size FROM remision_fotos WHERE remision_id = $1 ORDER BY created_at',
    [remisionId],
  )
  return r.rows.map((x: Record<string, unknown>) => ({
    id: String(x.id), filename: (x.filename as string) ?? '', contentType: (x.content_type as string) ?? '',
    size: Number(x.size ?? 0),
  }))
}

/** Fotos CON su base64, para mandarlas a n8n. Se usa solo al enviar, no en los listados. */
export async function listFotosConContenido(db: Queryable, remisionId: string): Promise<Array<{ fileName: string; mimeType: string; data: string }>> {
  const r = await db.query(
    'SELECT filename, content_type, content_b64 FROM remision_fotos WHERE remision_id = $1 ORDER BY created_at',
    [remisionId],
  )
  return r.rows.map((x: Record<string, unknown>) => ({
    fileName: (x.filename as string) ?? 'foto.jpg',
    mimeType: (x.content_type as string) ?? 'image/jpeg',
    data: (x.content_b64 as string) ?? '',
  }))
}

export async function getFotoContent(db: Queryable, remisionId: string, fotoId: string): Promise<{ contentType: string; contentB64: string } | null> {
  const r = await db.query('SELECT content_type, content_b64 FROM remision_fotos WHERE id = $1 AND remision_id = $2', [fotoId, remisionId])
  const x = r.rows[0]
  return x ? { contentType: x.content_type ?? 'application/octet-stream', contentB64: x.content_b64 } : null
}
