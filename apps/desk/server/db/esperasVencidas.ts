import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ESTADOS_SIN_SALIDA, etapasDesdeHistoria, flujoDelTicket, type Estado } from '@ambientalia/shared'
import { secuenciaDelReloj } from './relojSla'
import { json } from './ticketFuentes'

/**
 * LECTURA de las esperas en curso (salidas-esperas, F1C-03; RQ-AV-26; `design.md` D4 a). Para cada ticket que está AHORA en una de las
 * cuatro esperas, desde cuándo lo está: el último paso de `secuenciaDelReloj`, que funde las transiciones de la app con las etapas de
 * Zoho (`etapasDesdeHistoria`) y es el mismo método de la medición de los plazos. Aquí no hay regla de dominio: el vencimiento lo decide
 * `esperaVencida` de `shared`.
 *
 * Tres consultas FIJAS, las mismas con diez tickets que con cien (molde `relojSla.ts`): tickets, sus transiciones y su historial de
 * Zoho, con la subconsulta no correlacionada que pg-mem ya acepta; la agrupación por ticket va en TypeScript, sin `GROUP BY`. Sin
 * secuencia (sin historia, sin fecha de creación o con un hueco) el ticket no se mide (S-16): se omite antes que inventarle un origen.
 */
export interface EsperaEnCurso {
  id: string
  number: number
  estado: Estado
  /** El instante en que el ticket entró en esa espera por ÚLTIMA vez. */
  desde: Date
  derivadoA: string | null
}

type Fila = Record<string, unknown>

export async function ticketsEnEspera(db: Queryable): Promise<EsperaEnCurso[]> {
  const estados: string[] = [...ESTADOS_SIN_SALIDA]
  const m = estados.map((_, i) => `$${i + 1}`).join(', ')
  const r = await db.query(`SELECT id, number, status, classification, created_time, derivado_a FROM tickets WHERE status IN (${m})`, estados)
  const candidatos = (r.rows as Fila[]).filter((f) => flujoDelTicket({ classification: f.classification as string | null, status: String(f.status) }) === 'servicio')
  if (candidatos.length === 0) return []

  const [transiciones, historia] = await Promise.all([
    db.query(
      `SELECT id, ticket_id, from_status, to_status, performed_at FROM ticket_transitions
        WHERE ticket_id IN (SELECT id FROM tickets WHERE status IN (${m}))`,
      estados,
    ),
    db.query(
      `SELECT ticket_id, raw FROM ticket_history
        WHERE event_name = 'TicketUpdated' AND ticket_id IN (SELECT id FROM tickets WHERE status IN (${m}))`,
      estados,
    ),
  ])
  const appPorTicket = new Map<string, Fila[]>()
  for (const f of transiciones.rows as Fila[]) appPorTicket.set(String(f.ticket_id), [...(appPorTicket.get(String(f.ticket_id)) ?? []), f])
  const zohoPorTicket = new Map<string, unknown[]>()
  for (const f of historia.rows as Fila[]) zohoPorTicket.set(String(f.ticket_id), [...(zohoPorTicket.get(String(f.ticket_id)) ?? []), json(f.raw)])

  const salida: EsperaEnCurso[] = []
  for (const f of candidatos) {
    const id = String(f.id)
    const pasos = secuenciaDelReloj({ status: f.status, createdAt: f.created_time }, appPorTicket.get(id) ?? [], etapasDesdeHistoria(zohoPorTicket.get(id) ?? []))
    const ultimo = pasos?.[pasos.length - 1]
    if (!ultimo) continue // sin foto de entrada no se mide (S-16)
    salida.push({ id, number: Number(f.number), estado: String(f.status) as Estado, desde: new Date(ultimo.desde), derivadoA: (f.derivado_a as string | null) ?? null })
  }
  return salida
}
