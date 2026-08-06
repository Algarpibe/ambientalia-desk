import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { HistoryDetail, HistoryEvent, RemisionResultado } from '@ambientalia/shared'
import { ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA, urlSegura } from '@ambientalia/shared'
import { getZohoHistoryEvents } from '@ambientalia/zoho-sync/db/history'
import { iso, json, lectorCreacion, planSyncZoho, textoEquipo, type PlanSyncZoho } from './ticketFuentes'

// Reexportado para no romper a quien importe el tipo de aquí: `getHistorialTicket` lo devuelve.
export type { PlanSyncZoho }

export interface HistorialTicket {
  eventos: HistoryEvent[]
  sincronizarConZoho: PlanSyncZoho
}

/** Descarta los detalles vacíos: una lista de seis "—" no informa de nada. */
function detalles(pares: Array<[string, unknown]>): HistoryDetail[] {
  return pares
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([label, v]) => ({ label, value: String(v) }))
}

/**
 * `values` guarda las claves con el nombre técnico del campo (`requiere_repuestos`). No se traducen
 * con un diccionario a propósito: el conjunto de campos lo decide el Blueprint y un diccionario
 * quedaría desactualizado en silencio el día que alguien añada uno.
 */
function etiquetaCampo(clave: string): string {
  const t = clave.replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function eventoCreacion(fila: Record<string, unknown>, ticket: Record<string, unknown>, cliente: string | null): HistoryEvent {
  const de = lectorCreacion(fila.values, ticket)
  // `Cliente` se escapa de la regla de `hayFoto` a propósito: sale siempre del estado actual aunque
  // la foto guarde `client_id`, porque el NOMBRE vive en otra tabla y resolverlo por la foto pediría
  // una segunda consulta. Hoy da igual —la app no tiene ninguna forma de reasignar el cliente de un
  // ticket, así que foto y fila siempre coinciden—. El día que la haya, este detalle tiene que pasar
  // por `de()` como los demás.
  return {
    eventName: 'AppTicketCreado',
    time: iso(fila.performed_at),
    actor: (fila.performed_by as string) ?? 'App',
    title: 'Ticket creado',
    details: detalles([
      ['Cliente', cliente],
      ['Orden de venta', de('orden_venta', 'orden_venta')],
      ['Equipo', textoEquipo(de('marca', 'marca'), de('modelo', 'modelo'), de('serial', 'serial'))],
      ['Tipo de servicio', de('tipo_servicio', 'tipo_servicio')],
      ['Clasificación', de('clasificacion', 'classification')],
      ['Prioridad', de('prioridad', 'priority')],
      ['Código de servicio', de('codigo_servicio', 'codigo_servicio')],
    ]),
  }
}

function eventoTransicion(fila: Record<string, unknown>): HistoryEvent {
  const v = json(fila.values)
  return {
    eventName: 'AppTransition',
    time: iso(fila.performed_at),
    actor: (fila.performed_by as string) ?? 'App',
    title: `Transición: ${fila.transition_name ?? ''}`.trim(),
    details: [
      ...detalles([
        ['Estado', `${fila.from_status ?? '—'} → ${fila.to_status ?? '—'}`],
        ['Área', fila.area],
      ]),
      // La anotación de tupla es necesaria: sin ella `map` infiere `unknown[][]` y no encaja con
      // `Array<[string, unknown]>`.
      ...detalles(Object.entries(v).map(([k, val]): [string, unknown] => [etiquetaCampo(k), val])),
    ],
  }
}

/** `incluye` es un `jsonb` con un array: pg lo entrega parseado, pg-mem como texto. */
function listaIncluye(v: unknown): string {
  const arr = typeof v === 'string' ? JSON.parse(v) : v
  return Array.isArray(arr) ? arr.join(', ') : ''
}

function eventosRemision(fila: Record<string, unknown>): HistoryEvent[] {
  const lista = listaIncluye(fila.incluye)
  const tecnico = (fila.creado_por as string) ?? 'App'
  const out: HistoryEvent[] = [{
    eventName: 'RemisionCreada',
    time: iso(fila.created_at),
    actor: tecnico,
    // `tipo` en vez de "entrada" fija: hoy los dos caminos de inserción lo ponen a 'entrada' y el
    // texto saldría igual, pero la remisión de salida está en el roadmap y entonces este título
    // mentiría. La columna es NOT NULL DEFAULT 'entrada', así que siempre trae algo.
    title: `Remisión de ${String(fila.tipo)} creada`,
    details: detalles([
      ['Técnico', tecnico],
      ['Fecha de servicio', fila.fecha instanceof Date ? fila.fecha.toISOString().slice(0, 10) : fila.fecha],
      ['Tipo de servicio', fila.tipo_servicio],
      ['Incluye', lista],
      ['Observaciones', fila.observaciones],
    ]),
  }]

  const resuelto = iso(fila.resuelto_at)
  if (resuelto) {
    const r = json(fila.resultado) as RemisionResultado
    const estado = String(fila.estado ?? '')
    const url = urlSegura(r.carpetaUrl)
    const enlace: HistoryDetail[] = url
      ? [{ label: 'Carpeta en Drive', value: `<a href="${url}" target="_blank" rel="noopener noreferrer">Abrir carpeta</a>`, html: true }]
      : []
    out.push({
      eventName: 'RemisionDesenlace',
      time: resuelto,
      actor: tecnico,
      title: `Remisión: ${ETIQUETA_ESTADO_REMISION[estado] ?? ETIQUETA_ESTADO_REMISION_DESCONOCIDA}`,
      details: [
        ...enlace,
        ...detalles([
          ['Fotos', r.fotos ? `${r.fotos.subidas} de ${r.fotos.recibidas}` : null],
          ['Avisos', (r.avisos ?? []).map((a) => a.paso).join(', ')],
          ['Fallos', (r.fallos ?? []).map((f) => f.paso).join(', ')],
        ]),
      ],
    })
  }

  const anulada = iso(fila.anulada_at)
  if (anulada) {
    out.push({
      eventName: 'RemisionAnulada',
      time: anulada,
      actor: (fila.anulada_por as string) ?? 'App',
      title: 'Remisión anulada',
      details: detalles([['Anulada por', fila.anulada_por]]),
    })
  }
  return out
}

/** Descendente por tiempo, con los que no lo tienen al final: es el orden que `HistoriaPanel` espera. */
function masRecientePrimero(a: HistoryEvent, b: HistoryEvent): number {
  const ta = a.time ? Date.parse(a.time) : NaN
  const tb = b.time ? Date.parse(b.time) : NaN
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
  if (Number.isNaN(ta)) return 1
  if (Number.isNaN(tb)) return -1
  return tb - ta
}

/**
 * Toda la historia del ticket en una sola línea de tiempo: lo que vino de Zoho, las transiciones de
 * la app y sus remisiones. Se DERIVA al leer y no se registran eventos nuevos, que es lo que hace
 * que aparezca sola la historia ya existente —las 149 remisiones migradas incluidas—.
 */
export async function getHistorialTicket(db: Queryable, ticketId: string): Promise<HistorialTicket> {
  const zoho = await getZohoHistoryEvents(db, ticketId)

  const t = await db.query(
    'SELECT marca, modelo, serial, tipo_servicio, classification, priority, orden_venta, codigo_servicio, client_id FROM tickets WHERE id = $1',
    [ticketId],
  )
  const ticket = (t.rows[0] as Record<string, unknown>) ?? {}

  // Consulta aparte y no un JOIN: `clients` es una vista sobre `books.contacts` y pg-mem —el motor
  // de los tests— tropieza con los joins contra vistas de otro esquema.
  let cliente: string | null = null
  if (ticket.client_id) {
    const c = await db.query('SELECT name, company_name FROM clients WHERE id = $1', [ticket.client_id])
    const fila = c.rows[0] as Record<string, unknown> | undefined
    cliente = (fila?.company_name as string) || (fila?.name as string) || null
  }

  const tr = await db.query(
    'SELECT transition_name, from_status, to_status, area, performed_by, performed_at, values FROM ticket_transitions WHERE ticket_id = $1',
    [ticketId],
  )
  const transiciones = (tr.rows as Record<string, unknown>[]).map((f) =>
    f.from_status === '(creación)' ? eventoCreacion(f, ticket, cliente) : eventoTransicion(f),
  )

  // Consulta propia y no `listRemisionesByTicket`: aquélla filtra `anulada_at IS NULL` porque el
  // panel del ticket solo enseña lo vigente, y aquí hacen falta justo las anuladas — el historial
  // registra lo que PASÓ, y una remisión anulada pasó (y su anulación también).
  const rem = await db.query(
    `SELECT id, tipo, fecha, tipo_servicio, incluye, observaciones, creado_por, estado, resultado,
            created_at, resuelto_at, anulada_at, anulada_por
       FROM remisiones WHERE ticket_id = $1`,
    [ticketId],
  )
  const remisiones = (rem.rows as Record<string, unknown>[]).flatMap(eventosRemision)

  const eventos = [...zoho, ...transiciones, ...remisiones].sort(masRecientePrimero)

  const sincronizarConZoho = planSyncZoho(ticketId, zoho.length > 0)

  return { eventos, sincronizarConZoho }
}
