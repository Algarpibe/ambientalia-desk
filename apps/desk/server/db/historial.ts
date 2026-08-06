import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { HistoryDetail, HistoryEvent, RemisionResultado } from '@ambientalia/shared'
import { ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA, urlSegura } from '@ambientalia/shared'
import { getZohoHistoryEvents } from '@ambientalia/zoho-sync/db/history'
import {
  camposDiligenciados, datosTicket, esCreacion, iso, json, lectorCreacion, listaIncluye, planSyncZoho,
  porFechaDesc, textoEquipo, type PlanSyncZoho,
} from './ticketFuentes'

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
      ...detalles(camposDiligenciados(fila.values)),
    ],
  }
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

/** El orden que `HistoriaPanel` espera: lo más reciente arriba. */
const masRecientePrimero = porFechaDesc<HistoryEvent>((e) => e.time)

/**
 * Toda la historia del ticket en una sola línea de tiempo: lo que vino de Zoho, las transiciones de
 * la app y sus remisiones. Se DERIVA al leer y no se registran eventos nuevos, que es lo que hace
 * que aparezca sola la historia ya existente —las 149 remisiones migradas incluidas—.
 */
export async function getHistorialTicket(db: Queryable, ticketId: string): Promise<HistorialTicket> {
  const zoho = await getZohoHistoryEvents(db, ticketId)

  const { ticket, cliente } = await datosTicket(db, ticketId)

  const tr = await db.query(
    'SELECT transition_name, from_status, to_status, area, performed_by, performed_at, values FROM ticket_transitions WHERE ticket_id = $1',
    [ticketId],
  )
  const transiciones = (tr.rows as Record<string, unknown>[]).map((f) =>
    esCreacion(f) ? eventoCreacion(f, ticket, cliente) : eventoTransicion(f),
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
