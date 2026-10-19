import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  FROM_STATUS_CREACION, ESTADOS_TERMINALES_DEL_RELOJ, etapasDesdeHistoria, tiemposDelReloj,
  type HistorialTransition, type PasoDelReloj, type TiemposDelReloj,
} from '@ambientalia/shared'
import { esCreacion, json } from './ticketFuentes'
import { listarCierres } from './calendarioCierres'

/**
 * LECTURA DEL RELOJ DEL SLA (F1C-06; RQ-TC-75). Arma, por ticket CERRADO, la secuencia de estados que la
 * regla pura de `packages/shared/src/relojSla.ts` convierte en horas hábiles. Aquí no hay regla de
 * dominio: sólo se juntan las dos épocas del ticket y se decide cuándo no hay dato.
 *
 * Tres consultas FIJAS, las mismas con diez tickets que con cien, y NINGUNA si no hay filas cerradas
 * (S-D1: sólo los cerrados entran en las medias, y así `analisis.test.ts` conserva sus cuentas). La
 * subconsulta no está correlacionada, el molde que pg-mem ya acepta en `sla.ts:88-89`; la agrupación por
 * ticket se hace en TypeScript, sin `GROUP BY`. Es una LECTURA: no escribe ni exige migración.
 */

type Fila = Record<string, unknown>

const ES_TERMINAL = (estado: string): boolean => (ESTADOS_TERMINALES_DEL_RELOJ as readonly string[]).includes(estado)

const instanteDe = (v: unknown): number => (v == null ? NaN : new Date(v as string | number | Date).getTime())

/**
 * La secuencia de `{ estado, desde }` de un ticket, o `null` si no hay historia suficiente (S-5).
 *
 * - La foto de creación (`from_status = FROM_STATUS_CREACION`) NO es una entrada: da el estado inicial.
 * - Entradas: las transiciones de la app (desempate por `id`) y las etapas de Zoho, juntas y ordenadas
 *   (precedente `equipos.ts:317-325`; no se duplican porque Desk no escribe en Zoho).
 * - Estado inicial: el de la foto; si no hay, el `fromStatus` de la entrada más antigua. Empieza en
 *   `created_time` del ticket (S-7).
 * - Si el último estado de la secuencia no es el actual, `null`: no se inventa un tramo para el hueco.
 */
export function secuenciaDelReloj(
  ticket: { status: unknown; createdAt: unknown },
  filasApp: readonly Fila[],
  etapasZoho: readonly HistorialTransition[],
): PasoDelReloj[] | null {
  const foto = filasApp.find((f) => f.from_status === FROM_STATUS_CREACION)
  const entradas: Array<{ t: number; de: string | null; hacia: string | null }> = [
    ...filasApp.filter((f) => !esCreacion(f)).sort((x, y) => Number(x.id) - Number(y.id))
      .map((f) => ({ t: instanteDe(f.performed_at), de: (f.from_status as string | null) ?? null, hacia: (f.to_status as string | null) ?? null })),
    ...etapasZoho.map((e) => ({ t: instanteDe(e.performedAt), de: e.fromStatus ?? null, hacia: e.toStatus ?? null })),
  ].sort((x, y) => x.t - y.t) // el orden estable conserva el de `id` y deja a la app antes que a Zoho en un empate
  if (entradas.length === 0 && !foto) return null
  if (entradas.some((e) => Number.isNaN(e.t) || !e.hacia)) return null

  const creado = instanteDe(ticket.createdAt)
  const inicial = foto ? ((foto.to_status as string | null) ?? null) : (entradas[0]?.de ?? null)
  if (Number.isNaN(creado) || !inicial) return null

  const pasos: PasoDelReloj[] = [
    { estado: inicial, desde: new Date(creado) },
    ...entradas.map((e) => ({ estado: e.hacia as string, desde: new Date(e.t) })),
  ]
  return pasos[pasos.length - 1].estado === ticket.status ? pasos : null
}

/**
 * Los dos tiempos del reloj de cada fila, por id de ticket. Toda fila de `filas` aparece en el mapa:
 * las abiertas, las que no cierran en estado terminal (S-D2) y las sin historia suficiente llevan `null`.
 */
export async function tiemposDelRelojPorTicket(
  db: Queryable,
  filas: readonly Fila[],
  ahora: Date,
): Promise<Map<string, TiemposDelReloj | null>> {
  const resultado = new Map<string, TiemposDelReloj | null>(filas.map((f) => [String(f.id), null]))
  // S-D2: un cerrado cuyo estado no es terminal correría hasta `ahora`, y eso es inventar tiempo.
  const cerradas = filas.filter((f) => f.status_type === 'Closed' && ES_TERMINAL(String(f.status)))
  if (cerradas.length === 0) return resultado

  const [transiciones, historia, cierres] = await Promise.all([
    db.query(
      `SELECT id, ticket_id, from_status, to_status, performed_at FROM ticket_transitions
       WHERE ticket_id IN (SELECT id FROM tickets WHERE status_type = 'Closed')`,
    ),
    db.query(
      `SELECT ticket_id, raw FROM ticket_history
       WHERE event_name = 'TicketUpdated' AND ticket_id IN (SELECT id FROM tickets WHERE status_type = 'Closed')`,
    ),
    listarCierres(db),
  ])

  const appPorTicket = new Map<string, Fila[]>()
  for (const r of transiciones.rows as Fila[]) {
    const id = String(r.ticket_id)
    appPorTicket.set(id, [...(appPorTicket.get(id) ?? []), r])
  }
  const zohoPorTicket = new Map<string, unknown[]>()
  for (const r of historia.rows as Fila[]) {
    const id = String(r.ticket_id)
    zohoPorTicket.set(id, [...(zohoPorTicket.get(id) ?? []), json(r.raw)])
  }

  const conjuntoCierres = new Set(cierres)
  for (const f of cerradas) {
    const id = String(f.id)
    const pasos = secuenciaDelReloj(
      { status: f.status, createdAt: f.created_time },
      appPorTicket.get(id) ?? [],
      etapasDesdeHistoria(zohoPorTicket.get(id) ?? []),
    )
    resultado.set(id, pasos ? tiemposDelReloj(pasos, ahora, conjuntoCierres) : null)
  }
  return resultado
}
