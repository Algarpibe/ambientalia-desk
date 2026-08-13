import { CLAVE_DERIVACION } from '@ambientalia/shared'

/**
 * Lo que una transición ya puede dar por sabido, para enseñarlo bloqueado en vez de pedirlo.
 *
 * `TransitionPanel` bloquea todo campo que venga con valor en este mapa, y lo alimenta
 * `ticket.customFields`, que refleja las COLUMNAS del ticket. Eso basta para lo que el ticket ya
 * guarda —el código de servicio, la orden de venta—, pero deja fuera un caso entero: las fechas de
 * "Ingreso a Servicio" (`fecha_creacion_ticket` y `fecha_remision_entrada`) las escribe ESA MISMA
 * transición, así que su columna está vacía justo cuando el formulario las pregunta.
 *
 * Y son dos datos que ya ocurrieron: el ticket tiene su fecha de creación y la remisión de entrada
 * la suya. Aquí se rellenan desde su fuente real.
 *
 * Vive fuera del componente para poder probarlo: el repo no tiene harness de componentes React, y
 * esto es una regla de negocio —qué fecha corresponde a qué campo—, no maquetado.
 */

/** Un valor ya presente en el ticket manda sobre lo que se pueda derivar. */
const yaEsta = (v: string | null | undefined): boolean => v != null && String(v).trim() !== ''

/**
 * El día de un instante ISO, en la zona del NAVEGADOR, que es la del usuario.
 *
 * Con getters locales y NO con `slice(0, 10)` sobre el ISO: `created_time` es un `timestamptz` en
 * UTC, así que un ticket creado a las 20:00 en Colombia (UTC-5) se guarda como el día siguiente a
 * la 01:00Z, y recortar la cadena daría un día de más. Es la misma trampa que las fechas de las
 * remisiones, que ya costó un bug.
 */
function diaLocal(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const dosCifras = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`
}

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
  // La lista llega vigente y con la más reciente primero (`listRemisionesByTicket`), así que ésta es
  // la última entrada en vigor. `fecha` es el día del SERVICIO y ya viene como `YYYY-MM-DD`.
  const entrada = (remisiones ?? []).find((r) => r.tipo === 'entrada')

  // Las claves son las etiquetas de PROMOTED_COLUMNS, las mismas que usan los campos de la
  // transición. El test las toma del propio Blueprint para que un renombrado allí lo rompa aquí.
  return {
    ...cf,
    'Fecha creación ticket': yaEsta(cf['Fecha creación ticket'])
      ? cf['Fecha creación ticket']
      : diaLocal(ticket.createdAt),
    'Fecha Remisión Entrada': yaEsta(cf['Fecha Remisión Entrada'])
      ? cf['Fecha Remisión Entrada']
      : (entrada?.fecha ?? null),
    // La tercera derivada. Se pregunta al salir de «Notificado» —en «Escalado a comercial» y en
    // «Reporte por garantía»— y es, por definición, el día en que el ticket ENTRÓ ahí: el escalado a
    // revisión. Va por este canal, y no prellenada aparte, porque entrar aquí es lo que la enseña
    // bloqueada: es un dato anotado, no una opinión que se pueda contradecir a mano.
    'Fecha Revisión Informe': yaEsta(cf['Fecha Revisión Informe'])
      ? cf['Fecha Revisión Informe']
      : diaLocal(ticket.escaladoARevisionAt),
    // A diferencia del resto, esto llega prellenado pero NO bloqueado: cada etapa puede pasarle el
    // trabajo a otra persona. Quien lo bloquea es `yaLoTraeElTicket`, y su primera línea ya deja
    // fuera todo lo que no sea `customField`.
    [CLAVE_DERIVACION]: ticket.derivado?.id ?? null,
  }
}
