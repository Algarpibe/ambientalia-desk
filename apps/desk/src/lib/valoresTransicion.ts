import { CLAVE_DERIVACION, fechasDerivadas } from '@ambientalia/shared'

/**
 * Lo que una transición ya puede dar por sabido, para enseñarlo bloqueado en vez de pedirlo.
 *
 * `TransitionPanel` bloquea todo campo que venga con valor en este mapa, y lo alimenta
 * `ticket.customFields`, que refleja las COLUMNAS del ticket. Eso basta para lo que el ticket ya
 * guarda —el código de servicio, la orden de venta—, pero deja fuera un caso entero: las fechas de
 * "Ingreso a Servicio" (`fecha_creacion_ticket` y `fecha_remision_entrada`) las escribe ESA MISMA
 * transición, así que su columna está vacía justo cuando el formulario las pregunta.
 *
 * Las tres fechas derivadas se calculan con `fechasDerivadas` (`@ambientalia/shared`), la MISMA
 * fórmula que impone el servidor (`ticketService.ts:130`). Esto es prellenado, no la regla: la
 * imposición real vive en el servidor y está probada allí (regla invariable 13, punto 3) — aquí sólo
 * se copia para que el panel no arranque en blanco.
 *
 * Vive fuera del componente para poder probarlo: el repo no tiene harness de componentes React, y
 * esto es una regla de negocio —qué fecha corresponde a qué campo—, no maquetado.
 */

/** Un valor ya presente en el ticket manda sobre lo que se pueda derivar. */
const yaEsta = (v: string | null | undefined): boolean => v != null && String(v).trim() !== ''

/** Lo mínimo que hace falta de cada fuente, para que el test no tenga que construir fixtures enteras. */
interface TicketConocido {
  customFields: Record<string, string | null>
  createdAt?: string | null
  /** Instante del último «Escalado a Revisión»: de ahí sale la fecha de revisión del informe. */
  escaladoARevisionAt?: string | null
  /** A quién está derivado hoy. Llega prellenado a la etapa siguiente, pero EDITABLE (ver abajo). */
  derivado?: { id: string } | null
}
interface RemisionConocida { tipo: string; fecha: string }

export function valoresConocidos(
  ticket: TicketConocido,
  remisiones: RemisionConocida[] | null,
): Record<string, string | null> {
  const cf = ticket.customFields
  // La misma fórmula que aplica el servidor (design.md §4.3): con fuente, gana SIEMPRE lo derivado
  // (D-1); sin fuente en ninguna de las tres, se conserva lo que el ticket ya trae, para teclear.
  const derivadas = fechasDerivadas({
    createdAt: ticket.createdAt,
    remisiones,
    escaladoARevisionAt: ticket.escaladoARevisionAt,
  })

  // Las claves son las etiquetas de PROMOTED_COLUMNS, las mismas que usan los campos de la
  // transición. El test las toma del propio Blueprint para que un renombrado allí lo rompa aquí.
  return {
    ...cf,
    'Fecha creación ticket': derivadas['Fecha creación ticket']
      ?? (yaEsta(cf['Fecha creación ticket']) ? cf['Fecha creación ticket'] : null),
    'Fecha Remisión Entrada': derivadas['Fecha Remisión Entrada']
      ?? (yaEsta(cf['Fecha Remisión Entrada']) ? cf['Fecha Remisión Entrada'] : null),
    // La tercera derivada. Se pregunta al salir de «Notificado» —en «Escalado a comercial» y en
    // «Reporte por garantía»— y es, por definición, el día en que el ticket ENTRÓ ahí: el escalado a
    // revisión. Va por este canal, y no prellenada aparte, porque entrar aquí es lo que la enseña
    // bloqueada: es un dato anotado, no una opinión que se pueda contradecir a mano.
    'Fecha Revisión Informe': derivadas['Fecha Revisión Informe']
      ?? (yaEsta(cf['Fecha Revisión Informe']) ? cf['Fecha Revisión Informe'] : null),
    // A diferencia del resto, esto llega prellenado pero NO bloqueado: cada etapa puede pasarle el
    // trabajo a otra persona. Quien lo bloquea es `yaLoTraeElTicket`, y su primera línea ya deja
    // fuera todo lo que no sea `customField`.
    [CLAVE_DERIVACION]: ticket.derivado?.id ?? null,
  }
}
