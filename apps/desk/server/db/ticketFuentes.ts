/**
 * Lo que comparten los dos compositores del ticket: `historial.ts` (el log) y `conversacion.ts` (el
 * relato). Vive aquí y no duplicado en cada uno porque la regla de la foto de creación es sutil —ya
 * se implementó mal una vez— y dos copias divergen en cuanto alguien toca una.
 *
 * Lo que NO vive aquí: el texto de cada evento o entrada. Los dos compositores dicen cosas distintas
 * a propósito —uno hace un log, el otro un relato— y unificar la redacción los ataría mal.
 *
 * `iso`, `json` y `porFechaDesc` no son del ticket, son utilidades: las usa también la hoja de vida
 * del equipo (`equipos.ts`), que compone su cronología con las mismas reglas de orden y de jsonb.
 */
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { FROM_STATUS_CREACION } from '@ambientalia/shared'

/** Qué hacer con Zoho antes de responder. */
export type PlanSyncZoho = 'no' | 'ahora' | 'en-segundo-plano'

/**
 * Si esta fila de `ticket_transitions` es la foto de la creación y no una transición.
 *
 * El literal vive en shared —lo escribe `createTicket`— y aquí solo se compara, para que el
 * escritor y los dos lectores no puedan divergir: si divergieran, los dos paneles contarían la
 * creación como una transición genérica sin que fallara ningún test.
 */
export function esCreacion(fila: Record<string, unknown>): boolean {
  return fila.from_status === FROM_STATUS_CREACION
}

/**
 * Si el ticket nació en la app, Zoho no lo conoce y preguntarle por él es un 404 en cada apertura.
 *
 * Se mira el PREFIJO del id y no `managed_by_app` ni `source`, que parecen decir "esto nació en la
 * app" y no lo dicen: `writeTransition` pone las dos —`managed_by_app=true` y `source='app'`, en el
 * mismo UPDATE— en CUALQUIER transición hecha desde Desk, también las de un ticket que vino de Zoho.
 * Usarlas dejaba a ese ticket sin refrescar jamás su historia de Zoho desde la primera vez que
 * alguien lo moviera aquí, y como `syncTicketHistory` solo se llama desde esa ruta, nadie más lo
 * repararía. El id sí es inmutable: `createTicket` es el único sitio que acuña ids de ticket y
 * siempre les pone el prefijo `app-` — los de Zoho son numéricos — y ningún UPDATE lo toca.
 */
export function nacidoEnLaApp(ticketId: string): boolean {
  return ticketId.startsWith('app-')
}

export function planSyncZoho(ticketId: string, hayDatosDeZoho: boolean): PlanSyncZoho {
  if (nacidoEnLaApp(ticketId)) return 'no'
  return hayDatosDeZoho ? 'en-segundo-plano' : 'ahora'
}

/** `timestamptz`: pg y pg-mem lo entregan como `Date`; el histórico puede traer texto. */
export const iso = (v: unknown): string | null => (v instanceof Date ? v.toISOString() : v ? String(v) : null)

/** `jsonb`: pg lo entrega parseado, pg-mem como texto. */
export const json = (v: unknown): Record<string, unknown> =>
  typeof v === 'string' ? (JSON.parse(v) as Record<string, unknown>) : ((v as Record<string, unknown>) ?? {})

/** "Grimm EDM180C · serie 18A20070", saltándose lo que falte. */
export function textoEquipo(marca: unknown, modelo: unknown, serial: unknown): string {
  const nombre = [marca, modelo].filter((x) => x != null && String(x).trim() !== '').join(' ')
  const s = serial != null && String(serial).trim() !== '' ? `serie ${serial}` : ''
  return [nombre, s].filter(Boolean).join(' · ')
}

/**
 * Lector de los datos de creación. Hay foto o no la hay: se decide UNA vez, no campo a campo. Los
 * tickets anteriores a que `createTicket` guardara el payload completo dejaron en `values` solo
 * `orden_venta`, así que la presencia de cualquier otra clave es el discriminador. Mezclar con
 * `v[c] ?? ticket[col]` sería un error sutil: la foto guarda los `null` explícitos, de modo que un
 * campo que el técnico dejó vacío ese día caería a la columna y mostraría el estado ACTUAL — justo la
 * mentira que la foto evita.
 */
export function lectorCreacion(values: unknown, ticket: Record<string, unknown>) {
  const v = json(values)
  const hayFoto = Object.keys(v).some((k) => k !== 'orden_venta')
  return (clave: string, columna: string): unknown => (hayFoto ? v[clave] : ticket[columna])
}

/**
 * `values` guarda las claves con el nombre técnico del campo (`requiere_repuestos`). No se traducen
 * con un diccionario a propósito: el conjunto de campos lo decide el Blueprint y un diccionario
 * quedaría desactualizado en silencio el día que alguien añada uno.
 */
export function etiquetaCampo(clave: string): string {
  const t = clave.replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * Los campos que una transición diligenció, listos para enseñar: sin los vacíos y sin el comentario.
 *
 * El comentario se saca porque `writeTransition` YA lo guarda como conversación propia, así que
 * dejarlo aquí lo enseñaba dos veces —una como mensaje y otra como campo— y encima etiquetado
 * "Comment": su clave es `comment`, en inglés, y `etiquetaCampo` solo pone la inicial en mayúscula.
 * Era la única palabra en inglés de la interfaz.
 */
export function camposDiligenciados(values: unknown): Array<[string, string]> {
  return Object.entries(json(values))
    .filter(([k, v]) => k !== 'comment' && v != null && String(v).trim() !== '')
    .map(([k, v]) => [etiquetaCampo(k), String(v)])
}

/** `incluye` es un `jsonb` con un array: pg lo entrega parseado, pg-mem como texto. */
export function listaIncluye(v: unknown): string {
  const arr = typeof v === 'string' ? JSON.parse(v) : v
  return Array.isArray(arr) ? arr.join(', ') : ''
}

/**
 * Comparador descendente por tiempo, con los que no lo tienen al final: es el orden que esperan los
 * dos paneles. Es una fábrica y no un comparador fijo porque cada compositor ordena elementos de
 * tipo distinto —`HistoryEvent` lleva el instante en `time`, el relato lo lleva aparte porque su
 * `time` ya viene formateado y ordenar por él sería ordenar alfabéticamente—.
 */
export function porFechaDesc<T>(instanteDe: (x: T) => string | null): (a: T, b: T) => number {
  return (a, b) => {
    const ta = instanteDe(a) ? Date.parse(instanteDe(a)!) : NaN
    const tb = instanteDe(b) ? Date.parse(instanteDe(b)!) : NaN
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return tb - ta
  }
}

/** La fila del ticket con los campos de creación, más el nombre del cliente ya resuelto. */
export interface DatosTicket {
  ticket: Record<string, unknown>
  cliente: string | null
}

/**
 * Los datos del ticket que los dos compositores necesitan para la entrada de creación.
 *
 * El cliente se pide en una consulta APARTE y no con un JOIN: `clients` es una vista sobre
 * `books.contacts` y pg-mem —el motor de los tests— tropieza con los joins contra vistas de otro
 * esquema.
 */
export async function datosTicket(db: Queryable, ticketId: string): Promise<DatosTicket> {
  const t = await db.query(
    'SELECT marca, modelo, serial, tipo_servicio, classification, priority, orden_venta, codigo_servicio, client_id FROM tickets WHERE id = $1',
    [ticketId],
  )
  const ticket = (t.rows[0] as Record<string, unknown>) ?? {}

  let cliente: string | null = null
  if (ticket.client_id) {
    const c = await db.query('SELECT name, company_name FROM clients WHERE id = $1', [ticket.client_id])
    const fila = c.rows[0] as Record<string, unknown> | undefined
    cliente = (fila?.company_name as string) || (fila?.name as string) || null
  }

  return { ticket, cliente }
}
