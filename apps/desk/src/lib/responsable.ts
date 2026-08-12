import type { Ticket } from '@ambientalia/shared'

export interface ResponsableVisible {
  nombre: string | null
  iniciales: string | null
  /** De dónde salió. Lo usa la interfaz para etiquetar sin mentir sobre la procedencia del dato. */
  origen: 'derivacion' | 'zoho' | 'ninguno'
}

/**
 * Qué persona enseñar como responsable de un ticket donde solo cabe una.
 *
 * Conviven dos conceptos: la **derivación**, que es de esta plataforma y dice a quién le toca el
 * trabajo ahora, y el **propietario en Zoho**, heredado del sync y vacío en todo ticket nacido aquí.
 * Gana la derivación: el propietario de Zoho es lo viejo, y anteponerlo escondería lo accionable.
 *
 * ⚠️ `rowToTicket` rellena el propietario con la CADENA «Sin asignar» cuando no hay ninguno, así que
 * llega como si fuera un nombre. Sin filtrarla, la interfaz pintaría un avatar con las iniciales de
 * una persona que no existe.
 *
 * Vive aquí y no en cada componente porque la usan la tarjeta, la lista y la tabla, y tres copias de
 * una regla de precedencia divergen a la primera corrección.
 */
export function responsableVisible(
  t: Pick<Ticket, 'derivado' | 'assignee'>,
): ResponsableVisible {
  if (t.derivado) {
    return { nombre: t.derivado.nombre, iniciales: t.derivado.initials, origen: 'derivacion' }
  }
  const zoho = t.assignee?.name?.trim()
  if (zoho && zoho !== 'Sin asignar') {
    return { nombre: zoho, iniciales: t.assignee?.initials ?? null, origen: 'zoho' }
  }
  return { nombre: null, iniciales: null, origen: 'ninguno' }
}
