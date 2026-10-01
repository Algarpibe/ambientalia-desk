import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/** Metadatos de un PDF del certificado de fábrica; el contenido sólo sale por `contenidoCertificado`. */
export interface CertificadoFabricaMeta { id: string; filename: string; size: number; transicionId: number }

type FilaMeta = { id: string; filename: string | null; size: number | null; transicion_id: string | number }
const aMeta = (x: FilaMeta): CertificadoFabricaMeta => ({ id: x.id, filename: x.filename ?? '', size: x.size ?? 0, transicionId: Number(x.transicion_id) })

export async function ticketExiste(db: Queryable, ticketId: string): Promise<boolean> {
  return (await db.query('SELECT 1 FROM tickets WHERE id=$1', [ticketId])).rows.length > 0
}

/** `ticket_transitions.id` de la ÚLTIMA `liberacion` del ticket, o `null` si nunca se liberó. */
export async function ultimaLiberacion(db: Queryable, ticketId: string): Promise<number | null> {
  const r = await db.query("SELECT id FROM ticket_transitions WHERE ticket_id=$1 AND transition_id='liberacion' ORDER BY id DESC LIMIT 1", [ticketId])
  const fila = r.rows[0] as { id: string | number } | undefined
  return fila ? Number(fila.id) : null
}

export async function agregarCertificado(
  db: Queryable,
  a: { ticketId: string; transicionId: number; filename: string; contentB64: string; size: number; by: string | null },
): Promise<CertificadoFabricaMeta> {
  const id = 'cf-' + randomUUID()
  await db.query(
    'INSERT INTO public.certificados_fabrica (id, ticket_id, transicion_id, filename, content_b64, size, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, a.ticketId, a.transicionId, a.filename, a.contentB64, a.size, a.by],
  )
  return { id, filename: a.filename, size: a.size, transicionId: a.transicionId }
}

export async function listarCertificados(db: Queryable, ticketId: string): Promise<CertificadoFabricaMeta[]> {
  const r = await db.query('SELECT id, filename, size, transicion_id FROM public.certificados_fabrica WHERE ticket_id=$1 ORDER BY created_at ASC, id ASC', [ticketId])
  return (r.rows as FilaMeta[]).map(aMeta)
}

/** Base64 del PDF. Se pide por ticket Y por id: un id de otro ticket no sale por esta puerta. */
export async function contenidoCertificado(db: Queryable, ticketId: string, id: string): Promise<string | null> {
  const r = await db.query('SELECT content_b64 FROM public.certificados_fabrica WHERE id=$1 AND ticket_id=$2', [id, ticketId])
  return (r.rows[0] as { content_b64: string } | undefined)?.content_b64 ?? null
}

export async function borrarCertificado(db: Queryable, ticketId: string, id: string): Promise<void> {
  await db.query('DELETE FROM public.certificados_fabrica WHERE id=$1 AND ticket_id=$2', [id, ticketId])
}
