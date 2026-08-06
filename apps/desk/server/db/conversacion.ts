import type { Attachment, Message } from '@ambientalia/shared'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { urlSegura } from '@ambientalia/shared'
import { getConversations } from '@ambientalia/zoho-sync/db/repo'
import { fmtTime, rowToMessage } from '@ambientalia/zoho-sync/db/mappers'
import {
  datosTicket, esCreacion, etiquetaCampo, iso, json, lectorCreacion, listaIncluye, planSyncZoho,
  porFechaDesc, textoEquipo, type DatosTicket, type PlanSyncZoho,
} from './ticketFuentes'

export interface ConversacionTicket {
  mensajes: Message[]
  sincronizarConZoho: PlanSyncZoho
}

/** Un mensaje con su instante real al lado: `Message.time` viene ya formateado y ordenar por él sería ordenar alfabéticamente. */
interface Entrada { at: string | null; msg: Message }

/** Une las líneas que tienen contenido. Una línea vacía en medio de la prosa se lee como un descuido. */
function texto(lineas: Array<string | null | undefined>): string {
  return lineas.filter((l) => l != null && String(l).trim() !== '').join('\n')
}

/**
 * Cierra la frase con punto, salvo que ya termine en uno. Interpolar un nombre y añadirle `.` a
 * secas no vale aquí: casi todas las empresas del sector se llaman "… S.A.S.", así que el hilo
 * diría "Ticket creado para Airlab Consulting S.A.S.." en prácticamente todos los tickets.
 */
function frase(t: string): string {
  const s = t.trim()
  return /[.!?…]$/.test(s) ? s : `${s}.`
}

const enlaceDrive = (id: unknown): string | null =>
  id ? urlSegura(`https://drive.google.com/file/d/${String(id)}/view`) : null
const enlaceDoc = (id: unknown): string | null =>
  id ? urlSegura(`https://docs.google.com/document/d/${String(id)}/edit`) : null

/** Lo que el hilo necesita de una foto: el resto (el base64, el peso) no se usa para enlazarla. */
interface FotoRemision { id: string; filename: string }

/**
 * Los adjuntos de Drive son ENLACES, no ficheros: la app no tiene credenciales de Google y no puede
 * servirlos por el proxy. `size` lleva el tipo en vez del tamaño porque de un fichero de Drive no lo
 * sabemos y la segunda línea de la tarjeta tiene que decir algo.
 *
 * Las fotos son el otro caso: las subió el técnico, viven en `remision_fotos` y las sirve la propia
 * app. Por eso son las únicas que van con `isImage` —el panel las pinta como miniatura— y las únicas
 * cuyo enlace es relativo: mismo origen, así que el `<img>` viaja con la cookie de sesión sin tocar
 * el proxy de adjuntos. Su `size` sigue el convenio de las de Drive y lleva el tipo: en la miniatura
 * esa línea ni se muestra.
 */
function adjuntosRemision(
  resultado: Record<string, unknown>,
  tipo: string,
  remisionId: string,
  fotos: FotoRemision[],
): Attachment[] {
  const posibles: Array<[string, string, string | null]> = [
    [`Remisión de ${tipo}`, 'PDF', enlaceDrive(resultado.pdfId)],
    ['Documento editable', 'Documento', enlaceDoc(resultado.docId)],
    ['Etiqueta .dymo', 'Etiqueta', enlaceDrive(resultado.dymoId)],
    ['Carpeta en Drive', 'Carpeta', urlSegura(resultado.carpetaUrl as string | null | undefined)],
  ]
  // La URL va también en `path` —y no `path: ''`— porque `path` es el respaldo del `href` para
  // cualquier consumidor que aún no mire `url`. La `key` de React ya no depende de esto: el panel
  // usa `att.url ?? att.path`.
  const deDrive: Attachment[] = posibles
    .filter(([, , url]) => url !== null)
    .map(([name, size, url]) => ({ name, size, path: url as string, url: url as string }))

  const deFotos: Attachment[] = fotos.map((f) => {
    const url = `/api/remisiones/${remisionId}/fotos/${f.id}`
    return { name: f.filename, size: 'Foto', path: url, url, isImage: true }
  })

  return [...deDrive, ...deFotos]
}

/**
 * Las fotos de TODAS las remisiones del hilo en una sola consulta, y no `listFotos` por remisión:
 * así el número de consultas no depende de cuántas remisiones tenga el ticket.
 */
async function fotosPorRemision(db: Queryable, remisionIds: string[]): Promise<Map<string, FotoRemision[]>> {
  const por = new Map<string, FotoRemision[]>()
  if (!remisionIds.length) return por
  const ph = remisionIds.map((_, i) => `$${i + 1}`).join(',')
  const r = await db.query(
    `SELECT id, remision_id, filename FROM remision_fotos WHERE remision_id IN (${ph}) ORDER BY created_at`,
    remisionIds,
  )
  for (const f of r.rows as Record<string, unknown>[]) {
    const k = String(f.remision_id)
    por.set(k, [...(por.get(k) ?? []), { id: String(f.id), filename: (f.filename as string) || 'Foto' }])
  }
  return por
}

function entradaCreacion(fila: Record<string, unknown>, ticket: Record<string, unknown>, cliente: string | null): Entrada {
  const de = lectorCreacion(fila.values, ticket)
  const equipo = textoEquipo(de('marca', 'marca'), de('modelo', 'modelo'), de('serial', 'serial'))
  const clas = de('clasificacion', 'classification')
  const prio = de('prioridad', 'priority')
  const at = iso(fila.performed_at)
  // Clasificación y prioridad comparten línea separadas por `·`, no una línea cada una: son dos
  // etiquetas cortas y darles renglón propio alarga la entrada sin aportar nada.
  const clasPrio = [
    clas ? `Clasificación: ${String(clas)}` : null,
    prio ? `Prioridad: ${String(prio)}` : null,
  ].filter(Boolean).join(' · ')
  return {
    at,
    msg: {
      id: `crea-${String(fila.ticket_id)}`,
      author: (fila.performed_by as string) ?? 'App',
      type: 'Privado',
      time: fmtTime(at),
      content: texto([
        cliente ? frase(`Ticket creado para ${cliente}`) : 'Ticket creado.',
        equipo ? `Equipo: ${equipo}` : null,
        de('tipo_servicio', 'tipo_servicio') ? `Tipo de servicio: ${String(de('tipo_servicio', 'tipo_servicio'))}` : null,
        de('orden_venta', 'orden_venta') ? `Orden de venta: ${String(de('orden_venta', 'orden_venta'))}` : null,
        clasPrio || null,
      ]),
    },
  }
}

function entradaTransicion(fila: Record<string, unknown>): Entrada {
  const v = json(fila.values)
  const at = iso(fila.performed_at)
  const campos = Object.entries(v)
    .filter(([, val]) => val != null && String(val).trim() !== '')
    .map(([k, val]) => `${etiquetaCampo(k)}: ${String(val)}`)
  return {
    at,
    msg: {
      // La `key` de React del mensaje. `ticket_transitions` tiene `id` propio, pero no se
      // selecciona: el compositor hermano tampoco lo pide y la terna instante+transición ya es
      // única — dos transiciones del mismo ticket no comparten `performed_at`.
      id: `tr-${String(fila.ticket_id)}-${String(fila.performed_at)}-${String(fila.transition_name)}`,
      author: (fila.performed_by as string) ?? 'App',
      type: 'Privado',
      time: fmtTime(at),
      content: texto([
        `${String(fila.transition_name ?? 'Transición')}: ${String(fila.from_status ?? '—')} → ${String(fila.to_status ?? '—')}`,
        fila.area ? `Área: ${String(fila.area)}` : null,
        ...campos,
      ]),
    },
  }
}

function entradaRemision(fila: Record<string, unknown>, fotos: FotoRemision[]): Entrada {
  const incluye = listaIncluye(fila.incluye)
  const resultado = json(fila.resultado)
  const subidas = resultado.fotos as { subidas?: number } | undefined
  const at = iso(fila.created_at)
  // `tipo` y no "entrada" fija, ni en el texto ni en el nombre del adjunto: hoy los dos caminos de
  // inserción lo ponen a 'entrada' y saldría igual, pero la remisión de SALIDA está en el roadmap y
  // entonces el hilo diría que el equipo ingresa el día que lo estamos devolviendo. Es la misma
  // regla que `historial.ts` dejó escrita en el título de su evento; el test de la salida existe
  // para que volver a la cadena fija no pase en verde. La columna es NOT NULL DEFAULT 'entrada'.
  const tipo = String(fila.tipo ?? 'entrada')
  const adjuntos = adjuntosRemision(resultado, tipo, String(fila.id), fotos)
  const servicio = fila.tipo_servicio ? String(fila.tipo_servicio) : 'servicio técnico'
  const apertura = tipo === 'salida' ? `El equipo sale tras ${servicio}` : `El equipo ingresa para ${servicio}`
  return {
    at,
    msg: {
      id: `rem-${String(fila.id)}`,
      author: (fila.creado_por as string) ?? 'App',
      type: 'Privado',
      time: fmtTime(at),
      content: texto([
        frase(apertura),
        // Las observaciones que escribió el técnico, TAL CUAL y sin etiqueta delante: son la prosa
        // del hilo, lo que hacía legible el comentario privado que el equipo mantenía a mano.
        fila.observaciones as string | null,
        incluye ? `Incluye: ${incluye}` : null,
        // Las que n8n dice haber subido a Drive, que no siempre son las que la app guardó: el técnico
        // puede haber salido por "Continuar sin las N fotos que faltan". Por eso la cifra sigue aquí
        // aunque las fotos vayan ya como adjuntos —cuentan cosas distintas—.
        subidas?.subidas ? `Registro fotográfico: ${subidas.subidas} ${subidas.subidas === 1 ? 'foto' : 'fotos'}` : null,
      ]),
      attachments: adjuntos.length ? adjuntos : undefined,
    },
  }
}

/** Más reciente primero, con los que no tienen fecha al final: es el orden que el panel ya usa. */
const masRecientePrimero = porFechaDesc<Entrada>((e) => e.at)

/**
 * El hilo del ticket: las conversaciones de Zoho más una entrada por etapa ocurrida en la app. Se
 * DERIVA al leer y no se registran mensajes nuevos, que es lo que hace que aparezca solo lo que ya
 * existe —las 149 remisiones migradas incluidas—.
 */
export async function getConversacionTicket(db: Queryable, ticketId: string): Promise<ConversacionTicket> {
  const zoho = await getConversations(db, ticketId)
  const deZoho: Entrada[] = zoho.map(({ row, attachments }) => ({
    at: iso((row as unknown as Record<string, unknown>).commented_time),
    msg: rowToMessage(row, attachments),
  }))

  const tr = await db.query(
    'SELECT ticket_id, transition_name, from_status, to_status, area, performed_by, performed_at, values FROM ticket_transitions WHERE ticket_id = $1',
    [ticketId],
  )
  const filasTr = tr.rows as Record<string, unknown>[]

  // `datosTicket` son una o dos consultas más y solo las usa la entrada de creación. La mayoría de
  // los tickets vienen de Zoho y NO tienen fila de creación, así que pedirlas siempre era gastarlas
  // para nada en cada apertura del panel.
  const hayCreacion = filasTr.some(esCreacion)
  const { ticket, cliente }: DatosTicket = hayCreacion
    ? await datosTicket(db, ticketId)
    : { ticket: {}, cliente: null }

  const deTransiciones = filasTr.map((f) =>
    esCreacion(f) ? entradaCreacion(f, ticket, cliente) : entradaTransicion(f),
  )

  // Solo las VIGENTES, y aquí es donde los dos paneles dejan de coincidir a propósito: `historial.ts`
  // sí trae las anuladas —es el log, y una anulación es un suceso que hay que poder auditar— mientras
  // que el hilo es el relato de lo que le pasó al equipo, y una remisión anulada es un documento que
  // un administrador retiró de en medio, a menudo una prueba. Todas las vigentes y no solo la última:
  // un ticket puede recibir dos equipos, y quedarse con la más reciente escondería el ingreso del otro.
  //
  // Sigue sin reutilizar `listRemisionesByTicket` —que filtra igual— porque aquélla hace `SELECT *` y
  // devuelve `Remision` ya mapeadas, y estas entradas se componen desde la fila cruda.
  const rem = await db.query(
    `SELECT id, tipo, tipo_servicio, incluye, observaciones, creado_por, resultado, created_at
       FROM remisiones WHERE ticket_id = $1 AND anulada_at IS NULL`,
    [ticketId],
  )
  const filasRem = rem.rows as Record<string, unknown>[]
  const fotos = await fotosPorRemision(db, filasRem.map((f) => String(f.id)))
  const deRemisiones = filasRem.map((f) => entradaRemision(f, fotos.get(String(f.id)) ?? []))

  const mensajes = [...deZoho, ...deTransiciones, ...deRemisiones].sort(masRecientePrimero).map((e) => e.msg)
  return { mensajes, sincronizarConZoho: planSyncZoho(ticketId, zoho.length > 0) }
}
