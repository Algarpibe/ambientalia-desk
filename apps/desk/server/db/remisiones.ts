import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Remision, RemisionFoto, RemisionListado } from '@ambientalia/shared'
import { VENTANA_REENVIO_SEGUNDOS } from '@ambientalia/shared'

const J = (v: unknown) => JSON.stringify(v ?? null)

function toRemision(r: Record<string, unknown>): Remision {
  return {
    id: String(r.id), ticketId: (r.ticket_id as string) ?? null, tipo: String(r.tipo),
    fecha: r.fecha instanceof Date ? r.fecha.toISOString().slice(0, 10) : String(r.fecha ?? ''),
    tipoServicio: (r.tipo_servicio as string) ?? null, perfil: (r.perfil as string) ?? null,
    equipoId: (r.equipo_id as string) ?? null, serial: (r.serial as string) ?? null,
    // `incluye` puede llegar como texto (pg-mem) o ya parseado (pg con jsonb).
    incluye: typeof r.incluye === 'string' ? JSON.parse(r.incluye) : ((r.incluye as string[]) ?? []),
    observaciones: (r.observaciones as string) ?? null, creadoPor: (r.creado_por as string) ?? null,
    estado: String(r.estado) as Remision['estado'],
    resultado: typeof r.resultado === 'string' ? JSON.parse(r.resultado) : ((r.resultado as Remision['resultado']) ?? null),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ''),
    empresa: (r.empresa as string) ?? null, personaContacto: (r.persona_contacto as string) ?? null,
    origen: String(r.origen ?? 'app'),
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
  empresa: string | null
  personaContacto: string | null
}

/** Crea la remisión en estado `pendiente`: el flujo de n8n aún no ha respondido. */
export async function createRemision(db: Queryable, input: CreateRemisionInput): Promise<string> {
  const id = `rem-${randomUUID()}`
  await db.query(
    `INSERT INTO remisiones (id, ticket_id, tipo, fecha, tipo_servicio, perfil, equipo_id, serial, incluye, observaciones, creado_por, estado, empresa, persona_contacto)
     VALUES ($1,$2,'entrada',$3,$4,$5,$6,$7,$8,$9,$10,'pendiente',$11,$12)`,
    [id, input.ticketId, input.fecha, input.tipoServicio, input.perfil, input.equipoId, input.serial,
      J(input.incluye), input.observaciones, input.creadoPor, input.empresa, input.personaContacto],
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
 * Vuelca la tabla completa para la sección "Remisiones" de la cabecera: la vista que tenía la hoja
 * de Google, histórico y app juntos. Sin paginar —el filtrado va en el cliente, sobre todo lo
 * cargado— pero con un `LIMIT` de seguridad: hoy son ~170 filas creciendo ~100/año, así que faltan
 * décadas para tocarlo. El día que se alcance, hay que paginar en servidor (como
 * `GET /api/tickets?scope=closed`) en vez de subir el número.
 */
export async function listRemisionesListado(db: Queryable): Promise<RemisionListado[]> {
  const r = await db.query(
    `SELECT r.id, r.fecha, r.creado_por, r.empresa, r.persona_contacto, r.serial, r.incluye,
            r.tipo_servicio, r.observaciones, r.estado, r.origen, r.ticket_id,
            e.marca, e.modelo, t.number AS ticket_number
       FROM remisiones r
       LEFT JOIN equipos e ON r.equipo_id = e.id
       LEFT JOIN tickets t ON r.ticket_id = t.id
      ORDER BY r.fecha DESC, r.created_at DESC
      LIMIT 2000`,
  )
  return r.rows.map((x: Record<string, unknown>) => ({
    id: String(x.id),
    fecha: x.fecha instanceof Date ? x.fecha.toISOString().slice(0, 10) : String(x.fecha ?? ''),
    tecnico: (x.creado_por as string) ?? null,
    empresa: (x.empresa as string) ?? null,
    personaContacto: (x.persona_contacto as string) ?? null,
    marca: (x.marca as string) ?? null,
    modelo: (x.modelo as string) ?? null,
    serial: (x.serial as string) ?? null,
    incluye: typeof x.incluye === 'string' ? JSON.parse(x.incluye) : ((x.incluye as string[]) ?? []),
    tipoServicio: (x.tipo_servicio as string) ?? null,
    observaciones: (x.observaciones as string) ?? null,
    ticketId: (x.ticket_id as string) ?? null,
    ticketNumero: x.ticket_number != null ? `#${x.ticket_number}` : null,
    estado: String(x.estado) as RemisionListado['estado'],
    origen: String(x.origen ?? 'app'),
  }))
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
 * Reclama el envío de la remisión y dice si se puede seguir adelante. Es un ÚNICO `UPDATE`
 * condicional y no un `SELECT` seguido de un `UPDATE`: dos peticiones simultáneas —doble clic, dos
 * pestañas, o un reintento tras perder la cobertura— pasarían las dos el filtro si se leyera
 * primero, y cada una generaría su propio documento y su propia carpeta en Drive.
 *
 * Se puede reclamar si nunca se disparó, si el intento anterior ya terminó (`resuelto_at`), o si el
 * disparo anterior lleva más de la ventana sin contestar, en cuyo caso se da por perdido. La ventana
 * por defecto es `VENTANA_REENVIO_SEGUNDOS`, deliberadamente mayor que lo que espera la pantalla
 * antes de ofrecer reintentar: así el botón "Reintentar" no dispara un segundo documento mientras
 * el primer intento sigue en curso (ver el comentario de la constante).
 *
 * De paso deja el estado en `pendiente` y limpia el desenlace anterior: si quedara el `error` del
 * intento previo, el sondeo daría por fracasado un envío que acaba de empezar.
 */
export async function reclamarEnvio(db: Queryable, id: string, ventanaSegundos = VENTANA_REENVIO_SEGUNDOS): Promise<boolean> {
  const corte = new Date(Date.now() - ventanaSegundos * 1000)
  const r = await db.query(
    `UPDATE remisiones
        SET enviado_at = now(), estado = $2, resultado = NULL, resuelto_at = NULL
      WHERE id = $1
        AND estado <> 'ok' AND estado <> 'ok_con_avisos'
        AND (enviado_at IS NULL OR resuelto_at IS NOT NULL OR enviado_at < $3)
      RETURNING id`,
    [id, 'pendiente', corte],
  )
  return (r.rows?.length ?? 0) > 0
}

/** Suelta la reclamación cuando el disparo no llegó a salir, para no obligar a esperar la ventana entera. */
export async function liberarEnvio(db: Queryable, id: string): Promise<void> {
  await db.query('UPDATE remisiones SET enviado_at = NULL WHERE id = $1', [id])
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
