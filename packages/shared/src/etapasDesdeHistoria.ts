import type { HistorialTransition } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Las etapas por las que pasó un ticket, reconstruidas desde la historia cruda de Zoho.
 *
 * Existe porque la hoja de vida del equipo arma su línea de tiempo desde `ticket_transitions`, que
 * solo tiene lo que se hizo DESDE Desk: los cientos de tickets heredados de Zoho salían como tarjetas
 * sin una sola etapa debajo. Los datos sí estaban —en `ticket_history`, desde el barrido—, pero en
 * otra forma.
 *
 * Y en una forma que hay que recomponer: una transición del Blueprint no es un evento, es un RACIMO
 * de varios con la misma marca de tiempo. El cambio de estado lo firma el Blueprint (que no es
 * nadie), la persona viene en el `BlueprintTransitionPerformed` de al lado, y lo que se hizo está en
 * el `CommentAdded` de al lado del otro. Enseñar los eventos uno a uno sería un volcado, no una hoja
 * de vida.
 *
 * Se deriva AL LEER y no se materializa en `ticket_transitions`: esa tabla es el registro de lo que
 * hizo Desk, y la leen también `primerDerivado` y la fecha de revisión del informe. Meterle
 * transiciones de Zoho las envenenaría sin que fallara nada.
 */

/** Cuánto comentario cabe en una tarjeta que se lee de un vistazo. */
const LARGO_COMENTARIO = 300

const prop = (lista: any[], nombre: string): any =>
  (lista ?? []).find((p) => p?.propertyName === nombre)?.propertyValue

/**
 * El HTML del comentario, convertido a TEXTO.
 *
 * Con expresiones regulares y sin sanear, que aquí es lo correcto y no un atajo: la salida se pinta
 * como texto —React la escapa— así que no queda etiqueta que pueda ejecutar nada. Sanear para después
 * volver a escapar sería trabajo de más sobre el mismo resultado.
 *
 * Los correos reenviados al ticket llegan con la maqueta entera de Gmail dentro, así que primero se
 * tiran `style` y `script` con su contenido: sin eso, el texto plano empezaría con cien líneas de CSS.
 */
function aTextoPlano(html: unknown): string {
  return String(html ?? '')
    .replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    // El espacio de ancho cero que Zoho mete en los comentarios, en sus dos formas. Por su código y
    // no pegado en crudo: en crudo es invisible en el editor, y el lint lo rechaza justo por eso.
    .replace(/&#8203;/gi, '')
    .replace(new RegExp(String.fromCharCode(0x200B), 'g'), '')
    .replace(/\s+/g, ' ')
    .trim()
}

function recortar(texto: string): string {
  return texto.length <= LARGO_COMENTARIO ? texto : `${texto.slice(0, LARGO_COMENTARIO).trimEnd()}…`
}

const instante = (e: any): number => {
  const t = Date.parse(String(e?.eventTime ?? ''))
  return Number.isNaN(t) ? 0 : t
}
const idTransicion = (e: any): string | null => {
  const t = prop(e?.actorInfo, 'Transition') ?? prop(e?.eventInfo, 'Transition')
  return t?.id ? String(t.id) : null
}

/**
 * De entre los candidatos con la MISMA transición, el más cercano en el tiempo.
 *
 * Emparejar solo por id de transición no vale: un informe devuelto a corrección se vuelve a escalar,
 * así que la misma transición aparece dos veces en el mismo ticket y cada pase tiene su comentario.
 * Sin la cercanía, el segundo pase se quedaría con el comentario del primero.
 */
function masCercano(candidatos: any[], cuando: number): any | undefined {
  let mejor: any | undefined
  let distancia = Infinity
  for (const c of candidatos) {
    const d = Math.abs(instante(c) - cuando)
    if (d < distancia) { mejor = c; distancia = d }
  }
  return mejor
}

export function etapasDesdeHistoria(eventos: unknown[]): HistorialTransition[] {
  const todos = (eventos ?? []) as any[]
  const ejecuciones = todos.filter((e) => e?.eventName === 'BlueprintTransitionPerformed')
  const comentarios = todos.filter((e) => e?.eventName === 'CommentAdded')

  const etapas: HistorialTransition[] = []
  for (const e of todos) {
    if (e?.eventName !== 'TicketUpdated') continue
    // Un `TicketUpdated` puede traer cualquier campo; solo el cambio de ESTADO es una etapa. Los días
    // de entrega o las casillas de cierre son ruido de sistema en una pantalla que se lee de un
    // vistazo, y meterlos convertiría la hoja de vida en un volcado.
    const estado = prop(e.eventInfo, 'Status')
    if (!estado || typeof estado !== 'object' || !('updatedValue' in estado)) continue

    const cuando = instante(e)
    const idT = idTransicion(e)
    const mismos = (lista: any[]) => (idT ? lista.filter((x) => idTransicion(x) === idT) : [])
    const ejecucion = masCercano(mismos(ejecuciones), cuando)
    const comentario = masCercano(mismos(comentarios), cuando)

    // La persona sale de quien EJECUTÓ la transición. El actor del cambio de estado es el Blueprint, y
    // un Blueprint no es nadie: sin esta preferencia, la hoja de vida diría que todas las etapas de
    // todos los tickets las hizo « Blueprint estado del Servicio».
    const quien = ejecucion?.actor?.name ?? (e.actor?.type === 'Blueprint' ? null : e.actor?.name)
    const texto = comentario ? recortar(aTextoPlano(prop(comentario.eventInfo, 'Content'))) : ''
    const adjuntos = comentario ? prop(comentario.eventInfo, 'AttachmentNames') : null

    etapas.push({
      transitionName: (prop(e.actorInfo, 'Transition')?.name ?? '').trim() || null,
      fromStatus: (estado as any).previousValue ?? null,
      toStatus: (estado as any).updatedValue ?? null,
      // Zoho no dice de qué ÁREA es la transición: eso es una noción del Blueprint replicado en la
      // app, no un dato suyo. Se deja en null en vez de adivinarlo por el nombre.
      area: null,
      performedBy: quien ? String(quien).trim() : null,
      performedAt: e.eventTime ?? null,
      ...(texto ? { comentario: texto } : {}),
      ...(Array.isArray(adjuntos) && adjuntos.length ? { adjuntos: adjuntos.map(String) } : {}),
    })
  }
  return etapas.sort((a, b) => Date.parse(a.performedAt ?? '') - Date.parse(b.performedAt ?? ''))
}
